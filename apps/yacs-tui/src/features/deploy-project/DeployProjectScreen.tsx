import { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { T } from "../../shared/theme";
import { resolveProjectDir } from "../../shared/paths";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useView } from "../../shared/contexts/ViewContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useFatalError } from "../../shared/contexts/FatalErrorContext";
import { useRunBuildAndDeploy, type DeploymentStep } from "../../shared/runBuildAndDeploy";
import { DeploymentStepIndicator } from "../../shared/ui/DeploymentStepIndicator";

export function DeployProjectScreen() {
  const { setStatus } = useStatus();
  const { view, setView, selectedProject } = useView();
  const { projects, fetchProjects } = useProjects();
  const { confirm } = useConfirm();
  const { fatalError } = useFatalError();
  const runBuildAndDeploy = useRunBuildAndDeploy();

  const project = projects[selectedProject];
  const [projectPath, setProjectPath] = useState("");
  const [deploymentStep, setDeploymentStep] = useState<DeploymentStep | null>(null);

  const submit = async () => {
    if (!project) return;
    let projectDir: string;
    try {
      projectDir = resolveProjectDir(projectPath);
    } catch (err) {
      setStatus(`! ${(err as Error).message}`);
      return;
    }
    const ok = await runBuildAndDeploy(project.id, projectDir, setDeploymentStep);
    setDeploymentStep(null);
    if (ok) {
      setStatus(`> deployment pushed for ${project.name}`);
      setProjectPath("");
      setView("detail");
      await fetchProjects();
    } else {
      setStatus("! deployment failed");
    }
  };

  useKeyboard((key) => {
    if (view !== "deploy" || confirm || fatalError) return;
    if (key.ctrl && key.name === "b") {
      setView("detail");
      setStatus("> cancelled");
    }
  });

  if (!project) return null;

  return (
    <box
      title={`// new deployment :: ${project.name} //`}
      titleAlignment="left"
      style={{
        flexDirection: "column",
        gap: 1,
        border: true,
        borderColor: T.borderBright,
        padding: 1,
      }}
    >
      <text fg={T.accent}>runs lint → test → build → deploy from the given directory</text>
      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={T.primary}>path &gt;</text>
        <box style={{ border: true, borderColor: T.borderBright, width: 60, height: 3 }}>
          <input
            value={projectPath}
            onInput={setProjectPath}
            onSubmit={submit}
            placeholder="./relative/path/to/project"
            focused
          />
        </box>
      </box>
      <text fg={T.textDim}>relative to: {process.cwd()}</text>
      <text fg={T.textDim}>[Enter] deploy · [Ctrl+B] cancel · [Esc] quit</text>
      <DeploymentStepIndicator step={deploymentStep} />
    </box>
  );
}
