"""
用户模型定义
包含企业用户信息
"""
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """企业用户表模型"""
    __tablename__ = "users"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="用户ID")
    
    # 基本信息
    name = Column(String(100), nullable=False, comment="企业名称")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    password = Column(String(255), nullable=False, comment="密码")
    
    # 企业信息
    cnpj = Column(String(18), unique=True, index=True, nullable=True, comment="CNPJ（企业税号）")
    employee_count = Column(Integer, nullable=True, comment="员工数量")
    monthly_revenue = Column(Numeric(15, 2), nullable=True, comment="月营业额")
    phone = Column(String(20), nullable=True, comment="联系电话")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', cnpj='{self.cnpj}')>"
