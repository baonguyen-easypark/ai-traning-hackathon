"""Owner: Person 3 (API & Persistence)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.countries.data import list_countries
from app.db.database import get_db
from app.db.models import Plan
from app.engine.calculator import calculate_plan
from app.schemas import PlanRequest, PlanResponse, RecurringExpense

router = APIRouter()


def _row_to_request(row: Plan) -> PlanRequest:
    return PlanRequest(
        country=row.country,
        currency=row.currency,
        monthly_income=row.monthly_income,
        recurring=[RecurringExpense(**r) for r in (row.recurring or [])],
        savings_goal=row.savings_goal,
        deadline=row.deadline,
        current_savings=row.current_savings or 0.0,
    )


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/countries")
def countries():
    return list_countries()


@router.post("/plan", response_model=PlanResponse)
def create_plan(req: PlanRequest, db: Session = Depends(get_db)):
    row = Plan(
        country=req.country,
        currency=req.currency,
        monthly_income=req.monthly_income,
        savings_goal=req.savings_goal,
        deadline=req.deadline,
        current_savings=req.current_savings,
        recurring=[r.model_dump() for r in req.recurring],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return calculate_plan(req).model_copy(update={"id": row.id})


@router.get("/plan/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    row = db.get(Plan, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return calculate_plan(_row_to_request(row)).model_copy(update={"id": row.id})


@router.put("/plan/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: int, req: PlanRequest, db: Session = Depends(get_db)):
    row = db.get(Plan, plan_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    row.country = req.country
    row.currency = req.currency
    row.monthly_income = req.monthly_income
    row.savings_goal = req.savings_goal
    row.deadline = req.deadline
    row.current_savings = req.current_savings
    row.recurring = [r.model_dump() for r in req.recurring]
    db.commit()
    db.refresh(row)
    return calculate_plan(req).model_copy(update={"id": row.id})
