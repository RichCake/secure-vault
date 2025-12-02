import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_auth_user
from app.main import app


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = uuid.uuid4()
    user.username = "testuser"
    user.hash_password = "$2b$12$mockhash"
    return user


@pytest.fixture
def mock_session():
    session = MagicMock()
    session.id = str(uuid.uuid4())
    return session


@pytest.fixture
def authenticated_app(mock_user):
    async def override_get_auth_user():
        return mock_user
    
    app.dependency_overrides[get_auth_user] = override_get_auth_user
    yield app
    app.dependency_overrides.clear()


@pytest.mark.asyncio
class TestAuthEndpoints:

    async def test_register_endpoint(self, mock_user, mock_session):
        with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=None)), \
             patch("app.auth.auth.repository.create_user", new=AsyncMock(return_value=mock_user)), \
             patch("app.auth.auth.repository.get_session", new=AsyncMock(return_value=None)), \
             patch("app.auth.auth.repository.create_session", new=AsyncMock(return_value=mock_session)):

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/auth/register",
                    json={"username": "newuser", "password": "securepass123"}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["username"] == "newuser"
                assert "Authorization" in response.cookies

    async def test_register_existing_user(self, mock_user):
        with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=mock_user)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/auth/register",
                    json={"username": "existing", "password": "password123"}
                )

                assert response.status_code == 400
                assert "already exists" in response.json()["detail"]

    async def test_login_endpoint(self, mock_user, mock_session):
        from app.auth.auth import get_password_hash

        mock_user.hash_password = get_password_hash("correctpassword")

        with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=mock_user)), \
             patch("app.auth.auth.repository.get_session", new=AsyncMock(return_value=None)), \
             patch("app.auth.auth.repository.create_session", new=AsyncMock(return_value=mock_session)):

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/auth/login",
                    json={"username": "testuser", "password": "correctpassword"}
                )

                assert response.status_code == 200
                assert "Authorization" in response.cookies

    async def test_login_wrong_password(self, mock_user):
        from app.auth.auth import get_password_hash

        mock_user.hash_password = get_password_hash("correctpassword")

        with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=mock_user)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/auth/login",
                    json={"username": "testuser", "password": "wrongpassword"}
                )

                assert response.status_code == 400
                assert "wrong username or password" in response.json()["detail"]

    async def test_login_user_not_found(self):
        with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=None)):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/auth/login",
                    json={"username": "nonexistent", "password": "password"}
                )

                assert response.status_code == 400
                assert "wrong username or password" in response.json()["detail"]

    async def test_logout_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/auth/logout")

            assert response.status_code == 200
            assert response.json()["status"] == "logged out"


@pytest.mark.asyncio
class TestProtectedEndpoints:
    async def test_me_endpoint_authenticated(self, authenticated_app, mock_user):
        transport = ASGITransport(app=authenticated_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/me")

            assert response.status_code == 200
            assert response.json()["username"] == mock_user.username

    async def test_me_endpoint_unauthenticated(self):
        async def override_no_auth():
            return None
        
        app.dependency_overrides[get_auth_user] = override_no_auth
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/me")
                assert response.status_code == 401
        finally:
            app.dependency_overrides.clear()

    async def test_get_file_not_found(self, authenticated_app, mock_user):
        with patch("app.vault.repository.get_node_for_user", new=AsyncMock(return_value=None)):
            transport = ASGITransport(app=authenticated_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/vault/files/{uuid.uuid4()}")

                assert response.status_code == 404
                assert response.json()["detail"] == "File not found"

    async def test_delete_file_not_found(self, authenticated_app, mock_user):
        with patch("app.vault.repository.get_node_by_id", new=AsyncMock(return_value=None)):
            transport = ASGITransport(app=authenticated_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/vault/files/{uuid.uuid4()}")

                assert response.status_code == 404


@pytest.mark.asyncio
class TestCompleteWorkflow:
    async def test_auth_flow_register_login_logout(self, mock_user, mock_session):
        from app.auth.auth import get_password_hash

        mock_user.hash_password = get_password_hash("testpassword123")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=None)), \
                 patch("app.auth.auth.repository.create_user", new=AsyncMock(return_value=mock_user)), \
                 patch("app.auth.auth.repository.get_session", new=AsyncMock(return_value=None)), \
                 patch("app.auth.auth.repository.create_session", new=AsyncMock(return_value=mock_session)):

                response = await client.post(
                    "/auth/register",
                    json={"username": "workflowuser", "password": "testpassword123"}
                )
                assert response.status_code == 200
                assert "Authorization" in response.cookies
                cookies = response.cookies

            with patch("app.auth.auth.repository.get_user", new=AsyncMock(return_value=mock_user)), \
                 patch("app.auth.auth.repository.get_session", new=AsyncMock(return_value=None)), \
                 patch("app.auth.auth.repository.create_session", new=AsyncMock(return_value=mock_session)):

                response = await client.post(
                    "/auth/login",
                    json={"username": "workflowuser", "password": "testpassword123"}
                )
                assert response.status_code == 200
                cookies = response.cookies

            with patch("app.auth.auth.check_session", new=AsyncMock(return_value=mock_user)):
                app.dependency_overrides[get_auth_user] = lambda: mock_user
                try:
                    response = await client.get("/me", cookies=cookies)
                    assert response.status_code == 200
                    assert response.json()["username"] == mock_user.username
                finally:
                    app.dependency_overrides.clear()

            response = await client.post("/auth/logout", cookies=cookies)
            assert response.status_code == 200
            assert response.json()["status"] == "logged out"
