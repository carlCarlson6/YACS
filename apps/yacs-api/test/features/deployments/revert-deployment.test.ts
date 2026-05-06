import { describe, expect, it } from "vitest";
import { revertDeploymentFeature } from "../../../src/features/deployments/revert-deployment.js";
import { createInMemoryRepositories } from "../../in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../unit-of-work.stub.js";
import { NotFoundError, RevertError } from "../../../src/domain/errors.js";

const timestamps = {
  created: "2024-01-01T00:00:00.000Z",
  older: "2024-02-01T00:00:00.000Z",
  newer: "2024-03-01T00:00:00.000Z",
};

function createDeployment(id: string, createdAt: string) {
  return {
    id,
    projectId: "proj_1",
    buildOutput: "dist",
    url: `https://proj-${id}.example.com`,
    createdAt,
    status: "active" as const,
  };
}

describe("revertDeploymentFeature", () => {
  it("reverts to the previous deployment", async () => {
    const { repositories, data } = createInMemoryRepositories({
      projects: [
        {
          id: "proj_1",
          name: "app",
          status: "running",
          currentDeploymentId: "deploy_2",
          createdAt: timestamps.created,
          updatedAt: timestamps.newer,
        },
      ],
      deployments: [
        createDeployment("deploy_1", timestamps.older),
        createDeployment("deploy_2", timestamps.newer),
      ],
    });
    const unitOfWork = createUnitOfWorkStub(repositories);

    const result = await revertDeploymentFeature({ unitOfWork, now: () => "2024-04-01T00:00:00.000Z" }, "deploy_2");

    expect(result.id).toBe("deploy_1");
    expect(data.projects[0]?.currentDeploymentId).toBe("deploy_1");
  });

  it("throws when deployment does not exist", async () => {
    const { repositories } = createInMemoryRepositories();
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      revertDeploymentFeature({ unitOfWork, now: () => timestamps.newer }, "missing")
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws when there is no previous deployment", async () => {
    const { repositories } = createInMemoryRepositories({
      projects: [
        {
          id: "proj_1",
          name: "app",
          status: "running",
          currentDeploymentId: "deploy_1",
          createdAt: timestamps.created,
          updatedAt: timestamps.older,
        },
      ],
      deployments: [createDeployment("deploy_1", timestamps.older)],
    });
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      revertDeploymentFeature({ unitOfWork, now: () => timestamps.newer }, "deploy_1")
    ).rejects.toBeInstanceOf(RevertError);
  });
});
