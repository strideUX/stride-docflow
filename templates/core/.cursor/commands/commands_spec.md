schema: guide.v1
title: “Docflow Commands — Draft Spec”
project: “{{PROJECT_NAME}}”
owner: “{{OWNER}}”
version: 1

Docflow Commands — Draft Spec

This doc defines candidate commands to align with the Docflow operations and the future CLI/agent plan. It does not enforce behavior in rules; it’s a design surface we will finalize together.

Operations ↔ Command Candidates
- Discover → df:start (summary of goal, priorities, blockers)
- Capture → df:note "text"
- Plan → df:item:add "title" [--type feature|chore|bug|spike] [--priority P0|P1|P2] [--backlog]
- Focus → df:focus F123
- Promote → df:promote F123 [--slug custom-slug]
- Decide → df:adr "Title of Decision"
- Handoff → df:wrap
- Iterate → df:bootstrap (create minimal current) / df:archive --to 03

CLI Parity (planned)

docflow init  –pack nextjs-convex
docflow scan 
docflow promote 
docflow status

Response Contract (all commands)
- Return short success with paths changed and next actions
- On error, return clear cause and exact next step
- Never print file contents; link paths instead

Open Questions
- Do we merge df:start and df:status?
- Promote thresholds (size vs. contributor count)?
- Auto-status flips on wrap (in_progress → in_review)?

ACCEPTANCE
- All original per-command docs are preserved under .cursor/commands/_archive/.
- Only one new file remains at .cursor/commands/commands_spec.md with the content above.
- No other files changed.
