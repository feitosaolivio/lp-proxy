const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/products', async (req, res) => {
  const { shop, token, product } = req.body;
  if (!shop || !token || !product) {
    return res.status(400).json({ error: 'shop, token e product são obrigatórios' });
  }
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({ product })
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/products', async (req, res) => {
  const { shop, token } = req.query;
  if (!shop || !token) {
    return res.status(400).json({ error: 'shop e token são obrigatórios' });
  }
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=20`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/shop', async (req, res) => {
  const { shop, token } = req.query;
  if (!shop || !token) {
    return res.status(400).json({ error: 'shop e token são obrigatórios' });
  }
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
