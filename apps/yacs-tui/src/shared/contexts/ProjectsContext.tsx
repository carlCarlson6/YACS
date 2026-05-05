import { projectSchema, type Project } from "@yacs/schemas";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useApiUrl } from "./ApiContext";
import { useStatus } from "./StatusContext";

const projectListSchema = projectSchema.array();

type ProjectsContextValue = {
  projects: Project[];
  fetchProjects: () => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/projects`);
      const data = projectListSchema.parse(await res.json());
      setProjects(data);
      setStatus("> projects loaded");
    } catch {
      setStatus("! error fetching projects");
    }
  }, [apiUrl, setStatus]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return (
    <ProjectsContext.Provider value={{ projects, fetchProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside <ProjectsProvider>");
  return ctx;
}
