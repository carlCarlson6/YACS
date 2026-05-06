import { describe, expect, it, vi } from "vitest";
import { completeUploadFeature } from "../../../src/features/deployments/complete-upload.js";
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

const pendingDeployment = {
  id: "deploy_1",
  projectId: baseProject.id,
  buildOutput: "dist",
  url: "https://marketing.example.com",
  status: "processing" as const,
  createdAt: "2024-02-01T00:00:00.000Z",
};

const manifest = {
  files: [{ path: "index.html", size: 10, checksum: "abc" }],
  totalSize: 10,
  uploadedAt: "2024-02-02T00:00:00.000Z",
};

describe("completeUploadFeature", () => {
  it("activates the deployment and logs the event", async () => {
    const { repositories, data } = createInMemoryRepositories({
      projects: [baseProject],
      deployments: [pendingDeployment],
    });
    const unitOfWork = createUnitOfWorkStub(repositories);
    const log = vi.fn();
    const now = () => "2024-02-03T00:00:00.000Z";

    const result = await completeUploadFeature({ unitOfWork, now, log }, pendingDeployment.id, { manifest });

    expect(result.status).toBe("active");
    expect(result.deployment.id).toBe(pendingDeployment.id);
    expect(data.projects[0]?.currentDeploymentId).toBe(pendingDeployment.id);
    expect(data.projects[0]?.updatedAt).toBe(now());
    expect(log).toHaveBeenCalledWith("Upload complete and activated deployment deploy_1");
  });

  it("throws when the deployment is missing", async () => {
    const { repositories } = createInMemoryRepositories({ projects: [baseProject] });
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      completeUploadFeature({ unitOfWork, now: () => manifest.uploadedAt, log: () => {} }, "missing", { manifest })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws when the project is missing", async () => {
    const { repositories } = createInMemoryRepositories({ deployments: [pendingDeployment] });
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      completeUploadFeature({ unitOfWork, now: () => manifest.uploadedAt, log: () => {} }, pendingDeployment.id, { manifest })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
