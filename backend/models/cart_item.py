"""
购物车项目表模型定义
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from database import Base

class CartItem(Base):
    """购物车项目表模型"""
    __tablename__ = "cart_items"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="购物车项目ID")
    
    # 外键关联购物车
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False, comment="购物车ID")
    
    # 商品信息
    product_id = Column(Integer, nullable=False, comment="商品ID")
    
    # 数量和价格
    quantity = Column(Integer, nullable=False, comment="数量")
    price = Column(Numeric(10, 2), nullable=False, comment="价格")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<CartItem(id={self.id}, cart_id={self.cart_id}, product_id={self.product_id}, quantity={self.quantity}, price={self.price})>"
