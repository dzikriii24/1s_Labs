const { query } = require('../backend/src/db');
const { cleanMojibake, htmlToFormattedText } = require('../backend/src/utils/emailFormatter');

async function main() {
  const rows = await query('SELECT id, template_key, name, subject, body_html FROM hr_email_templates');
  for (const r of rows) {
    const cleanSubject = cleanMojibake(r.subject).replace(/[–—]/g, '-');
    const cleanHtml = cleanMojibake(r.body_html).replace(/[–—]/g, '-');
    const cleanText = htmlToFormattedText(cleanHtml).replace(/[–—]/g, '-');
    await query(
      'UPDATE hr_email_templates SET subject = ?, body_html = ?, body_text = ? WHERE id = ?',
      [cleanSubject, cleanHtml, cleanText, r.id]
    );
    console.log(`Cleaned template ${r.id} (${r.template_key})`);
  }
  console.log('All templates cleaned of non-ASCII hyphens!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

