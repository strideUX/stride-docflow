# ADR – Create Architecture Decision Record

## Purpose
Create a timestamped ADR file and update the ADR index.

## Usage
`/df-adr "Short, imperative title"`

## Process
1) Generate filename: `docflow/decisions/ADR-YYYY-MM-DD-xx-slug.md`
2) Use `docflow/templates/adr.md` content scaffold
3) Append entry to `docflow/decisions/README.md` Index

## Response Format
"📌 ADR created: <filename> (Status: Proposed)"
