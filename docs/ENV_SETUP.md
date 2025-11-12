# Environment Variables Setup

This document describes the environment variables needed for the hybrid setup.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
# Connect to Oracle running in Docker via host
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XE
DB_USER=INSURANCE_USER
DB_PASSWORD=Insurance123

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Oracle Client (optional, only if Oracle client libraries are installed locally)
# ORACLE_CLIENT_LIB_DIR=/path/to/oracle/instantclient
```

## Frontend Environment Variables

### Development

Create a `.env` file in the `frontend/` directory:

```env
# API Base URL (without /api/v1 suffix)
# For development, this should point to your local backend
# If not set, the app will use relative paths in dev mode (via Vite proxy)
# and default to http://localhost:3000 in production
VITE_API_BASE=http://localhost:3000
```

### Production

Create a `.env.production` file in the `frontend/` directory:

```env
# API Base URL for Production (without /api/v1 suffix)
# Update this to your production backend URL
VITE_API_BASE=http://localhost:3000
```

**Note:** In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

