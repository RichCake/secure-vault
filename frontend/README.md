# Frontend

React Native клиент для работы с хранилищем файлов

## Основные возможности

- вход и регистрация через backend-сессии
- просмотр файлов и папок, навигация по иерархии
- загрузка, переименование, удаление и создание папок
- шаринг файлов с уровнями доступа `read` / `write`
- уведомления об активностях и статусах операций

## Технологии

- Expo + React Native
- Tailwind (nativewind) стили
- Gluestack UI компоненты

## Запуск

1. Установите зависимости:
```bash
npm install
```
2. Запустите приложение:
```bash
npx expo start
```
- Android build: `eas build --platform android --profile development`

## Структура проекта

```
.
├── app
│   ├── (auth)
│   ├── (settings)
│   └── (vault)
├── assets
├── components
├── config
├── constants
├── contexts
├── hooks
└── services
```

- app - UI
- assets - картинки и иконки
- components - кастомные UI элементы
- config - конфигурация API
- constants - цвета
- contexts и hooks - контекты пользователя и уведомлений
- services - бизнес-логика приложения

## Окружение

- Доступ к backend API ()