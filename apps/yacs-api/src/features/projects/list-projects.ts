import type { Project } from "@yacs/schemas";
import type { Repositories } from "../../domain/repositories.js";

export async function listProjects(repositories: Repositories): Promise<Project[]> {
  return repositories.projects.list();
}
