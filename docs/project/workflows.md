# Project Workflows & Protocols

## CaptureNote Protocol

### Purpose
Systematic capture of decisions, changes, and insights during active development work to maintain project context and evolution tracking.

### When to Capture Notes (AI Should Proactively Identify)
- **DECISION RECORD**: Major architectural, technical, or strategic decisions are made
- **SCOPE CHANGE**: Project scope, timeline, or feature modifications occur
- **INSIGHT**: Important design discoveries or realizations emerge  
- **CHANGE**: Structural, process, or workflow modifications happen
- **NOTE**: Important context, observations, or external factors arise
- **BLOCKER**: Issues preventing progress are identified
- **MILESTONE**: Major completions or achievements occur

### CaptureNote Process

#### 1. Automatic Triggers
AI should recognize and capture when:
- User makes architectural or technology decisions
- Project scope or requirements change during discussion
- Important design patterns or insights are discovered
- File structures or processes are modified
- External blockers or dependencies are identified

#### 2. File Management
- Check if file exists for today: `/docs/notes/YYYY-MM-DD.md`
- If not exists, create using template format
- If exists, append new timestamped section

#### 3. Standard Entry Format
```markdown
## HH:MM - ENTRY_TYPE: Brief Description
**Type:** [Category/Impact Area]
**Impact:** [High/Medium/Low] - [Area of impact]
**Previous State:** [What it was before, if applicable]
**New State:** [What it is now]
**Rationale:** [Why this change/decision was made]
**Affects:** [What systems, processes, or areas this impacts]
**Action Required:** [Any follow-up needed]
```

#### 4. Entry Type Guidelines

**DECISION RECORD**
- Major architectural or implementation decisions
- Technology choices and justifications
- Strategy or approach selections
- Include alternatives considered and why they were rejected

**SCOPE CHANGE**
- Timeline modifications
- Feature additions, removals, or modifications
- Resource or constraint changes
- Always include impact analysis

**INSIGHT**
- Design patterns or principles discovered
- User experience realizations
- Technical approach improvements
- Process optimizations

**CHANGE**
- File structure modifications
- Workflow process updates
- Documentation organization changes
- Tool or system configuration changes

**NOTE**
- Important context for future sessions
- Observations about system behavior
- User feedback or requirements clarification
- Research findings or external factors

**BLOCKER**
- Technical issues preventing progress
- Missing dependencies or resources
- External factors causing delays
- Decisions pending from stakeholders

**MILESTONE**
- Major feature completions
- Significant architecture implementations
- Phase transitions or major deliverables
- Testing or deployment achievements

## WrapSession Protocol

### Purpose
End-of-session cleanup and documentation to ensure clean handoffs and fresh starting points for future work.

### When to Use
- End of significant development/planning sessions
- Before switching contexts or team handoffs
- When major work phases are completed
- Before extended breaks from the project

### Protocol Steps

#### 1. Capture Outstanding Decisions/Changes
- Execute **CaptureNote Protocol** for any undocumented major decisions or scope changes from the session
- Focus only on significant decisions, architectural changes, or scope modifications

#### 2. Update Active Work Status
- Update `/docs/active/focus.md` with:
  - Current work item status
  - Next steps for continuation
  - Any new blockers or dependencies
  - Handoff context for AI assistants

#### 3. Update Task Progress
- Mark completed tasks/features in relevant documentation
- Update priority levels if they've changed
- Document any new tasks discovered during the session

#### 4. Clean Up Development Environment
- Ensure code is in stable state with debug code removed
- Commit any work-in-progress with clear commit messages
- Document any temporary workarounds or incomplete implementations

#### 5. Prepare Session Handoff
- Update `/docs/active/session.md` with:
  - What was accomplished this session
  - Current state and next priorities
  - Context needed for next session
  - Any important discoveries or insights

#### 6. Final Context Check
- Ensure sufficient context is captured for seamless continuation
- Verify all major decisions are documented
- Confirm next session can start cleanly

### Example Session Capture

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

## Active Feature Lifecycle

### Purpose
Systematic workflow for managing single-feature focus with clear progression through development phases.

