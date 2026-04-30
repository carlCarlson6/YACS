import type { CreateProjectInput, Project } from "@yacs/schemas";
import { createProject } from "../../domain/project.js";
import type { Repositories } from "../../domain/repositories.js";

export async function createProjectFeature(deps: {
  repositories: Repositories;
  generateId: () => string;
  now: () => string;
}, input: CreateProjectInput): Promise<Project> {
  const project = createProject({
    id: deps.generateId(),
    name: input.name.trim(),
    createdAt: deps.now(),
    updatedAt: deps.now(),
  });

  return deps.repositories.projects.create(project);
}
