"""
数据库连接和 ORM 配置
使用 SQLAlchemy ORM 连接 MySQL 数据库
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from utils.config import settings
import pymysql

# 安装 pymysql 作为 MySQLdb 的替代
pymysql.install_as_MySQLdb()

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # 不显示 SQL 语句
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_recycle=300  # 连接回收时间（秒）
)

# 创建 Base 类
Base = declarative_base()

# 数据库连接验证
def verify_connection():
    """验证 MySQL 服务器连接（不连接特定数据库）"""
    try:
        import os
        
        # 连接到 MySQL 服务器（不指定数据库）
        mysql_conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD
        )
        
        # 执行简单查询验证连接
        cursor = mysql_conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        mysql_conn.close()
        return True
    except Exception as e:
        return False


def check_database_exists(database_name="brail_db"):
    """检查指定的数据库是否存在"""
    try:
        # 连接到 MySQL 服务器（不指定数据库）
        mysql_conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD
        )
        
        cursor = mysql_conn.cursor()
        
        # 查询数据库是否存在
        cursor.execute("SHOW DATABASES LIKE %s", (database_name,))
        result = cursor.fetchone()
        
        cursor.close()
        mysql_conn.close()
        
        if result:
            return True
        else:
            return False
            
    except Exception as e:
        print(f"检查数据库 '{database_name}' 时发生错误: {e}")
        return False


def create_database(database_name="brail_db", charset="utf8mb4", collate="utf8mb4_unicode_ci"):
    """创建指定的数据库"""
    try:
        # 连接到 MySQL 服务器（不指定数据库）
        mysql_conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD
        )
        
        cursor = mysql_conn.cursor()
        
        # 创建数据库
        create_sql = f"CREATE DATABASE IF NOT EXISTS `{database_name}` CHARACTER SET {charset} COLLATE {collate}"
        cursor.execute(create_sql)
        
        # 提交更改
        mysql_conn.commit()
        
        cursor.close()
        mysql_conn.close()
        return True
        
    except Exception as e:
        return False


def init_categories_data():
    """初始化 categories 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.category import Category
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("⚠️  未找到 fixtures/mock-data.json 文件，跳过分类数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        categories_data = data.get('categories', [])
        
        if not categories_data:
            print("⚠️  mock-data.json 中没有 categories 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有分类数据
            existing_count = db.query(Category).count()
            
            if existing_count > 0:
                print(f"✅ 分类数据已存在 ({existing_count} 个分类)，跳过初始化")
                return
            
            # 插入分类数据
            print(f"💾 正在初始化 {len(categories_data)} 个分类...")
            for cat_data in categories_data:
                category = Category(
                    id=cat_data['id'],
                    name=cat_data['name'],
                    icon=cat_data.get('icon'),
                    description=cat_data.get('description')
                )
                db.add(category)
            
            db.commit()
            print(f"✅ 成功初始化 {len(categories_data)} 个分类")
            
        except Exception as e:
            print(f"❌ 初始化分类数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ 读取分类数据失败: {str(e)}")


def init_suppliers_data():
    """初始化 suppliers 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.supplier import Supplier
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("⚠️  未找到 fixtures/mock-data.json 文件，跳过供应商数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        suppliers_data = data.get('suppliers', [])
        
        if not suppliers_data:
            print("⚠️  mock-data.json 中没有 suppliers 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有供应商数据
            existing_count = db.query(Supplier).count()
            
            if existing_count > 0:
                print(f"✅ 供应商数据已存在 ({existing_count} 个供应商)，跳过初始化")
                return
            
            # 插入供应商数据
            print(f"💾 正在初始化 {len(suppliers_data)} 个供应商...")
            for sup_data in suppliers_data:
                supplier = Supplier(
                    id=sup_data['id'],
                    name=sup_data['company_name'],
                    location=sup_data['location']
                )
                db.add(supplier)
            
            db.commit()
            print(f"✅ 成功初始化 {len(suppliers_data)} 个供应商")
            
        except Exception as e:
            print(f"❌ 初始化供应商数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ 读取供应商数据失败: {str(e)}")


def create_tables():
    """创建所有数据库表""" 
    try:
        # 导入所有模型以确保它们被注册到 Base.metadata
        from models import User, Category, Cart, CartItem, Supplier  # 导入所有模型
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("✅ 数据库表创建成功")
        
        # 初始化 categories 数据（如果有）
        init_categories_data()
        
        # 初始化 suppliers 数据（如果有）
        init_suppliers_data()
        
        return True
        
    except Exception as e:
        print(f"❌ 创建数据库表时发生错误: {e}")
        return False


def create_database_with_tables(database_name="brail_db", charset="utf8mb4", collate="utf8mb4_unicode_ci"):
    """创建数据库并创建所有表"""
    try:
        # 先创建数据库
        if not create_database(database_name, charset, collate):
            return False
        
        # 创建表
        if not create_tables():
            return False
        return True
        
    except Exception as e:
        print(f"❌ 创建数据库和表时发生错误: {e}")
        return False


from sqlalchemy.orm import sessionmaker
# 创建SessionLocal类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建数据库会话
def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 