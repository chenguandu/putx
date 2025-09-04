from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(
    prefix="/user-website-orders",
    tags=["user-website-orders"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.UserWebsiteOrderResponse, status_code=status.HTTP_201_CREATED)
def create_user_website_order(order: schemas.UserWebsiteOrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """创建用户特定的网站排序"""
    # 确保用户只能为自己创建排序
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能为自己创建网站排序"
        )
    
    # 检查网站是否存在
    website = db.query(models.Website).filter(models.Website.id == order.website_id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Website not found")
    
    # 检查是否已存在该用户对该网站的排序，如果存在则更新
    existing_order = db.query(models.UserWebsiteOrder).filter(
        models.UserWebsiteOrder.user_id == order.user_id,
        models.UserWebsiteOrder.website_id == order.website_id
    ).first()
    
    if existing_order:
        existing_order.position = order.position
        db.commit()
        db.refresh(existing_order)
        return existing_order
    
    # 创建新的排序记录
    db_order = models.UserWebsiteOrder(**order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[schemas.UserWebsiteOrderResponse])
def read_user_website_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """获取当前用户的网站排序列表"""
    orders = db.query(models.UserWebsiteOrder).filter(models.UserWebsiteOrder.user_id == current_user.id).all()
    return orders

@router.put("/batch", response_model=List[schemas.UserWebsiteOrderResponse])
def update_user_website_orders_batch(orders: List[schemas.UserWebsiteOrderCreate], db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """批量更新用户网站排序（用于拖拽排序后保存）"""
    result = []
    
    for order in orders:
        # 确保用户只能为自己更新排序
        if order.user_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只能为自己更新网站排序"
            )
        
        # 检查网站是否存在
        website = db.query(models.Website).filter(models.Website.id == order.website_id).first()
        if not website:
            raise HTTPException(status_code=404, detail=f"Website ID {order.website_id} not found")
        
        # 检查是否已存在该用户对该网站的排序，如果存在则更新，否则创建
        existing_order = db.query(models.UserWebsiteOrder).filter(
            models.UserWebsiteOrder.user_id == order.user_id,
            models.UserWebsiteOrder.website_id == order.website_id
        ).first()
        
        if existing_order:
            existing_order.position = order.position
            db.commit()
            db.refresh(existing_order)
            result.append(existing_order)
        else:
            db_order = models.UserWebsiteOrder(**order.dict())
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
            result.append(db_order)
    
    return result

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_website_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """删除用户网站排序"""
    db_order = db.query(models.UserWebsiteOrder).filter(models.UserWebsiteOrder.id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 确保用户只能删除自己的排序
    if db_order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能删除自己的网站排序"
        )
    
    db.delete(db_order)
    db.commit()
    return None