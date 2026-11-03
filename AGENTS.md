# Agent instructions

## Context
- This is a React, TypeScript, and Create React App web application for inventory management. Read `README.md` before making changes.
- Preserve existing changes and keep each task focused on the request.

## Implementation
- Before creating anything, look for reusable components, types, and functions in `src/library`, `src/components`, `src/types`, `src/utils`, and `src/services`.
- Separate presentation from business rules; give components and functions clear responsibilities.
- Reuse tokens from `src/styles/theme-palette.css` and existing Tailwind classes. Avoid duplicated styles and magic values.
- Do not invent business rules, permissions, or data. Use existing sources and call out any necessary assumptions.

## Tests
- Use the existing Jest setup for pure unit tests. Keep or update existing React Testing Library tests; avoid duplicating their coverage.
- Use Cypress for web component, integration, and E2E tests. Cypress has been selected but is not installed or configured yet; set it up before adding or running Cypress tests.
- When changing behavior, add or update focused tests and run `npm test -- --watchAll=false --runInBand` for Jest, plus the relevant Cypress tests when configured.
- If React Native is introduced, use React Native Testing Library for component tests and Maestro or Detox for native E2E. Cypress covers the web app only.
- If you cannot run the relevant tests, explain why in your summary.

## Delivery
- Summarize what changed and report the tests run and their results.
