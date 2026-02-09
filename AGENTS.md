# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build (validates TypeScript + compiles)
npm run lint       # ESLint
npm start          # Start production server (requires build first)
```

No test framework is configured. Use `npm run build` as the primary validation step — it runs TypeScript type-checking and Next.js compilation.

## Environment Configuration

Required env vars in `.env.local` (see `.env.example`):

- `TUYA_ACCESS_ID` — Tuya IoT Platform Access ID
- `TUYA_ACCESS_SECRET` — Tuya IoT Platform Access Secret
- `TUYA_BASE_URL` — Regional API endpoint (e.g. `https://openapi.tuyaus.com`)
- `TUYA_HOME_ID` — Home ID for cloud scene APIs (required for `/api/scenes/*`)

## Architecture

### Stack
Next.js 16 App Router + TypeScript + Tailwind CSS v4 + `@tuya/tuya-connector-nodejs` SDK. All UI text is in Vietnamese.

### Two-Layer Architecture

**Server (API routes)** → thin proxy layer that authenticates with Tuya Cloud via the SDK singleton (`src/lib/tuya.ts:getTuyaContext()`). All Tuya API calls happen server-side only. API routes return `{ success, result?, msg? }` consistently.

**Client (React components)** → single-page dashboard (`src/app/page.tsx` renders `Dashboard.tsx`). All components are `'use client'` and fetch data from the API routes. Auto-refreshes every 30 seconds.

### Key Data Flows

1. **Devices**: `Dashboard.tsx` → `GET /api/devices` → Tuya `GET /v1.0/iot-01/associated-users/devices` (paginated). Device list includes embedded status array.
2. **Device control**: `DeviceControl.tsx` → `POST /api/devices/[id]/command` → Tuya `POST /v1.0/devices/{id}/commands`. Uses optimistic UI updates.
3. **Cloud scenes**: `ScenarioPanel.tsx` (Cloud tab) → `/api/scenes/*` → Tuya `GET/POST /v1.1/homes/{home_id}/scenes`, `POST/PUT/DELETE /v1.0/homes/{home_id}/scenes/{id}/*`. Requires "Smart Home Scene Linkage" API subscription in Tuya IoT Platform.
4. **Local scenarios**: `ScenarioPanel.tsx` (Local tab) → `/api/scenarios/*` → `src/lib/scheduler.ts`. Persisted to `data/scenarios.json` and `data/scenario-logs.json` on the filesystem. Scheduler checks are triggered by periodic client polling to `POST /api/scenarios/check`.

### Important Patterns

- **Tuya SDK singleton**: `src/lib/tuya.ts` — creates one `TuyaContext` instance (handles auth/token refresh). All API routes use `getTuyaContext()`.
- **Category mappings**: `src/lib/tuya.ts` exports `CATEGORY_NAMES` and `CATEGORY_ICONS` — Vietnamese labels and emoji icons keyed by Tuya device category codes.
- **Dynamic DP fetch**: `GET /api/devices/[id]` returns `{ detail, status, functions }` in parallel. The cloud scene form uses this to populate device function (DP) options dynamically when a device is selected.
- **Sensor detection**: `SensorDashboard.tsx` auto-detects sensor devices by checking for status codes `temp_current`, `va_temperature`, `humidity_value`, `va_humidity`. Temperature values from Tuya are divided by 10.
- **Switch detection**: `DeviceCard.tsx` and `QuickActions.tsx` scan for switch codes in priority order: `switch_led`, `switch_1`, `switch`, `power`, `master`.
- **Local scenario scheduler**: Uses `setTimeout` for delayed actions within a scenario execution — these timers live in the Node.js process and are lost on restart.

### Tuya API Conventions

- Device endpoints use `/v1.0/devices/{id}/*`
- Device list uses `/v1.0/iot-01/associated-users/devices` (not `/v1.0/iot-03/`)
- Cloud scene list uses `/v1.1/homes/{home_id}/scenes` (v1.1)
- Cloud scene CRUD uses `/v1.0/homes/{home_id}/scenes/*` (v1.0)
- Cloud scene action types: `dpIssue` (device command), `delay` (wait), `ruleEnable`/`ruleDisable` (toggle other scenes)

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
