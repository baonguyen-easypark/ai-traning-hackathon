"""Owner: Person 3 (API & Persistence).

TODO: run Base.metadata.create_all(engine) on app startup, then wire these into routes.py.
"""
from sqlalchemy import JSON, Column, Date, Float, Integer, String

from app.db.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True)
    country = Column(String, nullable=False)
    currency = Column(String, nullable=False)
    monthly_income = Column(Float, nullable=False)
    savings_goal = Column(Float, nullable=False)
    deadline = Column(Date, nullable=False)
    current_savings = Column(Float, default=0.0)
    recurring = Column(JSON, default=list)
