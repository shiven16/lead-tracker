import express from 'express';
import cors from 'cors';
import { createHmac, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { query, withTransaction } from './db.js';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'thaw_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const STAGES = ['new', 'waiting_on_quote', 'waiting_on_yes', 'scheduled', 'done'];
const SOURCES = ['office_call', 'website', 'text', 'referral', 'other'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || 'https://lead-tracker-phi-seven.vercel.app,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true
  }));
  app.use(express.json());

  app.get('/health', async (_req, res, next) => {
    try {
      await query('SELECT 1');
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const result = await query(
        'SELECT id, email, display_name, password_hash FROM dashboard_users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
      }

      const token = signSession({ id: user.id, email: user.email, name: user.display_name });
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
      res.json({ user: { id: user.id, email: user.email, name: user.display_name } });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    const clearOptions = { ...sessionCookieOptions(), maxAge: undefined };
    res.clearCookie(SESSION_COOKIE, clearOptions);
    res.status(204).end();
  });

  app.get('/api/auth/session', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.use('/api', requireAuth);

  app.get('/api/jobs', async (req, res, next) => {
    try {
      const { stage, urgent, open, q } = req.query;
      const filters = [];
      const values = [];

      if (stage !== undefined) {
        if (!STAGES.includes(stage)) {
          return res.status(400).json({ error: 'Invalid stage.' });
        }
        values.push(stage);
        filters.push(`stage = $${values.length}`);
      }

      if (urgent !== undefined) {
        if (!['true', 'false'].includes(urgent)) {
          return res.status(400).json({ error: 'urgent must be true or false.' });
        }
        values.push(urgent === 'true');
        filters.push(`urgent = $${values.length}`);
      }

      if (open !== undefined) {
        if (!['true', 'false'].includes(open)) {
          return res.status(400).json({ error: 'open must be true or false.' });
        }
        filters.push(open === 'true' ? `stage <> 'done'` : `stage = 'done'`);
      }

      if (q !== undefined && String(q).trim() !== '') {
        values.push(`%${String(q).trim()}%`);
        filters.push(`(customer_name ILIKE $${values.length} OR phone ILIKE $${values.length} OR issue ILIKE $${values.length})`);
      }

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const result = await query(
        `
          SELECT *
          FROM jobs
          ${whereClause}
          ORDER BY
            urgent DESC,
            CASE stage
              WHEN 'new' THEN 1
              WHEN 'waiting_on_quote' THEN 2
              WHEN 'waiting_on_yes' THEN 3
              WHEN 'scheduled' THEN 4
              WHEN 'done' THEN 5
            END,
            created_at DESC
        `,
        values
      );

      res.json({ jobs: result.rows });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/jobs', async (req, res, next) => {
    try {
      const payload = validateJobCreate(req.body);
      if (payload.error) {
        return res.status(400).json({ error: payload.error });
      }

      const result = await query(
        `
          INSERT INTO jobs (
            customer_name,
            phone,
            issue,
            source,
            stage,
            urgent,
            estimated_value,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        [
          payload.value.customer_name,
          payload.value.phone,
          payload.value.issue,
          payload.value.source,
          payload.value.stage,
          payload.value.urgent,
          payload.value.estimated_value,
          payload.value.notes
        ]
      );

      res.status(201).json({ job: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/:id', async (req, res, next) => {
    try {
      if (!isUuid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid job id.' });
      }

      const [jobResult, contactResult] = await Promise.all([
        query('SELECT * FROM jobs WHERE id = $1', [req.params.id]),
        query('SELECT * FROM contact_log WHERE job_id = $1 ORDER BY created_at DESC', [req.params.id])
      ]);

      if (jobResult.rowCount === 0) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      res.json({
        job: jobResult.rows[0],
        contact_log: contactResult.rows
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/jobs/:id', async (req, res, next) => {
    try {
      if (!isUuid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid job id.' });
      }

      const payload = validateJobPatch(req.body);
      if (payload.error) {
        return res.status(400).json({ error: payload.error });
      }

      const entries = Object.entries(payload.value);
      if (entries.length === 0) {
        return res.status(400).json({ error: 'At least one editable field is required.' });
      }

      const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
      const values = [req.params.id, ...entries.map(([, value]) => value)];

      const result = await query(
        `
          UPDATE jobs
          SET ${assignments.join(', ')}
          WHERE id = $1
          RETURNING *
        `,
        values
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      res.json({ job: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/jobs/:id/contact', async (req, res, next) => {
    try {
      if (!isUuid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid job id.' });
      }

      const note = normalizeOptionalString(req.body?.note);
      if (note !== undefined && note.length > 2000) {
        return res.status(400).json({ error: 'note must be 2000 characters or fewer.' });
      }

      const result = await withTransaction(async (client) => {
        const jobResult = await client.query(
          `
            UPDATE jobs
            SET last_contacted_at = now()
            WHERE id = $1
            RETURNING *
          `,
          [req.params.id]
        );

        if (jobResult.rowCount === 0) {
          return null;
        }

        const contactResult = await client.query(
          `
            INSERT INTO contact_log (job_id, type, note)
            VALUES ($1, 'contacted', $2)
            RETURNING *
          `,
          [req.params.id, note ?? '']
        );

        return {
          job: jobResult.rows[0],
          contact: contactResult.rows[0]
        };
      });

      if (!result) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/call-today', async (_req, res, next) => {
    try {
      const result = await query('SELECT * FROM call_today');
      res.json({ jobs: result.rows });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/summary', async (_req, res, next) => {
    try {
      const [countsResult, valueResult] = await Promise.all([
        query(
          `
            SELECT stage, count(*)::integer AS count
            FROM jobs
            GROUP BY stage
            ORDER BY stage
          `
        ),
        query(
          `
            SELECT coalesce(sum(estimated_value), 0)::numeric(10,2) AS open_estimated_value
            FROM jobs
            WHERE stage <> 'done'
          `
        )
      ]);

      res.json({
        counts_by_stage: countsResult.rows,
        open_estimated_value: valueResult.rows[0].open_estimated_value
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

function sessionSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured in production.');
  }
  return 'local-development-only-change-before-deploying';
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000
  };
}

function signSession(user) {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', sessionSecret()).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.exp > Math.floor(Date.now() / 1000)
      ? { id: session.id, email: session.email, name: session.name }
      : null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const cookie = (req.headers.cookie ?? '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const session = readSession(cookie?.slice(SESSION_COOKIE.length + 1));
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  req.user = session;
  next();
}

async function verifyPassword(password, storedHash) {
  const separator = storedHash.indexOf(':');
  if (separator < 1) return false;
  const salt = storedHash.slice(0, separator);
  const expected = Buffer.from(storedHash.slice(separator + 1), 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validateJobCreate(body) {
  const customerName = normalizeRequiredString(body?.customer_name, 'customer_name');
  if (customerName.error) return customerName;

  const phone = normalizeRequiredString(body?.phone, 'phone');
  if (phone.error) return phone;

  const issue = normalizeRequiredString(body?.issue, 'issue');
  if (issue.error) return issue;

  const source = body?.source ?? 'other';
  if (!SOURCES.includes(source)) {
    return { error: 'Invalid source.' };
  }

  const stage = body?.stage ?? 'new';
  if (!STAGES.includes(stage)) {
    return { error: 'Invalid stage.' };
  }

  const urgent = body?.urgent ?? false;
  if (typeof urgent !== 'boolean') {
    return { error: 'urgent must be a boolean.' };
  }

  const estimatedValue = normalizeMoney(body?.estimated_value ?? 0);
  if (estimatedValue.error) return estimatedValue;

  const notes = normalizeOptionalString(body?.notes) ?? '';
  if (notes.length > 5000) {
    return { error: 'notes must be 5000 characters or fewer.' };
  }

  return {
    value: {
      customer_name: customerName.value,
      phone: phone.value,
      issue: issue.value,
      source,
      stage,
      urgent,
      estimated_value: estimatedValue.value,
      notes
    }
  };
}

function validateJobPatch(body) {
  const allowedFields = [
    'customer_name',
    'phone',
    'issue',
    'source',
    'stage',
    'urgent',
    'estimated_value',
    'notes',
    'last_contacted_at'
  ];

  const incoming = Object.keys(body ?? {});
  const unknownField = incoming.find((field) => !allowedFields.includes(field));
  if (unknownField) {
    return { error: `Unknown field: ${unknownField}.` };
  }

  const value = {};

  for (const field of incoming) {
    if (['customer_name', 'phone', 'issue'].includes(field)) {
      const result = normalizeRequiredString(body[field], field);
      if (result.error) return result;
      value[field] = result.value;
    }

    if (field === 'source') {
      if (!SOURCES.includes(body.source)) {
        return { error: 'Invalid source.' };
      }
      value.source = body.source;
    }

    if (field === 'stage') {
      if (!STAGES.includes(body.stage)) {
        return { error: 'Invalid stage.' };
      }
      value.stage = body.stage;
    }

    if (field === 'urgent') {
      if (typeof body.urgent !== 'boolean') {
        return { error: 'urgent must be a boolean.' };
      }
      value.urgent = body.urgent;
    }

    if (field === 'estimated_value') {
      const result = normalizeMoney(body.estimated_value);
      if (result.error) return result;
      value.estimated_value = result.value;
    }

    if (field === 'notes') {
      const notes = normalizeOptionalString(body.notes) ?? '';
      if (notes.length > 5000) {
        return { error: 'notes must be 5000 characters or fewer.' };
      }
      value.notes = notes;
    }

    if (field === 'last_contacted_at') {
      if (body.last_contacted_at === null) {
        value.last_contacted_at = null;
      } else {
        const date = new Date(body.last_contacted_at);
        if (Number.isNaN(date.getTime())) {
          return { error: 'last_contacted_at must be a valid date string or null.' };
        }
        value.last_contacted_at = date.toISOString();
      }
    }
  }

  return { value };
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== 'string') {
    return { error: `${fieldName} is required.` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { error: `${fieldName} is required.` };
  }

  if (trimmed.length > 500) {
    return { error: `${fieldName} must be 500 characters or fewer.` };
  }

  return { value: trimmed };
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
}

function normalizeMoney(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return { error: 'estimated_value must be a non-negative number.' };
  }

  if (numberValue > 99999999.99) {
    return { error: 'estimated_value is too large.' };
  }

  return { value: numberValue.toFixed(2) };
}

function isUuid(value) {
  return UUID_RE.test(value);
}
