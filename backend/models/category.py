"""
产品类别模型定义
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from utils.database import Base

class Category(Base):
    """产品类别表模型"""
    __tablename__ = "categories"
    
    # 主键 (使用字符串类型支持 MLB 格式的 ID)
    id = Column(String(50), primary_key=True, index=True, comment="类别ID")
    
    # 基本信息
    name = Column(String(100), nullable=False, unique=True, comment="类别名称")
    description = Column(Text, nullable=True, comment="类别描述")
    icon = Column(Text, nullable=True, comment="类别图标(支持URL或SVG代码)")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', icon='{self.icon}')>"
