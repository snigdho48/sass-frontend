# Changelog — sass-frontend (WaterSight UI)

All notable changes to the WaterSight frontend are documented here.
Entries are grouped under `[Unreleased]`, newest first, and follow the
format defined in `.cursor/rules/sass-frontend-workflow.mdc`.

## [Unreleased]

### Changed — 2026-08-18

**Time:** 2026-08-18 13:34 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Super Admin and Admin dashboards now show only the plant/water-system hierarchy overview. Performance trends, parameter charts, and KPI cards are limited to General User dashboards.

**Files:**
- `src/pages/Dashboard.js` — role-based visibility for KPI cards, performance trends, and parameter charts

**Impact:** ui

### Changed — 2026-07-19

**Time:** 2026-07-19 17:44 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** All authenticated users with a selected water system now see Daily/Monthly/Yearly availability tables with Preview and Download. Edit/delete and time chips remain Super Admin only.

**Files:**
- `src/pages/Reports.js` — open availability workspaces to all roles; hide Super Admin-only controls

**Impact:** ui

### Added — 2026-07-19

**Time:** 2026-07-19 17:28 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Super Admin Monthly and Yearly reports now show paginated availability tables/cards containing only periods with analysis data, with day/record counts and per-period Preview/Download actions and loading states.

**Files:**
- `src/pages/Reports.js` — monthly/yearly availability workspaces and period report actions
- `src/services/dataService.js` — report-period availability API helper

**Impact:** ui / API

### Added — 2026-07-19

**Time:** 2026-07-19 16:45 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Super Admin Daily reports now show a paginated date list (table/cards) with clickable time chips, per-day Preview/Download/Delete, and an edit modal for measurement values and date-time. Monthly/yearly flows are unchanged.

**Files:**
- `src/pages/Reports.js` — Super Admin daily workspace, pagination, row actions
- `src/components/AnalysisEditModal.js` — edit/delete single analysis records
- `src/services/dataService.js` — daily-groups, CRUD, delete-day helpers

**Impact:** ui / API

### Changed — 2026-07-19

**Time:** 2026-07-19 15:40 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Super Admin Water Analysis now uses a combined custom date-time picker. It defaults to the current local date and time, supports exact hour/minute and AM/PM selection, and sends both `analysis_date` and `analysis_time`.

**Files:**
- `src/components/DatePicker.js` — added custom time controls, Now/Done actions, and combined date-time display
- `src/pages/WaterAnalysis.js` — stores local date-time and submits separate API date/time values

**Impact:** ui / API

### Changed — 2026-07-19

**Time:** 2026-07-19 15:25 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Replaced the native HTML date input on Water Analysis with a custom `DatePicker` that matches SearchableSelect styling. Clicking the field opens a calendar popover (no browser date picker); value stays ISO `yyyy-MM-dd`. The header label is clickable: month/year view drill-down (days → months → years), with arrows paging by month, year, or 12-year range depending on the view.

**Files:**
- `src/components/DatePicker.js` — new custom calendar popover (date-fns) with month/year picker views
- `src/pages/WaterAnalysis.js` — Super Admin Analysis Date uses `DatePicker`

**Impact:** ui

### Added — 2026-07-19

**Time:** 2026-07-19 15:20 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Super Admin Water Analysis now has an Analysis Date calendar beside Select Plant (defaults to today). The chosen date is sent as `analysis_date` on save; other roles keep today’s date automatically.

**Files:**
- `src/pages/WaterAnalysis.js` — `analysisDate` state + Super Admin date input + save payload

**Impact:** ui

### Fixed — 2026-07-19

**Time:** 2026-07-19 15:00 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** `LoadingOverlay` is now fixed to the viewport and constrained to the content area (below the sticky header, right of the desktop sidebar), so the loader is always centered in view and never covers the sidebar — even on long scrolled pages.

**Files:**
- `src/components/LoadingOverlay.js` — `absolute inset-0` → `fixed inset-x-0 bottom-0 top-14 sm:top-16 lg:left-64`, default z-index lowered to `z-30`

**Impact:** ui

### Fixed — 2026-07-19

**Time:** 2026-07-19 14:55 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Removed leftover debug `console.log` spam from Plant Management, Reports, and the DataEntry route wrapper. Error logging via `console.error` is unchanged.

