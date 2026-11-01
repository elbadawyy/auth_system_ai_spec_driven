---
name: feature-development
description: Runs the development phase of Spec-Driven Development for this fullstack repo. Implements approved spec and plan tasks one at a time with verification, tests, and progress tracking. Use when implementing a feature, executing backend-plan or frontend-plan tasks, or continuing Spec-Driven Development after approved plans.
disable-model-invocation: true
---

# Feature Development

Development phase only for Spec-Driven Development in this repository.

**Hard stop:** Do not automatically proceed to Review. Wait for explicit user approval before considering implementation complete. Preserve all existing project files and rules.

## Project context

- Work at the **repository root**. Understand both sides when relevant.
- `api/` — NestJS, TypeScript, TypeORM, MongoDB backend
- `app/` — React, TypeScript, Vite frontend
- Both share one repository root; frontend talks to backend over HTTP only.

## Preconditions

1. Identify the feature being implemented (`<feature-name>`).
2. Read the approved specification:
   `specs/features/<feature-name>/spec.md`
3. Read the approved implementation plans (only those relevant to scope):
   - `specs/features/<feature-name>/backend-plan.md`
   - `specs/features/<feature-name>/frontend-plan.md`
4. Verify that both the specification and plans have **explicit user approval**.
5. If spec or required plan(s) are missing or unapproved → stop. Direct the user to `feature-brainstorming` and/or `feature-planning`. Do not invent plans or expand scope.
6. Read all relevant project rules, guidelines, architecture documentation, and existing code.

## Start gate — confirm before coding

Before implementation, summarize:

- Feature scope
- Approved tasks
- Implementation order
- Dependencies
- Important technical decisions

**Wait for user confirmation before starting.**

## Implementation rules

1. Implement tasks according to the approved plan.
2. Work on **ONE task at a time**.
3. Before each task:
   - Read its requirements
   - Inspect related existing code
   - Identify expected changes
   - Check dependencies
4. After each task:
   - Review the changes
   - Run relevant tests
   - Run TypeScript checks when applicable
   - Run relevant lint/build checks
   - Report results
5. Do not silently skip failed checks.
6. Follow existing project conventions. Avoid unnecessary refactoring or unrelated changes.
7. Do not introduce new dependencies unless required by the approved plan or explicitly approved.

## Backend rules (when touching `api/`)

- Follow existing NestJS architecture and patterns
- Follow existing MongoDB schema conventions
- Use proper DTO validation and error handling
- Implement authentication and authorization according to existing project patterns
- Keep controllers, services, and modules responsibilities separated

## Frontend rules (when touching `app/`)

- Follow existing React component conventions
- Use existing routing and state management patterns
- Reuse existing components and utilities
- Handle loading, empty, success, and error states
- Maintain strict TypeScript typing (never use `any`)

## Full Stack rules

- Respect backend/frontend dependencies
- Follow the approved API contracts
- Verify request and response compatibility
- Test integration between both applications

## Scope control

| Rule | Action |
| --- | --- |
| Outside approved spec | Never implement |
| Significant architectural decisions | Stop; get user approval |
| Requirements conflict with existing code | Stop and explain the conflict |
| Plan needs changes | Stop; request approval before changing the plan |
| Spec or approved plans | Never modify silently |

## Progress tracking

Maintain a clear task checklist during the session:

```text
Task Progress:
- [ ] BE-01 — ...
- [ ] BE-02 — ...
- [ ] FE-01 — ...
```

- Mark tasks completed **only after verification** (checks/tests for that task).
- Report completed and pending tasks after each task (and on request).
- Keep track of failed tests and unresolved issues.

## Per-task loop

```text
1. Pick next task in approved order (deps satisfied)
2. Pre-flight: requirements, code, expected files, deps
3. Implement only that task
4. Verify: review diff, tests, tsc, lint/build as applicable
5. Report results; update checklist
6. If checks fail → fix or stop with clear failure report (do not skip)
7. Proceed to next task only when current task is verified
```

## Final output

When implementation work pauses or finishes, provide:

- Implemented tasks
- Modified files
- Tests executed
- Test results
- Build/type-check results
- Remaining issues
- Tasks not completed and reasons

Then:

- Do **not** automatically proceed to Review
- Wait for **explicit user approval** before considering implementation complete

## Out of scope (this skill)

| Do | Do not |
| --- | --- |
| Implement approved plan tasks one at a time | Start without start-gate confirmation |
| Verify with tests/tsc/lint/build | Silently skip failed checks |
| Stop on conflicts / plan gaps | Change spec or plans silently |
| Report progress and final summary | Auto-start a Review phase |
| Ask before new deps / architecture shifts | Implement outside approved spec |

## Example turn pattern

1. User: “Implement `password-reset`.”
2. Agent: reads `spec.md` + relevant plan(s) + rules/code → start-gate summary → waits.
3. User: “Confirmed, proceed.”
4. Agent: implements `BE-01` only → verifies → reports → updates checklist → next task…
5. Agent: final summary → waits for explicit approval that implementation is complete.
