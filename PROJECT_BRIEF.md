# TMJ Editorial Intelligence Engine

## Purpose
Build an internal newsroom intelligence platform for The Malabar Journal.

## Primary daily output
A ranked editorial brief answering:
1. What happened?
2. Why does it matter to Kerala, India, diaspora or TMJ audiences?
3. What is the dominant media and public sentiment?
4. What unique angle can TMJ add?
5. Should TMJ cover it today, this week, or monitor it?

## Version 1 scope
- Collect RSS feeds and approved public news sources daily.
- Store articles, source, publication date, URL, extracted text and tags.
- Categorise content into TMJ editorial themes.
- Generate AI summaries, sentiment, emotional signals, stakeholder stance and suggested story formats.
- Score each article for editorial priority.
- Generate a daily editorial brief.
- Provide semantic search and question answering with source citations.

## Restrictions
Do not use login scraping, browser-cookie extraction, CAPTCHA bypassing, private-feed scraping, or any attempt to evade platform restrictions.

## Tech stack
- Frontend: Next.js + TypeScript
- Backend: Python FastAPI
- Database: Supabase PostgreSQL + pgvector
- AI: OpenAI API
- Hosting: Cloudflare Pages and Cloudflare Workers
- Scheduled jobs: Cloudflare Cron Triggers

## Build approach
Build in small milestones. Before implementing each milestone, explain the files being created and why.
Use clean architecture, environment variables, database migrations, error handling, logging and tests.
