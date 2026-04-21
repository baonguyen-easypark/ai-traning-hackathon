from datetime import date, timedelta

from app.engine.calculator import calculate_plan
from app.schemas import PlanRequest, RecurringExpense


def test_basic_plan_is_on_track():
    req = PlanRequest(
        country="US",
        currency="USD",
        monthly_income=5000,
        recurring=[RecurringExpense(name="Netflix", monthly_amount=15, category="subscription")],
        savings_goal=10000,
        deadline=date.today() + timedelta(days=365),
        current_savings=0,
    )
    plan = calculate_plan(req)
    assert plan.monthly_savings > 0
    assert plan.daily_budget >= 0
    assert any(b.category == "discretionary" for b in plan.breakdown)


def test_plan_when_income_below_essentials():
    req = PlanRequest(
        country="US",
        currency="USD",
        monthly_income=500,   # below US essentials (~2250)
        savings_goal=1000,
        deadline=date.today() + timedelta(days=365),
    )
    plan = calculate_plan(req)
    assert plan.monthly_savings == 0
    assert plan.on_track is False
