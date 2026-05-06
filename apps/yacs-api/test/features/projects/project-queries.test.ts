import { describe, expect, it } from "vitest";
import { listProjects } from "../../../src/features/projects/list-projects.js";
import { getProject } from "../../../src/features/projects/get-project.js";
import { deleteProjectFeature } from "../../../src/features/projects/delete-project.js";
import { listProjectDeployments } from "../../../src/features/projects/list-project-deployments.js";
import { createInMemoryRepositories } from "../../in-memory-repositories.js";
import { NotFoundError } from "../../../src/domain/errors.js";

const baseProject = {
  id: "proj_1",
  name: "marketing",
  status: "running" as const,
  currentDeploymentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const secondaryProject = {
  ...baseProject,
  id: "proj_2",
  name: "docs",
};

const baseDeployment = {
  id: "deploy_1",
  projectId: baseProject.id,
  buildOutput: "dist",
  url: "https://proj-1.example.com",
  status: "active" as const,
  createdAt: "2024-02-01T00:00:00.000Z",
};

describe("project query features", () => {
  it("listProjects returns all persisted projects", async () => {
    const { repositories } = createInMemoryRepositories({ projects: [baseProject, secondaryProject] });

    const projects = await listProjects(repositories);

    expect(projects.map((p) => p.id)).toEqual([baseProject.id, secondaryProject.id]);
  });

  it("getProject returns the requested entity", async () => {
    const { repositories } = createInMemoryRepositories({ projects: [baseProject] });

    const project = await getProject(repositories, baseProject.id);

    expect(project).toMatchObject({ id: baseProject.id, name: baseProject.name });
  });

  it("getProject throws when missing", async () => {
    const { repositories } = createInMemoryRepositories();

    await expect(getProject(repositories, "missing"))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  it("deleteProjectFeature removes the entity", async () => {
    const { repositories, data } = createInMemoryRepositories({ projects: [baseProject] });

    const result = await deleteProjectFeature(repositories, baseProject.id);

    expect(result).toEqual({ deleted: true });
    expect(data.projects).toHaveLength(0);
  });

  it("deleteProjectFeature errors when missing", async () => {
    const { repositories } = createInMemoryRepositories();

    await expect(deleteProjectFeature(repositories, baseProject.id))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  it("listProjectDeployments returns deployments for existing project", async () => {
    const { repositories } = createInMemoryRepositories({
      projects: [baseProject],
      deployments: [baseDeployment],
    });

    const deployments = await listProjectDeployments(repositories, baseProject.id);

    expect(deployments).toHaveLength(1);
    expect(deployments[0]?.id).toBe(baseDeployment.id);
  });

  it("listProjectDeployments throws when project does not exist", async () => {
    const { repositories } = createInMemoryRepositories();

    await expect(listProjectDeployments(repositories, baseProject.id))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
