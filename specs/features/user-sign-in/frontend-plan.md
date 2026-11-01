# Frontend plan: User Sign-in

## Overview

Add `/sign-in`, persist JWT + user in `localStorage`, hydrate on load, hard-guard `/profile`, redirect authenticated users away from `/sign-in` and `/signup`, wire Login/Logout, and update signup to store `accessToken`. Add FE tests after installing the approved Vitest + Testing Library stack. Preserve health-gate shell and existing navbar look where unchanged.

## Scope

| In scope | Out of scope |
| --- | --- |
| Sign-in page, auth persistence/hydrate, route guards, navbar Login/Logout, signup JWT client flow, enums/API types, FE tests after tooling install | Refresh tokens, Authorization headers on API calls (not required yet), profile edit, new UI libraries |
| Align types with backend auth success contracts | Packages beyond the locked decisions below without a new approval |

## Pages and components

| Piece | Responsibility |
| --- | --- |
| `SignInPage` | Email/password form; client validation; loading; API; banner errors; persist + redirect |
| `SignupPage` | Persist `accessToken` + user; same success path as sign-in |
| `ProfilePage` | Signed-in content only when guarded; remove steady-state “not signed in” as primary UX |
| `Navbar` | Login → `/sign-in`; Logout clears auth |
| `SignedInContext` (extend) | Hydrate; hold user (+ token access as needed); `signIn` / `signOut`; validity helpers |
| Route guards | `RequireAuth`, `RedirectIfAuthenticated` (or equivalent) |
| `api/users.ts` | `signInUser`; update signup success type |
| Auth storage util | `localStorage` get/set/clear + JWT `exp` parse |

Suggested paths: `app/src/pages/SignInPage.tsx` (+ CSS — **reuse signup styles where practical**, or a thin dedicated stylesheet that shares the same class patterns), `app/src/auth/auth-storage.ts`, `app/src/auth/jwt.ts` (decode `exp` only), update `App.tsx`, context, enums.

## Routing

| Route | Behavior |
| --- | --- |
| `/` | Home (unchanged) |
| `/sign-in` | Guest-only → if valid JWT, redirect `/profile` |
| `/signup` | Guest-only → if valid JWT, redirect `/profile` |
| `/profile` | Require valid JWT → else redirect `/sign-in` |

Keep health modal + navbar at shell level.

## State management

Extend `SignedInContext` (no parallel auth stack):

- On mount: read `accessToken` + `user` from `localStorage`; if token missing/expired → clear storage, `signedInUser = null`; else restore user.
- `signIn({ accessToken, user })`: write storage + set state.
- `signOut()`: clear storage + null state (no API).
- `isAuthenticated`: derived from present non-expired token + user.

Storage keys via `as const` map (e.g. `AuthStorageKey.ACCESS_TOKEN`, `USER`).

## API integration

- `ApiRoute.USERS_SIGNIN = 'users/signin'`
- `signInUser({ email, password })` → `{ message, accessToken, user }`
- Update `SignupSuccessResponse` to include `accessToken` (same shared shape as sign-in)
- Map HTTP **401** to `UiMessage.INVALID_CREDENTIALS` (generic copy from spec)
- Network errors → existing-style generic form error
- Health unavailable UX unchanged

## Types and interfaces

```ts
interface AuthUser { id: string; email: string; name: string }
interface AuthSuccessResponse {
  message: string
  accessToken: string
  user: AuthUser
}
interface SignInRequest { email: string; password: string }
```

Align with backend. No `any`. Vite `erasableSyntaxOnly` → `as const` maps, not TS enums.

## Forms and validation

Same password/email rules as signup (required; email format; password length 8 + letter + digit + special). Per-field messages via `UiMessage`. Submit: loading + disable to prevent double submit. Prefer shared `validateAuthCredentials` helper used by sign-in (and optionally signup password/email).

## UI states (loading, empty, error)

