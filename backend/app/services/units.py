"""Unit normalization and conversion for ingredient amounts.

Canonical units: 'g' (mass), 'ml' (volume). Unknown units pass through unchanged.
"""

# Alias → (canonical_unit, multiplier)
UNIT_ALIASES: dict[str, tuple[str, float]] = {
    # Mass → grams
    "g": ("g", 1.0),
    "gram": ("g", 1.0),
    "grams": ("g", 1.0),
    "kg": ("g", 1000.0),
    "kilogram": ("g", 1000.0),
    "kilograms": ("g", 1000.0),
    "oz": ("g", 28.35),
    "ounce": ("g", 28.35),
    "ounces": ("g", 28.35),
    "lb": ("g", 453.592),
    "lbs": ("g", 453.592),
    "pound": ("g", 453.592),
    "pounds": ("g", 453.592),
    # Volume → milliliters
    "ml": ("ml", 1.0),
    "milliliter": ("ml", 1.0),
    "milliliters": ("ml", 1.0),
    "l": ("ml", 1000.0),
    "liter": ("ml", 1000.0),
    "liters": ("ml", 1000.0),
    "litre": ("ml", 1000.0),
    "litres": ("ml", 1000.0),
    "cup": ("ml", 236.588),
    "cups": ("ml", 236.588),
    "tbsp": ("ml", 14.787),
    "tablespoon": ("ml", 14.787),
    "tablespoons": ("ml", 14.787),
    "tsp": ("ml", 4.929),
    "teaspoon": ("ml", 4.929),
    "teaspoons": ("ml", 4.929),
    "fl oz": ("ml", 29.574),
    "fluid ounce": ("ml", 29.574),
    "fluid ounces": ("ml", 29.574),
}


def normalize(amount: float, unit: str) -> tuple[float, str]:
    """Convert amount+unit to canonical form (g or ml). Unknown units pass through."""
    key = unit.strip().lower()
    if key in UNIT_ALIASES:
        canonical, multiplier = UNIT_ALIASES[key]
        return amount * multiplier, canonical
    return amount, unit


def to_display(amount: float, canonical_unit: str, system: str = "metric") -> tuple[float, str]:
    """Convert canonical amount to human-friendly display unit.

    system: "metric" or "imperial"
    """
    if canonical_unit == "g":
        if system == "imperial":
            oz = amount / 28.35
            if oz >= 16:
                return round(oz / 16, 2), "lb"
            return round(oz, 2), "oz"
        else:
            if amount >= 1000:
                return round(amount / 1000, 2), "kg"
            return round(amount, 1), "g"

    if canonical_unit == "ml":
        if system == "imperial":
            fl_oz = amount / 29.574
            if fl_oz >= 8:
                return round(fl_oz / 8, 2), "cup"
            return round(fl_oz, 2), "fl oz"
        else:
            if amount >= 1000:
                return round(amount / 1000, 2), "l"
            return round(amount, 1), "ml"

    # Unknown canonical unit — pass through
    return round(amount, 2), canonical_unit
