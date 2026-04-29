# AGENTS.md — YACS Workspace Guide

## Workspace Structure

| Package | Location | Purpose |
|---|---|---|
| `@yacs/types` | `shared/types/` | Shared TypeScript interfaces |
| `@yacs/api` | `packages/yacs-api/` | Express REST API |
| `@yacs/tui` | `packages/yacs-tui/` | Ink + React TUI CLI |

Monorepo managed by **npm workspaces**. Root `package.json` lists `"packages/*", "shared/*"`.

## Commands

```bash
npm install              # install all workspace deps (run at root)
npm run build            # build all packages
npm run build -w @yacs/api   # build single package
npm run dev -w @yacs/api     # dev watch mode (tsx watch)
npm run start -w @yacs/api   # run built output
```

**Dependency order for builds:** `@yacs/types` → `@yacs/api`, `@yacs/tui`
Both api and tui reference types via tsconfig `references`.

## Tech Stack

- **TypeScript** — NodeNext modules, strict mode, composite projects
- **tsx** — zero-config TS execution (dev watch, no ts-node needed)
- **Express + cors** — API server (port 3000, or `$PORT`)
- **ink + React** — TUI rendering
- **meow** — CLI argument parsing in tui

## API

Runs on `http://localhost:3000` by default. Override with `$PORT`.

**Endpoints:**
- `GET /projects` — list all
- `POST /projects` — create (body: `{ name }`)
- `GET /projects/:id` — get one
- `PATCH /projects/:id` — update (body: `{ name?, status? }`)
- `GET /projects/:id/deployments` — list deployments
- `POST /projects/:id/deployments` — create deployment
- `POST /deployments/:id/revert` — revert to previous deployment

**Storage:** in-memory (`Map`). Persists only while server runs.

## TUI CLI

Bin entry: `yacs` → `dist/cli.js`. Run with `npm start -w @yacs/tui -- <command>`.

**Commands:**
- `yacs projects list` — fetch and display projects
- `yacs deploy <project-dir>` — runs `npm run lint` → `npm run test` → `npm run build` in target dir, then uploads to API
- `yacs revert <deployment-id>` — revert deployment
- `yacs project update <id> [--name X] [--status Y]` — update project

**API URL:** defaults to `http://localhost:3000`, override with `--api-url` or `$YACS_API_URL`.

## Deploy Flow

For vite-based projects only. The TUI executes in the target project directory:
1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. POSTs build metadata to `POST /projects/:id/deployments`

## Adding a New Package

1. Create directory under `packages/` or `shared/`
2. Add `package.json` with `"name": "@yacs/<name>"`
3. Add `tsconfig.json` extending `../../tsconfig.base.json`
4. If depending on `@yacs/types`, add reference in tsconfig
5. Run `npm install` at root to link
