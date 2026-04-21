import pytest

from app.countries.data import get_essentials, list_countries

ESSENTIAL_KEYS = {"housing", "food", "utilities", "transport"}


def test_get_essentials_vn_returns_four_keys():
    result = get_essentials("VN")
    assert set(result.keys()) == ESSENTIAL_KEYS


def test_get_essentials_case_insensitive():
    assert get_essentials("us") == get_essentials("US")


def test_get_essentials_unknown_code_raises():
    with pytest.raises(ValueError, match="Unknown country code"):
        get_essentials("ZZ")


def test_get_essentials_city_tier():
    national = get_essentials("US")
    nyc = get_essentials("US", city="NYC")
    assert set(nyc.keys()) == ESSENTIAL_KEYS
    assert nyc["housing"] > national["housing"]


def test_get_essentials_unknown_city_falls_back_to_national():
    national = get_essentials("US")
    result = get_essentials("US", city="NOWHERE")
    assert result == national


def test_list_countries_includes_cities():
    countries = list_countries()
    us = next(c for c in countries if c["code"] == "US")
    assert "cities" in us
    city_codes = [c["code"] for c in us["cities"]]
    assert "NYC" in city_codes


def test_all_countries_have_four_essential_keys():
    countries = list_countries()
    for country in countries:
        essentials = get_essentials(country["code"])
        assert set(essentials.keys()) == ESSENTIAL_KEYS, f"Failed for {country['code']}"
