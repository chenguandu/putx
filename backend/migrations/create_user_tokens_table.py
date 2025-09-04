import sqlite3
from datetime import datetime

def create_user_tokens_table(db_path):
    """
    创建用户token表，用于存储用户登录token和设备信息
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 创建user_tokens表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            device_info TEXT,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建索引以提高查询性能
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_tokens(token)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_tokens_active ON user_tokens(is_active)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_tokens_expires ON user_tokens(expires_at)')
    
    conn.commit()
    conn.close()
    print("User tokens table created successfully")

if __name__ == "__main__":
    create_user_tokens_table("website_manager.db")