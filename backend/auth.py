from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import and_

from . import models, schemas
from .database import get_db

# 密钥和算法配置
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # 生产环境中应使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 密码上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 密码Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# 可选的OAuth2 Bearer，允许没有token的请求
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

# 验证密码
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 获取密码哈希
def get_password_hash(password):
    return pwd_context.hash(password)

# 获取用户
def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

# 认证用户
def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    
    # 检查账户是否被锁定
    if user.locked_until:
        # 如果锁定时间已过，但login_attempts仍然大于等于5，重置login_attempts
        if user.locked_until <= datetime.utcnow() and user.login_attempts >= 5:
            user.login_attempts = 0
            user.locked_until = None
            db.commit()
            print(f'锁定时间已过，重置用户 {username} 的登录尝试次数')
        # 如果锁定时间未过，返回特殊值以便API可以提供适当的错误消息
        elif user.locked_until > datetime.utcnow():
            return "locked"
    
    # 验证密码
    if not verify_password(password, user.hashed_password):
        # 密码错误，增加失败次数
        user.login_attempts += 1
        
        # 如果失败次数达到5次，锁定账户1小时
        if user.login_attempts >= 5:
            # 设置锁定时间为当前时间加1小时
            lock_time = datetime.utcnow() + timedelta(hours=1)
            print(f'设置锁定时间: {lock_time}')
            user.locked_until = lock_time
            
        db.commit()
        return False
    
    # 密码正确，重置失败次数和锁定时间
    user.login_attempts = 0
    user.locked_until = None
    db.commit()
    
    return user

# 创建访问令牌
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 生成持久化token
def generate_persistent_token():
    """生成一个安全的持久化token"""
    return secrets.token_urlsafe(64)

# 创建持久化token记录
def create_persistent_token(db: Session, user_id: int, request: Request = None, expires_days: int = 30):
    """创建持久化token记录"""
    token = generate_persistent_token()
    expires_at = datetime.utcnow() + timedelta(days=expires_days)
    
    # 获取设备信息
    user_agent = request.headers.get("user-agent", "") if request else ""
    ip_address = request.client.host if request else ""
    
    # 简单的设备信息提取
    device_info = extract_device_info(user_agent)
    
    db_token = models.UserToken(
        user_id=user_id,
        token=token,
        device_info=device_info,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at,
        is_active=True
    )
    
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    
    return db_token

# 提取设备信息
def extract_device_info(user_agent: str) -> str:
    """从User-Agent中提取设备信息"""
    if not user_agent:
        return "Unknown Device"
    
    user_agent_lower = user_agent.lower()
    
    # 检测操作系统
    if "windows" in user_agent_lower:
        os_info = "Windows"
    elif "macintosh" in user_agent_lower or "mac os" in user_agent_lower:
        os_info = "macOS"
    elif "linux" in user_agent_lower:
        os_info = "Linux"
    elif "android" in user_agent_lower:
        os_info = "Android"
    elif "iphone" in user_agent_lower or "ipad" in user_agent_lower:
        os_info = "iOS"
    else:
        os_info = "Unknown OS"
    
    # 检测浏览器
    if "chrome" in user_agent_lower and "edg" not in user_agent_lower:
        browser = "Chrome"
    elif "firefox" in user_agent_lower:
        browser = "Firefox"
    elif "safari" in user_agent_lower and "chrome" not in user_agent_lower:
        browser = "Safari"
    elif "edg" in user_agent_lower:
        browser = "Edge"
    else:
        browser = "Unknown Browser"
    
    return f"{browser} on {os_info}"

# 验证持久化token
def verify_persistent_token(db: Session, token: str) -> Optional[models.User]:
    """验证持久化token并返回用户"""
    db_token = db.query(models.UserToken).filter(
        and_(
            models.UserToken.token == token,
            models.UserToken.is_active == True,
            models.UserToken.expires_at > datetime.utcnow()
        )
    ).first()
    
    if not db_token:
        return None
    
    # 更新最后使用时间
    db_token.last_used_at = datetime.utcnow()
    db.commit()
    
    return db_token.user

# 删除用户的所有token
def revoke_user_tokens(db: Session, user_id: int):
    """撤销用户的所有token"""
    db.query(models.UserToken).filter(
        models.UserToken.user_id == user_id
    ).update({"is_active": False})
    db.commit()

# 删除特定token
def revoke_token(db: Session, token: str):
    """撤销特定token"""
    db.query(models.UserToken).filter(
        models.UserToken.token == token
    ).update({"is_active": False})
    db.commit()

# 清理过期token
def cleanup_expired_tokens(db: Session):
    """清理过期的token"""
    db.query(models.UserToken).filter(
        models.UserToken.expires_at < datetime.utcnow()
    ).update({"is_active": False})
    db.commit()

# 获取当前用户
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 首先尝试验证持久化token
    user = verify_persistent_token(db, token)
    if user:
        return user
    
    # 如果持久化token验证失败，尝试JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# 可选的用户认证，允许未登录用户访问
async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if token is None:
        return None
    
    # 首先尝试验证持久化token
    user = verify_persistent_token(db, token)
    if user:
        return user
    
    # 如果持久化token验证失败，尝试JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = schemas.TokenData(username=username)
        user = get_user(db, username=token_data.username)
        return user
    except JWTError:
        return None

# 获取当前活跃用户
async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已禁用")
    return current_user

# 获取当前管理员用户
async def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要管理员权限"
        )
    return current_user