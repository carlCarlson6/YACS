import { describe, expect, it } from "vitest";
import { buildDeploymentUrl, createDeployment } from "./deployment.js";

describe("createDeployment", () => {
  it("returns a deployment object with provided fields", () => {
    const deployment = createDeployment({
      id: "deploy_1",
      projectId: "proj_1",
      buildOutput: "dist",
      url: "https://example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
      status: "processing",
      totalSize: 10,
      fileCount: 2,
      uploadExpiresAt: null,
    });

    expect(deployment).toMatchObject({
      id: "deploy_1",
      projectId: "proj_1",
      buildOutput: "dist",
      status: "processing",
      fileCount: 2,
    });
  });
});

describe("buildDeploymentUrl", () => {
  it("creates a predictable vanity domain", () => {
    expect(buildDeploymentUrl("marketing", "deploy_123"))
      .toBe("https://marketing-deploy_123.yacs.local");
  });
});
