export type ProjectStatus = "running" | "stopped";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  buildOutput: string;
  url: string;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
  status?: ProjectStatus;
}

export interface DeployRequest {
  projectId: string;
  buildOutput: string;
}

export interface RevertRequest {
  deploymentId: string;
}

export interface ApiError {
  error: string;
  message: string;
}
