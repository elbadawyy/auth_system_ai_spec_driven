# Frontend plan: User Profile

## Overview

Wire `/profile` to `GET /users/me` with Bearer token via the shared API client, treat the API as display source of truth, handle loading/errors/401 clear+redirect, and refresh signed-in user storage/context on success. Reuse `RequireAuth`, `SignedInContext`, and existing ProfilePage layout.

## Scope

| In scope | Out of scope |
| --- | --- |
| Authenticated GET helper, `/users/me` client, ProfilePage fetch UX, context user refresh, FE tests | Profile edit, new UI libs, Passport, changing sign-in/sign-up flows beyond shared client/types, new packages |

## Pages and components

| Piece | Responsibility |
| --- | --- |
| `ProfilePage` | On mount (when authenticated): fetch `/users/me`; loading; show Name/Email from API; non-401 error; 401 → signOut + navigate `/sign-in`; on success refresh context/storage user |
| `SignedInContext` | Add user-refresh helper that updates stored/context user **without** rotating the token |
| `api/client.ts` | Bearer support; align `apiGet` errors with `ApiRequestError` |
| `api/users.ts` | `fetchCurrentUser(accessToken)` |
| Enums | `ApiRoute.USERS_ME`, profile loading/error UI messages/labels |
| `RequireAuth` / routing | Unchanged behavior (already gates `/profile`) |

## Routing

Unchanged: `/profile` behind `RequireAuth` → unauthenticated redirect `/sign-in`. Profile itself redirects on API 401 after clear.

## State management

- Keep token + user in `SignedInContext` / `auth-storage`.
- Add e.g. `updateSignedInUser(user: AuthUser)`: if `accessToken` present, `saveAuthSession({ accessToken, user })` + set user state.
- On Profile 401: call existing `signOut()` then `navigate(AppPath.SIGN_IN, { replace: true })`.
- Display state local to ProfilePage: `loading | success | error` (do not use localStorage as render source of truth for name/email after fetch starts — show API data or loading/error).

## API integration

- `ApiRoute.USERS_ME = 'users/me'`
- Authenticated GET sends `Authorization: Bearer <accessToken>`
- Prefer extending `apiGet` to accept optional headers / `accessToken` **or** add `apiGetAuthenticated(path, accessToken)` that still uses shared base URL + `ApiRequestError` parsing (mirror `apiPost`).
- Align unauthenticated `apiGet` (health) to also throw `ApiRequestError` on non-OK so status handling is consistent (health caller can keep treating any throw as down).
- `fetchCurrentUser(token): Promise<AuthUser>` → typed `{ id, email, name }`

## Types and interfaces

Reuse existing `AuthUser` from `api/users.ts`. No `any`. Const maps for routes/messages (`erasableSyntaxOnly`).

## Forms and validation

None (read-only profile).

## UI states (loading, empty, error)

| State | Behavior |
| --- | --- |
| Initial / in flight | Loading message/label (enum); do not show stale localStorage name/email as “loaded” profile |
| Success | Show Name + Email from API (keep existing visual structure; extend CSS lightly if needed) |
| 401 | Clear auth + redirect `/sign-in` (no sticky error on profile) |
| 404 / other API / network | Friendly error via `UiMessage` on page; **do not** clear session |
| Remount / Strict Mode double fetch | Use abort or ignore stale responses so UI ends in data, error, or 401 redirect — not stuck loading |
| Backend down | Existing health modal still applies |

## Permissions and UI behavior

- Route gate: existing `RequireAuth`.
- Navbar continues to use context user; after successful `/users/me`, refreshed user keeps navbar consistent (even though navbar currently only shows Logout).

## Locked package decision

| ID | Decision |
| --- | --- |
| **FE-PKG** | **No new packages.** |

## Tasks

### FE-01 — Routes / messages / labels for profile fetch

- **Description:** Add API route and UI copy for loading and profile load failures.
- **Scope:** `app`
- **Files or modules expected to change:** `enums/api-route.enum.ts`, `enums/ui-message.enum.ts`, optionally `ui-label.enum.ts`
- **Dependencies:** Backend contract known (`GET /users/me` body)
- **Implementation details:**
  - `ApiRoute.USERS_ME = 'users/me'`
  - Messages e.g. `PROFILE_LOADING`, `PROFILE_LOAD_ERROR` (friendly; covers 404/network/other non-401).
  - Keep `PROFILE_SIGNED_IN` or adjust title copy only if needed for layout consistency.
- **Testing requirements:** Used by ProfilePage tests.
- **Completion criteria:** No magic strings for route/profile UX copy in page logic.

### FE-02 — Shared client: Bearer GET + `ApiRequestError` for GET

- **Description:** Support authenticated GETs and distinguishable HTTP status errors on GET.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/api/client.ts`
- **Dependencies:** None (can start before BE lands; integrate with FE-03)
- **Implementation details:**
  - Extend `apiGet` (options arg) or add authenticated helper that sets `Authorization: Bearer ${token}`.
  - On non-OK: parse body like `apiPost` and throw `ApiRequestError` (statusCode / errorCode / messages).
  - Preserve health usage (`api/health.ts`) — still works; failures remain catchable.
  - Header name / Bearer prefix via small `as const` map (no scattered magic strings).
- **Testing requirements:** Covered by ProfilePage / optional small client unit tests if present pattern allows.
- **Completion criteria:** Callers can detect 401 vs 404 vs other from thrown `ApiRequestError`.

### FE-03 — `fetchCurrentUser` helper

- **Description:** Typed client for `GET /users/me`.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/api/users.ts`
- **Dependencies:** FE-01, FE-02
- **Implementation details:**
  - `fetchCurrentUser(accessToken: string): Promise<AuthUser>`
  - Uses `ApiRoute.USERS_ME` + Bearer token; returns `{ id, email, name }`.
