import { describe, expect, it } from "vitest";
import { createProjectDeployment } from "../../../src/features/projects/create-project-deployment.js";
import { createInMemoryRepositories } from "../../in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../unit-of-work.stub.js";
import { NotFoundError } from "../../../src/domain/errors.js";

const baseProject = {
  id: "proj_1",
  name: "marketing",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("createProjectDeployment", () => {
  it("creates a deployment and makes it current", async () => {
    const { repositories, data } = createInMemoryRepositories({ projects: [baseProject] });
    const unitOfWork = createUnitOfWorkStub(repositories);
    const now = () => "2024-04-01T00:00:00.000Z";

    const deployment = await createProjectDeployment(
      { repositories, unitOfWork, generateId: () => "deploy_1", now },
      baseProject.id,
      "dist"
    );

    expect(deployment.id).toBe("deploy_1");
    expect(deployment.url).toBe("https://marketing-deploy_1.yacs.local");
    expect(data.projects[0]?.currentDeploymentId).toBe("deploy_1");
    expect(data.deployments).toHaveLength(1);
  });

  it("throws when the project is missing", async () => {
    const { repositories } = createInMemoryRepositories();
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      createProjectDeployment(
        { repositories, unitOfWork, generateId: () => "deploy_1", now: () => "2024-04-01" },
        "missing",
        "dist"
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
