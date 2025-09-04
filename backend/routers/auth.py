from fastapi import APIRouter, Depends, HTTPException, status, Request
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

@router.post("/token")
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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
    
    # 创建持久化token
    persistent_token = auth.create_persistent_token(db, user.id, request)
    
    # 生成短期JWT令牌（用于兼容性）
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": persistent_token.token,  # 返回持久化token
        "jwt_token": jwt_token,  # 可选的JWT token
        "token_type": "bearer",
        "expires_at": persistent_token.expires_at.isoformat(),
        "device_info": persistent_token.device_info,
        "message": "Login successful!"
    }

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    """获取当前登录用户信息"""
    return current_user

@router.get("/my-sessions", response_model=list[schemas.UserTokenResponse])
def get_my_sessions(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    """获取当前用户的所有登录会话"""
    # 清理过期token
    auth.cleanup_expired_tokens(db)
    
    # 获取用户的活跃token
    tokens = db.query(models.UserToken).filter(
        models.UserToken.user_id == current_user.id,
        models.UserToken.is_active == True,
        models.UserToken.expires_at > datetime.utcnow()
    ).order_by(models.UserToken.last_used_at.desc()).all()
    
    return tokens

@router.get("/online-users", response_model=list[schemas.OnlineUserResponse])
def get_online_users(current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(get_db)):
    """管理员获取所有在线用户信息"""
    # 清理过期token
    auth.cleanup_expired_tokens(db)
    
    # 获取所有有活跃token的用户
    users_with_tokens = db.query(models.User).join(models.UserToken).filter(
        models.UserToken.is_active == True,
        models.UserToken.expires_at > datetime.utcnow()
    ).distinct().all()
    
    result = []
    for user in users_with_tokens:
        # 获取用户的活跃token
        active_tokens = db.query(models.UserToken).filter(
            models.UserToken.user_id == user.id,
            models.UserToken.is_active == True,
            models.UserToken.expires_at > datetime.utcnow()
        ).order_by(models.UserToken.last_used_at.desc()).all()
        
        result.append({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "tokens": active_tokens
        })
    
    return result

@router.post("/logout")
def logout(request: Request, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    """用户退出登录"""
    # 获取当前请求的token
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        
        # 首先尝试撤销持久化token
        persistent_token = db.query(models.UserToken).filter(
            models.UserToken.token == token,
            models.UserToken.is_active == True
        ).first()
        
        if persistent_token:
            # 如果是持久化token，直接撤销
            auth.revoke_token(db, token)
        else:
            # 如果不是持久化token，说明是JWT token
            # JWT token是无状态的，我们需要撤销该用户的所有持久化token
            # 或者可以选择只撤销当前会话相关的token
            # 这里我们撤销该用户最近使用的token
            recent_token = db.query(models.UserToken).filter(
                models.UserToken.user_id == current_user.id,
                models.UserToken.is_active == True
            ).order_by(models.UserToken.last_used_at.desc()).first()
            
            if recent_token:
                auth.revoke_token(db, recent_token.token)
        
        return {"message": "退出登录成功"}
    
    # 如果没有Authorization header，但用户已经通过认证，说明可能是其他方式的认证
    # 我们仍然可以撤销该用户的活跃token
    recent_token = db.query(models.UserToken).filter(
        models.UserToken.user_id == current_user.id,
        models.UserToken.is_active == True
    ).order_by(models.UserToken.last_used_at.desc()).first()
    
    if recent_token:
        auth.revoke_token(db, recent_token.token)
        return {"message": "退出登录成功"}
    
    return {"message": "未找到有效的token"}

@router.post("/logout-all")
def logout_all(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    """用户退出所有设备的登录"""
    auth.revoke_user_tokens(db, current_user.id)
    return {"message": "已退出所有设备的登录"}

@router.post("/revoke-token/{token_id}")
def revoke_user_token(token_id: int, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    """用户撤销自己的指定token"""
    # 查找token
    token = db.query(models.UserToken).filter(
        models.UserToken.id == token_id,
        models.UserToken.user_id == current_user.id,
        models.UserToken.is_active == True
    ).first()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token不存在或已失效"
        )
    
    # 撤销token
    token.is_active = False
    db.commit()
    
    return {"message": "设备已下线"}

@router.post("/admin/revoke-token/{token_id}")
def admin_revoke_token(token_id: int, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(get_db)):
    """管理员撤销任意用户的指定token"""
    # 查找token
    token = db.query(models.UserToken).filter(
        models.UserToken.id == token_id,
        models.UserToken.is_active == True
    ).first()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token不存在或已失效"
        )
    
    # 撤销token
    token.is_active = False
    db.commit()
    
    return {"message": f"已强制用户 {token.user.username} 的设备下线"}

@router.post("/admin/revoke-user-tokens/{user_id}")
def admin_revoke_user_tokens(user_id: int, current_user: models.User = Depends(auth.get_current_admin_user), db: Session = Depends(get_db)):
    """管理员撤销指定用户的所有token"""
    # 检查用户是否存在
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 撤销用户所有token
    auth.revoke_user_tokens(db, user_id)
    
    return {"message": f"已强制用户 {user.username} 的所有设备下线"}