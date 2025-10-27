"""
购物车相关API接口
"""
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from models.cart import Cart
from models.cart_item import CartItem
from models.product import Product
from utils.database import get_db

router = APIRouter()


class UpdateQuantityRequest(BaseModel):
    """更新数量请求模型"""
    quantity: int


class AddToCartRequest(BaseModel):
    """加入购物车请求模型"""
    cart_id: int
    product_id: str  # 产品ID可能是字符串格式，如 "agri-005"
    quantity: int


@router.post("/getCartId")
async def get_cart_id(request_data: dict, db: Session = Depends(get_db)):
    """
    获取用户的购物车ID
    
    请求体参数:
        user_id (int): 用户ID（必填）
    
    Returns:
        dict: 包含成功状态和购物车ID
    
    Example:
        POST /api/cart/getCartId
        Body: { "user_id": 1 }
        
        Response:
        {
            "cartId": 1
        }
    """
    try:
        user_id = request_data.get('user_id')
        
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id 参数不能为空"
            )
        
        # 查找用户的购物车
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        
        # 如果用户没有购物车，创建一个新的
        if not cart:
            new_cart = Cart(user_id=user_id)
            db.add(new_cart)
            db.commit()
            db.refresh(new_cart)
            cart_id = new_cart.id
            print(f"✅ 为用户 {user_id} 创建新购物车，ID: {cart_id}")
        else:
            cart_id = cart.id
            print(f"✅ 找到用户 {user_id} 的购物车，ID: {cart_id}")
        
        return {"cartId": cart_id}
        
    except Exception as e:
        print(f"❌ 获取购物车ID失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取购物车ID失败: {str(e)}"
        )


