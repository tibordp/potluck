# Potluck

A meal planning app with AI-powered recipe import. Organize recipes, plan weekly menus, and generate shopping lists automatically.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **AI**: Claude API for recipe import from URLs/images
- **Deployment**: Docker, Kubernetes

## Local Development

### Prerequisites

- Docker and Docker Compose
- An [Anthropic API key](https://console.anthropic.com/) for recipe import

### Getting Started

```bash
# Start all services (PostgreSQL, backend, frontend)
export ANTHROPIC_API_KEY=your-key-here
docker compose up

# Or use watch mode for live reloading
docker compose watch
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:8000.

### Development Without Docker

**Backend:**

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
yarn install
yarn dev
```

## Project Structure

```
backend/
  app/
    routers/       # API endpoints (auth, recipes, menus, shopping, ingredients)
    services/      # Business logic (LLM integration, menu planning, units)
    models.py      # SQLAlchemy models
    schemas.py     # Pydantic schemas
  alembic/         # Database migrations
frontend/
  src/
    components/    # React components
    api.ts         # API client
    types.ts       # TypeScript types
k8s/               # Kubernetes manifests
```

## Linting & Formatting

```bash
# Check everything
make lint

# Auto-fix formatting
make format
```
