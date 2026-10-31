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
├── api/          # NestJS backend
├── app/          # React frontend
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

1. `GET /` on the API returns `{ "message": "Hello World!" }`.
2. The React home page calls that endpoint and displays the message.
3. TypeORM + MongoDB packages and config (`api/src/database/typeorm.config.ts`) are in place; the connection will be enabled when we add data features.

## Next steps

- Enable TypeORM MongoDB connection
- Authentication (register / login)
- User model and protected routes
- Shared API contracts between `api` and `app`
