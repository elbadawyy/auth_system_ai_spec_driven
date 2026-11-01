# AI Agent Session Log

This file records the work done with AI agent assistance on this project.
Entries are written in chronological order and kept short so a human can
follow what changed, why, and what was left for later.

---

## 1- Project scaffold (Hello World)

### Goal

Create a minimal fullstack base:

- Backend API in `api/` using NestJS, TypeScript, with TypeORM + MongoDB prepared
- Frontend in `app/` using React and TypeScript
- Backend returns a JSON Hello World message
- Frontend home page fetches and displays that message
- Root `README.md` with basic setup notes

### Steps completed

1. **Inspected the workspace**
  Confirmed empty `api/` and `app/` folders and available Node / Nest CLI tooling.
2. **Scaffolded the NestJS API** (`api/`)
  Generated a NestJS TypeScript project. Updated the root route so `GET /` returns:
   Enabled CORS for the Vite frontend (`http://localhost:5173`).
3. **Prepared TypeORM + MongoDB without requiring a running database**
  Installed `@nestjs/typeorm`, `typeorm`, `mongodb`, and `@nestjs/config`.  
   Added `api/src/database/typeorm.config.ts` for later use.  
   Did **not** connect TypeORM in `AppModule` yet, so the API can start during this early scaffold without MongoDB.
4. **Scaffolded the React frontend** (`app/`)
  Created a Vite + React + TypeScript app. The home page calls `VITE_API_URL` (default `http://localhost:3000`) and shows the API message.
5. **Added project docs and env examples**
  Wrote root `README.md`, `.gitignore`, and `.env` / `.env.example` files for both apps.
6. **Verified the API**
  Started `npm run start:dev` in `api/`, confirmed `GET http://localhost:3000/` returns `{"message":"Hello World!"}`.



### Decisions / notes

- Frontend lives in `app/` (already present in the repo layout), not a separate `frontend/` name.
- Docker / MongoDB were skipped for this phase; TypeORM wiring is ready but inactive until data features begin.
- A temporary Docker Compose file was proposed for MongoDB and then removed at the user’s request.



### How to run locally (current state)

```bash
cd api && npm run start:dev
# other terminal
cd app && npm run dev
```

---



## 2 - Cursor rules layout



### Goal

Add persistent AI guidelines for the whole project, the API, and the frontend.

### Steps completed

1. Chose a three-file Cursor rules layout under `.cursor/rules/`.
2. Created:
  - `project-core.mdc` — always applied (layout, TypeScript, secrets, agent workflow)
  - `api-backend.mdc` — applies to `api/**/*` (NestJS, TypeORM/Mongo, API design)
  - `app-frontend.mdc` — applies to `app/**/*` (React, Vite, API consumption)



### Decisions / notes

- Kept one file per layer for now. Extra files (e.g. database-only or styling-only) can be split out later if those areas grow.

---



## 3 - Merge starter guidelines into rules + structure



### Goal

Read `starter-guidlines.txt` and apply those guidelines to the Cursor rules and the current project structure.

### Steps completed

1. Updated `.cursor/rules/project-core.mdc`, `api-backend.mdc`, and `app-frontend.mdc` with the starter rules (modular monolith, enums, no `any`, env-only secrets, ask before installing packages, JWT auth direction, N+1 guidance, logging levels, health checks, rate limiting note, module boundaries).
2. Restructured the API toward modular monolith while keeping root `app.*` files:
  - Root: `app.module.ts`, `app.controller.ts`, `app.service.ts`, `main.ts`
  - Feature example: `api/src/modules/health/`
  - Shared: `api/src/common/enums/` and `api/src/common/filters/http-exception.filter.ts`
3. Wired a global HTTP exception filter and Nest `Logger` in `main.ts`.
4. Updated the frontend to health-check `GET /health` before loading Hello World, with shared `src/api/` helpers and enums.



### Decisions / notes

- Root `app.*` files stay as the Nest entrypoint exception; upcoming features (auth, users, …) live under `src/modules/` and are imported into `AppModule`.
- Did **not** install rate-limiting or JWT packages yet — rules require asking first.
- Rate limiting for unauthenticated POSTs and JWT auth are documented as next feature work.

---



## 4 - Feature brainstorming skill



### Goal

Add a reusable project-level Cursor skill for the Spec-Driven Development brainstorming phase.

### Steps completed

1. Created `.cursor/skills/feature-brainstorming/SKILL.md`.
2. Encoded workflow: read rules/code first, one question at a time, classify Backend/Frontend/Full Stack, challenge assumptions, draft spec in chat, write `specs/features/<feature-name>/spec.md` only after explicit approval, then stop (no planning or code).



### Decisions / notes

- Paths use lowercase `api/` and `app/` to match the repo (not `API/`).
- No application source changes; `specs/` is created later when a feature is approved.

---



## 5 - Feature planning skill



### Goal

Add a reusable project-level Cursor skill for the Spec-Driven Development planning phase.

### Steps completed

1. Created `.cursor/skills/feature-planning/SKILL.md`.
2. Encoded workflow: read approved `spec.md`, design backend/frontend plans with verifiable tasks, present for approval, write `backend-plan.md` / `frontend-plan.md` only for relevant scope, then stop (no implementation).



### Decisions / notes

- Mirrors `feature-brainstorming` style; paths use `api/` and `app/`.
- `disable-model-invocation: true`.
- Missing/unapproved spec → stop and defer to brainstorming.

