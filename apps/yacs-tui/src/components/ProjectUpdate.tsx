import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { ProjectStatus, UpdateProjectInput } from "@yacs/schemas";

interface ProjectUpdateProps {
  apiUrl?: string;
  onBack: () => void;
}

type InputField = "projectId" | "name" | "status" | "submit";

const ProjectUpdate: React.FC<ProjectUpdateProps> = ({ apiUrl, onBack }) => {
  const [step, setStep] = React.useState<"input" | "updating" | "done" | "error">("input");
  const [projectId, setProjectId] = React.useState("");
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [currentField, setCurrentField] = React.useState<InputField>("projectId");

  const handleSubmit = () => {
    if (!projectId) return;

    setStep("updating");
    const body: UpdateProjectInput = {};
    if (name) body.name = name;
    if (status) body.status = status as ProjectStatus;

    fetch(`${apiUrl}/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(() => {
        setStep("done");
        setMessage(`Project ${projectId} updated.`);
      })
      .catch((err) => {
        setStep("error");
        setMessage(err.message);
      });
  };

  useInput(
    (input, key) => {
      if (key.escape) {
        if (step === "done" || step === "error") {
          setStep("input");
          setMessage("");
        } else {
          onBack();
        }
      }
      if (key.tab && step === "input") {
        const fields: InputField[] = ["projectId", "name", "status", "submit"];
        const idx = fields.indexOf(currentField);
        setCurrentField(fields[(idx + 1) % fields.length]);
      }
      if (key.return && step === "input" && currentField === "submit") {
        handleSubmit();
      }
    },
    { isActive: step !== "input" || currentField === "submit" }
  );

  if (step === "input") {
    return (
      <Box flexDirection="column">
        <Text bold color="green">Update Project</Text>
        <Box>
          <Text color={currentField === "projectId" ? "cyan" : undefined}>{currentField === "projectId" ? ">" : " "}</Text>
          <Text color="cyan">Project ID: </Text>
          {currentField === "projectId" ? (
            <TextInput value={projectId} onChange={setProjectId} onSubmit={() => setCurrentField("name")} />
          ) : (
            <Text>{projectId || "(not set)"}</Text>
          )}
        </Box>
        <Box>
          <Text color={currentField === "name" ? "cyan" : undefined}>{currentField === "name" ? ">" : " "}</Text>
          <Text color="cyan">Name (optional): </Text>
          {currentField === "name" ? (
            <TextInput value={name} onChange={setName} onSubmit={() => setCurrentField("status")} />
          ) : (
            <Text>{name || "(not set)"}</Text>
          )}
        </Box>
        <Box>
          <Text color={currentField === "status" ? "cyan" : undefined}>{currentField === "status" ? ">" : " "}</Text>
          <Text color="cyan">Status (optional): </Text>
          {currentField === "status" ? (
            <TextInput value={status} onChange={setStatus} onSubmit={() => setCurrentField("submit")} />
          ) : (
            <Text>{status || "(not set)"}</Text>
          )}
        </Box>
        <Box>
          <Text color={currentField === "submit" ? "cyan" : undefined}>{currentField === "submit" ? ">" : " "}</Text>
          <Text color={currentField === "submit" ? "green" : undefined}>[Submit - press Enter]</Text>
        </Box>
        <Text dimColor>Press tab to switch fields, enter to submit, escape to go back</Text>
      </Box>
    );
  }

  if (step === "updating") return <Text color="yellow">Updating project {projectId}...</Text>;
  if (step === "error") return <Box flexDirection="column"><Text color="red">Error: {message}</Text><Text dimColor>Press escape to go back</Text></Box>;
  return (
    <Box flexDirection="column">
      <Text color="green">{message}</Text>
      <Text dimColor>Press escape to go back</Text>
    </Box>
  );
};

export default ProjectUpdate;
