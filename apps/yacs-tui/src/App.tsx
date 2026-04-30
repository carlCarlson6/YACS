import { useRenderer, useKeyboard } from "@opentui/react";
import { useState, useCallback } from "react";
import { useProjects } from "./projects";

type Deployment = {
  id: string
  projectId: string
  createdAt: string
  url?: string
}

const PROJECT_DIR = "/Users/carlosad/DEV/yet-another-cloud-service/vite-test-project";

// Matrix / cyberpunk theme palette
const T = {
  bg: "#000000",
  panelBg: "#031a05",
  borderDim: "#005C2A",
  borderBright: "#00FF41",
  primary: "#00FF41",
  primaryDim: "#008F11",
  accent: "#00FFFF",
  highlight: "#FCEE0A",
  danger: "#FF003C",
  live: "#39FF14",
  muted: "#3F7A3F",
  textBright: "#C8FFD0",
  textDim: "#5C8C5C",
};

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 19);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function App({ API_URL }: { API_URL: string }) {
  const [status, setStatus] = useState("");
  const { projects, fetchProjects } = useProjects(API_URL, setStatus);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [selectedDeployment, setSelectedDeployment] = useState<number>(0);
  const [view, setView] = useState<"projects" | "detail" | "create" | "update">("projects");
  const [updateName, setUpdateName] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"running" | "stopped">("running");
  const [newProjectName, setNewProjectName] = useState("");
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    detail?: string;
    danger?: boolean;
    run: () => Promise<void> | void;
  } | null>(null);
  const renderer = useRenderer();

  const fetchDeployments = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/deployments`);
      const data = await res.json();
      setDeployments(data);
      setSelectedDeployment(0);
      setStatus("> deployments loaded");
    } catch {
      setStatus("! error fetching deployments");
    }
  }, [API_URL]);

  const runBuildAndDeploy = useCallback(async (projectId: string): Promise<boolean> => {
    setStatus("> running lint -> test -> build...");
    try {
      const { execSync } = await import("child_process");
      execSync("npm run lint", { cwd: PROJECT_DIR, stdio: "inherit" });
      execSync("npm run test", { cwd: PROJECT_DIR, stdio: "inherit" });
      const buildOutput = execSync("npm run build", { cwd: PROJECT_DIR }).toString();
      const res = await fetch(`${API_URL}/projects/${projectId}/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, buildOutput }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [API_URL]);

  const handleCreateProject = useCallback(async () => {
    const name = newProjectName.trim();
    if (!name) {
      setStatus("! project name required");
      return;
    }
    setStatus(`> creating project "${name}"...`);
    try {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setStatus("! failed to create project");
        return;
      }
      const project = await res.json();
      setStatus(`> project created. deploying...`);
      const deployed = await runBuildAndDeploy(project.id);
      setStatus(deployed
        ? `> project "${name}" online`
        : `! project "${name}" created but deployment failed`);
      setNewProjectName("");
      fetchProjects();
      setView("projects");
    } catch {
      setStatus("! create project error");
    }
  }, [API_URL, newProjectName, runBuildAndDeploy, fetchProjects]);

  const handleAddDeployment = useCallback(async () => {
    const project = projects[selectedProject];
    if (!project) return;
    const ok = await runBuildAndDeploy(project.id);
    if (ok) {
      setStatus(`> deployment pushed for ${project.name}`);
      await fetchProjects();
      fetchDeployments(project.id);
    } else {
      setStatus("! deployment failed");
    }
  }, [projects, selectedProject, runBuildAndDeploy, fetchProjects, fetchDeployments]);

  const activateDeployment = useCallback(async () => {
    const deployment = deployments[selectedDeployment];
    const project = projects[selectedProject];
    if (!deployment || !project) return;
    try {
      const res = await fetch(`${API_URL}/deployments/${deployment.id}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus(`> deployment ${deployment.id.slice(0, 8)} promoted to LIVE`);
        await fetchProjects();
        await fetchDeployments(project.id);
      } else {
        setStatus("! activate failed");
      }
    } catch {
      setStatus("! activate error");
    }
  }, [API_URL, deployments, selectedDeployment, projects, selectedProject, fetchProjects, fetchDeployments]);

  const handleActivate = useCallback(() => {
    const deployment = deployments[selectedDeployment];
    const project = projects[selectedProject];
    if (!deployment || !project) return;
    if (project.currentDeploymentId === deployment.id) {
      setStatus("> deployment already LIVE");
      return;
    }
    const currentLive = deployments.find(d => d.id === project.currentDeploymentId);
    setConfirm({
      title: "// promote deployment //",
      message: `Set deployment ${deployment.id.slice(0, 8)} as LIVE for "${project.name}"?`,
      detail: currentLive
        ? `Will replace current LIVE: ${currentLive.id.slice(0, 8)}`
        : "No previous LIVE deployment.",
      run: activateDeployment,
    });
  }, [deployments, selectedDeployment, projects, selectedProject, activateDeployment]);

  const persistUpdate = useCallback(async () => {
    const project = projects[selectedProject];
    if (!project) return;
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: updateName, status: updateStatus }),
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
  }, [API_URL, projects, selectedProject, updateName, updateStatus, fetchProjects]);

  const handleUpdate = useCallback(() => {
    const project = projects[selectedProject];
    if (!project) return;
    const willStop = project.status === "running" && updateStatus === "stopped";
    if (willStop) {
      setConfirm({
        title: "// stop project //",
        message: `Stop project "${project.name}"?`,
        detail: "The project will be marked as offline.",
        danger: true,
        run: persistUpdate,
      });
    } else {
      persistUpdate();
    }
  }, [projects, selectedProject, updateStatus, persistUpdate]);

  const deleteProject = useCallback(async () => {
    const project = projects[selectedProject];
    if (!project) return;
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        setStatus(`> project "${project.name}" deleted`);
        setSelectedProject(0);
        setSelectedDeployment(0);
        setDeployments([]);
        await fetchProjects();
        setView("projects");
      } else {
        setStatus("! delete failed");
      }
    } catch {
      setStatus("! delete error");
    }
  }, [API_URL, projects, selectedProject, fetchProjects]);

  const handleDelete = useCallback(async () => {
    const project = projects[selectedProject];
    if (!project) return;
    let depCount = 0;
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/deployments`);
      if (res.ok) {
        const list = await res.json();
        depCount = Array.isArray(list) ? list.length : 0;
      }
    } catch {
      depCount = 0;
    }
    setConfirm({
      title: "// delete project //",
      message: `Permanently delete project "${project.name}"?`,
      detail: `This will remove the project and ${depCount} deployment(s). This cannot be undone.`,
      danger: true,
      run: deleteProject,
    });
  }, [API_URL, projects, selectedProject, deleteProject]);

  useKeyboard((key) => {
    if (key.name === "escape") {
      renderer.destroy();
      process.exit(0);
    }

    // Confirm modal intercepts everything else
    if (confirm) {
      if (key.name === "y") {
        const c = confirm;
        setConfirm(null);
        Promise.resolve(c.run());
        return;
      }
      if (key.name === "n" || key.name === "backspace") {
        setConfirm(null);
        setStatus("> cancelled");
        return;
      }
      return;
    }

    if (key.name === "backspace") {
      if (view === "update") {
        setView("detail");
        return;
      }
      if (view === "detail" || view === "create") {
        setView("projects");
        setStatus("");
        return;
      }
    }
    if (view === "projects") {
      if (key.name === "down") setSelectedProject((p) => Math.min(p + 1, projects.length - 1));
      if (key.name === "up") setSelectedProject((p) => Math.max(p - 1, 0));
      if (key.name === "return" && projects[selectedProject]) {
        fetchDeployments(projects[selectedProject].id);
        setView("detail");
      }
      if (key.name === "d") {
        setNewProjectName("");
        setView("create");
      }
      if (key.name === "k" && projects[selectedProject]) {
        handleDelete();
      }
      if (key.name === "r") {
        setStatus("> refreshing projects...");
        fetchProjects();
      }
      return;
    }
    if (view === "detail") {
      if (key.name === "down") setSelectedDeployment((d) => Math.min(d + 1, deployments.length - 1));
      if (key.name === "up") setSelectedDeployment((d) => Math.max(d - 1, 0));
      if (key.name === "n") handleAddDeployment();
      if (key.name === "return" && deployments[selectedDeployment]) handleActivate();
      if (key.name === "u") {
        const project = projects[selectedProject];
        if (project) {
          setUpdateName(project.name);
          setUpdateStatus(project.status);
          setView("update");
        }
      }
      if (key.name === "k" && projects[selectedProject]) {
        handleDelete();
      }
      if (key.name === "r") {
        const project = projects[selectedProject];
        if (project) {
          setStatus("> refreshing...");
          fetchDeployments(project.id);
        }
      }
      return;
    }
    // create view: input handles Enter via onSubmit
    if (view === "update") {
      if (key.name === "return") {
        handleUpdate();
        return;
      }
      if (key.name === "s") {
        setUpdateStatus("running");
        setStatus("> status: running (press Enter to save)");
        return;
      }
      if (key.name === "x") {
        setUpdateStatus("stopped");
        setStatus("> status: stopped (press Enter to save)");
        return;
      }
    }
  });

  const project = projects[selectedProject];
  const liveDeployment = project ? deployments.find(d => d.id === project.currentDeploymentId) : undefined;

  // Column widths for deployments table
  const COL_LIVE = 4;
  const COL_ID = 12;
  const COL_DATE = 21;
  const COL_URL = 38;
  const tableHeader = `${pad("LIVE", COL_LIVE)}${pad("ID", COL_ID)}${pad("CREATED", COL_DATE)}${pad("URL", COL_URL)}`;
  const tableSep = "─".repeat(COL_LIVE + COL_ID + COL_DATE + COL_URL);

  return (
    <box
      title="// Y A C S //"
      titleAlignment="center"
      style={{
        flexDirection: "column",
        padding: 1,
        gap: 1,
        backgroundColor: T.bg,
        border: true,
        borderStyle: "double",
        borderColor: T.borderBright,
      }}
    >
      <box style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <text fg={T.primary} attributes={1 /* BOLD */}>
          {">_ YET ANOTHER CLOUD SERVICE"}
        </text>
        <text fg={T.primaryDim}>[ {API_URL} ]</text>
      </box>

      {view === "projects" && (
        <box title={`projects // total: ${projects.length}`} titleAlignment="left" style={{ flexDirection: "column", gap: 0, border: true, borderColor: T.borderDim, padding: 1 }}>
          <text fg={T.muted}>{`${pad("", 2)}${pad("NAME", 28)}${pad("STATUS", 10)}${pad("UPDATED", 21)}`}</text>
          <text fg={T.muted}>{"─".repeat(2 + 28 + 10 + 21)}</text>
          {projects.map((p, i) => {
            const sel = i === selectedProject;
            const fg = sel ? T.highlight : p.status === "running" ? T.primary : T.danger;
            const updated = (p as { updatedAt?: string }).updatedAt
              ? fmtDate((p as { updatedAt: string }).updatedAt)
              : "";
            return (
              <text key={p.id} fg={fg}>
                {(sel ? "> " : "  ")}{pad(p.name, 28)}{pad(`[${p.status}]`, 10)}{pad(updated, 21)}
              </text>
            );
          })}
          <box style={{ marginTop: 1 }}>
            <text fg={T.textDim}>[Enter] open · [D] new · [K] delete · [R] refresh · [Esc] quit</text>
          </box>
        </box>
      )}

      {view === "detail" && project && (
        <box style={{ flexDirection: "column", gap: 1 }}>
          <box title={`project :: ${project.name}`} titleAlignment="left" style={{ flexDirection: "column", border: true, borderColor: T.borderBright, padding: 1 }}>
            <text fg={T.primaryDim}>id</text>
            <text fg={T.textBright}>  {project.id}</text>
            <text fg={T.primaryDim}>status</text>
            <text fg={project.status === "running" ? T.primary : T.danger}>
              {project.status === "running" ? "  ● RUNNING" : "  ○ STOPPED"}
            </text>
            <text fg={T.primaryDim}>live</text>
            {liveDeployment ? (
              <text fg={T.live}>  ● {liveDeployment.id.slice(0, 8)}  ({fmtDate(liveDeployment.createdAt)})</text>
            ) : (
              <text fg={T.danger}>  ○ no live deployment</text>
            )}
          </box>

          <box title={`deployments [${deployments.length}]`} titleAlignment="left" style={{ flexDirection: "column", border: true, borderColor: T.borderDim, padding: 1 }}>
            <text fg={T.muted}>{tableHeader}</text>
            <text fg={T.muted}>{tableSep}</text>
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
      )}

      {view === "create" && (
        <box title="// new project //" titleAlignment="left" style={{ flexDirection: "column", gap: 1, border: true, borderColor: T.borderBright, padding: 1 }}>
          <text fg={T.accent}>creates project + runs lint → test → build → deploy</text>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={T.primary}>name &gt;</text>
            <box style={{ border: true, borderColor: T.borderBright, width: 42, height: 3 }}>
              <input
                value={newProjectName}
                onInput={setNewProjectName}
                onSubmit={handleCreateProject}
                placeholder="my-new-project"
                focused />
            </box>
          </box>
          <text fg={T.textDim}>[Enter] create &amp; deploy · [Backspace] cancel · [Esc] quit</text>
        </box>
      )}

      {view === "update" && project && (
        <box title={`// update :: ${project.name} //`} titleAlignment="left" style={{ flexDirection: "column", gap: 1, border: true, borderColor: T.borderBright, padding: 1 }}>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={T.primary}>name &gt;</text>
            <box style={{ border: true, borderColor: T.borderDim, width: 36, height: 3 }}>
              <input value={updateName} onInput={setUpdateName} />
            </box>
          </box>
          <text fg={T.primary}>status &gt;</text>
          <box style={{ flexDirection: "row", gap: 2 }}>
            <box
              style={{
                border: true,
                borderColor: updateStatus === "running" ? T.live : T.borderDim,
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <text fg={updateStatus === "running" ? T.live : T.muted}>
                {updateStatus === "running" ? "▶ START [S]" : "  start [S]"}
              </text>
            </box>
            <box
              style={{
                border: true,
                borderColor: updateStatus === "stopped" ? T.danger : T.borderDim,
                paddingLeft: 1,
                paddingRight: 1,
              }}
            >
              <text fg={updateStatus === "stopped" ? T.danger : T.muted}>
                {updateStatus === "stopped" ? "■ STOP  [X]" : "  stop  [X]"}
              </text>
            </box>
          </box>
          <box style={{ flexDirection: "row", gap: 1 }}>
            <text fg={T.muted}>current:</text>
            <text fg={updateStatus === "running" ? T.primary : T.danger}>{updateStatus}</text>
          </box>
          <text fg={T.textDim}>[S] start · [X] stop · [Enter] save · [Backspace] cancel · [Esc] quit</text>
        </box>
      )}

      {confirm && (
        <box
          title={confirm.title}
          titleAlignment="left"
          style={{
            flexDirection: "column",
            gap: 1,
            border: true,
            borderStyle: "double",
            borderColor: confirm.danger ? T.danger : T.highlight,
            padding: 1,
          }}
        >
          <text fg={confirm.danger ? T.danger : T.highlight}>
            {confirm.danger ? "⚠ " : "? "}{confirm.message}
          </text>
          {confirm.detail && <text fg={T.textDim}>{confirm.detail}</text>}
          <box style={{ flexDirection: "row", gap: 2 }}>
            <box style={{ border: true, borderColor: T.live, paddingLeft: 1, paddingRight: 1 }}>
              <text fg={T.live}>[Y] yes</text>
            </box>
            <box style={{ border: true, borderColor: T.borderDim, paddingLeft: 1, paddingRight: 1 }}>
              <text fg={T.muted}>[N] no</text>
            </box>
          </box>
        </box>
      )}

      <box style={{ flexDirection: "row", border: true, borderColor: T.borderDim, padding: 0, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={T.primaryDim}>{status ? `${status}` : "// awaiting input //"}</text>
      </box>
    </box>
  );
}
