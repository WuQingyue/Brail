"""
数据库连接集成测试
测试 database.py 中的数据库连接功能
"""
from database import verify_connection
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
    
if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
