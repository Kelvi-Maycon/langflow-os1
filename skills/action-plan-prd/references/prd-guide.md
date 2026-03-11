# PRD Guide

## Minimum PRD Structure

Use this shape unless the task clearly needs less:

1. Summary
2. Problem
3. Goals
4. Non-goals
5. Users or stakeholders
6. Requirements
7. Constraints and dependencies
8. Success metrics
9. Risks and open questions

## Requirement Writing Rules

- Write requirements in concrete language.
- Separate user-facing behavior from internal implementation details.
- Prefer observable outcomes over vague aspirations.
- Keep each requirement testable or at least reviewable.
- Mark assumptions when the source information is weak.

## PRD-Lite Compression

For smaller efforts, compress the PRD into:

- objective
- problem
- goals and non-goals
- users or stakeholders
- requirements
- dependencies
- success metrics

## When To Add More

Add sections for these only when they matter:

- rollout strategy
- migration plan
- support or operations impact
- analytics instrumentation
- security or compliance constraints
- communication plan

## Common Failure Modes

- requirements that are actually solutions
- no non-goals, which causes scope creep
- metrics that cannot be measured
- requirements with no stakeholder or user context
- implementation details mixed into every requirement
