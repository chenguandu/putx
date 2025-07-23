#!/usr/bin/env python

"""
初始化管理员用户的脚本
运行此脚本将创建一个管理员用户
"""

import os
import sys
import getpass
from sqlalchemy.orm import Session

# 添加项目根目录到Python路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

# 导入项目模块
from backend.database import SessionLocal, engine, Base
from backend.models import User
from backend.auth import get_password_hash

def create_admin_user():
    """创建管理员用户"""
    # 确保数据库表存在
    Base.metadata.create_all(bind=engine)
    
    # 创建数据库会话
    db = SessionLocal()
    
    try:
        # 检查是否已存在管理员用户
        admin_exists = db.query(User).filter(User.is_admin == True).first()
        if admin_exists:
            print(f"已存在管理员用户: {admin_exists.username}")
            choice = input("是否创建新的管理员用户？(y/n): ")
            if choice.lower() != 'y':
                print("操作已取消")
                return
        
        # 获取用户输入
        username = input("请输入管理员用户名: ")
        email = input("请输入管理员邮箱: ")
        password = getpass.getpass("请输入管理员密码: ")
        password_confirm = getpass.getpass("请再次输入密码确认: ")
        
        # 验证输入
        if not username or not email or not password:
            print("用户名、邮箱和密码不能为空")
            return
        
        if password != password_confirm:
            print("两次输入的密码不一致")
            return
        
        # 检查用户名是否已存在
        if db.query(User).filter(User.username == username).first():
            print(f"用户名 '{username}' 已被使用")
            return
        
        # 检查邮箱是否已存在
        if db.query(User).filter(User.email == email).first():
            print(f"邮箱 '{email}' 已被使用")
            return
        
        # 创建管理员用户
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"管理员用户 '{username}' 创建成功！")
    
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()