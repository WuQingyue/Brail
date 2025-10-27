"""
订单模型定义
"""
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from utils.database import Base
from sqlalchemy.sql import func

class Order(Base):
    """订单主表"""
    __tablename__ = "orders"
    
    # 主键
    id = Column(String(50), primary_key=True, index=True, comment="订单ID")
    
    # 外键关联用户
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    
    # 订单状态
    status = Column(String(50), default="Pending", comment="订单状态(Pending/Processing/Shipped/Delivered/Cancelled)")
    status_step = Column(Integer, default=1, comment="状态步骤")
    status_text = Column(String(100), comment="状态文本")
    status_detail_text = Column(String(200), comment="状态详情")
    
    # 客户信息
    customer_name = Column(String(100), nullable=False, comment="客户名称")
    
    # 金额
    total_amount = Column(Numeric(10, 2), nullable=False, comment="订单总金额")
    
    # 配送地址
    shipping_street = Column(String(255), comment="街道地址")
    shipping_city = Column(String(100), comment="城市")
    shipping_zipcode = Column(String(20), comment="邮政编码")
    
    # 支付方式
    payment_method = Column(String(50), comment="支付方式")
    
    # 备注
    notes = Column(Text, comment="订单备注")
    
    # 时间戳
    order_date = Column(DateTime, server_default=func.now(), comment="订单日期")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联订单商品
    items = relationship("OrderItem", backref="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status}, total_amount={self.total_amount})>"


class OrderItem(Base):
    """订单商品明细表"""
    __tablename__ = "order_items"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="订单商品项ID")
    
    # 外键
    order_id = Column(String(50), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, comment="订单ID")
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False, comment="商品ID")
    
    # 商品信息（快照，防止商品信息变更影响历史订单）
    product_name = Column(String(500), nullable=False, comment="商品名称")
    product_image = Column(String(500), comment="商品图片")
    
    # 数量和价格
    quantity = Column(Integer, nullable=False, comment="数量")
    price = Column(Numeric(10, 2), nullable=False, comment="单价")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_name={self.product_name}, quantity={self.quantity})>"

