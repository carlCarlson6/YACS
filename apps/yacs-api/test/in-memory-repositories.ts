import type { Deployment } from "../src/domain/deployment.js";
import type { Project } from "../src/domain/project.js";
import type { DeploymentRepository, ProjectRepository, Repositories } from "../src/domain/repositories.js";

export interface InMemoryData {
  projects: Project[];
  deployments: Deployment[];
}

function cloneProject(project: Project): Project {
  return { ...project };
}

function cloneDeployment(deployment: Deployment): Deployment {
  return { ...deployment };
}

function createProjectRepository(store: Project[], deployments: Deployment[]): ProjectRepository {
  return {
    async list() {
      return store.map(cloneProject);
    },

    async findById(id) {
      const project = store.find((entry) => entry.id === id);
      return project ? cloneProject(project) : null;
    },

    async create(project) {
      store.push(cloneProject(project));
      return cloneProject(project);
    },

    async update(project) {
      const index = store.findIndex((entry) => entry.id === project.id);
      if (index === -1) {
        throw new Error(`Project ${project.id} not found`);
      }

      store[index] = cloneProject(project);
      return cloneProject(project);
    },

    async delete(id) {
      const index = store.findIndex((entry) => entry.id === id);
      if (index === -1) {
        throw new Error(`Project ${id} not found`);
      }
      store.splice(index, 1);

      // Remove related deployments to mimic FK cascade.
      for (let i = deployments.length - 1; i >= 0; i -= 1) {
        if (deployments[i]?.projectId === id) {
          deployments.splice(i, 1);
        }
      }
    },
  };
}

function createDeploymentRepository(store: Deployment[]): DeploymentRepository {
  return {
    async listByProjectId(projectId) {
      return store.filter((entry) => entry.projectId === projectId).map(cloneDeployment);
    },

    async findById(id) {
      const deployment = store.find((entry) => entry.id === id);
      return deployment ? cloneDeployment(deployment) : null;
    },

    async create(deployment) {
      store.push(cloneDeployment(deployment));
      return cloneDeployment(deployment);
    },
  };
}

export function createInMemoryRepositories(seed?: Partial<InMemoryData>): {
  repositories: Repositories;
  data: InMemoryData;
} {
  const projects = seed?.projects ? seed.projects.map(cloneProject) : [];
  const deployments = seed?.deployments ? seed.deployments.map(cloneDeployment) : [];

  return {
    repositories: {
      projects: createProjectRepository(projects, deployments),
      deployments: createDeploymentRepository(deployments),
    },
    data: { projects, deployments },
  };
}
