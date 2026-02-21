from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..auth import require_auth
from ..database import get_db
from ..models import MenuSlot, Recipe, RecipeIngredient, WeeklyMenu
from ..schemas import IngredientOut, ShoppingItem, ShoppingList
from ..services.units import normalize, to_display

router = APIRouter(prefix="/api/menus", tags=["shopping"], dependencies=[Depends(require_auth)])


@router.get("/{menu_id}/shopping-list", response_model=ShoppingList)
def get_shopping_list(
    menu_id: int,
    unit_system: str = Query("metric"),
    db: Session = Depends(get_db),
):
    menu = (
        db.query(WeeklyMenu)
        .options(
            joinedload(WeeklyMenu.slots)
            .joinedload(MenuSlot.recipe)
            .joinedload(Recipe.ingredients)
            .joinedload(RecipeIngredient.ingredient)
        )
        .filter(WeeklyMenu.id == menu_id)
        .first()
    )
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")

    # Aggregate ingredients, normalizing units before keying
    aggregated: dict[tuple[int, str], dict] = {}
    for slot in menu.slots:
        recipe = slot.recipe
        scale = menu.servings / recipe.servings if recipe.servings else 1

        for ri in recipe.ingredients:
            norm_amount, norm_unit = normalize(float(ri.amount) * scale, ri.unit)
            key = (ri.ingredient_id, norm_unit)
            if key not in aggregated:
                aggregated[key] = {
                    "ingredient": ri.ingredient,
                    "total_amount": 0.0,
                    "unit": norm_unit,
                }
            aggregated[key]["total_amount"] += norm_amount

    # Convert to display units for the requested system
    items = []
    for v in aggregated.values():
        display_amount, display_unit = to_display(v["total_amount"], v["unit"], unit_system)
        items.append(
            ShoppingItem(
                ingredient=IngredientOut.model_validate(v["ingredient"]),
                total_amount=display_amount,
                unit=display_unit,
            )
        )

    # Sort by category then name
    items.sort(key=lambda x: (x.ingredient.category, x.ingredient.name))

    return ShoppingList(menu_id=menu_id, items=items)
