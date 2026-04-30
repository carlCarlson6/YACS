CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "public"."project_status" AS ENUM ('running', 'stopped');

CREATE TABLE "public"."projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "status" "project_status" DEFAULT 'running' NOT NULL,
  "current_deployment_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."deployments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "build_output" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."deployments" ADD CONSTRAINT "deployments_url_unique" UNIQUE ("url");
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_current_deployment_id_deployments_id_fk" FOREIGN KEY ("current_deployment_id") REFERENCES "public"."deployments"("id") ON DELETE set null ON UPDATE no action;
