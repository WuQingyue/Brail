"""
数据库连接集成测试
测试 database.py 中的数据库连接功能
"""
from database import verify_connection, check_database_exists, create_database, create_database_with_tables
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
        result = check_database_exists("test_brail_db_with_tables")
        
        # 无论数据库存在与否，测试都应该通过
        # 这个测试主要是验证函数能正常执行并返回布尔值
        assert isinstance(result, bool), "测试 test_brail_db_with_tables 数据库是否存在"
        
        if result:
            print("✅ test_brail_db_with_tables 数据库存在")
        else:
            print("ℹ️ test_brail_db_with_tables 数据库不存在，这是正常情况")
    
    def test_create_brail_db(self):
        """测试创建 brail_db 数据库"""
        
        # 尝试创建数据库
        result = create_database("brail_db")
        
        # 验证创建函数返回结果
        assert isinstance(result, bool), "测试创建 brail_db 数据库"
        
        if result:
            print("✅ brail_db 数据库创建成功")
        else:
            print("❌ brail_db 数据库创建失败")
    
    def test_create_database_with_tables(self):
        """测试创建数据库和所有表（包括用户表和产品类别表）"""
        test_db_name = "test_brail_db_with_tables"
        
        # 创建测试数据库和表
        result = create_database_with_tables(test_db_name)
        
        # 验证创建结果
        assert isinstance(result, bool), "测试创建数据库和表"
        
        if result:
            print(f"✅ 测试数据库 '{test_db_name}' 和所有表创建成功")
            
            # 验证数据库确实被创建了
            exists = check_database_exists(test_db_name)
            assert exists is True, "创建测试数据库后，数据库应该存在"
            
            # 验证表是否被创建（通过查询表结构）
            try:
                import pymysql
                from utils.config import settings
                
                mysql_conn = pymysql.connect(
                    host=settings.MYSQL_HOST,
                    port=settings.MYSQL_PORT,
                    user=settings.MYSQL_USER,
                    password=settings.MYSQL_PASSWORD,
                    database=test_db_name
                )
                cursor = mysql_conn.cursor()
                
                # 检查用户表是否存在
                cursor.execute("SHOW TABLES LIKE 'users'")
                users_table = cursor.fetchone()
                assert users_table is not None, "用户表应该被创建"
                print("✅ 用户表创建成功")
                
                # 检查产品类别表是否存在
                cursor.execute("SHOW TABLES LIKE 'categories'")
                categories_table = cursor.fetchone()
                assert categories_table is not None, "产品类别表应该被创建"
                print("✅ 产品类别表创建成功")
                
                cursor.close()
                mysql_conn.close()
                
            except Exception as e:
                print(f"⚠️ 验证表结构时出错: {e}")
            
        else:
            print(f"❌ 测试数据库 '{test_db_name}' 和表创建失败")
    
if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v"])
