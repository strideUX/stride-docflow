# CaptureNote - Capture Note and/or Important Decisions or Changes

## Purpose
Systematic capture of decisions, changes, and insights during active development work to maintain project context and evolution tracking.

## When to Capture Notes (AI Should Proactively Identify)
- **DECISION RECORD**: Major architectural, technical, or strategic decisions are made
- **SCOPE CHANGE**: Project scope, timeline, or feature modifications occur
- **INSIGHT**: Important design discoveries or realizations emerge  
- **CHANGE**: Structural, process, or workflow modifications happen
- **NOTE**: Important context, observations, or external factors arise
- **BLOCKER**: Issues preventing progress are identified
- **MILESTONE**: Major completions or achievements occur

## CaptureNote Process

### 1. Automatic Triggers
AI should recognize and capture when:
- User makes architectural or technology decisions
- Project scope or requirements change during discussion
- Important design patterns or insights are discovered
- File structures or processes are modified
- External blockers or dependencies are identified

### 2. Daily File Management
- **Daily Pattern**: One file per day using format `docflow/notes/YYYY-MM-DD.md`
- **If Today's File Exists**: Append new timestamped section to existing file
- **If Today's File Missing**: Create new file with session overview header and first entry
- **Historical Files**: Never modify previous days' files - each day is preserved as historical record
- **File Structure**: Each daily file should have session overview at top, then chronological timestamped entries

### 3. Standard Entry Format
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

### 4. Entry Type Guidelines

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
