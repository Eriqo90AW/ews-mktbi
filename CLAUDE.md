# CLAUDE.md — ews-mktbi

## Project Overview

**Early Warning System - MKTBI** — A Power Apps Code App (React + Vite) that displays a real-time disaster alert dashboard for Indonesia. It fetches data from BMKG and BNPB InaRISK APIs and renders alerts on a Leaflet map alongside KPW BI office locations and DRC sites.

- **Stack**: React 19, TypeScript, Vite 7, react-leaflet, `@microsoft/power-apps`
- **Dev server**: `npm run dev` — starts on `http://localhost:3000`
- **Build**: `npm run build` — outputs to `dist/`
- **Lint**: `npm run lint` (ESLint 9 + typescript-eslint)
- **Deploy**: Power Apps Code App via `@microsoft/power-apps-vite` plugin. Config at `power.config.json`.

## Architecture

```
src/
  App.tsx                         # Root — renders DisasterDashboard
  main.tsx                        # Entry point with ErrorBoundary
  types/index.ts                  # Shared types (DisasterAlert, Province, KpwbiOffice, etc.)
  hooks/
    useAlerts.ts                  # Fetches + aggregates all alert data (BMKG + BNPB)
  services/
    bmkgService.ts                # BMKG earthquake, extreme weather, 3-day forecast
    bmkgGisService.ts             # BMKG GIS — signature events, hotspot data
    bnpbInariskService.ts         # BNPB InaRISK — multi-hazard risk alerts per KPW office
  components/dashboard/
    DisasterDashboard.tsx         # Main layout shell (TopBar + Sidebar + EwsMap)
    TopBar.tsx                    # Header with stats (critical/warning/watch counts)
    Sidebar.tsx                   # Alert list with severity/type filters
    AlertCard.tsx                 # Individual alert card
    EwsMap.tsx                    # Leaflet map with province markers and alert overlays
    ReportModal.tsx               # Detailed report modal for a selected alert
  components/ui/
    Badge.tsx                     # Reusable severity/type badge
  constants/
    provinces.ts                  # Indonesia province list with lat/lng
    kpwbiOffices.ts               # KPW BI office locations (incl. Korwil + Kantor Pusat flags)
    drcLocations.ts               # Data Center and Disaster Recovery Center locations
    alerts.ts                     # Alert type/severity label and color maps
  utils/
    nearestKpw.ts                 # Haversine distance — finds nearest KPW office to a point
    disasterImpact.ts             # Derives impact text from alert data
```

## Key Types

- `DisasterType`: `earthquake | flood | volcanic | tsunami | landslide | extreme_weather | karhutla | kekeringan`
- `AlertSeverity`: `critical | warning | watch`
- `DisasterAlert`: core alert shape — includes `type`, `severity`, `provinceId`, optional epicenter coords, `isForecast` flag
- `KpwbiOffice`: office with `isKorwil` and `isKantorPusat` flags
- `DrcLocation`: DC or DRC site

## Data Flow

`useAlerts` fires BMKG and BNPB fetches in parallel on mount. BMKG resolves first and updates `alerts` state; BNPB appends when it resolves. The loading spinner clears after BMKG resolves — BNPB appends silently. All downstream components receive alerts via props or the hook return value.

## Power Apps Integration

`power.config.json` contains the app configuration. The Vite plugin `@microsoft/power-apps-vite` handles Code App packaging. The `localAppUrl` is `http://localhost:3000` — use `npm run dev` for local testing.

---

# Coding Guidelines

Behavioral guidelines to reduce common LLM coding mistakes on LLM coding pitfalls.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
