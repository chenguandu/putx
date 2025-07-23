import sqlite3
import os
import sys

# 获取项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
sys.path.append(project_root)

# 导入数据库配置
from database import SQLALCHEMY_DATABASE_URL

# 创建用户表的SQL语句
CREATE_USERS_TABLE = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_admin BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

def run_migration():
    """执行数据库迁移，创建用户表"""
    try:
        # 从SQLALCHEMY_DATABASE_URL中提取数据库路径
        db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 执行创建用户表的SQL语句
        cursor.execute(CREATE_USERS_TABLE)
        
        # 提交事务
        conn.commit()
        
        print("用户表创建成功！")
        
    except Exception as e:
        print(f"迁移失败: {e}")
        conn.rollback()
        raise
    finally:
        # 关闭数据库连接
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()