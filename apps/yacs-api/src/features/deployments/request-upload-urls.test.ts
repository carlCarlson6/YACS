import { describe, expect, it } from "vitest";
import { requestUploadUrlsFeature } from "./request-upload-urls.js";
import { createInMemoryRepositories } from "../../../test/in-memory-repositories.js";
import { createUnitOfWorkStub } from "../../../test/unit-of-work.stub.js";
import { NotFoundError } from "../../domain/errors.js";

const project = {
  id: "proj_1",
  name: "blog",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("requestUploadUrlsFeature", () => {
  it("records a pending deployment and returns SAS URLs", async () => {
    const { repositories, data } = createInMemoryRepositories({ projects: [project] });
    const unitOfWork = createUnitOfWorkStub(repositories);

    const result = await requestUploadUrlsFeature(
      {
        unitOfWork,
        generateId: () => "deploy_req",
        now: () => "2024-05-01T00:00:00.000Z",
        log: () => {},
        generateUploadSasUrl: (blobName) => `https://storage/${blobName}?sig`,
      },
      project.id,
      {
        files: [
          { path: "index.html", size: 10 },
          { path: "assets/app.js", size: 5 },
        ],
      } as any
    );

    expect(result).toMatchObject({
      deploymentId: "deploy_req",
      uploadUrls: [
        { path: "index.html", sasUrl: expect.stringContaining("index.html") },
        { path: "assets/app.js", sasUrl: expect.stringContaining("assets/app.js") },
      ],
      manifestUrl: expect.stringContaining("manifest.json"),
    });
    expect(data.deployments).toHaveLength(1);
    expect(data.deployments[0]?.status).toBe("pending_upload");
    expect(data.deployments[0]?.totalSize).toBe(15);
  });

  it("throws when the project cannot be found", async () => {
    const { repositories } = createInMemoryRepositories();
    const unitOfWork = createUnitOfWorkStub(repositories);

    await expect(
      requestUploadUrlsFeature(
        {
          unitOfWork,
          generateId: () => "deploy_req",
          now: () => project.createdAt,
          log: () => {},
          generateUploadSasUrl: () => "",
        },
        "missing",
        { files: [] } as any
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
