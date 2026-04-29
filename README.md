# AI Angular + PostgreSQL Broadcast Message

A minimal full-stack app for real-time broadcast messaging with message persistence.

## Stack
- **Frontend**: Angular standalone app (`frontend/`)
- **Backend**: Node.js + Express + WebSocket (`backend/`)
- **Database**: PostgreSQL (`docker-compose.yml`)

## Features
- Real-time message broadcast over WebSocket (`/ws`)
- REST API for listing and creating messages (`GET /messages`, `POST /messages`)
- Automatic message persistence in PostgreSQL
- Basic connection/error handling in the Angular UI

## Quick start
1. Start PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```
2. Start backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Start frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

Backend runs at `http://localhost:3000`; frontend runs at `http://localhost:4200` (Vite default).
