# CONTROL TOWER Mobile - Local Windows Setup

Status: local alpha runtime setup.

This document records the working Windows development path for the CONTROL TOWER mobile app.

## Current runtime shape

- Frontend: Expo / React Native, served from `frontend`
- Backend: FastAPI, served from `backend`
- Database: MongoDB running as a Windows service
- Local frontend URL: `http://localhost:8081`
- Local backend URL: `http://localhost:8001`
- Frontend API root: `http://localhost:8001`

Important: the mobile app is the operator face. The real CONTROL TOWER / V-HOLD backend remains the authority engine. The generated backend is useful for local demo data and adapter work, but it should not become the source of truth for V-HOLD authority decisions.

## Prerequisites

Install:

- Node.js / npm
- Python 3
- MongoDB Server
- Expo dependencies through npm

MongoDB was installed with:

```powershell
winget install MongoDB.Server
```

Confirm MongoDB is running:

```powershell
Get-Service *mongo*
```

Expected:

```text
Running  MongoDB  MongoDB Server (MongoDB)
```

If it is installed but stopped:

```powershell
Start-Service MongoDB
```

## Frontend setup

From the repo root:

```powershell
cd D:\REPOS\control-tower-mobile\frontend
npm install --legacy-peer-deps --ignore-scripts
Set-Content .env "EXPO_PUBLIC_BACKEND_URL=http://localhost:8001"
npx expo start --clear
```

When Expo starts, press:

```text
w
```

The web preview should open at:

```text
http://localhost:8081
```

Notes:

- Do not commit `frontend/.env`.
- The frontend API client adds `/api` internally.
- Therefore `EXPO_PUBLIC_BACKEND_URL` must be `http://localhost:8001`, not `http://localhost:8001/api`.

## Backend setup

From the repo root:

```powershell
cd D:\REPOS\control-tower-mobile\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
Get-Content requirements.txt | Where-Object { $_ -notmatch "emergentintegrations" } | Set-Content requirements.local.txt
pip install -r requirements.local.txt
```

Set local dev variables:

```powershell
$env:MONGO_URL="mongodb://localhost:27017"
$env:DB_NAME="control_tower_mobile"
$env:JWT_SECRET="dev-secret-change-later"
$env:JWT_REFRESH_SECRET="dev-refresh-secret-change-later"
```

Start the backend:

```powershell
uvicorn server:app --host 0.0.0.0 --port 8001
```

Expected output:

```text
Seeding demo data...
Seed data complete.
Application startup complete.
Uvicorn running on http://0.0.0.0:8001
```

Backend docs:

```text
http://localhost:8001/docs
```

## Known Windows fixes

### Frontend install script issue

The generated package has a Unix-style preinstall script:

```text
./scripts/cmd-guard.js --preinstall
```

On Windows, use:

```powershell
npm install --legacy-peer-deps --ignore-scripts
```

### Backend private dependency issue

The generated backend references a private package:

```text
emergentintegrations==0.2.0
```

For local demo runtime, remove it into a local requirements file:

```powershell
Get-Content requirements.txt | Where-Object { $_ -notmatch "emergentintegrations" } | Set-Content requirements.local.txt
pip install -r requirements.local.txt
```

### MongoDB PATH issue

`mongod` may not be available in PATH even when MongoDB is installed. That is okay if MongoDB is running as a Windows service.

Check:

```powershell
Get-Service *mongo*
```

## Working checkpoint

The app has been verified locally with:

- MongoDB running
- backend started on port `8001`
- frontend started on port `8081`
- demo login working
- dashboard loading seeded backend data
- module pages loading: Tower, V-HOLD, COST, POLICY, AGENTS

## Next release-readiness tasks

1. Add startup scripts.
2. Add safe env examples.
3. Fix Android bottom navigation safe-area collision.
4. Map demo backend routes to real CONTROL TOWER / V-HOLD routes.
5. Connect V-HOLD proposal queue first.
6. Connect proposal detail and approve / deny / hold / escalate actions.
7. Connect COST BOSS, POLICY PRIMER, TRUST LADDER, and audit after V-HOLD is working.
