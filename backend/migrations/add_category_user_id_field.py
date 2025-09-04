from sqlalchemy import Column, Integer, ForeignKey
from alembic import op
import sqlalchemy as sa


def upgrade():
    # 添加user_id字段到categories表
    op.add_column('categories', Column('user_id', Integer, ForeignKey('users.id'), nullable=True))
    # 移除name的唯一约束
    op.drop_constraint('categories_name_key', 'categories', type_='unique')


def downgrade():
    # 恢复name的唯一约束
    op.create_unique_constraint('categories_name_key', 'categories', ['name'])
    # 删除user_id字段
    op.drop_column('categories', 'user_id')