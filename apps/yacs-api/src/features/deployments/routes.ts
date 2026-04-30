import { Router, type Request, type Response } from "express";
import { type ApiError, type Deployment } from "@yacs/schemas";
import type { UnitOfWork } from "../../application/unit-of-work.js";
import { activateDeploymentFeature } from "./activate-deployment.js";
import { revertDeploymentFeature } from "./revert-deployment.js";

interface DeploymentParams {
  id: string;
}

function handleError(res: Response<ApiError>, error: unknown, sendError: (res: Response<ApiError>, error: unknown) => void) {
  return sendError(res, error);
}

export function createDeploymentsRouter(deps: {
  unitOfWork: UnitOfWork;
  now: () => string;
  sendError: (res: Response<ApiError>, error: unknown) => void;
  log: (message: string) => void;
}) {
  const router = Router();
  const { unitOfWork, now, sendError, log } = deps;

  router.post("/:id/activate", async (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
    try {
      const deployment = await activateDeploymentFeature({ unitOfWork, now }, req.params.id);
      log(`Deployment activated as live: ${deployment.id}`);
      res.json(deployment);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.post("/:id/revert", async (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
    try {
      const deployment = await revertDeploymentFeature({ unitOfWork, now }, req.params.id);
      log(`Deployment reverted to previous version: ${deployment.id}`);
      res.json(deployment);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  return router;
}
