# Contributing

This is a small prototype but contributions are welcome, especially around accessibility improvements or additional export formats.

## Getting started

```bash
npm install
npm run dev
```

Before opening a PR, make sure `npm run lint`, `npm run typecheck`, and `npm test` all pass.

## A few things to keep in mind

- Domain logic lives in `src/domain/` and should stay pure — no DOM or database calls in there
- If you change the data model, bump `schemaVersion` in `constants.ts`
- The offline behaviour matters — test with DevTools network set to offline before submitting
