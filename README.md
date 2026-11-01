# Auth System

A full-stack **modular monolith** for user authentication: NestJS API + React SPA, TypeScript end to end, MongoDB via TypeORM. Built with **Spec-Driven Development (SDD)** and Cursor AI agents — features go through brainstorm → plan → implement → review before landing in code.

---

## What this system is

One deployable product split into two apps that talk over HTTP only:


| Layer        | Folder | Role                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| Backend API  | `api/` | NestJS modular monolith (feature modules, JWT auth, MongoDB) |
| Frontend SPA | `app/` | React + Vite UI (routes, auth session, health gate)          |


**Modular monolith (backend):** one Nest process, one database, features isolated as Nest modules under `api/src/modules/<feature>/`. Each feature follows **module → controller → service → repository → entity**. Modules do not reach into another module’s repository or entity; cross-module use goes through that module’s **service** only.

**Frontend ↔ backend:** the React app never talks to MongoDB. All data access goes through the Nest HTTP API.

---



## Repository layout

```text
.
├── api/                      # NestJS backend
│   └── src/
│       ├── main.ts           # bootstrap, CORS, ValidationPipe, exception filter
│       ├── app.module.ts     # root module (imports feature modules)
│       ├── config/           # dotenv load-env
│       ├── database/         # TypeORM MongoDB config
│       ├── common/           # shared enums, HTTP exception filter
│       └── modules/          # feature modules (modular monolith)
│           ├── health/
│           └── users/
├── app/                      # React + Vite frontend
│   └── src/
│       ├── api/              # HTTP client + domain helpers
│       ├── auth/             # storage, JWT helpers, route guards
│       ├── components/       # Navbar, unavailable modal
│       ├── context/          # signed-in session
│       ├── enums/            # paths, routes, UI copy, status codes
│       ├── hooks/            # backend health gate
│       └── pages/            # Home, Sign-in, Signup, Profile
├── specs/features/           # approved SDD specs, plans, review reports
├── docs/
│   └── API_CONTRACT.md       # HTTP endpoints, success/error bodies, messages
├── .cursor/
│   ├── rules/                # always-on + path-scoped AI coding rules
│   ├── agents/               # SDD subagents (brainstormer, planner, …)
│   └── skills/               # SDD skill definitions + complete-cycle orchestrator
├── AI.md                     # chronological agent work log
└── README.md
```

---



## Features (shipped via SDD)


| Feature               | Spec folder                             | What it delivers                                                            |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Application Home Page | `specs/features/application-home-page/` | Branded navbar, welcome home, health check + unavailable modal (20s retry)  |
| User Signup           | `specs/features/user-signup/`           | Register with email / name / password; persist hashed user                  |
| User Sign-in          | `specs/features/user-sign-in/`          | Credential check, JWT (1h), `localStorage` session, protected profile route |
| User Profile          | `specs/features/user-profile/`          | `GET /users/me` + profile page loads name/email from API                    |


---



## Backend (`api/`)



### Architecture

```text
HTTP request
  → Controller (routes, DTO binding)
    → Service (business rules)
      → Repository (TypeORM / Mongo)
        → Entity (document shape)
```

Shared cross-cutting pieces live outside feature folders:

- `common/enums` — API messages, error codes, health status
- `common/filters` — consistent JSON error responses
- `config/load-env.ts` — load `.env` before Nest boots
- `database/typeorm.config.ts` — MongoDB connection (`MONGODB_URI`)



### Modules


| Module     | Path                  | Responsibility                                  |
| ---------- | --------------------- | ----------------------------------------------- |
| **Health** | `src/modules/health/` | Liveness for the frontend health gate           |
| **Users**  | `src/modules/users/`  | Signup, sign-in, JWT issue/verify, current user |


Auth helpers (`JwtTokenService`, `JwtAuthGuard`, `@CurrentUser()`) live inside the **users** module (no separate auth module yet).

### Model (entity)

`User` → MongoDB collection `users`


| Field          | Type     | Notes                                   |
| -------------- | -------- | --------------------------------------- |
| `id`           | ObjectId | Mongo `_id`                             |
| `email`        | string   | unique index                            |
| `name`         | string   |                                         |
| `passwordHash` | string   | bcrypt; never returned in API responses |




### Endpoints


| Method | Path            | Auth       | Status | Purpose                               |
| ------ | --------------- | ---------- | ------ | ------------------------------------- |
| `GET`  | `/`             | Public     | 200    | Scaffold hello (`{ message }`)        |
| `GET`  | `/health`       | Public     | 200    | `{ status: "ok" }`                    |
| `POST` | `/users/signup` | Public     | 201    | Create user; return JWT + user        |
| `POST` | `/users/signin` | Public     | 200    | Verify credentials; return JWT + user |
| `GET`  | `/users/me`     | Bearer JWT | 200    | Current user `{ id, email, name }`    |


**Signup / sign-in body**

- Signup: `email`, `name` (min 3), `password` (min 8, letter + digit + special)
- Sign-in: `email`, `password` (same password rules)

**Auth success shape** (signup & sign-in): `{ message, accessToken, user: { id, email, name } }`

**JWT:** payload `{ sub: userId, email }`; secret / expiry from env (`JWT_SECRET`, `JWT_EXPIRES_IN`, default `1h`). Client sends `Authorization: Bearer <token>`.

Full request/response examples, validation rules, success messages, and error shapes: **[docs/API_CONTRACT.md](docs/API_CONTRACT.md)**.

