import sqlite3
import os
import sys

# 获取项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
sys.path.append(project_root)

# 导入数据库配置
from database import SQLALCHEMY_DATABASE_URL

# 添加用户登录尝试次数和锁定时间字段的SQL语句
ADD_LOGIN_ATTEMPTS_FIELDS = """
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP DEFAULT NULL;
"""

def run_migration():
    """执行数据库迁移，添加用户登录尝试次数和锁定时间字段"""
    try:
        # 从SQLALCHEMY_DATABASE_URL中提取数据库路径
        db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 如果字段不存在，则添加
        if 'login_attempts' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0")
            print("添加 login_attempts 字段成功")
        else:
            print("login_attempts 字段已存在")
            
        if 'locked_until' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN locked_until TIMESTAMP DEFAULT NULL")
            print("添加 locked_until 字段成功")
        else:
            print("locked_until 字段已存在")
        
        # 提交事务
        conn.commit()
        
        print("用户登录尝试字段添加成功！")
        
    except Exception as e:
        print(f"迁移失败: {e}")
        conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()