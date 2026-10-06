# Job Follow-up Dashboard

A small job tracking dashboard for a commercial refrigeration repair company. The app helps the office see which customers need a call today, track jobs through the pipeline, and record follow-up activity.

## Stack

- PostgreSQL for job and contact history data
- Node.js, Express, and `pg` for the API
- React, Vite, and Tailwind CSS for the web app

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL with `createdb` and `psql` available

## Local setup

### 1. Create the database

```sh
createdb job_followup_dashboard_dev
psql -d job_followup_dashboard_dev -f db/migrations/001_init.sql
psql -d job_followup_dashboard_dev -f db/seed.sql
```

The migration creates the job and contact log tables, enums, indexes, update timestamp trigger, and `call_today` view. The seed file adds demo jobs.

### 2. Configure the API

Create a `.env` file in the repository root (the directory containing this README):

```env
DATABASE_URL=postgres://localhost:5432/job_followup_dashboard_dev
PORT=3000
```

Adjust the connection string for your local PostgreSQL user, password, host, and port as needed. The API reads this root `.env` when started using the commands below.

Install the API dependencies and start the server:

```sh
npm install
npm run dev
```

The API listens at `http://localhost:3000`. Check its database connection at [`http://localhost:3000/health`](http://localhost:3000/health).

### 3. Start the web app

In a second terminal:

```sh
npm install --prefix web
npm run dev --prefix web
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Vite proxies `/api` requests to the API at `http://localhost:3000`. To use a different API origin, set `VITE_API_BASE_URL` in `web/.env` (for example, `http://localhost:3000`); the frontend adds the `/api` path itself.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API and database availability |
| `GET` | `/api/jobs` | List jobs; optional `stage`, `urgent`, `open`, and `q` filters |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id` | Get one job and its contact history |
| `PATCH` | `/api/jobs/:id` | Update job fields |
| `POST` | `/api/jobs/:id/contact` | Mark a job contacted and add a contact log entry |
| `GET` | `/api/call-today` | Get jobs due for follow-up, with reason and urgent-first ordering |
| `GET` | `/api/summary` | Get stage counts and total open estimated value |

Supported stages are `new`, `waiting_on_quote`, `waiting_on_yes`, `scheduled`, and `done`. Supported sources are `office_call`, `website`, `text`, `referral`, and `other`.

## Database checks

See [`db/README.md`](db/README.md) for database commands. For example, inspect the follow-up list with:

```sh
psql -d job_followup_dashboard_dev -c \
  "SELECT customer_name, phone, stage, urgent, days_since_contact, reason FROM call_today;"
```

## Web build

```sh
npm run build --prefix web
```

The generated static files are written to `web/dist/`.
