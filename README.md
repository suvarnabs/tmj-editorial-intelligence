# TMJ Editorial Intelligence

Internal newsroom intelligence platform for **The Malabar Journal**.

This repository is built in milestones. **Milestone 1** (current) provides a local development starter: a FastAPI backend, a Next.js frontend, and a Supabase database with three initial tables.

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) and [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for full scope and roadmap.

## Project structure

```
tmj-editorial-intelligence/
├── backend/          # Python FastAPI API
├── frontend/         # Next.js + TypeScript UI
└── supabase/
    └── migrations/   # SQL schema and seed files
```

## Prerequisites

| Software | Version | Purpose |
|---|---|---|
| [Python](https://www.python.org/downloads/) | 3.11 or newer | Backend API |
| [Node.js](https://nodejs.org/) | 20 LTS or newer | Frontend (includes npm) |
| [Supabase account](https://supabase.com/) | Free tier is fine | Hosted PostgreSQL database |

## Quick start

Detailed step-by-step instructions are in the sections below. Summary:

1. Install Python 3.11+, Node.js 20+, and create a Supabase project.
2. Copy `.env.example` values into `backend/.env` and `frontend/.env.local`.
3. Run the SQL migrations in the Supabase SQL Editor.
4. Start the backend: `uvicorn app.main:app --reload` (from `backend/`).
5. Start the frontend: `npm run dev` (from `frontend/`).
6. Open http://localhost:3000 and http://localhost:8000/health.

## Milestone 1 endpoints and pages

| URL | Description |
|---|---|
| http://localhost:3000 | Homepage — "TMJ Editorial Intelligence" |
| http://localhost:8000/health | API health check (includes Supabase connectivity) |
| http://localhost:8000/docs | FastAPI auto-generated API docs |

## Database (Milestone 1)

Three tables: `sources`, `articles`, `ingestion_runs`.

One placeholder row is seeded in `sources`. Replace the placeholder `feed_url` with a real public RSS URL before Milestone 2.

## License

Internal use — The Malabar Journal.
