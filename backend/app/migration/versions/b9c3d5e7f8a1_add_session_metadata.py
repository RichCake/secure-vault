"""add session metadata

Revision ID: b9c3d5e7f8a1
Revises: a8a088a2a068
Create Date: 2025-12-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9c3d5e7f8a1'
down_revision: Union[str, Sequence[str], None] = 'a8a088a2a068'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user_agent, ip_address, last_active_at to sessions table."""
    op.add_column('sessions', sa.Column('user_agent', sa.String(length=512), nullable=True))
    op.add_column('sessions', sa.Column('ip_address', sa.String(length=45), nullable=True))
    op.add_column('sessions', sa.Column('last_active_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False))


def downgrade() -> None:
    """Remove session metadata columns."""
    op.drop_column('sessions', 'last_active_at')
    op.drop_column('sessions', 'ip_address')
    op.drop_column('sessions', 'user_agent')

