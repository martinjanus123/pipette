"""create baseline tables

Revision ID: 0001_create_baseline_tables
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_create_baseline_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_applications_name"), "applications", ["name"], unique=False)

    op.create_table(
        "pipette_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_pipette_types_name"), "pipette_types", ["name"], unique=False)

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_rooms_name"), "rooms", ["name"], unique=False)

    op.create_table(
        "uses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_uses_name"), "uses", ["name"], unique=False)

    op.create_table(
        "pipettes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("register_number", sa.Integer(), nullable=False),
        sa.Column("inventory_number", sa.String(length=80), nullable=False),
        sa.Column("serial_number", sa.String(length=120), nullable=False),
        sa.Column("manufacturer", sa.String(length=120), nullable=False),
        sa.Column("model_name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.String(length=320), nullable=False),
        sa.Column("channel_count", sa.Integer(), nullable=False),
        sa.Column("use_id", sa.Integer(), nullable=False),
        sa.Column("pipette_type_id", sa.Integer(), nullable=False),
        sa.Column("nominal_volume_ul", sa.Float(), nullable=False),
        sa.Column("calibration_interval_months", sa.Integer(), nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.ForeignKeyConstraint(["pipette_type_id"], ["pipette_types.id"]),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"]),
        sa.ForeignKeyConstraint(["use_id"], ["uses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("inventory_number"),
        sa.UniqueConstraint("register_number"),
        sa.UniqueConstraint("serial_number"),
    )
    op.create_index(op.f("ix_pipettes_inventory_number"), "pipettes", ["inventory_number"], unique=False)
    op.create_index(op.f("ix_pipettes_register_number"), "pipettes", ["register_number"], unique=False)
    op.create_index(op.f("ix_pipettes_serial_number"), "pipettes", ["serial_number"], unique=False)

    op.create_table(
        "calibrations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pipette_id", sa.Integer(), nullable=False),
        sa.Column("calibration_date", sa.Date(), nullable=False),
        sa.Column("next_due_date", sa.Date(), nullable=False),
        sa.Column("result", sa.String(length=80), nullable=True),
        sa.Column("performed_by", sa.String(length=120), nullable=True),
        sa.Column("certificate_reference", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["pipette_id"], ["pipettes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "pipette_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pipette_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["pipette_id"], ["pipettes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("pipette_events")
    op.drop_table("calibrations")
    op.drop_index(op.f("ix_pipettes_serial_number"), table_name="pipettes")
    op.drop_index(op.f("ix_pipettes_register_number"), table_name="pipettes")
    op.drop_index(op.f("ix_pipettes_inventory_number"), table_name="pipettes")
    op.drop_table("pipettes")
    op.drop_index(op.f("ix_uses_name"), table_name="uses")
    op.drop_table("uses")
    op.drop_index(op.f("ix_rooms_name"), table_name="rooms")
    op.drop_table("rooms")
    op.drop_index(op.f("ix_pipette_types_name"), table_name="pipette_types")
    op.drop_table("pipette_types")
    op.drop_index(op.f("ix_applications_name"), table_name="applications")
    op.drop_table("applications")
