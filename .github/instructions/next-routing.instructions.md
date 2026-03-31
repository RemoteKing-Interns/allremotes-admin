---
applyTo: "src/app/**"
description: "Route and navigation guardrails for Next.js App Router files under src/app."
---
# Next Routing Guardrails

- Keep route files aligned with App Router conventions in this repository.
- Prefer route-local loading and error states for user-facing sections.
- Use stable, canonical path segments and avoid duplicate route meanings.
- Preserve root deploy scope: route changes must stay in the repository root app.
- Do not depend on allremotes/ for production route behavior unless explicitly requested.

## Navigation and Params

- Normalize query-param reads and provide safe defaults.
- Clamp pagination/query values to valid ranges before use.
- Avoid path construction with unchecked user input.

## Data and Rendering

- Split expensive route computations with memoization where practical.
- Keep route-level UI resilient to partial or malformed API responses.
- Surface actionable errors to users without leaking implementation details.

## Performance

- For instant-feel navigations, use proper route-level configuration and boundaries.
- Avoid introducing large client-only bundles in shared route entry points without justification.
