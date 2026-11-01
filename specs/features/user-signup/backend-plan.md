# Backend plan: User Signup

## Overview

Add a NestJS `users` feature module with `POST /users/signup` that validates input, normalizes email, rejects duplicates with HTTP 409, hashes the password with bcrypt, and persists `{ email, name, passwordHash }` via TypeORM MongoDB — only after validation and uniqueness succeed. Extend shared error codes/filter for conflict responses. Cover the cases listed in the approved spec with Jest unit tests.

## Scope

| In scope | Out of scope |
| --- | --- |
| `api/` users module (controller → service → repository → entity), DTO validation, hashing, persistence, enums/filter updates, unit tests | JWT/sessions/cookies, login/logout APIs, rate limiting, frontend |
| Wire `UsersModule` into `AppModule` (TypeORM already enabled) | Packages beyond the locked decisions below without a new approval |

## Architecture

Follow `api-backend.mdc` layering under `api/src/modules/users/`:

| Layer | Role |
| --- | --- |
| `users.controller.ts` | HTTP only: `POST /users/signup` |
| `users.service.ts` | Normalize email, uniqueness, hash, orchestrate persist, map domain errors |
| `users.repository.ts` | TypeORM find-by-email / create / save |
| `user.entity.ts` | Mongo document shape |
| `dto/signup.dto.ts` | Request body shape + `class-validator` rules |
| Optional `password.hasher.ts` (or service method) | bcrypt hash abstraction for testability |

Import `UsersModule` in `AppModule`. Register a global `ValidationPipe` in `main.ts` (`whitelist`, `forbidNonWhitelisted`, `transform` as appropriate) using `class-validator` + `class-transformer`.

## Data model

**Collection / entity:** `users` (TypeORM Mongo entity)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | ObjectId → string in API | `@ObjectIdColumn()`; expose as string `id` in response |
| `email` | string | Trimmed + lowercased; **unique index** |
| `name` | string | Trimmed; min length 3 after trim |
| `passwordHash` | string | Never named `password` in persistence; never returned |

No write on validation failure or duplicate. Unique index is a safety net for races; map duplicate-key errors to 409.

## API contracts

**`POST /users/signup`**

Request:

```json
{ "email": "string", "name": "string", "password": "string" }
```

Success **`201 Created`**:

```json
{
  "message": "<ApiMessage.USER_SIGNUP_SUCCESS or equivalent>",
  "user": { "id": "<string>", "email": "<normalized>", "name": "<name>" }
}
```

Errors (via existing `HttpExceptionFilter` shape `{ statusCode, errorCode, message, path, timestamp }`):

| Case | HTTP | `errorCode` |
| --- | --- | --- |
| Validation failure | 400 | `BAD_REQUEST` |
| Duplicate email | 409 | **`CONFLICT`** (new; filter must map 409 → this, not `INTERNAL_ERROR`) |
| Unexpected / DB failure | 500 | `INTERNAL_ERROR` |

## Auth and authorization

None for this feature. No JWT, guards, or sessions. Password hashing with bcrypt only for storage.

## Error handling

- Throw Nest `BadRequestException` / `ConflictException` from the service (or let `ValidationPipe` produce 400).
- Extend `ErrorCode` with `CONFLICT = 'CONFLICT'`.
- Update `HttpExceptionFilter.statusToErrorCode` for `HttpStatus.CONFLICT`.
- Add signup success / duplicate messages to `ApiMessage` (or a users-specific const map used by the service).
- Never log or return plain-text passwords or hashes in success bodies.

## Security and performance

- Hash with bcrypt before persist; never store plain password.
- Email uniqueness case-insensitive via normalize + unique index on normalized email.
- Rate limiting deferred (spec + package-approval rule).
- Do not log request bodies containing passwords.

## Migrations or data changes

TypeORM Mongo with `synchronize: true` / `autoLoadEntities: true` — entity registration is enough for local/dev. No separate migration files planned.

## Tasks

### BE-01 — Shared enums and exception-filter conflict support

- **Description:** Add signup-related API messages and `CONFLICT` error code; map HTTP 409 in the global filter.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/common/enums/error-code.enum.ts`, `api/src/common/enums/api-message.enum.ts`, `api/src/common/filters/http-exception.filter.ts`
- **Dependencies:** None
- **Implementation details:**
  - Add `ErrorCode.CONFLICT`.
  - In `statusToErrorCode`, handle `HttpStatus.CONFLICT` → `ErrorCode.CONFLICT`.
  - Add messages such as signup success and duplicate-email (enum/const; no magic strings in services).
- **Testing requirements:** Unit assertion or filter case that 409 maps to `CONFLICT` (can live in filter spec or be covered via signup conflict tests).
- **Completion criteria:** 409 responses expose `errorCode: CONFLICT`, not `INTERNAL_ERROR`.

### BE-02 — User entity and UsersModule wiring

- **Description:** Create TypeORM Mongo `User` entity and Nest users module skeleton; register in `AppModule`.
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/user.entity.ts`, `users.module.ts`, `users.repository.ts`, `users.service.ts`, `users.controller.ts` (stubs OK), `api/src/app.module.ts`
- **Dependencies:** None
- **Implementation details:**
  - Entity fields: `id`, `email`, `name`, `passwordHash`; unique index on `email`.
  - `TypeOrmModule.forFeature([User])` inside `UsersModule`.
  - Repository wraps `MongoRepository`/`Repository` find-by-normalized-email and save.
  - Export service if needed later; controller route `@Controller('users')`.
