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


def init_users_data():
    """初始化 users 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.user import User
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("[WARNING] 未找到 fixtures/mock-data.json 文件，跳过用户数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        users_data = data.get('users', [])
        
        if not users_data:
            print("[WARNING]  mock-data.json 中没有 users 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有用户数据
            existing_count = db.query(User).count()
            
            if existing_count > 0:
                print(f"[OK] 用户数据已存在 ({existing_count} 个用户)，跳过初始化")
                return
            
            # 插入用户数据
            print(f"[INFO] 正在初始化 {len(users_data)} 个用户...")
            for user_data in users_data:
                user = User(
                    id=user_data['id'],
                    name=user_data['name'],
                    email=user_data['email'],
                    password=user_data['password'],
                    cnpj=user_data.get('cnpj'),
                    employee_count=user_data.get('employee_count'),
                    monthly_revenue=user_data.get('monthly_revenue'),
                    phone=user_data.get('phone'),
                    role=user_data.get('role', 'user')
                )
                db.add(user)
            
            db.commit()
            print(f"[OK] 成功初始化 {len(users_data)} 个用户")
            
        except Exception as e:
            print(f"[ERROR] 初始化用户数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] 读取用户数据失败: {str(e)}")


def init_categories_data():
    """初始化 categories 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.category import Category
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("[WARNING]  未找到 fixtures/mock-data.json 文件，跳过分类数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        categories_data = data.get('categories', [])
        
        if not categories_data:
            print("[WARNING]  mock-data.json 中没有 categories 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有分类数据
            existing_count = db.query(Category).count()
            
            if existing_count > 0:
                print(f"[OK] 分类数据已存在 ({existing_count} 个分类)，跳过初始化")
                return
            
            # 插入分类数据
            print(f"[INFO] 正在初始化 {len(categories_data)} 个分类...")
            for cat_data in categories_data:
                category = Category(
                    id=cat_data['id'],
                    name=cat_data['name'],
                    icon=cat_data.get('icon'),
                    description=cat_data.get('description')
                )
                db.add(category)
            
            db.commit()
            print(f"[OK] 成功初始化 {len(categories_data)} 个分类")
            
        except Exception as e:
            print(f"[ERROR] 初始化分类数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] 读取分类数据失败: {str(e)}")


def init_suppliers_data():
    """初始化 suppliers 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.supplier import Supplier
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("[WARNING]  未找到 fixtures/mock-data.json 文件，跳过供应商数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        suppliers_data = data.get('suppliers', [])
        
        if not suppliers_data:
            print("[WARNING]  mock-data.json 中没有 suppliers 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有供应商数据
            existing_count = db.query(Supplier).count()
            
            if existing_count > 0:
                print(f"[OK] 供应商数据已存在 ({existing_count} 个供应商)，跳过初始化")
                return
            
            # 插入供应商数据
            print(f"[INFO] 正在初始化 {len(suppliers_data)} 个供应商...")
            for sup_data in suppliers_data:
                supplier = Supplier(
                    id=sup_data['id'],
                    name=sup_data['company_name'],
                    location=sup_data['location']
                )
                db.add(supplier)
            
            db.commit()
            print(f"[OK] 成功初始化 {len(suppliers_data)} 个供应商")
            
        except Exception as e:
            print(f"[ERROR] 初始化供应商数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] 读取供应商数据失败: {str(e)}")


def init_products_data():
    """初始化 products 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from models.product import Product
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("[WARNING]  未找到 fixtures/mock-data.json 文件，跳过产品数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        products_data = data.get('products', [])
        
        if not products_data:
            print("[WARNING]  mock-data.json 中没有 products 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有产品数据
            existing_count = db.query(Product).count()
            
            if existing_count > 0:
                print(f"[OK] 产品数据已存在 ({existing_count} 个产品)，跳过初始化")
                return
            
            # 插入产品数据
            print(f"[INFO] 正在初始化 {len(products_data)} 个产品...")
            for prod_data in products_data:
                product = Product(
                    id=prod_data['id'],
                    title=prod_data['title'],
                    description=prod_data.get('description'),
                    img=prod_data.get('img'),
                    product_mlb_thumbnail=prod_data.get('product_mlb_thumbnail'),
                    category_id=prod_data['category_id'],
                    supplier_id=prod_data['supplier_id'],
                    shipping_from=prod_data.get('shipping_from'),
                    weight=prod_data.get('weight'),
                    dimensions=prod_data.get('dimensions'),
                    moq=prod_data.get('moq', 1),
                    tags=prod_data.get('tags'),
                    stock_quantity=prod_data.get('stock_quantity', 0),
                    reserved_quantity=prod_data.get('reserved_quantity', 0),
                    low_stock_threshold=prod_data.get('low_stock_threshold', 10),
                    max_order_quantity=prod_data.get('max_order_quantity'),
                    cost_price=prod_data.get('cost_price'),
                    selling_price=prod_data['selling_price'],
                    discount_price=prod_data.get('discount_price'),
                    product_mlb_price=prod_data.get('product_mlb_price'),
                    roi=prod_data.get('roi'),
                    variations=prod_data.get('variations')  # 添加 variations 字段
                )
                db.add(product)
            
            db.commit()
            print(f"[OK] 成功初始化 {len(products_data)} 个产品") 
            
        except Exception as e:
            print(f"[ERROR] 初始化产品数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] 读取产品数据失败: {str(e)}")


def init_orders_data():
    """初始化 orders 表数据（如果 mock-data.json 中有数据）"""
    try:
        import json
        import os
        from datetime import datetime
        from models.order import Order, OrderItem
        
        # 检查 mock-data.json 文件是否存在
        mock_data_path = 'fixtures/mock-data.json'
        if not os.path.exists(mock_data_path):
            print("[WARNING]  未找到 fixtures/mock-data.json 文件，跳过订单数据初始化")
            return
        
        # 读取 mock 数据
        with open(mock_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        orders_data = data.get('orders', [])
        
        if not orders_data:
            print("[WARNING]  mock-data.json 中没有 orders 数据，跳过初始化")
            return
        
        # 获取数据库会话
        db = SessionLocal()
        
        try:
            # 检查是否已有订单数据
            existing_count = db.query(Order).count()
            
            if existing_count > 0:
                print(f"[OK] 订单数据已存在 ({existing_count} 个订单)，跳过初始化")
                return
            
            # 插入订单数据
            print(f"[INFO] 正在初始化 {len(orders_data)} 个订单...")
            for order_data in orders_data:
                # 解析订单日期
                order_date = None
                if order_data.get('order_date'):
                    try:
                        order_date = datetime.fromisoformat(order_data['order_date'].replace('T', ' '))
                    except:
                        pass
                
                # 创建订单
                order = Order(
                    id=order_data['id'],
                    user_id=order_data['user_id'],
                    status=order_data['status'],
                    status_step=order_data.get('status_step', 1),
                    status_text=order_data.get('status_text'),
                    status_detail_text=order_data.get('status_detail_text'),
                    customer_name=order_data['customer_name'],
                    total_amount=order_data['total_amount'],
                    shipping_street=order_data.get('shipping_street'),
                    shipping_city=order_data.get('shipping_city'),
                    shipping_zipcode=order_data.get('shipping_zipcode'),
                    payment_method=order_data.get('payment_method'),
                    notes=order_data.get('notes'),
                    order_date=order_date
                )
                db.add(order)
                db.flush()  # 获取订单ID
                
                # 创建订单商品
                items_data = order_data.get('items', [])
                for item_data in items_data:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=item_data['product_id'],
                        product_name=item_data['product_name'],
                        product_image=item_data.get('product_image'),
                        quantity=item_data['quantity'],
                        price=item_data['price']
                    )
                    db.add(order_item)
            
            db.commit()
            print(f"[OK] 成功初始化 {len(orders_data)} 个订单")
            
        except Exception as e:
            print(f"[ERROR] 初始化订单数据失败: {str(e)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"[ERROR] 读取订单数据失败: {str(e)}")


def create_tables():
    """创建所有数据库表""" 
    try:
        # 导入所有模型以确保它们被注册到 Base.metadata
        from models import User, Category, Cart, CartItem, Supplier, Product, Order, OrderItem  # 导入所有模型
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("[OK] 数据库表创建成功")
        
        # 初始化 users 数据（如果有）
        init_users_data()
        
        # 初始化 categories 数据（如果有）
        init_categories_data()
        
        # 初始化 suppliers 数据（如果有）
        init_suppliers_data()
        
        # 初始化 products 数据（如果有）
        init_products_data()
        
        # 初始化 orders 数据（如果有）
        init_orders_data()
        
        return True
        
    except Exception as e:
        print(f"[ERROR] 创建数据库表时发生错误: {e}")
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
        print(f"[ERROR] 创建数据库和表时发生错误: {e}")
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