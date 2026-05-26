const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json({limit: '50mb'}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Shopify proxy ─────────────────────────────────────────────
app.post('/', async (req, res) => {
  const { domain, token, path, method = 'GET', body } = req.body;
  if (!domain || !token || !path) return res.status(400).json({ error: 'Missing params' });
  if (!domain.endsWith('.myshopify.com')) return res.status(400).json({ error: 'Invalid domain' });
  if (!path.startsWith('/admin/api/')) return res.status(400).json({ error: 'Invalid path' });
  try {
    const url = `https://${domain}${path}`;
    const opts = { method, headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } };
    if (body && ['POST','PUT','PATCH'].includes(method)) opts.body = JSON.stringify(body);
    const response = await fetch(url, opts);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Image proxy — fetches any image URL and returns it ────────
// Allows browser to load cross-origin images without CORS issues
app.get('/img', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');
  try {
    const response = await fetch(decodeURIComponent(url));
    if (!response.ok) return res.status(response.status).send('Fetch failed');
    const contentType = response.headers.get('content-type') || 'image/png';
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'Ironwood proxy running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
