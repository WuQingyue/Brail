"""
产品相关API接口
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from models.category import Category
from models.product import Product
from models.supplier import Supplier
from utils.database import get_db
from sqlalchemy import or_

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


@router.post("/get_product")
async def get_product_detail(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    根据产品ID获取产品详细信息
    
    请求体参数:
        product_id (str): 产品ID（必填）
    
    Returns:
        dict: 包含成功状态和产品详细信息
    
    Example:
        POST /api/product/get_product
        
        Request Body:
        {
            "product_id": "MLB123456"
        }
        
        Response:
        {
            "success": true,
            "code": 200,
            "product": {
                "id": "MLB123456",
                "title": "产品标题",
                "description": "产品详细描述",
                "img": "产品图片URL",
                "product_mlb_thumbnail": ["缩略图URL1", "缩略图URL2"],
                "category_id": "MLB5672",
                "supplier_id": "SUP001",
                "shipping_from": "广东省广州市",
                "weight": 2.5,
                "dimensions": {"length": 45, "width": 20, "height": 50},
                "moq": 5,
                "tags": ["标签1", "标签2"],
                "stock_quantity": 150,
                "reserved_quantity": 0,
                "low_stock_threshold": 20,
                "max_order_quantity": 500,
                "cost_price": 25.0,
                "selling_price": 89.9,
                "discount_price": null,
                "product_mlb_price": "R$ 89,90",
                "roi": "112%",
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }
    """
    try:
        # 获取请求体数据
        request_data = await request.json()
        print(f"接收到的请求数据: {request_data}")
        
        # 获取产品ID
        product_id = request_data.get('product_id', '').strip()
        
        # 验证产品ID不为空
        if not product_id:
            raise HTTPException(
                status_code=400,
                detail="缺少必填字段: product_id"
            )
        
        print(f"接收到的产品ID: {product_id}")
        
        # 查询产品详情 
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"产品 {product_id} 不存在"
            )
        
        # 转换为字典  
        result = {
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
            "variations": product.variations,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        }
        
        print(f"✅ 成功获取产品 {product_id} 的详细信息")
        
        return {
            "success": True,
            "code": 200,
            "product": result
        }
        
    except HTTPException as he:
        # 重新抛出HTTP异常
        raise he
    except Exception as e:
        print(f"❌ 获取产品详情失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取产品详情失败: {str(e)}"
        )


