from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend import models, schemas, auth
from backend.database import get_db

router = APIRouter(
    prefix="/websites",
    tags=["websites"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.WebsiteResponse, status_code=status.HTTP_201_CREATED)
def create_website(website: schemas.WebsiteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """创建新网站"""
    db_website = models.Website(**website.dict())
    db.add(db_website)
    db.commit()
    db.refresh(db_website)
    return db_website

@router.get("/", response_model=List[schemas.WebsiteResponse])
def read_websites(
    skip: int = 0, 
    limit: int = 100, 
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """获取网站列表，支持分页和过滤"""
    query = db.query(models.Website)
    
    # 应用过滤条件
    if category:
        query = query.filter(models.Website.category == category)
    if is_active is not None:
        query = query.filter(models.Website.is_active == is_active)
    
    # 按位置排序
    query = query.order_by(models.Website.position)
    
    # 应用分页
    websites = query.offset(skip).limit(limit).all()
    return websites

@router.get("/{website_id}", response_model=schemas.WebsiteResponse)
def read_website(website_id: int, db: Session = Depends(get_db)):
    """获取单个网站详情"""
    db_website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if db_website is None:
        raise HTTPException(status_code=404, detail="Website not found")
    return db_website

@router.put("/{website_id}", response_model=schemas.WebsiteResponse)
def update_website(website_id: int, website: schemas.WebsiteUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """更新网站信息"""
    db_website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if db_website is None:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # 更新非空字段
    update_data = website.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_website, key, value)
    
    db.commit()
    db.refresh(db_website)
    return db_website

@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(website_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """删除网站"""
    db_website = db.query(models.Website).filter(models.Website.id == website_id).first()
    if db_website is None:
        raise HTTPException(status_code=404, detail="Website not found")
    
    db.delete(db_website)
    db.commit()
    return None