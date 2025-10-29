"""
产品模型定义
"""
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from utils.database import Base

class Product(Base):
    """产品表模型"""
    __tablename__ = "products"
    
    # 主键
    id = Column(String(50), primary_key=True, index=True, comment="产品唯一标识")
    
    # 基本信息
    title = Column(String(500), nullable=False, comment="产品标题")
    description = Column(Text, nullable=True, comment="产品详细描述")
    img = Column(String(500), nullable=True, comment="产品主图URL")
    product_mlb_thumbnail = Column(JSON, nullable=True, comment="主图缩略图URL列表")
    
    # 外键关联（必填，级联删除）
    category_id = Column(
        String(50), 
        ForeignKey('categories.id', ondelete='CASCADE'), 
        nullable=False, 
        index=True,
        comment="所属类别ID"
    )
    supplier_id = Column(
        String(50), 
        ForeignKey('suppliers.id', ondelete='CASCADE'), 
        nullable=False, 
        index=True,
        comment="供应商ID"
    )
    
    # 关系定义（使用 passive_deletes='all' 完全依赖数据库的级联删除）
    category = relationship("Category", backref="products", passive_deletes='all')
    supplier = relationship("Supplier", backref="products", passive_deletes='all')
    
    # 物流信息
    shipping_from = Column(String(255), nullable=True, comment="发货地")
    weight = Column(Float, nullable=True, comment="产品重量(kg)")
    dimensions = Column(JSON, nullable=True, comment="产品尺寸(长x宽x高)")
    
    # 订购信息 
    moq = Column(Integer, default=1, nullable=False, comment="起订量")
    tags = Column(JSON, nullable=True, comment="产品标签")
    
    # 库存管理
    stock_quantity = Column(Integer, default=0, nullable=False, comment="当前库存数量")
    reserved_quantity = Column(Integer, default=0, nullable=False, comment="已预留数量")
    low_stock_threshold = Column(Integer, default=10, nullable=False, comment="低库存预警阈值")
    max_order_quantity = Column(Integer, nullable=True, comment="最大购买数量")
    user_limit_quantity = Column(Integer, default=1, nullable=False, comment="每用户限购数量")
    
    # 价格信息
    cost_price = Column(Float, nullable=True, comment="成本价")
    selling_price = Column(Float, nullable=False, comment="实际售价单价(BRL)")
    discount_price = Column(Float, nullable=True, comment="折扣价(BRL)")
    product_mlb_price = Column(String(50), nullable=True, comment="MLB售价(BRL)")
    roi = Column(String(20), nullable=True, comment="投资回报率")
    
    # 产品变体信息
    variations = Column(JSON, nullable=True, comment="产品变体信息列表")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<Product(id={self.id}, title='{self.title}', category_id={self.category_id}, supplier_id={self.supplier_id})>"

