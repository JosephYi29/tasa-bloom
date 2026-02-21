---
description: Finish the current session by updating trackers and committing code
---

## Phase 1: Review and Update Trackers
1. Read the recent changes in the codebase to review what features and fixes were completed during this session.
2. Update `testing.md` with all the necessary testing instructions and updates for the new features or components.
3. Update `PLANNING.md` by checking off any completed features and adding any new features or technical debt that must be implemented.

## Phase 2: Quality Check
// turbo
4. Run `npm run lint` to check for any linting errors. If there are errors, stop the workflow and ask the user to fix them.
// turbo
5. Run `npm run build` to verify the build compiles successfully. If there are errors, stop the workflow and ask the user to fix them.

## Phase 3: Staging, Committing, and Pushing
// turbo
6. Run `git add .` to stage all the changes.
7. Identify the current phase and versioning information from `PLANNING.md` or prompt the user if unclear.
// turbo
8. Run `git commit -m "[Phase {X} / v{Y.Z}] Summary of feature updates and tracker changes"` to commit the changes, replacing `{X}` and `{Y.Z}` with the appropriate phase and version constraints.
// turbo
9. Run `git push` to push the committed changes to your remote repository.

## Phase 4: Session Wrap-up
10. Provide a summary of the committed work to the user and announce that the active coding session is now complete.
