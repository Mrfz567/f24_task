# F24 File System

Browser-based file system built for the F24 technical assignment.

## Run the application

### Requirements

- Docker Desktop with Docker Compose
- Git

Local PHP, Composer, Node.js and PostgreSQL installations are not required.

Clone the repository and enter its directory:

```bash
git clone https://github.com/Mrfz567/f24_task.git
cd f24_task
```

Build and start the complete application in debug mode:

```bash
docker compose up --build
```

The first run installs dependencies, starts PostgreSQL, applies migrations and creates
the Root folder. When the services are ready, open:

- Application: http://localhost:5173
- API health check: http://localhost:8000/api/v1/health

The expected health response is:

```json
{"status":"ok"}
```

Stop the application with:

```bash
docker compose down
```

Database data remains in a Docker volume. To intentionally remove all application data:

```bash
docker compose down --volumes
```

### Troubleshooting

- Ensure Docker Desktop is fully running before executing Compose commands.
- Ensure ports `5173` and `8000` are not already in use.
- After dependency or Dockerfile changes, run `docker compose up --build` again.
- Use `docker compose ps` to check service health and `docker compose logs api worker`
  to inspect backend or queue errors.

## Run the checks

Run these commands while the Docker environment is running:

```bash
docker compose exec api composer validate --strict
docker compose exec api vendor/bin/pint --test
docker compose exec api php artisan test --compact
docker compose exec frontend npm run lint
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```

Backend tests use an isolated PostgreSQL test database and do not reset development data.

## Features

- create and rename folders, subfolders and file-name records
- browse the full hierarchy through the sidebar, breadcrumbs, list or grid view
- recursively search the selected folder or search the entire file system
- show up to 10 case-insensitive prefix suggestions while typing
- delete complete folder subtrees with a backend-controlled 10-second Undo period
- recover active Undo timers after refresh and continue working while they count down
- automatically resolve duplicate names with `(1)`, `(2)` and subsequent numbers
- persist list/grid and file-extension display preferences in the browser
- show file-type icons and distinct empty/non-empty folder icons

## Technology and architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS and TanStack Query
- **Backend:** Laravel REST API and database-backed queue worker
- **Database:** PostgreSQL 18
- **Environment:** Docker Compose

The repository is a small monorepo:

```text
frontend/       React UI, routing, API client and integration tests
backend/        Laravel domain actions, HTTP API, jobs, migrations and tests
compose.yaml    database, test database, API, worker and frontend services
PROJECT_PLAN.md implementation decisions and session history
```

The UI does not contain filesystem business rules. Laravel actions own validation,
name allocation, recursive search and deletion behavior, while PostgreSQL enforces the
important integrity constraints. The queue worker permanently purges expired deletions.

## Data model

`entries` stores both folders and files as an adjacency list using `parent_id`. One Root
folder has no parent; every other entry belongs to a folder. UUIDs are used throughout,
and sibling names are unique case-insensitively.

`deletion_batches` stores the deletion root, unpredictable Undo token, expiry and status.
Entries are soft-deleted together first and are permanently removed by a delayed queue job.

## API

All routes are prefixed with `http://localhost:8000/api/v1`.

| Method | Path | Success | Purpose |
|---|---|---:|---|
| `GET` | `/health` | `200` | Service health |
| `GET` | `/entries/tree` | `200` | Complete active hierarchy |
| `GET` | `/folders/{folderId}/entries` | `200` | Immediate folder contents |
| `GET` | `/entries/{entryId}/breadcrumbs` | `200` | Path from Root to an entry |
| `POST` | `/entries` | `201` | Create a folder or file |
| `PATCH` | `/entries/{entryId}` | `200` | Rename a folder or file |
| `GET` | `/files/search` | `200` | Exact file-name search |
| `GET` | `/files/suggestions` | `200` | Up to 10 prefix matches |
| `DELETE` | `/entries/{entryId}` | `202` | Start recursive deletion |
| `POST` | `/deletions/{token}/undo` | `200` | Restore a pending deletion |
| `GET` | `/deletions/pending` | `200` | Recover active Undo timers |

Example create request:

```json
{
  "parent_id": "folder-uuid",
  "type": "file",
  "name": "project_notes.docx"
}
```

Both search endpoints accept `query`, `everywhere` and `folder_id`. Folder-scoped search
includes the selected folder and all of its descendants. Search returns files only and
excludes temporarily deleted entries.

Validation failures return `422`; missing resources return `404`; protected or overlapping
operations return `409`; and Undo after expiry returns `410`. Repeating a pending DELETE
returns its existing token and does not restart the timer.

## Decisions and limitations

- A file is only its name, as requested; there is no binary upload or file content.
- Authentication and authorization are intentionally omitted by the assignment.
- The application is desktop-first and is not optimized for mobile layouts.
- The app uses one shared Root hierarchy rather than separate user workspaces.
- Undo durability depends on the included queue worker being active.
- Display preferences are local to each browser and are not stored in the database.
- Core behavior is covered by backend feature tests and frontend integration tests.
  A separate Playwright browser suite was not added to keep the solution focused.

The detailed implementation plan and progress history are available in
[`PROJECT_PLAN.md`](PROJECT_PLAN.md).
