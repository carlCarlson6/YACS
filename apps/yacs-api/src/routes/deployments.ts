import { Router, Request, Response } from "express";
import { Deployment, ApiError } from "@yacs/schemas";

interface DeploymentParams {
  id: string;
}

export function createDeploymentsRouter(deps: {
  deployments: Map<string, Deployment>;
  projectDeployments: Map<string, string[]>;
  sendError: (res: Response<ApiError>, status: number, error: string, message: string) => void;
  log: (message: string) => void;
}) {
  const router = Router();
  const { deployments, projectDeployments, sendError, log } = deps;

  router.post("/:id/revert", (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
    const deployment = deployments.get(req.params.id);
    if (!deployment) {
      log(`Deployment not found for revert: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Deployment not found");
    }

    const ids = projectDeployments.get(deployment.projectId) || [];
    const index = ids.indexOf(req.params.id);
    if (index === -1) {
      log(`Deployment index not found for revert: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Deployment not found");
    }

    const previousDeploymentId = ids[Math.max(0, index - 1)];
    const previousDeployment = deployments.get(previousDeploymentId);

    if (!previousDeployment) {
      log(`No previous deployment to revert to for: ${req.params.id}`);
      return sendError(res, 400, "REVERT_ERROR", "No previous deployment to revert to");
    }

    log(`Deployment reverted: ${req.params.id} -> ${previousDeploymentId}`);
    res.json(previousDeployment);
  });

  return router;
}
