# WrapSession - Wrapping up or ending a coding session in a clean state.

## Purpose
End-of-session cleanup and documentation to ensure clean handoffs and fresh starting points for future work.

## When to Use
- End of significant development/planning sessions
- Before switching contexts or team handoffs
- When major work phases are completed
- Before extended breaks from the project

## Protocol Steps

### 1. Capture Outstanding Decisions/Changes
- Execute **CaptureNote Protocol** for any undocumented major decisions or scope changes from the session
- Focus only on significant decisions, architectural changes, or scope modifications

### 2. Update Active Work Status
- Update `docflow/active/focus.md` with:
  - Current work item status
  - Next steps for continuation
  - Any new blockers or dependencies
  - Handoff context for AI assistants

### 3. Update Task Progress
- Mark completed tasks/features in relevant documentation
- Update priority levels if they've changed
- Document any new tasks discovered during the session

### 4. Clean Up Development Environment
- Ensure code is in stable state with debug code removed
- Commit any work-in-progress with clear commit messages
- Document any temporary workarounds or incomplete implementations

### 5. Prepare Session Handoff
- Update `docflow/active/session.md` with:
  - What was accomplished this session
  - Current state and next priorities
  - Context needed for next session
  - Any important discoveries or insights

### 6. Final Context Check
- Ensure sufficient context is captured for seamless continuation
- Verify all major decisions are documented
- Confirm next session can start cleanly

## Example Session Capture

```markdown
# Session Notes: August 15, 2025

## 14:30 - DECISION RECORD: Template to Conversational Architecture
**Type:** Core Architecture Decision
**Impact:** High - Complete system transformation
**Previous State:** Template-based documentation generation with AI section filling
**New State:** Three-phase conversational AI approach (Discovery → Design → Generation)
**Rationale:** Current templates create generic docs; users need collaborative AI consultant
**Affects:** All generation logic, user experience, CLI interface, AI integration
**Action Required:** Implement gradual enhancement approach with backward compatibility

## 15:45 - SCOPE CHANGE: Implementation Timeline Extension
**Type:** Project Timeline
**Impact:** Medium - Resource and delivery planning
**Previous State:** 4-week implementation timeline
**New State:** 6-8 week three-phase approach
**Rationale:** Reduces risk, enables user testing, maintains working system
**Affects:** Development planning, testing strategy, user migration
**Action Required:** Update project roadmap and stakeholder communication
```
