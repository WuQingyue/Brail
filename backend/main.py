import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.config import settings
from database import verify_connection, engine, check_database_exists

# 应用启动时连接数据库
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    if verify_connection():
        print("✅ 数据库连接验证成功")
        # 检查 brail_db 数据库是否存在
        if check_database_exists("brail_db"):
            print("✅ brail_db 数据库存在，应用可以正常使用数据库功能")
        else:
            print("⚠️ brail_db 数据库不存在，请先创建数据库")
            
    else:
        print("❌ 数据库连接验证失败，请检测数据库是否开启并正确配置")
    
    # 应用启动完成
    print("FastAPI 应用启动完成")
    
    yield
    # 关闭时执行（如果需要）
    print("正在关闭 FastAPI 应用...")
    print("✅ 应用已安全关闭")

app = FastAPI(lifespan=lifespan)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)