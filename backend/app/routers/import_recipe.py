from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..auth import require_auth
from ..database import get_db
from ..models import Ingredient
from ..schemas import ImportTextRequest, ImportUrlRequest, ParsedRecipe
from ..services.llm import fetch_url_content, parse_recipe_image, parse_recipe_text

router = APIRouter(prefix="/api/import", tags=["import"], dependencies=[Depends(require_auth)])


def _get_existing_ingredient_names(db: Session) -> list[str]:
    return [name for (name,) in db.query(Ingredient.name).order_by(Ingredient.name).all()]


@router.post("/url", response_model=ParsedRecipe)
async def import_from_url(body: ImportUrlRequest, db: Session = Depends(get_db)):
    try:
        html = await fetch_url_content(body.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")

    existing = _get_existing_ingredient_names(db)
    try:
        return await parse_recipe_text(html, existing, source_url=body.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recipe: {e}")


@router.post("/text", response_model=ParsedRecipe)
async def import_from_text(body: ImportTextRequest, db: Session = Depends(get_db)):
    existing = _get_existing_ingredient_names(db)
    try:
        return await parse_recipe_text(body.text, existing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recipe: {e}")


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "image/jpeg",
    "image/png": "image/png",
    "image/gif": "image/gif",
    "image/webp": "image/webp",
}


@router.post("/image", response_model=ParsedRecipe)
async def import_from_image(file: UploadFile, db: Session = Depends(get_db)):
    media_type = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not media_type:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, GIF, or WebP.",
        )

    image_data = await file.read()
    if len(image_data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 20 MB)")

    existing = _get_existing_ingredient_names(db)
    try:
        return await parse_recipe_image(image_data, media_type, existing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse recipe image: {e}")
