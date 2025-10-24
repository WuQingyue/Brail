"""
购物车主表模型定义
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Cart(Base):
    """购物车主表模型"""
    __tablename__ = "carts"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="购物车ID")
    
    # 外键关联用户
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    
    def __repr__(self):
        return f"<Cart(id={self.id}, user_id={self.user_id}, created_at='{self.created_at}')>"
