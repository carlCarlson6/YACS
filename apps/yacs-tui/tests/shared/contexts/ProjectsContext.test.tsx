import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Project } from "@yacs/schemas";
import { ApiProvider } from "../../../src/shared/contexts/ApiContext";
import { StatusProvider, useStatus } from "../../../src/shared/contexts/StatusContext";
import { ProjectsProvider, useProjects } from "../../../src/shared/contexts/ProjectsContext";

function createWrapper(fetchImpl: typeof fetch) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ApiProvider url="http://api.test">
        <StatusProvider>
          <ProjectsProvider autoLoad={false} fetcher={fetchImpl}>
            {children}
          </ProjectsProvider>
        </StatusProvider>
      </ApiProvider>
    );
  };
}

describe("ProjectsProvider", () => {
  const projectSample: Project = {
    id: "p1",
    name: "Demo",
    status: "running",
    currentDeploymentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("fetches and stores projects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [projectSample],
    } satisfies Response);

    const { result } = renderHook(() => {
      const projectsCtx = useProjects();
      const statusCtx = useStatus();
      return { projectsCtx, statusCtx };
    }, { wrapper: createWrapper(fetchMock as unknown as typeof fetch) });

    await act(async () => {
      await result.current.projectsCtx.fetchProjects();
    });

    expect(result.current.projectsCtx.projects).toEqual([projectSample]);
    expect(result.current.statusCtx.status).toBe("> projects loaded");
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/projects");
  });

  it("reports errors when fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => {
      const projectsCtx = useProjects();
      const statusCtx = useStatus();
      return { projectsCtx, statusCtx };
    }, { wrapper: createWrapper(fetchMock as unknown as typeof fetch) });

    await act(async () => {
      await result.current.projectsCtx.fetchProjects();
    });

    expect(result.current.statusCtx.status).toBe("! error fetching projects");
  });
});
