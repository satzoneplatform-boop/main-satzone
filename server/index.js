import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { JsonResultsStore, CATEGORIES } from './store.js';
import { validateCreate, validateUpdate } from './validation.js';
import { checkPassword, issueToken, requireAdmin } from './auth.js';
import { upload, saveOptimizedImage } from './images.js';

/**
 * Results CMS server.
 *
 * Exposes the CMS REST API under `/cms/api`, serves uploaded student photos
 * from `/uploads`, and — in production — serves the built SPA from `dist/`
 * with a history-API fallback. In development the Vite dev server proxies
 * `/cms` here and serves the SPA + `public/` itself.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads', 'students');
const DIST_DIR = path.join(ROOT, 'dist');
const PORT = Number(process.env.CMS_PORT) || 8787;
const isProd = process.env.NODE_ENV === 'production';

// Single seam for a future DB: swap this line for another ResultsStore impl.
const store = new JsonResultsStore({ dataDir: DATA_DIR });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

/** Wrap an async handler so rejections reach the error middleware. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Pull and validate the `category` query param. */
function category(req, res) {
  const c = req.query.category;
  if (!CATEGORIES.includes(c)) {
    res.status(400).json({ error: { code: 'bad_category', message: 'Unknown or missing category' } });
    return null;
  }
  return c;
}

const api = express.Router();

/* ----------------------------- Public routes ---------------------------- */

// Published results only — this is what the landing page fetches.
api.get(
  '/results',
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    res.json({ results: await store.list(c, { publishedOnly: true }) });
  }),
);

/* ------------------------------ Admin: auth ------------------------------ */

api.post('/admin/login', (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: { code: 'invalid_password', message: 'Incorrect password' } });
  }
  res.json({ token: issueToken() });
});

// Cheap endpoint the admin UI hits on load to check a stored token is still valid.
api.get('/admin/session', requireAdmin, (_req, res) => res.json({ ok: true }));

/* ------------------------------ Admin: CRUD ------------------------------ */

api.get(
  '/admin/results',
  requireAdmin,
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    res.json({ results: await store.list(c) });
  }),
);

api.post(
  '/admin/results',
  requireAdmin,
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    const result = validateCreate(c, req.body);
    if (!result.ok) {
      return res.status(422).json({ error: { code: 'validation', message: 'Invalid data', details: result.errors } });
    }
    res.status(201).json({ result: await store.create(c, result.data) });
  }),
);

api.put(
  '/admin/results/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    const result = validateUpdate(c, req.body);
    if (!result.ok) {
      return res.status(422).json({ error: { code: 'validation', message: 'Invalid data', details: result.errors } });
    }
    const updated = await store.update(c, req.params.id, result.data);
    if (!updated) return res.status(404).json({ error: { code: 'not_found', message: 'Result not found' } });
    res.json({ result: updated });
  }),
);

api.patch(
  '/admin/results/:id/publish',
  requireAdmin,
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    const updated = await store.setPublished(c, req.params.id, Boolean(req.body?.published));
    if (!updated) return res.status(404).json({ error: { code: 'not_found', message: 'Result not found' } });
    res.json({ result: updated });
  }),
);

api.delete(
  '/admin/results/:id',
  requireAdmin,
  wrap(async (req, res) => {
    const c = category(req, res);
    if (!c) return;
    const ok = await store.remove(c, req.params.id);
    if (!ok) return res.status(404).json({ error: { code: 'not_found', message: 'Result not found' } });
    res.status(204).end();
  }),
);

/* ----------------------------- Admin: upload ----------------------------- */

api.post(
  '/admin/upload',
  requireAdmin,
  upload.single('file'),
  wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: { code: 'no_file', message: 'No image provided' } });
    const saved = await saveOptimizedImage(req.file.buffer, UPLOADS_DIR);
    res.status(201).json(saved);
  }),
);

app.use('/cms/api', api);

/* --------------------------- Static / SPA (prod) ------------------------- */

// Uploaded images are served in every environment (dev proxies here too if it
// ever needs to; Vite normally serves them straight from public/).
app.use(
  '/uploads',
  express.static(path.join(ROOT, 'public', 'uploads'), { maxAge: '7d', fallthrough: true }),
);

if (isProd) {
  app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }));
  // SPA history fallback for everything that isn't an API/upload request.
  app.get(/^(?!\/cms\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

/* ------------------------------ Error handler ---------------------------- */

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[cms] error:', err);
  res.status(status).json({ error: { code: err.code || 'server_error', message: err.message || 'Server error' } });
});

app.listen(PORT, () => {
  console.log(`[cms] listening on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});
