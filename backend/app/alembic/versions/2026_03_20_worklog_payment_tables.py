"""Add worklog payment tables

Revision ID: 2026_03_20_worklog_payment
Revises: d98dd8ec85a3
Create Date: 2026-03-20

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '2026_03_20_worklog_pay'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "freelancer",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hourly_rate", sa.Float(), nullable=False, server_default="0.0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_freelancer_name", "freelancer", ["name"])
    op.create_index("ix_freelancer_email", "freelancer", ["email"])

    op.create_table(
        "worklog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("task_name", sa.String(), nullable=False),
        sa.Column("freelancer_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.ForeignKeyConstraint(["freelancer_id"], ["freelancer.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_worklog_freelancer_id", "worklog", ["freelancer_id"])
    op.create_index("ix_worklog_created_at", "worklog", ["created_at"])
    op.create_index("ix_worklog_status", "worklog", ["status"])

    op.create_table(
        "timeentry",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("worklog_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("hours", sa.Float(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["worklog_id"], ["worklog.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_timeentry_worklog_id", "timeentry", ["worklog_id"])
    op.create_index("ix_timeentry_entry_date", "timeentry", ["entry_date"])

    op.create_table(
        "payment",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("worklog_ids_json", sa.String(), nullable=False, server_default="[]"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_created_at", "payment", ["created_at"])


def downgrade():
    op.drop_table("payment")
    op.drop_index("ix_timeentry_entry_date", table_name="timeentry")
    op.drop_index("ix_timeentry_worklog_id", table_name="timeentry")
    op.drop_table("timeentry")
    op.drop_index("ix_worklog_status", table_name="worklog")
    op.drop_index("ix_worklog_created_at", table_name="worklog")
    op.drop_index("ix_worklog_freelancer_id", table_name="worklog")
    op.drop_table("worklog")
    op.drop_index("ix_freelancer_email", table_name="freelancer")
    op.drop_index("ix_freelancer_name", table_name="freelancer")
    op.drop_table("freelancer")
