import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Project, Deployment, ApiError } from "@yacs/schemas";
import { createProjectsRouter } from "./routes/projects.js";
import { createDeploymentsRouter } from "./routes/deployments.js";
import { log, logRequest, logError } from "./logger.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logRequest(req.method, req.url, res.statusCode, duration);
  });
  next();
});

const projects: Map<string, Project> = new Map();
const deployments: Map<string, Deployment> = new Map();
const projectDeployments: Map<string, string[]> = new Map();

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function seedMockData() {
  const seeds: Array<{ name: string; status: Project["status"]; deployments: number }> = [
    { name: "marketing-site", status: "running", deployments: 3 },
    { name: "internal-dashboard", status: "running", deployments: 2 },
    { name: "checkout-service", status: "stopped", deployments: 1 },
    { name: "blog-frontend", status: "running", deployments: 4 },
    { name: "experiment-lab", status: "stopped", deployments: 0 },
  ];

  for (const seed of seeds) {
    const projectId = generateId();
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const project: Project = {
      id: projectId,
      name: seed.name,
      status: seed.status,
      currentDeploymentId: null,
      createdAt,
      updatedAt: now(),
    };
    projects.set(projectId, project);

    const depIds: string[] = [];
    for (let i = 0; i < seed.deployments; i++) {
      const depId = generateId();
      const deployment: Deployment = {
        id: depId,
        projectId,
        buildOutput: `Build #${i + 1} for ${seed.name} completed successfully`,
        url: `https://${seed.name}-${i + 1}.yacs.local`,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * (seed.deployments - i)).toISOString(),
      };
      deployments.set(depId, deployment);
      depIds.push(depId);
    }
    projectDeployments.set(projectId, depIds);
    if (depIds.length > 0) {
      project.currentDeploymentId = depIds[depIds.length - 1];
    }
  }

  log(`Seeded ${seeds.length} mock projects with deployments`);
}

seedMockData();

function sendError(res: Response<ApiError>, status: number, error: string, message: string) {
  logError(`${error}: ${message}`);
  res.status(status).json({ error, message });
}

// Create routers with shared dependencies
const projectsRouter = createProjectsRouter({
  projects,
  deployments,
  projectDeployments,
  generateId,
  now,
  sendError,
  log,
});

const deploymentsRouter = createDeploymentsRouter({
  projects,
  deployments,
  projectDeployments,
  now,
  sendError,
  log,
});

// Mount routes
app.use("/projects", projectsRouter);
app.use("/deployments", deploymentsRouter);

app.listen(PORT, () => {
  log(`YACS API running on http://localhost:${PORT}`);
});

export default app;
