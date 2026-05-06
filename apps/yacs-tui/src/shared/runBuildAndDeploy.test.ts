import { describe, expect, it, vi } from "vitest";
import { createRunBuildAndDeploy, type BuildAndDeployDeps } from "./runBuildAndDeploy";

function createDeps(overrides: Partial<BuildAndDeployDeps> = {}): BuildAndDeployDeps {
  const fsMock = {
    existsSync: vi.fn().mockReturnValue(true),
    statSync: vi.fn().mockReturnValue({ isDirectory: () => true }),
    readFileSync: vi.fn().mockReturnValue(
      JSON.stringify({ scripts: { build: "build", lint: "lint", test: "test" } })
    ),
  } satisfies BuildAndDeployDeps["fs"];

  return {
    execAsync: vi.fn().mockResolvedValue({ stdout: "ok", stderr: "" }),
    fetchImpl: vi.fn().mockResolvedValue({ ok: true }) as typeof fetch,
    wait: vi.fn().mockResolvedValue(undefined),
    fs: fsMock,
    ...overrides,
  };
}

describe("createRunBuildAndDeploy", () => {
const createBaseProps = () => ({
  apiUrl: "http://api.test",
  setStatus: vi.fn(),
  setBusy: vi.fn(),
  reportError: vi.fn(),
});

  it("runs all steps and publishes deployment", async () => {
    const deps = createDeps();
    const baseProps = createBaseProps();
    const runner = createRunBuildAndDeploy({ ...baseProps, deps });
    const progress = vi.fn();

    const result = await runner("p1", "/tmp/project", progress);

    expect(result).toBe(true);
    expect(deps.execAsync).toHaveBeenCalledWith("npm install", expect.objectContaining({ cwd: "/tmp/project" }));
    expect(deps.execAsync).toHaveBeenCalledWith("npm run lint", expect.any(Object));
    expect(deps.execAsync).toHaveBeenCalledWith("npm run test", expect.any(Object));
    expect(deps.execAsync).toHaveBeenCalledWith("npm run build", expect.any(Object));
    expect(deps.fetchImpl).toHaveBeenCalledWith(
      "http://api.test/projects/p1/deployments",
      expect.objectContaining({ body: JSON.stringify({ projectId: "p1", buildOutput: "ok" }) })
    );
    expect(progress).toHaveBeenLastCalledWith("success");
    expect(baseProps.reportError).not.toHaveBeenCalled();
  });

  it("reports errors from failed steps", async () => {
    const failingExec = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "install", stderr: "" })
      .mockRejectedValueOnce({ stdout: "lint failed", stderr: "" });
    const deps = createDeps({ execAsync: failingExec });
    const baseProps = createBaseProps();
    const runner = createRunBuildAndDeploy({ ...baseProps, deps });
    const progress = vi.fn();

    const result = await runner("p1", "/tmp/project", progress);

    expect(result).toBe(false);
    expect(progress).toHaveBeenLastCalledWith("error");
    expect(baseProps.reportError).toHaveBeenCalled();
    expect(deps.fetchImpl).not.toHaveBeenCalled();
  });

  it("fails fast when build script missing", async () => {
    const deps = createDeps({
      fs: {
        existsSync: vi.fn().mockReturnValue(true),
        statSync: vi.fn().mockReturnValue({ isDirectory: () => true }),
        readFileSync: vi.fn().mockReturnValue(JSON.stringify({ scripts: {} })),
      },
    });
    const baseProps = createBaseProps();
    const runner = createRunBuildAndDeploy({ ...baseProps, deps });

    const result = await runner("p1", "/tmp/project");

    expect(result).toBe(false);
    expect(deps.execAsync).not.toHaveBeenCalled();
    expect(baseProps.reportError).toHaveBeenCalled();
  });
});
