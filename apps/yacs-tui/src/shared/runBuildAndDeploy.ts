import { useCallback } from "react";
import * as path from "node:path";
import { useApiUrl } from "./contexts/ApiContext";
import { useStatus } from "./contexts/StatusContext";
import { useFatalError } from "./contexts/FatalErrorContext";

export type DeploymentStep =
  | "install"
  | "lint"
  | "test"
  | "build"
  | "publish"
  | "success"
  | "error";

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
  const { setStatus, setBusy } = useStatus();
  const { reportError } = useFatalError();
  const delayBetweenSteps = 120;

  return useCallback(
    async (
      projectId: string,
      projectDir: string,
      onProgress?: (step: DeploymentStep) => void
    ): Promise<boolean> => {
      const { exec } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const fs = await import("node:fs");
      const execAsync = promisify(exec);
      const packageJsonPath = path.join(projectDir, "package.json");

      const reportStep = (step: DeploymentStep) => onProgress?.(step);
      const wait = () =>
        new Promise<void>((resolve) => setTimeout(resolve, delayBetweenSteps));

      const runStep = async (label: string, cmd: string): Promise<string> => {
        try {
          const { stdout, stderr } = await execAsync(cmd, {
            cwd: projectDir,
            maxBuffer: 20 * 1024 * 1024,
          });
          return [stdout ?? "", stderr ?? ""].filter(Boolean).join("\n");
        } catch (err) {
          const e = err as { stdout?: string; stderr?: string; message?: string };
          const detail = [e.stderr, e.stdout]
            .filter(Boolean)
            .map((str) => str!.trim())
            .join("\n")
            .slice(-2000)
            .trim();
          const message = detail.length > 0 ? detail : e.message ?? "unknown error";
          throw new Error(`${label} failed: ${cmd}\n${message}`);
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

        setBusy(true);

        setStatus(`> install [${projectDir}]`);
        reportStep("install");
        await runStep("install", "npm install");
        await wait();

        if (pkg.scripts?.lint) {
          setStatus(`> lint [${projectDir}]`);
          reportStep("lint");
          await runStep("lint", "npm run lint");
          await wait();
        }

        if (pkg.scripts?.test) {
          setStatus(`> test [${projectDir}]`);
          reportStep("test");
          await runStep("test", "npm run test");
          await wait();
        }

        setStatus(`> build [${projectDir}]`);
        reportStep("build");
        const buildOutput = await runStep("build", "npm run build");
        await wait();

        setStatus(`> publish deployment [${projectDir}]`);
        reportStep("publish");
        const res = await fetch(`${apiUrl}/projects/${projectId}/deployments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, buildOutput }),
        });
        if (!res.ok) {
          throw new Error(`API rejected deployment (HTTP ${res.status})`);
        }

        setStatus(`> deployment published [${projectDir}]`);
        reportStep("success");
        return true;
      } catch (err) {
        reportStep("error");
        reportError(err);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [apiUrl, setStatus, setBusy, reportError]
  );
}
