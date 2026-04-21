"""Owner: Person 2 (Country Data).

Provides baseline monthly cost-of-living per country (housing, food, utilities, transport).

TODO (Person 2):
  - Flesh out countries.json with realistic per-city or per-country numbers.
  - Consider Numbeo or World Bank API integration as a stretch goal (cache responses).
  - Handle unknown country codes with a sensible fallback.
"""
import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent / "countries.json"
_CACHE: dict | None = None


def _load() -> dict:
    global _CACHE
    if _CACHE is None:
        _CACHE = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return _CACHE


def get_essentials(country_code: str) -> dict[str, float]:
    """Monthly essentials (housing/food/utilities/transport) in the country's local currency."""
    data = _load()
    entry = data.get(country_code.upper()) or data["US"]
    return entry["essentials"]


def list_countries() -> list[dict]:
    data = _load()
    return [
        {"code": code, "name": entry["name"], "currency": entry["currency"]}
        for code, entry in data.items()
    ]
