const https = require('https');
const jwt = require('jsonwebtoken');

// Load JWT_SECRET from backend/.env if possible, or fallback
require('dotenv').config({ path: './backend/.env' });
const JWT_SECRET = process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f';

const token = jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, JWT_SECRET);

const endpoints = [
  { name: 'HR Stats', path: '/api/admin/hr/stats' },
  { name: 'HR Positions', path: '/api/admin/hr/positions' },
  { name: 'HR Templates', path: '/api/admin/hr/templates' },
  { name: 'HR Candidates', path: '/api/admin/hr/candidates' },
  { name: 'HR Inbox Threads', path: '/api/admin/hr/inbox' },
  { name: 'HR Interview Slots', path: '/api/admin/hr/interviews/slots' }
];

async function checkEndpoint(ep) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: '1slabs.my.id',
      path: ep.path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'HRVerifier/1.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log(`[PASS] ${ep.name} (HTTP ${res.statusCode}): success=${json.success}`);
          resolve({ ok: true, status: res.statusCode, json });
        } catch (e) {
          console.log(`[FAIL] ${ep.name} (HTTP ${res.statusCode}): non-JSON response ->`, body.substring(0, 150));
          resolve({ ok: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`[ERROR] ${ep.name}:`, err.message);
      resolve({ ok: false, error: err.message });
    });

    req.end();
  });
}

async function run() {
  console.log('Testing Live HR Endpoints on https://1slabs.my.id ...');
  for (const ep of endpoints) {
    await checkEndpoint(ep);
  }
}

run();

