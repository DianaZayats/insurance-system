# Hybrid Setup Guide

This project uses a hybrid setup where:
- **Database**: Oracle runs in Docker (via docker-compose)
- **Backend**: Node/Express runs locally on the host
- **Frontend**: Vue 3 + Vite runs locally on the host

## Prerequisites

- Docker and Docker Compose installed
- Node.js (v16 or higher) installed
- npm or yarn package manager

## Initial Setup

### 1. Install Dependencies

From the root directory:

```bash
npm run install:all
```

This will install dependencies for:
- Root package.json (orchestration scripts)
- Backend
- Frontend

### 2. Set Up Environment Variables

#### Backend

Create `backend/.env` file (see `ENV_SETUP.md` for template):

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_USER=INSURANCE_USER
DB_PASSWORD=Insurance123
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

#### Frontend

Create `frontend/.env` file:

```env
VITE_API_BASE=http://localhost:3000
```

For production, create `frontend/.env.production`:

```env
VITE_API_BASE=http://localhost:3000
```

### 3. Start the Database

```bash
npm run db:up
```

This starts the Oracle database in Docker. The first run will:
- Initialize the database
- Run initialization scripts from `database/` directory
- Seed initial data

Subsequent runs will reuse the persisted data from the Docker volume.

### 4. Verify Database is Running

```bash
npm run db:logs
```

Wait until you see the database is ready and healthy.

## Running the Application

### Development Mode

Run both backend and frontend in development mode:

```bash
npm run dev
```

This will:
- Start backend with nodemon (auto-reload on changes)
- Start frontend with Vite dev server (hot module replacement)

Or run them separately:

```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend
npm run frontend:dev
```

### Production Mode

Build and run in production mode:

```bash
npm run prod
```

This will:
- Start backend with regular Node.js
- Build frontend and serve with Vite preview

Or run them separately:

```bash
# Terminal 1 - Backend
npm run backend:prod

# Terminal 2 - Frontend
npm run frontend:prod
```

## Available Scripts

### Root Level Scripts

- `npm run dev` - Run both backend and frontend in dev mode
- `npm run prod` - Run both backend and frontend in prod mode
- `npm run backend:dev` - Run backend in dev mode (nodemon)
- `npm run backend:prod` - Run backend in prod mode
- `npm run frontend:dev` - Run frontend in dev mode (Vite)
- `npm run frontend:prod` - Run frontend in prod mode (build + preview)
- `npm run db:up` - Start Oracle database
- `npm run db:down` - Stop Oracle database
- `npm run db:logs` - View database logs
- `npm run install:all` - Install all dependencies

### Backend Scripts

- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start with regular Node.js

### Frontend Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run prod` - Build and preview

## Architecture

### Database Connection

The backend connects to Oracle using a host connection string:
```
localhost:1521/XE
```

This works because:
1. Docker exposes port 1521 to the host
2. Backend runs on the host and connects via localhost
3. No need for Docker networking between backend and database

### Frontend API Configuration

The frontend uses Vite environment variables (prefixed with `VITE_`) to configure the API base URL. The Vite dev server proxies `/api` requests to the backend.

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check database is up: `npm run db:logs`
3. Verify port 1521 is not in use by another service
4. Check backend `.env` has correct connection details

### Frontend Can't Connect to Backend

1. Verify backend is running on port 3000
2. Check `frontend/.env` has correct `VITE_API_BASE`
3. Ensure CORS is configured in backend (already set to allow all origins)

### Port Conflicts

- Backend default: 3000
- Frontend default: 8080
- Database: 1521 (SQL*Net), 5500 (Enterprise Manager)

Change ports in respective configuration files if needed.

