import { Hono } from "hono";
import { Db } from "../infrastructure/drizzle";
import { projectsTable } from "./projects.schema";

export const mapListProjectsEndpoint = (app: Hono, db: Db) => app.get(
  "/api/projects", 
  async (c) => {
    const projects = await db
      .select()
      .from(projectsTable)

    return c.json(projects);
  }
);