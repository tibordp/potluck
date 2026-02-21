from datetime import date, datetime

from pydantic import BaseModel


# --- Ingredients ---
class IngredientBase(BaseModel):
    name: str
    category: str = "other"
    perishability: str = "long-lasting"


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    perishability: str | None = None


class IngredientOut(IngredientBase):
    id: int

    model_config = {"from_attributes": True}


class IngredientWithUsageOut(IngredientOut):
    recipe_count: int = 0


# --- Recipe Ingredients ---
class RecipeIngredientBase(BaseModel):
    ingredient_id: int
    amount: float
    unit: str = "piece"


class RecipeIngredientCreate(RecipeIngredientBase):
    pass


class RecipeIngredientOut(RecipeIngredientBase):
    id: int
    ingredient: IngredientOut

    model_config = {"from_attributes": True}


# --- Recipes ---
class RecipeBase(BaseModel):
    name: str
    description: str | None = None
    servings: int = 4
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str = ""
    tags: list[str] = []
    source_url: str | None = None
    freezable: bool = False


class RecipeCreate(RecipeBase):
    ingredients: list[RecipeIngredientCreate] = []


class RecipeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    servings: int | None = None
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str | None = None
    tags: list[str] | None = None
    source_url: str | None = None
    freezable: bool | None = None
    ingredients: list[RecipeIngredientCreate] | None = None


class RecipeSummary(BaseModel):
    id: int
    name: str
    description: str | None = None
    servings: int
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    tags: list[str] = []
    freezable: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class RecipeOut(RecipeBase):
    id: int
    created_at: datetime
    ingredients: list[RecipeIngredientOut] = []

    model_config = {"from_attributes": True}


# --- Menus ---
class MenuSlotOut(BaseModel):
    id: int
    day: int
    meal: str
    recipe_id: int
    recipe: RecipeSummary

    model_config = {"from_attributes": True}


class MenuOut(BaseModel):
    id: int
    week_start: date
    servings: int
    created_at: datetime
    slots: list[MenuSlotOut] = []

    model_config = {"from_attributes": True}


class MenuGenerateRequest(BaseModel):
    week_start: date
    servings: int = 4


class MenuSlotUpdate(BaseModel):
    recipe_id: int | None = None
    reroll: bool = False


# --- Shopping List ---
class ShoppingItem(BaseModel):
    ingredient: IngredientOut
    total_amount: float
    unit: str


class ShoppingList(BaseModel):
    menu_id: int
    items: list[ShoppingItem] = []


# --- Import ---
class ImportUrlRequest(BaseModel):
    url: str


class ImportTextRequest(BaseModel):
    text: str


class ParsedIngredient(BaseModel):
    name: str
    amount: float
    unit: str
    matched_ingredient_id: int | None = None


class ParsedRecipe(BaseModel):
    name: str
    description: str | None = None
    servings: int = 4
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    instructions: str = ""
    tags: list[str] = []
    source_url: str | None = None
    freezable: bool = False
    ingredients: list[ParsedIngredient] = []


# --- Auth ---
class LoginRequest(BaseModel):
    password: str


class AuthStatus(BaseModel):
    authenticated: bool
