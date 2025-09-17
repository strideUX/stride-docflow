# Capture

## Overview
Quickly capture new ideas, features, or bugs to the backlog for future work.

## Steps

1. **Identify Type**
   Ask: "What type is this?"
   - Feature: New functionality
   - Bug: Something broken
   - Idea: Rough concept to explore

2. **Gather Information**

   ### For Features
   - What problem does this solve?
   - Who needs this feature?
   - What's the desired outcome?
   - Any technical constraints?
   
   ### For Bugs
   - What's the expected behavior?
   - What's actually happening?
   - Steps to reproduce?
   - How critical is this?
   - Who is affected?
   
   ### For Ideas
   - What's the core concept?
   - Why might this be valuable?
   - Any initial thoughts on implementation?

3. **Create Spec File**
   - Generate filename: `[type]-[descriptive-name].md`
   - Use appropriate template from /specs/.templates/
   - Fill in gathered information
   - Leave unknowns as placeholders

4. **Save to Backlog**
   - Save file to /specs/backlog/
   - Keep ideas rough (they'll be refined later)

5. **Update INDEX.md**
   - Add to backlog section
   - Set initial priority if known
   - Add brief one-line description

6. **Confirm Capture**
   "Captured [type]-[name] to backlog. Current backlog has [X] items."

## Quick Capture Format
For urgent captures during active work:
```markdown
# [Type]: [Name]

## Quick Notes
[Brain dump of the idea/issue]

## Captured During
Working on: [current active spec]
Date: [DATE]

[Fill in full template later]
```

## Checklist
- [ ] Type identified
- [ ] Key information gathered
- [ ] Spec file created in backlog
- [ ] INDEX.md updated
- [ ] Confirmation provided