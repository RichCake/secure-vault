# Backend

FastAPI‑сервис для хранения файлов

## Основные возможности

- регистрация и вход по сессиям
- загрузка файлов в S3 с сохранением метаданных в PostgreSQL
- создание иерархии папок
- предоставление доступа другим пользователям с уровнями `read` / `write`
- поиск по именам файлов и папок
- удаление файлов с одновременным удалением объекта в S3

## Запуск

### 1. БД

Запустите PostgreSQL с помощью docker
```bash
docker compose up -d
```

### 2. Сервер

1. Скопируйте образец `.env.example` и укажите параметры подключения к PostgreSQL и секретный ключ.
2. Добавьте переменные для доступа к S3:
```env
S3_BUCKET_NAME=secure-vault
S3_ENDPOINT_URL=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```
3. Установите зависимости и выполните миграции:
```bash
uv sync
uv run alembic upgrade head
```
4. Запустите сервер
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Архитектура проекта

```
.
├── app
│   ├── auth
│   │   ├── auth.py
│   │   ├── dependencies.py
│   │   ├── models.py
│   │   ├── repository.py
│   │   ├── router.py
│   │   └── schemas.py
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── notifications
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── repository.py
│   │   ├── router.py
│   │   └── schemas.py
│   └── vault
│       ├── models.py
│       ├── repository.py
│       ├── router.py
│       ├── schemas.py
│       └── service.py
└── tests
    ├── integration
    │   └── test_vault_flow.py
    └── unit
        └── auth
            └── test_auth.py
```

- /app/ - директория сервера
- */models.py - модели SQLAlchemy
- */router.py - уровень доступа
- */service.py - уровень сервиса
- */repository.py - уровень БД
- /tests/ - директория тестов

## Модель данных

