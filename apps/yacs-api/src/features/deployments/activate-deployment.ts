import type { Deployment } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";

export async function activateDeploymentFeature(deps: {
  unitOfWork: UnitOfWork;
  now: () => string;
}, id: string): Promise<Deployment> {
  return deps.unitOfWork.transaction(async ({ projects, deployments }) => {
    const deployment = await deployments.findById(id);
    if (!deployment) {
      throw new NotFoundError("Deployment");
    }

    const project = await projects.findById(deployment.projectId);
    if (!project) {
      throw new NotFoundError("Project");
    }

    await projects.update({
      ...project,
      currentDeploymentId: deployment.id,
      updatedAt: deps.now(),
    });

    return deployment;
  });
}
