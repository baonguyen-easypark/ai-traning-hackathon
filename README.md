# Budget Planner

Hackathon project: predicts daily expenses and recommends spending levels to hit a savings goal by a target date. Accounts for country cost-of-living and recurring expenses.

## Stack

- **Backend:** Python 3.11 + FastAPI + SQLite + SQLAlchemy
- **Frontend:** React + TypeScript + Vite + Recharts

## Quick start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on mac/linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API runs on `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
UI runs on `http://localhost:5173` and proxies `/api/*` to the backend.

## Team

| # | Owner | Slice | Files |
|---|-------|-------|-------|
| 1 | TBD | Budget Engine | `backend/app/engine/` |
| 2 | TBD | Country Data | `backend/app/countries/` |
| 3 | TBD | API & Persistence | `backend/app/api/`, `backend/app/db/` |
| 4 | TBD | Input Forms | `frontend/src/forms/` |
| 5 | TBD | Dashboard & Charts | `frontend/src/dashboard/` |

## The Shared Contract

All five slices code against the schema in **`backend/app/schemas.py`** (Pydantic). The frontend mirror is **`frontend/src/types/schemas.ts`** — keep them in sync.

- `PlanRequest` → user inputs (country, income, recurring expenses, goal, deadline)
- `PlanResponse` → daily/weekly/monthly budget + category breakdown + projection

Frontend teammates can stub `createPlan()` in `frontend/src/api/client.ts` and work independently until the backend is live.

## Suggested Day 1 order

1. **All 5:** read `schemas.py` and `schemas.ts`, raise any field changes before coding.
2. **Backend:** engine + countries stub out first (pure functions, no framework). API wires them up.
3. **Frontend:** form + dashboard render against hardcoded `PlanResponse` sample, then swap to live API once backend is up.
