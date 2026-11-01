# Frontend plan: Application Home Page

## Overview

Replace the Hello World scaffold with a branded Home Page (navbar + welcome), reuse `checkBackendHealth`, and show a non-dismissible unavailable modal with a 20s health retry while the backend is down. No router, no auth, no new packages, no backend changes.

## Scope

| In scope | Out of scope |
| --- | --- |
| `app/` UI structure, styles, health UX, Hello World removal | `api/` changes |
| Update UI copy enums | `/login`, auth, profile, sign out |
| Cleanup unused hello client usage | New npm dependencies |

## Pages and components

| Piece | Responsibility |
| --- | --- |
| `App` | Shell: layout, health lifecycle (initial check + polling), modal visibility state |
| `Navbar` | Brand **Auth System** + **Login** button (no-op) |
| `HomeHero` (or inline main) | Centered welcome heading |
| `ServiceUnavailableModal` | Non-dismissible overlay + approved message |

Suggested layout under `app/src/`:

- `components/Navbar.tsx` (+ optional colocated CSS or shared `App.css` sections)
- `components/ServiceUnavailableModal.tsx`
- `App.tsx` composes the above and owns health state
- Keep styles in `App.css` / small component CSS files; no UI library

## Routing

None. Single entry via existing `main.tsx` → `App`. No React Router. Login does not navigate.

## State management

Local React state in `App` (or a small custom hook `useBackendHealthGate`):

- `isUnavailable: boolean` — starts `false` so first paint is normal Home Page
- On mount: call `checkBackendHealth()`; if `false`, set `isUnavailable` to `true`
- When `isUnavailable` becomes `true`: start 20s retry loop
- When a retry returns healthy: set `isUnavailable` to `false` and stop the loop
- Cleanup timers and ignore stale async results on unmount

No global store.

## API integration

- Reuse `app/src/api/health.ts` → `checkBackendHealth()` and `app/src/api/client.ts` / `VITE_API_URL`
- Do not call Hello World from the Home Page
- Remove `app/src/api/hello.ts` and drop unused `ApiRoute.ROOT` from the frontend enum if nothing else references them
- Backend `GET /health` unchanged

## Types and interfaces

- Keep existing `HealthResponse` / `HealthStatus`
- Prefer `as const` maps for UI strings and the poll interval (per frontend rules; no TS `enum` if `erasableSyntaxOnly` applies)
- Explicit boolean state; no `any`

## Forms and validation

N/A (no forms).

## UI states (loading, empty, error)

| State | Behavior |
| --- | --- |
| Initial / healthy | Navbar + welcome; no modal |
| Checking (first request in flight) | Same as healthy — no loading gate, no modal yet |
| Unavailable | Same Home Page under overlay + non-dismissible modal |
| Recovered | Modal hidden; polling stopped |

## Permissions and UI behavior

- Public page; no auth UI
- Login: `type="button"`, no handler / no navigation / no API
- Modal: no close button, no outside-click dismiss, no Escape dismiss
- Prefer `role="dialog"` + `aria-modal="true"` and label the message for accessibility

## Tasks

### FE-01 — UI copy and timing constants

- **Description:** Align user-facing unavailable copy with the spec; centralize the 20s poll interval.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/enums/ui-message.enum.ts`; new `app/src/enums/health-poll.enum.ts` (or similar const map) for interval ms
- **Dependencies:** None
- **Implementation details:**
  - Set unavailable message to exactly: `Service temporarily unavailable. Please try again later.`
  - Remove or stop using Hello World–only messages (`LOADING`, `HELLO_FAILED`, old `BACKEND_DOWN` wording) once unused
  - Export poll interval as `20000` via a named const map (no scattered magic numbers)
- **Testing requirements:** Confirm string matches spec; TypeScript compiles
- **Completion criteria:** Approved modal copy and poll interval live in shared constants

### FE-02 — Navbar component

- **Description:** Add a clean, responsive navbar with brand and Login placeholder.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/components/Navbar.tsx`; styles in `App.css` or `components/Navbar.css`
- **Dependencies:** None
- **Implementation details:**
  - Show **Auth System** as the brand/name
  - **Login** button does nothing (no `onClick` side effects, no links)
  - Responsive: usable on mobile/tablet/desktop (e.g. brand left, Login right; wrap/spacing as needed)
- **Testing requirements:** Visual check at narrow/wide widths; click Login has no navigation/network
- **Completion criteria:** Navbar matches branding and no-op Login behavior

### FE-03 — Service unavailable modal

