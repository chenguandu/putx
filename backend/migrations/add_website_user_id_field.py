from sqlalchemy import Column, Integer, ForeignKey
from alembic import op
import sqlalchemy as sa


def upgrade():
    # 添加user_id字段到websites表
    op.add_column('websites', Column('user_id', Integer, ForeignKey('users.id'), nullable=True))


def downgrade():
    # 删除user_id字段
    op.drop_column('websites', 'user_id')