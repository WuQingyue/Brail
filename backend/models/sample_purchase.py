"""
小样购买记录模型定义
用于记录用户购买小样的历史，确保每个用户只能购买一次小样
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from utils.database import Base

class SamplePurchase(Base):
    """小样购买记录表模型"""
    __tablename__ = "sample_purchases"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="记录ID")
    
    # 外键关联
    user_id = Column(
        Integer, 
        ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False, 
        index=True,
        comment="用户ID"
    )
    product_id = Column(
        String(50), 
        ForeignKey('products.id', ondelete='CASCADE'), 
        nullable=False, 
        index=True,
        comment="产品ID"
    )
    
    # 购买信息
    purchase_date = Column(DateTime(timezone=True), server_default=func.now(), comment="购买时间")
    status = Column(String(20), nullable=False, default='purchased', comment="购买状态")
    
    # 关系定义
    user = relationship("User", backref="sample_purchases")
    product = relationship("Product", backref="sample_purchases")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 唯一约束：确保每个用户只能购买一次小样
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='unique_user_sample_purchase'),
    )
    
    def __repr__(self):
        return f"<SamplePurchase(id={self.id}, user_id={self.user_id}, product_id='{self.product_id}')>"
