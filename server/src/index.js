import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: 'server/.env' });

// Import modules that create the pg Pool only after dotenv has populated the environment.
const { createApp } = await import('./app.js');
const { pool } = await import('./db.js');

const port = Number(process.env.PORT ?? 3001);
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be configured in production.');
}
const app = createApp();

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
