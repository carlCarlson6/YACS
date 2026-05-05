import { describe, expect, it } from "vitest";
import { updateProjectFeature } from "./update-project.js";
import { createInMemoryRepositories } from "../../../test/in-memory-repositories.js";
import { NotFoundError } from "../../domain/errors.js";

const existingProject = {
  id: "proj_1",
  name: "Docs",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("updateProjectFeature", () => {
  it("updates mutable fields and timestamp", async () => {
    const { repositories } = createInMemoryRepositories({ projects: [existingProject] });
    const now = () => "2024-02-01T00:00:00.000Z";

    const result = await updateProjectFeature({ repositories, now }, existingProject.id, {
      name: "Docs v2",
      status: "stopped",
    });

    expect(result).toMatchObject({
      name: "Docs v2",
      status: "stopped",
      updatedAt: "2024-02-01T00:00:00.000Z",
    });
  });

  it("throws when the project does not exist", async () => {
    const { repositories } = createInMemoryRepositories();

    await expect(
      updateProjectFeature({ repositories, now: () => "2024-02-01" }, "missing", { name: "X" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
