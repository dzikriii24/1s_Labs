const https = require('https');
const jwt = require('./backend/node_modules/jsonwebtoken');

require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const JWT_SECRET = process.env.JWT_SECRET || 'oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f';
const token = jwt.sign({ id: 1, email: 'admin@1slabs.my.id', role: 'admin' }, JWT_SECRET);

function request(path) {
  return new Promise((resolve) => {
    https.get({
      hostname: '1slabs.my.id',
      path,
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'Verifier/1.0' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: data });
        }
      });
    });
  });
}

async function run() {
  console.log('Testing Live Production HR Inbox Threads & Templates...');
  
  // 1. Inbox threads
  const inbox = await request('/api/admin/hr/inbox/threads');
  console.log('Inbox threads count:', inbox.threads ? inbox.threads.length : 0);
  if (inbox.threads && inbox.threads.length > 0) {
    console.log('First Thread:', {
      from: inbox.threads[0].from_email,
      name: inbox.threads[0].from_name,
      candidate: inbox.threads[0].candidate_name,
      subject: inbox.threads[0].last_subject,
      preview: inbox.threads[0].last_preview?.substring(0, 80)
    });
  }

  // 2. Templates
  const tmpls = await request('/api/admin/hr/emails/templates');
  console.log('Templates count:', tmpls.templates ? tmpls.templates.length : 0);
  if (tmpls.templates && tmpls.templates.length > 0) {
    const t1 = tmpls.templates[0];
    console.log('Template 1:', {
      key: t1.template_key,
      hasMojibake: t1.body_html.includes('â€“') || t1.body_html.includes('â'),
      containsHyphen35: t1.body_html.includes('3-5')
    });
  }
}

run();

