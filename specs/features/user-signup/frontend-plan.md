# Frontend plan: User Signup

## Overview

Add client routing with `react-router-dom` for `/`, `/signup`, and `/profile`; a Sign Up navbar entry; a validated signup form that calls `POST /users/signup`; and **in-memory-only** signed-in UI state (Context) that drives profile messaging and navbar Login→Logout / hide Sign Up. Preserve the existing health-gate modal shell. No token storage; Logout remains a no-op.

## Scope

| In scope | Out of scope |
| --- | --- |
| Navbar Sign Up / signed-in UI, routes, signup form, profile messages, API client POST, in-memory auth UI state | Real login/logout/session, `localStorage`, JWT, bypassing health unavailable UX |
| Align types with backend success/error contracts | Packages beyond locked decision **D** without a new approval; backend changes |

## Pages and components

| Piece | Responsibility |
| --- | --- |
| `App` (shell) | Health gate + modal; provide signed-in context; host router outlet |
| `Navbar` | Brand; Login no-op **or** Logout no-op; Sign Up link when signed out; hide Sign Up when signed in |
| `HomePage` | Existing welcome heading at `/` |
| `SignupPage` | Form: email, name, password; client validation; submit; loading/disabled; errors |
| `ProfilePage` | Signed-in success message **or** “not signed in”; no redirect away |
| `SignedInProvider` (Context) | Hold `{ id, email, name } \| null`; `setSignedIn` after success; refresh clears |

Suggested paths under `app/src/`:

- `context/SignedInContext.tsx` (or `auth/SignedInContext.tsx`)
- `pages/HomePage.tsx`, `pages/SignupPage.tsx`, `pages/ProfilePage.tsx`
- `api/users.ts` (+ extend `api/client.ts` with `apiPost`)
- Update `components/Navbar.tsx`, `App.tsx`, `main.tsx` as needed
- Enums: `ui-label`, `ui-message`, `api-route`

## Routing

- Install **`react-router-dom`** in `app/` (approved decision **D**).
- Routes: `/` home, `/signup` signup, `/profile` profile.
- Visiting `/signup` while signed-in remains allowed; navbar stays Logout-only.
- Unauthenticated `/profile`: stay on page, show not-signed-in message.
- Keep health modal + navbar at app shell level above page routes.

## State management

- React Context (no Redux): `signedInUser: { id, email, name } | null`.
- Set from signup success payload only.
- Memory only — full refresh → `null`.
- Logout click: **no** clear, no navigation, no API.

## API integration

- Extend `app/src/api/client.ts` with typed `apiPost` (JSON body, parse error body when `!ok`).
- Add `app/src/api/users.ts`: `signupUser({ email, name, password })` → success type.
- Treat HTTP **2xx** (backend locked to **201 Created**) as success.
- `ApiRoute.USERS_SIGNUP = 'users/signup'` (or equivalent const).
- Surface backend `message` / validation arrays / 409 clearly on the form.
- Health unavailable modal from Home Page feature remains for the shell; do not special-case signup to skip it.

## Types and interfaces

```ts
interface SignupRequest { email: string; name: string; password: string }
interface SignedInUser { id: string; email: string; name: string }
interface SignupSuccessResponse {
  message: string
  user: SignedInUser
}
interface ApiErrorBody {
  statusCode: number
  errorCode: string
  message: string | string[]
  path: string
  timestamp: string
}
```

Use `as const` maps (Vite `erasableSyntaxOnly` — no TS `enum`). Never `any`.

## Forms and validation

Client rules (before API call), aligned with backend:

- Email: required; valid format; trim; recommend lowercase for display/submit consistency with API normalize.
- Name: required; trim; min length 3.
- Password: required; min 8; at least one letter; one digit; one special (`[^A-Za-z0-9]`).
- Per-field (or equivalent) messages via `UiMessage` / validation const map.
- Submit: loading state; disable button while in-flight (single flight).

## UI states (loading, empty, error)

| State | Behavior |
| --- | --- |
| Signup idle | Fields enabled; no banner |
| Client validation fail | Field errors; no API call |
| Submitting | Disable submit; loading indicator/label |
| API 400/409/network | Show error; re-enable submit |
| Success | Set context; navigate to `/profile` |
| Profile signed-in | Success / signed-in message (name or email OK) |
| Profile signed-out | “Not signed in” (or equivalent); stay on `/profile` |
| Backend down | Existing non-dismissible unavailable modal |

## Permissions and UI behavior

- Signed out: Login (no-op) + Sign Up → `/signup`.
- Signed in: Logout (no-op) only; Sign Up hidden; brand unchanged.
- No route guards that redirect `/profile` away.

## Tasks

### FE-01 — UI/API constants for signup

