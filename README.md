# Auth System (AI Spec-Driven)

Full-stack starter with a NestJS API and a React frontend. This first slice only exposes a JSON **Hello World** endpoint and shows that message on the home page. Features (auth, users, etc.) will be added next.

## Stack

| Layer | Folder | Tech |
| --- | --- | --- |
| Backend API | `api/` | Node.js, TypeScript, NestJS, TypeORM, MongoDB |
| Frontend | `app/` | React, TypeScript, Vite |

## Prerequisites

- Node.js 20+ and npm

## Project layout

```text
.
├── api/
│   └── src/
│       ├── common/          # enums, filters, shared helpers
│       ├── database/        # TypeORM config (MongoDB)
│       └── modules/         # feature modules (hello, health, …)
├── app/
│   └── src/
│       ├── api/             # HTTP client helpers
│       └── enums/
├── .cursor/rules/           # AI agent guidelines
├── AI.md
└── README.md
```

## Setup

### 1. API

```bash
cd api
cp .env.example .env
npm install
npm run start:dev
```

API runs at [http://localhost:3000](http://localhost:3000).

Hello World response:

```json
{ "message": "Hello World!" }
```

### 2. Frontend

In another terminal:

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173) and fetches the message from the API.

## Environment variables

**API (`api/.env`)**

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | API port |
| `MONGODB_URI` | `mongodb://localhost:27017/auth_system` | Reserved for TypeORM when MongoDB is connected |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

**Frontend (`app/.env`)**

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |

## Current behavior

1. `GET /health` returns `{ "status": "ok" }` for frontend health checks.
2. `GET /` returns `{ "message": "Hello World!" }`.
3. The React home page health-checks the API first, then loads the Hello World message.
4. TypeORM + MongoDB packages and config (`api/src/database/typeorm.config.ts`) are ready; connection is not enabled yet.

## Next steps

- Enable TypeORM MongoDB connection
- JWT authentication (register / login)
- Rate limiting on unauthenticated POST routes (package approval required)
- Feature modules under `api/src/modules/` (e.g. users)
- Shared API contracts between `api` and `app`
