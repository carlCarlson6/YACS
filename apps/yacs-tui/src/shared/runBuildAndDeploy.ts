import { useCallback } from "react";
import * as path from "node:path";
import { useApiUrl } from "./contexts/ApiContext";
import { useStatus } from "./contexts/StatusContext";
import { useFatalError } from "./contexts/FatalErrorContext";

/**
 * Returns a function that runs npm install -> optional lint/test -> build inside `projectDir`,
 * captures all child output (so it never bleeds into the TUI), and posts the
 * resulting build artifact to `POST /api/projects/:id/deployments`.
 *
 * Any failure is funneled to the FatalError overlay and the function resolves
 * to `false` so callers can branch on success.
 */
export function useRunBuildAndDeploy() {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const { reportError } = useFatalError();

  return useCallback(
    async (projectId: string, projectDir: string): Promise<boolean> => {
      const { execSync } = await import("node:child_process");
      const fs = await import("node:fs");
      const packageJsonPath = path.join(projectDir, "package.json");

      const runStep = (label: string, cmd: string): string => {
        try {
          return execSync(cmd, {
            cwd: projectDir,
            stdio: ["ignore", "pipe", "pipe"],
          }).toString();
        } catch (err) {
          const e = err as { stdout?: Buffer; stderr?: Buffer; message?: string };
          const out = (e.stdout?.toString() ?? "").trim();
          const errOut = (e.stderr?.toString() ?? "").trim();
          const detail = [errOut, out].filter(Boolean).join("\n").slice(-2000);
          throw new Error(
            `${label} failed: ${cmd}\n${detail || e.message || "unknown error"}`
          );
        }
      };

      try {
        if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
          throw new Error(`project path is not a directory: ${projectDir}`);
        }
        if (!fs.existsSync(packageJsonPath)) {
          throw new Error(`no package.json in: ${projectDir}`);
        }
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
          scripts?: Record<string, string>;
        };
        if (!pkg.scripts?.build) {
          throw new Error(`missing required build script in ${packageJsonPath}`);
        }
        setStatus(`> [${projectDir}] npm install`);
        runStep("install", "npm install");
        if (pkg.scripts?.lint) {
          setStatus(`> [${projectDir}] npm run lint`);
          runStep("lint", "npm run lint");
        }
        if (pkg.scripts?.test) {
          setStatus(`> [${projectDir}] npm run test`);
          runStep("test", "npm run test");
        }
        setStatus(`> [${projectDir}] npm run build`);
        const buildOutput = runStep("build", "npm run build");

        setStatus(`> [${projectDir}] publishing deployment`);
        const res = await fetch(`${apiUrl}/projects/${projectId}/deployments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, buildOutput }),
        });
        if (!res.ok) {
          throw new Error(`API rejected deployment (HTTP ${res.status})`);
        }
        return true;
      } catch (err) {
        reportError(err);
        return false;
      }
    },
    [apiUrl, setStatus, reportError]
  );
}
