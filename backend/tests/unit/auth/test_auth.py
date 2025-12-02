from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.auth.auth import (
    get_password_hash,
    verify_password,
)


class TestPasswordHashing:
    def test_get_password_hash_returns_hash(self):
        password = "mySecurePassword123"
        hashed = get_password_hash(password)

        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed != password
        assert len(hashed) > len(password)

    def test_get_password_hash_different_for_same_password(self):
        password = "mySecurePassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2

    def test_verify_password_correct(self):
        password = "correctPassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        password = "correctPassword123"
        wrong_password = "wrongPassword456"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_password(self):
        password = ""
        hashed = get_password_hash(password)

        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_verify_password_unicode(self):
        password = "пароль🔐中文"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False


class TestCheckAndCreateUser:
    @pytest.mark.asyncio
    async def test_check_and_create_user_success(self):
        from app.auth import auth as auth_service

        mock_user = MagicMock()
        mock_user.id = "user-123"
        mock_user.username = "newuser"

        with patch.object(
            auth_service.repository, "get_user", new=AsyncMock(return_value=None)
        ), patch.object(
            auth_service.repository, "create_user", new=AsyncMock(return_value=mock_user)
        ):
            result = await auth_service.check_and_create_user("newuser", "password123")

            assert result == mock_user
            auth_service.repository.get_user.assert_called_once_with("newuser")
            auth_service.repository.create_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_check_and_create_user_already_exists(self):
        from fastapi import HTTPException

        from app.auth import auth as auth_service

        existing_user = MagicMock()

        with patch.object(
            auth_service.repository, "get_user", new=AsyncMock(return_value=existing_user)
        ):
            with pytest.raises(HTTPException) as exc_info:
                await auth_service.check_and_create_user("existinguser", "password")

            assert exc_info.value.status_code == 400
            assert "already exists" in exc_info.value.detail


class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self):
        from app.auth import auth as auth_service

        mock_user = MagicMock()
        mock_user.hash_password = get_password_hash("correctpassword")

        with patch.object(
            auth_service.repository, "get_user", new=AsyncMock(return_value=mock_user)
        ), patch.object(
            auth_service, "create_session", new=AsyncMock(return_value="session-123")
        ):
            result = await auth_service.login("testuser", "correctpassword")

            assert result == "session-123"

    @pytest.mark.asyncio
    async def test_login_user_not_found(self):
        from fastapi import HTTPException

        from app.auth import auth as auth_service

        with patch.object(
            auth_service.repository, "get_user", new=AsyncMock(return_value=None)
        ):
            with pytest.raises(HTTPException) as exc_info:
                await auth_service.login("nonexistent", "password")

            assert exc_info.value.status_code == 400
            assert "wrong username or password" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_login_wrong_password(self):
        from fastapi import HTTPException

        from app.auth import auth as auth_service

        mock_user = MagicMock()
        mock_user.hash_password = get_password_hash("correctpassword")

        with patch.object(
            auth_service.repository, "get_user", new=AsyncMock(return_value=mock_user)
        ):
            with pytest.raises(HTTPException) as exc_info:
                await auth_service.login("testuser", "wrongpassword")

            assert exc_info.value.status_code == 400


class TestCreateSession:
    @pytest.mark.asyncio
    async def test_create_session_existing(self):
        from app.auth import auth as auth_service

        mock_user = MagicMock()
        mock_session = MagicMock()
        mock_session.id = "existing-session-id"

        with patch.object(
            auth_service.repository, "get_session", new=AsyncMock(return_value=mock_session)
        ):
            result = await auth_service.create_session(mock_user)

            assert result == "existing-session-id"

    @pytest.mark.asyncio
    async def test_create_session_new(self):
        from app.auth import auth as auth_service

        mock_user = MagicMock()
        mock_new_session = MagicMock()
        mock_new_session.id = "new-session-id"

        with patch.object(
            auth_service.repository, "get_session", new=AsyncMock(return_value=None)
        ), patch.object(
            auth_service.repository, "create_session", new=AsyncMock(return_value=mock_new_session)
        ):
            result = await auth_service.create_session(mock_user)

            assert result == "new-session-id"
            auth_service.repository.create_session.assert_called_once_with(mock_user)

