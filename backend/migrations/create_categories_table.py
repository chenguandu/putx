import sqlite3
import os
import sys

# 获取项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
sys.path.append(project_root)

# 导入数据库配置
from database import SQLALCHEMY_DATABASE_URL

# 创建分类表的SQL语句
CREATE_CATEGORIES_TABLE = """
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def run_migration():
    """执行数据库迁移，创建分类表"""
    try:
        # 从SQLALCHEMY_DATABASE_URL中提取数据库路径
        db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查表是否已存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # 创建分类表
            cursor.execute(CREATE_CATEGORIES_TABLE)
            print("创建 categories 表成功")
        else:
            print("categories 表已存在")
        
        # 提交事务
        conn.commit()
        
        print("分类表创建成功！")
    except Exception as e:
        print(f"创建分类表失败: {e}")
        raise