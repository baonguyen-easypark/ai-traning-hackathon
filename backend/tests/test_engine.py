from datetime import date, timedelta

from app.engine.calculator import DAYS_PER_MONTH, WEEKS_PER_MONTH, calculate_plan
from app.schemas import PlanRequest, RecurringExpense

US_ESSENTIALS_TOTAL = 1500 + 400 + 200 + 150          # 2250, matches countries.json
VN_ESSENTIALS_TOTAL = 5_000_000 + 3_000_000 + 800_000 + 500_000  # 9,300,000 VND


def _req(**overrides) -> PlanRequest:
    """Build a PlanRequest with sensible defaults; override fields per test."""
    base = dict(
        country="US",
        currency="USD",
        monthly_income=5000,
        recurring=[],
        savings_goal=10000,
        deadline=date(2027, 1, 1),
        current_savings=0,
    )
    base.update(overrides)
    return PlanRequest(**base)


def test_basic_plan_is_on_track():
    req = _req(
        recurring=[RecurringExpense(name="Netflix", monthly_amount=15, category="subscription")],
        deadline=date.today() + timedelta(days=365),
    )
    plan = calculate_plan(req)
    assert plan.monthly_savings > 0
    assert plan.daily_budget >= 0
    assert plan.on_track is True
    assert any(b.category == "discretionary" for b in plan.breakdown)


def test_plan_when_income_below_essentials():
    req = _req(
        monthly_income=500,   # below US essentials (~2250)
        savings_goal=1000,
        deadline=date.today() + timedelta(days=365),
    )
    plan = calculate_plan(req)
    assert plan.monthly_savings == 0
    assert plan.monthly_budget == 0
    assert plan.on_track is False


