# Contributing to MicroDiary

Thank you for your interest in contributing! MicroDiary is a small, focused prototype — contributions that improve accessibility, data integrity, or offline robustness are especially welcome.

## Quick start

```bash
git clone <repo-url>
cd MicroDiary
npm install
npm run dev
```

## Before you open a PR

1. **Lint and typecheck** pass:
   ```bash
   npm run lint
   npm run typecheck
   ```
2. The app loads and works **offline** (see offline testing notes in README).
3. Keyboard navigation still works for any UI changes you made.
4. If you add a new field to the data model, bump `schemaVersion` and document the change.

## Code style

- Prettier + ESLint are enforced in CI. Run `npm run format` before committing.
- Prefer small, pure functions in `domain/` — no side effects there.
- UI event wiring belongs in `ui/`, not in `domain/` or `storage/`.
- Don't add runtime dependencies without discussion — keep the bundle lean.

## Reporting issues

Open a GitHub Issue with:
- A clear description of the problem
- Steps to reproduce
- Browser and OS

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Please be respectful.
