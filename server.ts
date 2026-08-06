import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  const DATA_DIR = path.join(process.cwd(), 'data');
  const DATA_FILE = path.join(DATA_DIR, 'store.json');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Fetch shared database
  app.get('/api/data', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return res.json(parsed);
      }
      return res.json({ empty: true });
    } catch (err) {
      console.error('Error reading store.json:', err);
      return res.status(500).json({ error: 'Failed to read shared data' });
    }
  });

  // Update shared database
  app.post('/api/data', (req, res) => {
    try {
      const payload = req.body;
      payload.lastUpdated = Date.now();
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({ success: true, lastUpdated: payload.lastUpdated });
    } catch (err) {
      console.error('Error writing store.json:', err);
      return res.status(500).json({ error: 'Failed to save shared data' });
    }
  });

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
