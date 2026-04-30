import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", ["running", "stopped"]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: projectStatusEnum("status").notNull().default("running"),
  currentDeploymentId: uuid("current_deployment_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  buildOutput: text("build_output").notNull(),
  url: text("url").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  deployments: many(deployments),
  currentDeployment: one(deployments, {
    fields: [projects.currentDeploymentId],
    references: [deployments.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
}));

export const schema = {
  projects,
  deployments,
};
