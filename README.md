# YACS - Yet Another Cloud Service

A cloud service platform that enables users to deploy their web pages with ease.

## Overview

### Components
- A TUI — Terminal User Interface (`@yacs/tui`)
- A backend API (`@yacs/api`)
- Shared Zod schemas (`@yacs/schemas`)

### Features
- List projects with status (running / stopped) and last update time
- Create a project (asks for the project source path)
- Push a new deployment for an existing project
   1. TUI runs `npm run lint`, `npm run test`, `npm run build` in the user-supplied directory
   2. TUI uploads the build output to the backend
   3. Backend serves the deployment behind a generated URL
- Promote any past deployment to LIVE (set as current)
- Delete a project (with confirm)
- Update a project's name and status (`running` / `stopped`)

For now only Vite frontend apps can be deployed, and only `npm` is used to run commands.

## Project Structure

### `@yacs/tui` — Terminal User Interface
**Location:** `apps/yacs-tui/`

Interactive terminal UI built with [OpenTUI](https://github.com/sst/opentui) + React. The codebase follows a **vertical-slice / screaming architecture**: each user-visible operation lives in its own folder.

```
apps/yacs-tui/src/
├── App.tsx                              # thin shell: providers + view router
├── index.tsx
├── shared/
│   ├── theme.ts · format.ts · paths.ts · types.ts
│   ├── runBuildAndDeploy.ts             # used by create + deploy slices
│   ├── ui/AppShell.tsx                  # outer frame, header, status bar, Esc-to-quit
│   ├── overlays/
│   │   ├── ConfirmOverlay.tsx
│   │   └── FatalErrorOverlay.tsx
│   └── contexts/
│       ├── ApiContext.tsx               # API base URL
│       ├── StatusContext.tsx            # status line
│       ├── ViewContext.tsx              # current view + selection indices
│       ├── ConfirmContext.tsx           # openConfirm/closeConfirm
│       ├── FatalErrorContext.tsx        # reportError + global handlers
│       └── ProjectsContext.tsx          # projects list + fetch
└── features/
    ├── list-projects/ListProjectsScreen.tsx
    ├── project-detail/
    │   ├── ProjectDetailScreen.tsx
    │   └── useDeployments.ts
    ├── create-project/CreateProjectScreen.tsx
    ├── update-project/UpdateProjectScreen.tsx
    ├── deploy-project/DeployProjectScreen.tsx
    ├── delete-project/useDeleteProject.ts        # consumed by list + detail
    └── activate-deployment/useActivateDeployment.ts
```

**Architecture rules:**
- One feature = one folder. Each owns its UI, keymap, and use-case logic.
- Cross-cutting state lives in React Context (API, view, status, confirm, fatal error, projects).
- Each screen/overlay registers its own `useKeyboard` and short-circuits when an overlay is active or when its view isn't current — no centralized key router.
- Shared use cases live in `shared/` (`runBuildAndDeploy`); cross-feature use cases live in their own feature folder and are imported by the screens that trigger them (`useDeleteProject`, `useActivateDeployment`).

**UX details:**
- Full-screen layout via `useTerminalDimensions()`.
- Global error popup: any `uncaughtException` / `unhandledRejection` (and any failed `runBuildAndDeploy` step) renders a red modal with the captured stderr/stdout tail. Child processes use piped stdio so their output never bleeds into the rendered frame.
- Project source path is supplied per operation (relative to `process.cwd()`); validated to exist and contain `package.json`.
- Inside text-input forms (`create`, `update`, `deploy`) the cancel binding is **`Ctrl+B`**, leaving `Backspace` to edit text. Backspace still navigates back from the read-only detail view.

**Tech stack:**
- TypeScript + React 18
- [OpenTUI](https://github.com/sst/opentui) (`@opentui/core`, `@opentui/react`)
- Bun (build + dev runtime)

### `@yacs/api` — Backend API
**Location:** `apps/yacs-api/`

RESTful API consumed by the TUI.

**Endpoints:**
- `GET /projects` · `POST /projects` · `GET /projects/:id` · `PATCH /projects/:id` · `DELETE /projects/:id`
- `GET /projects/:id/deployments` · `POST /projects/:id/deployments`
- `POST /deployments/:id/activate` · `POST /deployments/:id/revert`

Storage is in-memory (`Map`) — data persists only while the server runs.

**Tech stack:** TypeScript, Node, Express, cors.

### `@yacs/schemas` — Shared schemas
**Location:** `shared/schemas/`

Zod schemas + inferred types shared between API and TUI.

## Running

```bash
npm install                  # install all workspace deps
npm run build                # build all packages
npm run dev -w @yacs/api     # start API on :3000 (override with $PORT)
npm run dev -w @yacs/tui     # start TUI (defaults to http://localhost:3000, override with $YACS_API_URL)
```