- **Testing requirements:** Mocked in ProfilePage tests.
- **Completion criteria:** Single shared helper for profile fetch.

### FE-04 — Context: refresh signed-in user without new token

- **Description:** Allow Profile success path to update stored/context user while keeping the same access token.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/context/SignedInContext.tsx`; optionally `auth-storage.ts` if a dedicated `saveAuthUser` helper is cleaner
- **Dependencies:** None
- **Implementation details:**
  - Expose `updateSignedInUser(user: AuthUser)` (name flexible) that writes `saveAuthSession({ accessToken, user })` when authenticated and updates state.
  - Do not clear token on update.
  - `signOut` remains the 401 path.
- **Testing requirements:** Profile success test asserts storage/context user updated.
- **Completion criteria:** Navbar/context reflect API user after successful profile load.

### FE-05 — ProfilePage fetch UX

- **Description:** Load profile from API; loading; errors; 401 clear+redirect; refresh user on success.
- **Scope:** `app`
- **Files or modules expected to change:** `ProfilePage.tsx`, `ProfilePage.css` (minimal), possibly App unchanged
- **Dependencies:** FE-03, FE-04
- **Implementation details:**
  - On mount when `accessToken` present: call `fetchCurrentUser`.
  - Loading state while in flight.
  - Success: render name + email from response; call `updateSignedInUser`.
  - `ApiRequestError` with `statusCode === 401` (use `HttpStatus`-style const map or shared status const — **no raw magic numbers** in page logic; e.g. `HttpStatusCode.UNAUTHORIZED` as const in app enums if not already present): `signOut()` + `navigate(SIGN_IN, { replace: true })`.
  - Other errors: set friendly `UiMessage.PROFILE_LOAD_ERROR` (or map 404 specifically to same friendly copy); keep session.
  - AbortController or `cancelled` flag for unmount / Strict Mode.
  - Do not use localStorage as the displayed source of truth for the loaded profile fields.
- **Testing requirements:** See FE-06.
- **Completion criteria:** Spec FE functional requirements 14–21 met.

### FE-06 — Frontend tests for profile protection and `/users/me` UX

- **Description:** Cover acceptance tests for profile gating and fetch behavior.
- **Scope:** `app`
- **Files or modules expected to change:** `app/src/pages/ProfilePage.test.tsx` (new); reuse `createTestJwt`, `SignedInProvider`, `MemoryRouter` patterns from `SignInPage.test.tsx`
- **Dependencies:** FE-05
- **Implementation details:**
  - Authenticated visit shows loading then name/email from mocked `fetchCurrentUser`.
  - Unauthenticated `/profile` via `RequireAuth` redirects to `/sign-in` (can test in Profile test harness wrapping `RequireAuth`, or dedicated small test — match existing router test style).
  - Non-401 error shows friendly message; auth storage still present.
  - 401 clears token/user and lands on `/sign-in`.
  - Assert Authorization path indirectly by ensuring `fetchCurrentUser` called (mock); optional assert client header in a focused client test if added.
- **Testing requirements:** `cd app && npm test` green including new cases.
- **Completion criteria:** Spec testing item 26 covered.

## Implementation order

1. FE-01, FE-02, FE-04 (parallel OK)
2. FE-03 → FE-05 → FE-06

**Full-stack sequencing:** Implement **backend BE-01…BE-06 first** (or at least BE-05 contract stable) before manual integration; FE tasks can be coded against mocks in parallel after contracts are fixed in this plan.

## Risks

- Stale closure / double-fetch leaving loading stuck — mitigate with abort/ignore.
- Changing `apiGet` error type might affect health gate — keep health treating any failure as unavailable.
- Showing context user briefly before fetch — prefer explicit loading UI so localStorage is not presented as confirmed DB truth.

## Technical decisions

- Bearer via shared client helper; profile uses `fetchCurrentUser`.
- 401 → `signOut` + redirect; 404/other → in-page error, session kept.
- Context gains user-update without re-issuing JWT.
- HTTP status comparisons via const map (align with project “no magic numbers” rule).
- **No new packages.**

## Assumptions

- `RequireAuth` + client JWT expiry checks remain sufficient for route gating; backend still enforces 401.
- Existing Vitest + Testing Library setup is enough (no new packages).
- Health `apiGet` can adopt `ApiRequestError` without UX change.

## Unresolved questions

None.

## Testing strategy

Vitest + Testing Library: ProfilePage (+ RequireAuth redirect) with mocked `fetchCurrentUser` / users API; reuse JWT test util and auth storage clear helpers.

## Full Stack alignment

| Concern | Backend | Frontend |
| --- | --- | --- |
| Endpoint | `GET /users/me` | `ApiRoute.USERS_ME` |
| Auth header | Bearer JWT | `Authorization: Bearer <token>` |
| 200 body | `{ id, email, name }` | `AuthUser` |
| 401 | Guard | clear + `/sign-in` |
| 404 | User missing | friendly error, keep session |
| Packages | none | none |
