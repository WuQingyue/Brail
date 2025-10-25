"""
供应商模型定义
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from utils.database import Base

class Supplier(Base):
    """供应商表模型"""
    __tablename__ = "suppliers"
    
    # 主键
    id = Column(String(50), primary_key=True, index=True, comment="供应商唯一标识")
    
    # 基本信息
    name = Column(String(255), nullable=False, comment="供应商公司名称")
    location = Column(String(255), nullable=False, comment="供应商所在地区")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}', location='{self.location}')>"

