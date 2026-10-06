# Database

PostgreSQL setup for `job-followup-dashboard`.

## Create a Local Database

```sh
createdb job_followup_dashboard_dev
```

## Run Migrations

```sh
psql -d job_followup_dashboard_dev -f db/migrations/001_init.sql
```

## Seed Demo Data

```sh
psql -d job_followup_dashboard_dev -f db/seed.sql
```

## Test the Call Today View

```sh
psql -d job_followup_dashboard_dev -c "
SELECT
  customer_name,
  phone,
  stage,
  urgent,
  estimated_value,
  days_since_contact,
  reason
FROM call_today;
"
```

## Useful Local Checks

Summary counts by stage:

```sh
psql -d job_followup_dashboard_dev -c "
SELECT stage, count(*) AS jobs
FROM jobs
GROUP BY stage
ORDER BY stage;
"
```

Open estimated value:

```sh
psql -d job_followup_dashboard_dev -c "
SELECT coalesce(sum(estimated_value), 0) AS open_estimated_value
FROM jobs
WHERE stage <> 'done';
"
```
