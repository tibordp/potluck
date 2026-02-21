import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import require_auth
from ..database import get_db
from ..models import MenuSlot, Recipe, RecipeIngredient, WeeklyMenu
from ..schemas import MenuGenerateRequest, MenuOut, MenuSlotUpdate
from ..services.menu_planner import generate_menu

router = APIRouter(prefix="/api/menus", tags=["menus"], dependencies=[Depends(require_auth)])

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MEALS = ["dinner"]


def _load_menu(db: Session, menu_id: int) -> WeeklyMenu:
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
    return menu


@router.post("/generate", response_model=MenuOut, status_code=201)
def generate_weekly_menu(body: MenuGenerateRequest, db: Session = Depends(get_db)):
    recipes = generate_menu(db, num_slots=7)
    if not recipes:
        raise HTTPException(status_code=400, detail="No recipes in database")

    menu = WeeklyMenu(week_start=body.week_start, servings=body.servings)
    db.add(menu)
    db.flush()

    idx = 0
    for day in range(7):
        for meal in MEALS:
            slot = MenuSlot(
                menu_id=menu.id,
                day=day,
                meal=meal,
                recipe_id=recipes[idx].id,
            )
            db.add(slot)
            idx += 1

    db.commit()
    return _load_menu(db, menu.id)


@router.get("/current", response_model=MenuOut | None)
def get_current_menu(db: Session = Depends(get_db)):
    menu = db.query(WeeklyMenu).order_by(WeeklyMenu.created_at.desc()).first()
    if not menu:
        return None
    return _load_menu(db, menu.id)


@router.get("/{menu_id}", response_model=MenuOut)
def get_menu(menu_id: int, db: Session = Depends(get_db)):
    return _load_menu(db, menu_id)


@router.put("/{menu_id}/slots/{slot_id}", response_model=MenuOut)
def update_slot(
    menu_id: int,
    slot_id: int,
    body: MenuSlotUpdate,
    db: Session = Depends(get_db),
):
    slot = db.query(MenuSlot).filter(MenuSlot.id == slot_id, MenuSlot.menu_id == menu_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if body.reroll:
        # Pick a random recipe different from current
        recipes = db.query(Recipe).filter(Recipe.id != slot.recipe_id).all()
        if recipes:
            slot.recipe_id = random.choice(recipes).id
    elif body.recipe_id is not None:
        slot.recipe_id = body.recipe_id

    if "servings_override" in body.model_fields_set:
        slot.servings_override = body.servings_override

    db.commit()
    return _load_menu(db, menu_id)
