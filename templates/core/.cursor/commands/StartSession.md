# StartSession - Start a New Coding Session

## Purpose
Provide immediate, concise status and next actions when resuming development work. No verbose explanations - just essential context.

## When to Use
- Starting a new development session with AI assistants
- Need rapid context switching between tasks
- Want focused, actionable next steps without long explanations

## Usage
**Prompt:** "Execute StartSession protocol - where are we and what's next?"

## Response Format
```markdown
## 🎯 Current Status
**Phase:** [Current development phase]
**Priority:** [P0/P1/P2] [Current high-priority task]
**Blockers:** [Any immediate blockers or dependencies]

# ⚡ Next Actions
1. [Immediate next task - specific and actionable]
2. [Secondary task if first is blocked]
3. [Third option/alternative approach]

# 📋 Context Check
- [ ] Active focus updated? (docflow/active/focus.md)
- [ ] Latest notes reviewed? (docflow/notes/YYYY-MM-DD.md)  
- [ ] Any decisions pending documentation?

# 🚨 Alerts
[Any urgent issues, breaking changes, or critical dependencies]
```

## Implementation Steps
When StartSession is requested:
1. Check `docflow/active/focus.md` for current priorities
2. Review latest `docflow/notes/` file for recent decisions
3. Scan `docflow/iterations/current/` for active feature status
4. Identify immediate blockers or dependencies
5. Provide 1-3 specific, actionable next steps
