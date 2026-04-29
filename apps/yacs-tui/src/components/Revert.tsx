import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface RevertProps {
  apiUrl?: string;
  onBack: () => void;
}

const Revert: React.FC<RevertProps> = ({ apiUrl, onBack }) => {
  const [step, setStep] = React.useState<"input" | "reverting" | "done" | "error">("input");
  const [deploymentId, setDeploymentId] = React.useState("");
  const [message, setMessage] = React.useState("");

  useInput(
    (_input, key) => {
      if (key.escape) {
        onBack();
      }
    },
    { isActive: step !== "input" }
  );

  const startRevert = (id: string) => {
    if (!id) return;
    setDeploymentId(id);
    setStep("reverting");

    fetch(`${apiUrl}/deployments/${id}/revert`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(() => {
        setStep("done");
        setMessage(`Reverted to previous deployment.`);
      })
      .catch((err) => {
        setStep("error");
        setMessage(err.message);
      });
  };

  if (step === "input") {
    return (
      <Box flexDirection="column">
        <Text bold color="green">Revert Deployment</Text>
        <Text color="cyan">Enter deployment ID:</Text>
        <TextInput
          value={deploymentId}
          onChange={setDeploymentId}
          onSubmit={startRevert}
        />
        <Text dimColor>Press escape to go back</Text>
      </Box>
    );
  }

  if (step === "reverting") return <Text color="yellow">Reverting deployment {deploymentId}...</Text>;
  if (step === "error") return <Text color="red">Error: {message}</Text>;
  return (
    <Box flexDirection="column">
      <Text color="green">{message}</Text>
      <Text dimColor>Press escape to go back</Text>
    </Box>
  );
};

export default Revert;
