from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from datetime import datetime

# 用户网站排序相关模型
class UserWebsiteOrderBase(BaseModel):
    """用户网站排序基础模型"""
    user_id: int
    website_id: int
    position: int

class UserWebsiteOrderCreate(UserWebsiteOrderBase):
    """创建用户网站排序的请求模型"""
    pass

class UserWebsiteOrderUpdate(BaseModel):
    """更新用户网站排序的请求模型"""
    position: Optional[int] = None

class UserWebsiteOrderResponse(UserWebsiteOrderBase):
    """用户网站排序响应模型"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 分类相关模型
class CategoryBase(BaseModel):
    """分类基础模型"""
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True
    user_id: Optional[int] = None

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
    user_id: Optional[int] = None

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
    public: Optional[bool] = False
    user_id: Optional[int] = None  # 创建者ID

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
    public: Optional[bool] = None
    user_id: Optional[int] = None

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
    """Token数据模型"""
    username: Optional[str] = None

# 用户Token相关模型
class UserTokenBase(BaseModel):
    """用户Token基础模型"""
    device_info: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

class UserTokenCreate(UserTokenBase):
    """创建用户Token的请求模型"""
    user_id: int
    token: str
    expires_at: Optional[datetime] = None

class UserTokenUpdate(BaseModel):
    """更新用户Token的请求模型"""
    last_used_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class UserTokenResponse(UserTokenBase):
    """用户Token响应模型"""
    id: int
    user_id: int
    token: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: datetime
    is_active: bool
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class OnlineUserResponse(BaseModel):
    """在线用户响应模型"""
    user_id: int
    username: str
    email: str
    tokens: List[UserTokenResponse]
    
    class Config:
        from_attributes = True