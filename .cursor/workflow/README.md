# sass-frontend workflow

Development workflow for the **WaterSight** React frontend.

## Overview

Vite 8 + React 19 SPA with Tailwind CSS 4. Talks to `sassbackend` Django API.
shadcn/ui is scaffolded for future components without changing current screens.

### Key libraries

| Concern       | Library |
| ------------- | ------- |
| Bundler       | Vite 8 + `@vitejs/plugin-react` (Oxc) |
| Routing       | React Router 7 |
| State         | Redux Toolkit + redux-persist |
| Data fetching | React Query, Axios |
| UI / styling  | Tailwind CSS 4, lucide-react; shadcn tokens + `cn()` for new components |
| Charts        | Recharts |
| Forms         | react-hook-form |
| Feedback      | react-hot-toast |

## Local setup

```bash
cd sass-frontend
npm install --legacy-peer-deps
npm run dev        # http://localhost:3000
```

### Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build → `build/`
- `npm run preview` — preview production build
- `npm test` — placeholder

## Hard rules

- Never change existing UI unless explicitly requested
- npm only (no pnpm / Yarn PnP)
- Tailwind v4 via `@tailwindcss/vite` (no PostCSS) for new styling
- shadcn for new components only; keep existing `.btn` / `.card` / `.input` classes

## Day-to-day workflow

1. Focused branch + conventional commits; reference GitLab issues with `#<id>`
2. Follow `src/` structure (pages / components / store / services / contexts / hooks / lib)
3. Append a CHANGELOG entry under `[Unreleased]` in `.cursor/workflow/CHANGELOG.md`
4. Open a small merge request

## Impact tags

- `route` — screen/route change
- `api` — API service change
- `ui` — component/visual/UX change
- `state` — Redux slice/store change
- `build` — dependency or build/config change
- `none` — docs/tooling only

See `.cursor/rules/sass-frontend-workflow.mdc` for the full rule.
