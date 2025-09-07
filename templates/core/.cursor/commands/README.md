# Docflow Command Registry (Project-Agnostic)

Slash commands execute documentation workflows via chat. All commands are generic and operate only on the local `docflow/*` directory structure.

Prefix commands with `df-` to avoid collisions with existing tools.

## Commands

- `/df-start` – StartSession: prepare context and focus
- `/df-focus <ID>` – Set active item; update focus and index
- `/df-note "text"` – CaptureNote into `docflow/notes/YYYY-MM-DD.md`
- `/df-adr "title"` – Create an ADR using template
- `/df-feature "title"` – Add a backlog feature using template
- `/df-promptsync "summary"` – Append to prompts changelog
- `/df-wrap` – WrapSession: statuses, cleanup, handoff
- `/df-status` – Summarize counts by status in current release

Each command file in this folder documents purpose, usage, file updates, and response format.