| State | Behavior |
| --- | --- |
| Idle | Fields enabled |
| Client validation fail | Field errors; no API |
| Submitting | Disable submit; loading label |
| 401 | Banner: generic invalid credentials |
| Network / other | Friendly banner |
| Success | Persist; navigate `/profile` |
| Profile unauthenticated | Immediate redirect `/sign-in` (not “not signed in” page) |
| Backend down | Existing modal |

## Permissions and UI behavior

- Signed-in: Logout visible; Sign Up hidden.
- Logout: clear client auth; if on `/profile`, guard sends user to `/sign-in`.
- Login: `Link`/`navigate` to `/sign-in`.

## Locked package decision

| ID | Decision |
| --- | --- |
| **FE-PKG-A** | Install Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` as `app/` devDependencies; wire Vitest in `vite.config` and an `npm test` script. |

No `jwt-decode` package — parse payload with `atob` / `JSON.parse` for `exp` only (client cannot verify signature).

## Tasks

### FE-01 — Enums, routes, API client for sign-in

- **Description:** Add route/label/message constants and `signInUser`; extend signup response type.
- **Scope:** `app`
- **Files or modules expected to change:** `enums/api-route.enum.ts`, `ui-label.enum.ts`, `ui-message.enum.ts`, `api/users.ts`
- **Dependencies:** Backend contract known (BE-05/06 shape)
- **Implementation details:**
  - Routes/labels: sign-in submit / submitting.
  - `UiMessage.INVALID_CREDENTIALS` = spec generic copy.
  - Types include `accessToken` on auth success (`AuthSuccessResponse` shared with signup).
- **Testing requirements:** Types compile; later page tests use messages.
- **Completion criteria:** Client can call `POST /users/signin` with typed success/error.

### FE-02 — Auth storage + JWT expiry helper

- **Description:** Persist/read/clear token+user; detect expired `exp`.
- **Scope:** `app`
- **Files or modules expected to change:** new `app/src/auth/auth-storage.ts`, `app/src/auth/jwt.ts` (paths flexible)
- **Dependencies:** None
- **Implementation details:**
  - Keys via const map; store JSON user + token string.
  - `isAccessTokenValid(token)`: decode payload, check `exp` (seconds); invalid/malformed → false.
  - Never treat signature as verified — expiry gate only (per spec).
- **Testing requirements:** Unit tests once FE-PKG-A available (valid/expired/malformed).
- **Completion criteria:** Helpers support hydrate and guards without crashing on bad tokens.

### FE-03 — Extend SignedInContext (hydrate, signIn, signOut)

- **Description:** Replace memory-only auth with localStorage-backed session.
- **Scope:** `app`
- **Files or modules expected to change:** `context/SignedInContext.tsx`
- **Dependencies:** FE-02
- **Implementation details:**
  - Initial state from storage if token valid.
  - Expose `signIn`, `signOut`, `signedInUser`, and/or `isAuthenticated`.
  - `signOut` clears storage + state; no API.
- **Testing requirements:** Hydrate / clear covered in FE-08.
- **Completion criteria:** Refresh with valid JWT restores signed-in UI; expired clears.

### FE-04 — Route guards + App routes

- **Description:** Add `/sign-in`; protect `/profile`; redirect signed-in users from auth pages.
- **Scope:** `app`
- **Files or modules expected to change:** `App.tsx`, small guard components under `components/` or `auth/`
- **Dependencies:** FE-03
- **Implementation details:**
  - `RequireAuth`: no valid session → `<Navigate to="/sign-in" replace />`.
  - `RedirectIfAuthenticated`: valid session → `<Navigate to="/profile" replace />` wrapping `/sign-in` and `/signup`.
  - Profile no longer shows long-lived “not signed in” content.
- **Testing requirements:** Guard behavior in FE-08 (or router tests).
- **Completion criteria:** Acceptance criteria for redirects satisfied.

### FE-05 — SignInPage

- **Description:** Build `/sign-in` form UX per spec.
- **Scope:** `app`
- **Files or modules expected to change:** `pages/SignInPage.tsx`, CSS (reuse `SignupPage.css` / shared form classes where practical; dedicated file OK if cleaner)
- **Dependencies:** FE-01, FE-03, FE-04
- **Implementation details:**
  - Validate before API; field errors; loading/disable; 401 → generic banner; success → `signIn` + navigate `/profile`.
  - Match signup visual language; no new UI kit.
- **Testing requirements:** FE-08.
- **Completion criteria:** Spec items 5–11 met.

### FE-06 — Navbar Login / Logout

- **Description:** Login navigates to `/sign-in`; Logout clears client auth.
- **Scope:** `app`
- **Files or modules expected to change:** `components/Navbar.tsx`
- **Dependencies:** FE-03
- **Implementation details:** Replace Login button no-op with `Link`/`NavLink` to `/sign-in`; Logout calls `signOut()`. Preserve existing classes/layout.
- **Testing requirements:** Optional light test; manual OK if FE-08 covers session clear.
- **Completion criteria:** Spec items 1, 14–15 met.

### FE-07 — Signup success uses JWT persistence

- **Description:** On signup success, save `accessToken` + user via `signIn`; keep redirect `/profile`.
- **Scope:** `app`
- **Files or modules expected to change:** `pages/SignupPage.tsx`
- **Dependencies:** FE-01, FE-03, FE-04 (guest redirect)
- **Implementation details:** Use `response.accessToken`; do not set user without token; 409 still no persistence.
- **Testing requirements:** FE-08 signup persistence + redirect.
- **Completion criteria:** Spec items 25–26 / signup AC met.

### FE-08 — Frontend test tooling + tests

- **Description:** Install approved Vitest/RTL stack and write required tests.
- **Scope:** `app`
- **Files or modules expected to change:** `package.json`, `vite.config.ts`, test setup file, specs for SignInPage / auth storage / signup auth path as needed
- **Dependencies:** **FE-PKG-A install** (approved); FE-02–FE-07
- **Implementation details:** Cover: client validation; generic credential error; loading/duplicate submit; success persistence + redirect; signup auth persistence + redirect; optionally expired-token hydrate.
- **Testing requirements:** `npm test` in `app/` passes.
- **Completion criteria:** Spec testing item 31 satisfied.

## Implementation order

1. Install **FE-PKG-A** (can parallel BE after BE contracts stable; ideally after BE-05/06).
2. FE-01 → FE-02 → FE-03 → FE-04 → FE-05 → FE-06 → FE-07 → FE-08

**Full-stack sequencing:** Prefer BE-01…BE-07 before FE integration tests against a running API; FE-01–FE-07 can be coded against the locked JSON contract in parallel once BE shapes are fixed.

## Risks

- Client-only JWT expiry check can be spoofed locally — acceptable until backend guards exist.
- Signup contract change can break FE if shipped out of order — coordinate types first.
- FE test setup is new — keep config minimal.

## Technical decisions

1. Extend `SignedInContext`; no second auth provider.
2. Decode JWT `exp` without a decode library.
3. Hard redirects via React Router guards.
4. Vitest + Testing Library + jsdom (**FE-PKG-A** locked).
5. Shared auth success shape with backend: `{ message, accessToken, user }`.
6. CSS: reuse signup styles where practical (shared classes or import); dedicated `SignInPage.css` allowed if clearer.

## Assumptions

- Backend returns identical auth success shape for signup and sign-in.
- Sign-in HTTP **200**; signup remains **201**.
- `VITE_API_URL` already configured.
- Health gate remains global.

## Unresolved questions

None — FE test stack, shared contracts, and CSS guidance are locked.

## Testing strategy

Component/unit tests with Vitest + RTL after tooling install. Manual smoke: sign-in, refresh, logout, guest redirects, signup→profile with storage.
