import { useCallback } from "react";
import * as path from "node:path";
import { useApiUrl } from "./contexts/ApiContext";
import { useStatus } from "./contexts/StatusContext";
import { useFatalError } from "./contexts/FatalErrorContext";

/**
 * Returns a function that runs lint -> test -> build inside `projectDir`,
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
      setStatus(`> [${projectDir}] running lint -> test -> build...`);
      const { execSync } = await import("node:child_process");
      const fs = await import("node:fs");

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
        if (!fs.existsSync(path.join(projectDir, "package.json"))) {
          throw new Error(`no package.json in: ${projectDir}`);
        }
        runStep("lint", "npm run lint");
        runStep("test", "npm run test");
        const buildOutput = runStep("build", "npm run build");

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
