# TUI UX Improvements and Vertical-Slice Refactor

## Goal

Polish the YACS TUI with several UX fixes and reorganize its internals from a
single monolithic `App.tsx` into a vertical-slice / screaming-architecture
layout where each user-visible operation lives in its own folder.

## User Preferences

1. **Full-screen TUI** — the app must occupy the whole terminal width and
   height.
2. **No backend URL in the chrome** — drop the `[ http://localhost:3000 ]`
   indicator from the header.
3. **Global error popup** — any uncaught exception or rejected promise must be
   surfaced as a modal with the failure description, never written to stdout
   on top of the rendered UI.
4. **Project code path is user-supplied** — when creating a project or pushing
   a new deployment, the user enters the relative path to the source dir (no
   more hardcoded `PROJECT_DIR`).
5. **Backspace must edit text inputs**, not navigate. Cancel inside text-input
   forms moves to a different binding (`Ctrl+B`).
6. **Vertical-slice / screaming architecture** — folder names should map to
   user-visible operations, each owning its UI, keymap, and use-case logic.

## Behavior Changes

### Full-screen frame
`AppShell` reads `useTerminalDimensions()` and applies `width`/`height` on the
outer `<box>`. The header no longer renders the API URL.

### Captured child-process output
`useRunBuildAndDeploy` runs `npm run lint`, `npm run test`, `npm run build`
with `stdio: ["ignore", "pipe", "pipe"]` (was `"inherit"`). Child stdout/stderr
are captured into an in-memory string. On any failure, an `Error` is thrown
containing the step label, the command, and the tail of the captured output.

This fixes the bug where `sh: eslint: command not found` (and similar) was
being printed directly into the terminal, corrupting the TUI frame buffer.

### Global error popup
A `FatalErrorProvider` registers `process.on("uncaughtException", ...)` and
`process.on("unhandledRejection", ...)`. The matching `FatalErrorOverlay`
renders a red double-bordered modal with the message (multi-line) and the
first 6 stack frames. Any key dismisses it; `Esc` quits with code 1.

The build-and-deploy hook funnels its errors through `reportError(err)` so
shell failures end up in the same overlay.

### Project path input
A new `resolveProjectDir(input)` helper resolves relative paths against
`process.cwd()` and validates the directory exists and contains a
`package.json`. Used by:

- `CreateProjectScreen` — two-step form: `name >` then `path >`. Pressing
  Enter on `name` advances focus to `path`; Enter on `path` submits.
- `DeployProjectScreen` — single `path >` input opened with `[N]` from
  `ProjectDetailScreen`.

### Cancel binding
Inside `create`, `update`, and `deploy` views the cancel/back action moved
from `Backspace` to `Ctrl+B`. `Backspace` now flows naturally to the focused
`<input>`. Backspace still navigates back from the read-only `detail` view.

## Architecture

The single ~700-line `App.tsx` was decomposed into a thin shell plus shared
infrastructure plus one folder per feature. The folder names "scream" what
the application does.

```
apps/yacs-tui/src/
├── App.tsx                              # providers + router only
├── index.tsx
├── shared/
│   ├── theme.ts                         # color palette
│   ├── format.ts                        # pad, fmtDate
│   ├── paths.ts                         # resolveProjectDir
│   ├── types.ts                         # Deployment, View
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

### Design rules

- **One feature = one folder.** Each contains its UI, its keymap (its own
  `useKeyboard`), and its use-case logic.
- **Cross-cutting state via context**, never via prop-drilling: API URL,
  status line, view + selection, confirm modal, fatal error, projects list.
- **Decentralized keyboard.** Every screen and overlay registers its own
  `useKeyboard` and short-circuits when an overlay is active or when its view
  isn't current. There is no global key-routing switch.
- **Shared use cases live where they're shared.** `runBuildAndDeploy` is in
  `shared/` because both `create-project` and `deploy-project` use it.
  `useDeleteProject` and `useActivateDeployment` live in their own feature
  folders and are imported by the screens that trigger them.

## File Changes

### Added
- `shared/theme.ts`, `shared/format.ts`, `shared/paths.ts`, `shared/types.ts`
- `shared/runBuildAndDeploy.ts`
- `shared/ui/AppShell.tsx`
- `shared/overlays/ConfirmOverlay.tsx`, `shared/overlays/FatalErrorOverlay.tsx`
- `shared/contexts/{Api,Status,View,Confirm,FatalError,Projects}Context.tsx`
- `features/list-projects/ListProjectsScreen.tsx`
- `features/project-detail/{ProjectDetailScreen.tsx,useDeployments.ts}`
- `features/create-project/CreateProjectScreen.tsx`
- `features/update-project/UpdateProjectScreen.tsx`
- `features/deploy-project/DeployProjectScreen.tsx`
- `features/delete-project/useDeleteProject.ts`
- `features/activate-deployment/useActivateDeployment.ts`

### Modified
- `apps/yacs-tui/src/App.tsx` — collapsed to a thin shell composing providers
  and a `view`-based `Router`.

### Removed
- `apps/yacs-tui/src/projects.tsx` — replaced by `ProjectsContext` +
  `useProjects()` hook.

## Implementation Steps

1. Add full-screen frame (`useTerminalDimensions`) and remove the API URL
   indicator from the header.
2. Add `FatalErrorProvider` listening to `uncaughtException` /
   `unhandledRejection` plus a matching overlay.
3. Capture child-process stdout/stderr in `runBuildAndDeploy` and rethrow with
   the captured tail; route the failure into the overlay.
4. Add `resolveProjectDir` and wire user-supplied paths into the create and
   deploy flows.
5. Move cancel binding to `Ctrl+B` inside text-input views; keep `Backspace`
   as back-nav only on the read-only detail view.
6. Extract shared utilities, contexts, and overlays.
7. Carve each user-visible operation into its own feature folder; turn cross-
   feature use cases (delete, activate, build-and-deploy) into hooks.
8. Reduce `App.tsx` to provider composition + a `Router` that switches on
   `view`.
9. `bun build` + `tsc --noEmit` clean.

## Status: Completed
- [x] Full-screen layout, header without API URL
- [x] Global fatal-error popup (process-level handlers)
- [x] Captured child-process output (no more terminal corruption)
- [x] User-supplied project path for create + deploy
- [x] `Ctrl+B` cancel inside text-input views
- [x] Vertical-slice / screaming architecture refactor
- [x] Build + typecheck clean
- [x] README updated with new architecture
