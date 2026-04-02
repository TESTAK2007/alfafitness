# ALFAFitness Backend API

Этот каталог содержит изолированную реализацию нового REST API для проекта.

## Быстрый старт

1. Перейдите в каталог:
   ```bash
   cd server/new-backend
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Создайте файл `.env` на основе `.env.example`.
4. Запустите сервер:
   ```bash
   npm start
   ```

## Важное

API работает независимо от существующего frontend-кода и не изменяет текущую проектную структуру.

## Точки входа

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `GET /api/trainers`
- `GET /api/trainers/:id`
- `GET /api/schedule`
- `POST /api/schedule/book`
- `GET /api/memberships`
- `POST /api/memberships/purchase`
