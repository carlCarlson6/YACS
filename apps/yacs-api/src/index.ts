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
  deployments,
  projectDeployments,
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
