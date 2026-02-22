from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..auth import require_auth
from ..database import get_db
from ..models import Ingredient, MenuSlot, Recipe, RecipeIngredient, WeeklyMenu
from ..schemas import (
    ClearConfirmation,
    DataExport,
    DataExportIngredient,
    DataExportRecipe,
    DataExportRecipeIngredient,
    DataImportResult,
)

router = APIRouter(prefix="/api/data", tags=["data"], dependencies=[Depends(require_auth)])


@router.get("/export", response_model=DataExport)
def export_data(db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).order_by(Ingredient.name).all()
    recipes = (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .order_by(Recipe.name)
        .all()
    )

    return DataExport(
        version=1,
        ingredients=[
            DataExportIngredient(
                name=ing.name,
                category=ing.category,
                perishability=ing.perishability,
            )
            for ing in ingredients
        ],
        recipes=[
            DataExportRecipe(
                name=r.name,
                description=r.description,
                servings=r.servings,
                prep_time_minutes=r.prep_time_minutes,
                cook_time_minutes=r.cook_time_minutes,
                instructions=r.instructions,
                tags=r.tags,
                source_url=r.source_url,
                freezable=r.freezable,
                ingredients=[
                    DataExportRecipeIngredient(
                        ingredient_name=ri.ingredient.name,
                        amount=float(ri.amount),
                        unit=ri.unit,
                    )
                    for ri in r.ingredients
                ],
            )
            for r in recipes
        ],
    )


@router.post("/import", response_model=DataImportResult)
def import_data(body: DataExport, db: Session = Depends(get_db)):
    ingredients_created = 0
    ingredients_updated = 0

    for ing_data in body.ingredients:
        existing = db.query(Ingredient).filter(Ingredient.name.ilike(ing_data.name)).first()
        if existing:
            existing.category = ing_data.category
            existing.perishability = ing_data.perishability
            ingredients_updated += 1
        else:
            db.add(
                Ingredient(
                    name=ing_data.name,
                    category=ing_data.category,
                    perishability=ing_data.perishability,
                )
            )
            ingredients_created += 1

    db.flush()

    # Build name->id lookup
    all_ingredients = db.query(Ingredient).all()
    name_to_id = {ing.name.lower(): ing.id for ing in all_ingredients}

    recipes_created = 0
    for recipe_data in body.recipes:
        recipe = Recipe(
            name=recipe_data.name,
            description=recipe_data.description,
            servings=recipe_data.servings,
            prep_time_minutes=recipe_data.prep_time_minutes,
            cook_time_minutes=recipe_data.cook_time_minutes,
            instructions=recipe_data.instructions,
            tags=recipe_data.tags,
            source_url=recipe_data.source_url,
            freezable=recipe_data.freezable,
        )
        db.add(recipe)
        db.flush()

        for ri_data in recipe_data.ingredients:
            ingredient_id = name_to_id.get(ri_data.ingredient_name.lower())
            if ingredient_id is None:
                continue
            db.add(
                RecipeIngredient(
                    recipe_id=recipe.id,
                    ingredient_id=ingredient_id,
                    amount=ri_data.amount,
                    unit=ri_data.unit,
                )
            )
        recipes_created += 1

    db.commit()

    return DataImportResult(
        ingredients_created=ingredients_created,
        ingredients_updated=ingredients_updated,
        recipes_created=recipes_created,
    )


@router.post("/clear")
def clear_all_data(body: ClearConfirmation, db: Session = Depends(get_db)):
    if body.confirmation != "yes I'm sure":
        raise HTTPException(status_code=400, detail="Confirmation text does not match")

    db.query(MenuSlot).delete()
    db.query(WeeklyMenu).delete()
    db.query(RecipeIngredient).delete()
    db.query(Recipe).delete()
    db.query(Ingredient).delete()
    db.commit()

    return {"status": "ok"}
