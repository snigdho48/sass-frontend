# Visual baseline (pre-migration)

Captured 2026-07-19 against CRA + Tailwind 3 + npm (Yarn PnP removed).

## Runtime
- Server: `npm run dev` → `http://localhost:3000`
- Webpack compiled with ESLint unused-var warnings only (no compile errors)
- Console on `/login`: no errors/warnings

## Computed styles (light)
| Page | body background | body color | font |
|------|-----------------|------------|------|
| `/login` | `rgb(249, 250, 251)` (`gray-50`) | `rgb(17, 24, 39)` (`gray-900`) | Inter, system-ui, sans-serif |

## Pages captured
- `/login` (light) — Sign in form, WaterSight logo, blue primary button
- `/register` (light) — Create account form
- `/this-page-does-not-exist` (light) — NotFound

## Guardrails for comparison after each stage
- Body background and text colors must match
- Primary blue buttons/links unchanged
- Inter font family unchanged
- Form layout, spacing, border radius unchanged
- Dark mode uses `html.dark` class

## Post-migration (Vite 8 + Tailwind 4 + shadcn infra) — 2026-07-19

Verified on Chrome DevTools at `http://localhost:3001/login` (dev later on `:3000`):

| Check | Result |
|-------|--------|
| Login light | Renders; Inter; Sign in heading; no console errors |
| Login dark | `html.dark`; dark body colors apply |
| Production build | `npm run build` OK in ~1.55s → `build/` |
| React | 19.2.7 |
| Vite | 8.1.5 |
| Tailwind | 4.3.3 |

Note: Tailwind v4 reports colors as OKLCH (e.g. gray-50 → `oklch(0.985 …)`) instead of `rgb(249, 250, 251)`. Visual appearance is equivalent; layout/branding unchanged.
