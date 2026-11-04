const { query } = require('./backend/src/db');
const { htmlToFormattedText } = require('./backend/src/utils/emailFormatter');

async function main() {
  const templates = await query('SELECT id, template_key, name, body_html FROM hr_email_templates');
  console.log(`Loaded ${templates.length} templates from database.`);

  for (const t of templates) {
    const cleanText = htmlToFormattedText(t.body_html);
    await query('UPDATE hr_email_templates SET body_text = ? WHERE id = ?', [cleanText, t.id]);
    console.log(`[OK] Updated template ${t.id} (${t.template_key}): ${cleanText.slice(0, 45)}...`);
  }

  console.log('All templates synced successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

