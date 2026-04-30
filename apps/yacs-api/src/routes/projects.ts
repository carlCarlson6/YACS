import { Router, Request, Response } from "express";
import {
  Project,
  Deployment,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
  DeployRequest,
  ApiError,
  createProjectInputSchema,
  updateProjectInputSchema,
  deployRequestSchema,
} from "@yacs/schemas";

interface ProjectParams {
  id: string;
}

interface DeploymentParams {
  id: string;
}

export function createProjectsRouter(deps: {
  projects: Map<string, Project>;
  deployments: Map<string, Deployment>;
  projectDeployments: Map<string, string[]>;
  generateId: () => string;
  now: () => string;
  sendError: (res: Response<ApiError>, status: number, error: string, message: string) => void;
  log: (message: string) => void;
}) {
  const router = Router();
  const { projects, deployments, projectDeployments, generateId, now, sendError, log } = deps;

  router.get("/", (_req: Request, res: Response<Project[]>) => {
    log(`Listed ${projects.size} projects`);
    res.json(Array.from(projects.values()));
  });

  router.post("/", (req: Request<{}, {}, unknown>, res: Response<Project | ApiError>) => {
    const parsed = createProjectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Project creation failed: ${parsed.error.errors[0].message}`);
      return sendError(res, 400, "VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    const { name } = parsed.data;
    const id = generateId();
    const project: Project = {
      id,
      name: name.trim(),
      status: "running",
      currentDeploymentId: null,
      createdAt: now(),
      updatedAt: now(),
    };

    projects.set(id, project);
    projectDeployments.set(id, []);
    log(`Project created: ${id} (${name})`);
    res.status(201).json(project);
  });

  router.get("/:id", (_req: Request<ProjectParams>, res: Response<Project | ApiError>) => {
    const project = projects.get(_req.params.id);
    if (!project) {
      log(`Project not found: ${_req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }
    res.json(project);
  });

  router.patch("/:id", (req: Request<ProjectParams, {}, unknown>, res: Response<Project | ApiError>) => {
    const project = projects.get(req.params.id);
    if (!project) {
      log(`Project not found for update: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    const parsed = updateProjectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Project update failed: ${parsed.error.errors[0].message}`);
      return sendError(res, 400, "VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    if (parsed.data.name !== undefined) {
      project.name = parsed.data.name;
    }
    if (parsed.data.status !== undefined) {
      project.status = parsed.data.status as ProjectStatus;
    }
    project.updatedAt = now();

    projects.set(req.params.id, project);
    log(`Project updated: ${req.params.id}`);
    res.json(project);
  });

  router.delete("/:id", (req: Request<ProjectParams>, res: Response<{ deleted: true } | ApiError>) => {
    const project = projects.get(req.params.id);
    if (!project) {
      log(`Project not found for delete: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    const depIds = projectDeployments.get(req.params.id) || [];
    for (const depId of depIds) {
      deployments.delete(depId);
    }
    projectDeployments.delete(req.params.id);
    projects.delete(req.params.id);

    log(`Project deleted: ${req.params.id} (${depIds.length} deployments removed)`);
    res.json({ deleted: true });
  });

  router.get("/:id/deployments", (_req: Request<ProjectParams>, res: Response<Deployment[] | ApiError>) => {
    const project = projects.get(_req.params.id);
    if (!project) {
      log(`Project not found for deployments list: ${_req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    const ids = projectDeployments.get(_req.params.id) || [];
    const projectDeploymentsList = ids
      .map((id) => deployments.get(id))
      .filter((d): d is Deployment => d !== undefined);

    log(`Listed ${projectDeploymentsList.length} deployments for project ${_req.params.id}`);
    res.json(projectDeploymentsList);
  });

  router.post("/:id/deployments", (req: Request<ProjectParams, {}, unknown>, res: Response<Deployment | ApiError>) => {
    const project = projects.get(req.params.id);
    if (!project) {
      log(`Project not found for deployment: ${req.params.id}`);
      return sendError(res, 404, "NOT_FOUND", "Project not found");
    }

    const parsed = deployRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Deployment creation failed: ${parsed.error.errors[0].message}`);
      return sendError(res, 400, "VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    const deploymentId = generateId();
    const deployment: Deployment = {
      id: deploymentId,
      projectId: req.params.id,
      buildOutput: parsed.data.buildOutput,
      url: `https://${project.name}-${deploymentId}.yacs.local`,
      createdAt: now(),
    };

    deployments.set(deploymentId, deployment);
    const ids = projectDeployments.get(req.params.id) || [];
    ids.push(deploymentId);
    projectDeployments.set(req.params.id, ids);

    project.currentDeploymentId = deploymentId;
    project.updatedAt = now();
    projects.set(req.params.id, project);

    log(`Deployment created: ${deploymentId} for project ${req.params.id} (now current)`);
    res.status(201).json(deployment);
  });

  return router;
}
