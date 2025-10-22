import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.config import settings
from database import verify_connection, engine

# 应用启动时连接数据库
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("正在启动 FastAPI 应用...")
    
    # 验证数据库连接
    print("正在验证数据库连接...")
    if verify_connection():
        print("✅ 数据库连接验证成功")
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