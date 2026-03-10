# CLAUDE.md

YH (yrkeshogskola) school management system for the **utbildningsanordnare** (education provider) perspective. Manages programs, courses, students, LIA placements, grading, and compliance with MYH and CSN requirements.

**Stack:** FastAPI backend + React/Vite frontend. Code lives in `backend/` and `frontend/` at the project root.

**Phase status:** Phase 1 complete (auth, database-backed roles, programs, courses CRUD). Phase 2+ planned (enrollment, cohorts, grading, LIA, attendance, admissions).

**Reference docs:** `plan.md` (implementation plan), `yh_analysis.md` (domain research on YH regulations and terminology).

## Environment Variables
- Never output .env-files in the chat
- Never in any way, share, .env-files
- Never output passwords in files, unless it's an .env file. 

Backend `.env` requires `DB_URL` (PostgreSQL connection string) and `ACCESS_TOKEN_EXPIRE_MINUTES`.
Frontend `.env` requires `VITE_API_URL` (e.g., `http://localhost:8000/v1`).

## Architecture

**Backend:** Python, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic v2, Argon2 (pwdlib)
**Frontend:** React 18, Vite 6, React Router DOM 7, Zustand, Tailwind CSS 4, plain JSX
- Never install external dependencies without asking first.
- Entry points: `backend/main.py`, `frontend/src/main.jsx`
- API versioned at `/v1` — routes defined in `app/api/v1/core/endpoints/`
- Auth uses database-backed tokens (not JWT) — see `app/security.py`
- DB models in `app/api/v1/core/models.py`, validation schemas in `schemas.py`
- Business logic belongs in `app/api/v1/core/services.py` (expand this, keep endpoints thin)
- Frontend state via Zustand store (`src/store/authStore.js`), persisted to localStorage
- API calls use native `fetch()` with bearer token from the auth store
- Pages in `src/pages/`, reusable components in `src/components/`
- Routing uses nested layouts: `Layout.jsx` (public) → `DashboardLayout.jsx` (protected)

## Code Style

- Match existing patterns: if a similar feature exists, follow its structure before inventing a new one
- Make surgical changes — touch only the files necessary for the task
- Frontend rules: see `.claude/rules/frontend-react.md` (auto-applied to `frontend/**`)
- Backend rules: see `.claude/rules/backend-api.md` (auto-applied to `backend/**`)

## Boundaries

**Always do:** Run `npm run lint` after frontend changes. Run `ruff check .` after backend changes. Verify the app starts after structural changes.

**Ask first:** Database model changes (require migrations). New API endpoints. Adding dependencies. Changes to auth flow or security.py.

**Never do:** Commit `.env` files or secrets. Expose `hashed_password` in API responses. Remove or weaken auth guards. Use `["*"]` CORS origins in production config.

## Commands

```bash
# Frontend (run from frontend/)
npm run dev          # Dev server with HMR
npm run build        # Production build

# Backend (run from backend/)
uvicorn app.main:app --reload              # Dev server
alembic revision --autogenerate -m "msg"   # Create migration
alembic upgrade head                       # Run migrations
ruff check .                               # Lint
```
