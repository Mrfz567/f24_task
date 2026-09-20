# F24 File System

Browser-based file system built for the F24 technical assignment.

The repository is organized as a small monorepo:

- `frontend/` — React, TypeScript, Vite and Tailwind CSS
- `backend/` — Laravel REST API and queue worker
- PostgreSQL — application database
- `compose.yaml` — local development environment

## Current status

The application foundation and Docker environment are complete. The API health check,
frontend shell, PostgreSQL connection and database-backed queue worker are running.
File-system features are being implemented incrementally and are not complete yet.

The implementation plan and current progress are documented in
[`PROJECT_PLAN.md`](PROJECT_PLAN.md).

## Requirements

- Docker Desktop with Docker Compose
- Git

Local PHP, Composer and Node.js installations are not required.

## Run the application

From the repository root:

```bash
docker compose up --build
```

The first run installs dependencies and runs the database migrations. Once all services
are ready, open:

- Frontend: http://localhost:5173
- API health check: http://localhost:8000/api/v1/health

Expected health response:

```json
{"status":"ok"}
```

Stop the environment with:

```bash
docker compose down
```

PostgreSQL data is kept in a named Docker volume between runs. To also remove local
database data, use `docker compose down --volumes` intentionally.

## Development checks

Run these commands while the Docker environment is running:

```bash
docker compose exec api php artisan test --compact
docker compose exec api vendor/bin/pint --format agent
docker compose exec frontend npm run lint
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```
