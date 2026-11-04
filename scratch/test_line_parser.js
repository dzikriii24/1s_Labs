function formatTextToEmailHtml(text) {
  if (!text || !text.trim()) return '';

  // If text is already full HTML with block tags, return as-is
  if (/<(?:p|div|table|ul|ol|header|section)[\s>]/i.test(text)) {
    return text;
  }

  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const elements = [];
  let currentBullets = [];
  let currentParagraph = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      const itemsHtml = currentBullets.map(b => 
        `<li style="margin-bottom: 8px;">${formatInlineMarkdown(b)}</li>`
      ).join('');
      elements.push(`<ul style="margin: 14px 0 18px 0; padding-left: 22px; color: #27272a; line-height: 1.65; font-size: 14px;">${itemsHtml}</ul>`);
      currentBullets = [];
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const pContent = currentParagraph.map(formatInlineMarkdown).join('<br/>\n');
      elements.push(`<p style="margin: 0 0 16px 0; line-height: 1.65; color: #18181b; font-size: 14px;">${pContent}</p>`);
      currentParagraph = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    if (!line) {
      // Empty line -> flush both paragraph and bullets
      flushBullets();
      flushParagraph();
      continue;
    }

    // Check for bullet list item: -, *, •
    if (/^[•\-\*]\s+/.test(line)) {
      flushParagraph();
      const itemContent = line.replace(/^[•\-\*]\s+/, '');
      currentBullets.push(itemContent);
      continue;
    }

    // Non-bullet line
    flushBullets();
    currentParagraph.push(line);
  }

  // Flush any remaining
  flushBullets();
  flushParagraph();

  return elements.join('\n');
}

function formatInlineMarkdown(str) {
  if (!str) return '';
  let res = str;
  // **bold**
  res = res.replace(/\*\*(.+?)\*\*/g, (_, p1) => `<strong style="color: #09090b; font-weight: 700;">${p1}</strong>`);
  // *italic*
  res = res.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, (_, p1) => `<em>${p1}</em>`);
  // [text](url)
  res = res.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (_, p1, p2) => `<a href="${p2}" target="_blank" style="color: #059669; text-decoration: underline; font-weight: 600;">${p1}</a>`);
  // Bare URLs (not already part of an <a> tag)
  res = res.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s<]+)/g, (_, p1) => `<a href="${p1}" target="_blank" style="color: #059669; text-decoration: underline; font-weight: 600;">${p1}</a>`);
  return res;
}

function htmlToFormattedText(html) {
  if (!html || !html.trim()) return '';

  let text = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Convert links <a href="url">text</a> -> [text](url)
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis, (match, url, linkText) => {
    const cleanText = linkText.replace(/<[^>]+>/g, '').trim();
    if (!cleanText || cleanText === url.trim()) return url.trim();
    return `[${cleanText}](${url.trim()})`;
  });

  // Convert strong/b -> **...**
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gis, (_, p1) => `**${p1.trim()}**`);

  // Convert em/i -> *...*
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gis, (_, p1) => `*${p1.trim()}*`);

  // Convert list items <li>item</li> -> \n- item
  text = text.replace(/<\s*li[^>]*>(.*?)<\s*\/\s*li\s*>/gis, (match, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    return `\n- ${cleanContent}`;
  });
  text = text.replace(/<\s*\/?\s*(?:ul|ol)[^>]*>/gi, '\n');

  // Convert <br> to newline
  text = text.replace(/<\s*br\s*\/?>/gi, '\n');

  // Convert </p>, </div>, </tr>, headings to double newlines
  text = text.replace(/<\s*\/\s*(?:p|div|tr|h[1-6])\s*>/gi, '\n\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // HTML entities decoding
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&bull;/g, '•');

  // Split lines, trim each
  const lines = text.split('\n').map(l => l.trim());
  const cleanText = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return cleanText;
}

// Test with HR Template
const hrTemplate = `<p>Halo <strong>{{candidate_name}}</strong>,</p>
<p>Terima kasih atas ketertarikan Anda untuk bergabung dengan tim <strong>1sLabs</strong> sebagai <strong>{{position_name}}</strong>.</p>
<p>Kami telah menerima berkas lamaran Anda dengan baik. Tim HR kami saat ini sedang meninjau kualifikasi dan pengalaman Anda sesuai kebutuhan posisi terkait:</p>
<ul>
  <li>Portofolio & rekam jejak teknis</li>
  <li>Kesesuaian kualifikasi & jam kerja</li>
  <li>Kesiapan tahapan interview</li>
</ul>
<p>Apabila profil Anda sesuai dengan kriteria yang dicari, tim kami akan menghubungi Anda kembali untuk tahapan proses seleksi selanjutnya dalam waktu 3-5 hari kerja.</p>
<p>Salam hangat,<br>
<strong>Tim Rekrutmen 1sLabs</strong><br>
1sLabs Technology Studio</p>`;

console.log("=== STEP 1: CONVERT HTML TEMPLATE TO CLEAN TEXT FOR TEXTAREA ===");
const cleanText = htmlToFormattedText(hrTemplate);
console.log(cleanText);

console.log("\n=== STEP 2: CONVERT CLEAN TEXT BACK TO EMAIL HTML ===");
const emailHtml = formatTextToEmailHtml(cleanText);
console.log(emailHtml);
