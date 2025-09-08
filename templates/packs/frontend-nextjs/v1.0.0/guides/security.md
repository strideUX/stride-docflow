---
schema: pack.guide.v1
id: frontend-nextjs-security
title: Web Security
---

# Security (Next.js)

- Secrets are server-only; never import server env in Client Components.
- Set security headers (CSP, X-Frame-Options) via middleware or config.
- Sanitize/validate all external inputs (forms, query params) with Zod.
- Cookies: `httpOnly`, `secure`, `sameSite=strict` for sessions.
- Avoid leaking sensitive error details to the client.

