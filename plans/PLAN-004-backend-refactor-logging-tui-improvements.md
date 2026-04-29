# YACS Backend Refactor, Logging, and TUI Improvements Plan

## Goal
Refactor the YACS backend to split route endpoints into separate files, add observability logging, and improve the TUI with better input handling, fixed re-render issues, and a matrix/cyberpunk theme.

## User Preferences
1. **Backend structure**: Routes split by resource (projects, deployments)
2. **Observability**: Request logging with timestamps, method, URL, status code, response time
3. **TUI Input**: Visible typing with TextInput, Enter to confirm, error messages for invalid input
4. **TUI Theme**: Matrix/cyberpunk style with green on black, cyan accents, high contrast

## File Changes

### 1. `apps/yacs-api/src/routes/projects.ts` (New)
Split project-related endpoints into separate router:
- GET /projects - List all projects
- POST /projects - Create project
- GET /projects/:id - Get single project
- PATCH /projects/:id - Update project
- GET /projects/:id/deployments - List deployments
- POST /projects/:id/deployments - Create deployment

Uses dependency injection pattern for shared state (projects, deployments, projectDeployments maps) and utility functions (generateId, now, sendError, log).

### 2. `apps/yacs-api/src/routes/deployments.ts` (New)
Split deployment-related endpoints into separate router:
- POST /deployments/:id/revert - Revert to previous deployment

### 3. `apps/yacs-api/src/logger.ts` (New)
Simple logger with:
- `log(message)` - Info level logging with timestamp
- `logRequest(method, url, statusCode, durationMs)` - Request logging with color-coded status
- `logError(message, error?)` - Error logging

Uses ANSI color codes: green (2xx), yellow (4xx), red (5xx), cyan (info), gray (timestamps).

### 4. `apps/yacs-api/src/index.ts` (Updated)
Refactored to:
- Import route creators from `routes/projects.ts` and `routes/deployments.ts`
- Add request logging middleware (logs method, URL, status code, response time)
- Mount routers with `app.use("/projects", projectsRouter)` and `app.use("/deployments", deploymentsRouter)`
- Keep only app setup, middleware, in-memory storage, and utility functions

### 5. `apps/yacs-tui/src/components/MainMenu.tsx` (Updated)
Fixed input handling:
- Added `TextInput` from `ink-text-input` for visible typing
- Input field shows characters as user types
- Requires Enter key to confirm selection
- Displays error message for invalid input (non-numeric or out of range)
- Highlights selected item in cyan when number matches
- Added escape key to exit application

### 6. `apps/yacs-tui/src/components/Deploy.tsx` (Updated)
Fixed re-render issue:
- Added `isActive` option to `useInput` hook to deactivate when in "input" step
- This prevents `useInput` from conflicting with `TextInput` component
- Applied cyberpunk theme (green bold headers, cyan labels, colored status indicators)

### 7. `apps/yacs-tui/src/components/ProjectsList.tsx` (Updated)
Applied cyberpunk theme:
- Green bold header
- Cyan project names
- Green/yellow status indicators
- Cyan loading state

### 8. `apps/yacs-tui/src/components/Revert.tsx` (Updated)
Applied cyberpunk theme and fixed input handling:
- Added `isActive` option to `useInput` hook
- Green bold header, cyan labels
- Yellow "reverting" state, red errors, green success

### 9. `apps/yacs-tui/src/components/ProjectUpdate.tsx` (Updated)
Applied cyberpunk theme:
- Cyan field labels and selection indicators
- Green submit button, yellow "updating" state
- Fixed `useInput` isActive logic

### 10. `apps/yacs-tui/src/components/App.tsx` (Updated)
Added matrix/cyberpunk themed borders:
- Green bold separator lines (═══════════════════════════════════════)
- Wraps all views with consistent themed borders

## Implementation Steps
1. ✅ Create `routes/projects.ts` with project-related endpoints
2. ✅ Create `routes/deployments.ts` with deployment revert endpoint
3. ✅ Create `logger.ts` with request/error logging
4. ✅ Update `index.ts` to use route files and logging middleware
5. ✅ Fix MainMenu input (visible typing, Enter confirm, errors)
6. ✅ Fix Deploy re-render issue (useInput isActive option)
7. ✅ Apply matrix/cyberpunk theme to all TUI components
8. ✅ Build verification (both api and tui compile successfully)

## Status: Completed
- Created route files with proper dependency injection
- Added observability logging with timestamps and color-coded output
- Fixed TUI input handling with visible typing and error messages
- Fixed Deploy component re-render issue
- Applied consistent matrix/cyberpunk theme across all components
- Build verification passed for both `@yacs/api` and `@yacs/tui`
