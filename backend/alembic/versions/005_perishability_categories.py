"""Update perishability categories to time-based values

Revision ID: 005
Revises: 004
Create Date: 2026-02-21
"""

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

FORWARD_MAP = {
    "perishable": "few-days",
    "semi-perishable": "one-week",
    "frozen": "long-lasting",
    "shelf-stable": "long-lasting",
}

REVERSE_MAP = {
    "few-days": "perishable",
    "one-week": "semi-perishable",
    "two-weeks": "semi-perishable",
    "one-month": "shelf-stable",
    "long-lasting": "shelf-stable",
}


def upgrade() -> None:
    for old, new in FORWARD_MAP.items():
        op.execute(f"UPDATE ingredients SET perishability = '{new}' WHERE perishability = '{old}'")


def downgrade() -> None:
    for new, old in REVERSE_MAP.items():
        op.execute(f"UPDATE ingredients SET perishability = '{old}' WHERE perishability = '{new}'")
