import type { Project } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";

export async function getProject(repositories: Repositories, id: string): Promise<Project> {
  const project = await repositories.projects.findById(id);
  if (!project) {
    throw new NotFoundError("Project");
  }

  return project;
}
