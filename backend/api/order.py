"""
订单相关的 API 接口
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List
from utils.database import get_db
from models.order import Order, OrderItem
from models.sample_purchase import SamplePurchase
from models.product import Product
from models.user import User
from datetime import datetime

router = APIRouter()


@router.post("/create")
async def create_order(request: Request, db: Session = Depends(get_db)):
    """
    创建订单
    
    请求体参数:
        user_id (int): 用户ID（必填）
        customer_name (str): 客户名称（必填）
        shipping_street (str): 街道地址（可选）
        shipping_city (str): 城市（可选）
        shipping_zipcode (str): 邮政编码（可选）
        payment_method (str): 支付方式（可选）
        notes (str): 备注（可选）
        items (list): 订单商品列表（必填）
    
    Returns:
        dict: 包含成功状态和订单ID
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        if not request_data.get('customer_name'):
            raise HTTPException(status_code=400, detail="customer_name 参数不能为空")
        if not request_data.get('items') or len(request_data.get('items')) == 0:
            raise HTTPException(status_code=400, detail="items 参数不能为空")
        
        # 生成订单ID
        import uuid
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # 计算订单总金额
        total_amount = sum(item.get('price', 0) * item.get('quantity', 0) for item in request_data.get('items', []))
        
        # 创建订单
        order = Order(
            id=order_id,
            user_id=request_data.get('user_id'),
            status="Pending",
            status_step=1,
            status_text="订单和审批",
            status_detail_text="订单已接收",
            customer_name=request_data.get('customer_name'),
            total_amount=total_amount,
            shipping_street=request_data.get('shipping_street'),
            shipping_city=request_data.get('shipping_city'),
            shipping_zipcode=request_data.get('shipping_zipcode'),
            payment_method=request_data.get('payment_method'),
            notes=request_data.get('notes'),
            order_date=datetime.now()
        )
        db.add(order)
        db.flush()  # 获取订单ID
        
        # 创建订单商品
        for item in request_data.get('items', []):
            order_item = OrderItem(
                order_id=order.id,
                product_id=item.get('product_id'),
                product_name=item.get('product_name'),
                product_image=item.get('product_image'),
                quantity=item.get('quantity'),
                price=item.get('price')
            )
            db.add(order_item)
        
        db.commit()
        
        return {
            "success": True,
            "order_id": order.id,
            "message": "订单创建成功"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建订单失败: {str(e)}")


@router.post("/list")
async def get_order_list(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取用户的订单列表
    
    请求体参数:
        user_id (int): 用户ID（必填）
    
    Returns:
        dict: 包含订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        user_id = request_data.get('user_id')
        
        orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取订单列表失败: {str(e)}")


@router.post("/admin/pending")
async def get_pending_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取待审核的订单列表（管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证管理员权限）
    
    Returns:
        dict: 包含待审核订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Pending" 且状态步骤为 1 的订单
        orders = db.query(Order).filter(
            Order.status == "Pending",
            Order.status_step == 1
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取待审核订单列表失败: {str(e)}")


@router.post("/admin/processed")
async def get_processed_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取已处理的订单列表（管理员使用）
    
    返回除了状态为 "Pending" 且状态步骤为 1 的所有订单
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证管理员权限）
    
    Returns:
        dict: 包含已处理订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询所有不是"待审核"状态的订单
        # 排除: status == "Pending" AND status_step == 1
        from sqlalchemy import or_, and_, not_
        orders = db.query(Order).filter(
            not_(and_(Order.status == "Pending", Order.status_step == 1))
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取已处理订单列表失败: {str(e)}")


@router.post("/admin/approve")
async def approve_order(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    批准订单（管理员使用）
    
    请求体参数:
        order_id (str): 订单ID（必填）
        user_id (int): 用户ID（必填，用于验证管理员权限）
    
    Returns:
        dict: 包含成功状态
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('order_id'):
            raise HTTPException(status_code=400, detail="order_id 参数不能为空")
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        order_id = request_data.get('order_id')
        
        # 查询订单
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        # 更新订单状态为处理中
        order.status = "Processing"
        order.status_step = 2
        order.status_text = "生产和准备发货"
        order.status_detail_text = "订单已批准，正在生产"
        
        db.commit()
        
        return {
            "success": True,
            "message": "订单已批准"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批准订单失败: {str(e)}")


@router.post("/admin/reject")
async def reject_order(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    拒绝订单（管理员使用）
    
    请求体参数:
        order_id (str): 订单ID（必填）
        user_id (int): 用户ID（必填，用于验证管理员权限）
        reason (str): 拒绝原因（可选）
    
    Returns:
        dict: 包含成功状态
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('order_id'):
            raise HTTPException(status_code=400, detail="order_id 参数不能为空")
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        order_id = request_data.get('order_id')
        reason = request_data.get('reason', '未提供拒绝原因')
        
        # 查询订单
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        # 更新订单状态为已拒绝
        order.status = "Rejected"
        order.status_step = 0
        order.status_text = "订单已拒绝"
        order.status_detail_text = f"拒绝原因: {reason}"
        
        db.commit()
        
        return {
            "success": True,
            "message": "订单已拒绝"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"拒绝订单失败: {str(e)}")


@router.post("/logistics/processing")
async def get_processing_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Processing的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Processing状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Processing" 的订单
        orders = db.query(Order).filter(
            Order.status == "Processing"
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Processing状态订单列表失败: {str(e)}")


@router.post("/logistics/shipped")
async def get_shipped_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Shipped的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Shipped状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Shipped" 的订单
        orders = db.query(Order).filter(
            Order.status == "Shipped"
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Shipped状态订单列表失败: {str(e)}")


@router.post("/logistics/sample_processed_orders")
async def get_sample_processed_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Customs和Delivered的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Customs和Delivered状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Customs" 或 "Delivered" 的订单
        from sqlalchemy import or_
        orders = db.query(Order).filter(
            or_(Order.status == "Customs", Order.status == "Delivered")
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品 
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Customs和Delivered状态订单列表失败: {str(e)}")


@router.post("/logistics/customs")
async def get_customs_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Customs的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Customs状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Customs" 的订单
        orders = db.query(Order).filter(
            Order.status == "Customs"
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Customs状态订单列表失败: {str(e)}")


@router.post("/logistics/cleared")
async def get_cleared_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Cleared的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Cleared状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Cleared" 的订单
        orders = db.query(Order).filter(
            Order.status == "Cleared"
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Cleared状态订单列表失败: {str(e)}")


@router.post("/logistics/delivered")
async def get_delivered_orders(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    获取状态为Delivered的订单列表（物流管理员使用）
    
    请求体参数:
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
    
    Returns:
        dict: 包含Delivered状态订单列表
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        
        # 查询状态为 "Delivered" 的订单
        orders = db.query(Order).filter(
            Order.status == "Delivered"
        ).order_by(Order.order_date.desc()).all()
        
        result = []
        for order in orders:
            # 获取订单商品
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            order_data = {
                "id": order.id,
                "status": order.status,
                "status_step": order.status_step,
                "status_text": order.status_text,
                "status_detail_text": order.status_detail_text,
                "customer_name": order.customer_name,
                "total_amount": float(order.total_amount),
                "shipping": {
                    "street": order.shipping_street,
                    "city": order.shipping_city,
                    "zipcode": order.shipping_zipcode
                },
                "payment_method": order.payment_method,
                "notes": order.notes,
                "orderDate": order.order_date.isoformat() if order.order_date else None,
                "statusStep": order.status_step,
                "statusText": order.status_text,
                "statusDetailText": order.status_detail_text,
                "statusClass": f"status-{order.status.lower()}",
                "items": [
                    {
                        "id": item.id,
                        "product_id": item.product_id,
                        "productName": item.product_name,
                        "image": item.product_image,
                        "quantity": item.quantity,
                        "price": float(item.price)
                    }
                    for item in items
                ]
            }
            result.append(order_data)
        
        return {
            "success": True,
            "orders": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取Delivered状态订单列表失败: {str(e)}")


@router.post("/logistics/update_status")
async def update_order_status(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """
    更新订单状态（物流管理员使用）
    
    请求体参数:
        order_id (str): 订单ID（必填）
        user_id (int): 用户ID（必填，用于验证物流管理员权限）
        action (str): 操作类型（必填）
            - "approve": 批准订单（Processing -> Shipped）
            - "arrive_customs": 到达海关（Shipped -> Customs）
            - "clear_customs": 清关完成（Customs -> Cleared）
            - "deliver": 确认交付（Cleared -> Delivered）
            - "reject": 拒绝订单（任何状态 -> Rejected）
        reason (str): 拒绝原因（可选，仅在reject时需要）
    
    Returns:
        dict: 包含成功状态
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('order_id'):
            raise HTTPException(status_code=400, detail="order_id 参数不能为空")
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        if not request_data.get('action'):
            raise HTTPException(status_code=400, detail="action 参数不能为空")
        
        order_id = request_data.get('order_id')
        action = request_data.get('action')
        reason = request_data.get('reason', '')
        
        # 查询订单
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        # 根据操作类型更新订单状态
        if action == "approve":
            # 批准订单，从Processing转为Shipped
            if order.status == "Processing":
                order.status = "Shipped"
                order.status_step = 3
                order.status_text = "运输中"
                order.status_detail_text = "订单已发货，正在运输中"
            else:
                raise HTTPException(status_code=400, detail="只能批准Processing状态的订单")
                
        elif action == "arrive_customs":
            # 到达巴西海关，从Shipped转为Customs
            if order.status == "Shipped":
                order.status = "Customs"
                order.status_step = 4
                order.status_text = "到达巴西清关"
                order.status_detail_text = "货物已到达巴西海关，正在清关"
            else:
                raise HTTPException(status_code=400, detail="只能处理Shipped状态的订单")
                
        elif action == "clear_customs":
            # 清关完成，从Customs转为Cleared
            if order.status == "Customs":
                order.status = "Cleared"
                order.status_step = 5
                order.status_text = "清关完成"
                order.status_detail_text = "货物已清关完成，准备运输"
            else:
                raise HTTPException(status_code=400, detail="只能处理Customs状态的订单")
                
        elif action == "deliver":
            # 确认交付，从Cleared转为Delivered
            if order.status == "Cleared":
                order.status = "Delivered"
                order.status_step = 6
                order.status_text = "已交付"
                order.status_detail_text = "订单已完成交付"
            else:
                raise HTTPException(status_code=400, detail="只能处理Cleared状态的订单")
                
        elif action == "reject":
            # 拒绝订单
            order.status = "Rejected"
            order.status_step = 0
            order.status_text = "订单已拒绝"
            order.status_detail_text = f"拒绝原因: {reason}" if reason else "订单已拒绝"
            
        else:
            raise HTTPException(status_code=400, detail="无效的操作类型")
        
        db.commit()
        
        return {
            "success": True,
            "message": f"订单状态已更新"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新订单状态失败: {str(e)}")


@router.post("/sample/create")
async def create_sample_order(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    创建小样订单（先试后用）
    
    请求体参数:
        user_id (int): 用户ID（必填）
        product_id (str): 产品ID（必填）
        customer_name (str): 客户名称（必填）
        shipping_street (str): 街道地址（可选）
        shipping_city (str): 城市（可选）
        shipping_zipcode (str): 邮政编码（可选）
        payment_method (str): 支付方式（可选）
        notes (str): 备注（可选）
    
    Returns:
        dict: 包含成功状态和订单ID
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        if not request_data.get('product_id'):
            raise HTTPException(status_code=400, detail="product_id 参数不能为空")
        if not request_data.get('customer_name'):
            raise HTTPException(status_code=400, detail="customer_name 参数不能为空")
        
        user_id = request_data.get('user_id')
        product_id = request_data.get('product_id')
        
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 检查产品是否存在
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="产品不存在")
        
        # 生成订单ID
        import uuid
        order_id = f"SMP-{uuid.uuid4().hex[:8].upper()}"
        
        # 使用产品的 user_limit_quantity 作为数量
        quantity = product.user_limit_quantity
        total_amount = product.selling_price * quantity
        
        # 创建小样订单（直接设置为准备出货状态，不需要管理员审核）
        order = Order(
            id=order_id,
            user_id=user_id,
            status="Processing",
            status_step=2,
            status_text="生产和准备发货",
            status_detail_text="小样订单已接收，准备发货",
            customer_name=request_data.get('customer_name'),
            total_amount=total_amount,
            shipping_street=request_data.get('shipping_street'),
            shipping_city=request_data.get('shipping_city'),
            shipping_zipcode=request_data.get('shipping_zipcode'),
            payment_method=request_data.get('payment_method'),
            notes=request_data.get('notes', '小样订单'),
            order_date=datetime.now()
        )
        db.add(order)
        db.flush()  # 获取订单ID
        
        # 创建订单商品
        order_item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            product_name=product.title,
            product_image=product.img,
            quantity=quantity,
            price=product.selling_price
        )
        db.add(order_item)
        
        # 创建小样购买记录
        sample_purchase = SamplePurchase(
            user_id=user_id,
            product_id=product_id,
            purchase_date=datetime.now(),
            status='purchased'
        )
        db.add(sample_purchase)
        
        db.commit()
        
        return {
            "success": True,
            "order_id": order.id,
            "product_id": product_id,
            "quantity": quantity,
            "total_amount": float(total_amount),
            "message": "小样订单创建成功"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建小样订单失败: {str(e)}")


@router.post("/sample/check")
async def check_sample_purchase(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    检查用户是否已经购买过指定产品的小样
    
    请求体参数:
        user_id (int): 用户ID（必填）
        product_id (str): 产品ID（必填）
    
    Returns:
        dict: 包含检查结果
    """
    try:
        # 从请求中获取JSON数据
        request_data = await request.json()
        
        # 验证必填参数
        if not request_data.get('user_id'):
            raise HTTPException(status_code=400, detail="user_id 参数不能为空")
        if not request_data.get('product_id'):
            raise HTTPException(status_code=400, detail="product_id 参数不能为空")
        
        user_id = request_data.get('user_id')
        product_id = request_data.get('product_id')
        
        # 检查用户是否已经购买过该产品的小样
        existing_purchase = db.query(SamplePurchase).filter(
            SamplePurchase.user_id == user_id,
            SamplePurchase.product_id == product_id
        ).first()
        
        return {
            "success": True,
            "has_purchased": existing_purchase is not None,
            "purchase_date": existing_purchase.purchase_date.isoformat() if existing_purchase else None,
            "message": "已购买过该产品小样" if existing_purchase else "可以购买该产品小样"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检查小样购买记录失败: {str(e)}")
