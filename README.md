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
AUTH_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=https://lead-tracker-phi-seven.vercel.app,http://localhost:5173
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ADMIN_EMAIL=
```

Adjust the connection string for your local PostgreSQL user, password, host, and port as needed. Replace `AUTH_SECRET` with a long random value before deployment. `RESEND_FROM_EMAIL` must use a sender address verified by Resend; these three email settings enable admin notifications for public service requests. The API reads this root `.env` when started using the commands below.

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

Open the local URL printed by Vite (usually `http://localhost:5173`). Vite proxies `/api` requests to `VITE_API_BASE_URL` in `web/.env`. The Vercel deployment proxies `/api` to the Render API, keeping browser requests and the session cookie on the frontend origin. Set `CORS_ORIGIN` on the API service to the frontend origin; multiple origins can be comma-separated.

Clients can submit a request at `/request-service`, linked from the login page. Submissions are saved as new website jobs and emailed to `ADMIN_EMAIL` when Resend is configured.

### Demo access

The configured Neon database has Denise's demo account provisioned. On the login page, choose **Click here to get demo credentials** or enter:

- Email: `denise@thaw.demo`
- Password: `ThawDemo2026!`

The demo user's password is stored as a scrypt hash. Sessions expire after eight hours. A fresh database needs its own `dashboard_users` account provisioned before login is available.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API and database availability |
| `GET` | `/api/jobs` | List jobs; optional `stage`, `urgent`, `open`, and `q` filters |
| `POST` | `/api/jobs` | Create a job |
| `POST` | `/api/public/intake` | Public service request form; creates a new website job |
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
