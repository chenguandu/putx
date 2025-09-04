from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

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

# 获取当前用户
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
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