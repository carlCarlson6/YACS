import { projectSchema, type Project } from "@yacs/schemas";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useApiUrl } from "./ApiContext";
import { useStatus } from "./StatusContext";

const projectListSchema = projectSchema.array();

type ProjectsContextValue = {
  projects: Project[];
  fetchProjects: () => Promise<void>;
};

export const ProjectsContext = createContext<ProjectsContextValue | null>(null);

type ProjectsProviderProps = {
  children: ReactNode;
  initialProjects?: Project[];
  fetcher?: typeof fetch;
  autoLoad?: boolean;
};

export function ProjectsProvider({
  children,
  initialProjects = [],
  fetcher,
  autoLoad = true,
}: ProjectsProviderProps) {
  const apiUrl = useApiUrl();
  const { setStatus } = useStatus();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const fetchImpl = fetcher ?? globalThis.fetch;

  const fetchProjects = useCallback(async () => {
    if (!fetchImpl) {
      setStatus("! fetch unavailable");
      return;
    }
    try {
      const res = await fetchImpl(`${apiUrl}/projects`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = projectListSchema.parse(await res.json());
      setProjects(data);
      setStatus("> projects loaded");
    } catch {
      setStatus("! error fetching projects");
    }
  }, [apiUrl, fetchImpl, setStatus]);

  useEffect(() => {
    if (autoLoad) {
      void fetchProjects();
    }
  }, [autoLoad, fetchProjects]);

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
