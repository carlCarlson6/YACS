# YACS API PostgreSQL + Drizzle Plan

## Goal
Move `@yacs/api` from in-memory storage to a real PostgreSQL database managed through Drizzle ORM, with local Docker Compose support and tracked environment templates.

## User Preferences
1. **Database**: PostgreSQL
2. **ORM**: Drizzle ORM with Drizzle Kit for schema/migrations
3. **Scope**: Backend only, no implementation yet
4. **Local dev**: Docker Compose for Postgres
5. **Schema**: Explicit tables and relations for projects and deployments
6. **Config**: Add `.env` files needed for local development and track the template files in git

## Schema Design

### `projects`
- `id` UUID primary key
- `name` text, required
- `status` enum, values aligned with current API (`running`, `stopped`)
- `current_deployment_id` UUID, nullable, FK to `deployments.id`
- `created_at` timestamp with time zone
- `updated_at` timestamp with time zone

Notes:
- Keep `current_deployment_id` nullable so a project can exist before its first deployment.
- Add a unique constraint on `name` if project names must remain stable identifiers.

### `deployments`
- `id` UUID primary key
- `project_id` UUID, required, FK to `projects.id` with `on delete cascade`
- `build_output` text, required
- `url` text, required, unique
- `created_at` timestamp with time zone

Notes:
- A project has many deployments.
- The project's active deployment is represented by `projects.current_deployment_id`.
- Deleting a project should remove its deployments automatically.

### Relation Rules
- `projects 1 -> N deployments`
- `projects.current_deployment_id -> deployments.id`
- `deployments.project_id -> projects.id`

## File Changes

### 1. `apps/yacs-api/drizzle.config.ts` (New)
Drizzle Kit config for migrations and schema generation.

### 2. `apps/yacs-api/src/db/schema.ts` (New)
Define the PostgreSQL tables, enum types, and relations.

### 3. `apps/yacs-api/src/db/client.ts` (New)
Create the database client using `pg` and Drizzle.

### 4. `apps/yacs-api/src/db/index.ts` (New)
Central export point for schema, client, and future database helpers.

### 5. `apps/yacs-api/src/index.ts` (Updated)
Replace in-memory maps with database-backed repository logic and keep the existing route surface intact.

### 6. `apps/yacs-api/src/routes/*.ts` (Updated)
Refactor route handlers to use DB queries instead of `Map` state.

### 7. `apps/yacs-api/package.json` (Updated)
Add Drizzle/Postgres runtime and migration dependencies.

### 8. `docker-compose.yml` (New)
Run a local PostgreSQL container with a persistent volume and port mapping.

### 9. `apps/yacs-api/.env.example` (New, tracked)
Document required API env vars such as `DATABASE_URL` and `PORT`.

### 10. `apps/yacs-api/.env` (Local only)
Developer-specific values for local runs. If a committed template is preferred instead, use `.env.example` and keep `.env` ignored.

### 11. `.gitignore` (Updated only if needed)
Ensure the repo ignores local secrets while allowing tracked env templates.

### 12. `plans/README.md` (Updated)
Add this plan to the index.

## Implementation Steps
1. Define the PostgreSQL schema in Drizzle, including the `projects` and `deployments` tables plus their foreign keys.
2. Add a Drizzle config and database client setup for the API package.
3. Create Docker Compose for local PostgreSQL with a named volume and stable connection settings.
4. Add env templates and confirm the gitignore rules match the intended tracked vs local-only files.
5. Refactor API routes to read and write through the database while keeping endpoint behavior stable.
6. Replace seed/in-memory initialization with database migrations and optional seed data.
7. Verify the build and migration workflow once implementation starts.

## Status
Pending
