import type { Deployment } from "./deployment.js";
import type { Project } from "./project.js";

export interface ProjectRepository {
  list(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}

export interface DeploymentRepository {
  listByProjectId(projectId: string): Promise<Deployment[]>;
  findById(id: string): Promise<Deployment | null>;
  create(deployment: Deployment): Promise<Deployment>;
}

export interface Repositories {
  projects: ProjectRepository;
  deployments: DeploymentRepository;
}
