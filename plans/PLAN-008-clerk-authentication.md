# Clerk Authentication Plan

## Goal

Introduce Clerk-backed authentication so the YACS TUI only works for signed-in users, and the API only accepts authenticated requests from verified Clerk sessions.

## User Preferences

1. **Auth provider**: Clerk
2. **Scope**: plan only, no implementation yet
3. **TUI requirement**: users must authenticate before using the app
4. **Coverage**: plan changes for both the TUI and the backend

## Authentication Model

### Identity boundary
- Use Clerk as the source of truth for user identity.
- The API should trust only verified Clerk tokens, never client-provided user ids.
- All application data should be scoped to the authenticated identity, not shared globally.

### TUI sign-in flow
- The TUI should boot into an auth gate before rendering normal app content.
- If no valid session exists, it should start a sign-in flow and wait for completion.
- The recommended TUI UX is a browser handoff that returns a Clerk session/token to the terminal app.
- After sign-in, the TUI stores the session token locally and reuses it for API calls.
- On token expiry or auth failure, the TUI should force re-authentication.

### API request flow
- Every authenticated request must include `Authorization: Bearer <token>`.
- The backend verifies the Clerk token on each request, extracts the caller identity, and applies authorization checks.
- Unauthenticated requests return `401`; authenticated requests that try to access another user's data return `403`.

## File Changes

### TUI
- `apps/yacs-tui/src/index.tsx` (updated)
  - Initialize auth state before mounting the main app tree.
- `apps/yacs-tui/src/App.tsx` (updated)
  - Wrap the app in auth-aware providers and render a sign-in gate when needed.
- `apps/yacs-tui/src/shared/contexts/*` (new/updated)
  - Add auth context/state for session, loading, signed-out, and signed-in states.
- `apps/yacs-tui/src/shared/contexts/ApiContext.tsx` (updated)
  - Support authenticated API requests and token injection.
- `apps/yacs-tui/src/shared/*` (new as needed)
  - Add token storage, sign-in handoff, and logout helpers.
- `apps/yacs-tui/src/features/*` (updated)
  - Block all API-driven screens until auth succeeds and surface auth failures cleanly.

### Backend
- `apps/yacs-api/src/index.ts` (updated)
  - Add Clerk verification middleware and protect route registration behind auth.
- `apps/yacs-api/src/routes/projects.ts` (updated)
  - Scope project operations to the authenticated user.
- `apps/yacs-api/src/routes/deployments.ts` (updated)
  - Scope deployment operations to the authenticated user’s projects.
- `apps/yacs-api/src/*` (new as needed)
  - Add auth middleware, identity helpers, and request-context utilities.
- `shared/schemas/src/index.ts` (updated if needed)
  - Add any auth-related request/response schemas or shared types.
- `apps/yacs-api/package.json` (updated)
  - Add Clerk verification dependencies and any supporting auth libraries.

### Documentation / config
- `plans/README.md` (updated)
  - Add this plan to the index.
- Env templates or docs (updated as needed)
  - Document Clerk keys, issuer/JWKS settings, and TUI/API auth variables.

## Implementation Steps

1. Decide the TUI sign-in UX, with browser handoff as the default path.
2. Add Clerk verification on the API and return consistent `401`/`403` responses.
3. Thread authenticated identity through project and deployment handlers.
4. Add TUI auth state, token persistence, and automatic `Authorization` headers.
5. Gate the full TUI behind sign-in and add logout / reauth handling.
6. Add tests for valid auth, missing auth, invalid auth, and cross-user access.
7. Update env docs and plan index once the design is finalized.

## Status

Pending
