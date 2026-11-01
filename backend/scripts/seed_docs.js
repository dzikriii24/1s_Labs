const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
  const jsonPath = '/tmp/seed_articles.json';
  if (!fs.existsSync(jsonPath)) {
    console.error('File /tmp/seed_articles.json does not exist');
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${articles.length} articles from JSON`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u1zh8984_oneslabs',
    password: process.env.DB_PASS || 'Rabbani2401*',
    database: process.env.DB_NAME || 'u1zh8984_oneslabs'
  });

  console.log('Connected to MySQL');

  let count = 0;
  for (const art of articles) {
    const slug = art.slug;
    const title = art.title;
    const category = art.category;
    const category_title = art.categoryTitle;
    const description = art.description || '';
    const reading_time = art.readingTime || '3 menit';
    const keywords = (art.keywords || []).join(', ');
    const toc_json = JSON.stringify(art.toc || []);
    const content = art.content || '';

    const sql = `
      INSERT INTO documentation_articles 
        (slug, title, category, category_title, description, reading_time, keywords, toc_json, content, status, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category = VALUES(category),
        category_title = VALUES(category_title),
        description = VALUES(description),
        reading_time = VALUES(reading_time),
        keywords = VALUES(keywords),
        toc_json = VALUES(toc_json),
        content = VALUES(content);
    `;

    await connection.execute(sql, [
      slug,
      title,
      category,
      category_title,
      description,
      reading_time,
      keywords,
      toc_json,
      content
    ]);
    count++;
  }

  console.log(`Successfully seeded ${count} documentation articles.`);
  await connection.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

