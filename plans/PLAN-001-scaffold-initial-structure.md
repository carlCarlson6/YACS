# PLAN-001: Scaffold Initial Structure

**Status:** completed
**Created:** 2026-04-29

## Objective

Scaffold the YACS monorepo with npm workspaces, shared types, yacs-api, and yacs-tui packages.

## Decisions

| Aspect | Choice | Rationale |
|---|---|---|
| Monorepo tool | npm workspaces | Simplest, already using npm |
| API storage | In-memory | Start simple, swap later |
| CLI parser | meow | Minimal, popular with ink |
| TS executor | tsx | Faster than ts-node, zero-config |

## Directory Structure

```
yet-another-cloud-service/
├── README.md
├── package.json
├── tsconfig.base.json
├── .gitignore
├── plans/
├── packages/
│   ├── yacs-api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   ├── yacs-tui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── cli.ts
│   │       └── components/
│   └── shared/
│       └── types/
│           ├── package.json
│           ├── tsconfig.json
│           └── src/index.ts
```

## Execution Steps (one commit per step)

### Step 1: Root workspace
- `package.json` with workspaces: `["packages/*", "shared/*"]`
- Root scripts: `dev`, `build`, `test`
- `tsconfig.base.json` with shared compiler options
- `.gitignore` (node_modules, dist, .env, *.tsbuildinfo)
- **Commit:** `chore: initialize npm workspace and shared config`

### Step 2: shared/types
- `package.json` (name: `@yacs/types`, private, no runtime deps)
- `tsconfig.json` (extends base, `emitDeclarationOnly`)
- `src/index.ts` exporting:
  - `Project` interface (id, name, status, createdAt, updatedAt)
  - `Deployment` interface (id, projectId, buildOutput, url, createdAt)
  - `ProjectStatus` union type (`"running"` | `"stopped"`)
  - `CreateProjectInput`, `UpdateProjectInput` request types
  - `DeployRequest`, `RevertRequest` API types
- **Commit:** `feat(shared): add @yacs/types package with shared interfaces`

### Step 3: yacs-api
- `package.json` (name: `@yacs/api`, deps: express, cors, `@yacs/types`, devDeps: tsx, @types/*)
- `tsconfig.json` (extends base)
- `src/index.ts`: Express app with routes + in-memory store
- Endpoints:
  - `GET /projects`
  - `POST /projects`
  - `PATCH /projects/:id`
  - `POST /projects/:id/deployments`
  - `POST /deployments/:id/revert`
  - `GET /projects/:id/deployments`
- Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist)
- **Commit:** `feat(api): scaffold Express server with project and deployment endpoints`

### Step 4: yacs-tui
- `package.json` (name: `@yacs/tui`, deps: ink, react, meow, `@yacs/types`, devDeps: tsx, @types/*)
- `tsconfig.json` (extends base, JSX enabled)
- `src/cli.ts`: meow CLI entry with command routing
- `src/components/`: placeholder ink components structure
- Commands: `projects list`, `deploy <project>`, `revert <id>`, `project update <id>`
- Deploy flow: run lint → test → build in target dir, POST dist/ to API
- Bin: `{ "yacs": "dist/cli.js" }`
- Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist/cli.js)
- **Commit:** `feat(tui): scaffold ink CLI with deploy flow`

### Step 5: AGENTS.md
- Document workspace commands and shortcuts
- Package boundaries and dependency order
- Deploy flow specifics (vite-only, npm-only)
- Test conventions
- **Commit:** `docs: add AGENTS.md with repo conventions and commands`

## Plan Rules

1. Each structural step gets its own commit
2. Plan creation itself is a separate initial commit
3. Run `npm install` at root after each package addition
4. Verify `npm run build` succeeds at root before moving to next step
5. AGENTS.md captures verified facts only — no speculation
