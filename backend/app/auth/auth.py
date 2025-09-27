import secrets
import hashlib
from datetime import datetime, timedelta

from app.auth import errors, repository


def hash_password(password: str) -> str:
    """Хеширует пароль с использованием SHA-256 и соли"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{password_hash}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Проверяет пароль против хеша"""
    try:
        salt, password_hash = hashed_password.split(":")
        return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
    except ValueError:
        return False


def generate_session_id() -> str:
    """Генерирует уникальный ID сессии"""
    return secrets.token_urlsafe(32)


async def check_and_create_user(username: str, password: str):
    """Проверяет существование пользователя и создает нового с хешированным паролем"""
    if await repository.user_exists(username):
        raise errors.UserAlreadyExists()
    
    hashed_password = hash_password(password)
    await repository.create_user(username, hashed_password)


async def check_password(username: str, password: str) -> bool:
    """Проверяет пароль пользователя"""
    user = await repository.get_user_by_username(username)
    if not user:
        return False
    
    return verify_password(password, user.hash_password)


async def create_session(username: str) -> str:
    """Создает новую сессию для пользователя"""
    user = await repository.get_user_by_username(username)
    if not user:
        raise errors.UserNotFound()
    
    # Удаляем старые сессии пользователя
    await repository.delete_user_sessions(user.id)
    
    # Создаем новую сессию
    session_id = generate_session_id()
    expires_at = datetime.utcnow() + timedelta(days=7)  # Сессия действует 7 дней
    
    await repository.create_session(session_id, user.id, expires_at)
    return session_id


async def delete_session(session_id: str):
    """Удаляет сессию по ID"""
    if session_id:
        await repository.delete_session(session_id)


async def check_session(session_id: str) -> bool:
    """Проверяет валидность сессии"""
    if not session_id:
        return False
    
    session = await repository.get_session(session_id)
    if not session:
        return False
    
    # Проверяем, не истекла ли сессия
    if session.expires_at < datetime.utcnow():
        await repository.delete_session(session_id)
        return False
    
    return True


async def get_user_from_session(session_id: str):
    """Получает пользователя по ID сессии"""
    if not session_id:
        return None
    
    session = await repository.get_session(session_id)
    if not session or session.expires_at < datetime.utcnow():
        return None
    
    return session.user
