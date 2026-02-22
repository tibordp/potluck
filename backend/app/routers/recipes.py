from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..auth import require_auth
from ..database import get_db
from ..models import Recipe, RecipeIngredient
from ..schemas import RecipeCreate, RecipeOut, RecipeSummary, RecipeUpdate

router = APIRouter(prefix="/api/recipes", tags=["recipes"], dependencies=[Depends(require_auth)])


@router.get("", response_model=list[RecipeSummary])
def list_recipes(
    search: str | None = Query(None),
    tag: str | None = Query(None),
    ingredient_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Recipe)
    if search:
        q = q.filter(Recipe.name.ilike(f"%{search}%"))
    if tag:
        q = q.filter(Recipe.tags.any(tag))
    if ingredient_id:
        q = q.filter(Recipe.ingredients.any(RecipeIngredient.ingredient_id == ingredient_id))
    return q.order_by(Recipe.created_at.desc()).all()


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.post("", response_model=RecipeOut, status_code=201)
def create_recipe(body: RecipeCreate, db: Session = Depends(get_db)):
    data = body.model_dump(exclude={"ingredients"})
    recipe = Recipe(**data)
    db.add(recipe)
    db.flush()

    for ing in body.ingredients:
        ri = RecipeIngredient(recipe_id=recipe.id, **ing.model_dump())
        db.add(ri)

    db.commit()

    return (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe.id)
        .first()
    )


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: int, body: RecipeUpdate, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    data = body.model_dump(exclude_unset=True, exclude={"ingredients"})
    for key, value in data.items():
        setattr(recipe, key, value)

    if body.ingredients is not None:
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        for ing in body.ingredients:
            ri = RecipeIngredient(recipe_id=recipe_id, **ing.model_dump())
            db.add(ri)

    db.commit()

    return (
        db.query(Recipe)
        .options(joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient))
        .filter(Recipe.id == recipe_id)
        .first()
    )


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
