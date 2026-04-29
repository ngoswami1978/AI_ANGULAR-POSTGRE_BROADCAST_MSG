import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { WebSocketServer, WebSocket } from 'ws';

interface MessageRow {
  id: number;
  content: string;
  created_at: string;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '16kb' }));

const port = Number(process.env.PORT ?? 3000);
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error('DATABASE_URL is required');

const pool = new Pool({ connectionString: dbUrl });

async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      content TEXT NOT NULL CHECK (length(trim(content)) > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function createMessage(content: string): Promise<MessageRow> {
  const result = await pool.query<MessageRow>(
    'INSERT INTO messages(content) VALUES($1) RETURNING id, content, created_at',
    [content.trim()]
  );
  return result.rows[0];
}

function broadcast(payload: unknown): void {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

app.get('/messages', async (_req, res) => {
  const result = await pool.query<MessageRow>(
    'SELECT id, content, created_at FROM messages ORDER BY id DESC LIMIT 100'
  );
  res.json(result.rows);
});

app.post('/messages', async (req, res) => {
  const content = String(req.body?.content ?? '').trim();
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const row = await createMessage(content);
  broadcast({ type: 'message', data: row });
  return res.status(201).json(row);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'connected' }));

  socket.on('message', async (raw) => {
    try {
      const parsed = JSON.parse(raw.toString()) as { content?: string };
      const content = parsed.content?.trim();
      if (!content) return;

      const row = await createMessage(content);
      broadcast({ type: 'message', data: row });
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
    }
  });
});

initDb().then(() => {
  server.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
});
