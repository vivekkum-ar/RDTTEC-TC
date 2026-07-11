import express from 'express';

const app = express();
app.get('/api/ping', (_req, res) => res.json({ pong: true }));
app.get('/api', (_req, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
export default app;
