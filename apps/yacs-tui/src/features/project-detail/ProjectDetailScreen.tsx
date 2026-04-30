import { useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { T } from "../../shared/theme";
import { fmtDate, pad } from "../../shared/format";
import { useView } from "../../shared/contexts/ViewContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useFatalError } from "../../shared/contexts/FatalErrorContext";
import { useDeployments } from "./useDeployments";
import { useActivateDeployment } from "../activate-deployment/useActivateDeployment";
import { useDeleteProject } from "../delete-project/useDeleteProject";

const COL_LIVE = 4;
const COL_ID = 12;
const COL_DATE = 21;
const COL_URL = 38;
const TABLE_HEADER =
  pad("LIVE", COL_LIVE) + pad("ID", COL_ID) + pad("CREATED", COL_DATE) + pad("URL", COL_URL);
const TABLE_SEP = "─".repeat(COL_LIVE + COL_ID + COL_DATE + COL_URL);

export function ProjectDetailScreen() {
  const { projects } = useProjects();
  const { setStatus } = useStatus();
  const {
    view,
    setView,
    selectedProject,
    selectedDeployment,
    setSelectedDeployment,
  } = useView();
  const { confirm } = useConfirm();
  const { fatalError } = useFatalError();
  const { deployments, fetchDeployments } = useDeployments();
  const { requestActivate } = useActivateDeployment(fetchDeployments);
  const { requestDelete } = useDeleteProject();

  const project = projects[selectedProject];

  // Re-fetch deployments whenever this screen becomes active for the current project
  useEffect(() => {
    if (view === "detail" && project) {
      fetchDeployments(project.id);
    }
  }, [view, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboard((key) => {
    if (view !== "detail" || confirm || fatalError || !project) return;
    if (key.name === "down") setSelectedDeployment((d) => Math.min(d + 1, deployments.length - 1));
    if (key.name === "up") setSelectedDeployment((d) => Math.max(d - 1, 0));
    if (key.name === "n") {
      setView("deploy");
      setStatus("> enter relative path to project code");
    }
    if (key.name === "return" && deployments[selectedDeployment]) {
      requestActivate(project, deployments[selectedDeployment], deployments);
    }
    if (key.name === "u") setView("update");
    if (key.name === "k") requestDelete(project);
    if (key.name === "r") {
      setStatus("> refreshing...");
      fetchDeployments(project.id);
    }
    if (key.name === "backspace") {
      setView("projects");
      setStatus("");
    }
  });

  if (!project) return null;

  const liveDeployment = deployments.find((d) => d.id === project.currentDeploymentId);

  return (
    <box style={{ flexDirection: "column", gap: 1 }}>
      <box
        title={`project :: ${project.name}`}
        titleAlignment="left"
        style={{ flexDirection: "column", border: true, borderColor: T.borderBright, padding: 1 }}
      >
        <text fg={T.primaryDim}>id</text>
        <text fg={T.textBright}>  {project.id}</text>
        <text fg={T.primaryDim}>status</text>
        <text fg={project.status === "running" ? T.primary : T.danger}>
          {project.status === "running" ? "  ● RUNNING" : "  ○ STOPPED"}
        </text>
        <text fg={T.primaryDim}>live</text>
        {liveDeployment ? (
          <text fg={T.live}>
            {`  ● ${liveDeployment.id.slice(0, 8)}  (${fmtDate(liveDeployment.createdAt)})`}
          </text>
        ) : (
          <text fg={T.danger}>  ○ no live deployment</text>
        )}
      </box>

      <box
        title={`deployments [${deployments.length}]`}
        titleAlignment="left"
        style={{ flexDirection: "column", border: true, borderColor: T.borderDim, padding: 1 }}
      >
        <text fg={T.muted}>{TABLE_HEADER}</text>
        <text fg={T.muted}>{TABLE_SEP}</text>
        {deployments.length === 0 && (
          <text fg={T.textDim}>  (no deployments yet — press [N] to push one)</text>
        )}
        {deployments.map((d, i) => {
          const isLive = d.id === project.currentDeploymentId;
          const sel = i === selectedDeployment;
          const fg = isLive ? T.live : sel ? T.highlight : T.textBright;
          const liveCell = isLive ? "● " : "  ";
          const cursor = sel ? "> " : "  ";
          const url = d.url ?? "";
          const row =
            pad(cursor + liveCell, COL_LIVE) +
            pad(d.id.slice(0, 10), COL_ID) +
            pad(fmtDate(d.createdAt), COL_DATE) +
            pad(url, COL_URL);
          return (
            <text key={d.id} fg={fg}>
              {row}
            </text>
          );
        })}
      </box>

      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={T.textDim}>
          [Enter] set live · [N] new deploy · [U] update · [K] delete · [R] refresh · [Backspace] back · [Esc] quit
        </text>
      </box>
    </box>
  );
}
