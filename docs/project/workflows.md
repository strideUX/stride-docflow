# Project Workflows & Protocols

## WrapSession Protocol

### Purpose
Systematic capture of session decisions, changes, and insights to maintain project context and evolution tracking.

### When to Use
- End of significant development/planning sessions
- After major decisions or scope changes
- When architectural insights emerge
- Before handoffs between team members or AI assistants

### Protocol Steps

#### 1. Create or Locate Daily Notes File
- Check if file exists for today: `/docs/notes/YYYY-MM-DD.md`
- If not exists, create using template format
- If exists, append new timestamped section

#### 2. Identify Session Content to Capture
Capture any of these significant events:
- **DECISION RECORD**: Architectural, technical, or strategic decisions
- **SCOPE CHANGE**: Modifications to timeline, features, or project scope  
- **INSIGHT**: Important design discoveries or realizations
- **CHANGE**: Structural, process, or workflow modifications
- **NOTE**: Context, observations, or important information

#### 3. Use Standard Entry Format
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

#### 5. Cross-Reference Updates
When creating session notes, also update:
- `/docs/active/focus.md` if priorities change
- `/docs/active/session.md` for handoff context
- Relevant project documents if core specifications change

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

### Integration with Development Workflow

#### Daily Development Sessions
1. Start session by reviewing `/docs/active/focus.md` and latest notes
2. Work on assigned tasks and features
3. Before ending session, run WrapSession protocol for significant changes
4. Update focus document with next session priorities

#### Architecture and Planning Sessions  
1. Capture all major decisions using DECISION RECORD format
2. Document scope changes with impact analysis
3. Record insights about user needs or technical approaches
4. Update core project documentation if fundamental changes occur

#### Handoff Sessions
1. Create comprehensive session handoff in `/docs/active/session.md`
2. Capture context in notes for future reference
3. Ensure all decisions and changes are documented
4. Provide clear next steps and priorities

## Quick Reference Commands

### For AI Assistants
**System Prompt Addition:**
> "Please refer to WrapSession Protocol in /docs/project/workflows.md and follow the outlined process for capturing significant session decisions, changes, or insights."

**Direct Invocation:**
> "Please execute the WrapSession protocol to capture the key decisions and changes from our current discussion."

### Manual Process
1. Check today's date: `YYYY-MM-DD`
2. Open or create `/docs/notes/YYYY-MM-DD.md`
3. Add timestamped entry using standard format
4. Update cross-references as needed
5. Commit changes to preserve context

---

*This protocol ensures project evolution is systematically captured and context is preserved for future development sessions.*