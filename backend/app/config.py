import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PG_HOST: str
    PG_PORT: int
    PG_DB_NAME: str
    PG_USER: str
    PG_PASSWORD: str
    SECRET_KEY: str
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    )


settings = Settings()


def get_db_url():
    return (
        f"postgresql+asyncpg://{settings.PG_USER}:{settings.PG_PASSWORD}@"
        f"{settings.PG_HOST}:{settings.PG_PORT}/{settings.PG_DB_NAME}"
    )
