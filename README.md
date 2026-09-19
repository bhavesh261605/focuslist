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
