# MicroDiary

A small browser-based time-use diary I built as a prototype for population time-use research. The idea is simple: participants log what they're doing throughout the day, the data stays on their device, and they can export it when ready.

I wanted to tackle two things that I think are often underserved in research tools — accessibility and offline reliability. Most diary tools assume a stable internet connection and a mouse. This one doesn't.

**Live demo:** [micro-diary.vercel.app](https://micro-diary.vercel.app)

---

## Why I built it this way

The main constraint I set myself was: *no data should leave the device unless the user explicitly chooses to export it.* That ruled out a backend entirely and pushed me toward IndexedDB for storage and a service worker for offline caching.

For accessibility, I've worked with enough forms that handle errors badly — errors that only show visually, focus that doesn't move, fields with no labels. I tried to do this properly: error summary that gets focused on submit failure, inline errors linked via `aria-describedby`, everything reachable by keyboard.

A few specific decisions worth noting:

- I used **Zod** for schema validation rather than just TypeScript types, because types disappear at runtime. Every entry written to the database and every export gets validated against the schema. This matters for research data — you don't want to find out your data is malformed after a study has run.
- I kept it **vanilla TypeScript with no UI framework**. For something this focused, React or Vue would have been overhead. The DOM manipulation is straightforward enough to follow without abstractions.
- The **overlap detection** was the most interesting bit to get right — two time ranges overlap if `aStart < bEnd && aEnd > bStart`. I have unit tests for this because it's the kind of logic that looks obvious but is easy to get wrong at the edges (e.g. back-to-back entries that *touch* but don't overlap).

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm run build    # production build
npm run preview  # preview the build locally
npm test         # run unit tests (30 tests, Vitest)
npm run lint     # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Project structure

```
src/
├── app.ts              bootstrap — wires everything together
├── constants.ts        single source of truth for categories, DB name, versions
├── styles.css          all styles; CSS custom properties throughout
│
├── domain/             pure logic, no side effects, fully unit tested
│   ├── schema.ts       Zod schemas for entries, form fields, export envelope
│   ├── time.ts         time utilities — overlap detection, gap finding, formatting
│   └── validation.ts   business rules — end-after-start, no overlapping entries
│
├── storage/            all persistence lives here, nowhere else
│   ├── indexeddb.ts    idb wrapper — CRUD for diary entries
│   └── localstorage.ts draft autosave + stable client ID
│
├── ui/                 DOM manipulation and event wiring
│   ├── errors.ts       inline errors + error summary focus management
│   ├── form.ts         form logic — validation, save, edit mode, autosave
│   ├── list.ts         entry list rendering + gap warnings
│   └── offline.ts      online/offline banner
│
└── export/
    ├── json.ts         validated JSON export with metadata envelope
    └── csv.ts          CSV export (RFC 4180, UTF-8 BOM for Excel compatibility)
```

The main thing I tried to enforce was keeping domain logic completely separate from UI. `domain/` has no DOM calls, `ui/` has no business logic. Makes it much easier to test and reason about.

---

## Accessibility

A few things I was deliberate about:

- **Error handling** — on submit failure, focus moves programmatically to the error summary (`role="alert"`, `tabindex="-1"`). Each field's error span is linked via `aria-describedby`. Screen reader users get the full picture without having to hunt for what went wrong.
- **Focus ring** — used `:focus-visible` rather than `:focus` so the ring only shows for keyboard navigation, not mouse clicks. 3px outline with a blue shadow gives good contrast without looking broken.
- **Skip link** — first focusable element, jumps straight to the form. Visible on focus only.
- **Live regions** — success confirmations go through a polite `aria-live` region. The offline banner uses `role="status"`.

I haven't done a full audit with a screen reader, so there are likely rough edges — but the structural patterns are right.

---

## Offline behaviour

Built as a PWA using `vite-plugin-pwa` (Workbox `generateSW` strategy). The full app shell is pre-cached on first visit, so subsequent loads work without a network.

Entries go into IndexedDB via the `idb` library — they survive offline, page refreshes, and browser restarts. LocalStorage handles draft autosave (debounced 500ms) so you don't lose a half-filled form if you accidentally close the tab.

**To test offline locally:**

1. `npm run dev` — service worker is enabled in dev mode
2. Chrome DevTools → Application → Service Workers — confirm it's registered
3. Network tab → set to Offline
4. Reload — should load from cache
5. Add an entry — saves to IndexedDB fine

For a more realistic test, `npm run build && npm run preview` and repeat the same steps.

---

## Data format

Each entry is stored and exported with enough metadata to be useful for research:

```json
{
  "id": "uuid-v4",
  "date": "YYYY-MM-DD",
  "activity": "Morning run",
  "category": "leisure",
  "startTime": "07:00",
  "endTime": "08:00",
  "notes": "optional",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "provenance": {
    "source": "manual-entry",
    "clientId": "stable uuid per browser",
    "timeZone": "Europe/London"
  },
  "schemaVersion": "1.0",
  "appVersion": "0.1.0"
}
```

JSON exports are wrapped in an envelope with `exportedAt`, `clientId`, `schemaVersion`, and `appVersion` — so you can tell when and where a dataset came from. CSV exports include all the same fields flattened, with a UTF-8 BOM so Excel opens them correctly.

---

## Known limitations / things I'd do differently with more time

- No tests for the UI layer — the domain logic is fully tested but the form wiring isn't. I'd add integration tests with `@testing-library` or Playwright.
- Safari private mode blocks IndexedDB entirely — the app currently just fails silently. Should show a proper warning.
- No participant ID field — in a real study you'd want a separate identifier from `clientId` for linking entries to a participant.
- The gap detection uses a fixed 06:00 day start which doesn't make sense for everyone.

---

## Tech

Vite, TypeScript, [idb](https://github.com/jakearchibald/idb), [Zod](https://zod.dev/), [vite-plugin-pwa](https://vite-pwa-org.netlify.app/), Vitest, ESLint, Prettier.

---

MIT licence.
