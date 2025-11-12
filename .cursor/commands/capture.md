# Capture

## Overview
Quickly capture a new idea, feature, or bug to the backlog without context switching.

## Steps

1. **Identify Type**
   - Ask: "Is this a feature, bug, or idea?"
   - Features: New functionality
   - Bugs: Issues to fix
   - Ideas: Rough concepts for later

2. **Gather Context**
   - For Features: What user problem does this solve?
   - For Bugs: What's broken? How to reproduce?
   - For Ideas: What's the value proposition?

3. **Create Spec File**
   - Format: `feature-[name].md`, `bug-[name].md`, or `idea-[name].md`
   - Use kebab-case naming
   - Save in /docflow/specs/backlog/

4. **Write Minimal Spec**
   For features/bugs:
   ```markdown
   # [Type]: [Name]

   ## Context
   [Quick description]

   ## User Story / Bug Description
   [As a... I want... OR When... Then...]

   ## Acceptance Criteria
   - [ ] Key criteria

   ## Dependencies
   - Uses: [what it depends on]
   - Blocks: [what depends on this]

   ## Decision Log
   - [DATE]: Initial capture
   ```

   For ideas:
   ```markdown
   # Idea: [Name]

   ## Sketch
   [Brain dump - no structure required]

   ## Potential Value
   [Why this might be worth doing]

   ## Questions
   - [ ] Things to figure out
   ```

5. **Update INDEX.md**
   - Add to Backlog Priority section
   - Include brief description

## Confirmation
"Captured [type]: [name] to backlog. You can refine it later with /review."

## Checklist
- [ ] Type identified
- [ ] Spec file created in backlog
- [ ] INDEX.md updated
- [ ] User can continue current work
