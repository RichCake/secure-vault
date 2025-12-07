import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PG_HOST: str
    PG_PORT: int
    PG_DB_NAME: str
    PG_USER: str
    PG_PASSWORD: str
    SECRET_KEY: str
    S3_BUCKET_NAME: str
    S3_ENDPOINT_URL: str | None = None
    S3_REGION: str | None = None
    S3_ACCESS_KEY: str | None = None
    S3_SECRET_KEY: str | None = None
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    )


settings = Settings()

MEDIA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "media")


def get_db_url():
    return (
        f"postgresql+asyncpg://{settings.PG_USER}:{settings.PG_PASSWORD}@"
        f"{settings.PG_HOST}:{settings.PG_PORT}/{settings.PG_DB_NAME}"
    )
