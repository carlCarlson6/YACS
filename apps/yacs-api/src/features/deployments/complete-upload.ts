import type { UploadCompleteInput, UploadManifest, Deployment } from "@yacs/schemas";
import { NotFoundError } from "../../domain/errors.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";

/**
 * Handle notification of completed uploads by activating the deployment.
 * Updates the project's currentDeploymentId to this deployment.
 */
export async function completeUploadFeature(
  deps: {
    unitOfWork: UnitOfWork;
    now: () => string;
    log: (message: string) => void;
  },
  deploymentId: string,
  input: UploadCompleteInput
): Promise<{ deployment: Deployment; status: string }> {
  const { unitOfWork, now, log } = deps;
  const { manifest } = input;

  const deployment = await unitOfWork.transaction(async ({ deployments, projects }) => {
    const existing = await deployments.findById(deploymentId);
    if (!existing) {
      throw new NotFoundError("Deployment");
    }

    // TODO: validate manifest.totalSize and file count

    const project = await projects.findById(existing.projectId);
    if (!project) {
      throw new NotFoundError("Project");
    }

    await projects.update({
      ...project,
      currentDeploymentId: deploymentId,
      updatedAt: now(),
    });

    return existing;
  });

  log(`Upload complete and activated deployment ${deploymentId}`);
  return { deployment, status: "active" };
}
