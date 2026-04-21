"""Shared data contract. Keep in sync with frontend/src/types/schemas.ts."""
from datetime import date

from pydantic import BaseModel, Field


class RecurringExpense(BaseModel):
    name: str
    monthly_amount: float = Field(ge=0)
    category: str  # "subscription" | "fitness" | "transport" | "other"


class PlanRequest(BaseModel):
    country: str                                         # ISO-3166-1 alpha-2, e.g. "US"
    currency: str                                        # e.g. "USD"
    monthly_income: float = Field(gt=0)
    recurring: list[RecurringExpense] = Field(default_factory=list)
    savings_goal: float = Field(gt=0)
    deadline: date
    current_savings: float = 0.0


class CategoryBudget(BaseModel):
    category: str                                        # housing | food | utilities | transport | recurring | discretionary | savings
    monthly_amount: float
    is_essential: bool


class PlanResponse(BaseModel):
    id: int | None = None
    daily_budget: float                                  # recommended discretionary spend per day
    weekly_budget: float
    monthly_budget: float
    months_to_goal: float
    projected_date: date
    on_track: bool                                       # projected_date <= deadline
    breakdown: list[CategoryBudget]
    total_essentials: float
    total_recurring: float
    monthly_savings: float
