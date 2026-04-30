import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { createDeployment, type Deployment } from "../../domain/deployment.js";
import type { Project } from "../../domain/project.js";
import type { DeploymentRepository, ProjectRepository, Repositories } from "../../domain/repositories.js";
import * as schema from "./schema.js";

type DatabaseClient = NodePgDatabase<typeof schema>;
type DbExecutor = Pick<DatabaseClient, "select" | "insert" | "update" | "delete">;

type ProjectRow = typeof schema.projects.$inferSelect;
type DeploymentRow = typeof schema.deployments.$inferSelect;

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    currentDeploymentId: row.currentDeploymentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapDeployment(row: DeploymentRow): Deployment {
  return createDeployment({
    id: row.id,
    projectId: row.projectId,
    buildOutput: row.buildOutput,
    url: row.url,
    createdAt: row.createdAt,
  });
}

function createProjectRepository(database: DbExecutor): ProjectRepository {
  return {
    async list() {
      const rows = await database.select().from(schema.projects).orderBy(asc(schema.projects.createdAt));
      return rows.map(mapProject);
    },

    async findById(id) {
      const rows = await database.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
      return rows[0] ? mapProject(rows[0]) : null;
    },

    async create(project) {
      const rows = await database.insert(schema.projects).values(project).returning();
      const row = rows.at(0);
      if (!row) {
        throw new Error("Failed to create project");
      }
      return mapProject(row);
    },

    async update(project) {
      const rows = await database
        .update(schema.projects)
        .set({
          name: project.name,
          status: project.status,
          currentDeploymentId: project.currentDeploymentId,
          updatedAt: project.updatedAt,
        })
        .where(eq(schema.projects.id, project.id))
        .returning();

      const row = rows.at(0);
      if (!row) {
        throw new Error("Failed to update project");
      }
      return mapProject(row);
    },

    async delete(id) {
      await database.delete(schema.projects).where(eq(schema.projects.id, id));
    },
  };
}

function createDeploymentRepository(database: DbExecutor): DeploymentRepository {
  return {
    async listByProjectId(projectId) {
      const rows = await database
        .select()
        .from(schema.deployments)
        .where(eq(schema.deployments.projectId, projectId))
        .orderBy(asc(schema.deployments.createdAt));

      return rows.map(mapDeployment);
    },

    async findById(id) {
      const rows = await database.select().from(schema.deployments).where(eq(schema.deployments.id, id)).limit(1);
      return rows[0] ? mapDeployment(rows[0]) : null;
    },

    async create(deployment) {
      const rows = await database.insert(schema.deployments).values(deployment).returning();
      const row = rows.at(0);
      if (!row) {
        throw new Error("Failed to create deployment");
      }
      return mapDeployment(row);
    },
  };
}

export function createRepositories(database: DbExecutor): Repositories {
  return {
    projects: createProjectRepository(database),
    deployments: createDeploymentRepository(database),
  };
}
