from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import require_auth
from ..database import get_db
from ..models import Ingredient, RecipeIngredient
from ..schemas import IngredientCreate, IngredientOut, IngredientUpdate, IngredientWithUsageOut

router = APIRouter(
    prefix="/api/ingredients", tags=["ingredients"], dependencies=[Depends(require_auth)]
)


@router.get("", response_model=list[IngredientWithUsageOut])
def list_ingredients(
    search: str | None = Query(None),
    category: str | None = Query(None),
    db: Session = Depends(get_db),
):
    recipe_count = func.count(func.distinct(RecipeIngredient.recipe_id))
    q = (
        db.query(Ingredient, recipe_count)
        .outerjoin(RecipeIngredient, Ingredient.id == RecipeIngredient.ingredient_id)
        .group_by(Ingredient.id)
    )
    if search:
        q = q.filter(Ingredient.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(Ingredient.category == category)
    rows = q.order_by(Ingredient.name).all()
    return [
        IngredientWithUsageOut(
            id=ing.id,
            name=ing.name,
            category=ing.category,
            perishability=ing.perishability,
            recipe_count=count,
        )
        for ing, count in rows
    ]


@router.post("", response_model=IngredientOut, status_code=201)
def create_ingredient(body: IngredientCreate, db: Session = Depends(get_db)):
    existing = db.query(Ingredient).filter(Ingredient.name.ilike(body.name)).first()
    if existing:
        return existing
    ingredient = Ingredient(**body.model_dump())
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(ingredient_id: int, body: IngredientUpdate, db: Session = Depends(get_db)):
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(ingredient, key, value)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}", status_code=204)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    usage = (
        db.query(RecipeIngredient).filter(RecipeIngredient.ingredient_id == ingredient_id).count()
    )
    if usage > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete ingredient that is used in recipes",
        )
    db.delete(ingredient)
    db.commit()
