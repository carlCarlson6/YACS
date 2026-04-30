import { NotFoundError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";

export async function deleteProjectFeature(repositories: Repositories, id: string): Promise<{ deleted: true }> {
  const project = await repositories.projects.findById(id);
  if (!project) {
    throw new NotFoundError("Project");
  }

  await repositories.projects.delete(id);
  return { deleted: true };
}
