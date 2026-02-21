"""Seed common ingredients

Revision ID: 002
Revises: 001
Create Date: 2026-02-21
"""

import sqlalchemy as sa

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

ingredients_table = sa.table(
    "ingredients",
    sa.column("name", sa.Text),
    sa.column("category", sa.Text),
    sa.column("perishability", sa.Text),
)

SEED_INGREDIENTS = [
    # Produce
    ("tomato", "produce", "perishable"),
    ("onion", "produce", "semi-perishable"),
    ("garlic", "produce", "semi-perishable"),
    ("potato", "produce", "semi-perishable"),
    ("carrot", "produce", "semi-perishable"),
    ("bell pepper", "produce", "perishable"),
    ("zucchini", "produce", "perishable"),
    ("spinach", "produce", "perishable"),
    ("lettuce", "produce", "perishable"),
    ("cucumber", "produce", "perishable"),
    ("mushroom", "produce", "perishable"),
    ("broccoli", "produce", "perishable"),
    ("cauliflower", "produce", "perishable"),
    ("celery", "produce", "perishable"),
    ("leek", "produce", "perishable"),
    ("cabbage", "produce", "semi-perishable"),
    ("eggplant", "produce", "perishable"),
    ("green beans", "produce", "perishable"),
    ("avocado", "produce", "perishable"),
    ("lemon", "produce", "semi-perishable"),
    ("lime", "produce", "semi-perishable"),
    ("ginger", "produce", "semi-perishable"),
    ("fresh basil", "produce", "perishable"),
    ("fresh parsley", "produce", "perishable"),
    ("fresh cilantro", "produce", "perishable"),
    # Meat
    ("chicken breast", "meat", "perishable"),
    ("chicken thigh", "meat", "perishable"),
    ("ground beef", "meat", "perishable"),
    ("beef steak", "meat", "perishable"),
    ("pork chop", "meat", "perishable"),
    ("pork tenderloin", "meat", "perishable"),
    ("ground pork", "meat", "perishable"),
    ("bacon", "meat", "perishable"),
    ("sausage", "meat", "perishable"),
    ("salmon fillet", "meat", "perishable"),
    ("shrimp", "meat", "perishable"),
    ("cod fillet", "meat", "perishable"),
    # Dairy
    ("milk", "dairy", "perishable"),
    ("butter", "dairy", "semi-perishable"),
    ("heavy cream", "dairy", "perishable"),
    ("sour cream", "dairy", "perishable"),
    ("cream cheese", "dairy", "perishable"),
    ("cheddar cheese", "dairy", "semi-perishable"),
    ("parmesan cheese", "dairy", "semi-perishable"),
    ("mozzarella cheese", "dairy", "perishable"),
    ("egg", "dairy", "semi-perishable"),
    ("yogurt", "dairy", "perishable"),
    # Pantry
    ("olive oil", "pantry", "shelf-stable"),
    ("vegetable oil", "pantry", "shelf-stable"),
    ("soy sauce", "pantry", "shelf-stable"),
    ("rice", "pantry", "shelf-stable"),
    ("pasta", "pantry", "shelf-stable"),
    ("flour", "pantry", "shelf-stable"),
    ("sugar", "pantry", "shelf-stable"),
    ("canned tomatoes", "pantry", "shelf-stable"),
    ("tomato paste", "pantry", "shelf-stable"),
    ("chicken broth", "pantry", "shelf-stable"),
    ("beef broth", "pantry", "shelf-stable"),
    ("coconut milk", "pantry", "shelf-stable"),
    ("bread", "pantry", "semi-perishable"),
    ("tortilla", "pantry", "semi-perishable"),
    ("panko breadcrumbs", "pantry", "shelf-stable"),
    ("vinegar", "pantry", "shelf-stable"),
    ("balsamic vinegar", "pantry", "shelf-stable"),
    ("honey", "pantry", "shelf-stable"),
    ("mustard", "pantry", "shelf-stable"),
    ("mayonnaise", "pantry", "semi-perishable"),
    ("ketchup", "pantry", "shelf-stable"),
    ("hot sauce", "pantry", "shelf-stable"),
    ("worcestershire sauce", "pantry", "shelf-stable"),
    ("canned beans", "pantry", "shelf-stable"),
    ("lentils", "pantry", "shelf-stable"),
    ("chickpeas", "pantry", "shelf-stable"),
    ("peanut butter", "pantry", "shelf-stable"),
    # Frozen
    ("frozen peas", "frozen", "frozen"),
    ("frozen corn", "frozen", "frozen"),
    ("frozen mixed vegetables", "frozen", "frozen"),
    ("frozen spinach", "frozen", "frozen"),
    # Spices
    ("salt", "spice", "shelf-stable"),
    ("black pepper", "spice", "shelf-stable"),
    ("paprika", "spice", "shelf-stable"),
    ("cumin", "spice", "shelf-stable"),
    ("oregano", "spice", "shelf-stable"),
    ("thyme", "spice", "shelf-stable"),
    ("rosemary", "spice", "shelf-stable"),
    ("chili flakes", "spice", "shelf-stable"),
    ("cinnamon", "spice", "shelf-stable"),
    ("nutmeg", "spice", "shelf-stable"),
    ("bay leaf", "spice", "shelf-stable"),
    ("turmeric", "spice", "shelf-stable"),
    ("coriander", "spice", "shelf-stable"),
    ("smoked paprika", "spice", "shelf-stable"),
    ("garlic powder", "spice", "shelf-stable"),
    ("onion powder", "spice", "shelf-stable"),
    ("italian seasoning", "spice", "shelf-stable"),
    ("curry powder", "spice", "shelf-stable"),
]


def upgrade() -> None:
    op.bulk_insert(
        ingredients_table,
        [
            {"name": name, "category": category, "perishability": perishability}
            for name, category, perishability in SEED_INGREDIENTS
        ],
    )


def downgrade() -> None:
    names = [name for name, _, _ in SEED_INGREDIENTS]
    op.execute(ingredients_table.delete().where(ingredients_table.c.name.in_(names)))
