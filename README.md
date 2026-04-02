# ALFA FITNESS

Современный fitness-сайт с:

- React + Vite + Bootstrap на фронтенде
- Node.js + Express на бэкенде
- MongoDB для регистрации и входа
- расписанием, абонементами, тренерами и картой

## Запуск

1. Установить зависимости:

```bash
npm install
npm run install:all
```

2. Скопировать `server/.env.example` в `server/.env` и указать MongoDB:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/alfafitness
JWT_SECRET=your_secret
```

3. Запустить frontend и backend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`
