/**
 * 1sLabs Email Formatter Utility
 * 
 * Allows writing email bodies in natural, human-friendly plain text with Markdown highlights:
 * - Enter / double line breaks (\n\n) for clean paragraphs
 * - **bold text** for strong emphasis
 * - *italic text* for subtle emphasis
 * - Bullet lists (- item, • item, * item)
 * - Numbered lists (1. item, 2. item)
 * - Markdown links [text](url) and bare URLs
 * - CTA Buttons: standalone [Label ->](url), [BUTTON: Label](url), or any standalone [Label](url)
 * 
 * Automatically converts natural text to pixel-perfect, responsive inline-styled HTML
 * that matches the official 1sLabs minimalist email design.
 * Also provides two-way conversion from legacy HTML templates into clean plain text for editing.
 */

/**
 * Fix any Latin1 mojibake characters (e.g. "â€“" -> "-")
 */
export function cleanMojibake(str: string): string {
  if (!str) return '';
  return str
    .replace(/3[^\d\s]+5/g, '3-5')
    .replace(/1[^\d\s]+2/g, '1-2')
    .replace(/ÔÇô/g, '-')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€ /g, '"')
    .replace(/[“”]/g, '"')
    .replace(/Â·/g, '•')
    .replace(/Â/g, '');
}

/**
 * Detect if a string is predominantly raw HTML and has no markdown syntax
 */
export function isRawHtml(content: string): boolean {
  if (!content) return false;
  return /<(?:p|div|table|ul|ol|header|section|tbody|tr|td)[\s>]/i.test(content) && !/\[[^\]]+\]\([^)]+\)/.test(content);
}

/**
 * Render official 1sLabs centered black CTA button HTML
 */
export function renderCtaButtonHtml(label: string, url: string): string {
  let cleanLabel = cleanMojibake(label).trim();
  // Strip any existing arrow so we don't duplicate
  cleanLabel = cleanLabel.replace(/(?:->|&rarr;|→)\s*$/i, '').trim();
  cleanLabel = `${cleanLabel} &rarr;`;

  return `<div style="text-align: center; margin: 28px 0;">
  <a href="${url.trim()}" target="_blank" style="background-color: #18181b; color: #ffffff; display: inline-block; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); letter-spacing: 0.2px;">
    ${cleanLabel}
  </a>
</div>`;
}

/**
 * Format inline markdown: bold, italic, links, and bare URLs
 */
export function formatInlineMarkdown(text: string): string {
  if (!text) return '';
  let res = cleanMojibake(text);

  // Explicit CTA Button pattern: [BUTTON: Label](url)
  res = res.replace(/\[BUTTON:\s*([^\]]+)\]\(([^)]+)\)/gi, (_, label, url) => {
    return renderCtaButtonHtml(label, url);
  });

  // **bold** -> <strong>
  res = res.replace(/\*\*(.+?)\*\*/g, (_, p1) => {
    return `<strong style="color: #09090b; font-weight: 700;">${p1}</strong>`;
  });

  // *italic* -> <em>
  res = res.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, (_, p1) => {
    return `<em>${p1}</em>`;
  });

  // Markdown links: [text](url) -> <a> (supports URLs or template placeholders)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, p1, p2) => {
    return `<a href="${p2.trim()}" target="_blank" style="color: #18181b; text-decoration: underline; font-weight: 600;">${p1}</a>`;
  });

  // Bare URLs (not already part of an href or <a> tag)
  res = res.replace(/(?<!href=")(?<!">)(https?:\/\/[^\s<]+)/g, (_, p1) => {
    return `<a href="${p1}" target="_blank" style="color: #18181b; text-decoration: underline; font-weight: 600;">${p1}</a>`;
  });

  return res;
}

/**
 * Converts natural plain text / markdown into official 1sLabs styled email HTML
 */
