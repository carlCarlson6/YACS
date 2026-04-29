import express, { Request, Response } from "express";
import cors from "cors";
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

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors());
app.use(express.json());

const projects: Map<string, Project> = new Map();
const deployments: Map<string, Deployment> = new Map();
const projectDeployments: Map<string, string[]> = new Map();

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function sendError(res: Response<ApiError>, status: number, error: string, message: string) {
  res.status(status).json({ error, message });
}

app.get("/projects", (_req: Request, res: Response<Project[]>) => {
  res.json(Array.from(projects.values()));
});

app.post("/projects", (req: Request<{}, {}, unknown>, res: Response<Project | ApiError>) => {
  const parsed = createProjectInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.errors[0].message);
  }

  const { name } = parsed.data;
  const id = generateId();
  const project: Project = {
    id,
    name: name.trim(),
    status: "running",
    createdAt: now(),
    updatedAt: now(),
  };

  projects.set(id, project);
  projectDeployments.set(id, []);
  res.status(201).json(project);
});

app.get("/projects/:id", (_req: Request<ProjectParams>, res: Response<Project | ApiError>) => {
  const project = projects.get(_req.params.id);
  if (!project) {
    return sendError(res, 404, "NOT_FOUND", "Project not found");
  }
  res.json(project);
});

app.patch("/projects/:id", (req: Request<ProjectParams, {}, unknown>, res: Response<Project | ApiError>) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return sendError(res, 404, "NOT_FOUND", "Project not found");
  }

  const parsed = updateProjectInputSchema.safeParse(req.body);
  if (!parsed.success) {
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
  res.json(project);
});

app.get("/projects/:id/deployments", (_req: Request<ProjectParams>, res: Response<Deployment[] | ApiError>) => {
  const project = projects.get(_req.params.id);
  if (!project) {
    return sendError(res, 404, "NOT_FOUND", "Project not found");
  }

  const ids = projectDeployments.get(_req.params.id) || [];
  const projectDeploymentsList = ids
    .map((id) => deployments.get(id))
    .filter((d): d is Deployment => d !== undefined);

  res.json(projectDeploymentsList);
});

app.post("/projects/:id/deployments", (req: Request<ProjectParams, {}, unknown>, res: Response<Deployment | ApiError>) => {
  const project = projects.get(req.params.id);
  if (!project) {
    return sendError(res, 404, "NOT_FOUND", "Project not found");
  }

  const parsed = deployRequestSchema.safeParse(req.body);
  if (!parsed.success) {
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

  res.status(201).json(deployment);
});

app.post("/deployments/:id/revert", (req: Request<DeploymentParams, {}, {}>, res: Response<Deployment | ApiError>) => {
  const deployment = deployments.get(req.params.id);
  if (!deployment) {
    return sendError(res, 404, "NOT_FOUND", "Deployment not found");
  }

  const ids = projectDeployments.get(deployment.projectId) || [];
  const index = ids.indexOf(req.params.id);
  if (index === -1) {
    return sendError(res, 404, "NOT_FOUND", "Deployment not found");
  }

  const previousDeploymentId = ids[Math.max(0, index - 1)];
  const previousDeployment = deployments.get(previousDeploymentId);

  if (!previousDeployment) {
    return sendError(res, 400, "REVERT_ERROR", "No previous deployment to revert to");
  }

  res.json(previousDeployment);
});

app.listen(PORT, () => {
  console.log(`YACS API running on http://localhost:${PORT}`);
});

export default app;
