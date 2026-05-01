import { useEffect, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { T } from "../../shared/theme";
import { useApiUrl } from "../../shared/contexts/ApiContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useView } from "../../shared/contexts/ViewContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useFatalError } from "../../shared/contexts/FatalErrorContext";

export function UpdateProjectScreen() {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const { view, setView, selectedProject } = useView();
  const { projects, fetchProjects } = useProjects();
  const { confirm, openConfirm } = useConfirm();
  const { fatalError } = useFatalError();

  const project = projects[selectedProject];
  const [name, setName] = useState("");
  const [status, setStatusValue] = useState<"running" | "stopped">("running");

  // Sync local state with current project when entering this screen
  useEffect(() => {
    if (view === "update" && project) {
      setName(project.name);
      setStatusValue(project.status);
    }
  }, [view, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async () => {
    if (!project) return;
    try {
      const res = await fetch(`${apiUrl}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status }),
      });
      if (res.ok) {
        setStatus("> project updated");
        await fetchProjects();
        setView("detail");
      } else {
        setStatus("! update failed");
      }
    } catch {
      setStatus("! update error");
    }
  };

  const submit = () => {
    if (!project) return;
    const willStop = project.status === "running" && status === "stopped";
    if (willStop) {
      openConfirm({
        title: "// stop project //",
        message: `Stop project "${project.name}"?`,
        detail: "The project will be marked as offline.",
        danger: true,
        run: persist,
      });
    } else {
      persist();
    }
  };

  useKeyboard((key) => {
    if (view !== "update" || confirm || fatalError) return;
    if (key.ctrl && key.name === "b") {
      setView("detail");
      setStatus("> cancelled");
      return;
    }
    if (key.name === "return") submit();
    if (key.name === "s") {
      setStatusValue("running");
      setStatus("> status: running (press Enter to save)");
    }
    if (key.name === "x") {
      setStatusValue("stopped");
      setStatus("> status: stopped (press Enter to save)");
    }
  });

  if (!project) return null;

  return (
    <box
      title={`// update :: ${project.name} //`}
      titleAlignment="left"
      style={{
        flexDirection: "column",
        gap: 1,
        border: true,
        borderColor: T.borderBright,
        padding: 1,
      }}
    >
      <box style={{ flexDirection: "row", gap: 1 }}>
        <box style={{ marginTop: 1 }}>
          <text fg={T.primary}>name &gt;</text>
        </box>
        <box style={{ border: true, borderColor: T.borderDim, width: 36, height: 3 }}>
          <input value={name} onInput={setName} focused />
        </box>
      </box>
      <text fg={T.primary}>status &gt;</text>
      <box style={{ flexDirection: "row", gap: 2 }}>
        <box
          style={{
            border: true,
            borderColor: status === "running" ? T.live : T.borderDim,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text fg={status === "running" ? T.live : T.muted}>
            {status === "running" ? "▶ START [S]" : "  start [S]"}
          </text>
        </box>
        <box
          style={{
            border: true,
            borderColor: status === "stopped" ? T.danger : T.borderDim,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          <text fg={status === "stopped" ? T.danger : T.muted}>
            {status === "stopped" ? "■ STOP  [X]" : "  stop  [X]"}
          </text>
        </box>
      </box>
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={T.muted}>current:</text>
        <text fg={status === "running" ? T.primary : T.danger}>{status}</text>
      </box>
      <text fg={T.textDim}>
        [S] start · [X] stop · [Enter] save changes · [Ctrl+B] cancel · [Esc] quit
      </text>
    </box>
  );
}
