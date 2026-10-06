CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE job_stage AS ENUM (
  'new',
  'waiting_on_quote',
  'waiting_on_yes',
  'scheduled',
  'done'
);

CREATE TYPE job_source AS ENUM (
  'office_call',
  'website',
  'text',
  'referral',
  'other'
);

CREATE TYPE contact_log_type AS ENUM (
  'contacted',
  'note',
  'stage_change'
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  issue text NOT NULL,
  source job_source NOT NULL DEFAULT 'other',
  stage job_stage NOT NULL DEFAULT 'new',
  urgent boolean NOT NULL DEFAULT false,
  estimated_value numeric(10,2) NOT NULL DEFAULT 0.00,
  notes text NOT NULL DEFAULT '',
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contact_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type contact_log_type NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX jobs_stage_idx ON jobs(stage);
CREATE INDEX jobs_last_contacted_at_idx ON jobs(last_contacted_at);
CREATE INDEX jobs_urgent_idx ON jobs(urgent);
CREATE INDEX jobs_open_followup_idx
  ON jobs(stage, urgent DESC, last_contacted_at, created_at)
  WHERE stage <> 'done';
CREATE INDEX contact_log_job_id_created_at_idx
  ON contact_log(job_id, created_at DESC);

CREATE VIEW call_today AS
WITH open_jobs AS (
  SELECT
    j.*,
    floor(
      extract(epoch FROM (now() - coalesce(j.last_contacted_at, j.created_at))) / 86400
    )::integer AS days_since_contact
  FROM jobs j
  WHERE j.stage <> 'done'
),
callable_jobs AS (
  SELECT
    oj.*,
    CASE
      WHEN oj.stage = 'new' AND oj.last_contacted_at IS NULL THEN 'New, never contacted'
      WHEN oj.stage = 'waiting_on_quote' THEN 'Waiting on quote'
      WHEN oj.stage = 'waiting_on_yes' AND oj.days_since_contact >= 2 THEN
        'Waiting on yes, no contact in ' || oj.days_since_contact || ' days'
      WHEN oj.days_since_contact >= 2 THEN
        'No contact in ' || oj.days_since_contact || ' days'
    END AS reason,
    CASE
      WHEN oj.stage = 'new' AND oj.last_contacted_at IS NULL THEN 1
      WHEN oj.stage = 'waiting_on_quote' THEN 2
      WHEN oj.stage = 'waiting_on_yes' AND oj.days_since_contact >= 2 THEN 3
      WHEN oj.days_since_contact >= 2 THEN 4
      ELSE 99
    END AS reason_priority
  FROM open_jobs oj
  WHERE
    (oj.stage = 'new' AND oj.last_contacted_at IS NULL)
    OR oj.stage = 'waiting_on_quote'
    OR (oj.stage = 'waiting_on_yes' AND oj.days_since_contact >= 2)
    OR oj.days_since_contact >= 2
)
SELECT
  id,
  customer_name,
  phone,
  issue,
  source,
  stage,
  urgent,
  estimated_value,
  notes,
  last_contacted_at,
  created_at,
  updated_at,
  days_since_contact,
  reason
FROM callable_jobs
ORDER BY
  urgent DESC,
  reason_priority,
  days_since_contact DESC,
  created_at;
