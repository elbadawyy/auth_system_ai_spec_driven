# API Contract

Base URL (local default): `http://localhost:3000`  
Content-Type for request bodies: `application/json`  
No global `/api` prefix.

Source of truth for message and error-code strings:

- `api/src/common/enums/api-message.enum.ts`
- `api/src/common/enums/error-code.enum.ts`
- `api/src/common/filters/http-exception.filter.ts`

---

## Shared types

### Auth user (never includes password)

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "Jane Doe"
}
```


| Field   | Type   | Notes                       |
| ------- | ------ | --------------------------- |
| `id`    | string | MongoDB ObjectId hex string |
| `email` | string | Stored lowercase            |
| `name`  | string | Trimmed                     |




### Auth success (signup & sign-in)

```json
{
  "message": "Account created successfully",
  "accessToken": "<jwt>",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Jane Doe"
  }
}
```


| Field         | Type   | Notes                                        |
| ------------- | ------ | -------------------------------------------- |
| `message`     | string | From `ApiMessage`                            |
| `accessToken` | string | JWT; send as `Authorization: Bearer <token>` |
| `user`        | object | Auth user shape above                        |




### JWT


| Claim         | Meaning                         |
| ------------- | ------------------------------- |
| `sub`         | User id                         |
| `email`       | User email                      |
| `exp` / `iat` | Standard JWT expiry / issued-at |


Default lifetime: `JWT_EXPIRES_IN` (default `1h`). Secret: `JWT_SECRET` (required).

### Error response (all failed HTTP exceptions)

Produced by the global `HttpExceptionFilter`:

```json
{
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED",
  "message": "Invalid email or password. Please check your credentials and try again.",
  "path": "/users/signin",
  "timestamp": "2026-11-01T11:00:00.000Z"
}
```


| Field        | Type              | Notes                                        |
| ------------ | ----------------- | -------------------------------------------- |
| `statusCode` | number            | HTTP status                                  |
| `errorCode`  | string            | See [Error codes](#error-codes)              |
| `message`    | string | string[] | Single business message, or validation array |
| `path`       | string            | Request URL path                             |
| `timestamp`  | string            | ISO-8601                                     |


Validation failures (`400`) typically use Nest/class-validator arrays, for example:

```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": [
    "email must be an email",
    "password must contain at least one special character"
  ],
  "path": "/users/signup",
  "timestamp": "2026-11-01T11:00:00.000Z"
}
```

---



## Error codes


| `errorCode`      | Typical HTTP | When                                   |
| ---------------- | ------------ | -------------------------------------- |
| `BAD_REQUEST`    | 400          | DTO / validation failure               |
| `UNAUTHORIZED`   | 401          | Bad credentials or missing/invalid JWT |
| `FORBIDDEN`      | 403          | Reserved (mapped if thrown)            |
| `NOT_FOUND`      | 404          | Authenticated user id not in DB        |
| `CONFLICT`       | 409          | Duplicate email on signup              |
| `INTERNAL_ERROR` | 500          | Unexpected / persistence failures      |


---



## Success & error messages (`ApiMessage`)


| Constant                    | Value                                                                     | Used when                                                         |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `HELLO_WORLD`               | `Hello World!`                                                            | `GET /` success                                                   |
| `USER_SIGNUP_SUCCESS`       | `Account created successfully`                                            | Signup success                                                    |
| `USER_SIGNIN_SUCCESS`       | `Signed in successfully`                                                  | Sign-in success                                                   |
| `USER_EMAIL_ALREADY_EXISTS` | `An account with this email already exists`                               | Signup conflict                                                   |
| `USER_INVALID_CREDENTIALS`  | `Invalid email or password. Please check your credentials and try again.` | Sign-in failure (unknown email **or** wrong password — same text) |
| `AUTH_TOKEN_INVALID`        | `Authentication required. Please sign in again.`                          | Missing/invalid/expired Bearer token (or missing auth context)    |
| `USER_NOT_FOUND`            | `User not found.`                                                         | Valid JWT but user document gone                                  |
| `INTERNAL_SERVER_ERROR`     | `Internal server error`                                                   | Unhandled / persistence errors                                    |


Password validation messages (DTO, not `ApiMessage`):


| Message                                                |
| ------------------------------------------------------ |
| `password must contain at least one letter`            |
| `password must contain at least one digit`             |
| `password must contain at least one special character` |


Plus default class-validator messages for email, min/max length, etc.

---



## Validation rules



### Password (signup & sign-in)


| Rule       | Constraint                                   |
| ---------- | -------------------------------------------- |
| Min length | 8                                            |
| Letter     | at least one `[A-Za-z]`                      |
| Digit      | at least one `\d`                            |
| Special    | at least one non-alphanumeric `[^A-Za-z0-9]` |




### Signup fields


| Field      | Rules                                       |
| ---------- | ------------------------------------------- |
| `email`    | Required; valid email; trimmed + lowercased |
| `name`     | Required; trimmed; length 3–100             |
| `password` | Required; password rules above              |




### Sign-in fields


| Field      | Rules                                       |
| ---------- | ------------------------------------------- |
| `email`    | Required; valid email; trimmed + lowercased |
| `password` | Required; password rules above              |


---



## Endpoints



### `GET /`

Scaffold hello endpoint.

**Auth:** none  

**Success** `200`

```json
{
  "message": "Hello World!"
}
```

---



### `GET /health`

Liveness for the frontend health gate.

**Auth:** none  

**Success** `200`

```json
{
  "status": "ok"
}
```

(`status` value from `HealthStatus.OK`.)

---



### `POST /users/signup`

Create an account and return a JWT session.

**Auth:** none  

**Request**

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "Secret1!"
}
```

