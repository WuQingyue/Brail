"""
产品相关API接口
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from models.category import Category
from models.product import Product
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


@router.get("/categories/{category_id}")
async def get_category_products(
    category_id: str,
    db: Session = Depends(get_db)
    ):
    """
    根据类别ID获取该类别下的所有产品
    
    路径参数:
        category_id (str): 类别ID（必填）
    
    Returns:
        dict: 包含成功状态、产品数量和产品列表
    
    Example:
        GET /api/product/categories/MLB5672
        
        Response:
        {
            "success": true,
            "code": 200,
            "count": 15,
            "category_id": "MLB5672",
            "category_name": "汽车配件",
            "products": [
                {
                    "id": "MLB123456",
                    "title": "产品标题",
                    "description": "产品描述",
                    "img": "图片URL",
                    "selling_price": 99.99,
                    "discount_price": 89.99,
                    "stock_quantity": 100,
                    "moq": 1,
                    ...
                },
                ...
            ]
        }
    """
    try:
        # 打印接收到的类别ID
        print(f"接收到的类别ID: {category_id}")
        
        # 验证类别ID不为空
        if not category_id or not category_id.strip():
            raise HTTPException(
                status_code=400,
                detail="类别ID不能为空"
            )
        
        category_id = category_id.strip()
        
        # 验证类别是否存在
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=404,
                detail=f"类别 {category_id} 不存在"
            )
        
        # 查询该类别下的所有产品（不使用分页）
        products = db.query(Product).filter(
            Product.category_id == category_id
        ).order_by(Product.created_at.desc()).all()
        
        # 转换为字典列表
        result = []
        for product in products:
            result.append({
                "id": product.id,
                "title": product.title,
                "description": product.description,
                "img": product.img,
                "product_mlb_thumbnail": product.product_mlb_thumbnail,
                "category_id": product.category_id,
                "supplier_id": product.supplier_id,
                "shipping_from": product.shipping_from,
                "weight": product.weight,
                "dimensions": product.dimensions,
                "moq": product.moq,
                "tags": product.tags,
                "stock_quantity": product.stock_quantity,
                "reserved_quantity": product.reserved_quantity,
                "low_stock_threshold": product.low_stock_threshold,
                "max_order_quantity": product.max_order_quantity,
                "cost_price": product.cost_price,
                "selling_price": product.selling_price,
                "discount_price": product.discount_price,
                "product_mlb_price": product.product_mlb_price,
                "roi": product.roi,
                "created_at": product.created_at.isoformat() if product.created_at else None,
                "updated_at": product.updated_at.isoformat() if product.updated_at else None
            })
        
        print(f"✅ 成功获取类别 {category_id} 下的 {len(result)} 个产品")
        
        return {
            "success": True,
            "code": 200,
            "count": len(result),
            "category_id": category_id,
            "category_name": category.name,
            "products": result
        }
        
    except HTTPException as he:
        # 重新抛出HTTP异常
        raise he
    except Exception as e:
        print(f"❌ 获取类别产品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取类别产品失败: {str(e)}"
        )

