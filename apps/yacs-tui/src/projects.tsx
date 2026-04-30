import { Project } from "@yacs/schemas";
import { useCallback, useEffect, useState } from "react";

export const useProjects = (
  API_URL: string, 
  setStatus: (status: string) => void
) => {
  const [projects, setProjects] = useState<Project[]>([]);
  
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      const data = await res.json();
      setProjects(data);
      setStatus("Projects loaded");
    } catch {
      setStatus("Error fetching projects");
    }
  }, [])

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    fetchProjects,
  }
};
