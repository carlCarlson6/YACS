import { describe, expect, it } from "vitest";
import { activateDeploymentFeature } from "./activate-deployment.js";
import { createInMemoryRepositories } from "../../../test/in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../../test/unit-of-work.stub.js";
import { NotFoundError } from "../../domain/errors.js";

const project = {
  id: "proj_1",
  name: "docs",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const deployment = {
  id: "deploy_1",
  projectId: project.id,
  buildOutput: "dist",
  url: "https://docs.example.com",
  status: "active" as const,
  createdAt: "2024-02-01T00:00:00.000Z",
};

describe("activateDeploymentFeature", () => {
  it("updates the project's current deployment", async () => {
    const { repositories, data } = createInMemoryRepositories({ projects: [project], deployments: [deployment] });
    const unitOfWork = createUnitOfWorkStub(repositories);
    const now = () => "2024-03-01T00:00:00.000Z";

    const result = await activateDeploymentFeature({ unitOfWork, now }, deployment.id);

    expect(result.id).toBe(deployment.id);
    expect(data.projects[0]?.currentDeploymentId).toBe(deployment.id);
    expect(data.projects[0]?.updatedAt).toBe(now());
  });

  it("throws when the deployment is missing", async () => {
    const { repositories } = createInMemoryRepositories({ projects: [project] });
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(activateDeploymentFeature({ unitOfWork, now: () => project.updatedAt }, "missing"))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws when the owning project is missing", async () => {
    const { repositories } = createInMemoryRepositories({ deployments: [deployment] });
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(activateDeploymentFeature({ unitOfWork, now: () => project.updatedAt }, deployment.id))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
