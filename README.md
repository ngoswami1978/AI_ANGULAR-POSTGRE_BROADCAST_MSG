# AI Angular Broadcast Message (Angular-only)

A minimal Angular app that handles broadcast messaging without a separate backend service.

## Stack
- **Frontend + Backend logic**: Angular standalone app (`frontend/`)
- **Persistence**: Browser `localStorage`
- **Real-time cross-tab broadcast**: Browser `BroadcastChannel`

## Features
- Send and list messages in the Angular app
- Broadcast new messages across open browser tabs
- Persist up to 100 recent messages in local storage
- No Node/Express backend required

## Quick start
1. Start the Angular app:
   ```bash
   cd frontend
   npm install
   npm start
   ```
2. Open `http://localhost:4200` in one or more tabs.

> The previous `backend/` service is no longer required for running the app.
