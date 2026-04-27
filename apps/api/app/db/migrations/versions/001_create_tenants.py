"""create tenants table

Revision ID: 001
Revises:
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("subdomain", sa.String(), nullable=False, unique=True),
        sa.Column(
            "plan",
            sa.Enum("GROWTH", "PROFESSIONAL", "ENTERPRISE", name="plan_enum"),
            nullable=False,
        ),
        sa.Column("idp_org_id", sa.String(), nullable=True),
        sa.Column("config", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_tenants_subdomain", "tenants", ["subdomain"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tenants_subdomain", table_name="tenants")
    op.drop_table("tenants")
    op.execute("DROP TYPE IF EXISTS plan_enum")
