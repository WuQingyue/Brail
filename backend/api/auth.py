from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
from models.user import User
from utils.database import get_db
from utils.session import SessionManager, get_session
import re

router = APIRouter()

def get_password_hash(password):
    """生成密码哈希 - 使用 SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password, hashed_password):
    """验证密码"""
    return get_password_hash(plain_password) == hashed_password

def validate_email(email):
    """验证邮箱格式"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_cnpj(cnpj):
    """验证CNPJ格式（巴西企业税号）"""
    # 移除所有非数字字符
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    # CNPJ应该是14位数字
    return len(cnpj) == 14 and cnpj.isdigit()

# 注册接口
@router.post("/register")
async def register(
    request: Request,
    db: Session = Depends(get_db)
    ):
    """用户注册"""
    try:
        user_data = await request.json()
        print("接收到的注册数据:", user_data)  # 添加调试日志

        # 验证必填字段
        required_fields = ['name', 'email', 'password', 'cnpj', 'phone', 'employeeCount', 'monthlyRevenue']
        for field in required_fields:
            if not user_data.get(field):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"缺少必填字段: {field}"
                )

        # 验证邮箱格式
        if not validate_email(user_data.get('email')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱格式不正确"
            )

        # 验证CNPJ格式
        if not validate_cnpj(user_data.get('cnpj')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CNPJ格式不正确，应为14位数字"
            )

        # 验证密码长度
        if len(user_data.get('password')) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密码长度至少6位"
            )

        # 检查邮箱是否已存在
        existing_user = db.query(User).filter(User.email == user_data.get('email')).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="邮箱已被注册"
            )

        # 检查企业名称是否已存在
        existing_name = db.query(User).filter(User.name == user_data.get('name')).first()
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="企业名称已被注册"
            )

        # 检查CNPJ是否已存在
        existing_cnpj = db.query(User).filter(User.cnpj == user_data.get('cnpj')).first()
        if existing_cnpj:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CNPJ已被注册"
            )
        
        # 创建新用户
        user = User(
            name=user_data.get('name'),
            email=user_data.get('email'),
            password=get_password_hash(user_data.get('password')),  # 加密密码
            cnpj=user_data.get('cnpj'),
            phone=user_data.get('phone'),
            employee_count=user_data.get('employeeCount'),
            monthly_revenue=user_data.get('monthlyRevenue'),
            role='user'
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "code": 200,
            "message": "注册成功"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"注册失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )

# 登录接口
@router.post("/login")
async def login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    session: SessionManager = Depends(get_session)
    ):
    """邮箱密码登录"""
    try:
        # 获取登录数据
        user_data = await request.json()
        email = user_data.get('email', '').strip()
        password = user_data.get('password', '')
        
        print(f"接收到的登录请求 - 邮箱: {email}")
        
        # 验证必填字段
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱和密码不能为空"
            )
        
        # 查找用户
        user = db.query(User).filter(User.email == email).first()
        
        # 验证用户是否存在
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
        
        # 验证密码（前端发送的是明文密码，需要哈希后比较）
        hashed_password = get_password_hash(password)
        if hashed_password != user.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )
        
        # 登录成功，设置session
        session.set("user_id", user.id)
        session.set("user_email", user.email)
        session.set("user_name", user.name)
        session.set("login_time", datetime.now().isoformat())
        
        # 保存session
        await session.save_session()
        
        # 设置Cookie
        session.set_session_cookie(session.SESSIONID)
        session.set_customer_code_cookie(user.email)
        session.set_customerid_cookie(str(user.id))
        
        
        return {
            "success": True,
            "code": 200,
            "message": "登录成功",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            } 
        }

    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"登录失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录失败，请稍后重试"
        )