@router.post("/search/keyword")
async def search_products(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    根据关键词搜索产品（模糊查询）
    
    请求体参数:
        keyword (str): 搜索关键词（必填）
    
    Returns:
        dict: 包含成功状态和产品列表
    
    Example:
        POST /api/product/search/keyword
        
        Request Body:
        {
            "keyword": "天线"
        }
        
        Response:
        {
            "success": true,
            "code": 200,
            "count": 5,
            "keyword": "天线",
            "products": [
                {
                    "id": "MLB123456",
                    "title": "数字电视天线",
                    "description": "地面数字电视信号放大器",
                    "img": "产品图片URL",
                    "selling_price": 89.9,
                    ...
                },
                ...
            ]
        }
    """
    try:
        # 获取请求体数据
        request_data = await request.json()
        print(f"接收到的搜索请求数据: {request_data}")
        
        # 获取搜索关键词
        keyword = request_data.get('keyword', '').strip()
        
        # 验证关键词不为空
        if not keyword:
            raise HTTPException(
                status_code=400,
                detail="缺少必填字段: keyword"
            )
        
        print(f"接收到的搜索关键词: {keyword}")
        
        # 在 products 表的 title 字段中进行模糊查询
        # 使用 LIKE 查询实现模糊匹配
        products = db.query(Product).filter(
            Product.title.like(f'%{keyword}%')
        ).order_by(Product.created_at.desc()).all()
        
        # 转换为字典列表
        result = []
        for product in products:
            # 获取类别名称
            category = db.query(Category).filter(Category.id == product.category_id).first()
            result.append({
                "id": product.id,
                "title": product.title,
                "description": product.description,
                "img": product.img,
                "product_mlb_thumbnail": product.product_mlb_thumbnail,
                "category_id": product.category_id,
                "category_name": category.name if category else None,
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
        
        print(f"✅ 搜索关键词 '{keyword}' 找到 {len(result)} 个产品")
        
        return {
            "success": True,
            "code": 200,
            "count": len(result),
            "keyword": keyword,
            "products": result
        }
        
    except HTTPException as he:
        # 重新抛出HTTP异常
        raise he
    except Exception as e:
        print(f"❌ 搜索产品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"搜索产品失败: {str(e)}"
        )


@router.post("/create")
async def create_product(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    创建新产品
    
    请求体参数:
        name (str): 产品名称（必填）
        description (str): 产品描述（必填）
        price (float): 产品价格（必填）
        category_id (str): 产品类别ID（必填）
        supplier_id (str): 供应商ID（必填）
        stock (int): 库存数量（必填）
        main_image_url (str): 主图URL（可选）
        thumbnail_urls (list): 缩略图URL列表（可选）
        tags (list): 产品标签列表（可选）
        variations (list): 产品变体信息（可选）
    
    Returns:
        dict: 包含成功状态和新创建的产品信息
    
    Example:
        POST /api/product/create
        
        Request Body:
        {
            "name": "数字电视天线 4K 1080P",
            "description": "地面数字电视信号放大器 内置DVB-T2高清智能电视天线",
            "price": 13.63,
            "category_id": "MLB5672",
            "supplier_id": "SUP001",
            "stock": 150,
            "main_image_url": "https://example.com/main.jpg",
            "thumbnail_urls": ["https://example.com/thumb1.jpg", "https://example.com/thumb2.jpg"],
            "tags": ["新品上市", "特价促销"],
            "variations": [
                {
                    "id": "var-001",
                    "name": "3米线缆版本",
                    "imageUrl": "https://example.com/var1.jpg",
                    "price": 13.63,
                    "specification": "3米线缆长度版本",
                    "stock": 150
                }
            ]
        }
        
        Response:
        {
            "success": true,
            "code": 200,
            "message": "产品创建成功",
            "product": {
                "id": "MLB123456",
                "name": "数字电视天线 4K 1080P",
                "description": "地面数字电视信号放大器 内置DVB-T2高清智能电视天线",
                "price": 13.63,
                "category_id": "MLB5672",
                "supplier_id": "SUP001",
                "stock_quantity": 150,
                "img": "https://example.com/main.jpg",
                "product_mlb_thumbnail": ["https://example.com/thumb1.jpg", "https://example.com/thumb2.jpg"],
                "tags": ["新品上市", "特价促销"],
                "variations": [...],
                "created_at": "2024-01-15T10:30:00"
            }
        }
    """
    try:
        # 获取请求体数据
        request_data = await request.json()
        print(f"接收到的产品创建请求数据: {request_data}")
        
        # 验证必填字段
        required_fields = ['name', 'description', 'price', 'category_id', 'supplier_id', 'stock']
        for field in required_fields:
            if field not in request_data or request_data[field] is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"缺少必填字段: {field}"
                )
        
        # 验证类别是否存在
        category = db.query(Category).filter(Category.id == request_data['category_id']).first()
        if not category:
            raise HTTPException(
                status_code=404,
                detail=f"类别 {request_data['category_id']} 不存在"
            )
        
        # 生成产品ID（实际项目中可能需要更复杂的ID生成逻辑）
        import uuid
        product_id = f"MLB{uuid.uuid4().hex[:8].upper()}"
        
        # 创建产品对象
        new_product = Product(
            id=product_id,
            title=request_data['name'],
            description=request_data['description'],
            selling_price=float(request_data['price']),
            category_id=request_data['category_id'],
            supplier_id=request_data['supplier_id'],
            stock_quantity=int(request_data['stock']),
            img=request_data.get('main_image_url', ''),
            product_mlb_thumbnail=request_data.get('thumbnail_urls', []),
            tags=request_data.get('tags', []),
            variations=request_data.get('variations', []),
            moq=1,  # 默认最小订购量
            cost_price=float(request_data['price']) * 0.6,  # 假设成本价为售价的60%
            discount_price=None,
            product_mlb_price=f"R$ {request_data['price']:.2f}".replace('.', ','),
            roi="112%",  # 默认ROI
            shipping_from="广东省广州市",  # 默认发货地
            weight=1.0,  # 默认重量
            dimensions={"length": 30, "width": 20, "height": 10},  # 默认尺寸
            reserved_quantity=0,
            low_stock_threshold=10,
            max_order_quantity=1000
        )
        
        # 保存到数据库
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        print(f"✅ 成功创建产品 {product_id}")
        
        # 返回创建的产品信息
        result = {
            "id": new_product.id,
            "name": new_product.title,
            "description": new_product.description,
            "price": new_product.selling_price,
            "category_id": new_product.category_id,
            "supplier_id": new_product.supplier_id,
            "stock_quantity": new_product.stock_quantity,
            "img": new_product.img,
            "product_mlb_thumbnail": new_product.product_mlb_thumbnail,
            "tags": new_product.tags,
            "variations": new_product.variations,
            "created_at": new_product.created_at.isoformat() if new_product.created_at else None
        }
        
        return {
            "success": True,
            "code": 200,
            "message": "产品创建成功",
            "product": result
        }
        
    except HTTPException as he:
        # 重新抛出HTTP异常
        raise he
    except Exception as e:
        print(f"❌ 创建产品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"创建产品失败: {str(e)}"
        )


