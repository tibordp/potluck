"""Add servings_override to menu_slots

Revision ID: 006
Revises: 005
Create Date: 2026-02-21
"""

import sqlalchemy as sa

from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "menu_slots",
        sa.Column("servings_override", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("menu_slots", "servings_override")
