const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Sin API key configurada en el servidor.' });

  let body = req.body;
  if (!body) return res.status(400).json({ error: 'Request body vacío.' });
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      return res.status(400).json({ error: 'Body inválido: ' + e.message });
    }
  }

  let payload;
  try { payload = JSON.stringify(body); } catch (e) {
    return res.status(500).json({ error: 'Error al serializar: ' + e.message });
  }

  const len = Buffer.byteLength(payload);

  return new Promise((resolve) => {
    const req2 = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': len,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          res.status(response.statusCode).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: 'Error al parsear respuesta: ' + e.message, raw: data.slice(0, 400) });
        }
        resolve();
      });
    });

    req2.on('error', (e) => {
      res.status(500).json({ error: e.message || 'Error de red', code: e.code || 'DESCONOCIDO' });
      resolve();
    });

    req2.setTimeout(20000, () => {
      req2.destroy();
      res.status(500).json({ error: 'Tiempo de espera agotado (20s)' });
      resolve();
    });

    req2.write(payload);
    req2.end();
  });
};