### Feature Status Flow
```
pending → in_progress → in_review → completed (archived)
```

### Auto-Progression Logic for AI

#### When Starting Work
1. **Check Active Focus**: Review `/docs/active/focus.md` for current feature
2. **If Empty/Completed**: Auto-pull next P0 feature from `/docs/releases/current/features.md`
3. **Update Status**: Change feature status from `pending` → `active` in features.md
4. **Create Focused Todos**: Generate 3-5 specific todos in focus.md
5. **Set Status**: Mark feature as `in_progress`

#### During Development
1. **Work Systematically**: Complete todos in order
2. **Mark Completed**: Update todos with ✅ as finished
3. **Document Progress**: Update "What was accomplished" section
4. **When All Done**: Change status to `in_review`

#### In Review Phase
1. **User Testing**: User tests and reviews the implementation
2. **Iterate**: May add/remove todos based on feedback
3. **Refine**: Continue development based on user input
4. **When Approved**: User confirms completion → status = `completed`

#### On Completion
1. **Archive Feature**: Move to `/docs/active/archive/F001-feature-name.md`
2. **Update Release**: Mark feature as `completed` in features.md  
3. **Clear Focus**: Reset `/docs/active/focus.md`
4. **Auto-Start Next**: Pull next P0 feature and restart cycle

### Integration with Development Workflow

#### Daily Development Sessions
1. Check `/docs/active/focus.md` for current feature and todos
2. Work through todos systematically, marking complete as you go
3. Run WrapSession protocol before ending significant sessions
4. Update focus with session progress and next steps

#### Feature Review Sessions  
1. User tests current implementation against acceptance criteria
2. User provides feedback, may add/remove todos
3. Use CaptureNote protocol for any scope changes or important decisions
4. Continue iteration until user confirms completion

#### Session Management
1. `/docs/active/session.md` captures current session work (archived on wrap)
2. `/docs/notes/YYYY-MM-DD.md` captures major decisions and scope changes (permanent)
3. WrapSession archives session.md and creates fresh one for next session

## StartSession Protocol

### Purpose
Provide immediate, concise status and next actions when resuming development work. No verbose explanations - just essential context.

### When to Use
- Starting a new development session with AI assistants
- Need rapid context switching between tasks
- Want focused, actionable next steps without long explanations

### Usage
**Prompt:** "Execute StartSession protocol - where are we and what's next?"

### Response Format
```markdown
## 🎯 Current Status
**Phase:** [Current development phase]
**Priority:** [P0/P1/P2] [Current high-priority task]
**Blockers:** [Any immediate blockers or dependencies]

## ⚡ Next Actions
1. [Immediate next task - specific and actionable]
2. [Secondary task if first is blocked]
3. [Third option/alternative approach]

## 📋 Context Check
- [ ] Active focus updated? (/docs/active/focus.md)
- [ ] Latest notes reviewed? (/docs/notes/YYYY-MM-DD.md)  
- [ ] Any decisions pending documentation?

## 🚨 Alerts
[Any urgent issues, breaking changes, or critical dependencies]
```

### Implementation Steps
When StartSession is requested:
1. Check `/docs/active/focus.md` for current priorities
2. Review latest `/docs/notes/` file for recent decisions
3. Scan `/docs/releases/current/` for active feature status
4. Identify immediate blockers or dependencies
5. Provide 1-3 specific, actionable next steps

## Quick Reference Commands

### For AI Assistants
**WrapSession System Prompt:**
> "Please refer to WrapSession Protocol in /docs/project/workflows.md and follow the outlined process for capturing significant session decisions, changes, or insights."

**WrapSession Direct Invocation:**
> "Please execute the WrapSession protocol to capture the key decisions and changes from our current discussion."

**StartSession Direct Invocation:**
> "Execute StartSession protocol - where are we and what's next?"

### Manual Process
1. Check today's date: `YYYY-MM-DD`
2. Open or create `/docs/notes/YYYY-MM-DD.md`
3. Add timestamped entry using standard format
4. Update cross-references as needed
5. Commit changes to preserve context

---

*These protocols ensure project evolution is systematically captured and enable rapid context switching for efficient development sessions.*