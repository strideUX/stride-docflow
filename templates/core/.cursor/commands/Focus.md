# Focus – Set Active Item

## Purpose
Set the active work item and update active focus and iteration status.

## Usage
`/df-focus F001`

## Process
1) Validate ID exists in `docflow/iterations/current/features.md`
2) Update `docflow/active/focus.md` with item details and next steps
3) Update status for the item to in_progress in `docflow/iterations/current/features.md`

## File Updates
- docflow/active/focus.md
- docflow/iterations/current/features.md

## Response Format
"🎯 Focus set to <ID> – <title>\nNext steps: <bullets>"