### Backend conventions (from project rules)

- Feature folders: `users.module.ts`, `users.controller.ts`, `users.service.ts`, `users.repository.ts`
- No magic strings for messages / error codes — use enums
- Prefer Nest `HttpStatus` over raw numbers
- Secrets only in `.env`; ask before adding npm packages
- Rate limiting for unauthenticated POSTs is planned (not installed yet)

---



## Frontend (`app/`)



### Architecture

```text
BrowserRouter
  → SignedInProvider (JWT + user in localStorage)
    → App shell (Navbar + routes + health modal)
      → pages call api/* helpers → Nest API
```



### Routes


| Path       | Page    | Guard                                    |
| ---------- | ------- | ---------------------------------------- |
| `/`        | Home    | —                                        |
| `/sign-in` | Sign in | Redirect if already authenticated        |
| `/signup`  | Sign up | Redirect if already authenticated        |
| `/profile` | Profile | Require valid JWT; loads `GET /users/me` |
| `*`        | → `/`   | —                                        |




### Key areas


| Folder        | Role                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `api/`        | Shared `fetch` client, health + users helpers                                      |
| `auth/`       | `localStorage` session, JWT `exp` check, `RequireAuth` / `RedirectIfAuthenticated` |
| `context/`    | `SignedInContext` — sign in / out / update user                                    |
| `components/` | `Navbar`, `ServiceUnavailableModal`                                                |
| `hooks/`      | `useBackendHealthGate` (poll `/health` every 20s when down)                        |
| `enums/`      | Paths, API routes, UI labels/messages, HTTP/health constants                       |
| `pages/`      | Screen UIs + colocated CSS                                                         |


Logout clears client storage only (no backend logout endpoint).

### Frontend conventions (from project rules)

- Talk to the API over HTTP only (`VITE_API_URL`)
- Centralize network calls in `src/api/`
- Prefer enums / const maps for paths, copy, and status values
- Ask before installing new libraries

---



## Agentic / Spec-Driven Development

This repo is **written with AI agents under a strict SDD workflow**, not ad-hoc codegen.

### Rules (always shape agent behavior)


| Rule file                        | Scope                                                         |
| -------------------------------- | ------------------------------------------------------------- |
| `.cursor/rules/project-core.mdc` | Layout, TypeScript, enums, secrets, packages, `AI.md` logging |
| `.cursor/rules/api-backend.mdc`  | Modular monolith, TypeORM/Mongo, JWT, API design              |
| `.cursor/rules/app-frontend.mdc` | React/Vite, API consumption, health checks                    |




### SDD cycle (one feature at a time)

```text
Brainstorm → Plan → Develop → Review
     ↑          ↑        ↑        ↑
  approval   approval  confirm  approval
```


| Phase      | Agent                  | Skill                   | Artifact                               |
| ---------- | ---------------------- | ----------------------- | -------------------------------------- |
| Brainstorm | `feature-brainstormer` | `feature-brainstorming` | `specs/features/<name>/spec.md`        |
| Plan       | `feature-planner`      | `feature-planning`      | `backend-plan.md` / `frontend-plan.md` |
| Develop    | `feature-developer`    | `feature-development`   | application code + tests               |
| Review     | `feature-reviewer`     | `feature-review`        | `review-report.md`                     |


Orchestrator skill: `.cursor/skills/feature-complete-cycle/SKILL.md` — runs phases **sequentially** with explicit user approval between them. Agents do not skip phases, invent packages, or auto-start the next phase.

Session history and decisions are appended to `AI.md`.

---



## Prerequisites

- Node.js 20+ and npm
- MongoDB reachable at the URI in `api/.env` (required for users features)

---



## Setup



### 1. API

```bash
cd api
cp .env.example .env
# set JWT_SECRET (required); adjust MONGODB_URI / CORS_ORIGIN if needed
npm install
npm run start:dev
```

API: [http://localhost:3000](http://localhost:3000)

### 2. Frontend

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

---



## Environment variables

**API (**`api/.env`**)**


| Variable         | Default                                 | Purpose                          |
| ---------------- | --------------------------------------- | -------------------------------- |
| `PORT`           | `3000`                                  | API listen port                  |
| `MONGODB_URI`    | `mongodb://localhost:27017/auth_system` | TypeORM MongoDB URI              |
| `CORS_ORIGIN`    | `http://localhost:5173`                 | Allowed browser origin           |
| `JWT_SECRET`     | *(required)*                            | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | `1h`                                    | Access token lifetime            |


**Frontend (**`app/.env`**)**


| Variable       | Default                 | Purpose          |
| -------------- | ----------------------- | ---------------- |
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |


Never commit real secrets. Use `.env.example` as the template.

---



## Useful commands

```bash
# API
cd api && npm run start:dev
cd api && npm test
cd api && npm run build

# App
cd app && npm run dev
cd app && npm test
cd app && npm run build
cd app && npm run lint
```

---



## Design principles (summary)

1. **Modular monolith** — feature modules with clear layering; services as the only cross-module boundary.
2. **HTTP-only integration** — frontend never touches the database.
3. **Enums over magic strings** — messages, error codes, paths, UI copy.
4. **Env-only secrets** — `dotenv` / `VITE_`*; fail fast if `JWT_SECRET` is missing.
5. **Health-aware UI** — frontend polls `/health` and blocks with a recovery modal when the API is down.
6. **Spec before code** — approved specs and plans drive agents; work is logged in `AI.md`.

---

