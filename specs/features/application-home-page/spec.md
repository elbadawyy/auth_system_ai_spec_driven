# Application Home Page

## Feature overview

Deliver the initial application entry experience: a clean navigation bar branded **Auth System** with a non-functional **Login** control, a simple responsive landing body with a centered welcome heading, and home-page load integration with the existing backend health check. When the backend is unavailable, show a non-dismissible user-friendly modal and retry the health check every 20 seconds until the service recovers.

## Problem statement

The current frontend is a scaffold that shows a Hello World API message and an inline backend-down string. The product needs a proper first Home Page (navbar + landing content) and a clearer unavailable experience without implementing authentication yet.

## Goals and non-goals

**Goals**

- Modern, responsive Home Page with navbar and welcome heading.
- Reuse existing `GET /health` and frontend health helpers.
- On load, show the normal Home Page immediately; if health fails, show an unavailable modal.
- While unavailable, poll health every 20 seconds; when healthy again, hide the modal and restore the normal Home Page view.
- Keep Login as a visible placeholder that does nothing in this story.

**Non-goals**

- Authentication, registration, user profile, sign out, or `/login` page/route/endpoint.
- New backend health endpoint (already exists).
- Hello World message fetch/display on the Home Page.
- Installing new UI libraries (unless separately approved later).
- Technical planning or implementation in this brainstorming phase.

## User stories

- As a visitor, I want to open the app and see a clear branded Home Page so I know I am in Auth System.
- As a visitor, I want to see a Login control in the navbar so I understand sign-in will be available later.
- As a visitor, I want a friendly notice if the backend is down so I am not left with a broken or technical error state.
- As a visitor, I want the app to recover automatically when the backend returns so I do not have to refresh manually.

## Functional requirements

1. The Home Page is the default application entry view.
2. The navigation bar displays the application name **Auth System**.
3. The navigation bar displays a **Login** button that performs no navigation and no API calls in this story.
4. The Home Page body displays a large, centered heading: `Welcome to the application.`
5. Layout and typography remain usable and visually clean on desktop, tablet, and mobile.
6. On Home Page load, the UI renders the normal Home Page (navbar + welcome) immediately, with no unavailable modal yet.
7. On Home Page load, the frontend calls the existing backend health check (`GET /health` via existing shared API helpers).
8. If the health check succeeds, the Home Page remains in the normal state (no unavailable modal).
9. If the health check fails (network error, non-OK HTTP response, or non-`ok` health status), show a modal/popup with a user-friendly message and no technical/internal error details.
10. Modal message text: `Service temporarily unavailable. Please try again later.`
11. The unavailable modal cannot be dismissed by the user (no close control / no dismiss-on-outside-click for this story).
12. While the unavailable modal is shown, the frontend retries the health check every **20 seconds**.
13. When a retry reports healthy, hide the modal and return to the normal Home Page view; stop the 20-second retry loop until a future failure requires it again.
14. Remove Hello World fetching and display from the Home Page.
15. Do not implement auth, profile, or sign-out UI behavior beyond leaving room conceptually for later navbar evolution.

## Business rules

- Backend availability for this story is determined solely by the existing health check contract: successful response with `status: "ok"`.
- Any failed health attempt is treated as backend unavailable for UI purposes.
- User-facing unavailable copy must not include status codes, stack traces, raw API payloads, or internal diagnostics.
- Login is presentational only in this story; clicking it must not change route or application state.
- Health polling at 20-second intervals runs only while the unavailable modal is active (not continuously while healthy).
- Existing backend `GET /health` is the source of truth; no alternate health URL for this story.

## Acceptance criteria

- Opening the app shows navbar (**Auth System** + **Login**) and the centered welcome heading without waiting on health to paint the page.
- Clicking **Login** does nothing observable (no navigation, no request, no error).
- With backend up, no unavailable modal appears after the health check.
- With backend down or unreachable, the modal appears with exactly the approved unavailable message and no technical details.
- User cannot dismiss the unavailable modal manually.
- While unavailable, a new health check runs about every 20 seconds.
- When the backend becomes healthy again, the modal disappears without a manual refresh.
- Hello World content/API usage is no longer part of the Home Page.
- No auth/registration/profile/sign-out functionality is implemented.
- No new backend health endpoint is required; existing `GET /health` is used.

## Edge cases

- Health check fails on first load → show modal after failure; keep Home Page behind/under the modal as appropriate for a modal overlay; start 20s retry loop.
- Health check succeeds on first load → no modal; no retry loop.
- Intermittent failure after being healthy → out of scope to continuously monitor while healthy; this story only checks on load and while the unavailable modal is active.
- Tab/page unmount or navigation away during polling → stop retries to avoid leaked timers/requests (implementation detail for planning/dev).
- Slow health response → Home Page already visible; do not show the modal until the check has failed.
- Health returns HTTP success but unexpected/non-`ok` status → treat as unavailable.
- Multiple overlapping in-flight health requests → avoid duplicate concurrent polls where practical (e.g. wait for in-flight check or clear interval cleanly).

## Dependencies

- Existing backend module: `GET /health` → `{ status: "ok" }`.
- Existing frontend helpers: shared API client / `checkBackendHealth` (or equivalent) and `VITE_API_URL`.
- No new npm packages assumed; build with current React + Vite + CSS approach unless a later approval adds a library.
- Future (out of scope): `/login` page and login API; navbar user details and sign out.

## Backend and frontend scope

| Area | Scope |
| --- | --- |
| **Frontend (`app/`)** | Home Page layout, navbar, welcome body, responsive styling, health check on load, unavailable modal, 20s retry while unavailable, remove Hello World from Home Page. |
| **Backend (`api/`)** | **Reuse only** — existing `HealthModule` / `GET /health`. No new endpoint or health behavior required for this story. |

**Classification:** **Frontend** (with backend reuse; not a new backend feature).

## Open questions

None.
