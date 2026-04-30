import type { Project, UpdateProjectInput } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";

export async function updateProjectFeature(deps: {
  repositories: Repositories;
  now: () => string;
}, id: string, input: UpdateProjectInput): Promise<Project> {
  const project = await deps.repositories.projects.findById(id);
  if (!project) {
    throw new NotFoundError("Project");
  }

  return deps.repositories.projects.update({
    ...project,
    name: input.name ?? project.name,
    status: input.status ?? project.status,
    updatedAt: deps.now(),
  });
}
