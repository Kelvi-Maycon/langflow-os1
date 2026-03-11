#!/usr/bin/env python3
"""Generate a markdown planning bundle for quick, standard, or full plans."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


QUICK_FILES = {
    "00-brief.md": """# {title}

## Objective

## Problem Or Opportunity

## Audience

## Constraints

## Assumptions

## Success Criteria
""",
    "01-action-plan.md": """# Action Plan

## Recommended Approach

## Phases

### Phase 1

### Phase 2

### Phase 3

## Immediate Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Risks

## Open Questions
""",
}

STANDARD_FILES = {
    "00-brief.md": """# {title}

## Summary

## Problem

## Goals

## Non-Goals

## Users Or Stakeholders

## Constraints

## Assumptions
""",
    "01-prd.md": """# PRD

## Objective

## Problem Statement

## Goals

## Non-Goals

## Users Or Stakeholders

## Requirements

## Dependencies

## Success Metrics

## Risks And Open Questions
""",
    "02-execution-plan.md": """# Execution Plan

## Recommended Approach

## Workstreams

## Milestones

### Milestone 1

### Milestone 2

### Milestone 3

## Dependencies

## Review Cadence
""",
    "03-task-backlog.md": """# Task Backlog

## Phase 1

### Task
- Why:
- Dependencies:
- Acceptance criteria:

## Phase 2

### Task
- Why:
- Dependencies:
- Acceptance criteria:

## Phase 3

### Task
- Why:
- Dependencies:
- Acceptance criteria:
""",
}

FULL_FILES = {
    **STANDARD_FILES,
    "04-risks-decisions.md": """# Risks And Decisions

## Risk Register

### Risk
- Likelihood:
- Impact:
- Mitigation:
- Contingency:

## Decision Log

### Decision
- Date:
- Owner:
- Rationale:
- Alternatives considered:
""",
    "05-rollout-metrics.md": """# Rollout And Measurement

## Rollout Plan

## Communication Plan

## Enablement Or Training

## Monitoring

## Success Metrics

## Post-Launch Review
""",
}

FILES_BY_MODE = {
    "quick": QUICK_FILES,
    "standard": STANDARD_FILES,
    "full": FULL_FILES,
}


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "plan-bundle"


def build_output_path(title: str, output: str | None) -> Path:
    if output:
        return Path(output)
    return Path(slugify(title))


def write_files(output_dir: Path, title: str, mode: str, force: bool) -> None:
    templates = FILES_BY_MODE[mode]
    if output_dir.exists() and any(output_dir.iterdir()) and not force:
        raise FileExistsError(
            f"Output directory '{output_dir}' already exists and is not empty. Use --force to overwrite files."
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    for filename, template in templates.items():
        target = output_dir / filename
        if target.exists() and not force:
            raise FileExistsError(f"File '{target}' already exists. Use --force to overwrite files.")
        target.write_text(template.format(title=title), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scaffold a markdown planning bundle.")
    parser.add_argument("--title", required=True, help="Plan title")
    parser.add_argument(
        "--mode",
        choices=sorted(FILES_BY_MODE),
        default="standard",
        help="Bundle size to generate",
    )
    parser.add_argument(
        "--output",
        help="Output directory. Defaults to a slug derived from the title.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files in the output directory.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = build_output_path(args.title, args.output)

    try:
        write_files(output_dir, args.title, args.mode, args.force)
    except FileExistsError as error:
        print(str(error), file=sys.stderr)
        return 1

    print(f"Created {args.mode} plan bundle at {output_dir}")
    for filename in sorted(FILES_BY_MODE[args.mode]):
        print(f"- {output_dir / filename}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
