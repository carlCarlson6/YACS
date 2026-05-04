# YACS Plans

This directory contains implementation plans for the YACS (Yet Another Cloud Service) project.

## Plans

| Plan | Description | Status |
|------|-------------|--------|
| [PLAN-001](./PLAN-001-scaffold-initial-structure.md) | Scaffold initial project structure with monorepo setup | Completed |
| [PLAN-002](./PLAN-002-tui-interactive-selector.md) | TUI interactive selector with menu navigation | Completed |
| [PLAN-003](./PLAN-003-tui-numbered-input.md) | TUI numbered input for menu selection | Completed |
| [PLAN-004](./PLAN-004-backend-refactor-logging-tui-improvements.md) | Backend refactor (route splitting), observability logging, TUI input fixes and cyberpunk theme | Completed |
| [PLAN-005](./PLAN-005-reimplement-tui-with-opentui.md) | Reimplement TUI with OpenTUI library (migrate from Ink to OpenTUI) | Pending |
| [PLAN-006](./PLAN-006-tui-ux-and-vertical-slice-refactor.md) | TUI UX polish (full-screen, fatal-error popup, captured exec output, project path inputs, Ctrl+B cancel) and vertical-slice refactor | Completed |
| [PLAN-007](./PLAN-007-yacs-api-postgres-drizzle.md) | Move `@yacs/api` to PostgreSQL with Drizzle ORM and local Docker Compose support | Completed |
| [PLAN-008](./PLAN-008-clerk-authentication.md) | Add Clerk authentication for the TUI and API with request authorization and user scoping | Pending |
| [PLAN-009](./PLAN-009-azure-blob-storage-uploads.md) | Azure Blob Storage for deployment file uploads with SAS URLs | Pending |

## Plan Naming Convention

Plans follow the naming pattern: `PLAN-XXX-<description>.md`

- `XXX` - Zero-padded number (starting from 001)
- `<description>` - Lowercase with hyphens, describing the main goal

## Creating a New Plan

1. Check the next available plan number
2. Create `PLAN-XXX-description.md` following the existing format
3. Update this README to include the new plan
4. Include: Goal, User Preferences, File Changes, Implementation Steps, Status
