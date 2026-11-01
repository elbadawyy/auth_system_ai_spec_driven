# Backend plan: User Profile

## Overview

Add a custom Nest JWT `CanActivate` guard (no Passport), expose protected `GET /users/me`, load the user by JWT `sub` from MongoDB, and return `{ id, email, name }` with 401/404 behavior per the approved spec. Reuse the existing users module, `JwtModule` / `JwtService`, and `AuthUserResponse` shape.

## Scope

| In scope | Out of scope |
| --- | --- |
| Custom JWT guard, identity attachment, `GET /users/me`, `findById`, enums/messages, unit tests | Passport, refresh/revocation, profile mutation, frontend, new packages |

## Architecture

Stay in `api/src/modules/users/` (+ thin common auth helpers):

| Piece | Role |
| --- | --- |
| `jwt-auth.guard.ts` (new) | `CanActivate`: parse `Authorization: Bearer <token>`, verify via `JwtService` / shared helper, attach identity to request |
| `current-user.decorator.ts` (new) | Read authenticated user id from request for controllers |
| Auth request typing / const map | Request property key + Bearer scheme constants (no magic strings) |
| `jwt-token.service.ts` | Optional `verifyAccessToken` wrapper for consistent verify + testability (guard may inject `JwtService` or this helper) |
| `users.repository.ts` | Add `findById(id: string)` |
| `users.service.ts` | Add `getMe(userId)` → `AuthUserResponse` or 404 |
| `users.controller.ts` | Add `GET me` with `@UseGuards(JwtAuthGuard)` |
| `users.module.ts` | Register guard provider if needed; ensure `JwtService` injectable for guard |

No separate `auth` module required; JWT stays registered where it already is (`UsersModule`).

## Data model

No schema change. Reuse `User` (`id`, `email`, `name`, `passwordHash`). Lookup by string id → Mongo `ObjectId` in the repository.

## API contracts

### `GET /users/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Success `200 OK`:**

```json
{
  "id": "<string>",
  "email": "<normalized email>",
  "name": "<name>"
}
```

(Same fields as existing `AuthUserResponse`; **no** wrapping `message` / `accessToken`; **no** password/hash.)

**Errors** (existing filter shape `{ statusCode, errorCode, message, path, timestamp }`):

| Case | HTTP | `errorCode` |
| --- | --- | --- |
| Missing / non-Bearer / malformed / invalid / expired token | 401 | `UNAUTHORIZED` |
| Valid token, user id not in DB | 404 | `NOT_FOUND` |
| Unexpected | 500 | `INTERNAL_ERROR` |

## Auth and authorization

- Custom `CanActivate` only; **no** Passport / `@nestjs/passport` / `passport-jwt`.
- Verify with the same secret/config already used by `JwtModule.registerAsync` (`JWT_SECRET`, `JWT_EXPIRES_IN`).
- Identity for handlers comes from validated JWT `sub` only (never from client path/query/body).
- JWT payload email must **not** replace DB load for profile fields.

**Recommended identity mechanism:** after verify, set `request[AUTH_REQUEST_USER] = { userId: payload.sub }` (const key map); `@CurrentUser()` returns `userId` string.

## Error handling

- Guard: `UnauthorizedException(ApiMessage.AUTH_TOKEN_INVALID)` (or equivalent enum) for all token failures.
- Service: `NotFoundException(ApiMessage.USER_NOT_FOUND)` when `findById` returns null.
- Filter already maps 401 → `UNAUTHORIZED`, 404 → `NOT_FOUND`.

## Security and performance

- Never return `password` / `passwordHash`.
- Do not log tokens or secrets.
- Single DB read by id per `/users/me`.
- No new rate limiting in this feature.

## Migrations or data changes

None.

## Locked package decision

| ID | Decision |
| --- | --- |
| **BE-PKG** | **No new packages.** Use existing `@nestjs/jwt` / `JwtService`. |

## Tasks

### BE-01 — API messages for auth token / user not found

- **Description:** Add enum messages for 401 token failures and 404 missing user.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/common/enums/api-message.enum.ts`
- **Dependencies:** None
- **Implementation details:**
  - Add e.g. `AUTH_TOKEN_INVALID` (generic unauthorized copy for missing/invalid/expired/malformed Bearer token).
  - Add e.g. `USER_NOT_FOUND` for valid token with no DB user.
  - No magic strings in guard/service; use `ApiMessage` only.
- **Testing requirements:** Enum members exist and are referenced by later tasks/tests.
- **Completion criteria:** Messages available; `ErrorCode` unchanged (existing UNAUTHORIZED / NOT_FOUND suffice).

### BE-02 — Repository `findById`

- **Description:** Support loading a user by string id for `/users/me`.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/users.repository.ts`
- **Dependencies:** None
- **Implementation details:**
  - Add `findById(id: string): Promise<User | null>`.
  - Convert string → `ObjectId` (same ObjectId source style already used in tests/`mongodb` / TypeORM) and query via existing `MongoRepository` patterns (`findOne` / `findOneBy`).
  - Invalid ObjectId string → treat as not found (`null`), not 500 (service maps to 404).
- **Testing requirements:** Covered indirectly via service tests (mock repo); optional unit test if easy.
- **Completion criteria:** Service can resolve a user by JWT `sub` string id.