- **Description:** Add labels, validation/error/profile copy, and signup API route constant.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/enums/ui-label.enum.ts`, `ui-message.enum.ts`, `api-route.enum.ts` (and optional validation-message map)
- **Dependencies:** None
- **Implementation details:**
  - Labels: Sign Up, Logout, form field labels, submit/loading text.
  - Messages: validation strings, duplicate/generic API error fallbacks, profile signed-in / not-signed-in.
  - `ApiRoute` entry for users signup path.
- **Testing requirements:** TypeScript build; strings used by later tasks.
- **Completion criteria:** No magic UI strings scattered in new components.

### FE-02 — Routing shell

- **Description:** Introduce `/`, `/signup`, `/profile` with `react-router-dom` while keeping health modal + navbar at app shell level.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/main.tsx` and/or `App.tsx`; new page components; install `react-router-dom`
- **Dependencies:** Locked decision **D**; FE-01 helpful but not hard-blocking
- **Implementation details:**
  - Install **`react-router-dom`** in `app/` (approved).
  - Extract home welcome into `HomePage` (or route element).
  - Placeholder `SignupPage` / `ProfilePage` OK until FE-05/FE-06.
  - Shell: `Navbar` + `<Routes>`/`Outlet` + `ServiceUnavailableModal` + `useBackendHealthGate`.
- **Testing requirements:** Manual navigation to all three routes; health modal still overlays when down.
- **Completion criteria:** All three routes render inside existing shell.

### FE-03 — In-memory signed-in context + Navbar behavior

- **Description:** Context for signed-in user; Navbar Login/Logout/Sign Up per spec.
- **Scope:** `app`
- **Files or modules expected to change:** new context file; `Navbar.tsx` / `Navbar.css`; `App.tsx` provider wrap
- **Dependencies:** FE-02 (Sign Up needs router `Link`/`navigate`)
- **Implementation details:**
  - Provider holds user or null; expose setter for signup success.
  - Signed out: Login no-op button + Sign Up navigates to `/signup`.
  - Signed in: Logout no-op (handler empty / no state clear); hide Sign Up.
  - Preserve existing navbar visual language; add a sibling control for Sign Up with matching styles.
- **Testing requirements:** Toggle context manually in dev; refresh clears; Logout does not clear.
- **Completion criteria:** FR navigation/navbar signed-in UI met without persistence.

### FE-04 — API POST helper and signup client

- **Description:** Shared POST + `signupUser` typed against backend contract.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/api/client.ts`, `app/src/api/users.ts`, types as needed
- **Dependencies:** Backend contract stable (BE-04); FE-01 route constant
- **Implementation details:**
  - `apiPost<T>(path, body)` with `Content-Type: application/json`.
  - On non-OK: parse filter error JSON when possible; throw a typed error carrying `statusCode` / `message`.
  - Treat **201** (and other 2xx) as success.
  - `signupUser` returns `SignupSuccessResponse`.
- **Testing requirements:** Manual or temporary call against running API; TypeScript-safe.
- **Completion criteria:** One shared POST path; no duplicated fetch in pages.

### FE-05 — Signup page form UX

- **Description:** Full `/signup` form with client validation, loading, API errors, success handoff.
- **Scope:** `app`
- **Files or modules expected to change:** `pages/SignupPage.tsx` (+ CSS); uses context + `signupUser`
- **Dependencies:** FE-01, FE-03, FE-04
- **Implementation details:**
  - Fields email, name, password; validate per spec before submit.
  - In-flight: disable submit; ignore double-submit.
  - Success: `setSignedIn(user)`; navigate to `/profile`.
  - Show backend 400/409/network errors clearly.
  - Responsive layout consistent with app shell (no new UI library).
- **Testing requirements:** Manual: validation blocks API; loading disables button; success lands on profile; 409 shown.
- **Completion criteria:** Signup acceptance criteria for form + success navigation met.

### FE-06 — Profile page signed-in / not-signed-in

- **Description:** `/profile` content for both UI states without redirect.
- **Scope:** `app`
- **Files or modules expected to change:** `pages/ProfilePage.tsx` (+ CSS)
- **Dependencies:** FE-03
- **Implementation details:**
  - If context set: clear signed-in / success message (may include name or email).
  - If null: simple not-signed-in message; remain on `/profile`.
- **Testing requirements:** Open `/profile` signed out; after signup see success; refresh → not signed in.
- **Completion criteria:** Profile FR/edge cases satisfied.

## Implementation order

1. FE-01 → FE-02 (install `react-router-dom`) → FE-03 → FE-04 (after BE-04) → FE-05 → FE-06.
2. Full-stack smoke: signup → profile → refresh → navbar/profile signed-out; duplicate email 409 in UI.

## Risks

- Error body `message` may be `string | string[]` — UI must handle both.
- Health modal can block interaction while backend is down (intended).

## Technical decisions

| ID | Decision | Status |
| --- | --- | --- |
| **D** | Install **`react-router-dom`** for client routing | **Approved / locked** |

Aligned with backend locks (for integration):

| ID | Decision | Status |
| --- | --- | --- |
| **C** | Backend success status **201 Created** — frontend treats 2xx as success | **Approved / locked** |

## Assumptions

- `VITE_API_URL` already configured.
- Home Page health behavior stays as-is.
- Exact profile copy can be refined if intent stays clear.
- No frontend test runner in the repo; verification is manual + `tsc`/lint unless a test package is separately approved later.
- Package install for D happens during development (feature-developer), not during planning.

## Unresolved questions

None — D locked (and C aligned with backend).

## Testing strategy

Manual acceptance checklist from the spec; TypeScript build (`npm run build` in `app/`). No new frontend test framework unless separately approved.
