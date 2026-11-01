# Backend plan: User Sign-in

## Overview

Extend the existing NestJS `users` module with `POST /users/signin` (credential verify + JWT), add env-driven JWT issuance shared by sign-in and signup, update signup success to include `accessToken`, and cover the new behavior with Jest unit tests. No Passport, no protected backend routes, no refresh/logout APIs.

## Scope

| In scope | Out of scope |
| --- | --- |
| `POST /users/signin`, JWT issue (1h), signup `accessToken`, env docs, enums, `PasswordHasher.compare`, unit tests | Refresh tokens, revocation, backend logout, rate limiting, Passport guards, frontend |
| Reuse `users` module / repository / hashing | Packages beyond the locked decisions below without a new approval |

## Architecture

Stay in `api/src/modules/users/` (controller → service → repository → entity):

| Piece | Role |
| --- | --- |
| `users.controller.ts` | Add `POST /users/signin`; keep `POST /users/signup` |
| `users.service.ts` | Sign-in verify; after signup persist, issue JWT; shared success shape |
| `dto/signin.dto.ts` | `email` + `password` validation (mirror signup rules) |
| `password.hasher.ts` | Add `compare(plain, hash)` via bcrypt |
| `jwt-token.service.ts` (new) | Sign JWTs from env config; injectable for tests |
| `JwtModule` / token helper | Registered in `UsersModule` via `@nestjs/jwt` |

No separate `auth` module for this feature — extend users + shared JWT helper (per spec).

## Data model

No schema change. Reuse `User` (`email`, `name`, `passwordHash`). JWT is not stored in MongoDB.

**JWT payload (minimum):** `{ sub: userId, email }` (+ standard `iat` / `exp` from signer).

## API contracts

### `POST /users/signin`

Request:

```json
{ "email": "string", "password": "string" }
```

Success **`200 OK`**:

```json
{
  "message": "<ApiMessage.USER_SIGNIN_SUCCESS>",
  "accessToken": "<jwt>",
  "user": { "id": "<string>", "email": "<normalized>", "name": "<name>" }
}
```

Errors (existing filter `{ statusCode, errorCode, message, path, timestamp }`):

| Case | HTTP | `errorCode` |
| --- | --- | --- |
| Validation failure | 400 | `BAD_REQUEST` |
| Unknown email **or** wrong password | 401 | `UNAUTHORIZED` — same message (`USER_INVALID_CREDENTIALS`) |
| Unexpected | 500 | `INTERNAL_ERROR` |

### `POST /users/signup` (updated)

Success **`201 Created`** — add `accessToken`; keep `message` + `user` (no password):

```json
{
  "message": "<ApiMessage.USER_SIGNUP_SUCCESS>",
  "accessToken": "<jwt>",
  "user": { "id": "<string>", "email": "<normalized>", "name": "<name>" }
}
```

Duplicate email remains **409** with no token.

Shared success shape for both endpoints: `{ message, accessToken, user }`.

## Auth and authorization

- Issue JWT only; **no** JwtAuthGuard / Passport for this feature (profile protection is client-side).
- Secret / expiry from env: `JWT_SECRET`, `JWT_EXPIRES_IN=1h` (document in `api/.env.example`).
- **Fail fast at module init** if `JWT_SECRET` is missing (no hardcoded fallback secret).

## Error handling

- `UnauthorizedException(ApiMessage.USER_INVALID_CREDENTIALS)` for missing user and bad password.
- Filter already maps `HttpStatus.UNAUTHORIZED` → `ErrorCode.UNAUTHORIZED`.
- Extend `ApiMessage` with sign-in success + invalid-credentials strings.

## Security and performance

- Reuse bcrypt via `PasswordHasher.compare`.
- Never return `password` / `passwordHash`.
- Normalize email: trim + lowercase (DTO `@Transform` + service, same as signup).
- Rate limiting deferred (ask separately if needed).
- Do not log passwords or JWT secrets.

## Migrations or data changes

None.

## Locked package decision

| ID | Decision |
| --- | --- |
| **BE-PKG-A** | Install `@nestjs/jwt` in `api/`. **No** `@nestjs/passport` / `passport-jwt`. |

## Tasks

### BE-01 — Env + API messages for JWT / sign-in

- **Description:** Document JWT env vars; add sign-in success and invalid-credentials messages.
- **Scope:** `api`
- **Files or modules expected to change:** `api/.env.example`, `api/src/common/enums/api-message.enum.ts` (local `api/.env` for developers — do not commit secrets)
- **Dependencies:** None
- **Implementation details:**
  - Add `JWT_SECRET=` (placeholder) and `JWT_EXPIRES_IN=1h` to `.env.example`.
  - Add `USER_SIGNIN_SUCCESS`, `USER_INVALID_CREDENTIALS` (generic copy aligned with FE).
- **Testing requirements:** Enum values exist and are used by later tasks; no secret values in source.
- **Completion criteria:** `.env.example` documents both vars; messages available via `ApiMessage`.

### BE-02 — PasswordHasher.compare

