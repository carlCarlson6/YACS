import "dotenv/config";
import { ApiError } from "@yacs/schemas";
import { createProjectsRouter } from "./features/projects/routes.js";
import { createDeploymentsRouter } from "./features/deployments/routes.js";
import { createUnitOfWork } from "./application/unit-of-work.js";
import { createDatabaseClient, createRepositories } from "./infrastructure/db/index.js";
import { createHttpApp } from "./infrastructure/http/app.js";
import { sendError } from "./infrastructure/http/error-handler.js";
import { startHttpServer } from "./infrastructure/http/server.js";
import { log, logError } from "./infrastructure/logger.js";
import { randomUUID } from "node:crypto";

const app = createHttpApp();
const PORT = parseInt(process.env.PORT || "3000", 10);

function now(): string {
  return new Date().toISOString();
}

async function start() {
  const database = createDatabaseClient();
  const repositories = createRepositories(database);
  const unitOfWork = createUnitOfWork(database);

  app.use(
    "/projects",
    createProjectsRouter({
      repositories,
      unitOfWork,
      generateId: randomUUID,
      now,
      sendError,
      log,
    })
  );

  app.use(
    "/deployments",
    createDeploymentsRouter({
      unitOfWork,
      now,
      sendError,
      log,
    })
  );

  startHttpServer(app, PORT);
}

start().catch((error) => {
  logError("Failed to start YACS API", error);
  process.exit(1);
});

export default app;
