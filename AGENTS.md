# AGENTS.md — YACS Workspace Guide

## Workspace Structure

| Package | Location | Purpose |
|---|---|---|
| `@yacs/schemas` | `shared/schemas/` | Zod schemas + inferred types |
| `@yacs/api` | `apps/yacs-api/` | Express REST API |
| `@yacs/tui` | `apps/yacs-tui/` | Ink + React TUI CLI |

Monorepo managed by **npm workspaces**. Root `package.json` lists `"apps/*", "shared/*"`.

## Commands

```bash
npm install              # install all workspace deps (run at root)
npm run build            # build all packages
npm run build -w @yacs/api   # build single package
npm run dev -w @yacs/api     # dev watch mode (tsx watch)
npm run start -w @yacs/api   # run built output
npm run test -w @yacs/tui     # run Vitest unit suite for the TUI
npm run test:watch -w @yacs/tui  # watch mode for the TUI tests
```

**Dependency order for builds:** `@yacs/schemas` → `@yacs/api`, `@yacs/tui`
Both api and tui reference schemas via tsconfig `references`.

## Testing

- TUI tests use Vitest + Testing Library. Helpers live in `apps/yacs-tui/tests/test-utils` (`renderWithProviders`, `opentuiKeyboard`).
- Run `npm run test -w @yacs/tui` (or `npm run test:watch -w @yacs/tui`) to execute the suite; root `npm test` proxies to the TUI tests.

## Tech Stack

- **TypeScript** — NodeNext modules, strict mode, composite projects
- **tsx** — zero-config TS execution (dev watch, no ts-node needed)
- **Express + cors** — API server (port 3000, or `$PORT`)
- **ink + React** — TUI rendering
- **meow** — CLI argument parsing in tui

## API

Runs on `http://localhost:3000` by default. Override with `$PORT`.

**Endpoints:**
- `GET /api/projects` — list all
- `POST /api/projects` — create (body: `{ name }`)
- `GET /api/projects/:id` — get one
- `PATCH /api/projects/:id` — update (body: `{ name?, status? }`)
- `GET /api/projects/:id/deployments` — list deployments
- `POST /api/projects/:id/deployments` — create deployment
- `POST /api/deployments/:id/revert` — revert to previous deployment

**Storage:** in-memory (`Map`). Persists only while server runs.

## TUI CLI

Bin entry: `yacs` → `dist/cli.js`. Run with `npm start -w @yacs/tui -- <command>`.

**Commands:**
- `yacs projects list` — fetch and display projects
- `yacs deploy <project-dir>` — runs `npm run lint` → `npm run test` → `npm run build` in target dir, then uploads to API
- `yacs revert <deployment-id>` — revert deployment
- `yacs project update <id> [--name X] [--status Y]` — update project

**API URL:** defaults to `http://localhost:3000/api`, override with `--api-url` or `$YACS_API_URL`.

## TUI UI Rules

- In edit forms, autofocus the primary input when the screen opens.
- When a form has multiple inputs, `Tab` moves focus to the next field and wraps back to the first field.
- Align field labels slightly lower so label text lines up with the input text, not the box top.

## Deploy Flow

For vite-based projects only. The TUI executes in the target project directory:
1. `npm install`
2. `npm run lint` if the script exists
3. `npm run test` if the script exists
4. `npm run build` and fail fast if the script is missing
5. POSTs build metadata to `POST /api/projects/:id/deployments`

## Adding a New Package

1. Create directory under `apps/` or `shared/`
2. Add `package.json` with `"name": "@yacs/<name>"`
3. Add `tsconfig.json` extending `../../tsconfig.base.json`
4. If depending on `@yacs/types`, add reference in tsconfig
5. Run `npm install` at root to link
