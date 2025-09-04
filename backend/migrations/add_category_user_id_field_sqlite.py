import sqlite3
import os
import sys

# 获取项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
sys.path.append(project_root)

# 导入数据库配置
from database import SQLALCHEMY_DATABASE_URL

def run_migration():
    """执行数据库迁移，添加user_id字段到categories表"""
    try:
        # 从SQLALCHEMY_DATABASE_URL中提取数据库路径
        db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(categories)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 如果字段不存在，则添加
        if 'user_id' not in columns:
            cursor.execute("ALTER TABLE categories ADD COLUMN user_id INTEGER DEFAULT NULL REFERENCES users(id)")
            print("添加 user_id 字段到 categories 表成功")
        else:
            print("user_id 字段已存在于 categories 表中")
        
        # 检查并移除name字段的唯一约束（如果存在）
        # SQLite不支持直接删除约束，但我们可以检查索引
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='categories' AND name LIKE '%name%'")
        name_indexes = cursor.fetchall()
        
        if name_indexes:
            print(f"发现name字段相关索引: {[idx[0] for idx in name_indexes]}")
            # 注意：SQLite中删除唯一约束需要重建表，这里我们先跳过这一步
            print("注意：SQLite中移除唯一约束需要重建表，暂时跳过此步骤")
        
        # 提交事务
        conn.commit()
        
        print("categories表user_id字段添加成功！")
        
    except Exception as e:
        print(f"迁移失败: {e}")
        conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()