const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'vacations.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ vacations: [], selectedId: null }, null, 2));
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ password: '1234' }, null, 2));
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function send(res, status, payload, headers = {}) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': typeof payload === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(body);
}

function serveFile(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(ROOT, safePath);
  if (!fullPath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) return send(res, 404, 'Not Found');
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  ensureStorage();
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (requestUrl.pathname === '/api/data' && req.method === 'GET') {
      return send(res, 200, readJson(DATA_FILE));
    }

    if (requestUrl.pathname === '/api/data' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!Array.isArray(body.vacations)) {
        return send(res, 400, { error: 'Expected { vacations: [], selectedId }' });
      }
      writeJson(DATA_FILE, {
        vacations: body.vacations,
        selectedId: body.selectedId || null,
      });
      return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }

    if (requestUrl.pathname === '/api/password' && req.method === 'GET') {
      const settings = readJson(SETTINGS_FILE);
      return send(res, 200, { password: settings.password || '1234' });
    }

    if (requestUrl.pathname === '/api/password' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.password || typeof body.password !== 'string') {
        return send(res, 400, { error: 'password is required' });
      }
      writeJson(SETTINGS_FILE, { password: body.password });
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET') {
      return serveFile(res, requestUrl.pathname);
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Vacation Planner running on http://localhost:${PORT}`);
});
