export type ProjectStatus = "running" | "stopped";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  currentDeploymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createProject(input: {
  id: string;
  name: string;
  status?: ProjectStatus;
  currentDeploymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}): Project {
  return {
    id: input.id,
    name: input.name,
    status: input.status ?? "running",
    currentDeploymentId: input.currentDeploymentId ?? null,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
