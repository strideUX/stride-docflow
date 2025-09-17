# Review

## Overview
Review and refine backlog items to prepare them for active development.

## Steps

1. **Select Item to Review**
   - If specified: Load that spec from backlog
   - If not specified: Load top priority from INDEX.md
   - Display current spec content

2. **Check Completeness**
   Verify all required sections:
   - [ ] Context clearly explains why
   - [ ] User story or bug description present
   - [ ] Acceptance criteria specific and testable
   - [ ] Technical notes have enough detail
   - [ ] Dependencies identified

3. **Identify Gaps**
   Common missing pieces:
   - Unclear scope boundaries
   - Missing technical approach
   - Unidentified dependencies
   - Vague acceptance criteria
   - Missing success metrics

4. **Ask Clarifying Questions**
   Based on gaps found:
   - "How should this handle [edge case]?"
   - "What happens if [scenario]?"
   - "Should this include [related feature]?"
   - "What's the priority: speed or accuracy?"
   - "Any existing code this needs to work with?"

5. **Check Dependencies**
   - Review other specs this might depend on
   - Check if required features are complete
   - Identify potential conflicts
   - Note in Dependencies section

6. **Refine Spec**
   - Fill in missing information
   - Clarify vague requirements
   - Add technical details discovered
   - Update estimates if needed

7. **Ready Check**
   Ask: "This looks ready for active work. Move to active? (Y/N)"
   
   If Yes:
   - Move spec from /specs/backlog/ to /specs/active/
   - Update ACTIVE.md
   - Update INDEX.md
   - Confirm: "Moved [spec] to active. Ready to start implementation."
   
   If No:
   - Keep in backlog
   - Note what still needs clarification
   - Add "Needs" section to spec

## Review Criteria
A spec is ready when:
- Problem and solution are clear
- Acceptance criteria are specific
- Technical approach is defined
- Dependencies are identified
- No major unknowns remain

## Checklist
- [ ] Spec loaded and reviewed
- [ ] Gaps identified
- [ ] Questions asked and answered
- [ ] Dependencies checked
- [ ] Spec refined with new information
- [ ] Ready/not ready decision made
- [ ] Files moved if ready
- [ ] Tracking files updated