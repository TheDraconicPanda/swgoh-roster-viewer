const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

// Read a JSON file from ROOT, returning a default if missing/corrupt.
function readJsonFile(filename, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, filename), 'utf8'));
  } catch (e) {
    return defaultValue;
  }
}

const server = http.createServer((req, res) => {
  // Save endpoint
  if (req.method === 'POST' && req.url === '/save-journey') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!Array.isArray(data)) throw new Error('Expected a JSON array');
        const dest = path.join(ROOT, 'journey-data.json');
        fs.writeFileSync(dest, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Merge new character definitions into characters-data.json.
  // Body: array of character objects (same shape as /api/characters/).
  // New entries are appended; existing base_ids are overwritten with fresh data.
  if (req.method === 'POST' && req.url === '/save-characters') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        if (!Array.isArray(incoming)) throw new Error('Expected a JSON array');
        const dest = path.join(ROOT, 'characters-data.json');
        const existing = readJsonFile('characters-data.json', []);
        const map = {};
        existing.forEach(c => { map[c.base_id] = c; });
        incoming.forEach(c => { map[c.base_id] = c; });         // incoming wins
        const merged = Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
        fs.writeFileSync(dest, JSON.stringify(merged, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, total: merged.length, added: incoming.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Merge new ability entries into abilities-data.json.
  // Body: { units: { BASE_ID: { name, slug, abilities: [...] } } }
  // New keys are added; existing keys are overwritten.
  if (req.method === 'POST' && req.url === '/save-abilities') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        if (!incoming || typeof incoming.units !== 'object') throw new Error('Expected { units: {...} }');
        const dest    = path.join(ROOT, 'abilities-data.json');
        const current = readJsonFile('abilities-data.json', { _meta: {}, units: {} });
        const merged  = { ...current.units, ...incoming.units };
        const bundle  = {
          _meta: {
            schema_version: 1,
            source: 'html-scrape',
            generated_at: new Date().toISOString(),
            unit_count: Object.keys(merged).length,
          },
          units: merged,
        };
        fs.writeFileSync(dest, JSON.stringify(bundle, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, total: bundle._meta.unit_count, added: Object.keys(incoming.units).length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Save teams / fleets / farms — simple full-array overwrite (same as /save-journey)
  const SIMPLE_SAVES = {
    '/save-teams':  'teams-data.json',
    '/save-fleets': 'fleets-data.json',
    '/save-farms':  'farms-data.json',
  };
  if (req.method === 'POST' && SIMPLE_SAVES[req.url]) {
    const filename = SIMPLE_SAVES[req.url];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!Array.isArray(data)) throw new Error('Expected a JSON array');
        fs.writeFileSync(path.join(ROOT, filename), JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // Static file serving
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);

  // Prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`SWGOH Roster Viewer running at http://localhost:${PORT}`);
});
