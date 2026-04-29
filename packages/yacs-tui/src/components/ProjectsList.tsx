import React from "react";
import { Box, Text, useApp, useInput } from "ink";

interface ProjectsListProps {
  apiUrl?: string;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ apiUrl }) => {
  const { exit } = useApp();
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
    if (key.return === true || key.escape) {
      exit();
    }
  });

  if (loading) return <Text>Loading projects...</Text>;
  if (error) return <Text color="red">Error: {error}</Text>;
  if (projects.length === 0) return <Text>No projects found.</Text>;

  return (
    <Box flexDirection="column">
      <Text bold>Projects</Text>
      {projects.map((p) => (
        <Box key={p.id}>
          <Text>{p.name}</Text>
          <Text color={p.status === "running" ? "green" : "yellow"}> [{p.status}]</Text>
        </Box>
      ))}
    </Box>
  );
};

export default ProjectsList;
