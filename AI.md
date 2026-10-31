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


## Conventions for this log

When continuing with the AI agent:

1. Append a new dated section for each meaningful task or milestone.
2. Prefer plain language: goal, steps, decisions, and leftovers.
3. Do not dump raw tool output; summarize what mattered.
4. Note side effects (background servers, generated files, skipped items) so they are easy to clean up later.

