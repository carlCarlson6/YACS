# PLAN-010: yacs-web

## Goal

Create a web application (`apps/yacs-web`) to view and manage projects via a browser UI. It should replicate the same features as the TUI except for the deploy functionality, using the same matrix/cyberpunk visual theme.

## User Preferences

- **Location**: `apps/yacs-web`
- **Stack**: React + Vite + Tailwind + Headless UI + Zustand
- **UI Style**: Match TUI's matrix/cyberpunk theme (green-on-black, custom colors)
- **State Management**: Zustand for global state

## File Changes

### New Files

```
apps/yacs-web/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   └── client.ts
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   └── StatusBar.tsx
    │   ├── projects/
    │   │   ├── ProjectTable.tsx
    │   │   ├── ProjectRow.tsx
    │   │   └── ProjectForm.tsx
    │   ├── deployments/
    │   │   ├── DeploymentTable.tsx
    │   │   └── DeploymentRow.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Modal.tsx
    │       ├── Table.tsx
    │       ├── Badge.tsx
    │       └── Spinner.tsx
    ├── pages/
    │   ├── ProjectsPage.tsx
    │   └── ProjectDetailPage.tsx
    ├── stores/
    │   ├── useApiStore.ts
    │   ├── useProjectsStore.ts
    │   ├── useProjectDetailStore.ts
    │   └── useUIStore.ts
    ├── hooks/
    │   └── useApi.ts
    └── types/
        └── index.ts
```

### Modified Files

- `package.json` (root): Add `"apps/yacs-web"` to workspaces
- `tsconfig.base.json`: Add project reference for yacs-web (if needed)

## Implementation Steps

### 1. Project Setup
- Initialize Vite + React + TypeScript project in `apps/yacs-web`
- Add Tailwind CSS with custom theme colors matching TUI palette
- Configure environment variables (`VITE_YACS_API_URL`)
- Add to root workspaces and link `@yacs/schemas`

### 2. Dependencies
- `react`, `react-dom`, `react-router-dom`
- `zustand` — state management
- `@headlessui/react` — accessible modals/dropdowns
- `axios` — HTTP client
- `clsx`, `tailwind-merge` — class utilities
- `date-fns` — date formatting

### 3. Tailwind Configuration
- Extend colors with TUI palette (yacs.bg, yacs.primary, yacs.border, etc.)
- Configure content paths

### 4. Zustand Stores

**useApiStore.ts** — API base URL state

**useProjectsStore.ts** — Projects list + CRUD (fetch, create, update, delete)

**useProjectDetailStore.ts** — Single project + deployments + activate

**useUIStore.ts** — Modal states (create, update, delete)

### 5. API Client
- Axios instance with base URL from env or localhost:3000/api
- Interceptors for error handling

### 6. Base UI Components
- Button (primary/secondary/danger variants)
- Input
- Badge (running/stopped/live status)
- Spinner (loading indicator)
- Table (reusable wrapper)
- Modal (Headless UI Dialog)

### 7. Layout Components
- AppShell — Header + content area + status bar
- StatusBar — Bottom status display

### 8. Pages

**ProjectsPage** (`/`)
- Header with title "// Y A C S //"
- Project table (name, status, updated, actions)
- Create project modal

**ProjectDetailPage** (`/project/:id`)
- Back navigation
- Project info card
- Deployment table with activate functionality
- Update project modal

### 9. Routing
- React Router with routes: `/` and `/project/:id`

### 10. Build & Test
- Verify build succeeds
- Test all CRUD operations

## Excluded Features (vs TUI)

- Deploy project (requires local build pipeline - not applicable for web)
- Keyboard-only navigation (mouse/click enabled)
- Fatal error overlay (use React error boundary instead)

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project name/status |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/deployments` | List deployments |
| POST | `/api/deployments/:id/activate` | Set deployment as LIVE |

## Status

**Pending**