@router.get("/tags")
async def get_product_tags(db: Session = Depends(get_db)):
    """
    获取所有可用的产品标签
    
    Returns:
        dict: 包含成功状态和标签列表
    
    Example:
        GET /api/product/tags
        
        Response:
        {
            "success": true,
            "code": 200,
            "count": 8,
            "tags": [
                {
                    "id": "tag-001",
                    "name": "New Arrival",
                    "display_name": "新品上市",
                    "color": "#10b981",
                    "description": "最新上架的产品"
                },
                {
                    "id": "tag-002", 
                    "name": "On Sale",
                    "display_name": "特价促销",
                    "color": "#ef4444",
                    "description": "正在促销的产品"
                },
                ...
            ]
        }
    """
    try:
        # 模拟标签数据（实际项目中应该从数据库获取）
        tags = [
            {
                "id": "tag-001",
                "name": "New Arrival",
                "display_name": "新品上市",
                "color": "#10b981",
                "description": "最新上架的产品"
            },
            {
                "id": "tag-002",
                "name": "On Sale", 
                "display_name": "特价促销",
                "color": "#ef4444",
                "description": "正在促销的产品"
            },
            {
                "id": "tag-003",
                "name": "Best Seller",
                "display_name": "热销商品",
                "color": "#f59e0b",
                "description": "销量最好的产品"
            },
            {
                "id": "tag-004",
                "name": "Featured",
                "display_name": "精选推荐",
                "color": "#8b5cf6",
                "description": "精选推荐的产品"
            },
            {
                "id": "tag-005",
                "name": "Limited Edition",
                "display_name": "限量版",
                "color": "#ec4899",
                "description": "限量版产品"
            },
            {
                "id": "tag-006",
                "name": "Premium",
                "display_name": "高端产品",
                "color": "#6366f1",
                "description": "高端品质产品"
            },
            {
                "id": "tag-007",
                "name": "Eco Friendly",
                "display_name": "环保产品",
                "color": "#22c55e",
                "description": "环保友好产品"
            },
            {
                "id": "tag-008",
                "name": "Fast Shipping",
                "display_name": "快速发货",
                "color": "#06b6d4",
                "description": "支持快速发货"
            }
        ]
        
        print(f"✅ 成功获取 {len(tags)} 个产品标签")
        
        return {
            "success": True,
            "code": 200,
            "count": len(tags),
            "tags": tags
        }
        
    except Exception as e:
        print(f"❌ 获取产品标签失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取产品标签失败: {str(e)}"
        )


