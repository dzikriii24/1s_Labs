const { query } = require('../backend/src/db');

async function main() {
  const rows = await query('SELECT id, name, subject, body_html, body_text FROM hr_email_templates');
  for (const r of rows) {
    let html = r.body_html || '';
    let text = r.body_text || '';
    let subj = r.subject || '';

    // Replace all variations of mojibake en-dashes
    const cleanStr = (s) => s
      .replace(/3[^\d]+5/g, '3-5')
      .replace(/1[^\d]+2/g, '1-2')
      .replace(/ÔÇô/g, '-')
      .replace(/â€“/g, '-')
      .replace(/â€”/g, '-')
      .replace(/[–—]/g, '-')
      .replace(/Â·/g, '•')
      .replace(/Â/g, '');

    html = cleanStr(html);
    text = cleanStr(text);
    subj = cleanStr(subj);

    await query(
      'UPDATE hr_email_templates SET subject = ?, body_html = ?, body_text = ? WHERE id = ?',
      [subj, html, text, r.id]
    );
    console.log(`Cleaned template ${r.id}`);
  }
  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

