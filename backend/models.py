from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class Category(Base):
    """网站分类数据模型"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)  # 是否激活
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关联的网站
    websites = relationship("Website", back_populates="category_rel")

class Website(Base):
    """网站数据模型"""
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # 图标URL或Base64
    category = Column(String, nullable=True)  # 分类名称（向后兼容）
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # 分类ID
    position = Column(Integer, default=0)  # 显示位置
    is_active = Column(Boolean, default=True)  # 是否激活
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关联的分类
    category_rel = relationship("Category", back_populates="websites")

class User(Base):
    """用户数据模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    login_attempts = Column(Integer, default=0)  # 登录失败次数
    locked_until = Column(DateTime(timezone=True), nullable=True)  # 账户锁定时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())