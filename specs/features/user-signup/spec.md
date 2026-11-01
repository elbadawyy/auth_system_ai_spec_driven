# User Signup

## Feature overview

Implement full-stack user signup so a visitor can create an account with email, name, and password. The frontend adds a Sign Up entry point and `/signup` form; the NestJS backend validates input, rejects duplicate emails, hashes the password, and persists the user in MongoDB. On success, the app navigates to a profile page and shows a **client-only, in-memory** signed-in UI (navbar Logout; no JWT, cookie, or server session).

## Problem statement

The app has a Home Page with a non-functional Login control and no way to register. There is no users module, user entity, signup API, or client routing for signup/profile. New users cannot create accounts through the product UI or API.

## Goals and non-goals

**Goals**

- Navbar **Sign Up** next to **Login**, navigating to `/signup`, preserving existing navbar design/behavior where unchanged.
- Responsive `/signup` form with email, name, and password; client validation; loading/disabled submit; clear client and backend error/success feedback.
- Backend signup endpoint with the same validation rules, duplicate-email prevention, password hashing, and persistence via existing TypeORM + MongoDB conventions.
- After validation succeeds (and the email is not a duplicate), persist **email**, **name**, and **hashed password** to MongoDB; never store the plain-text password.
- Failed validation or duplicate email must **not** write a user document.
- Backend unit tests for success, validation failures, duplicate email, hashing before persistence, and DB/service failure handling.
- After successful signup: navigate to `/profile`, show a signed-in success message, set in-memory client signed-in state from the API user payload, switch navbar **Login → Logout**, and **hide Sign Up**.
- **Logout** is a visible no-op placeholder until a future logout feature.
- Without signed-in state, `/profile` stays on the page with a simple “not signed in” message; navbar remains Login + Sign Up.

**Non-goals**

- Real authentication sessions, JWT, cookies, or tokens.
- Functional Login, Forgot Password, Email Verification, or Logout behavior.
- Persisting signed-in UI across refresh (`localStorage` / similar).
- Rate limiting (defer unless separately approved; project rules require asking before new packages).
- Unrelated refactors or package installs without approval.

## User stories

- As a visitor, I want a Sign Up control in the navbar so I can open registration.
- As a visitor, I want to submit email, name, and password with clear validation so I know what is required.
- As a visitor, I want duplicate or invalid submissions rejected clearly so I can correct them.
- As a new user, after signup I want a profile success view and navbar that looks signed in (Logout) so the flow feels complete — even though auth is client-only for now.
- As a visitor who opens `/profile` without signed-in UI state, I want a simple not-signed-in message so the page is not a blank or broken state.

## Functional requirements

### Navigation and routing

1. Navbar includes **Sign Up** next to existing **Login** when the user is **not** in client signed-in state.
2. Clicking **Sign Up** navigates to `/signup`.
3. **Login** remains a no-op (no navigation, no API) in this feature, consistent with the Home Page story.
4. App supports routes at least: `/` (home), `/signup`, `/profile`.
5. Existing Home Page content, health-check gate, and unavailable modal behavior remain available for the app shell as already specified.

### Signup page (`/signup`)

6. Form fields: **Email**, **Name**, **Password** (all required).
7. Client validation before submit:
   - Email: required; valid email format.
   - Name: required; minimum length **3**.
   - Password: required; minimum length **8**; at least one letter (`A–Z` / `a–z`); at least one digit (`0–9`); at least one **special character** defined as any non-alphanumeric (`[^A-Za-z0-9]`).
8. Show clear per-field (or equivalent) validation messages.
9. On submit: show loading state; disable submit to prevent duplicate in-flight submissions.
10. Call the backend signup API; surface backend validation/business errors in the UI.
11. On success: set **in-memory** client signed-in state from the response user (`id`, `email`, `name`); navigate to `/profile`; do not store tokens.

### Profile page (`/profile`)

12. When client signed-in state **is** set: show a success / signed-in message (e.g. that the user is signed in; may include display name or email). Exact copy may be refined in implementation as long as intent is clear.
13. When client signed-in state is **not** set: stay on `/profile`; show a simple “not signed in” (or equivalent) message; navbar shows Login + Sign Up.

### Navbar signed-in UI

14. When client signed-in state **is** set: show **Logout** instead of **Login**; **hide Sign Up**; brand unchanged.
15. **Logout** click does nothing observable (no state clear, no navigation, no API) in this feature.
16. Client signed-in state is **in-memory only**; full page refresh clears it (signed-out navbar and profile “not signed in” if on `/profile`).

### Backend signup API

17. Expose signup via existing Nest routing conventions: **`POST /users/signup`** (users feature module).
18. Accept JSON body: `email`, `name`, `password`.
19. Server-side validation independently mirrors frontend rules (including special character = non-alphanumeric).
20. Normalize email for uniqueness: trim and lowercase; compare/store using the normalized form so `User@Example.com` and `user@example.com` conflict.
21. If a user with that email already exists: reject with HTTP **`409 Conflict`** and a clear duplicate-email error, using the consistent JSON error shape via the existing exception filter (extend error codes if needed). Do **not** create or update a user document.
22. If validation fails: return an appropriate client-error response (e.g. `400 Bad Request`). Do **not** create a user document.
23. After validation succeeds and the email is confirmed unique: hash the password, then **persist** a new user in MongoDB with at least **email** (normalized), **name**, and **hashed password**. Never store or return the plain-text password.
24. On success, return JSON **without** password:

