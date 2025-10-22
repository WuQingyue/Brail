from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv


load_dotenv()

class Settings(BaseSettings):
    # 应用配置
    FRONTEND_URL: str
    BACKEND_URL: str
    
    # 数据库配置
    DATABASE_URL: str
    MYSQL_HOST: Optional[str] = None
    MYSQL_PORT: Optional[int] = None
    MYSQL_USER: Optional[str] = None
    MYSQL_PASSWORD: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()