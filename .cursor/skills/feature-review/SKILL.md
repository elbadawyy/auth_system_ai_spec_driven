---
name: feature-review
description: Runs the testing, code review, and verification phase of Spec-Driven Development for this fullstack repo. Compares implementation to approved spec and plans, executes tests/checks, and writes review-report.md only after user approval. Use when reviewing a feature, verifying acceptance criteria, running post-implementation QA, or continuing Spec-Driven Development after development.
disable-model-invocation: true
---

# Feature Review

Testing, code review, and verification phase only for Spec-Driven Development in this repository.

**Hard stop:** Do not modify application source code during review. Do not automatically fix detected issues. Do not automatically start another development cycle. Preserve all existing project files and rules.

## Project context

- Work at the **repository root**. Understand both sides when relevant.
- `api/` — NestJS, TypeScript, TypeORM, MongoDB backend
- `app/` — React, TypeScript, Vite frontend
- Both share one repository root; frontend talks to backend over HTTP only.

## Preconditions

1. Identify the feature being reviewed (`<feature-name>`).
2. Read the approved specification:
   `specs/features/<feature-name>/spec.md`
3. Read the approved implementation plans (only those relevant to scope):
   - `specs/features/<feature-name>/backend-plan.md`
   - `specs/features/<feature-name>/frontend-plan.md`
4. If spec or required plan(s) are missing → stop and say so. Do not invent criteria.
5. Inspect the actual implementation and Git diff.
6. Review independently. Do **not** assume the implementation is correct simply because tasks were marked complete.

## Compare against

- Functional requirements
- Business rules
- Acceptance criteria
- Approved technical plan
- Existing project guidelines (`.cursor/rules/`, architecture, conventions)

## Review areas

### Functional correctness

- Missing requirements
- Incorrect business logic
- Edge cases
- Unexpected behavior

### Backend (`api/`)

- NestJS architecture
- Module responsibilities
- MongoDB schemas and queries
- DTO validation
- Authentication and authorization
- Input sanitization
- Error handling
- Security vulnerabilities
- Performance and scalability

### Frontend (`app/`)

- React component structure
- TypeScript correctness
- API integration
- State management
- Form validation
- Loading and error states
- UI behavior
- Potential rendering or performance issues

### Full Stack integration

- API contract compatibility
- Request/response consistency
- Authentication flow
- Data handling
- Integration failures

## Testing

1. Inspect existing tests and identify missing coverage.
2. Run relevant:
   - Unit tests
   - Integration tests
   - End-to-end tests when available
   - TypeScript checks
   - Lint checks
   - Production builds
3. Never claim a test passed unless it was actually executed successfully.
4. Do not modify source code during the review phase.
5. Do not automatically fix detected issues. Report findings and request approval first.

## Findings format

Classify each finding by severity:

| Severity | Meaning |
| --- | --- |
| Critical | Security vulnerabilities or severe failures that make the feature unsafe |
| High | Major functional failures |
| Medium | Incorrect behavior or important requirements not fully implemented |
| Low | Minor issues and maintainability concerns |

Every finding must include:

- Severity
- File and relevant line number when available
- Description
- Why it matters
- Suggested resolution

## Final report (present in chat first)

Present:

- Review summary
- Requirements compliance
- Code review findings
- Test execution results
- Build and TypeScript results
- Missing test coverage
- Outstanding issues

Assign **one** final status:

| Status | When |
| --- | --- |
| **PASS** | All acceptance criteria are met and no unresolved significant issues remain |
| **PASS WITH WARNINGS** | Feature works, but minor issues or non-blocking concerns remain |
| **FAIL** | Important requirements are missing, tests fail, or significant bugs/security issues exist |

## Save only after explicit approval

Only after presenting the review results and receiving **user approval**, save the report to:

`specs/features/<feature-name>/review-report.md`

Do not write the file before approval.

## After review

- Never modify application source code
- Never automatically start another development cycle
- If fixes are needed, wait for the user to request development (e.g. `feature-development`) with explicit approval

## Out of scope (this skill)

| Do | Do not |
| --- | --- |
| Read approved spec/plans and inspect diff | Trust “task complete” without verification |
| Run tests/tsc/lint/build and report real results | Claim passes without executing |
| Report findings with severity and fixes suggested | Modify source or auto-fix |
| Draft report in chat → save after approval | Write `review-report.md` before approval |
| End after approved report (or FAIL handed back) | Auto-start development again |

## Report template

```markdown
# Review report: <Feature name>

## Review summary
## Final status
PASS | PASS WITH WARNINGS | FAIL

## Requirements compliance
## Code review findings
### Finding 1 — <title>
- Severity:
- File / line:
- Description:
- Why it matters:
- Suggested resolution:
## Test execution results
## Build and TypeScript results
## Missing test coverage
## Outstanding issues
```

## Example turn pattern

1. User: “Review `password-reset`.”
2. Agent: reads spec + relevant plans, inspects implementation/diff, runs checks, drafts full report with status → asks for approval.
3. User: “Approved, save the report.”
4. Agent: writes `specs/features/password-reset/review-report.md` → stops (no code changes).