export function formatTextToEmailHtml(text: string): string {
  if (!text || !text.trim()) return '';

  const cleaned = cleanMojibake(text);

  // If already structured HTML with paragraphs/tables and no markdown links, return as is
  if (isRawHtml(cleaned)) {
    return cleaned;
  }

  const rawLines = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const elements: string[] = [];
  let currentBullets: string[] = [];
  let currentNumbers: string[] = [];
  let currentParagraph: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      const itemsHtml = currentBullets.map(b => 
        `<li style="margin-bottom: 7px;">${formatInlineMarkdown(b)}</li>`
      ).join('');
      elements.push(`<ul style="margin: 12px 0 16px 0; padding-left: 22px; color: #27272a; line-height: 1.65; font-size: 14px;">${itemsHtml}</ul>`);
      currentBullets = [];
    }
  };

  const flushNumbers = () => {
    if (currentNumbers.length > 0) {
      const itemsHtml = currentNumbers.map(n => 
        `<li style="margin-bottom: 7px;">${formatInlineMarkdown(n)}</li>`
      ).join('');
      elements.push(`<ol style="margin: 12px 0 16px 0; padding-left: 22px; color: #27272a; line-height: 1.65; font-size: 14px;">${itemsHtml}</ol>`);
      currentNumbers = [];
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
      // Empty line -> flush blocks to start new paragraph
      flushBullets();
      flushNumbers();
      flushParagraph();
      continue;
    }

    // Check for CTA button syntax on its own line:
    // Matches: [BUTTON: Label](url) OR [Label ->](url) OR ANY standalone [Label](url)
    const buttonMatch = line.match(/^\[(?:BUTTON:\s*)?([^\]]+)\]\(([^)]+)\)$/i);
    if (buttonMatch) {
      flushBullets();
      flushNumbers();
      flushParagraph();
      elements.push(renderCtaButtonHtml(buttonMatch[1], buttonMatch[2]));
      continue;
    }

    // Check for bullet list item: -, *, •
    if (/^[•\-\*]\s+/.test(line)) {
      flushParagraph();
      flushNumbers();
      const itemContent = line.replace(/^[•\-\*]\s+/, '');
      currentBullets.push(itemContent);
      continue;
    }

    // Check for numbered list item: 1. , 2. 
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      flushBullets();
      const itemContent = line.replace(/^\d+\.\s+/, '');
      currentNumbers.push(itemContent);
      continue;
    }

    // Regular text line
    flushBullets();
    flushNumbers();
    currentParagraph.push(line);
  }

  // Flush remaining blocks
  flushBullets();
  flushNumbers();
  flushParagraph();

  return elements.join('\n');
}

/**
 * Converts legacy HTML template (e.g. with <p>, <strong>, <ul>, <li>, buttons)
 * into clean, readable formatted plain text suitable for editing in a textarea
 */
export function htmlToFormattedText(html: string): string {
  if (!html || !html.trim()) return '';

  let text = cleanMojibake(html).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Convert links & buttons
  text = text.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis, (match, url, linkText) => {
    const cleanText = linkText.replace(/<[^>]+>/g, '').trim();
    if (!cleanText || cleanText === url.trim()) return url.trim();
    const isButton = /style=["'][^"']*(?:background|border-radius|padding)[^"']*["']/i.test(match) ||
                     /(?:btn|button)/i.test(match) ||
                     /(?:&rarr;|→|->)$/.test(cleanText);
    if (isButton) {
      return `\n\n[${cleanText}](${url.trim()})\n\n`;
    }
    return `[${cleanText}](${url.trim()})`;
  });

  // Convert <br> to single newline first
  text = text.replace(/<\s*br\s*\/?>/gi, '\n');

  // Convert list items <li>item</li> -> \n- item
  text = text.replace(/<\s*li[^>]*>(.*?)<\s*\/\s*li\s*>/gis, (_, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    return `\n- ${cleanContent}\n`;
  });
  text = text.replace(/<\s*\/?\s*(?:ul|ol)[^>]*>/gi, '\n');

  // Convert </p>, </div>, </tr>, headings to double newlines
  text = text.replace(/<\s*\/\s*(?:p|div|tr|h[1-6])\s*>/gi, '\n\n');

  // Convert strong/b -> **...**
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gis, (_, p1) => {
    return `**${p1.trim()}**`;
  });

  // Convert em/i -> *...*
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gis, (_, p1) => {
    return `*${p1.trim()}*`;
  });

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

  // Split lines, trim each line
  const lines = text.split('\n').map(l => l.trim());
  const clean = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return clean;
}

/**
 * Substitute dynamic variables like {{candidate_name}}, {{position_name}}, etc.
 */
export function substitutePlaceholders(template: string, vars: Record<string, string>): string {
  if (!template) return '';
  let res = cleanMojibake(template);
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    res = res.replace(regex, val || '');
  }
  return res;
}