@router.get("/get_cart_data/{cart_id}")
async def get_cart_data(cart_id: int, db: Session = Depends(get_db)):
    """
    获取购物车的详细数据
    
    路径参数:
        cart_id (int): 购物车ID（必填）
    
    Returns:
        dict: 包含成功状态、购物车商品列表和摘要信息
    
    Example:
        GET /api/cart/get_cart_data/1
        
        Response:
        {
            "success": true,
            "items": [
                {
                    "id": 1,
                    "name": "产品名称",
                    "description": "产品描述",
                    "specification": "规格说明",
                    "image": "图片URL",
                    "unitPrice": 13.63,
                    "totalPrice": 681.50,
                    "quantity": 50,
                    "moq": 50
                }
            ],
            "summary": {
                "totalAmount": 6480.50
            }
        }
    """
    try:
        # 查询购物车
        cart = db.query(Cart).filter(Cart.id == cart_id).first()
        
        if not cart:
            raise HTTPException(
                status_code=404,
                detail=f"购物车 {cart_id} 不存在"
            )
        
        # 查询购物车中的商品
        cart_items = db.query(CartItem).filter(CartItem.cart_id == cart_id).all()
        
        items = []
        total_amount = 0
        
        for item in cart_items:
            # 查询商品信息
            product = db.query(Product).filter(Product.id == item.product_id).first()
            
            if not product:
                continue  # 如果商品不存在，跳过
            
            # 计算总价
            unit_price = float(item.price)
            total_price = unit_price * item.quantity
            total_amount += total_price
            
            items.append({
                "id": item.id,
                "product_id": item.product_id,  # 添加商品ID
                "name": product.title,
                "description": product.description,
                "specification": "标准版本",  # 可以根据实际情况添加规格字段
                "image": product.img or "https://via.placeholder.com/120x120/10b981/ffffff?text=Product",
                "unitPrice": unit_price,
                "totalPrice": total_price,
                "quantity": item.quantity,
                "moq": product.moq
            })
        
        print(f"✅ 成功获取购物车 {cart_id} 的数据，共 {len(items)} 件商品")
        
        return {
            "items": items,
            "summary": {
                "totalAmount": round(total_amount, 2)
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ 获取购物车数据失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"获取购物车数据失败: {str(e)}"
        )


@router.put("/update_item/{cart_id}/{item_id}")
async def update_cart_item(
    cart_id: int,
    item_id: int,
    request_body: UpdateQuantityRequest,
    db: Session = Depends(get_db)
    ):
    """
    更新购物车商品数量
    
    路径参数:
        cart_id (int): 购物车ID（必填）
        item_id (int): 商品项ID（必填）
    
    请求体参数:
        quantity (int): 新的数量（必填）
    
    Returns:
        dict: 包含成功状态和更新后的商品信息
    """
    try:
        quantity = request_body.quantity
        
        # 查找购物车商品
        cart_item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart_id
        ).first()
        
        if not cart_item:
            raise HTTPException(
                status_code=404,
                detail=f"购物车商品 {item_id} 不存在"
            )
        
        # 获取商品信息以验证 MOQ
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        
        if product and quantity < product.moq:
            raise HTTPException(
                status_code=400,
                detail=f"数量不能小于最小订购量 {product.moq}"
            )
        
        # 更新数量
        cart_item.quantity = quantity
        db.commit()
        
        print(f"✅ 成功更新购物车商品 {item_id} 的数量为 {quantity}")
        
        return {
            "success": True,
            "message": "数量更新成功",
            "item": {
                "id": cart_item.id,
                "quantity": cart_item.quantity
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ 更新购物车商品数量失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"更新购物车商品数量失败: {str(e)}"
        )


@router.delete("/item")
async def remove_cart_item(
    request_data: dict,
    db: Session = Depends(get_db)
    ):
    """
    删除购物车商品项目
    
    请求体参数:
        item_id (int): 购物车商品项ID（必填）
    
    Returns:
        dict: 包含成功状态
    
    Example:
        DELETE /api/cart/item
        Body: { "item_id": 1 }
        
        Response:
        {
            "success": true,
            "message": "商品删除成功"
        }
    """
    try:
        item_id = request_data.get('item_id')
        
        if not item_id:
            raise HTTPException(
                status_code=400,
                detail="item_id 参数不能为空"
            )
        
        # 查找购物车商品项
        cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
        
        if not cart_item:
            raise HTTPException(
                status_code=404,
                detail=f"购物车商品项 {item_id} 不存在"
            )
        
        # 删除商品项
        db.delete(cart_item)
        db.commit()
        
        print(f"✅ 成功删除购物车商品项 {item_id}")
        
        return {
            "success": True,
            "message": "商品删除成功"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ 删除购物车商品失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"删除购物车商品失败: {str(e)}"
        )


@router.post("/add_item")
async def add_to_cart(
    request_body: AddToCartRequest,
    db: Session = Depends(get_db)
    ):
    """
    将商品加入购物车
    
    请求体参数:
        cart_id (int): 购物车ID（必填）
        product_id (int): 商品ID（必填）
        quantity (int): 数量（必填）
    
    Returns:
        dict: 包含成功状态和新添加的商品信息
    
    Example:
        POST /api/cart/add_item
        Body: {
            "cart_id": 1,
            "product_id": 1,
            "quantity": 50
        }
        
        Response:
        {
            "success": true,
            "message": "商品已加入购物车",
            "item": {
                "id": 1,
                "product_id": 1,
                "quantity": 50
            }
        }
    """
    try:
        cart_id = request_body.cart_id
        product_id = str(request_body.product_id)  # 确保 product_id 是字符串
        quantity = request_body.quantity
        
        # 验证购物车是否存在
        cart = db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            raise HTTPException(
                status_code=404,
                detail=f"购物车 {cart_id} 不存在"
            )
        
        # 验证商品是否存在
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"商品 {product_id} 不存在"
            )
        
        # 验证数量是否满足MOQ
        if quantity < product.moq:
            raise HTTPException(
                status_code=400,
                detail=f"数量不能小于最小订购量 {product.moq}"
            )
        
        # 检查购物车中是否已存在该商品
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id
        ).first()
        
        if existing_item:
            # 如果已存在，增加数量
            existing_item.quantity += quantity
            db.commit()
            db.refresh(existing_item)
            
            print(f"✅ 购物车中商品已存在，更新数量: {existing_item.quantity}")
            
            return {
                "success": True,
                "message": "商品数量已更新",
                "item": {
                    "id": existing_item.id,
                    "product_id": product_id,
                    "quantity": existing_item.quantity
                }
            }
        else:
            # 如果不存在，添加新商品到购物车
            # 使用商品的销售价格
            price = float(product.selling_price) if product.selling_price else 0.0
            
            new_item = CartItem(
                cart_id=cart_id,
                product_id=product_id,
                quantity=quantity,
                price=price
            )
            db.add(new_item)
            db.commit()
            db.refresh(new_item)
            
            print(f"✅ 成功将商品 {product_id} 加入购物车 {cart_id}，数量: {quantity}")
            
            return {
                "success": True,
                "message": "商品已加入购物车",
                "item": {
                    "id": new_item.id,
                    "product_id": product_id,
                    "quantity": new_item.quantity
                }
            }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ 加入购物车失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"加入购物车失败: {str(e)}"
        )

