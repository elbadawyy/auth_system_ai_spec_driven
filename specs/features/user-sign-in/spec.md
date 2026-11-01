# User Sign-in

## Feature overview

Implement full-stack user sign-in with email and password. The NestJS backend verifies credentials against the existing MongoDB user store and issues a short-lived JWT (1 hour). The React app adds `/sign-in`, stores the token and user in `localStorage`, and redirects to a hard-protected `/profile`. Signup is updated so successful registration also returns a JWT and follows the same client auth persistence and redirect. Navbar Login navigates to `/sign-in`; Logout clears client auth only (no backend logout).

## Problem statement

Login is a navbar no-op. Auth after signup is in-memory only (lost on refresh), with no JWT. Returning users cannot authenticate; `/profile` does not enforce a real session. Signup and a future sign-in flow need a consistent token-based signed-in experience.

## Goals and non-goals

**Goals**

- Navbar **Login** navigates to `/sign-in`, preserving existing navbar design where unchanged.
- Responsive `/sign-in` form (email + password) with client validation, field errors, loading / duplicate-submit prevention, and backend errors above the form.
- Backend sign-in endpoint with independent validation matching signup password/email rules; verify password hash; issue JWT; return token + user; never return password/hash.
- Same generic error for missing user and wrong password (no account enumeration).
- On sign-in success: persist JWT + user in `localStorage`, set signed-in UI state, redirect to `/profile`.
- Update signup: after persist, issue JWT; return token + user; frontend saves to `localStorage` and redirects to `/profile` (same as sign-in).
- Hard-protect `/profile`: no valid JWT → redirect to `/sign-in`.
- Logout clears client JWT + signed-in state; restore Login + Sign Up; no backend logout endpoint.
- JWT secret and expiry from env (1 hour); no hardcoded secrets; passwords remain hashed at rest.
- Backend unit tests for sign-in and signup JWT changes; frontend tests for validation, errors, loading, success, storage, redirect, and signup auth (after approved test tooling).

**Non-goals**

- Refresh tokens, token revocation lists, or backend logout.
- Forgot Password, Email Verification, social login.
- Full profile management / edit profile.
- Rate limiting packages (unless separately approved).
- Unrelated refactors or package installs without approval.

## User stories

- As a registered user, I want to sign in with email and password so I can access my profile.
- As a user, I want invalid credentials to show a generic error so accounts cannot be enumerated.
- As a new user, I want signup to leave me signed in with a JWT so I do not have to sign in again immediately.
- As a signed-in user, I want `/profile` available after refresh while my JWT is valid.
- As a visitor, I want `/profile` to send me to sign-in when I am not authenticated.
- As a signed-in user, I want Logout to clear my local session so I return to the signed-out navbar.

## Functional requirements

### Navigation and routing

1. When signed out, navbar **Login** navigates to `/sign-in` (no longer a no-op).
2. **Sign Up** remains and navigates to `/signup`; design/behavior preserved where unchanged.
3. Routes include at least: `/`, `/sign-in`, `/signup`, `/profile`.
4. If the client has a **valid** JWT and the user opens `/sign-in` or `/signup`, redirect to `/profile`.

### Sign-in page (`/sign-in`)

5. Fields: **Email**, **Password** (required).
6. Client validation before API call:
   - Email: required; valid email format.
   - Password: required; minimum length **8**; at least one letter; one digit; one special character (`[^A-Za-z0-9]`) — same rules as signup.
7. Show clear per-field validation messages.
8. On submit: loading state; disable submit to prevent duplicate in-flight requests.
9. Call backend sign-in API; show backend/business errors in a banner above the form.
10. Invalid credentials / unknown account: display a generic message equivalent to: *“Invalid email or password. Please check your credentials and try again.”* (exact copy via UI enums/const maps).
11. On success: save `accessToken` and `user` to `localStorage`; set signed-in UI state; navigate to `/profile`.

### Profile route protection (`/profile`)

12. If there is **no valid JWT**, hard-redirect to `/sign-in` (do not show the prior “not signed in” profile content as the steady state).
13. If JWT is valid and user info is available: show the existing signed-in profile success content (name/email). No full profile management.

### Navbar and Logout

14. Signed-in (valid JWT + user state): show **Logout**; hide **Sign Up**; brand unchanged.
15. **Logout**: clear `localStorage` auth data and in-memory signed-in state; navbar returns to Login + Sign Up; **no** backend logout call. If the user was on `/profile`, protection then redirects to `/sign-in`.

### Backend sign-in API

16. Expose **`POST /users/signin`** under the users module (Nest conventions).
17. Accept JSON: `email`, `password`.
18. Server validation independently mirrors frontend rules (email format; password length/complexity).
19. Normalize email: trim + lowercase (same as signup).
20. Find user by normalized email; verify password against stored hash (reuse existing hashing approach / comparer).
21. If user missing **or** password mismatch: respond with HTTP **401 Unauthorized** and the same generic invalid-credentials message (via enums); do not reveal which failed.
22. On success: issue JWT (payload at least subject/user id; may include email); expiry **1 hour**; return JSON **without** password:

