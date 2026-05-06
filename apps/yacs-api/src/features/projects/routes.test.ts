import request from "supertest";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { createProjectsRouter } from "./routes.js";
import { createInMemoryRepositories } from "../../../test/in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../../test/unit-of-work.stub.js";
import { sendError } from "../../infrastructure/http/error-handler.js";

const baseProject = {
  id: "proj_1",
  name: "marketing",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

function buildProjectsApp(seed = { projects: [baseProject], deployments: [] as any[] }) {
  const { repositories, data } = createInMemoryRepositories(seed);
  const unitOfWork = createUnitOfWorkStub(repositories);
  let idCounter = 0;
  const generateId = vi.fn(() => {
    idCounter += 1;
    return `id_${idCounter}`;
  });
  const deps = {
    repositories,
    unitOfWork,
    generateId,
    now: () => "2024-02-01T00:00:00.000Z",
    sendError,
    log: vi.fn(),
    generateUploadSasUrl: (blobName: string) => `https://storage/${blobName}`,
  };

  const app = express();
  app.use(express.json());
  app.use("/api/projects", createProjectsRouter(deps));

  return { app, data, generateId };
}

describe("projects router", () => {
  it("returns all projects", async () => {
    const { app } = buildProjectsApp();

    const response = await request(app).get("/api/projects").expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(baseProject.id);
  });

  it("creates a project when input is valid", async () => {
    const { app, data, generateId } = buildProjectsApp({ projects: [], deployments: [] });

    const response = await request(app)
      .post("/api/projects")
      .send({ name: "  Launch  " })
      .expect(201);

    expect(response.body).toMatchObject({
      id: "id_1",
      name: "Launch",
      status: "running",
    });
    expect(generateId).toHaveBeenCalledTimes(1);
    expect(data.projects[0]?.name).toBe("Launch");
  });

  it("validates project payloads", async () => {
    const { app } = buildProjectsApp({ projects: [], deployments: [] });

    const response = await request(app).post("/api/projects").send({}).expect(400);

    expect(response.body).toMatchObject({ error: "VALIDATION_ERROR" });
  });

  it("returns 404 for missing project", async () => {
    const { app } = buildProjectsApp({ projects: [], deployments: [] });

    const response = await request(app).get("/api/projects/proj_missing").expect(404);

    expect(response.body).toMatchObject({ error: "NOT_FOUND" });
  });

  it("creates deployments via POST /:id/deployments", async () => {
    const { app, data } = buildProjectsApp();

    const response = await request(app)
      .post(`/api/projects/${baseProject.id}/deployments`)
      .send({ projectId: baseProject.id, buildOutput: "dist" })
      .expect(201);

    expect(response.body.id).toBe("id_1");
    expect(data.projects[0]?.currentDeploymentId).toBe("id_1");
  });
});
