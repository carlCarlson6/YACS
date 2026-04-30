import { useKeyboard } from "@opentui/react";
import { T } from "../../shared/theme";
import { fmtDate, pad } from "../../shared/format";
import { useView } from "../../shared/contexts/ViewContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useFatalError } from "../../shared/contexts/FatalErrorContext";
import { useDeleteProject } from "../delete-project/useDeleteProject";

export function ListProjectsScreen() {
  const { projects, fetchProjects } = useProjects();
  const { setStatus } = useStatus();
  const { view, setView, selectedProject, setSelectedProject } = useView();
  const { confirm } = useConfirm();
  const { fatalError } = useFatalError();
  const { requestDelete } = useDeleteProject();

  useKeyboard((key) => {
    if (view !== "projects" || confirm || fatalError) return;
    if (key.name === "down") setSelectedProject((p) => Math.min(p + 1, projects.length - 1));
    if (key.name === "up") setSelectedProject((p) => Math.max(p - 1, 0));
    if (key.name === "return" && projects[selectedProject]) {
      setView("detail");
    }
    if (key.name === "d") setView("create");
    if (key.name === "k" && projects[selectedProject]) requestDelete(projects[selectedProject]);
    if (key.name === "r") {
      setStatus("> refreshing projects...");
      fetchProjects();
    }
  });

  return (
    <box
      title={`projects // total: ${projects.length}`}
      titleAlignment="left"
      style={{
        flexDirection: "column",
        gap: 0,
        border: true,
        borderColor: T.borderDim,
        padding: 1,
      }}
    >
      <text fg={T.muted}>
        {`${pad("", 2)}${pad("NAME", 28)}${pad("STATUS", 10)}${pad("UPDATED", 21)}`}
      </text>
      <text fg={T.muted}>{"─".repeat(2 + 28 + 10 + 21)}</text>
      {projects.map((p, i) => {
        const sel = i === selectedProject;
        const fg = sel ? T.highlight : p.status === "running" ? T.primary : T.danger;
        const updated = (p as { updatedAt?: string }).updatedAt
          ? fmtDate((p as { updatedAt: string }).updatedAt)
          : "";
        return (
          <text key={p.id} fg={fg}>
            {(sel ? "> " : "  ") + pad(p.name, 28) + pad(`[${p.status}]`, 10) + pad(updated, 21)}
          </text>
        );
      })}
      <box style={{ marginTop: 1 }}>
        <text fg={T.textDim}>
          [Enter] open · [D] new · [K] delete · [R] refresh · [Esc] quit
        </text>
      </box>
    </box>
  );
}
