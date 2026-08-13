# Repository Guidelines

## Project Structure & Module Organization

- `backend/app/` contains the FastAPI application. Keep HTTP routes in `api/`, persistence models in `models/`, Pydantic contracts in `schemas/`, and business logic in `services/`.
- `backend/alembic/versions/` stores ordered database migrations; `backend/tests/` contains Python regression tests.
- `frontend-web/src/` is the React/TypeScript client. Pages live in `pages/`, shared UI in `components/`, API configuration in `api/`, and client state in `store/`.
- `mobile/lib/` contains the Flutter client, organized into `screens/`, `services/`, `models/`, and `core/`.
- `docs/` holds architecture, API, setup, testing, and screenshot documentation. Do not commit generated files from `outputs/`.

## Build, Test, and Development Commands

- Windows first-time setup: `setup.bat` installs runtimes/dependencies, migrates the database, and seeds demo data.
- Windows daily start: `start.bat` launches FastAPI on port 8000 and Vite on port 5173.
- Backend manually: `cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload`.
- Backend tests: `cd backend && .venv\Scripts\python.exe -m unittest discover -s tests -v`.
- Web development: `cd frontend-web && npm run dev`.
- Web verification: `npm run lint` for TypeScript checks and `npm run build` for a production build.
- Mobile verification: `cd mobile && flutter analyze`; run with `flutter run`.

## Coding Style & Naming Conventions

Use four spaces in Python, two spaces in TypeScript/TSX, and standard Dart formatting. Python modules, functions, and variables use `snake_case`; classes and Pydantic/SQLAlchemy models use `PascalCase`. React components and pages use `PascalCase.tsx`; hooks and utilities use `camelCase`. Prefer typed API contracts and keep authorization checks server-side. Run `dart format lib` for mobile changes.

## Testing Guidelines

Backend tests use `unittest`; name files `test_<feature>.py` and methods `test_<expected_behavior>`. Add regression coverage for permissions, society isolation, state transitions, and AI tool confirmation. Frontend changes must pass both TypeScript checking and a production build. Manually verify affected role flows and mobile layouts when UI behavior changes.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects, for example `Fix multi-turn visitor pass routing`. Keep each commit focused. Pull requests should explain the problem and solution, list verification commands, link relevant issues, note migrations or environment changes, and include before/after screenshots for UI work.

## Security & Configuration

Copy `.env.example` files locally, but never commit API keys, JWT secrets, database credentials, or production data. Preserve role-based access, tenant boundaries, audit logging, and explicit confirmation for AI write actions.
