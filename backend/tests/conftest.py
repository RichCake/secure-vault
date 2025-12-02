import asyncio
from collections.abc import AsyncGenerator, Generator

from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import Base
from app.main import app


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_s3_storage() -> MagicMock:
    mock = MagicMock()
    mock.upload_fileobj = AsyncMock(return_value=None)
    mock.delete_object = AsyncMock(return_value=None)
    mock.get_presigned_url = MagicMock(return_value="https://example.com/file")
    return mock

