"""Owner: Person 2 (Country Data).

Provides baseline monthly cost-of-living per country (housing, food, utilities, transport).
Values are sourced from Numbeo (2024) in each country's local currency.
"""
import json
from pathlib import Path
from typing import Optional

_DATA_PATH = Path(__file__).parent / "countries.json"
_CACHE: Optional[dict] = None


def _load() -> dict:
    global _CACHE
    if _CACHE is None:
        _CACHE = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return _CACHE


def get_essentials(country_code: str, city: Optional[str] = None) -> dict[str, float]:
    """Monthly essentials (housing/food/utilities/transport) in the country's local currency.

    Raises ValueError for unknown country codes.
    If city is provided and exists in the country's city tiers, returns city-level data.
    """
    data = _load()
    code = country_code.upper()
    entry = data.get(code)
    if entry is None:
        raise ValueError(f"Unknown country code: {country_code!r}")

    if city:
        city_entry = entry.get("cities", {}).get(city)
        if city_entry:
            return city_entry["essentials"]

    return entry["essentials"]


def list_countries() -> list[dict]:
    data = _load()
    result = []
    for code, entry in data.items():
        item = {"code": code, "name": entry["name"], "currency": entry["currency"]}
        if "cities" in entry:
            item["cities"] = [
                {"code": city_code, "name": city_data["name"]}
                for city_code, city_data in entry["cities"].items()
            ]
        result.append(item)
    return result
