# TMJ Editorial Intelligence

Internal newsroom intelligence platform for **The Malabar Journal**.

This repository is built in milestones. **Milestone 4** adds local daily editorial brief generation on top of RSS ingestion and AI enrichment.

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) and [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for full scope and roadmap.

## Project structure

```text
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
4. Start the backend: `uvicorn app.main:app --reload` from `backend/`.
5. Start the frontend: `npm run dev` from `frontend/`.
6. Open http://localhost:3000 and http://localhost:8000/health.

## Milestone 1 endpoints and pages

| URL | Description |
|---|---|
| http://localhost:3000 | Homepage: "TMJ Editorial Intelligence" |
| http://localhost:8000/health | API health check, including Supabase connectivity |
| http://localhost:8000/docs | FastAPI auto-generated API docs |

## Milestone 2 local ingestion

Milestone 2 fetches public RSS/Atom feeds from active rows in `sources`, extracts basic article text, stores new articles in `articles`, and records every run in `ingestion_runs`.

Pipeline routes are local and manual. `POST /api/v1/ingestion/run` requires an `X-API-Key` header matching `API_SECRET_KEY` in `backend/.env`.

### Backend environment additions

Add these to `backend/.env`:

```env
API_SECRET_KEY=replace-with-a-long-random-local-secret
INGESTION_MAX_ARTICLES_PER_SOURCE=50
```

### Install backend packages

From `backend/`:

```powershell
pip install -r requirements.txt
```

### Apply Milestone 2 migration

Run `supabase/migrations/003_add_raw_html_to_articles.sql` in the Supabase SQL Editor.

### Replace the placeholder RSS source

Milestone 1 seeds a placeholder source. Before ingestion, update it in Supabase or through the API with a real public RSS feed URL.

### Trigger ingestion from PowerShell

From any terminal:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/ingestion/run" -Headers @{ "X-API-Key" = "replace-with-a-long-random-local-secret" }
```

### Milestone 2 endpoints

| Method | URL | Description |
|---|---|---|
| GET | http://localhost:8000/api/v1/sources | List sources |
| POST | http://localhost:8000/api/v1/sources | Add a source |
| GET | http://localhost:8000/api/v1/sources/{id} | Get source detail |
| PATCH | http://localhost:8000/api/v1/sources/{id} | Update source |
| DELETE | http://localhost:8000/api/v1/sources/{id} | Deactivate source |
| GET | http://localhost:8000/api/v1/articles | List articles |
| GET | http://localhost:8000/api/v1/articles/{id} | Get article detail |
| POST | http://localhost:8000/api/v1/ingestion/run | Run ingestion; requires `X-API-Key` |
| GET | http://localhost:8000/api/v1/ingestion/runs | List ingestion runs |
| GET | http://localhost:8000/api/v1/ingestion/runs/{id} | Get ingestion run detail |

### Verify in Supabase

After a successful run:

- Open Supabase Table Editor.
- Check `articles` for new rows with `title`, `url`, `published_at`, `extracted_text`, and `word_count`.
- Check `ingestion_runs` for one row with `status`, source counts, article counts, and any per-source errors.
- Run ingestion a second time and confirm the article count does not increase for duplicate URLs.

## Milestone 3 local enrichment

Milestone 3 enriches ingested RSS articles with summaries, sentiment, emotional signals, stakeholder stance, TMJ relevance, recommended angles, story formats, themes, tags, and a deterministic editorial score.

Enrichment is local and manually triggered. `POST /api/v1/enrichment/run` and `POST /api/v1/articles/{id}/reprocess` require the same `X-API-Key` header used by ingestion.

### Backend environment additions

Add these to `backend/.env`:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_CHAT_MODEL=gpt-4o-mini
ENRICHMENT_BATCH_SIZE=3
```

### Apply Milestone 3 migration

Run `supabase/migrations/004_enrichment_schema.sql` in the Supabase SQL Editor.

### Trigger enrichment for only 2 articles

From any terminal:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/enrichment/run" -ContentType "application/json" -Headers @{ "X-API-Key" = "replace-with-a-long-random-local-secret" } -Body '{"limit":2}'
```

### Reprocess one article

Replace `{article_id}` with an article ID from Supabase:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/articles/{article_id}/reprocess" -Headers @{ "X-API-Key" = "replace-with-a-long-random-local-secret" }
```

### Milestone 3 endpoints

| Method | URL | Description |
|---|---|---|
| POST | http://localhost:8000/api/v1/enrichment/run | Enrich a small pending batch; requires `X-API-Key` |
| GET | http://localhost:8000/api/v1/enrichment/status | Counts by article processing status |
| POST | http://localhost:8000/api/v1/articles/{id}/reprocess | Re-enrich one article; requires `X-API-Key` |
| GET | http://localhost:8000/api/v1/themes | List active editorial themes |

### Verify in Supabase

After a successful enrichment run:

- Check `articles` for `processing_status='completed'`.
- Confirm `summary`, `sentiment`, `sentiment_score`, `emotional_signals`, `stakeholder_stance`, `kerala_relevance`, `recommended_angle`, `coverage_recommendation`, and `editorial_score` are populated.
- Confirm `editorial_score` is between `0` and `100`.
- Check `article_themes` for theme assignments.
- Check `article_tags` for normalized tags.
- If an article fails, confirm `processing_status='failed'` and `processing_error` contains the reason.

## Milestone 4 local brief generation

Milestone 4 generates a daily editorial brief from completed enriched articles. Brief generation is manual and local. It uses one structured OpenAI call per brief and stores the result in `editorial_briefs`.

`POST /api/v1/briefs/generate` requires the same `X-API-Key` header used by ingestion and enrichment.

### Backend environment additions

Add these to `backend/.env`:

```env
BRIEF_TOP_N_ARTICLES=5
BRIEF_TIMEZONE=Asia/Qatar
```

### Apply Milestone 4 migration

Run `supabase/migrations/005_briefs_schema.sql` in the Supabase SQL Editor.

### Generate today's brief with only 3 articles

From any terminal:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/v1/briefs/generate" -ContentType "application/json" -Headers @{ "X-API-Key" = "replace-with-a-long-random-local-secret" } -Body '{"limit":3}'
```

When fewer than 3 completed enriched articles exist for today's `Asia/Qatar` date window, the API falls back to recent completed enriched articles. The `metadata` field records whether fallback articles were used.

### Milestone 4 endpoints

| Method | URL | Description |
|---|---|---|
| POST | http://localhost:8000/api/v1/briefs/generate | Generate or regenerate a brief; requires `X-API-Key` |
| GET | http://localhost:8000/api/v1/briefs | List briefs |
| GET | http://localhost:8000/api/v1/briefs/today | Get today's brief using `Asia/Qatar` date |
| GET | http://localhost:8000/api/v1/briefs/{date} | Get a brief by `YYYY-MM-DD` |

### Verify in Supabase

After a successful brief generation:

- Check `editorial_briefs` for one row with today's `brief_date`.
- Confirm `headline`, `executive_summary`, `sections`, `ranked_article_ids`, and `metadata` are populated.
- Confirm `sections` includes `what_happened`, `why_it_matters`, `sentiment_landscape`, `tmj_angle`, and `coverage_recommendations`.
- Run the same generate command again and confirm the same `brief_date` row updates instead of creating a duplicate.

## Database

Initial tables: `sources`, `articles`, `ingestion_runs`.

One placeholder row is seeded in `sources`. Replace the placeholder `feed_url` with a real public RSS URL before running ingestion.

## License

Internal use - The Malabar Journal.
