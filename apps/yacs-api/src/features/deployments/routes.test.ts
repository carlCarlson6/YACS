import request from "supertest";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { createDeploymentsRouter } from "./routes.js";
import { createInMemoryRepositories } from "../../../test/in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../../test/unit-of-work.stub.js";
import { sendError } from "../../infrastructure/http/error-handler.js";

const project = {
  id: "proj_1",
  name: "docs",
  status: "running" as const,
  currentDeploymentId: "deploy_2",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const deployments = [
  {
    id: "deploy_1",
    projectId: project.id,
    buildOutput: "dist@1",
    url: "https://docs-1.example.com",
    status: "active" as const,
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: "deploy_2",
    projectId: project.id,
    buildOutput: "dist@2",
    url: "https://docs-2.example.com",
    status: "active" as const,
    createdAt: "2024-02-02T00:00:00.000Z",
  },
];

function buildDeploymentsApp(seed = { projects: [project], deployments }) {
  const { repositories, data } = createInMemoryRepositories(seed);
  const unitOfWork = createUnitOfWorkStub(repositories);
  const app = express();
  app.use(express.json());
  app.use(
    "/api/deployments",
    createDeploymentsRouter({
      unitOfWork,
      now: () => "2024-03-01T00:00:00.000Z",
      sendError,
      log: vi.fn(),
    })
  );

  return { app, data };
}

describe("deployments router", () => {
  it("activates a deployment", async () => {
    const { app, data } = buildDeploymentsApp();

    const response = await request(app).post(`/api/deployments/${deployments[0].id}/activate`).expect(200);

    expect(response.body.id).toBe(deployments[0].id);
    expect(data.projects[0]?.currentDeploymentId).toBe(deployments[0].id);
  });

  it("returns 404 when deployment is missing", async () => {
    const { app } = buildDeploymentsApp({ projects: [project], deployments: [] });

    const response = await request(app).post(`/api/deployments/missing/activate`).expect(404);

    expect(response.body).toMatchObject({ error: "NOT_FOUND" });
  });

  it("reverts to previous deployment only when possible", async () => {
    const { app } = buildDeploymentsApp({
      projects: [project],
      deployments: [deployments[0]],
    });

    const response = await request(app).post(`/api/deployments/${deployments[0].id}/revert`).expect(400);

    expect(response.body).toMatchObject({ error: "REVERT_ERROR" });
  });

  it("marks upload complete with a manifest", async () => {
    const { app, data } = buildDeploymentsApp();

    const manifest = {
      files: [{ path: "index.html", size: 10, checksum: "abc" }],
      totalSize: 10,
      uploadedAt: "2024-03-01T00:00:00.000Z",
    };

    const response = await request(app)
      .post(`/api/deployments/${deployments[0].id}/upload-complete`)
      .send({ manifest })
      .expect(200);

    expect(response.body.status).toBe("active");
    expect(response.body.deployment.id).toBe(deployments[0].id);
    expect(data.projects[0]?.currentDeploymentId).toBe(deployments[0].id);
  });
});