**Success** `201`

```json
{
  "message": "Account created successfully",
  "accessToken": "<jwt>",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Jane Doe"
  }
}
```

**Errors**


| Status | `errorCode`      | `message` (typical)                         |
| ------ | ---------------- | ------------------------------------------- |
| 400    | `BAD_REQUEST`    | Validation string or string[]               |
| 409    | `CONFLICT`       | `An account with this email already exists` |
| 500    | `INTERNAL_ERROR` | `Internal server error`                     |


---



### `POST /users/signin`

Verify credentials and return a JWT session.

**Auth:** none  

**Request**

```json
{
  "email": "user@example.com",
  "password": "Secret1!"
}
```

**Success** `200`

```json
{
  "message": "Signed in successfully",
  "accessToken": "<jwt>",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Jane Doe"
  }
}
```

**Errors**


| Status | `errorCode`      | `message` (typical)                                                       |
| ------ | ---------------- | ------------------------------------------------------------------------- |
| 400    | `BAD_REQUEST`    | Validation string or string[]                                             |
| 401    | `UNAUTHORIZED`   | `Invalid email or password. Please check your credentials and try again.` |
| 500    | `INTERNAL_ERROR` | `Internal server error`                                                   |


Missing user and wrong password both return the same **401** message (no account enumeration).

---



### `GET /users/me`

Return the authenticated user’s profile from the database.

**Auth:** required — `Authorization: Bearer <accessToken>`  

**Success** `200`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "Jane Doe"
}
```

(No wrapping `message` field.)

**Errors**


| Status | `errorCode`      | `message` (typical)                              |
| ------ | ---------------- | ------------------------------------------------ |
| 401    | `UNAUTHORIZED`   | `Authentication required. Please sign in again.` |
| 404    | `NOT_FOUND`      | `User not found.`                                |
| 500    | `INTERNAL_ERROR` | `Internal server error`                          |


`401` when the header is missing, malformed, expired, or otherwise unverifiable.  
`404` when the token is valid but the user id no longer exists in MongoDB.

---



## Auth header

```http
Authorization: Bearer <accessToken>
```

There is no cookie/session auth and no refresh-token endpoint. Logout is client-only (discard the token).

---



## CORS

Allowed origin from `CORS_ORIGIN` (default `http://localhost:5173`).

---



## Endpoint summary


| Method | Path            | Auth       | Success | Success body                     |
| ------ | --------------- | ---------- | ------- | -------------------------------- |
| `GET`  | `/`             | —          | 200     | `{ message }`                    |
| `GET`  | `/health`       | —          | 200     | `{ status: "ok" }`               |
| `POST` | `/users/signup` | —          | 201     | `{ message, accessToken, user }` |
| `POST` | `/users/signin` | —          | 200     | `{ message, accessToken, user }` |
| `GET`  | `/users/me`     | Bearer JWT | 200     | `{ id, email, name }`            |


