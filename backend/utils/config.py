from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from dotenv import load_dotenv


load_dotenv()

class Settings(BaseSettings):
    # 应用配置
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    
    # 数据库配置
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/brail_db"
    MYSQL_HOST: Optional[str] = "localhost"
    MYSQL_PORT: Optional[int] = 3306
    MYSQL_USER: Optional[str] = "root"
    MYSQL_PASSWORD: Optional[str] = "123456"

    # Redis配置
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB: int
    REDIS_PASSWORD: Optional[str]
    
    # Session配置
    SESSION_SECRET_KEY: str
    SESSION_EXPIRE_SECONDS: int
    SESSION_COOKIE_DOMAIN: Optional[str]
    SESSION_COOKIE_SECURE: bool
    SESSION_COOKIE_SAMESITE: str
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

settings = Settings()