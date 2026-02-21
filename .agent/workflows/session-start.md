---
description: Steps the agent should take at the beginning of a coding session, during code changes and after the completion of coding changes.
---

## Phase 1: Session Kickoff
1. Read `PLANNING.md` to understand the current project phase and context.
// turbo
2. Run `git status` and `git log -n 3` to check the current branch state and recent history.

## Phase 2: During Active Development
3. After each meaningful code change or feature completion, proactively update `PLANNING.md` to reflect the new state of tasks.
4. Keep `testing.md` updated with fresh instructions on how to test any new features or UI flows you just built.

## Phase 3: Session Wrap-up
5. Group your work into meaningful commits. Only execute `git commit` when a major codebase task or phase is completed, rather than after every single small file change. Make sure the commit message details the phase and versioning information.
6. If any new persistent instructions, architectural quirks, or context are discovered during the session, update this `.agent/workflows/session-start.md` file with that new important information so future sessions remember it.