def test_zero_recurring_uses_full_leftover():
    today = date(2026, 1, 1)
    # 12 months to goal, save exactly what's needed, rest is discretionary.
    req = _req(
        monthly_income=5000,
        recurring=[],
        savings_goal=6000,
        deadline=date(2027, 1, 1),   # 365 days → ~12.17 months
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.total_recurring == 0
    assert plan.total_essentials == US_ESSENTIALS_TOTAL

    # target = 6000 / (365/30) ≈ 493.15; max capacity = 5000 - 2250 = 2750
    assert plan.monthly_savings < 2750
    assert plan.monthly_savings == 6000 / (365 / DAYS_PER_MONTH)
    assert plan.monthly_budget == (5000 - US_ESSENTIALS_TOTAL) - plan.monthly_savings
    assert plan.on_track is True


def test_goal_already_met():
    today = date(2026, 1, 1)
    req = _req(
        savings_goal=5000,
        current_savings=5000,            # already there
        deadline=date(2027, 1, 1),
    )
    plan = calculate_plan(req, today=today)

    assert plan.monthly_savings == 0
    assert plan.months_to_goal == 0
    assert plan.projected_date == today
    assert plan.on_track is True
    # No savings needed → all leftover income is discretionary.
    assert plan.monthly_budget == 5000 - US_ESSENTIALS_TOTAL


def test_past_deadline_is_not_on_track():
    today = date(2026, 4, 1)
    req = _req(
        savings_goal=10000,
        deadline=date(2026, 1, 1),       # 3 months ago
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    # Can't retroactively save — but the engine still produces a usable plan
    # that saves as much as possible toward the goal.
    assert plan.on_track is False
    assert plan.monthly_savings > 0
    assert plan.monthly_savings == 5000 - US_ESSENTIALS_TOTAL     # full capacity
    assert plan.monthly_budget == 0                               # nothing left over
    assert plan.projected_date > req.deadline


def test_goal_unreachable_by_deadline_saves_maximum():
    """Target savings exceeds what income allows → save everything possible, miss deadline."""
    today = date(2026, 1, 1)
    req = _req(
        monthly_income=3000,             # capacity = 3000 - 2250 = 750/mo
        savings_goal=50000,              # would need ~4100/mo to hit in 12 months
        deadline=date(2027, 1, 1),
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.monthly_savings == 750           # clamped to capacity
    assert plan.monthly_budget == 0              # nothing left for discretionary
    assert plan.on_track is False
    assert plan.months_to_goal > 12              # won't hit deadline

    # Savings + essentials should equal income (no money unaccounted for).
    assert plan.total_essentials + plan.monthly_savings == 3000


def test_breakdown_sums_to_income():
    """All categories in the breakdown should sum to the user's monthly income."""
    today = date(2026, 1, 1)
    req = _req(
        monthly_income=4000,
        recurring=[
            RecurringExpense(name="Gym", monthly_amount=50, category="fitness"),
            RecurringExpense(name="Spotify", monthly_amount=10, category="subscription"),
        ],
        savings_goal=12000,
        deadline=date(2027, 1, 1),
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    total = sum(b.monthly_amount for b in plan.breakdown)
    assert abs(total - req.monthly_income) < 0.01


# ---------------------------------------------------------------------------
# Boundary cases
# ---------------------------------------------------------------------------

def test_deadline_is_today_saves_max_and_misses():
    """Deadline == today → target is effectively infinite; save everything possible, miss."""
    today = date(2026, 4, 21)
    req = _req(
        savings_goal=5000,
        deadline=today,                   # zero months available
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.monthly_savings == 5000 - US_ESSENTIALS_TOTAL   # full capacity
    assert plan.monthly_budget == 0
    assert plan.on_track is False
    assert plan.projected_date > today


def test_current_savings_exceeds_goal_behaves_like_met():
    """Overshooting the goal should be treated the same as exactly meeting it."""
    today = date(2026, 1, 1)
    req = _req(
        savings_goal=5000,
        current_savings=7500,             # already over the goal
        deadline=date(2027, 1, 1),
    )
    plan = calculate_plan(req, today=today)

    assert plan.monthly_savings == 0
    assert plan.months_to_goal == 0
    assert plan.projected_date == today
    assert plan.on_track is True
    assert plan.monthly_budget == 5000 - US_ESSENTIALS_TOTAL   # everything spare is discretionary


def test_on_track_boundary_projected_equals_deadline():
    """When projected_date lands exactly on the deadline, on_track must still be True."""
    today = date(2026, 1, 1)
    # deadline in exactly 30 days → 1 month until deadline
    deadline = today + timedelta(days=30)
    req = _req(
        monthly_income=5000,
        recurring=[],
        savings_goal=1000,                # target = 1000 / 1 month = 1000/mo, capacity = 2750
        deadline=deadline,
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.monthly_savings == 1000
    assert plan.months_to_goal == 1
    assert plan.projected_date == deadline
    assert plan.on_track is True


def test_essentials_plus_recurring_exactly_equals_income():
    """Boundary: savings capacity is exactly zero, not negative."""
    today = date(2026, 1, 1)
    req = _req(
        monthly_income=US_ESSENTIALS_TOTAL + 100,     # just 100 over essentials
        recurring=[RecurringExpense(name="Gym", monthly_amount=100, category="fitness")],
        savings_goal=1000,
        deadline=date(2027, 1, 1),
    )
    plan = calculate_plan(req, today=today)

    # essentials + recurring = income → no capacity → same branch as below-essentials
    assert plan.monthly_savings == 0
    assert plan.monthly_budget == 0
    assert plan.on_track is False


# ---------------------------------------------------------------------------
# Coverage holes
# ---------------------------------------------------------------------------

def test_non_us_country_uses_local_essentials():
    """VN essentials are in millions of VND — ensure the country lookup and math work at that scale."""
    today = date(2026, 1, 1)
    req = _req(
        country="VN",
        currency="VND",
        monthly_income=15_000_000,
        savings_goal=50_000_000,
        deadline=date(2027, 1, 1),
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.total_essentials == VN_ESSENTIALS_TOTAL
    assert plan.monthly_savings > 0
    # capacity = 15M - 9.3M = 5.7M; target ≈ 50M / 12.17 ≈ 4.11M → well under capacity
    assert plan.monthly_savings < 15_000_000 - VN_ESSENTIALS_TOTAL
    assert plan.on_track is True


def test_unknown_country_falls_back_to_us():
    """Documented behavior: unknown country codes fall back to US essentials."""
    today = date(2026, 1, 1)
    req = _req(
        country="XX",                     # not in countries.json
        deadline=date(2027, 1, 1),
    )
    plan = calculate_plan(req, today=today)

    assert plan.total_essentials == US_ESSENTIALS_TOTAL


# ---------------------------------------------------------------------------
# Math sanity
# ---------------------------------------------------------------------------

def test_daily_and_weekly_budget_are_consistent_with_monthly():
    """daily * 30 == monthly, weekly * WEEKS_PER_MONTH == monthly — no drift between rate conversions."""
    today = date(2026, 1, 1)
    req = _req(
        monthly_income=4000,
        savings_goal=6000,
        deadline=date(2027, 1, 1),
    )
    plan = calculate_plan(req, today=today)

    assert abs(plan.daily_budget * DAYS_PER_MONTH - plan.monthly_budget) < 0.01
    assert abs(plan.weekly_budget * WEEKS_PER_MONTH - plan.monthly_budget) < 0.01


def test_projected_date_matches_months_to_goal():
    """Construct a case where months_to_goal is a known integer, then assert the date math."""
    today = date(2026, 1, 1)
    # income 3250, essentials 2250, no recurring → capacity 1000/mo
    # goal 3000 over 3 months → target = 1000/mo = capacity → months_to_goal = 3
    req = _req(
        monthly_income=US_ESSENTIALS_TOTAL + 1000,
        recurring=[],
        savings_goal=3000,
        deadline=today + timedelta(days=90),
        current_savings=0,
    )
    plan = calculate_plan(req, today=today)

    assert plan.months_to_goal == 3
    assert plan.projected_date == today + timedelta(days=90)
    assert plan.on_track is True
