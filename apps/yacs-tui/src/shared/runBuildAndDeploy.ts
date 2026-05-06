import { useCallback, useRef } from "react";
import * as path from "node:path";
import type { ExecOptions } from "node:child_process";
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
export type RunBuildAndDeploy = (
  projectId: string,
  projectDir: string,
  onProgress?: (step: DeploymentStep) => void
) => Promise<boolean>;

type FsModule = Pick<typeof import("node:fs"), "existsSync" | "statSync" | "readFileSync">;

export type BuildAndDeployDeps = {
  execAsync: (cmd: string, options: ExecOptions & { cwd: string; maxBuffer: number }) => Promise<{
    stdout?: string | Buffer;
    stderr?: string | Buffer;
  }>;
  fs: FsModule;
  fetchImpl: typeof fetch;
  wait: () => Promise<void>;
};

export function createRunBuildAndDeploy({
  apiUrl,
  setStatus,
  setBusy,
  reportError,
  deps,
}: {
  apiUrl: string;
  setStatus: (status: string) => void;
  setBusy: (busy: boolean) => void;
  reportError: (err: unknown) => void;
  deps: BuildAndDeployDeps;
}): RunBuildAndDeploy {
  return async (projectId, projectDir, onProgress) => {
    const packageJsonPath = path.join(projectDir, "package.json");
    const { execAsync, fs, fetchImpl, wait } = deps;

    const reportStep = (step: DeploymentStep) => onProgress?.(step);

    const runStep = async (label: string, cmd: string): Promise<string> => {
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: projectDir,
          maxBuffer: 20 * 1024 * 1024,
        });
        return [stdout ?? "", stderr ?? ""].filter(Boolean).join("\n");
      } catch (err) {
        const e = err as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string };
        const detail = [e.stderr, e.stdout]
          .filter(Boolean)
          .map((str) => str!.toString().trim())
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
      const res = await fetchImpl(`${apiUrl}/projects/${projectId}/deployments`, {
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
  };
}

async function loadDefaultDeps(delayBetweenSteps: number): Promise<BuildAndDeployDeps> {
  const [{ exec }, { promisify }, fs] = await Promise.all([
    import("node:child_process"),
    import("node:util"),
    import("node:fs"),
  ]);
  const execAsync = promisify(exec);
  return {
    execAsync,
    fs: {
      existsSync: fs.existsSync,
      statSync: fs.statSync,
      readFileSync: fs.readFileSync,
    },
    fetchImpl: fetch,
    wait: () => new Promise<void>((resolve) => setTimeout(resolve, delayBetweenSteps)),
  };
}

export function useRunBuildAndDeploy(delayBetweenSteps = 120): RunBuildAndDeploy {
  const apiUrl = useApiUrl();
  const { setStatus, setBusy } = useStatus();
  const { reportError } = useFatalError();
  const depsPromiseRef = useRef<Promise<BuildAndDeployDeps> | null>(null);

  return useCallback(
    async (projectId, projectDir, onProgress) => {
      const depsPromise = depsPromiseRef.current ??= loadDefaultDeps(delayBetweenSteps);
      const deps = await depsPromise;
      const runner = createRunBuildAndDeploy({ apiUrl, setStatus, setBusy, reportError, deps });
      return runner(projectId, projectDir, onProgress);
    },
    [apiUrl, setStatus, setBusy, reportError, delayBetweenSteps]
  );
}
