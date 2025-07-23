from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from datetime import datetime

# 分类相关模型
class CategoryBase(BaseModel):
    """分类基础模型"""
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    """创建分类的请求模型"""
    pass

class CategoryUpdate(BaseModel):
    """更新分类的请求模型"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryResponse(CategoryBase):
    """分类响应模型"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 网站相关模型
class WebsiteBase(BaseModel):
    """网站基础模型"""
    name: str
    url: str
    description: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None  # 向后兼容
    category_id: Optional[int] = None  # 新增分类ID字段
    position: Optional[int] = 0
    is_active: Optional[bool] = True

class WebsiteCreate(WebsiteBase):
    """创建网站的请求模型"""
    pass

class WebsiteUpdate(BaseModel):
    """更新网站的请求模型"""
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[int] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None

class WebsiteResponse(WebsiteBase):
    """网站响应模型"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category_rel: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

# 用户相关模型
class UserBase(BaseModel):
    """用户基础模型"""
    username: str
    email: EmailStr

class UserCreate(UserBase):
    """创建用户的请求模型"""
    password: str

class UserUpdate(BaseModel):
    """更新用户的请求模型"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    """令牌模型"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """令牌数据模型"""
    username: Optional[str] = None