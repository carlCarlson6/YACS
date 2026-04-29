import React from "react";
import { Box, Text, useInput } from "ink";

interface ProjectsListProps {
  apiUrl?: string;
  onBack: () => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ apiUrl, onBack }) => {
  const [projects, setProjects] = React.useState<{ id: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${apiUrl}/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl]);

  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  if (loading) return <Text color="cyan">Loading projects...</Text>;
  if (error) return <Text color="red">Error: {error}</Text>;
  if (projects.length === 0) return <Text color="yellow">No projects found.</Text>;

  return (
    <Box flexDirection="column">
      <Text bold color="green">Projects</Text>
      {projects.map((p) => (
        <Box key={p.id}>
          <Text color="cyan">{p.name}</Text>
          <Text color={p.status === "running" ? "green" : "yellow"}> [{p.status}]</Text>
        </Box>
      ))}
      <Text dimColor>Press escape to go back</Text>
    </Box>
  );
};

export default ProjectsList;