```json
{
  "message": "<success message via project enums/const maps>",
  "user": {
    "id": "<string>",
    "email": "<normalized email>",
    "name": "<name>"
  }
}
```

25. Unexpected failures (including DB/service errors after validation) return the existing internal-error style response (no secrets/stack traces to the client) and must not leave a successfully committed user with a plain-text password.

### Backend unit tests

26. Cover with the existing Jest setup (`*.spec.ts`): successful signup; invalid email; name length &lt; 3; password length &lt; 8; password without letter; without number; without special character; duplicate email; password hashed before persistence (plain password not stored); DB/service failure handling.

## Business rules

- Scope is **Full Stack**; frontend talks to backend over HTTP only.
- No JWT, cookie, or server session in this feature; “signed in” is **client UI state only**.
- Signed-in UI does **not** survive refresh.
- Email uniqueness is **case-insensitive** after normalization (lowercase).
- Password special character = any character outside `[A-Za-z0-9]`.
- A user document is written to MongoDB **only** after input validation succeeds and the email is not already registered.
- Persisted credentials: store **email**, **name**, and **hashed password** only — never the plain-text password.
- Failed validation and duplicate-email cases must not persist a new user.
- Passwords are never returned in API responses or logged.
- Duplicate email is HTTP **409 Conflict**, not a generic silent failure.
- Logout and Login are non-functional placeholders in this feature.
- While client signed-in: Sign Up hidden; Logout shown.
- Health unavailable behavior from the Home Page feature remains in force for the app; signup should not bypass “backend down” UX where the shared shell applies.
- Locked routes/contracts: profile `/profile`; API `POST /users/signup`; success body `{ message, user: { id, email, name } }`.

## Acceptance criteria

- Navbar shows **Sign Up** beside **Login** when signed out; Sign Up goes to `/signup`.
- `/signup` validates email, name (≥3), password (≥8, letter, number, special/non-alphanumeric) before calling the API.
- Invalid client input shows clear messages and does not call the API (or does not proceed as success).
- While a signup request is in flight, the form shows loading and blocks duplicate submits.
- Successful signup **persists** a MongoDB user with normalized email, name, and a **hashed** password (plain text never stored), and returns success JSON with `user.id`, `user.email`, `user.name` and no password.
- Validation failure does **not** create a user in MongoDB.
- Duplicate email (including different casing) is rejected with **HTTP 409** and a clear error; UI displays it; no new user is written.
- Backend validation failures and unexpected errors produce appropriate responses; UI shows a suitable error.
- After success, app is on `/profile` with a signed-in success message; navbar shows **Logout** only (no Sign Up); Logout is a no-op.
- Refresh clears signed-in UI; `/profile` then shows not-signed-in content with Login + Sign Up.
- Opening `/profile` when signed out does not redirect away; shows not-signed-in message.
- Required backend unit tests listed above pass.
- No login session/token, email verification, forgot password, or real logout implementation ships in this feature.

## Edge cases

- Submit with empty fields → client validation errors.
- Whitespace-only name/email → treat as invalid / normalize email trim; name must still meet length after sensible trim if trimming is applied (recommend trim name/email before validate).
- Email differs only by case from existing user → duplicate error (409); no write.
- Password with only symbols that are non-alphanumeric but no letter/digit → fail letter/digit rules; no write.
- Password containing space or emoji → satisfies special-character rule if letter and digit also present.
- Double-click / rapid resubmit → only one in-flight request; no duplicate success UX from parallel submits.
- Backend down / network error on signup → user-friendly error (and existing unavailable modal still applies when health gate says down).
- Success then refresh → signed-out UI; account remains in DB.
- Visit `/signup` while client signed-in → still allow the route (no hard block); navbar remains Logout-only.
- Logout click → no change to signed-in state or route in this feature.

## Dependencies

- Existing: NestJS modules pattern, TypeORM MongoDB (`MONGODB_URI`), global HTTP exception filter, error/message enums, Jest unit tests, frontend navbar/home/health helpers, `VITE_API_URL`, shared API client patterns.
- Missing today (to be introduced in planning/dev with approvals as required): users module/entity/repository; signup DTO validation approach; password hashing library; frontend routing for `/signup` and `/profile`; API POST helper and types; client in-memory signed-in state.
- Prior feature: Application Home Page (navbar Login placeholder, health modal).
- Out of scope dependents: real auth/login/logout/session features.

## Backend and frontend scope

| Area | Scope |
| --- | --- |
| **Backend (`api/`)** | Users (or equivalent) module; `POST /users/signup`; DTO validation; email normalize + uniqueness; password hash; persist email/name/hashed password to MongoDB only on success; success/error responses including 409 on duplicate; unit tests listed above. |
| **Frontend (`app/`)** | Sign Up in navbar; routes `/signup` and `/profile`; signup form UX; API integration; in-memory signed-in state; profile success / not-signed-in messages; Login→Logout and hide Sign Up; Logout no-op. |

**Classification:** **Full Stack**

## Open questions

None.
