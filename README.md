# FocusList

A frontend-only React task manager. No backend, database, account system, or server-side application logic.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Production: `npm run build`, then serve `dist` on any static host. `npm run preview` previews the production build locally. The portable esbuild WebAssembly package is pinned for Windows compatibility.

## Features

- Create tasks with High, Medium, or Low priority.
- Complete/reopen, edit title and priority, delete, and undo the latest deletion.
- Combined case-insensitive title search, completion filters, and priority filters.
- Total, completed, and pending counts calculated from the full underlying list.
- Animated progress dial, completion states, task entry, modal, and notifications.
- Local Storage persistence, cross-tab synchronization, and storage failure notices.
- Responsive layouts, labelled controls, keyboard focus styles, native modal focus management, and reduced-motion support.
- Keyboard shortcuts: N for a new task and / to search, outside inputs.
- Optional sample list; a new browser starts empty.

Local Storage key: `focuslist.tasks.v1`. Data stays in the same browser and origin. Clearing site data removes tasks. Users on different devices have independent lists.

## Verification

Browser checks completed for blank-title validation; creation; completion; editing title and priority; combined status, priority, and case-insensitive search; global statistics under filters; refresh persistence; delete and undo; desktop and mobile layouts; and the mobile editor. Production build passes. Optional WebMCP list/create actions were checked with valid and invalid input against the same UI data.

## Stack

React, Vite, Lucide React, CSS. DM Sans and Manrope fonts use Google Fonts with local sans-serif fallbacks.

## Interaction update
- Persistent light/dark appearance, initialized before React renders to avoid a theme flash.
- Optional reduced animation mode, alongside automatic OS reduced-motion support.
- Focus timer with 5/15/25-minute presets, deadline-based countdown, pause/resume/reset; timers run during the current visit.
- Clickable task statistics, four sort orders, removable filter chips, keyboard shortcut reference, completion feedback.
- New components are in `src/Enhancements.jsx`; pure task selectors/statistics are in `src/task-utils.js`.
- `npm test` checks combined filtering, case-insensitive search, statistics, sorting, and source-data immutability.
- Browser checks cover creation validation, complete/edit/delete/undo, refresh persistence, theme persistence, timer start/pause/reset, reduced motion, keyboard search, and mobile rendering.

## Evaluation reliability update

- Storage validation is isolated in `task-storage.js`; the `useTaskStore` hook owns persistence and cross-tab synchronization.
- Validation recovers valid records, rejects empty/oversized titles and invalid priorities, deduplicates IDs, normalizes timestamps, limits focus pins, and strips unknown fields. User content is rendered as escaped React text.
- `TaskRow` provides native list semantics and labelled controls. Single-key shortcuts can be disabled in preferences. Undo has no automatic timeout. Metadata and touch targets have been enlarged.
- `useTaskBridge` isolates optional browser integration from the page component. Search/statistics are memoized; the timer updates once per second and starting a session locks the selected task. Font origins are connected early rather than discovered through a CSS import.
- `npm test` runs 11 unit tests and 10 React component tests. The component suite checks actual creation, completion, editing, reload persistence, combined filters, delete/undo, malformed storage, escaped markup, failed writes, cross-tab events, focus limits, preferences and timer behavior.
- `npm run format:check` checks consistent formatting. `npm run build` creates the frontend-only production output. Testing tools are development dependencies and are not bundled into the app.
- The dependency advisory service returned HTTP 503 during this update, so no successful vulnerability-audit claim is made. FAIE must be rerun to measure any score improvement; the supplied screenshot listed categories, not failed checks.
