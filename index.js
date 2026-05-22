const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json({limit: '50mb'}));

// Allow all origins since this is your personal tool
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/', async (req, res) => {
  const { domain, token, path, method = 'GET', body } = req.body;

  if (!domain || !token || !path) {
    return res.status(400).json({ error: 'Missing domain, token, or path' });
  }
  if (!domain.endsWith('.myshopify.com')) {
    return res.status(400).json({ error: 'Invalid domain' });
  }
  if (!path.startsWith('/admin/api/')) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  try {
    const url = `https://${domain}${path}`;
    const options = {
      method,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    };
    if (body && ['POST','PUT','PATCH'].includes(method)) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'Ironwood proxy running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