- **Description:** Non-dismissible modal showing the approved message.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/components/ServiceUnavailableModal.tsx`; related CSS
- **Dependencies:** FE-01
- **Implementation details:**
  - Render only when parent passes `open`/`isUnavailable`
  - Overlay + dialog content; message from `UiMessage` constant
  - No close control; ignore backdrop click and Escape for dismiss
  - Do not render technical error details
- **Testing requirements:** Modal visible when open; cannot be closed by user interaction
- **Completion criteria:** Modal matches FR 9–11

### FE-04 — Home Page layout and welcome body

- **Description:** Compose navbar + centered welcome heading; restyle for a simple modern landing look.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/App.tsx`; `app/src/App.css`; optionally `app/src/index.css`
- **Dependencies:** FE-02
- **Implementation details:**
  - Heading text exactly: `Welcome to the application.`
  - First paint shows navbar + welcome without waiting on health
  - Responsive layout; keep CSS-only (no new libraries)
  - Replace current Hello World–centric layout
- **Testing requirements:** Visual/responsive check; heading text exact
- **Completion criteria:** Home Page UI matches goals without Hello World content

### FE-05 — Health check on load + 20s retry while unavailable

- **Description:** Wire health gate: check on mount; show modal on failure; poll every 20s while unavailable; stop on recovery/unmount.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/App.tsx` and/or `app/src/hooks/useBackendHealthGate.ts`; uses `app/src/api/health.ts`
- **Dependencies:** FE-01, FE-03, FE-04
- **Implementation details:**
  - `isUnavailable` starts `false`
  - Mount: `checkBackendHealth()`; on `false` → `isUnavailable = true`
  - While unavailable: schedule retries every 20s (prefer `setTimeout` chain or guarded interval so overlapping requests do not stack)
  - On healthy retry: `isUnavailable = false`; clear timers
  - Cleanup on unmount: clear timers; ignore late resolutions (`cancelled` flag / abort pattern already used in App)
  - Do not poll while healthy
- **Testing requirements:** Manual — API up (no modal); API down (modal + ~20s retries); restart API (modal clears); leave page during poll (no leaked timers in console/dev tools)
- **Completion criteria:** Spec FRs 6–13 and related acceptance criteria satisfied

### FE-06 — Remove Hello World frontend usage

- **Description:** Delete Home Page Hello World integration and unused hello API helper.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/App.tsx`; remove `app/src/api/hello.ts`; trim `app/src/enums/api-route.enum.ts` / `ui-message.enum.ts` as needed
- **Dependencies:** FE-04, FE-05
- **Implementation details:**
  - No `fetchHelloMessage` imports/calls remain
  - Remove dead files/constants left unused
  - Do not change backend Hello World endpoint (out of frontend scope; may remain unused)
- **Testing requirements:** Grep/build — no hello client references; app builds
- **Completion criteria:** Hello World no longer part of the frontend Home Page path

### FE-07 — Verify build and acceptance pass

- **Description:** Run frontend checks and walk the acceptance checklist.
- **Scope:** `app`
- **Files or modules expected to change:** None expected (fixes only if verification finds issues)
- **Dependencies:** FE-01 through FE-06
- **Implementation details:**
  - `npm run build` and `npm run lint` in `app/`
  - Manual acceptance against `spec.md`
- **Testing requirements:** Lint/build clean; acceptance criteria manually confirmed
- **Completion criteria:** Feature ready for review phase with no known acceptance gaps

## Implementation order

1. FE-01 (constants/copy)
2. FE-02 (Navbar)
3. FE-03 (Modal)
4. FE-04 (Home layout)
5. FE-05 (Health lifecycle)
6. FE-06 (Hello World cleanup)
7. FE-07 (Verify)

## Risks

- Timer leaks if cleanup is incomplete when toggling unavailable ↔ healthy.
- Overlapping health requests if interval fires while a slow request is in flight.
- Modal focus/accessibility without a dismiss path (document as intentional per spec).

## Technical decisions

- **Frontend-only plan** — reuse existing `GET /health`; no `backend-plan.md`.
- **No React Router / no new UI libraries** for this story.
- **Health state owned by `App` or one hook** — keep components presentational where practical.
- **Polling strategy:** timeout/interval with in-flight guard + unmount cancellation.
- **Styles:** existing CSS approach; redesign within current stack.
- **Login:** presentational `button`, not an anchor to `/login`.

## Assumptions

- Approved `spec.md` remains the source of truth.
- `checkBackendHealth` behavior (catch → `false`; require `status === ok`) stays sufficient.
- Backend Hello World route may remain; frontend simply stops calling it.
- Manual verification is enough; no new test runner unless separately approved.

## Unresolved questions

None.

## Testing strategy

- Automated: `app` lint + production build.
- Manual: healthy load, unavailable load (stop API), recovery within ~20s, Login no-op, responsive smoke, confirm no technical errors in the modal.
- No new unit-test framework in this plan.
