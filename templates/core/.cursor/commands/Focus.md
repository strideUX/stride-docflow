# Focus – Set Active Item

## Purpose
Set the active work item and update active focus and release status.

## Usage
`/df-focus F001`

## Process
1) Validate ID exists in `docflow/releases/current/features.md`
2) Update `docflow/active/focus.md` with item details and next steps
3) Update status for the item to In Progress in `releases/current/index.md`

## File Updates
- docflow/active/focus.md
- docflow/releases/current/index.md

## Response Format
"🎯 Focus set to <ID> – <title>\nNext steps: <bullets>"

