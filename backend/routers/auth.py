from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import math

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={401: {"description": "Unauthorized"}},
)

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """注册新用户"""
    # 检查用户名是否已存在
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
        )
    
    # 检查邮箱是否已存在
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 创建新用户
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=False  # 默认非管理员
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f'用户登录: username: {form_data.username}')
    """用户登录获取令牌"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    
    # 处理账户锁定情况
    if user == "locked":
        # 获取用户以查询锁定时间
        db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
        if db_user and db_user.locked_until:
            # 计算剩余锁定时间
            remaining_time = db_user.locked_until - datetime.utcnow()
            print(f'locked_until: {db_user.locked_until}, current: {datetime.utcnow()}')
            print(f'remaining_time: {remaining_time.total_seconds()}')
            # 使用math.ceil向上取整，确保即使不足一分钟也显示为1分钟
            minutes = math.ceil(remaining_time.total_seconds() / 60)
            print(f'lock minutes: {minutes}')
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"账户已被锁定，请在{minutes}分钟后重试",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # 处理用户名或密码错误情况
    if not user:
        # 获取用户以检查登录尝试次数
        db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
        if db_user:
            # 如果用户存在，显示剩余尝试次数
            remaining_attempts = 5 - db_user.login_attempts
            if remaining_attempts > 0:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"密码错误，还有{remaining_attempts}次尝试机会",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="密码错误次数过多，账户已被锁定1小时",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            # 如果用户不存在，显示通用错误消息
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    """获取当前登录用户信息"""
    return current_user