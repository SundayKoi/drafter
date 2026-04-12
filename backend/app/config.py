from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://drafter_app:devpass@localhost:5432/ember_drafter"
    MIGRATION_DATABASE_URL: str = "postgresql+asyncpg://drafter_migrate:devpass@localhost:5432/ember_drafter"
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    DISCORD_WEBHOOK_URL: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
