import sqlite3
import os
import sys

# 获取项目根目录
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
sys.path.append(project_root)

# 导入数据库配置
from database import SQLALCHEMY_DATABASE_URL

# 添加网站分类ID字段的SQL语句
ADD_CATEGORY_ID_FIELD = """
ALTER TABLE websites ADD COLUMN category_id INTEGER DEFAULT NULL REFERENCES categories(id);
"""

def run_migration():
    """执行数据库迁移，添加网站分类ID字段"""
    try:
        # 从SQLALCHEMY_DATABASE_URL中提取数据库路径
        db_path = SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')
        
        # 连接到SQLite数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(websites)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # 如果字段不存在，则添加
        if 'category_id' not in columns:
            cursor.execute("ALTER TABLE websites ADD COLUMN category_id INTEGER DEFAULT NULL REFERENCES categories(id)")
            print("添加 category_id 字段成功")
            
            # 尝试从现有的category文本字段中提取分类信息并关联到新创建的分类
            cursor.execute("SELECT DISTINCT category FROM websites WHERE category IS NOT NULL AND category != ''")
            distinct_categories = cursor.fetchall()
            
            # 为每个不同的分类创建一个分类记录（如果不存在）
            for category in distinct_categories:
                category_name = category[0]
                # 检查分类是否已存在
                cursor.execute("SELECT id FROM categories WHERE name = ?", (category_name,))
                category_record = cursor.fetchone()
                
                if not category_record:
                    # 创建新分类
                    cursor.execute(
                        "INSERT INTO categories (name, is_active) VALUES (?, 1)", 
                        (category_name,)
                    )
                    category_id = cursor.lastrowid
                    print(f"创建分类: {category_name}, ID: {category_id}")
                else:
                    category_id = category_record[0]
                    print(f"使用现有分类: {category_name}, ID: {category_id}")
                
                # 更新网站记录，设置category_id
                cursor.execute(
                    "UPDATE websites SET category_id = ? WHERE category = ?", 
                    (category_id, category_name)
                )
                print(f"更新了 {cursor.rowcount} 个网站的分类ID")
        else:
            print("category_id 字段已存在")
        
        # 提交事务
        conn.commit()
        
        print("网站分类ID字段添加成功！")
    except Exception as e:
        print(f"添加网站分类ID字段失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()