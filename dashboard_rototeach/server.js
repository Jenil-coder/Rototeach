const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Proxy endpoint — fetches Google Sheets CSV server-side (no CORS)
app.get('/api/fetch-sheet', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Convert share URL → export CSV URL
  let fetchUrl = url;

  try {
    const decoded = decodeURIComponent(url);

    // Already a publish/export URL → use as-is
    if (decoded.includes('/pub?') || decoded.includes('format=csv') || decoded.endsWith('.csv')) {
      fetchUrl = decoded;
    } else {
      // Standard share URL: extract spreadsheet ID and optional gid
      const idMatch = decoded.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!idMatch) {
        return res.status(400).json({ error: 'Could not extract spreadsheet ID from URL. Make sure the sheet is shared as "Anyone with the link can view".' });
      }
      const spreadsheetId = idMatch[1];
      const gidMatch = decoded.match(/[#&?]gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      fetchUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    }

    const response = await axios.get(fetchUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RototechDashboard/1.0)',
        'Accept': 'text/csv,text/plain,*/*'
      },
      maxRedirects: 5,
      responseType: 'text'
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(response.data);

  } catch (err) {
    console.error('Fetch error:', err.message);
    if (err.response) {
      return res.status(502).json({
        error: `Google Sheets returned ${err.response.status}. Make sure the sheet is shared as "Anyone with the link can view".`
      });
    }
    return res.status(502).json({ error: `Failed to fetch sheet: ${err.message}` });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Rototech Dashboard running at http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = PORT + 1;
    console.warn(`⚠️  Port ${PORT} is busy. Trying port ${nextPort}...`);
    server.close();
    app.listen(nextPort, () => {
      console.log(`\n🚀 Rototech Dashboard running at http://localhost:${nextPort}\n`);
    });
  } else {
    throw err;
  }
});
