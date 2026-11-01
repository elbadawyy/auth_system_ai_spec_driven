# User Profile Page & Current User API

## Feature overview

Add a protected current-user API and wire the existing `/profile` page to load Name and Email from the backend. The NestJS API exposes **`GET /users/me`**, protected by a **custom JWT `CanActivate` guard** that verifies a Bearer token with the already-installed `@nestjs/jwt` / `JwtService` (no Passport). The React app keeps route protection via `RequireAuth`, sends the stored JWT on the `/users/me` request, and treats the API response as the source of truth for displayed profile data.

## Problem statement

Sign-up/sign-in already issue JWTs and gate `/profile` on the client, but the profile UI reads **localStorage** only. There is no server endpoint to resolve the current user from a validated JWT, no Nest guard to protect authenticated routes, and the shared API client does not attach `Authorization`. Profile data can be stale or wrong relative to MongoDB, and there is no consistent authenticated “who am I?” contract.

## Goals and non-goals

**Goals**

- Expose **`GET /users/me`** under the users module, protected by a custom Nest JWT guard using existing `@nestjs/jwt`.
- Identify the caller from the validated JWT (`sub`), load the user from MongoDB, return profile fields, never return password/hash.
- Return **401** when the token is missing/invalid/expired; **404** when the token is valid but the user no longer exists.
- Protect `/profile` for authenticated users only (reuse `RequireAuth`); unauthenticated users redirect to `/sign-in`.
- On `/profile` load, fetch current user from **`GET /users/me`** (not localStorage as display source of truth).
- Show at least **Name** and **Email**, with loading and user-friendly error states; on **401**, clear stored auth and redirect to `/sign-in`.
- Send the JWT on authenticated API calls (extend shared client as needed).
- Backend and frontend tests covering the cases listed under Functional requirements / Acceptance criteria.
- Reuse existing JWT issue, storage, and signed-in context; no second auth mechanism.

**Non-goals**

- Profile edit, password change, avatars, account deletion.
- Passport / `passport-jwt` / Nest Passport `JwtAuthGuard`.
- Refresh tokens, token revocation, backend logout.
- Changing sign-in/sign-up flows except as required to integrate `/users/me` (e.g. shared types or client helpers).
- New npm dependencies without separate approval (none expected for this feature).
- Unrelated refactors.

## User stories

- As an authenticated user, I want a protected `/profile` page so I can view my personal account information.
- As an authenticated user, I want `/profile` to load my name and email from the backend so the page reflects the database, not only cached client data.
- As a visitor without a valid JWT, I want `/profile` to send me to `/sign-in` so private account data is not shown.
- As a user whose session is rejected by the API (401), I want local auth cleared and to be sent to `/sign-in` so I am not stuck in a broken signed-in state.
- As a user, I want a clear loading state and friendly errors when the profile request fails for non-auth reasons.

## Functional requirements

### Backend — JWT guard and identity

1. Introduce a **custom Nest `CanActivate` guard** that:
   - Reads the `Authorization` header expecting `Bearer <token>`.
   - Verifies the token with existing `@nestjs/jwt` / `JwtService` and the same secret/config used for signing.
   - On missing, malformed, invalid, or expired token: reject with HTTP **401 Unauthorized** (project enums / exception filter shape).
   - On success: attach validated identity (at least user id from JWT `sub`; email from payload may be available but **must not** replace DB load for profile fields) for use by the controller/handler.
2. Do **not** add Passport, `passport-jwt`, or `@nestjs/passport`.
3. Provide a clear way for the `/users/me` handler to read the authenticated user id from the request (e.g. decorator or typed request property — exact mechanism left to planning).

### Backend — `GET /users/me`

4. Expose **`GET /users/me`** on the existing users controller/module.
5. Protect the route with the custom JWT guard.
6. Load the user from MongoDB by the JWT `sub` (user id). Repository must support lookup by id if missing today.
7. If the user is not found: HTTP **404 Not Found** with an appropriate enum-based message/error code.
8. On success: HTTP **200** JSON body matching the existing auth user shape (no password/hash):

```json
{
  "id": "<string>",
  "email": "<normalized email>",
  "name": "<name>"
}
```

9. Never return `password`, `passwordHash`, or other secrets.
10. Follow Nest module → controller → service → repository conventions; reuse users service for cross-cutting access; extend message/error enums as needed; use `HttpStatus` / project enums, not magic status numbers in app logic.

### Frontend — routing and auth reuse

11. Keep `/profile` behind existing `RequireAuth` (no valid client JWT → redirect `/sign-in`).
12. Reuse `SignedInContext`, `auth-storage`, and existing JWT validity checks for route gating and token supply.
13. Do not introduce a second client auth mechanism.

### Frontend — Profile page