- **Description:** Add bcrypt compare for sign-in verification.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/password.hasher.ts` (+ small unit coverage if present or via service tests)
- **Dependencies:** None
- **Implementation details:** `compare(plainPassword: string, passwordHash: string): Promise<boolean>` using `bcrypt.compare`.
- **Testing requirements:** Covered by sign-in service tests (wrong/right password).
- **Completion criteria:** Compare returns true/false correctly; no plain password logging.

### BE-03 — JWT token service + module wiring

- **Description:** Injectable JWT issuer using env secret/expiry; register in `UsersModule`; fail fast if `JWT_SECRET` missing at module init.
- **Scope:** `api`
- **Files or modules expected to change:** new `api/src/modules/users/jwt-token.service.ts` (or equivalent), `users.module.ts`; use `JwtModule.registerAsync` + `ConfigService`
- **Dependencies:** **BE-PKG-A installed**; BE-01
- **Implementation details:**
  - `signAccessToken({ userId, email }): string` (or `Promise<string>`).
  - Payload at least `sub` + `email`; expiry from `JWT_EXPIRES_IN` (1h).
  - Read `JWT_SECRET` via `ConfigService` in `JwtModule.registerAsync` factory; **throw at module init** if unset (no hardcoded secret).
- **Testing requirements:** Unit-testable with mocked `JwtService` / stub signer.
- **Completion criteria:** Tokens signed with env config; missing secret fails module init; module provides the helper to `UsersService`.

### BE-04 — SignInDto

- **Description:** DTO with same email/password rules as signup (no name).
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/dto/signin.dto.ts`, `dto/signin.dto.spec.ts`
- **Dependencies:** None (pattern from `signup.dto.ts`)
- **Implementation details:**
  - `@Transform` email trim+lowercase; `@IsEmail`; password `@MinLength(8)` + letter/digit/special `@Matches` (same regexes as signup).
  - Prefer shared password-constraint constants extracted from signup DTO if small and clean (optional, same task).
- **Testing requirements:** Jest: valid payload; invalid email; short password; missing letter/digit/special.
- **Completion criteria:** Spec mirrors signup password/email rules; DTO tests pass.

### BE-05 — UsersService.signin + signup JWT

- **Description:** Implement sign-in; change signup success to include `accessToken`.
- **Scope:** `api`
- **Files or modules expected to change:** `users.service.ts`, shared response types
- **Dependencies:** BE-02, BE-03, BE-04
- **Implementation details:**
  - `signin(dto)`: normalize email → `findByEmail` → if missing **or** `!compare` → `UnauthorizedException(USER_INVALID_CREDENTIALS)`; else sign JWT → return `{ message, accessToken, user }` (no password fields).
  - `signup`: after successful save, sign same-style JWT; return `{ message, accessToken, user }`.
  - Shared type e.g. `AuthSuccessResponse` for both.
- **Testing requirements:** See BE-07.
- **Completion criteria:** Sign-in and signup issue tokens; duplicates still 409 with no token; passwords never in responses.

### BE-06 — Controller endpoint

- **Description:** Expose `POST /users/signin`.
- **Scope:** `api`
- **Files or modules expected to change:** `users.controller.ts`
- **Dependencies:** BE-05
- **Implementation details:** `@Post('signin')` `@HttpCode(HttpStatus.OK)` body `SignInDto` → `usersService.signin`. Keep signup `201`.
- **Testing requirements:** Covered by service tests; optional thin controller test not required if service coverage is complete.
- **Completion criteria:** Route is `POST /users/signin`; signup route unchanged aside from response body.

### BE-07 — Backend unit tests

- **Description:** Extend/add Jest coverage for sign-in and signup JWT.
- **Scope:** `api`
- **Files or modules expected to change:** `users.service.spec.ts`, `signin.dto.spec.ts` (from BE-04), update existing signup expectations for `accessToken`
- **Dependencies:** BE-04, BE-05, BE-06
- **Implementation details:** Cases:
  - Sign-in success: `accessToken` + `user`; no password/hash.
  - Validation failures (DTO).
  - Unknown email → same 401 / message as wrong password.
  - Wrong password → same generic 401; `compare` called with stored hash.
  - Signup success includes JWT; prior signup cases still pass with updated shape.
- **Testing requirements:** `npm test` in `api/` green for users module.
- **Completion criteria:** Spec testing requirements (30) satisfied for backend.

## Implementation order

1. Install **BE-PKG-A** (`@nestjs/jwt`) with user approval already granted in this plan.
2. BE-01 → BE-02 → BE-03 → BE-04 → BE-05 → BE-06 → BE-07

## Risks

- Missing `JWT_SECRET` in local env breaks module init — mitigate via `.env.example` + fail-fast error message.
- Signup response contract break for FE — FE tasks must land in sync.
- Timing differences missing-user vs wrong-password — acceptable for this scope; optional dummy-hash compare later.

## Technical decisions

1. JWT via `@nestjs/jwt` **without** Passport (**BE-PKG-A** locked).
2. JWT helper lives under users module (no parallel auth stack).
3. Sign-in HTTP **200**; signup remains **201**.
4. Shared success shape `{ message, accessToken, user }`.
5. **Fail fast at module init** if `JWT_SECRET` missing (no hardcoded fallback).
6. Client verifies expiry via JWT `exp`; server does not store sessions.

## Assumptions

- Spec explicitly approved; supersedes in-memory-only signup auth.
- Existing unique email index and bcrypt hashing remain.
- No backend route protection required in this feature.

## Unresolved questions

None — package choice, HTTP status codes, shared response shape, and JWT_SECRET fail-fast timing are locked.

## Testing strategy

Jest unit tests for DTO + service (mocked repository, hasher, JWT signer). No e2e required for this plan unless asked later.
