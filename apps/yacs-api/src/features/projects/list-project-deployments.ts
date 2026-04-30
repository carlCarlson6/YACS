import type { Deployment } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";

export async function listProjectDeployments(repositories: Repositories, projectId: string): Promise<Deployment[]> {
  const project = await repositories.projects.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  return repositories.deployments.listByProjectId(projectId);
}
