import { describe, expect, it } from "vitest";
import { createProject } from "./project.js";

describe("createProject", () => {
  const baseInput = {
    id: "proj_1",
    name: "Example",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  it("fills default values", () => {
    const project = createProject(baseInput);

    expect(project).toEqual({
      ...baseInput,
      status: "running",
      currentDeploymentId: null,
    });
  });

  it("respects optional overrides", () => {
    const project = createProject({
      ...baseInput,
      status: "stopped",
      currentDeploymentId: "deploy_1",
    });

    expect(project.status).toBe("stopped");
    expect(project.currentDeploymentId).toBe("deploy_1");
  });
});
