# CONTROL TOWER Mobile Checkpoint — 2026-06-23

## Status

CONTROL TOWER mobile app is now locally functional end-to-end as an operator-facing command layer.

This checkpoint records the working state after taking the Emergent-generated mobile app from static/generated project state to a running local stack.

## Confirmed Working

- Frontend runs locally through Expo.
- Browser preview works at `http://localhost:8081`.
- Backend runs locally through Uvicorn/FastAPI.
- Backend responds at `http://localhost:8001`.
- MongoDB is installed and running as a Windows service.
- Backend seeds demo data successfully on startup.
- Login / demo login works after correcting frontend backend URL.
- Tower dashboard loads live seeded data.
- Module pages tested and loading:
  - Tower
  - V-HOLD
  - COST BOSS
  - POLICY PRIMER
  - TRUST LADDER / Agents

## Local Runtime Stack

```text
Frontend: http://localhost:8081
Backend:  http://localhost:8001
MongoDB:  Windows service: MongoDB
```

## Required Backend Environment Variables

The backend requires these local development environment variables before starting:

```powershell
$env:MONGO_URL="mongodb://localhost:27017"
$env:DB_NAME="control_tower_mobile"
$env:JWT_SECRET="dev-secret-change-later"
$env:JWT_REFRESH_SECRET="dev-refresh-secret-change-later"
uvicorn server:app --host 0.0.0.0 --port 8001
```

## Frontend Environment Fix

The frontend expects `EXPO_PUBLIC_BACKEND_URL` and appends `/api` inside `src/services/api.ts`:

```ts
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;
```

Therefore the correct local frontend `.env` value is:

```text
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

Do **not** set it to `http://localhost:8001/api`, or the app will call `/api/api/...` and return `Not Found`.

## Windows Setup Notes

The generated frontend has a Linux/Mac-style preinstall script:

```text
./scripts/cmd-guard.js --preinstall
```

On Windows this fails with:

```text
'.' is not recognized as an internal or external command
```

Use this install command locally:

```powershell
npm install --legacy-peer-deps --ignore-scripts
```

Expo can then be started with:

```powershell
npx expo start --clear
```

Press `w` for browser preview.

The Android emulator launch command may fail unless Android Studio / Android SDK / adb are installed and configured. That is not required for browser testing. Phone testing can use Expo Go and QR scan.

## Backend Dependency Fix

The generated backend requirements include a private Emergent package:

```text
emergentintegrations==0.2.0
```

This is not available through normal pip. For local dev, create a local requirements file without it:

```powershell
Get-Content requirements.txt | Where-Object { $_ -notmatch "emergentintegrations" } | Set-Content requirements.local.txt
pip install -r requirements.local.txt
```

## Product Architecture Read

This mobile app should remain the **operator face** for CONTROL TOWER, not become the engine.

Locked direction:

```text
CONTROL TOWER backend = authority / engine / truth
CONTROL TOWER mobile = operator face / command layer / daily-use surface
```

The mobile app is the command-center surface for:

- waiting actions
- escalations
- spend strategy
- policy hits
- denied actions
- agent trust state
- audit / operator review

## Confirmed Product Shape

The current app correctly presents the four CONTROL TOWER modules:

- **V-HOLD** — Action Authority
- **COST BOSS** — Spend Strategy
- **POLICY PRIMER** — Rule Guidance
- **TRUST LADDER** — Autonomy Progression

This preserves the core CONTROL TOWER architecture and avoids turning approvals into a separate fake product concept.

## Visual / UX Notes

The app is visually strong for an alpha:

- dark command-center style
- compact module cards
- status chips and counts
- operator-focused dashboard
- bottom tab navigation
- BRUNEL / PSYRENE / GALBUD visible on Trust Ladder page

The Trust Ladder page gives a strong ArchePersona-world bridge by showing agents as governed entities instead of generic rows.

## Known Remaining Work

1. Add proper local setup docs.
2. Add `.env.example` files for frontend and backend.
3. Add Windows start scripts:
   - `start-frontend.ps1`
   - `start-backend.ps1`
4. Fix Android bottom navigation safe-area collision after phone testing.
5. Inspect generated backend route shapes.
6. Compare generated mobile backend routes against real `v-hold` / CONTROL TOWER backend routes.
7. Replace seeded demo backend data with real CONTROL TOWER data one module at a time.
8. Decide whether Emergent backend remains as a mobile API adapter or gets replaced by direct integration with the real CONTROL TOWER backend.

## Next Best Step

Do not rip apart the mobile app. Keep the shell.

Next controlled move:

```text
make local setup repeatable → fix mobile polish → map API routes → connect to real CONTROL TOWER backend
```

## Checkpoint Summary

Phase 1 is complete: the mobile app runs locally and is functional against its seeded backend.

Phase 2 should turn the local run process into a repeatable developer workflow.

Phase 3 should wire the mobile UI to the real CONTROL TOWER codebase so the app becomes the operational face of the engine.
