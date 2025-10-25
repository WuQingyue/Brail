"""
产品相关API接口
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from models.category import Category
from utils.database import get_db

router = APIRouter()


@router.get("/categories")
async def categories(db: Session = Depends(get_db)):
    """
    获取所有产品类别
    
    Returns:
        list: 包含所有类别的列表，每个类别包含 id, name, description, icon 字段
    
    Example:
        GET /api/product/categories
        
        Response:
        [
            {
                "id": "MLB5672",
                "name": "汽车配件",
                "description": null,
                "icon": "🚗"
            },
            ...
        ]
    """
    try:
        # 查询所有类别
        categories = db.query(Category).order_by(Category.name).all()
        
        # 转换为字典列表
        result = []
        for category in categories:
            result.append({
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "icon": category.icon
            })
        
        print(f"✅ 成功获取 {len(result)} 个产品类别")
        return {
            "success": True,
            "count": len(result),
            "categories": result
        }
        
    except Exception as e:
        print(f"❌ 获取产品类别失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取产品类别失败: {str(e)}"
        )

