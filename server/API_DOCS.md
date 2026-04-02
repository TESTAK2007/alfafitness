# ALFAFitness API Documentation

Base URL: `http://localhost:4000/api`

## Authorization

Для защищённых маршрутов используйте заголовок:

```
Authorization: Bearer <token>
```

Токен выдаётся при успешной авторизации через `POST /api/auth/login` или `POST /api/auth/register`.

---

## Auth

### POST /api/auth/register

Request:
```json
{
  "name": "Ivan Petrov",
  "email": "ivan@example.com",
  "password": "StrongPassword123"
}
```

Response 201:
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "...",
    "name": "Ivan Petrov",
    "email": "ivan@example.com",
    "role": "user"
  }
}
```

Status codes:
- `201` created
- `400` bad request
- `409` email already in use

### POST /api/auth/login

Request:
```json
{
  "email": "ivan@example.com",
  "password": "StrongPassword123"
}
```

Response 200:
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "...",
    "name": "Ivan Petrov",
    "email": "ivan@example.com",
    "role": "user"
  }
}
```

Status codes:
- `200` success
- `400` bad request
- `401` invalid credentials

---

## User

### GET /api/user/profile

Headers:
```
Authorization: Bearer <token>
```

Response 200:
```json
{
  "_id": "...",
  "name": "Ivan Petrov",
  "email": "ivan@example.com",
  "role": "user",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Status codes:
- `200` success
- `401` unauthorized
- `404` user not found

### PUT /api/user/profile

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "name": "Ivan Petrov",
  "email": "new-email@example.com"
}
```

Response 200:
```json
{
  "message": "Profile updated",
  "user": {
    "id": "...",
    "name": "Ivan Petrov",
    "email": "new-email@example.com",
    "role": "user"
  }
}
```

Status codes:
- `200` success
- `400` bad request
- `401` unauthorized
- `404` user not found
- `409` email already in use

---

## Trainers

### GET /api/trainers

Response 200:
```json
[
  {
    "_id": "...",
    "name": "Arman Sadykov",
    "specialization": "Boxing performance",
    "availability": [
      { "day": "Monday", "slots": ["08:00", "10:00"] }
    ]
  }
]
```

Status codes:
- `200` success

### GET /api/trainers/:id

Response 200:
```json
{
  "_id": "...",
  "name": "Arman Sadykov",
  "specialization": "Boxing performance",
  "availability": [
    { "day": "Monday", "slots": ["08:00", "10:00"] }
  ]
}
```

Status codes:
- `200` success
- `404` trainer not found

---

## Schedule

### GET /api/schedule

Response 200:
```json
[
  {
    "trainerId": "...",
    "trainerName": "Arman Sadykov",
    "specialization": "Boxing performance",
    "availability": [
      { "day": "Monday", "slots": ["08:00", "10:00"] }
    ]
  }
]
```

Status codes:
- `200` success

### POST /api/schedule/book

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "trainerId": "...",
  "date": "2026-04-10T18:00:00.000Z"
}
```

Response 201:
```json
{
  "message": "Session booked",
  "booking": {
    "_id": "...",
    "userId": "...",
    "trainerId": "...",
    "date": "2026-04-10T18:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Status codes:
- `201` created
- `400` bad request
- `401` unauthorized

---

## Memberships

### GET /api/memberships

Response 200:
```json
[
  {
    "_id": "...",
    "type": "Starter",
    "price": "$29.99",
    "duration": "1 month"
  }
]
```

Status codes:
- `200` success

### POST /api/memberships/purchase

Headers:
```
Authorization: Bearer <token>
```

Request:
```json
{
  "membershipId": "..."
}
```

Response 201:
```json
{
  "message": "Membership purchased",
  "membership": {
    "_id": "...",
    "type": "Pro",
    "price": "$59.99",
    "duration": "1 month"
  }
}
```

Status codes:
- `201` created
- `400` bad request
- `401` unauthorized
- `404` membership not found