**Files:**
- `src/App.js` — removed `DataEntryRoute` debug log
- `src/pages/DataEntry.js` — removed plants/categories/submit debug logs
- `src/pages/Reports.js` — removed water-systems fetch debug logs and effect

**Impact:** ui

### Added — 2026-07-19

**Time:** 2026-07-19 13:55 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Added lightweight UI smoothness using shadcn’s `tw-animate-css` (pure CSS) — no Framer Motion. Route enter, mobile sidebar slide, modal/overlay fade, theme-icon swap, and global interactive transitions. Restored `cursor: pointer` on enabled buttons (Tailwind v4 default changed to `cursor: default`). Resting layout/colors unchanged; respects `prefers-reduced-motion`.

**Files:**
- `src/index.css` — global transition layer + `.ui-page-enter` / `.ui-modal-enter` / `.ui-overlay-enter` helpers
- `src/components/Layout.js` — sidebar slide/fade + keyed page enter
- `src/components/ThemeToggle.js` — icon enter via `animate-in`
- `src/components/InactiveAccountModal.js`, `InstallPrompt.js`, `LoadingOverlay.js` — enter animations
- `src/pages/Login.js`, `Register.js` — page enter

**Impact:** ui

### Changed — 2026-07-19

**Time:** 2026-07-19 13:50 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Dropped PostCSS in favor of the first-party `@tailwindcss/vite` plugin. Tailwind CSS 4 now compiles directly through Vite — no `postcss.config.js` required. Build output is byte-for-byte equivalent (82 KB CSS), so no visual change.

**Files:**
- `vite.config.js` — added `@tailwindcss/vite` plugin
- `postcss.config.js` — removed
- `package.json` / `package-lock.json` — replaced `@tailwindcss/postcss` + `postcss` with `@tailwindcss/vite`

**Impact:** build

### Changed — 2026-07-19

**Time:** 2026-07-19 13:45 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Migrated CRA/Yarn PnP → npm + Vite 8 (Oxc), upgraded Tailwind CSS 3 → 4 with v3 visual compatibility, scaffolded non-visual shadcn/ui infra, and bumped React to 19.2.7 — without redesigning existing screens.

**Files:**
- `package.json` / `package-lock.json` — Vite 8, React 19.2.7, Tailwind 4, shadcn helpers; removed react-scripts / Yarn PnP
- `vite.config.js` — Vite + React plugin + JSX-in-.js Oxc pre-transform + `@` alias
- `index.html` — Vite entry (moved from `public/index.html`)
- `postcss.config.js` — `@tailwindcss/postcss` only
- `tailwind.config.cjs` — legacy theme tokens loaded via `@config`
- `src/index.css` — Tailwind 4 import, v3 border/ring compat, shadcn tokens (no global body/border overrides)
- `src/store/index.js` — Vite `import.meta.env.DEV` + redux-persist ESM interop
- Opacity classnames in Layout/Loader/Admin/DataEntry/Reports/KPI cards — `bg-opacity-*` → slash syntax (equivalent visuals)
- `src/lib/utils.js`, `components.json`, `src/components/ui/` — shadcn scaffolding
- `.gitignore` — npm-only; ignore Yarn/PnP artifacts
- `README.md`, `.cursor/workflow/*` — docs for new toolchain

**Impact:** build

### Changed — 2026-07-19

**Time:** 2026-07-19 13:12 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Added hard rules to the frontend workflow rule: never change existing UI, use shadcn/ui-style smoothness for new components, target Tailwind CSS 4, npm only (no pnpm/Yarn PnP).

**Files:**
- `.cursor/rules/sass-frontend-workflow.mdc` — new "Hard rules" section; stack updated to Tailwind 4 target
- `.cursor/workflow/README.md` — styling row updated to match

**Impact:** none

### Added — 2026-07-19

**Time:** 2026-07-19 12:23 (UTC+6)
**Author:** Cursor agent
**Issue:** #none

**Summary:** Scaffolded project workflow infrastructure (rule + changelog + README) under `.cursor/` so changelog updates are enforced per the global workflow rule.

**Files:**
- `.cursor/rules/sass-frontend-workflow.mdc` — frontend workflow rule and conventions
- `.cursor/workflow/CHANGELOG.md` — this changelog
- `.cursor/workflow/README.md` — workflow documentation

**Impact:** none
