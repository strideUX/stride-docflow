---
schema: guide.v1
title: "Performance & Security"
project: "{{PROJECT_NAME}}"
owner: "{{OWNER}}"
version: 1
---

Performance & Security

Performance
	•	RSC-first: prefer Server Components; keep client components minimal.
	•	PPR/Streaming: use Partial Pre-rendering and Suspense for progressive loading.
	•	Parallel fetch: start all async work at once (Promise.all).
	•	next/image: set sizes/quality; lazy-load below the fold.
	•	Cache: use static/ISR when safe; otherwise rely on Convex query perf.

Security
	•	Validate: use zod (or equivalent) at all external boundaries.
	•	Secrets: server-only env; managed secret store in production.
	•	Headers: CSP, HSTS/HTTPS redirects, secure cookies (httpOnly, sameSite).
	•	Access: server-side authorization; rate limit sensitive endpoints.
