# Start Session

## Overview
Begin your work session by checking current progress and determining what to work on next.

## Steps

1. **Check for Pending Reviews FIRST**
   - Check /specs/active/ for any spec with status=REVIEW
   - If found, prioritize reviewing before new work
   - Ask: "Spec [name] is ready for review. Review first or continue with other work?"

2. **Check Active Work**
   - Review ACTIVE.md for any work in progress
   - Check status of active specs:
     - READY = Queued for implementation
     - IMPLEMENTING = Currently being worked on
   - If active work exists, summarize current status
   - Ask: "Continue with [current work] or switch to something else?"

3. **Check Backlog** (if no active work)
   - Review INDEX.md for backlog items
   - Check if project setup is complete
   - If not, prioritize phase-1-foundation first
   - Identify top priority item
   - Ask: "Ready to start on [item]? Let's review it first."

4. **Review Item** (if starting new work)
   - Load spec from /specs/backlog/
   - Check for completeness:
     - Clear acceptance criteria?
     - Patterns to follow documented?
     - Dependencies identified?
   - Identify any missing information
   - Ask clarifying questions if needed

5. **Activate Work**
   - Check spec's AssignedTo field
   - If assigned to someone else, warn: "This spec is assigned to [user]. Continue anyway?"
   - DELETE spec file from /specs/backlog/
   - CREATE spec file in /specs/active/
   - **Get current developer username:**
     - Try: `git config github.user`
     - Fallback: `git config user.name`
     - If neither available: use "Developer"
   - **Set status=READY, owner=Implementation, AssignedTo=@username in spec**
   - Verify file exists in /specs/active/ after move
   - Update ACTIVE.md with current focus
   - Update INDEX.md to reflect active status
   - Tell user: "Spec assigned to @username and ready for Implementation agent."

6. **No Work Available**
   - If backlog is empty, offer to capture new work
   - Ask: "No active work or backlog items. Would you like to capture a new idea/feature/bug?"

## Checklist
- [ ] Checked for status=REVIEW specs
- [ ] ACTIVE.md checked
- [ ] INDEX.md reviewed
- [ ] Current work status clear
- [ ] Spec moved to active with status=READY (if starting new)
- [ ] All tracking files updated
