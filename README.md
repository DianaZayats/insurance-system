# Insurance Agents Work Accounting Information System

A full-stack web application for managing insurance business data with Oracle database, Node.js/Express backend, and Vue 3 + Vite frontend.

## Architecture

This project uses a **hybrid setup**:
- **Database**: Oracle runs in Docker (via docker-compose)
- **Backend**: Node.js/Express runs locally on the host
- **Frontend**: Vue 3 + Vite runs locally on the host

## Project Structure

```
.
├── database/          # Oracle database scripts
│   ├── schema.sql     # Database schema, constraints, triggers
│   └── seed.sql       # Demo data
├── backend/           # Node.js/Express API
│   ├── src/
│   └── package.json
├── frontend/          # Vue 3 + Vite application
│   ├── src/
│   └── package.json
├── docs/              # Documentation
│   └── archive/       # Old setup/troubleshooting docs
├── docker-compose.yml # Oracle DB only
└── package.json       # Root orchestration scripts
```

## Features

- **Database**: Oracle with business logic in triggers/procedures
- **Backend**: REST API with JWT authentication and RBAC
- **Frontend**: Vue 3 + Vite with Vuex state management
- **Reports**: 6 analytical reports with CSV export
- **Business Rules**: Auto-calculations, contract uplift rules, validation

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Set Up Environment Variables

See [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) for detailed instructions.

**Backend** (`backend/.env`):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_USER=INSURANCE_USER
DB_PASSWORD=Insurance123
JWT_SECRET=your-secret-key
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE=http://localhost:3000
```

### 3. Start Database

```bash
npm run db:up
```

### 4. Run Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run prod
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api/v1

### Default Credentials

- **Admin**: admin@insurance.com / admin
- **Agent**: agent1@insurance.com / admin
- **Client**: client1@insurance.com / admin

## Available Scripts

### Root Level

- `npm run dev` - Run both backend and frontend in dev mode
- `npm run prod` - Run both backend and frontend in prod mode
- `npm run backend:dev` - Run backend in dev mode (nodemon)
- `npm run backend:prod` - Run backend in prod mode
- `npm run frontend:dev` - Run frontend in dev mode (Vite)
- `npm run frontend:prod` - Run frontend in prod mode
- `npm run db:up` - Start Oracle database
- `npm run db:down` - Stop Oracle database
- `npm run db:logs` - View database logs
- `npm run install:all` - Install all dependencies

## Documentation

- [docs/HYBRID_SETUP.md](./docs/HYBRID_SETUP.md) - Detailed setup and usage guide
- [docs/ENV_SETUP.md](./docs/ENV_SETUP.md) - Environment variables configuration
- [docs/archive/](./docs/archive/) - Old setup and troubleshooting documentation

## API Documentation

Base URL: `http://localhost:3000/api/v1`

## License

MIT

