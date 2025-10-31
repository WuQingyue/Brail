"""
PIX支付API模块
根据Stripe官方文档实现PIX支付功能
参考：https://docs.stripe.com/payments/pix/accept-a-payment
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe
from utils.config import settings
# 配置Stripe API密钥
# 从环境变量获取，如果没有则使用测试密钥
# 注意：生产环境必须使用环境变量配置您的实际密钥
stripe.api_key = settings.STRIPE_SECRET_KEY

# 创建路由
router = APIRouter()


class PaymentIntentRequest(BaseModel):
    """创建支付意图请求模型"""
    amount: int  # 金额（以分为单位，例如：1000 = 10.00 BRL）
    currency: str = "brl"  # 货币代码，默认为巴西雷亚尔


@router.post("/secret")
async def create_secret(request: PaymentIntentRequest):
    """
    创建PaymentIntent并返回client_secret
    对应Stripe文档中的服务器端点示例
    
    根据文档：
    - 创建一个PaymentIntent对象来表示收款的意图
    - 指定金额和支持的货币
    - 添加pix到payment_method_types列表
    
    请求体:
        amount: 支付金额（以分为单位），例如1000表示10.00 BRL
        currency: 货币代码（默认brl）
    
    返回:
        client_secret: 用于客户端确认支付的密钥
    """
    try:
        # 验证金额（Stripe PIX最小金额建议为50分 = 0.50 BRL）
        if request.amount < 50:
            raise HTTPException(
                status_code=400,
                detail="金额必须至少为0.50 BRL（50分）"
            )
        
        # 创建PaymentIntent（根据Stripe文档示例）
        intent = stripe.PaymentIntent.create(
            payment_method_types=["pix"],  # 指定使用PIX支付方式
            amount=request.amount,          # 金额（分）
            currency=request.currency,      # 货币代码
        )
        
        # 返回client_secret（对应Flask版本的jsonify(client_secret=intent.client_secret)）
        # FastAPI会自动将返回值转换为JSON
        return {"client_secret": intent.client_secret}
    
    except stripe.StripeError as e:
        # Stripe API错误处理
        raise HTTPException(
            status_code=400,
            detail=f"Stripe错误: {str(e)}"
        )
    except Exception as e:
        # 其他错误
        raise HTTPException(
            status_code=500,
            detail=f"服务器错误: {str(e)}"
        )

