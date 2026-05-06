import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@yacs/schemas";
import { ListProjectsScreen } from "../../../src/features/list-projects/ListProjectsScreen";
import { ProjectsContext } from "../../../src/shared/contexts/ProjectsContext";
import { ViewProvider } from "../../../src/shared/contexts/ViewContext";
import { StatusProvider, useStatus } from "../../../src/shared/contexts/StatusContext";
import { ConfirmProvider } from "../../../src/shared/contexts/ConfirmContext";
import { FatalErrorProvider } from "../../../src/shared/contexts/FatalErrorContext";
import { ApiProvider } from "../../../src/shared/contexts/ApiContext";
import { emitKeyboard } from "../../../src/test-utils/opentuiKeyboard";

const projects: Project[] = [
  { id: "1", name: "Alpha", status: "running", createdAt: new Date().toISOString() } as Project,
  { id: "2", name: "Beta", status: "failed", createdAt: new Date().toISOString() } as Project,
];

function StatusSpy() {
  const { status } = useStatus();
  return <div data-testid="status-spy">{status}</div>;
}

function renderList(fetchProjects = vi.fn()) {
  return render(
    <ApiProvider url="http://api.test">
      <FatalErrorProvider>
        <ConfirmProvider>
          <StatusProvider>
            <ViewProvider>
              <ProjectsContext.Provider value={{ projects, fetchProjects }}>
                <>
                  <ListProjectsScreen />
                  <StatusSpy />
                </>
              </ProjectsContext.Provider>
            </ViewProvider>
          </StatusProvider>
        </ConfirmProvider>
      </FatalErrorProvider>
    </ApiProvider>
  );
}

describe("ListProjectsScreen", () => {
  it("moves selection with arrow keys", async () => {
    renderList();
    expect(screen.getByText((content) => content.startsWith("> Alpha"))).toBeDefined();

    await act(async () => {
      emitKeyboard("down");
    });

    expect(screen.getByText((content) => content.startsWith("> Beta"))).toBeDefined();
  });

  it("refreshes projects when pressing R", async () => {
    const fetchProjects = vi.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderList(fetchProjects);

    await act(async () => {
      emitKeyboard("r");
    });

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled());
    expect(getByTestId("status-spy").textContent).toBe("> refreshing projects...");
  });
});
