# Wrap Session

## Overview
Save your progress and prepare for a clean resumption of work later.

## Steps

1. **Review Current Work**
   - Check all specs in /specs/active/
   - Identify what was accomplished this session
   - If spec is complete, prepare to move to /specs/complete/[YYYY-QQ]/

2. **Update Acceptance Criteria**
   - Mark any completed criteria with [x]
   - Note partially completed items

3. **Update Decision Log**
   - Add entry with today's date
   - Document key decisions made
   - Note any pivots or changes
   - Record blockers encountered

4. **Create Checkpoint**
   Add a checkpoint section to the active spec:
   ```markdown
   ## Session Checkpoint - [DATE]
   ### Accomplished
   - [What was completed]
   
   ### Next Steps
   - [What to do next]
   
   ### Blockers
   - [Any issues blocking progress]
   
   ### Questions
   - [Decisions needed]
   ```

5. **Update ACTIVE.md**
   - Update "Last Updated" date
   - Add brief status note if needed

6. **Update Dependencies**
   - If new shared code was created, ensure it's in dependencies.md
   - Document any new connections discovered

## Completion Process (if all criteria met)
1. Verify all Acceptance Criteria checked
2. Add final Decision Log entry
3. Create quarter folder if needed (e.g., /specs/complete/2024-Q4/)
4. PHYSICALLY MOVE spec from /specs/active/ to /specs/complete/[YYYY-QQ]/
5. Update INDEX.md to show completion
6. Clear from ACTIVE.md

## Confirmation
"Session wrapped. Progress saved in [spec]. Ready to resume next time."

## Checklist
- [ ] All active specs reviewed
- [ ] Acceptance criteria updated
- [ ] Decision log updated
- [ ] Checkpoint created
- [ ] ACTIVE.md current
- [ ] Dependencies documented