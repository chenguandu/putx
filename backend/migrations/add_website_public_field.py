from sqlalchemy import Column, Boolean
from alembic import op
import sqlalchemy as sa


def upgrade():
    # 添加public字段到websites表
    op.add_column('websites', Column('public', Boolean, nullable=False, server_default='false'))


def downgrade():
    # 删除public字段
    op.drop_column('websites', 'public')