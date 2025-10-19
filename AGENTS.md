# Repository Instructions

## Scope
These instructions apply to the entire repository unless superseded by a nested `AGENTS.md`.

## Process
- Follow a tests-first workflow: add or update tests before implementing code changes.
- Keep diffs minimal and focused on the stated objectives.
- Do not add new dependencies unless absolutely required and justified.
- Provide documentation citations for nontrivial APIs or framework usage in final reports.
- Preserve project invariants and note any deviations explicitly.

## Commands
- Test command: `npm run test`
- Type check: `npm run typecheck`
- Lint/format: `npm run lint`
- Quick security check: `npm audit --production`

## Invariants
- No secrets, API keys, or sensitive data committed to the repository.
- Maintain consistent TypeScript/React coding style.
- Ensure all public APIs are documented with concise JSDoc where necessary.

