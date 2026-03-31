---
agent: "agent"
description: "Audit Next.js performance for bundle size, hydration, rendering cost, and navigation responsiveness with concrete code changes."
---
Perform a performance audit for this workspace with focus on:
- Bundle size and client-component boundaries
- Hydration cost and avoidable re-renders
- Route transitions and perceived navigation speed
- Mobile rendering and interaction smoothness

Inputs:
- Target routes or components: ${input:targets:Optional, e.g. src/app/page.tsx, src/components/storefront/storefront-admin-app.tsx}
- Primary concern: ${input:concern:Optional, e.g. slow first load, janky mobile scrolling}

Deliverables:
1. Top findings ordered by impact
2. Root-cause explanation for each finding
3. Minimal code-change plan
4. Implemented fixes when safe, with validation steps
5. Follow-up monitoring checklist

Guardrails:
- Prefer measured, localized changes over broad refactors
- Preserve functional behavior unless user-approved
- Explain tradeoffs for each optimization
