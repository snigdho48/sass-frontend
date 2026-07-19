# WaterSight Frontend

React SPA for WaterSight water-analysis data logging, dashboards, and reporting.

## Stack

- **React 19.2** + React Router 7
- **Vite 8** (`@vitejs/plugin-react` with Oxc; no Babel/CRA)
- **Tailwind CSS 4** via `@tailwindcss/vite` (no PostCSS)
- **Redux Toolkit** + redux-persist, React Query, Axios
- **shadcn/ui ready** — `components.json`, `src/lib/utils.js` (`cn`), design tokens in CSS (not applied to existing UI)
- **npm only** (no Yarn PnP / pnpm)

## Getting started

### Prerequisites

- Node.js 20+ (24 recommended)
- npm
- Backend Django API running (default `http://127.0.0.1:8000/api`)

### Install & run

```bash
cd sass-frontend
npm install --legacy-peer-deps
npm run dev
```

App: `http://localhost:3000`

> `--legacy-peer-deps` is needed while `react-query@3` peers React ≤18. Leave it until a TanStack Query v5 migration.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `build/` |
| `npm run preview` | Preview production build |
| `npm test` | Placeholder (no runner yet) |

## Project structure

```
src/
├── components/     # Reusable UI (+ ui/ for future shadcn components)
├── pages/          # Route screens
├── services/       # API clients
├── store/          # Redux + persist
├── contexts/       # Theme, Auth
├── hooks/
├── lib/utils.js    # cn() helper for shadcn
└── index.css       # Tailwind 4 + app component classes + shadcn tokens
```

## shadcn/ui

Infrastructure only — existing screens are unchanged. To add a component later:

```bash
npx shadcn@latest add button
```

Do **not** apply shadcn global `body` / `border-border` base overrides, and do **not** remap the existing `primary-*` / `secondary-*` palettes.

## Workflow docs

See [`.cursor/workflow/README.md`](.cursor/workflow/README.md) and [`.cursor/workflow/CHANGELOG.md`](.cursor/workflow/CHANGELOG.md).
