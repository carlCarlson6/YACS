import { z } from "zod";

export const projectStatusSchema = z.enum(["running", "stopped"]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: projectStatusSchema,
  currentDeploymentId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const deploymentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  buildOutput: z.string(),
  url: z.string(),
  createdAt: z.string(),
});
export type Deployment = z.infer<typeof deploymentSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  name: z.string().min(1).optional(),
  status: projectStatusSchema.optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const deployRequestSchema = z.object({
  projectId: z.string(),
  buildOutput: z.string(),
});
export type DeployRequest = z.infer<typeof deployRequestSchema>;

export const revertRequestSchema = z.object({
  deploymentId: z.string(),
});
export type RevertRequest = z.infer<typeof revertRequestSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiSchemas = {
  project: projectSchema,
  projectStatus: projectStatusSchema,
  deployment: deploymentSchema,
  createProjectInput: createProjectInputSchema,
  updateProjectInput: updateProjectInputSchema,
  deployRequest: deployRequestSchema,
  revertRequest: revertRequestSchema,
  apiError: apiErrorSchema,
};
