# Advanced Real-Time Chat Application (Starter)

This repository now includes a production-style foundation for your requested platform.

## Implemented in this phase

- JWT authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`)
- Refresh-token rotation with DB persistence
- Protected APIs via bearer auth middleware
- MongoDB models for users, conversations, messages, refresh tokens
- Message encryption at rest (AES-256-CBC)
- One-to-one and group-ready conversations
- Paginated message history
- Message search (text index)
- Edit/delete message endpoints
- Seen status endpoint + socket seen events
- Realtime presence + typing indicators + message broadcast via Socket.IO
- User search + profile update endpoints
- Rate limiting + Helmet + Morgan + CORS setup
- Optional Redis adapter support for Socket.IO scaling
- Docker and docker-compose baseline
- React client with:
  - Login/register
  - Persistent auth using Zustand
  - Axios refresh-token interceptor
  - User search + create direct chat
  - Conversation list + paginated messages
  - Typing indicator + presence updates
  - Emoji quick insert
  - Dark/light mode toggle

## Run locally

1. Copy `.env.example` to `.env` and set secure secrets.
2. Start MongoDB and Redis locally (or use Docker).
3. Install dependencies:
   - `npm install`
   - `npm install --prefix client`
4. Run both server and client:
   - `npm run dev`

For reliable WebRTC calls across different networks, create `client/.env` from `client/.env.example` and set TURN credentials.

Server: `http://localhost:3001`
Client: `http://localhost:5173`

## Docker

1. Create `.env` from `.env.example`.
2. Run:
   - `docker compose up --build`

## Next implementation blocks

1. Google OAuth and social login linking
2. Media upload pipeline (Cloudinary + multer)
3. Push notifications
4. Voice messages and WebRTC video calls
5. Group admin controls and moderation
6. Message delivery receipts persisted server-side
7. End-to-end encryption upgrade strategy