```json
{
  "message": "<success message via project enums/const maps>",
  "accessToken": "<jwt>",
  "user": {
    "id": "<string>",
    "email": "<normalized email>",
    "name": "<name>"
  }
}
```

23. Use existing global exception filter / error shape; extend message/error enums as needed.
24. JWT signing secret and expiry configured via **env** (e.g. `JWT_SECRET`, `JWT_EXPIRES_IN`); document in `.env.example`; never hardcode secrets.

### Signup JWT update

25. After successful user persistence, generate the same style of JWT and change signup success body to include `accessToken` alongside `message` and `user` (same shape as sign-in success).
26. Frontend signup: on success, save `accessToken` + `user` to `localStorage`, set signed-in state, redirect `/profile` (replace in-memory-only auth).

### Persistence and “valid JWT”

27. Client persists at least `accessToken` and `user` (`id`, `email`, `name`) in `localStorage`.
28. On app load, hydrate signed-in state from `localStorage` if the token is present and not expired (`exp`); otherwise clear auth storage and treat as signed out.
29. No refresh-token flow in this feature.

### Testing

30. **Backend (Jest, existing):** sign-in success (token + user, no password); validation failures; unknown email → generic 401; wrong password → same generic 401; password verified against hash; signup success now includes JWT; existing signup cases still pass where applicable.
31. **Frontend:** tests for client validation, generic credential error display, loading/duplicate submit, success persistence + redirect, signup auth persistence + redirect. Because **no frontend test framework exists today**, planning/dev must obtain approval before adding Vitest + React Testing Library (or an agreed equivalent); tests are still in scope for this feature.

## Business rules

- Scope is **Full Stack**; frontend talks to backend over HTTP only.
- JWT lifetime is **1 hour**; **no refresh tokens**.
- Missing user and wrong password share one **401** + generic message.
- Email uniqueness/lookup is case-insensitive after normalization.
- Passwords never returned or stored in plain text; hashing remains bcrypt-based as today.
- `/profile` requires a valid client JWT; otherwise redirect to `/sign-in`.
- Logout is **client-only** clear of token + user state.
- Do not duplicate parallel auth stacks; extend users module / shared JWT helper as appropriate (package choices deferred to planning with approval).
- Health-unavailable UX from the home-page feature remains in force for the app shell.
- Locked contracts: routes `/sign-in`, `/profile`; API `POST /users/signin`; signup + sign-in success include `accessToken` + `user`.

## Acceptance criteria

- Navbar Login goes to `/sign-in` when signed out.
- `/sign-in` validates email/password rules before calling the API; shows field errors; blocks duplicate submits while loading.
- Wrong password and unknown email both yield the same generic UI/API error; HTTP 401 on the API.
- Successful sign-in returns JWT + user (no password); client stores them in `localStorage` and lands on `/profile`.
- Successful signup returns JWT + user; client stores them and lands on `/profile`.
- Refresh with a still-valid JWT keeps signed-in navbar and allows `/profile`.
- Visiting `/profile` without a valid JWT redirects to `/sign-in`.
- Visiting `/sign-in` or `/signup` with a valid JWT redirects to `/profile`.
- Logout clears client auth and restores Login + Sign Up; no logout API.
- JWT secret/expiry come from env; expiry is 1 hour; no secrets in source.
- Required backend unit tests pass; frontend tests listed above exist and pass once the approved FE test stack is in place.
- No forgot-password, email verification, social login, refresh tokens, or full profile management.

## Edge cases

- Empty/invalid fields on sign-in → client errors; no API call.
- Email casing variants → normalized lookup.
- Double-click submit → single in-flight request.
- Backend down / network error → user-friendly error; health gate behavior unchanged.
- Expired JWT in `localStorage` → treat as signed out; clear storage; `/profile` → `/sign-in`.
- Logout while on `/profile` → clear auth → redirect to `/sign-in` via protection.
- Signup duplicate email still **409**; no token issued; no auth persistence.
- Validation failure on signup/sign-in → no token; no auth persistence.

## Dependencies

- Existing: users module, bcrypt hashing, TypeORM MongoDB user entity, signup DTO/validation patterns, global exception filter, enums, Jest on API, React Router, `SignedInContext`, `VITE_API_URL`, navbar/home health gate.
- Introduce (planning; **ask before install**): JWT library / Nest JWT support as needed; frontend test runner (Vitest + Testing Library or equivalent).
- Env: `JWT_SECRET`, `JWT_EXPIRES_IN` (or equivalent) in `api/.env` + `.env.example`.
- Prior features: Application Home Page; User Signup (auth model superseded for persistence/JWT by this feature).

## Backend and frontend scope

| Area | Scope |
| --- | --- |
| **Backend (`api/`)** | `POST /users/signin`; credential verify; JWT issue; env-based JWT config; signup response includes `accessToken`; enums/filter updates; unit tests. |
| **Frontend (`app/`)** | `/sign-in` page + Login link; validation/UX; API client; `localStorage` + hydrate; hard `/profile` guard; signup success uses JWT flow; Logout clear; FE tests after tooling approval. |

**Classification:** **Full Stack**

## Open questions

None.
