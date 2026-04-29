import React from "react";
import { Text } from "ink";
import { ProjectStatus, UpdateProjectInput } from "@yacs/schemas";

interface ProjectUpdateProps {
  projectId?: string;
  flags: Record<string, unknown>;
  apiUrl?: string;
}

const ProjectUpdate: React.FC<ProjectUpdateProps> = ({ projectId, flags, apiUrl }) => {
  const [status, setStatus] = React.useState<"updating" | "done" | "error">("updating");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!projectId) {
      setStatus("error");
      setMessage("No project ID specified.");
      return;
    }

    const body: UpdateProjectInput = {};
    if (typeof flags.name === "string") body.name = flags.name;
    if (typeof flags.status === "string") body.status = flags.status as ProjectStatus;

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
        setStatus("done");
        setMessage(`Project ${projectId} updated.`);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [projectId, flags, apiUrl]);

  if (status === "updating") return <Text>Updating project {projectId}...</Text>;
  if (status === "error") return <Text color="red">Error: {message}</Text>;
  return <Text color="green">{message}</Text>;
};

export default ProjectUpdate;
