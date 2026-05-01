import { useState } from "react";
import { useKeyboard } from "@opentui/react";
import { T } from "../../shared/theme";
import { resolveProjectDir } from "../../shared/paths";
import { useApiUrl } from "../../shared/contexts/ApiContext";
import { useStatus } from "../../shared/contexts/StatusContext";
import { useView } from "../../shared/contexts/ViewContext";
import { useProjects } from "../../shared/contexts/ProjectsContext";
import { useConfirm } from "../../shared/contexts/ConfirmContext";
import { useFatalError } from "../../shared/contexts/FatalErrorContext";
import { useRunBuildAndDeploy } from "../../shared/runBuildAndDeploy";

export function CreateProjectScreen() {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const { view, setView } = useView();
  const { fetchProjects } = useProjects();
  const { confirm } = useConfirm();
  const { fatalError } = useFatalError();
  const runBuildAndDeploy = useRunBuildAndDeploy();

  const [name, setName] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [step, setStep] = useState<"name" | "path">("name");

  const focusNextField = () => {
    setStep((current) => (current === "name" ? "path" : "name"));
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setStatus("! project name required");
      setStep("name");
      return;
    }
    let projectDir: string;
    try {
      projectDir = resolveProjectDir(projectPath);
    } catch (err) {
      setStatus(`! ${(err as Error).message}`);
      setStep("path");
      return;
    }
    setStatus(`> creating project "${trimmed}"...`);
    try {
      const res = await fetch(`${apiUrl}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        setStatus("! failed to create project");
        return;
      }
      const project = await res.json();
      setStatus(`> project created. deploying...`);
      const deployed = await runBuildAndDeploy(project.id, projectDir);
      setStatus(
        deployed
          ? `> project "${trimmed}" online`
          : `! project "${trimmed}" created but deployment failed`
      );
      setName("");
      setProjectPath("");
      setStep("name");
      fetchProjects();
      setView("projects");
    } catch {
      setStatus("! create project error");
    }
  };

  useKeyboard((key) => {
    if (view !== "create" || confirm || fatalError) return;
    if (key.name === "tab") {
      focusNextField();
      return;
    }
    if (key.ctrl && key.name === "b") {
      setView("projects");
      setStatus("> cancelled");
    }
  });

  return (
    <box
      title="// new project //"
      titleAlignment="left"
      style={{
        flexDirection: "column",
        gap: 1,
        border: true,
        borderColor: T.borderBright,
        padding: 1,
      }}
    >
      <text fg={T.accent}>creates project + runs lint → test → build → deploy</text>

      <box style={{ flexDirection: "row", gap: 1 }}>
        <box style={{ marginTop: 1 }}>
          <text fg={step === "name" ? T.primary : T.muted}>name &gt;</text>
        </box>
        <box
          style={{
            border: true,
            borderColor: step === "name" ? T.borderBright : T.borderDim,
            width: 42,
            height: 3,
          }}
        >
          <input
            value={name}
            onInput={setName}
            onSubmit={() => {
              if (!name.trim()) {
                setStatus("! project name required");
                return;
              }
              setStep("path");
            }}
            placeholder="my-new-project"
            focused={step === "name"}
          />
        </box>
      </box>

      <box style={{ flexDirection: "row", gap: 1 }}>
        <box style={{ marginTop: 1 }}>
          <text fg={step === "path" ? T.primary : T.muted}>path &gt;</text>
        </box>
        <box
          style={{
            border: true,
            borderColor: step === "path" ? T.borderBright : T.borderDim,
            width: 60,
            height: 3,
          }}
        >
          <input
            value={projectPath}
            onInput={setProjectPath}
            onSubmit={submit}
            placeholder="./relative/path/to/project"
            focused={step === "path"}
          />
        </box>
      </box>

      <text fg={T.textDim}>relative to: {process.cwd()}</text>
      <text fg={T.textDim}>[Tab] next field · [Enter] next/submit · [Ctrl+B] cancel · [Esc] quit</text>
    </box>
  );
}
