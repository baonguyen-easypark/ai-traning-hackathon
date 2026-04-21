# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Budget Planner — hackathon tool that predicts daily expenses and recommends a spending plan to hit a savings goal by a target date. Accounts for country cost-of-living and user-declared recurring expenses.

Built by a 5-person team; scope is intentionally small. Don't add features beyond what's asked.

## Stack

- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.x, SQLite, pytest
- **Frontend:** React 18, TypeScript, Vite, Recharts, axios

## Commands

```bash
# Backend (from backend/)
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
uvicorn app.main:app --reload                           # http://localhost:8000
pytest                                                  # run tests

# Frontend (from frontend/)
npm install
npm run dev                                             # http://localhost:5173
npm run build
```

Vite proxies `/api/*` → `http://localhost:8000`, so the frontend talks to the backend via relative URLs.

## Architecture

```
backend/app/
  schemas.py          # Pydantic contract — THE source of truth for data shapes
  main.py             # FastAPI app + CORS
  engine/calculator.py   # pure math; no framework imports
  countries/data.py      # cost-of-living lookup (countries.json)
  api/routes.py          # HTTP layer; delegates to engine
  db/                    # SQLAlchemy models + session

frontend/src/
  types/schemas.ts    # MIRROR of backend schemas.py — keep in sync
  api/client.ts       # axios wrapper around /api
  forms/PlanForm.tsx  # collects PlanRequest
  dashboard/Dashboard.tsx  # renders PlanResponse
```

## The Contract (critical)

`backend/app/schemas.py` and `frontend/src/types/schemas.ts` define the cross-team data shapes. They must stay in sync. When changing either:

1. Update both files in the same commit.
2. Announce the change to the team before merging — five people code against these.

Key types:
- `PlanRequest` — user inputs (country, income, recurring, goal, deadline)
- `PlanResponse` — daily/weekly/monthly budget + category breakdown + projection

## File ownership

| Slice | Owner | Path |
|-------|-------|------|
| Budget Engine | Person 1 | `backend/app/engine/` |
| Country Data | Person 2 | `backend/app/countries/` |
| API & Persistence | Person 3 | `backend/app/api/`, `backend/app/db/` |
| Input Forms | Person 4 | `frontend/src/forms/` |
| Dashboard & Charts | Person 5 | `frontend/src/dashboard/` |

Prefer editing files within your slice. Cross-slice changes (especially to `schemas.py` / `schemas.ts`) need a heads-up.

## Conventions

- **Engine stays pure.** `calculator.py` must not import FastAPI or SQLAlchemy — it takes a `PlanRequest`, returns a `PlanResponse`. Easy to unit test.
- **Country data is lazy-loaded and cached.** `get_essentials()` reads `countries.json` once per process.
- **Frontend uses relative `/api/*` URLs.** Don't hardcode `localhost:8000` — Vite handles it.
- **Money is stored as `float` in the local currency.** Currency code comes from the country entry; no conversion logic in the engine.
- **Dates are ISO strings over the wire** (`YYYY-MM-DD`), Pydantic `date` in Python, plain string in TS.

## Gotchas

- `essentials` values in `countries.json` are in each country's local currency — do not sum across countries.
- The current `calculate_plan()` in `engine/calculator.py` is a **stub** that returns a valid shape but uses placeholder math (30% discretionary / 70% savings). Person 1 will refine.
- `GET/PUT /plan/{id}` return 501 — Person 3 hasn't wired persistence yet. The UI should only call `POST /plan` until then.

## Out of scope

Unless specifically asked, do NOT add:
- Authentication / user accounts
- Multi-currency conversion
- Bank/Plaid integration
- Mobile app / PWA
- CI/CD, Docker, Kubernetes

Keep the demo path short.
