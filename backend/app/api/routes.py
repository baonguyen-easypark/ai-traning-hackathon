"""Owner: Person 3 (API & Persistence).

FastAPI routes that expose the Budget Engine and persist plans to SQLite.

TODO (Person 3):
  - Persist PlanRequest on POST /plan, return a plan_id alongside the response.
  - Implement GET /plan/{id} and PUT /plan/{id} against SQLAlchemy models.
  - Decide: do we store the computed PlanResponse snapshot, or recompute on read?
"""
from fastapi import APIRouter, HTTPException

from app.countries.data import list_countries
from app.engine.calculator import calculate_plan
from app.schemas import PlanRequest, PlanResponse

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/countries")
def countries():
    return list_countries()


@router.post("/plan", response_model=PlanResponse)
def create_plan(req: PlanRequest):
    return calculate_plan(req)


@router.get("/plan/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int):
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.put("/plan/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, req: PlanRequest):
    raise HTTPException(status_code=501, detail="Not implemented yet")
