from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv


load_dotenv()

class Settings(BaseSettings):
    # 应用配置
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # 数据库配置
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/brail_db"
    MYSQL_HOST: Optional[str] = "localhost"
    MYSQL_PORT: Optional[int] = 3306
    MYSQL_USER: Optional[str] = "root"
    MYSQL_PASSWORD: Optional[str] = "123456"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()