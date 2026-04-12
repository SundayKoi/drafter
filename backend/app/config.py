from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://drafter_app:devpass@localhost:5432/ember_drafter"
    MIGRATION_DATABASE_URL: str = "postgresql+asyncpg://drafter_migrate:devpass@localhost:5432/ember_drafter"
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    DISCORD_WEBHOOK_URL: str = ""
    # Site auth / Discord OAuth (ember-site). Safe empty defaults; prod values come from .env.
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8
    OAUTH_STATE_EXPIRE_SECONDS: int = 600
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_REDIRECT_URI: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
