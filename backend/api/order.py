"""
订单相关的 API 接口
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List
from utils.database import get_db
from models.order import Order, OrderItem
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
        
        # 更新订单状态为已批准
        order.status = "Approved"
        order.status_step = 2
        order.status_text = "生产和准备发货"
        order.status_detail_text = "订单已批准，准备生产"
        
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

