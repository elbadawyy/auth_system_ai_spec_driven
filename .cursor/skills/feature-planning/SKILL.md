---
name: feature-planning
description: Runs the planning phase of Spec-Driven Development for this fullstack repo. Reads an approved feature spec, designs backend/frontend technical plans with verifiable tasks, and writes plan files only after user approval. Use when planning a feature, creating backend-plan.md or frontend-plan.md, breaking a spec into implementation tasks, or continuing Spec-Driven Development after an approved specification.
disable-model-invocation: true
---

# Feature Planning

Planning phase only for Spec-Driven Development in this repository.

**Hard stop:** Do not modify application source code. Do not implement any tasks. Never proceed to development automatically. Responsibility ends after approved plan file(s) are saved.

## Project context

- Work at the **repository root**. Understand both sides when relevant.
- `api/` — NestJS, TypeScript, TypeORM, MongoDB backend
- `app/` — React, TypeScript, Vite frontend
- Both share one repository root; frontend talks to backend over HTTP only.

## Preconditions

1. Read the approved feature specification from:
   `specs/features/<feature-name>/spec.md`
2. Verify that the specification **exists** and has been **approved by the user**.
3. If `spec.md` is missing, incomplete, or not approved → stop and tell the user to finish the brainstorming phase first (`feature-brainstorming`). Do not invent a spec.

## Before designing the solution

1. Read all relevant project guidelines, Cursor rules (`.cursor/rules/`), architecture documentation, and existing source code.
2. Understand the existing implementation.
3. Reuse existing modules, patterns, utilities, and conventions whenever appropriate.
4. Preserve all existing project files and rules.

## Workflow

### 1. Determine feature scope

Classify as:

- **Backend** — `api/` only → plan yields `backend-plan.md`
- **Frontend** — `app/` only → plan yields `frontend-plan.md`
- **Full Stack** — both → plan yields both files

### 2. Analyze technical requirements

Cover what the approved spec demands; do not expand scope silently.

### 3. Backend planning (when applicable)

Address:

- NestJS modules and architecture
- MongoDB schemas and relationships
- DTOs and validation
- Controllers, services, and providers
- API endpoints and contracts
- Authentication and authorization
- Error handling
- Security and performance
- Required migrations or data changes
- Backend tests

### 4. Frontend planning (when applicable)

Address:

- Pages and components
- Component responsibilities
- Routing
- State management
- API integration
- TypeScript types and interfaces
- Forms and validation
- Loading, empty, and error states
- Permissions and UI behavior
- Frontend tests

### 5. Full Stack extras (when applicable)

Explicitly define:

- Backend/frontend responsibilities
- API request and response contracts
- Dependencies between both sides
- Implementation order
- Integration points

### 6. Break into tasks

Break implementation into small, independently verifiable tasks.

Each task must include:

| Field | Content |
| --- | --- |
| Task ID | Stable id (e.g. `BE-01`, `FE-03`) |
| Description | What to do |
| Scope | `api` or `app` |
| Files or modules expected to change | Concrete paths/modules where known |
| Dependencies | Other task IDs or external deps |
| Implementation details | Enough to implement without re-discovering the plan |
| Testing requirements | What to verify |
| Completion criteria | Pass/fail definition of done |

### 7. Risks and open items

Identify:

- Risks
- Technical decisions
- Assumptions
- Unresolved questions

Never silently assume important technical or business choices; ask if blocked.

### 8. Present for approval

Present the **complete proposed plan** in chat for review and approval.

Do **not** write plan files yet.

### 9. Save only after explicit approval

Only after the user **explicitly approves**, create the relevant files inside:

`specs/features/<feature-name>/`

| File | When |
| --- | --- |
| `backend-plan.md` | Backend or Full Stack |
| `frontend-plan.md` | Frontend or Full Stack |

Create **only** the files relevant to the feature scope.

### 10. Stop

After plan file(s) are saved:

- Confirm paths to the user
- Do **not** start development
- Do **not** modify `api/` or `app/` source

## Out of scope (this skill)

| Do | Do not |
| --- | --- |
| Read approved `spec.md` and codebase | Modify application source code |
| Design plans and task breakdowns | Implement any tasks |
| Draft plan in chat → save after approval | Write plan files before approval |
| Create only scope-relevant plan files | Create both plan files for single-side features |
| End after approved plan file(s) | Proceed to development automatically |

## Plan file templates

### `backend-plan.md`

```markdown
# Backend plan: <Feature name>

## Overview
## Scope
## Architecture
## Data model
## API contracts
## Auth and authorization
## Error handling
## Security and performance
## Migrations or data changes
## Tasks
### BE-01 — <title>
- Description:
- Scope: api
- Files or modules expected to change:
- Dependencies:
- Implementation details:
- Testing requirements:
- Completion criteria:
## Implementation order
## Risks
## Technical decisions
## Assumptions
## Unresolved questions
## Testing strategy
```

### `frontend-plan.md`

```markdown
# Frontend plan: <Feature name>

## Overview
## Scope
## Pages and components
## Routing
## State management
## API integration
## Types and interfaces
## Forms and validation
## UI states (loading, empty, error)
## Permissions and UI behavior
## Tasks
### FE-01 — <title>
- Description:
- Scope: app
- Files or modules expected to change:
- Dependencies:
- Implementation details:
- Testing requirements:
- Completion criteria:
## Implementation order
## Risks
## Technical decisions
## Assumptions
## Unresolved questions
## Testing strategy
```

For Full Stack features, keep contracts and implementation order aligned across both files (shared endpoint shapes, shared sequencing).

## Example turn pattern

1. User: “Plan `password-reset`.”
2. Agent: reads `specs/features/password-reset/spec.md`, rules, and relevant code.
3. Agent: drafts full plan(s) in chat (tasks with all required fields) → asks for approval.
4. User: “Approved.”
5. Agent: writes `backend-plan.md` and/or `frontend-plan.md` under that feature folder → stops.