14. When `/profile` loads for an authenticated user, call **`GET /users/me`** with the stored access token.
15. Display at least **Name** and **Email** from the API response (not from localStorage as the source of truth for that render).
16. Show a **loading** state while the request is in flight.
17. On HTTP **401**: clear stored auth (token + user) and signed-in context, then redirect to `/sign-in`.
18. On **404** or other non-401 API/network failures: show a **user-friendly error** on the profile page (via UI enums/const maps); do not clear the session solely because of 404/other errors.
19. After a **successful** `/users/me` response: update `SignedInContext` and `localStorage` user with the returned `{ id, email, name }` so navbar/other signed-in UI stays consistent with the backend.
20. Keep a clean, modern, responsive layout by extending the existing ProfilePage styles; no new UI libraries.
21. Continue to respect the existing backend health gate (unavailable modal) already used app-wide.

### Frontend — API client

22. Extend the shared API client (or authenticated helper) so authenticated calls send `Authorization: Bearer <accessToken>`.
23. Prefer aligning `apiGet` error handling with structured `ApiRequestError` (as `apiPost` does) so status codes like 401/404 are distinguishable for profile handling.
24. Add `users/me` to frontend API route enums/const maps and a typed fetch helper.

### Testing

25. **Backend:** success returns profile without password; no token → 401; invalid/expired token → 401; valid token but missing user → 404.
26. **Frontend:** authenticated access to `/profile`; unauthenticated redirect to `/sign-in`; loads/displays name and email from `/users/me`; loading state; non-401 error message; 401 clears auth and redirects to `/sign-in`.

## Business rules

- Scope is **Full Stack**; frontend talks to backend over HTTP only.
- JWT remains the sole auth credential; lifetime and signing stay as configured for sign-in/sign-up (`JWT_SECRET`, `JWT_EXPIRES_IN`).
- Profile identity always comes from **validated JWT `sub`**, never from a client-supplied user id path/query/body.
- Displayed profile fields on `/profile` come from **`GET /users/me`**, not from trusting localStorage alone.
- Password hashes never appear in API responses.
- No Passport packages for this feature.
- No profile mutation in this feature.

## Acceptance criteria

- [ ] `GET /users/me` with a valid Bearer JWT returns **200** and `{ id, email, name }` for that user; response contains no password/hash.
- [ ] `GET /users/me` without a token, or with an invalid/expired token, returns **401**.
- [ ] `GET /users/me` with a valid token whose `sub` does not match any user returns **404**.
- [ ] Guard uses `@nestjs/jwt` verification only; no Passport dependencies added.
- [ ] Visiting `/profile` without a valid client JWT redirects to `/sign-in`.
- [ ] Visiting `/profile` when authenticated shows loading, then Name and Email from `/users/me`.
- [ ] Profile request sends `Authorization: Bearer <token>`.
- [ ] HTTP **401** from `/users/me` clears client auth storage/context and redirects to `/sign-in`.
- [ ] Non-401 failures show a friendly error on `/profile`.
- [ ] Successful fetch refreshes stored/context user from the API payload.
- [ ] Backend and frontend tests listed above pass.
- [ ] Sign-in/sign-up behavior unchanged except for shared integration points required by this feature.

## Edge cases

- Missing `Authorization` header or non-Bearer scheme → **401**.
- Malformed JWT or bad signature → **401**.
- Expired JWT (`exp`) → **401** (backend); client `RequireAuth` / token validity may already redirect before fetch, but `/users/me` must still enforce 401.
- Token valid, user deleted from MongoDB → **404**; profile shows friendly error; session not auto-cleared (user may still Logout manually).
- Backend down / network failure → friendly error (and existing health-unavailable UX may already apply).
- Stale localStorage name/email vs DB → UI shows DB values after successful `/users/me`; storage updated on success.
- Double navigation / remount while fetching → avoid leaving the UI stuck in loading without error or data (planning/dev detail; behavior must end in data, error, or 401 redirect).

## Dependencies

- Existing user sign-up / sign-in JWT issuance (`JwtTokenService`, `@nestjs/jwt`, env `JWT_SECRET` / `JWT_EXPIRES_IN`).
- Existing `User` entity / MongoDB users collection (`id`, `email`, `name`, `passwordHash`).
- Existing frontend auth: `auth-storage`, `SignedInContext`, `RequireAuth`, `/profile` route, ProfilePage shell.
- Existing shared API client and health gate.
- Existing Jest (API) and frontend test setup from prior auth features.
- **No new packages** expected; Passport explicitly out of scope.

## Backend and frontend scope

| Area | In scope |
| --- | --- |
| **Backend (`api/`)** | Custom JWT `CanActivate` guard; identity attachment for handlers; `GET /users/me`; user lookup by id; profile DTO/response mapping; enums/messages; unit/integration-style tests for auth success/401/404/no password. |
| **Frontend (`app/`)** | Authenticated API GET with Bearer token; `/users/me` client helper + types/routes; ProfilePage fetch, loading, error, 401 → clear + redirect; refresh context/storage on success; tests for protection, fetch/display, loading/errors, 401 handling. |
| **Out of both** | Edit profile, password change, avatars, deletion, Passport, refresh tokens. |

## Open questions

None — path and guard approach decided; remaining items use the approved defaults (response shape `{ id, email, name }`, 401 clears auth + redirect, 404/other errors show friendly message without clearing session, refresh local/context user on successful fetch, extend existing Profile UI).
