import type { Deployment } from "@yacs/schemas";
import { NotFoundError, RevertError } from "../../domain/errors.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";

export async function revertDeploymentFeature(deps: {
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

    const projectDeployments = await deployments.listByProjectId(deployment.projectId);
    const index = projectDeployments.findIndex((entry) => entry.id === id);
    if (index <= 0) {
      throw new RevertError("No previous deployment to revert to");
    }

    const previousDeployment = projectDeployments[index - 1];

    await projects.update({
      ...project,
      currentDeploymentId: previousDeployment.id,
      updatedAt: deps.now(),
    });

    return previousDeployment;
  });
}
