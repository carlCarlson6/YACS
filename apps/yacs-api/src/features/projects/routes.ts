import { Router, type Request, type Response } from "express";
import { ApiError, createProjectInputSchema, deployRequestSchema, updateProjectInputSchema, type Deployment, type Project } from "@yacs/schemas";
import { AppError } from "../../domain/errors.js";
import type { Repositories } from "../../domain/repositories.js";
import type { UnitOfWork } from "../../application/unit-of-work.js";
import { createProjectDeployment } from "./create-project-deployment.js";
import { requestUploadUrlsFeature } from "./request-upload-urls.js";
import { requestUploadUrlsInputSchema, type UploadUrlResponse } from "@yacs/schemas";
import { createProjectFeature } from "./create-project.js";
import { deleteProjectFeature } from "./delete-project.js";
import { getProject } from "./get-project.js";
import { listProjectDeployments } from "./list-project-deployments.js";
import { listProjects } from "./list-projects.js";
import { updateProjectFeature } from "./update-project.js";

interface ProjectParams {
  id: string;
}

function handleError(res: Response<ApiError>, error: unknown, sendError: (res: Response<ApiError>, error: unknown) => void) {
  return sendError(res, error);
}

export function createProjectsRouter(deps: {
  repositories: Repositories;
  unitOfWork: UnitOfWork;
  generateId: () => string;
  now: () => string;
  sendError: (res: Response<ApiError>, error: unknown) => void;
  log: (message: string) => void;
}) {
  const router = Router();
  const { repositories, unitOfWork, generateId, now, sendError, log } = deps;

  router.get("/", async (_req: Request, res: Response<Project[] | ApiError>) => {
    try {
      const projects = await listProjects(repositories);
      log(`Listed ${projects.length} projects`);
      res.json(projects);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.post("/", async (req: Request<{}, {}, unknown>, res: Response<Project | ApiError>) => {
    const parsed = createProjectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Project creation failed: ${parsed.error.errors[0].message}`);
      return sendError(res, new AppError(400, "VALIDATION_ERROR", parsed.error.errors[0].message));
    }

    try {
      const project = await createProjectFeature({ repositories, generateId, now }, parsed.data);
      log(`Project created: ${project.id} (${project.name})`);
      res.status(201).json(project);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.get("/:id", async (req: Request<ProjectParams>, res: Response<Project | ApiError>) => {
    try {
      const project = await getProject(repositories, req.params.id);
      res.json(project);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.patch("/:id", async (req: Request<ProjectParams, {}, unknown>, res: Response<Project | ApiError>) => {
    const parsed = updateProjectInputSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Project update failed: ${parsed.error.errors[0].message}`);
      return sendError(res, new AppError(400, "VALIDATION_ERROR", parsed.error.errors[0].message));
    }

    try {
      const project = await updateProjectFeature({ repositories, now }, req.params.id, parsed.data);
      log(`Project updated: ${req.params.id}`);
      res.json(project);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.delete("/:id", async (req: Request<ProjectParams>, res: Response<{ deleted: true } | ApiError>) => {
    try {
      const result = await deleteProjectFeature(repositories, req.params.id);
      log(`Project deleted: ${req.params.id}`);
      res.json(result);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.get("/:id/deployments", async (req: Request<ProjectParams>, res: Response<Deployment[] | ApiError>) => {
    try {
      const deployments = await listProjectDeployments(repositories, req.params.id);
      log(`Listed ${deployments.length} deployments for project ${req.params.id}`);
      res.json(deployments);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.post("/:id/deployments", async (req: Request<ProjectParams, {}, unknown>, res: Response<Deployment | ApiError>) => {
    const parsed = deployRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Deployment creation failed: ${parsed.error.errors[0].message}`);
      return sendError(res, new AppError(400, "VALIDATION_ERROR", parsed.error.errors[0].message));
    }

    try {
      const deployment = await createProjectDeployment({ repositories, unitOfWork, generateId, now }, req.params.id, parsed.data.buildOutput);
      log(`Deployment created: ${deployment.id} for project ${req.params.id} (now current)`);
      res.status(201).json(deployment);
    } catch (error) {
      handleError(res as Response<ApiError>, error, sendError);
    }
  });

  router.post("/:id/deployments/upload-url", async (req: Request<ProjectParams, {}, unknown>, res: Response<UploadUrlResponse | ApiError>) => {
    const parsed = requestUploadUrlsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      log(`Upload URL request validation failed: ${parsed.error.errors[0].message}`);
      return sendError(res as Response<ApiError>, parsed.error);
    }
    try {
      const result = await requestUploadUrlsFeature({ unitOfWork, generateId, now, log }, req.params.id, parsed.data as any);
      res.json(result);
    } catch (error) {
      return sendError(res as Response<ApiError>, error);
    }
  });

  return router;
}
