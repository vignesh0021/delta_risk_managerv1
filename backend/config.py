from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DELTA_API_KEY: str = ""
    DELTA_API_SECRET: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./delta_risk_manager.db"
    JWT_SECRET: str = "change-this-in-production-to-a-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    DELTA_REST_URL: str = "https://api.india.delta.exchange"
    DELTA_WS_URL: str = "wss://socket.india.delta.exchange"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
