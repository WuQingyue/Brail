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


def create_tables():
    """创建所有数据库表"""
    try:
        # 导入所有模型以确保它们被注册到 Base.metadata
        from models import User, Category, Cart, CartItem  # 导入所有模型
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
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