---



## 6 - Feature development skill



### Goal

Add a reusable project-level Cursor skill for the Spec-Driven Development implementation phase.

### Steps completed

1. Created `.cursor/skills/feature-development/SKILL.md`.
2. Encoded workflow: read approved spec + plans, start-gate confirmation, one task at a time with verification, scope control, progress checklist, final report; no auto-review.



### Decisions / notes

- Aligns with `feature-brainstorming` / `feature-planning`; paths use `api/` and `app/`.
- `disable-model-invocation: true`.
- New deps and plan/spec edits require explicit approval.

---



## 7 - Feature review skill



### Goal

Add a reusable project-level Cursor skill for Spec-Driven Development testing, code review, and verification.

### Steps completed

1. Created `.cursor/skills/feature-review/SKILL.md`.
2. Encoded workflow: read approved spec/plans, independent review vs requirements, run real tests/checks, severity-classified findings, PASS / PASS WITH WARNINGS / FAIL, save `review-report.md` only after approval; no code fixes or auto re-dev.



### Decisions / notes

- Completes SDD skill chain: brainstorming → planning → development → review.

---



## 8 - Home Page implementation (brainstorm → plan → develop → review)



### Goal

Ship the initial Application Home Page through the full spec-driven flow: approved spec, frontend plan, implementation, and review.

### Steps completed

1. **Brainstorm** — Agreed a frontend-only Home Page (Auth System navbar, no-op Login, welcome body, non-dismissible unavailable modal with a 20s health retry, Hello World removed, page shown before the health result). Saved `specs/features/application-home-page/spec.md`.
2. **Plan** — Approved frontend tasks FE-01…FE-07 (constants, Navbar, modal, layout, health gate, Hello World cleanup, verification). Saved `frontend-plan.md`. No backend plan; reuse existing `GET /health`.
3. **Develop** — Implemented the plan in `app/` (`useBackendHealthGate`, Navbar, modal, layout). Removed the Hello World client. `npm run build` and `npm run lint` passed. No new packages or React Router.
4. **Review** — Checked the result against the spec and plan. Build, lint, and live `GET /health` passed. Status **PASS WITH WARNINGS**. Saved `review-report.md`. No source fixes during review.



### Decisions / notes

- Scope stayed frontend-only and reused the existing health endpoint.
- Each phase stopped until the user approved the next one.

---



## 9 - Spec-Driven Development subagents



### Goal

Add four project-level Cursor subagents that each follow an existing SDD skill, without recreating or replacing those skills.

### Steps completed

1. Created `.cursor/agents/feature-brainstormer.md` → skill `feature-brainstorming`.
2. Created `.cursor/agents/feature-planner.md` → skill `feature-planning`.
3. Created `.cursor/agents/feature-developer.md` → skill `feature-development`.
4. Created `.cursor/agents/feature-reviewer.md` → skill `feature-review`.
5. Verified YAML frontmatter, skill paths, and that existing skill files were unchanged.



### Decisions / notes

- Each subagent has a single phase responsibility, approval gates, no cross-phase work, no auto-invocation of other subagents.
- Each returns a structured summary to the parent agent.
- No orchestrator subagent in this step.

---



## 10 - Feature complete-cycle orchestrator skill



### Goal

Add a project-level orchestrator skill that coordinates the four SDD subagents end-to-end.

### Steps completed

1. Created `.cursor/skills/feature-complete-cycle/SKILL.md`.
2. Encoded sequential phases: brainstorming → planning → development → review, with explicit user approval between phases.
3. Encoded failure handling, artifact-based context (`specs/features/<feature-name>/`), and final cycle report fields.



### Decisions / notes

- Orchestrator coordinates only; it must not do specialized phase work itself.
- Never skip phases, run them in parallel, or assume approval.
- Reusable for every new feature; `disable-model-invocation: true`.

---



## 11 - User Signup implementation (development)



### Goal

Implement full-stack user signup per approved `specs/features/user-signup/spec.md`, `backend-plan.md`, and `frontend-plan.md` (start gate confirmed).

### Steps completed

1. **BE-01** — Added `ErrorCode.CONFLICT`, signup API messages, filter 409 mapping + unit test.
2. **BE-02** — Created `UsersModule` (`User` entity, repository/service/controller stubs) and wired into `AppModule`.
3. **BE-03** — Installed `class-validator` + `class-transformer`; `SignupDto` + global `ValidationPipe`.
4. **BE-04** — Installed `bcrypt` (+ types); implemented `POST /users/signup` with uniqueness, hash, persist, **201** response.
5. **BE-05** — Jest coverage for service success/duplicate/hash/DB failure and DTO validation rule cases.
6. **FE-01…FE-06** — UI/API constants; `react-router-dom` routes; in-memory `SignedInProvider`; Navbar Sign Up / Logout; `apiPost` + `signupUser`; signup form; profile signed-in / not-signed-in views.
7. Verified: `api` build + full Jest (16 tests); `app` build + lint; live smoke (`201` / `409` / `400`).

### Decisions / notes

- Locked packages used as planned (A/B/C/D). No JWT/session; Logout remains a no-op.
- Client signed-in state is Context/in-memory only (clears on refresh).
- Dev server stopped after smoke test.

### Leftovers

- Review phase not started (awaits explicit request).
- Functional Login/Logout and real auth deferred to future features.

---

