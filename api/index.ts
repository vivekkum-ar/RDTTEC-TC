import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { JWT } from 'google-auth-library';

const app = express();
app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.VITE_SHEET_NAME || 'TC Data';
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

let cachedToken: string | null = null;
let tokenExpiry = 0;

function loadCredentials(): any {
  const saKeyRaw = process.env.VITE_SA_KEY;
  const saKeyFile = process.env.SA_KEY_FILE;

  if (saKeyRaw) {
    try { return JSON.parse(saKeyRaw); } catch {}
  }

  if (saKeyFile) {
    try {
      const filePath = path.resolve(saKeyFile);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {}
  }

  return null;
}

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = loadCredentials();
  if (!credentials) return null;

  const jwt = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  try {
    const result = await jwt.authorize();
    cachedToken = result.access_token || null;
    tokenExpiry = Date.now() + 3300 * 1000;
    return cachedToken;
  } catch (error: any) {
    console.error('JWT authorization failed:', error.message);
    if (error.response?.data) {
      console.error('Auth error details:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

async function sheetsFetch(url: string, options: RequestInit = {}) {
  const token = await getToken();
  if (!token) {
    throw new Error('Authentication failed. Check your service account credentials.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    try {
      const json = JSON.parse(body);
      detail = json.error?.message || json.error || body;
    } catch {}
    throw new Error(detail);
  }

  return response.json();
}

async function ensureSheetExists(): Promise<boolean> {
  if (!SPREADSHEET_ID) return false;

  try {
    const data = await sheetsFetch(`${BASE}/${SPREADSHEET_ID}`);
    const exists = data.sheets?.some(
      (s: any) => s.properties?.title === SHEET_NAME
    );

    if (!exists) {
      await sheetsFetch(`${BASE}/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
        }),
      });
    }
    return true;
  } catch (error: any) {
    console.error('ensureSheetExists error:', error.message);
    return false;
  }
}

app.get('/api/ping', (_req, res) => res.json({ pong: true }));
app.get('/api', (_req, res) => res.json({ ok: true }));

app.get('/api/sheets', async (_req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(500).json({ error: 'Service account not configured. Check SA_KEY_FILE in .env' });

    if (!(await ensureSheetExists())) {
      return res.status(500).json({ error: 'Failed to access spreadsheet' });
    }

    const data = await sheetsFetch(
      `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A:M`
    );

    res.json({ values: data.values || [] });
  } catch (error: any) {
    console.error('GET /api/sheets error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(500).json({ error: 'Service account not configured' });

    await ensureSheetExists();

    const values = req.body.values;
    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const data = await sheetsFetch(
      `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A:M:append?valueInputOption=RAW`,
      { method: 'POST', body: JSON.stringify({ values: [values] }) }
    );

    const updatedRange = data.updates?.updatedRange || '';
    const rowMatch = updatedRange.match(/(\d+)$/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1]) : 0;

    res.json({ rowIndex, tcNumber: values[0] });
  } catch (error: any) {
    console.error('POST /api/sheets error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sheets/:rowIndex', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(500).json({ error: 'Service account not configured' });

    const { rowIndex } = req.params;
    const values = req.body.values;

    await sheetsFetch(
      `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A${rowIndex}:M${rowIndex}?valueInputOption=RAW`,
      { method: 'PUT', body: JSON.stringify({ values: [values] }) }
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('PUT /api/sheets error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sheets/:rowIndex', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(500).json({ error: 'Service account not configured' });

    const { rowIndex } = req.params;
    const spreadsheet = await sheetsFetch(`${BASE}/${SPREADSHEET_ID}`);
    const sheet = spreadsheet.sheets?.find(
      (s: any) => s.properties?.title === SHEET_NAME
    );

    if (!sheet || !sheet.properties?.sheetId) {
      return res.status(404).json({ error: 'Sheet not found' });
    }

    await sheetsFetch(`${BASE}/${SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: parseInt(rowIndex) - 1,
              endIndex: parseInt(rowIndex),
            },
          },
        }],
      }),
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/sheets error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets/bulk', async (req, res) => {
  try {
    const token = await getToken();
    if (!token) return res.status(500).json({ error: 'Service account not configured' });

    await ensureSheetExists();

    const rows = req.body.rows;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    await sheetsFetch(
      `${BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}!A:M:append?valueInputOption=RAW`,
      { method: 'POST', body: JSON.stringify({ values: rows }) }
    );

    res.json({ count: rows.length });
  } catch (error: any) {
    console.error('POST /api/sheets/bulk error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config', (_req, res) => {
  res.json({
    spreadsheetId: SPREADSHEET_ID,
    sheetName: SHEET_NAME,
    configured: !!loadCredentials(),
  });
});

app.get('/api/auth-test', async (_req, res) => {
  const credentials = loadCredentials();
  if (!credentials) {
    return res.json({ ok: false, step: 'load', error: 'No credentials found' });
  }

  try {
    const jwt = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const result = await jwt.authorize();
    res.json({
      ok: true,
      step: 'authorize',
      hasToken: !!result.access_token,
      expiresIn: result.expiry_date ? result.expiry_date - Date.now() : 'unknown',
      email: credentials.client_email,
    });
  } catch (error: any) {
    res.json({
      ok: false,
      step: 'authorize',
      error: error.message,
      details: error.response?.data || 'No details',
    });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
