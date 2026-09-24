import express from 'express';
import { readTab, updateRow, appendRow } from './sheets.js';
import { publicConfig } from './config.js';

// URL segment -> Google Sheet tab name
const TABS = {
  expenses: 'Expenses',
  reminders: 'Reminders',
  health: 'Health',
  notes: 'Notes',
};

const MAX_NOTE_LENGTH = 5000;

export const app = express();
app.use(express.json({ limit: '20kb' }));

app.get('/api/status', (_req, res) => res.json({ ok: true }));

app.get('/api/config', (_req, res) => res.json(publicConfig()));

app.get('/api/:resource', async (req, res, next) => {
  const tab = TABS[req.params.resource];
  if (!tab) return next();
  try {
    res.json(await readTab(tab));
  } catch (err) {
    next(err);
  }
});

function validateNote(body) {
  const owners = publicConfig().noteBoards.map((b) => b.key);
  const { user, note, timestamp } = body || {};
  if (!owners.includes(String(user).toLowerCase())) return 'Unknown note owner';
  if (typeof note !== 'string' || !note.trim()) return 'Note text is required';
  if (note.length > MAX_NOTE_LENGTH) return `Note must be under ${MAX_NOTE_LENGTH} characters`;
  if (typeof timestamp !== 'string' || timestamp.length > 64) return 'Invalid timestamp';
  return null;
}

app.post('/api/notes', async (req, res, next) => {
  const error = validateNote(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { user, note, timestamp } = req.body;
    res.status(201).json(await appendRow(TABS.notes, { user, note, timestamp }));
  } catch (err) {
    next(err);
  }
});

app.put('/api/notes/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 2) return res.status(400).json({ error: 'Invalid note id' });
  const error = validateNote(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { user, note, timestamp } = req.body;
    res.json(await updateRow(TABS.notes, id, { user, note, timestamp }));
  } catch (err) {
    next(err);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Could not reach Google Sheets' });
});
