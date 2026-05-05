import { Router, type Request, type Response } from "express";
import { type ApiError, type Deployment, uploadCompleteInputSchema, type UploadCompleteInput } from "@yacs/schemas";
import type { UnitOfWork } from "../../application/unit-of-work.js";
import { activateDeploymentFeature } from "./activate-deployment.js";
import { revertDeploymentFeature } from "./revert-deployment.js";
import { completeUploadFeature } from "./complete-upload.js";

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

  router.post("/:id/upload-complete", async (req: Request<DeploymentParams, {}, unknown>, res: Response<{ deployment: Deployment; status: string } | ApiError>) => {
    const parsed = uploadCompleteInputSchema.safeParse(req.body);
    if (!parsed.success) {
      deps.log(`Upload completion validation failed: ${parsed.error.errors[0].message}`);
      return deps.sendError(res as Response<ApiError>, parsed.error);
    }
    try {
      const result = await completeUploadFeature({ unitOfWork: deps.unitOfWork, now: deps.now, log: deps.log }, req.params.id, parsed.data as UploadCompleteInput);
      res.json({ deployment: result.deployment, status: result.status });
    } catch (error) {
      return deps.sendError(res as Response<ApiError>, error);
    }
  });

  return router;
}
