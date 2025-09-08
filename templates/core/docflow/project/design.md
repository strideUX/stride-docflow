---
schema: design.v1
id: design
project: {{PROJECT_NAME}}
owner: {{OWNER}}
date: {{DATE}}
---

# Design

Describe UX principles, flows, and component patterns. Keep this document aligned with the product’s goals and accessible design standards.

## Design Philosophy

Concise, helpful, and consistent. Guide users toward clarity and next steps. Prefer progressive disclosure and clear affordances over dense UIs.

## Key Flows (example)

1) Onboarding/Start
- Short intro; clear primary action
- Optional quick choices to reduce friction

2) Collect/Interact
- Ask for minimal input per step; provide context and validation
- Reflect progress and captured information

3) Confirm
- Summarize understanding; allow edits before committing

4) Act
- Execute the main action (e.g., create, schedule, share)
- Provide feedback and next steps

5) Wrap
- Show a concise outcome summary
- Offer follow‑up actions (export, notify, continue)

## UI Components

- Primary Container/Layout
- Inputs and Validation States
- Summary/Review Card
- Action/CTA Buttons
- Notifications (toasts/inline)

## Tone & Style

- Friendly, professional, and clear
- Avoid jargon; use plain language
- End interactions with a next step or clear finish state

## Error & Edge States

- Preserve user input on errors; explain what happened and how to resolve
- Provide graceful fallbacks if background operations fail

## Accessibility

- Keyboard navigation and visible focus
- Sufficient color contrast
- ARIA roles/labels for interactive controls

## Data Handling

- Client: ephemeral UI state; no secrets in the browser
- Server: persist domain data with appropriate redaction in logs

## Future Enhancements

- Enhancements 1–N (defer until core goals are met)

---

Keep this design document updated as flows evolve; link to specs and ADRs where choices have product impact.
