"""Add CASCADE on delete to menu_slots.recipe_id FK

Revision ID: 003
Revises: 002
Create Date: 2026-02-21
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("menu_slots_recipe_id_fkey", "menu_slots", type_="foreignkey")
    op.create_foreign_key(
        "menu_slots_recipe_id_fkey",
        "menu_slots",
        "recipes",
        ["recipe_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("menu_slots_recipe_id_fkey", "menu_slots", type_="foreignkey")
    op.create_foreign_key(
        "menu_slots_recipe_id_fkey",
        "menu_slots",
        "recipes",
        ["recipe_id"],
        ["id"],
    )
