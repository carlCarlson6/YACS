import { Router, Request, Response } from "express";
import { Project, Deployment, ApiError } from "@yacs/schemas";

interface DeploymentParams {
  id: string;
}

export function createDeploymentsRouter(deps: {
  projects: Map<string, Project>;
  deployments: Map<string, Deployment>;
  projectDeployments: Map<string, string[]>;
  now: () => string;
  sendError: (res: Response<ApiError>, status: number, error: string, message: string) => void;
  log: (message: string) => void;
}) {
  const router = Router();
  const { projects, deployments, projectDeployments, now, sendError, log } = deps;

  router.post("/:id/activate", (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
    const deployment = deployments.get(req.params.id);
    if (!deployment) {
      log(`Deployment not found for activate: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Deployment not found");
    }

    const project = projects.get(deployment.projectId);
    if (!project) {
      log(`Project not found for activate: ${deployment.projectId}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    project.currentDeploymentId = deployment.id;
    project.updatedAt = now();
    projects.set(project.id, project);

    log(`Deployment activated as live: ${deployment.id} for project ${project.id}`);
    res.json(deployment);
  });

  router.post("/:id/revert", (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
    const deployment = deployments.get(req.params.id);
    if (!deployment) {
      log(`Deployment not found for revert: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Deployment not found");
    }

    const project = projects.get(deployment.projectId);
    if (!project) {
      log(`Project not found for revert: ${deployment.projectId}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    const ids = projectDeployments.get(deployment.projectId) || [];
    const index = ids.indexOf(req.params.id);
    if (index === -1) {
      log(`Deployment index not found for revert: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Deployment not found");
    }

    if (index === 0) {
      log(`No previous deployment to revert to for: ${req.params.id}`);
      return sendError(res, 400, "REVERT_ERROR", "No previous deployment to revert to");
    }

    const previousDeploymentId = ids[index - 1];
    const previousDeployment = deployments.get(previousDeploymentId);

    if (!previousDeployment) {
      log(`No previous deployment to revert to for: ${req.params.id}`);
      return sendError(res, 400, "REVERT_ERROR", "No previous deployment to revert to");
    }

    project.currentDeploymentId = previousDeploymentId;
    project.updatedAt = now();
    projects.set(project.id, project);

    log(`Deployment reverted: ${req.params.id} -> ${previousDeploymentId} (now current)`);
    res.json(previousDeployment);
  });

  return router;
}