### BE-03 — JWT verify helper (optional thin wrapper) + custom JWT guard

- **Description:** Implement `CanActivate` guard that verifies Bearer JWT and attaches `userId` from `sub`.
- **Scope:** `api`
- **Files or modules expected to change:**
  - `api/src/modules/users/jwt-auth.guard.ts` (new)
  - optionally `api/src/modules/users/jwt-token.service.ts` (`verifyAccessToken`)
  - `api/src/modules/users/auth.constants.ts` (or similar `as const` / enum for header name, Bearer prefix, request user key)
  - `api/src/modules/users/users.module.ts` (ensure guard can inject JWT deps; export if needed)
- **Dependencies:** BE-01
- **Implementation details:**
  - Read `Authorization` header; require exact Bearer scheme; extract raw token.
  - Verify with `JwtService.verify` (or `JwtTokenService.verifyAccessToken`) using module config — same secret as sign.
  - Missing header, wrong scheme, empty token, verify throw (including expired) → `UnauthorizedException(ApiMessage.AUTH_TOKEN_INVALID)`.
  - On success: attach `{ userId: string }` from payload `sub` (validate `sub` is non-empty string; otherwise 401).
  - Do **not** load user from DB inside the guard.
  - No Passport.
- **Testing requirements:** Unit tests: missing header → 401; non-Bearer → 401; invalid/expired token → 401; valid token attaches `userId`.
- **Completion criteria:** Guard usable on controller routes; all token failure modes → 401 with enum message.

### BE-04 — `@CurrentUser` decorator

- **Description:** Provide a typed way for handlers to read authenticated user id from the request.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/current-user.decorator.ts` (new); possibly shared request type
- **Dependencies:** BE-03
- **Implementation details:**
  - Nest param decorator reading the same request key the guard sets.
  - Returns `userId: string` (or throws if missing — should not happen when guard ran).
- **Testing requirements:** Exercised via controller/service tests or a small decorator unit test.
- **Completion criteria:** `/users/me` handler can obtain `userId` without parsing headers again.

### BE-05 — `UsersService.getMe` + controller `GET /users/me`

- **Description:** Load profile by authenticated id; expose protected endpoint returning `{ id, email, name }`.
- **Scope:** `api`
- **Files or modules expected to change:** `users.service.ts`, `users.controller.ts`, related specs
- **Dependencies:** BE-02, BE-03, BE-04
- **Implementation details:**
  - Service `getMe(userId: string): Promise<AuthUserResponse>`: `findById` → if null `NotFoundException(ApiMessage.USER_NOT_FOUND)`; else map via existing `toUserId` / field mapping; never include hash.
  - Controller: `@Get('me')`, `@UseGuards(JwtAuthGuard)`, `@HttpCode(HttpStatus.OK)`, `@CurrentUser() userId`, call `getMe`.
  - Keep signup/signin unchanged.
- **Testing requirements:** Service tests: success without password/hash; missing user → NotFoundException. Controller/guard integration-style or unit tests covering: no token 401; invalid/expired 401; valid + missing user 404; valid + existing user 200 body shape.
- **Completion criteria:** Acceptance criteria for backend API + tests met; no Passport deps added.

### BE-06 — Backend test suite polish / regression

- **Description:** Ensure users service signup/signin tests still pass; add/complete guard + getMe coverage listed in the spec.
- **Scope:** `api`
- **Files or modules expected to change:** `users.service.spec.ts`, `jwt-auth.guard.spec.ts` (new), optionally controller spec
- **Dependencies:** BE-05
- **Implementation details:**
  - Extend repository mock with `findById` in service specs.
  - Mock `JwtService` / verify in guard specs.
  - Assert response objects have no `password` / `passwordHash`.
- **Testing requirements:** `cd api && npm test` green for new + existing users tests.
- **Completion criteria:** Spec testing items 25 covered on backend.

## Implementation order

1. BE-01 → BE-02 (parallel OK)
2. BE-03 → BE-04
3. BE-05 → BE-06

Full-stack note: complete backend (or at least stabilize the BE-05 contract) before relying on live FE integration; FE can develop against mocks in parallel.

## Risks

- TypeORM Mongo `findById` / ObjectId conversion edge cases (invalid hex) — map to null → 404.
- Guard placement vs JwtModule DI — register providers carefully inside `UsersModule`.
- Accidentally returning full entity — always map to `AuthUserResponse`.

## Technical decisions

- Custom `CanActivate` + `@CurrentUser()` (not Passport).
- Response body is bare `{ id, email, name }` (not wrapped in auth success envelope).
- Guard does token auth only; service does DB existence check (404).
- Prefer `JwtTokenService.verifyAccessToken` **or** direct `JwtService` in guard — pick one injectable path and stick to it for tests (recommend verify via existing JWT wiring in `UsersModule`).
- **No new packages.**

## Assumptions

- JWT payload continues to use `sub` as user id string (already true in `JwtTokenService.signAccessToken`).
- Existing global exception filter remains the error response contract.
- No e2e Mongo required if unit tests adequately cover acceptance cases (same style as signup/signin).

## Unresolved questions

None for planning — proceed with defaults above.

## Testing strategy

Jest unit tests for guard + `getMe` + existing users tests; assert HTTP exception types/messages and response shape without password fields.