- **Testing requirements:** Module compiles; entity loads with TypeORM config.
- **Completion criteria:** `UsersModule` imported; empty or stub `POST` not yet required to be complete.

### BE-03 — Signup validation rules (DTO + ValidationPipe)

- **Description:** Enforce server validation mirroring the spec (email format; name ≥ 3 after trim; password ≥ 8, letter, digit, special = `[^A-Za-z0-9]`).
- **Scope:** `api`
- **Files or modules expected to change:** `api/src/modules/users/dto/signup.dto.ts`; `api/src/main.ts` (global `ValidationPipe`); install `class-validator` + `class-transformer`
- **Dependencies:** Locked decision **A** (packages approved)
- **Implementation details:**
  - Install **`class-validator`** and **`class-transformer`** in `api/` (approved).
  - Register global `ValidationPipe` in `main.ts`.
  - DTO with decorators matching spec rules; custom matcher/decorator or `@Matches` for password letter/digit/special (`[^A-Za-z0-9]`).
  - Trim email/name before/at validation; lowercase email for storage/compare (transform or service).
  - Reject whitespace-only name after trim.
  - On failure: 400; **no repository save**.
- **Testing requirements:** Covered under BE-05 (invalid email, name &lt; 3, password rule variants).
- **Completion criteria:** Invalid bodies never reach persistence.

### BE-04 — Signup service: uniqueness, hash, persist, response

- **Description:** Implement `POST /users/signup` end-to-end business flow.
- **Scope:** `api`
- **Files or modules expected to change:** `users.controller.ts`, `users.service.ts`, `users.repository.ts`, password hasher helper if split; install `bcrypt` (+ `@types/bcrypt` if needed)
- **Dependencies:** BE-01, BE-02, BE-03; locked decision **B**
- **Implementation details:**
  - Install **`bcrypt`** and **`@types/bcrypt`** as needed in `api/` (approved).
  - Controller: `@Post('signup')`, body DTO, `@HttpCode(HttpStatus.CREATED)` → **201**.
  - Flow: validate → normalize email → find existing → if found `ConflictException` (no write) → bcrypt hash password → save `{ email, name, passwordHash }` → return `{ message, user: { id, email, name } }`.
  - Map Mongo duplicate-key from unique index to 409 if race occurs.
  - Never include password/hash in response; never log plain password.
- **Testing requirements:** Success + duplicate + hash-before-persist + DB failure in BE-05.
- **Completion criteria:** Happy path persists hashed user with **201**; duplicate/validation do not write; contract matches spec.

### BE-05 — Backend unit tests for signup

- **Description:** Jest `*.spec.ts` coverage per spec FR 26.
- **Scope:** `api`
- **Files or modules expected to change:** e.g. `users.service.spec.ts` (and/or controller spec); mock repository + hasher
- **Dependencies:** BE-04
- **Implementation details:** Cases:
  - successful signup
  - invalid email
  - name length &lt; 3
  - password length &lt; 8
  - password without letter
  - without number
  - without special character
  - duplicate email
  - password hashed before persistence (plain not stored; hasher called; saved field is hash)
  - DB/service failure handling (propagate/map to 500-style path without leaking secrets)
- **Testing requirements:** `npm test` (or targeted jest) passes for these cases.
- **Completion criteria:** All listed cases green with mocked persistence.

## Implementation order

1. BE-01 → BE-02 → BE-03 → BE-04 → BE-05
2. Prefer finishing backend contract before frontend API integration (FE-04).

## Risks

- Filter currently maps unknown statuses (including 409) to `INTERNAL_ERROR` — must fix in BE-01.
- Concurrent signups: rely on unique index + conflict mapping.
- bcrypt cost factor should be a reasonable default (e.g. 10+) without exposing tunables in responses.

## Technical decisions

| ID | Decision | Status |
| --- | --- | --- |
| **A** | Install **`class-validator`** + **`class-transformer`**; global `ValidationPipe` in `main.ts` | **Approved / locked** |
| **B** | Install **`bcrypt`** (+ **`@types/bcrypt`** if needed) for password hashing | **Approved / locked** |
| **C** | Success HTTP status **`201 Created`** | **Approved / locked** |

## Assumptions

- Spec is approved; MongoDB via existing `MONGODB_URI` / TypeORM root config.
- No rate limiting in this feature.
- Unit tests mock repository (no mandatory Testcontainers for this plan).
- Package installs for A/B happen during development (feature-developer), not during planning.

## Unresolved questions

None — A/B/C locked. Exact success message string copy can be finalized in BE-01 as long as it is enum-backed.

## Testing strategy

Service-level unit tests with mocked repository/hasher (primary). Optional light controller test. No e2e required by spec.
