# Review report: Application Home Page

## Review summary

Reviewed `application-home-page` against approved `spec.md` and `frontend-plan.md`, inspected the git diff/implementation, ran `app` build + lint, and verified `GET /health` returns `{ status: "ok" }`. No application source was modified. Frontend matches the approved scope: navbar, welcome Home Page, health modal + 20s retry, Hello World removed. Residual gaps are mainly unautomated UI/runtime coverage and small a11y/edge-case notes.

## Final status

**PASS WITH WARNINGS**

## Requirements compliance

| Area | Result |
| --- | --- |
| Navbar **Auth System** + no-op **Login** | Met |
| Welcome heading exact text | Met (`UiLabel.WELCOME_HEADING`) |
| First paint without waiting on health | Met (`isUnavailable` starts `false`) |
| Health via existing `checkBackendHealth` / `GET /health` | Met |
| Unavailable modal + approved copy | Met |
| Non-dismissible (no close / no backdrop handler) | Met |
| 20s retry only while unavailable | Met (`HealthPoll.INTERVAL_MS`, timeout chain) |
| Stop polling on recovery / unmount cleanup | Met |
| Hello World removed from frontend | Met (`hello.ts` deleted) |
| No auth / `/login` / new packages / backend changes | Met |
| Responsive CSS | Met (layout + navbar breakpoints) |

## Code review findings

### Finding 1 — Modal focus not moved into the dialog

- Severity: Low
- File / line: `app/src/components/ServiceUnavailableModal.tsx` (approx. 14–28)
- Description: Dialog uses `role="dialog"` and `aria-modal="true"`, but focus is not moved into the dialog when it opens.
- Why it matters: Keyboard/screen-reader users may not be guided to the unavailable message.
- Suggested resolution: On open, focus the dialog (or message) container; optional simple focus restore on close.

### Finding 2 — `inFlight` guard returns `false` (treated as unhealthy)

- Severity: Low
- File / line: `app/src/hooks/useBackendHealthGate.ts` 13–16
- Description: If `runHealthCheck` is entered while a request is already in flight, it returns `false`, which the retry path treats like an unhealthy result.
- Why it matters: In an overlap edge case, polling could continue or briefly keep the unavailable state even if the in-flight check would succeed. The timeout-chain design makes this unlikely.
- Suggested resolution: Return a distinct “skipped” result (or await the in-flight promise) instead of `false`.

### Finding 3 — Browser recovery path not exercised in this review

- Severity: Low
- File / line: N/A (process gap)
- Description: Health API contract was verified live; full UI flow (modal appear → ~20s retry → modal clear) was not run in a browser during review.
- Why it matters: Timer/UI integration risk remains until manually smoked.
- Suggested resolution: One manual pass: API down → modal; wait ~20s with API still down → still modal; start API → modal clears without refresh.

## Test execution results

| Check | Result |
| --- | --- |
| Unit / integration / e2e tests | **None present** in `app/` (none executed) |
| Live `GET /health` | **Pass** — HTTP 200, `{ "status": "ok" }` |
| Unreachable host behavior (fetch catch) | **Pass** (node smoke) |

## Build and TypeScript results

| Check | Result |
| --- | --- |
| `npm run build` (`tsc -b` + Vite) | **Pass** |
| `npm run lint` (oxlint) | **Pass** |

## Missing test coverage

- No automated tests for `useBackendHealthGate` (initial fail, 20s retry, recovery, unmount cleanup).
- No component tests for Navbar no-op Login or modal non-dismiss behavior.
- Accepted by the approved plan (manual + lint/build only); still a coverage gap for regressions.

## Outstanding issues

- Manual browser smoke for modal + 20s recovery (recommended before release confidence).
- Optional follow-ups: modal focus management; safer `inFlight` handling.
- No **Critical** / **High** / **Medium** functional blockers found against the approved spec.
