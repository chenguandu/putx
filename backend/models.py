from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class UserWebsiteOrder(Base):
    """用户特定的网站排序数据模型"""
    __tablename__ = "user_website_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    website_id = Column(Integer, ForeignKey("websites.id"), nullable=False)
    position = Column(Integer, default=0)  # 用户自定义的排序位置
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关联的用户和网站
    user = relationship("User", backref="website_orders")
    website = relationship("Website", backref="user_orders")

class Category(Base):
    """网站分类数据模型"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)  # 是否激活
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 添加用户关联
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 创建者ID
    user = relationship("User", backref="categories")
    
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
    public = Column(Boolean, default=False)  # 是否公开
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 关联的分类
    category_rel = relationship("Category", back_populates="websites")
    
    # 添加用户关联
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 创建者ID
    user = relationship("User", backref="websites")

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

class UserToken(Base):
    """用户token数据模型"""
    __tablename__ = "user_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    device_info = Column(String, nullable=True)  # 设备信息
    user_agent = Column(String, nullable=True)  # 浏览器信息
    ip_address = Column(String, nullable=True)  # IP地址
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # 过期时间
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())  # 最后使用时间
    is_active = Column(Boolean, default=True)  # 是否激活
    
    # 关联用户
    user = relationship("User", backref="tokens")