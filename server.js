const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.CLIENT_ID || 'e13c51811f47ac2354f9f0ab70888db9';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const SCOPES = 'read_products,write_products';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://lp-proxy.onrender.com/auth/callback';

app.use(cors({ origin: '*' }));
app.use(express.json());

const tokens = {};

app.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('shop obrigatorio');
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send('Parametros invalidos');
  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code })
    });
    const data = await response.json();
    if (data.access_token) {
      tokens[shop] = data.access_token;
      res.send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2 style="color:#008060">Conectado!</h2><p>Token para <strong>${shop}</strong>:</p><code style="background:#f0f0f0;padding:12px;display:block;margin:16px 0;word-break:break-all;border-radius:8px">${data.access_token}</code><button onclick="navigator.clipboard.writeText('${data.access_token}');this.textContent='Copiado!'" style="background:#008060;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer">Copiar token</button></body></html>`);
    } else {
      res.status(400).send('Erro: ' + JSON.stringify(data));
    }
  } catch (e) {
    res.status(500).send('Erro: ' + e.message);
  }
});

app.post('/api/products', async (req, res) => {
  const { shop, token, product } = req.body;
  const accessToken = token || tokens[shop];
  if (!shop || !accessToken || !product) return res.status(400).json({ error: 'shop, token e product sao obrigatorios' });
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ product })
    });
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products', async (req, res) => {
  const { shop, token } = req.query;
  const accessToken = token || tokens[shop];
  if (!shop || !accessToken) return res.status(400).json({ error: 'shop e token sao obrigatorios' });
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=20`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/shop', async (req, res) => {
  const { shop, token } = req.query;
  const accessToken = token || tokens[shop];
  if (!shop || !accessToken) return res.status(400).json({ error: 'shop e token sao obrigatorios' });
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
