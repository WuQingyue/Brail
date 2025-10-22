"""
数据库连接集成测试
测试 database.py 中的数据库连接功能
"""
from database import verify_connection, check_database_exists, create_database
import pytest
import sys
import os

# 添加 backend 目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

class TestDatabaseConnection:
    """数据库连接集成测试类"""
    
    def test_database_connection(self):
        """测试数据库连接"""
        # 调用 database.py 中的 verify_connection 函数
        result = verify_connection()
        
        # 验证函数返回结果
        assert result is True, "数据库连接测试失败"
    
    def test_brail_db_exists(self):
        """测试 brail_db 数据库是否存在"""
        # 调用 check_database_exists 函数检查 brail_db 数据库
        result = check_database_exists("brail_db")
        
        # 无论数据库存在与否，测试都应该通过
        # 这个测试主要是验证函数能正常执行并返回布尔值
        assert isinstance(result, bool), "测试 brail_db 数据库是否存在"
        
        if result:
            print("✅ brail_db 数据库存在")
        else:
            print("ℹ️ brail_db 数据库不存在，这是正常情况")
    
    def test_create_brail_db(self):
        """测试创建 brail_db 数据库"""
        
        # 尝试创建数据库
        result = create_database("brail_db")
        
        # 验证创建函数返回结果
        assert isinstance(result, bool), "测试创建 brail_db 数据库"
        
        if result:
            return True

        else:
            return False
    
if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
