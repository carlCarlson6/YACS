import type { Deployment } from "@yacs/schemas";
import { buildDeploymentUrl, createDeployment } from "../../domain/deployment.js";
import { NotFoundError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";

export async function createProjectDeployment(deps: {
  repositories: Repositories;
  unitOfWork: UnitOfWork;
  generateId: () => string;
  now: () => string;
}, projectId: string, buildOutput: string): Promise<Deployment> {
  return deps.unitOfWork.transaction(async ({ projects, deployments }) => {
    const project = await projects.findById(projectId);
    if (!project) {
      throw new NotFoundError("Project");
    }

    const deploymentId = deps.generateId();
    const deployment = createDeployment({
      id: deploymentId,
      projectId,
      buildOutput,
      url: buildDeploymentUrl(project.name, deploymentId),
      createdAt: deps.now(),
    });

    const createdDeployment = await deployments.create(deployment);

    await projects.update({
      ...project,
      currentDeploymentId: createdDeployment.id,
      updatedAt: deps.now(),
    });

    return createdDeployment;
  });
}
