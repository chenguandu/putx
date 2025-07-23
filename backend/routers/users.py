from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend import models, schemas, auth
from backend.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
    dependencies=[Depends(auth.get_current_admin_user)],  # 所有用户管理接口都需要管理员权限
)

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """获取用户列表，仅管理员可访问"""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """获取单个用户详情，仅管理员可访问"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int, 
    user: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """更新用户信息，仅管理员可访问"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 更新非空字段
    update_data = user.dict(exclude_unset=True)
    
    # 如果更新密码，需要哈希处理
    if "password" in update_data:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))
    
    # 防止将 admin 账号设置为非活跃状态
    if "is_active" in update_data and update_data["is_active"] is False and db_user.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不允许将管理员账号(admin)设置为禁用状态"
        )
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """删除用户，仅管理员可访问"""
    # 防止删除自己
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除当前登录的用户"
        )
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 防止删除admin账号
    if db_user.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不允许删除管理员账号(admin)"
        )
    
    db.delete(db_user)
    db.commit()
    return None