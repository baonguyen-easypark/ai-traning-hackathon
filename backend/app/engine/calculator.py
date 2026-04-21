"""Owner: Person 1 (Budget Engine).

Pure functions that compute a spending plan from user inputs + country essentials.
No framework coupling — easy to unit test with pytest.

Math model
----------
1. remaining_to_goal   = max(goal - current_savings, 0)
2. max_monthly_savings = max(income - essentials - recurring, 0)
3. target_savings      = remaining_to_goal / months_until_deadline
4. monthly_savings     = min(target_savings, max_monthly_savings)
5. discretionary       = max_monthly_savings - monthly_savings
6. months_to_goal      = remaining_to_goal / monthly_savings
7. on_track            = projected_date <= deadline

The plan saves only what's *needed* to hit the deadline (not everything
possible) so leftover income becomes usable discretionary budget.
"""
from datetime import date, timedelta

from app.countries.data import get_essentials
from app.schemas import CategoryBudget, PlanRequest, PlanResponse

DAYS_PER_MONTH = 30.0
WEEKS_PER_MONTH = 4.33


def calculate_plan(req: PlanRequest, today: date | None = None) -> PlanResponse:
    today = today or date.today()

    essentials = get_essentials(req.country)
    total_essentials = sum(essentials.values())
    total_recurring = sum(r.monthly_amount for r in req.recurring)

    remaining_to_goal = max(req.savings_goal - req.current_savings, 0.0)
    max_monthly_savings = max(req.monthly_income - total_essentials - total_recurring, 0.0)
    months_until_deadline = (req.deadline - today).days / DAYS_PER_MONTH

    monthly_savings, discretionary, months_to_goal, projected_date, on_track = _allocate(
        remaining_to_goal=remaining_to_goal,
        max_monthly_savings=max_monthly_savings,
        months_until_deadline=months_until_deadline,
        deadline=req.deadline,
        today=today,
    )

    breakdown: list[CategoryBudget] = [
        CategoryBudget(category=k, monthly_amount=v, is_essential=True)
        for k, v in essentials.items()
    ]
    breakdown.append(CategoryBudget(category="recurring", monthly_amount=total_recurring, is_essential=False))
    breakdown.append(CategoryBudget(category="discretionary", monthly_amount=discretionary, is_essential=False))
    breakdown.append(CategoryBudget(category="savings", monthly_amount=monthly_savings, is_essential=False))

    return PlanResponse(
        daily_budget=discretionary / DAYS_PER_MONTH,
        weekly_budget=discretionary / WEEKS_PER_MONTH,
        monthly_budget=discretionary,
        months_to_goal=months_to_goal,
        projected_date=projected_date,
        on_track=on_track,
        breakdown=breakdown,
        total_essentials=total_essentials,
        total_recurring=total_recurring,
        monthly_savings=monthly_savings,
    )


def _allocate(
    *,
    remaining_to_goal: float,
    max_monthly_savings: float,
    months_until_deadline: float,
    deadline: date,
    today: date,
) -> tuple[float, float, float, date, bool]:
    """Return (monthly_savings, discretionary, months_to_goal, projected_date, on_track)."""

    # Goal already met — no saving needed; everything spare is discretionary.
    if remaining_to_goal <= 0:
        return 0.0, max_monthly_savings, 0.0, today, True

    # Income doesn't cover essentials + recurring — no saving possible.
    if max_monthly_savings <= 0:
        return 0.0, 0.0, float("inf"), deadline, False

    # Target savings rate required to hit the deadline. If the deadline is
    # today or past, we need everything now — cap the target at inf so the
    # min() below falls through to max_monthly_savings.
    target_savings = (
        remaining_to_goal / months_until_deadline
        if months_until_deadline > 0
        else float("inf")
    )

    monthly_savings = min(target_savings, max_monthly_savings)
    discretionary = max_monthly_savings - monthly_savings
    months_to_goal = remaining_to_goal / monthly_savings
    projected_date = today + timedelta(days=int(round(months_to_goal * DAYS_PER_MONTH)))
    on_track = projected_date <= deadline

    return monthly_savings, discretionary, months_to_goal, projected_date, on_track
