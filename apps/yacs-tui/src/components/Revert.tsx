import React from "react";
import { Text } from "ink";

interface RevertProps {
  deploymentId?: string;
  apiUrl?: string;
}

const Revert: React.FC<RevertProps> = ({ deploymentId, apiUrl }) => {
  const [status, setStatus] = React.useState<"reverting" | "done" | "error">("reverting");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!deploymentId) {
      setStatus("error");
      setMessage("No deployment ID specified.");
      return;
    }

    fetch(`${apiUrl}/deployments/${deploymentId}/revert`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(() => {
        setStatus("done");
        setMessage(`Reverted to previous deployment.`);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [deploymentId, apiUrl]);

  if (status === "reverting") return <Text>Reverting deployment {deploymentId}...</Text>;
  if (status === "error") return <Text color="red">Error: {message}</Text>;
  return <Text color="green">{message}</Text>;
};

export default Revert;
