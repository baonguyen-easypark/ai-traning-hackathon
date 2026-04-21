"""Owner: Person 1 (Budget Engine).

Pure functions that compute a spending plan from user inputs + country essentials.
No framework coupling — easy to unit test with pytest.
"""
from datetime import date, timedelta

from app.countries.data import get_essentials
from app.schemas import CategoryBudget, PlanRequest, PlanResponse

DAYS_PER_MONTH = 30.0
WEEKS_PER_MONTH = 4.33


def calculate_plan(req: PlanRequest) -> PlanResponse:
    """Stub implementation — returns a valid PlanResponse so the API + UI can integrate.

    TODO (Person 1): refine the math. Consider:
      - How much of leftover income should go to discretionary vs savings?
      - What if income < essentials + recurring? (return on_track=False with guidance)
      - Projected date should come from months_to_goal, not the deadline itself.
      - Should we compound any assumed interest on current_savings?
    """
    essentials = get_essentials(req.country)
    total_essentials = sum(essentials.values())
    total_recurring = sum(r.monthly_amount for r in req.recurring)

    monthly_savings_capacity = req.monthly_income - total_essentials - total_recurring
    remaining_to_goal = max(req.savings_goal - req.current_savings, 0)

    months_to_goal = (
        remaining_to_goal / monthly_savings_capacity
        if monthly_savings_capacity > 0
        else float("inf")
    )

    # Split leftover: 30% discretionary, 70% savings (placeholder — Person 1 to tune).
    discretionary = max(monthly_savings_capacity * 0.3, 0.0)
    actual_savings = max(monthly_savings_capacity - discretionary, 0.0)

    projected_date = (
        date.today() + timedelta(days=int(months_to_goal * DAYS_PER_MONTH))
        if months_to_goal != float("inf")
        else req.deadline
    )

    breakdown: list[CategoryBudget] = [
        CategoryBudget(category=k, monthly_amount=v, is_essential=True)
        for k, v in essentials.items()
    ]
    breakdown.append(CategoryBudget(category="recurring", monthly_amount=total_recurring, is_essential=False))
    breakdown.append(CategoryBudget(category="discretionary", monthly_amount=discretionary, is_essential=False))
    breakdown.append(CategoryBudget(category="savings", monthly_amount=actual_savings, is_essential=False))

    return PlanResponse(
        daily_budget=discretionary / DAYS_PER_MONTH,
        weekly_budget=discretionary / WEEKS_PER_MONTH,
        monthly_budget=discretionary,
        months_to_goal=months_to_goal,
        projected_date=projected_date,
        on_track=projected_date <= req.deadline,
        breakdown=breakdown,
        total_essentials=total_essentials,
        total_recurring=total_recurring,
        monthly_savings=actual_savings,
    )
