---
name: feature-brainstorming
description: Runs the brainstorming phase of Spec-Driven Development for this fullstack repo. Clarifies requirements one question at a time, challenges assumptions, and writes an approved feature spec under specs/features/. Use when brainstorming a feature, gathering requirements, drafting a feature specification, or starting Spec-Driven Development before planning or implementation.
disable-model-invocation: true
---

# Feature Brainstorming

Brainstorming phase only for Spec-Driven Development in this repository.

**Hard stop:** Do not write or modify application source code. Do not start implementation or technical planning. Responsibility ends after the approved specification is saved.

## Project context

- Work at the **repository root**. Understand both sides when relevant.
- `api/` — NestJS, TypeScript, TypeORM, MongoDB backend
- `app/` — React, TypeScript, Vite frontend
- Both share one repository root; frontend talks to backend over HTTP only.

## Before proposing anything

1. Read existing project rules and guidelines (`.cursor/rules/`, especially `project-core.mdc`, and `api` / `app` rules when relevant).
2. Read architecture notes and relevant source code in `api/` and/or `app/`.
3. Preserve all existing project files and rules. Do not restructure the repo for this phase.

## Workflow

### 1. Understand the feature idea

Restate the idea briefly in your own words. Confirm you understood the intent before deep-diving.

### 2. Clarify ONE question at a time

Ask clarification questions **one at a time**. Do not overwhelm the user with multiple questions in a single turn.

Explore as needed across:

- Functional requirements
- User flows
- Edge cases
- Permissions / authorization
- Validations
- Dependencies (other features, APIs, data, env)
- Non-functional requirements (security, performance, UX constraints)

### 3. Classify scope

Identify whether the feature is:

- **Backend** — `api/` only
- **Frontend** — `app/` only
- **Full Stack** — both

State the classification explicitly once enough is known; revise if later answers change it.

### 4. Challenge and decide — never silent-assume

- Challenge unclear requirements.
- Identify missing decisions.
- Never silently assume important business logic.
- If a choice is material (who can do what, what happens on failure, data ownership, etc.), ask.

### 5. Present a structured specification for approval

When requirements are clear enough, present a structured specification **in the chat** for user approval. Do **not** write `spec.md` yet.

Use this structure:

```markdown
# <Feature name>

## Feature overview
## Problem statement
## Goals and non-goals
## User stories
## Functional requirements
## Business rules
## Acceptance criteria
## Edge cases
## Dependencies
## Backend and frontend scope
## Open questions
```

### 6. Save only after explicit approval

Only after the user **explicitly approves** the specification, create:

`specs/features/<feature-name>/spec.md`

Rules for the path and file:

- `<feature-name>` — lowercase kebab-case (e.g. `user-registration`, `password-reset`)
- Create intermediate directories if missing
- Write the approved content into `spec.md` (same sections as above)
- Do not invent unapproved content when saving

### 7. Stop

After `spec.md` is saved:

- Confirm the path to the user
- Do **not** proceed to planning or development
- Do **not** create planning docs, tasks, or code unless the user starts a separate phase with a different skill/request

## Out of scope (this skill)

| Do | Do not |
| --- | --- |
| Read rules, architecture, and code for context | Modify `api/` or `app/` source |
| Ask one clarifying question per turn | Batch many questions |
| Challenge gaps and assumptions | Silently fill in business rules |
| Draft spec in chat → save after approval | Write `spec.md` before approval |
| End after approved `spec.md` | Start technical planning or implementation |

## Spec section guide

Fill every section; use “None” or “N/A” only when truly empty after discussion.

| Section | Content |
| --- | --- |
| Feature overview | Short summary of what will be built |
| Problem statement | Why this exists; pain or gap |
| Goals and non-goals | In-scope outcomes vs explicitly out of scope |
| User stories | Who · wants · so that |
| Functional requirements | Testable behaviors; prefer numbered list |
| Business rules | Invariants, permissions, calculations, state rules |
| Acceptance criteria | Clear pass/fail checks |
| Edge cases | Failures, empty states, conflicts, retries |
| Dependencies | Features, services, env, data, external systems |
| Backend and frontend scope | What belongs in `api/` vs `app/` (or single-side) |
| Open questions | Unresolved items only; empty if none |

## Example turn pattern

1. User: “I want password reset.”
2. Agent: restates idea → asks **one** question (e.g. reset via email link or OTP?).
3. Continues one question at a time until gaps are closed.
4. Agent: full structured spec in chat → asks for approval.
5. User: “Approved.”
6. Agent: writes `specs/features/password-reset/spec.md` → stops.
