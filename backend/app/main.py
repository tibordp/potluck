from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, import_recipe, ingredients, menus, recipes, shopping

app = FastAPI(title="Potluck")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ingredients.router)
app.include_router(recipes.router)
app.include_router(import_recipe.router)
app.include_router(menus.router)
app.include_router(shopping.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
