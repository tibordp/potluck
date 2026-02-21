import random

from sqlalchemy.orm import Session, joinedload

from ..models import Recipe, RecipeIngredient

PERISHABILITY_ORDER = {
    "few-days": 0,
    "one-week": 1,
    "two-weeks": 2,
    "one-month": 3,
    "long-lasting": 4,
}


def _recipe_perishability_score(recipe: Recipe) -> int:
    """Lower score = more perishable (should be earlier in the week)."""
    if recipe.freezable:
        return 4
    if not recipe.ingredients:
        return 4
    return min(PERISHABILITY_ORDER.get(ri.ingredient.perishability, 4) for ri in recipe.ingredients)


def generate_menu(db: Session, num_slots: int = 7) -> list[Recipe]:
    recipes = (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .all()
    )
    if not recipes:
        return []

    # Pick recipes, avoiding repeats if possible
    if len(recipes) >= num_slots:
        selected = random.sample(recipes, num_slots)
    else:
        selected = list(recipes)
        while len(selected) < num_slots:
            selected.append(random.choice(recipes))
        random.shuffle(selected)

    # Sort by perishability: most perishable first (Monday)
    selected.sort(key=_recipe_perishability_score)

    # Within same perishability tier, shuffle for variety
    tiers: dict[int, list[Recipe]] = {}
    for r in selected:
        score = _recipe_perishability_score(r)
        tiers.setdefault(score, []).append(r)

    result = []
    for score in sorted(tiers.keys()):
        tier = tiers[score]
        random.shuffle(tier)
        result.extend(tier)

    return result
