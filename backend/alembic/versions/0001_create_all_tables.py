"""Initial migration: create all tables.

Revision ID: 0001_create_all_tables
Revises:
Create Date: 2026-05-27 00:00:00.000000
"""

from typing import Final

import sqlalchemy as sa

from alembic import op

revision: Final[str] = "0001_create_all_tables"
down_revision: Final[str | None] = None
branch_labels: Final[tuple[str] | None] = None
depends_on: Final[tuple[str] | None] = None

# ruff: noqa: E501


def upgrade() -> None:
    op.create_table(
        "pipette_types",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "uses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "pipettes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("register_number", sa.Integer(), nullable=False),
        sa.Column("inventory_number", sa.String(length=255), nullable=False),
        sa.Column("serial_number", sa.String(length=255), nullable=False, unique=True),
        sa.Column("manufacturer", sa.String(length=255), nullable=False),
        sa.Column("model_name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("channel_count", sa.Integer(), nullable=False),
        sa.Column("use_id", sa.Integer(), nullable=False),
        sa.Column("pipette_type_id", sa.Integer(), nullable=False),
        sa.Column("nominal_volume_ul", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("calibration_interval_months", sa.Integer(), nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'active'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("register_number"),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], name="fk_pipettes_application"),
        sa.ForeignKeyConstraint(["pipette_type_id"], ["pipette_types.id"], name="fk_pipettes_pipette_type"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], name="fk_pipettes_room"),
        sa.ForeignKeyConstraint(["use_id"], ["uses.id"], name="fk_pipettes_use"),
    )
    op.create_table(
        "calibrations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pipette_id", sa.Integer(), nullable=False),
        sa.Column("calibration_date", sa.Date(), nullable=False),
        sa.Column("next_due_date", sa.Date(), nullable=False),
        sa.Column("result", sa.String(length=100), nullable=True),
        sa.Column("performed_by", sa.String(length=255), nullable=True),
        sa.Column("certificate_reference", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["pipette_id"], ["pipettes.id"],
            name="fk_calibrations_pipette",
            ondelete="CASCADE",
        ),
    )
    op.create_table(
        "pipette_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pipette_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("old_value", sa.String(length=500), nullable=True),
        sa.Column("new_value", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["pipette_id"], ["pipettes.id"],
            name="fk_pipette_events_pipette",
            ondelete="CASCADE",
        ),
    )


def downgrade() -> None:
    op.drop_table("pipette_events")
    op.drop_table("calibrations")
    op.drop_table("pipettes")
    op.drop_table("applications")
    op.drop_table("pipette_types")
    op.drop_table("rooms")
    op.drop_table("uses")
