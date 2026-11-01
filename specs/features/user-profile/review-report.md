# Review report: User Profile

## Review summary

Implementation matches the approved **user-profile** spec and plans. Custom JWT guard (no Passport), `GET /users/me`, Bearer client, and ProfilePage loading/error/401/refresh behavior are in place. Unit tests, production builds, and a live smoke test against Mongo all succeeded. Minor non-blocking issues remain (lint formatting, a React state-update pattern, thin client-header coverage).

## Final status

**PASS WITH WARNINGS**

## Requirements compliance

| Acceptance criterion | Status |
| --- | --- |
| `GET /users/me` + valid JWT → 200 `{ id, email, name }`, no password/hash | Met (service + live smoke) |
| Missing / invalid / expired token → 401 | Met (guard unit tests + live smoke) |
| Valid token, missing user → 404 | Met (service + live smoke) |
| Custom `@nestjs/jwt` guard; no Passport | Met (`npm ls` empty for passport packages) |
| `/profile` unauthenticated → `/sign-in` | Met (RequireAuth + ProfilePage test) |
| Authenticated profile: loading then Name/Email from API | Met |
| Request sends `Authorization: Bearer <token>` | Met in code (`apiGet` / `fetchCurrentUser`); no dedicated client unit assert |
| 401 clears auth + redirect `/sign-in` | Met |
| Non-401 → friendly error, session kept | Met |
| Success refreshes context/storage user | Met |
| Backend + frontend listed tests pass | Met (33 Jest / 16 Vitest) |
| Sign-in/sign-up unchanged except shared points | Met |

Plan tasks BE-01…BE-06 and FE-01…FE-06 are reflected in the working tree. No schema/package changes beyond plan.

## Code review findings

### Finding 1 — ESLint/Prettier failure on new decorator

- Severity: Low
- File / line: `api/src/modules/users/current-user.decorator.ts` (~21)
- Description: `npm` ESLint reports a Prettier formatting error on the `authUser` guard condition in `@CurrentUser`.
- Why it matters: New feature code fails project lint formatting; may block CI if lint is enforced.
- Suggested resolution: Reformat the condition (multi-line) or run ESLint `--fix` on that file only.

### Finding 2 — Nested `setState` inside `updateSignedInUser`

- Severity: Low
- File / line: `app/src/context/SignedInContext.tsx` (56–64)
- Description: `updateSignedInUser` calls `setSignedInUser` and `saveAuthSession` inside a `setAccessToken` functional updater.
- Why it matters: Works today, but nested updates in a state updater are brittle under Strict Mode / concurrent rendering.
- Suggested resolution: Read `accessToken` from closure/ref (or a single state object) and call `saveAuthSession` + both setters outside the updater.

### Finding 3 — Bearer header not asserted in automated FE tests

- Severity: Low
- File / line: `app/src/api/client.ts` (97–106); `app/src/pages/ProfilePage.test.tsx`
- Description: Profile tests mock `fetchCurrentUser`, so they never assert `Authorization: Bearer …` or that the stored token is passed through.
- Why it matters: Regressions in header construction would not fail the FE suite (implementation is correct on inspection).
- Suggested resolution: Add a small `apiGet` / `fetchCurrentUser` unit test that spies on `fetch` and checks the Authorization header.

## Test execution results

| Suite | Command | Result |
| --- | --- | --- |
| API Jest | `cd api && npm test` | **33 passed** (6 suites) |
| App Vitest | `cd app && npm test` | **16 passed** (5 files) |

Covered vs spec testing items:

- Backend: success without password/hash; missing header / non-Bearer / empty / invalid-expired → 401; missing user → 404 (`jwt-auth.guard.spec.ts`, `users.service.spec.ts` `getMe`).
- Frontend: unauthenticated redirect; loading then name/email; storage refresh; non-401 error keeps session; 401 clears + redirect (`ProfilePage.test.tsx`).

**Live smoke** (temporary Nest on `:3010`, then stopped):

- Valid Bearer → **200** `{ id, email, name }`
- No token / bad token → **401** `UNAUTHORIZED` + `AUTH_TOKEN_INVALID`
- Valid JWT, unknown `sub` → **404** `USER_NOT_FOUND`
- Response has no `password` / `passwordHash`

## Build and TypeScript results

| Check | Result |
| --- | --- |
| `cd api && npm run build` | Success |
| `cd app && npm run build` (`tsc -b` + Vite) | Success |
| API ESLint (changed users files) | 1 new Prettier error on `current-user.decorator.ts` (Finding 1); one Prettier hit on pre-existing `isDuplicateKeyError` line in `users.service.ts` |
| App oxlint | Warning only: `react(only-export-components)` on `SignedInContext.tsx` (pre-existing pattern with `useSignedIn` export) |
| Passport packages | Not installed |

## Missing test coverage

- No Nest controller/e2e wiring of guard + `GET me` together (mitigated by unit tests + live smoke).
- No automated assert that `apiGet` sets `Authorization: Bearer …` (Finding 3).
- No repository unit test for invalid ObjectId → `null` (behavior verified indirectly via live `/users/me` and plan allowed optional coverage).

## Outstanding issues

1. Fix Prettier on `current-user.decorator.ts` (Low).
2. Optionally refactor `updateSignedInUser` state updates (Low).
3. Optionally add client Bearer header unit test (Low).

No Critical or High findings. Feature is suitable to accept with warnings; address Low items in a follow-up if desired.
