import express from 'express';
import path from 'path';
import fs from 'fs';

export const app = express();

app.use(express.json({ limit: '15mb' }));

// Determine data folder (/tmp for Vercel serverless functions, or ./data locally)
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.VERCEL ? 'vercel' : 'container' });
});

app.get('/api/data', (req, res) => {
  try {
    ensureDataDir();
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

app.post('/api/data', (req, res) => {
  try {
    ensureDataDir();
    const payload = req.body || {};
    let existingData: any = {};
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        existingData = JSON.parse(raw);
      } catch {
        existingData = {};
      }
    }

    const mergeArrayById = (existingArr: any[] = [], incomingArr: any[] = []) => {
      const map = new Map<string, any>();
      if (Array.isArray(existingArr)) {
        existingArr.forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
      }
      if (Array.isArray(incomingArr)) {
        incomingArr.forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
      }
      return Array.from(map.values());
    };

    const mergedPayload = {
      clientes: mergeArrayById(existingData.clientes, payload.clientes),
      emprestimos: mergeArrayById(existingData.emprestimos, payload.emprestimos),
      pagamentos: mergeArrayById(existingData.pagamentos, payload.pagamentos),
      notificacoes: mergeArrayById(existingData.notificacoes, payload.notificacoes),
      configuracoes: { ...existingData.configuracoes, ...payload.configuracoes },
      usuarios: mergeArrayById(existingData.usuarios, payload.usuarios),
      perfil: payload.perfil || existingData.perfil,
      lastUpdated: Date.now(),
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(mergedPayload, null, 2), 'utf-8');
    return res.json({ success: true, lastUpdated: mergedPayload.lastUpdated, data: mergedPayload });
  } catch (err) {
    console.error('Error writing store.json:', err);
    return res.status(500).json({ error: 'Failed to save shared data' });
  }
});

export default app;
