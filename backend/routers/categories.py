from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """创建新分类"""
    # 检查分类名称是否已存在（对于当前用户或管理员）
    if current_user.is_admin:
        # 管理员检查全局唯一性
        existing_category = db.query(models.Category).filter(models.Category.name == category.name).first()
    else:
        # 普通用户只检查自己创建的分类
        existing_category = db.query(models.Category).filter(
            models.Category.name == category.name,
            models.Category.user_id == current_user.id
        ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类名称已存在"
        )
    
    # 设置创建者ID
    category_data = category.dict()
    category_data["user_id"] = current_user.id
    
    db_category = models.Category(**category_data)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[schemas.CategoryResponse])
def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    """获取分类列表，支持分页和过滤"""
    query = db.query(models.Category)
    
    # 应用过滤条件
    if is_active is not None:
        query = query.filter(models.Category.is_active == is_active)
    
    # 权限控制：普通用户只能看到自己创建的分类
    if current_user and not current_user.is_admin:
        query = query.filter(models.Category.user_id == current_user.id)
    
    # 按名称排序
    query = query.order_by(models.Category.name)
    
    # 应用分页
    categories = query.offset(skip).limit(limit).all()
    return categories

@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def read_category(category_id: int, db: Session = Depends(get_db)):
    """获取单个分类详情"""
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, category: schemas.CategoryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """更新分类信息"""
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # 权限检查：普通用户只能更新自己创建的分类
    if not current_user.is_admin and db_category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能更新自己创建的分类"
        )
    
    # 如果更新了名称，检查名称是否已存在
    if category.name and category.name != db_category.name:
        if current_user.is_admin:
            # 管理员检查全局唯一性
            existing_category = db.query(models.Category).filter(models.Category.name == category.name).first()
        else:
            # 普通用户只检查自己创建的分类
            existing_category = db.query(models.Category).filter(
                models.Category.name == category.name,
                models.Category.user_id == current_user.id
            ).first()
            
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="分类名称已存在"
            )
    
    # 更新非空字段
    update_data = category.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """删除分类"""
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # 权限检查：普通用户只能删除自己创建的分类
    if not current_user.is_admin and db_category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，只能删除自己创建的分类"
        )
    
    # 检查是否有网站使用此分类
    if current_user.is_admin:
        # 管理员检查所有网站
        websites_with_category = db.query(models.Website).filter(models.Website.category_id == category_id).count()
    else:
        # 普通用户只检查自己的网站
        websites_with_category = db.query(models.Website).filter(
            models.Website.category_id == category_id,
            models.Website.user_id == current_user.id
        ).count()
        
    if websites_with_category > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法删除此分类，有{websites_with_category}个网站正在使用"
        )
    
    db.delete(db_category)
    db.commit()
    return None