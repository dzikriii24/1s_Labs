import pymysql
import os
import re

DB_HOST = "103.119.237.132"
DB_USER = "u1zh8984_oneslabs"
DB_PASS = "4v25U7b%E3g#"
DB_NAME = "u1zh8984_oneslabs"

def html_to_formatted_text(html):
    if not html:
        return ''
    text = html.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', lambda m: m.group(1).strip() if m.group(1).strip() == m.group(2).strip() else f"[{m.group(2).strip()}]({m.group(1).strip()})", text, flags=re.I|re.S)
    text = re.sub(r'<\s*br\s*/?\s*>', '\n', text, flags=re.I)
    text = re.sub(r'<\s*li[^>]*>(.*?)<\s*/\s*li\s*>', lambda m: f"\n- {m.group(1).strip()}\n", text, flags=re.I|re.S)
    text = re.sub(r'<\s*/?\s*(?:ul|ol)[^>]*>', '\n', text, flags=re.I)
    text = re.sub(r'<\s*/\s*(?:p|div|tr|h[1-6])\s*>', '\n\n', text, flags=re.I)
    text = re.sub(r'<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>', lambda m: f"**{m.group(1).strip()}**", text, flags=re.I|re.S)
    text = re.sub(r'<(?:em|i)[^>]*>(.*?)</(?:em|i)>', lambda m: f"*{m.group(1).strip()}*", text, flags=re.I|re.S)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&bull;', '•')
    lines = [l.strip() for l in text.split('\n')]
    clean = '\n'.join(lines)
    clean = re.sub(r'\n{3,}', '\n\n', clean).strip()
    return clean

conn = pymysql.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASS,
    database=DB_NAME,
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cur:
    cur.execute("SELECT id, template_key, name, body_html FROM hr_email_templates")
    rows = cur.fetchall()
    print(f"Loaded {len(rows)} templates.")
    for r in rows:
        clean_text = html_to_formatted_text(r['body_html'])
        cur.execute("UPDATE hr_email_templates SET body_text = %s WHERE id = %s", (clean_text, r['id']))
        print(f"Updated template {r['id']} ({r['template_key']}): {len(clean_text)} chars")
    conn.commit()

print("All templates body_text successfully synced with clean formatted text!")

