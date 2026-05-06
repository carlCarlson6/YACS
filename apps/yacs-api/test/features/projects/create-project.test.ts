import { describe, expect, it, vi } from "vitest";
import { createProjectFeature } from "../../../src/features/projects/create-project.js";
import { createInMemoryRepositories } from "../../in-memory-repositories.js";

describe("createProjectFeature", () => {
  it("creates a trimmed project with generated metadata", async () => {
    const { repositories, data } = createInMemoryRepositories();
    const now = vi.fn(() => "2024-01-01T00:00:00.000Z");
    const generateId = vi.fn(() => "proj_123");

    const project = await createProjectFeature(
      { repositories, generateId, now },
      { name: "  Launch Site  " }
    );

    expect(project).toMatchObject({
      id: "proj_123",
      name: "Launch Site",
      status: "running",
    });
    expect(now).toHaveBeenCalledTimes(2);
    expect(data.projects).toHaveLength(1);
    expect(data.projects[0]?.name).toBe("Launch Site");
  });
});
