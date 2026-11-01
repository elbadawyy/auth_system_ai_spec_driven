---
name: feature-complete-cycle
description: Orchestrates the full Spec-Driven Development cycle by coordinating feature-brainstormer, feature-planner, feature-developer, and feature-reviewer subagents with strict sequential approval gates. Use when running a complete feature cycle, starting Spec-Driven Development end-to-end, or when the user invokes feature-complete-cycle / a full SDD workflow for a new feature.
disable-model-invocation: true
---

# Feature Complete Cycle

Act as the main orchestrator for our
Spec-Driven Development workflow.

The project has four specialized subagents:

- feature-brainstormer
- feature-planner
- feature-developer
- feature-reviewer

IMPORTANT:
The orchestrator must coordinate subagents.
It must NOT perform their specialized work itself.

## Subagent locations

| Subagent | Definition |
| --- | --- |
| feature-brainstormer | `.cursor/agents/feature-brainstormer.md` |
| feature-planner | `.cursor/agents/feature-planner.md` |
| feature-developer | `.cursor/agents/feature-developer.md` |
| feature-reviewer | `.cursor/agents/feature-reviewer.md` |

Each subagent follows its own skill under `.cursor/skills/`. Do not duplicate or replace those skills here.

## WORKFLOW

### PHASE 1: BRAINSTORMING

1. Receive the feature idea from the user.
2. Delegate the brainstorming work to
   feature-brainstormer.
3. Wait for the subagent's result.
4. Present its findings and specification to the user.
5. Wait for explicit user approval.

Do not start planning before approval.

### PHASE 2: PLANNING

6. Delegate planning to feature-planner.
7. Provide the approved specification.
8. Wait for the complete planning result.
9. Present the proposed plans to the user.
10. Wait for explicit user approval.

Do not start development before approval.

### PHASE 3: DEVELOPMENT

11. Delegate implementation to feature-developer.
12. Provide the approved specification and plans.
13. Wait for implementation results.
14. Present progress and test results.
15. Confirm implementation completion with the user.

Do not start review automatically.

### PHASE 4: REVIEW

16. Only after user approval, delegate review
    to feature-reviewer.
17. Wait for the independent review.
18. Present all findings and test results.
19. Wait for user approval before saving the report.

## FAILURE HANDLING

- Never skip a phase.
- Never run phases in parallel.
- Never invoke multiple phase subagents together.
- Never assume approval.
- If a phase fails, stop and report the issue.
- If the specification changes, return to brainstorming.
- If the technical plan changes, return to planning
  and request approval again.
- If development has issues, request permission
  to resume development before review.

## CONTEXT MANAGEMENT

- Each phase must run through its designated subagent.
- Pass the relevant approved artifacts to each agent.
- Do not rely on conversation history alone.
- Use specification and plan files as the
  source of truth.
- Preserve the feature name and folder across phases.

Artifact paths (source of truth):

- Spec: `specs/features/<feature-name>/spec.md`
- Plans: `specs/features/<feature-name>/backend-plan.md` and/or `frontend-plan.md`
- Review: `specs/features/<feature-name>/review-report.md`

## FINAL RESULT

Report:
- Feature name.
- Approved specification.
- Approved plans.
- Implementation status.
- Review status.
- Outstanding issues.

The workflow must be reusable for every new feature.

## Orchestrator checklist

```text
Feature Complete Cycle:
- [ ] Phase 1 — Brainstorming delegated; user approved spec
- [ ] Phase 2 — Planning delegated; user approved plan(s)
- [ ] Phase 3 — Development delegated; user confirmed completion
- [ ] Phase 4 — Review delegated; user approved report save
- [ ] Final result reported
```
