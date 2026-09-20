# F24 File System

Browser-based file system built for the F24 technical assignment.

The repository is organized as a small monorepo:

- `frontend/` — React, TypeScript, Vite and Tailwind CSS
- `backend/` — Laravel REST API and queue worker
- PostgreSQL — application database
- `compose.yaml` — local development environment

## Current status

The application foundation, Docker environment and core hierarchy API are complete.
Folders and files can be created, browsed and searched through the API, including the
folder tree and breadcrumbs. Rename, delete/Undo and the complete frontend UI are not
yet implemented.

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

## Available API endpoints

All API routes are prefixed with `http://localhost:8000/api/v1`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | API health check |
| `GET` | `/folders/tree` | Complete active folder tree, including Root |
| `GET` | `/folders/{folderId}/entries` | Immediate contents of a folder |
| `GET` | `/entries/{entryId}/breadcrumbs` | Path from Root to an entry |
| `POST` | `/entries` | Create a folder or file |
| `GET` | `/files/search` | Case-insensitive exact file-name search |
| `GET` | `/files/suggestions` | Up to 10 case-insensitive prefix matches |

Example request body for `POST /entries`:

```json
{
  "parent_id": "root-or-folder-uuid",
  "type": "file",
  "name": "project_notes.docx"
}
```

Duplicate names are resolved automatically with `(1)`, `(2)` and subsequent numbers.
For files, the number is inserted before the final extension.

Both search endpoints accept these query parameters:

- `query` — required file name or prefix
- `everywhere` — optional boolean; defaults to `false`
- `folder_id` — required when `everywhere=false`, ignored otherwise

Folder-scoped searches include the selected folder and all nested folders. Every search
result includes breadcrumbs from Root to the matching file.

## Development checks

Run these commands while the Docker environment is running:

```bash
docker compose exec api php artisan test --compact
docker compose exec api vendor/bin/pint --format agent
docker compose exec frontend npm run lint
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```

Backend tests use the isolated `test-database` Compose service and do not reset the
development database.