@router.get("/supplier")
async def get_suppliers(db: Session = Depends(get_db)):
    """
    获取所有供应商信息
    
    Returns:
        dict: 包含成功状态和供应商列表
    
    Example:
        GET /api/product/supplier
        
        Response:
        {
            "success": true,
            "code": 200,
            "count": 4,
            "suppliers": [
                {
                    "id": "SUP001",
                    "name": "广州市天河区鑫达电子商行",
                    "location": "广东省广州市天河区",
                    "created_at": "2024-01-15T10:30:00",
                    "updated_at": "2024-01-15T10:30:00"
                },
                {
                    "id": "SUP002",
                    "name": "深圳市龙华区华强电子厂",
                    "location": "广东省深圳市龙华区",
                    "created_at": "2024-01-15T10:30:00",
                    "updated_at": "2024-01-15T10:30:00"
                },
                ...
            ]
        }
    """
    try:
        # 从数据库查询所有供应商
        suppliers = db.query(Supplier).order_by(Supplier.name).all()
        
        # 转换为字典列表
        result = []
        for supplier in suppliers:
            result.append({
                "id": supplier.id,
                "name": supplier.name,
                "location": supplier.location,
                "created_at": supplier.created_at.isoformat() if supplier.created_at else None,
                "updated_at": supplier.updated_at.isoformat() if supplier.updated_at else None
            })
        
        print(f"✅ 成功从数据库获取 {len(result)} 个供应商信息")
        
        return {
            "success": True,
            "code": 200,
            "count": len(result),
            "suppliers": result
        }
        
    except Exception as e:
        print(f"❌ 获取供应商信息失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取供应商信息失败: {str(e)}"
        )


@router.get("/all")
async def get_all_products(
    db: Session = Depends(get_db)
):
    """
    获取所有产品信息
    
    Returns:
        dict: 包含成功状态、产品数量和产品列表
    
    Example:
        GET /api/product/all
        
        Response:
        {
            "success": true,
            "code": 200,
            "count": 100,
            "products": [
                {
                    "id": "MLB123456",
                    "title": "产品标题",
                    "description": "产品描述",
                    "img": "图片URL",
                    "selling_price": 99.99,
                    "discount_price": 89.99,
                    "stock_quantity": 100,
                    "moq": 5,
                    "tags": ["标签1", "标签2"],
                    "created_at": "2024-01-15T10:30:00"
                },
                ...
            ]
        }
    """
    try:
        # 查询所有产品
        products = db.query(Product).order_by(Product.created_at.desc()).all()
        
        # 转换为字典列表
        result = []
        for product in products:
            # 获取类别名称
            category = db.query(Category).filter(Category.id == product.category_id).first()
            result.append({
                "id": product.id,
                "title": product.title,
                "description": product.description,
                "img": product.img,
                "product_mlb_thumbnail": product.product_mlb_thumbnail,
                "category_id": product.category_id,
                "category_name": category.name if category else None,
                "supplier_id": product.supplier_id,
                "shipping_from": product.shipping_from,
                "weight": product.weight,
                "dimensions": product.dimensions,
                "user_limit_quantity": product.user_limit_quantity,
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
        
        print(f"✅ 成功获取所有 {len(result)} 个产品")
        
        return {
            "success": True,
            "code": 200,
            "count": len(result),
            "products": result
        }
        
    except Exception as e:
        print(f"❌ 获取所有产品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取所有产品失败: {str(e)}"
        )


@router.post("/sample")
async def get_sample_products(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    获取"先试后用"页面的产品信息（不包含moq字段，只包含user_limit_quantity）
    
    请求体参数:
        category_id (str): 类别ID（必填）
    
    Returns:
        dict: 包含成功状态、产品数量和产品列表（仅限购相关字段）
    
    Example:
        POST /api/product/sample
        
        Request Body:
        {
            "category_id": "MLB5672"
        }
        
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
                    "user_limit_quantity": 1,
                    "tags": ["标签1", "标签2"],
                    "created_at": "2024-01-15T10:30:00"
                },
                ...
            ]
        }
    """
    try:
        # 获取请求体数据
        request_data = await request.json()
        print(f"接收到的先试后用请求数据: {request_data}")
        
        # 获取类别ID
        category_id = request_data.get('category_id', '').strip()
        
        # 验证类别ID不为空
        if not category_id:
            raise HTTPException(
                status_code=400,
                detail="缺少必填字段: category_id"
            )
        
        print(f"接收到的先试后用类别ID: {category_id}")
        
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
        
        # 转换为字典列表（只包含先试后用需要的字段）
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
                "user_limit_quantity": product.user_limit_quantity,  # 只包含限购数量
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
        
        print(f"✅ 成功获取先试后用类别 {category_id} 下的 {len(result)} 个产品")
        
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
        print(f"❌ 获取先试后用产品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取先试后用产品失败: {str(e)}"
        )