import re

html_sample = '''<p>Halo <strong>{{candidate_name}}</strong>,</p>
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
1sLabs Technology Studio</p>'''

def html_to_formatted_text(html):
    if not html:
        return ''
    text = html.replace('\r\n', '\n').replace('\r', '\n')

    # Convert links <a href="url">text</a>
    text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', lambda m: m.group(1) if m.group(1).strip() == m.group(2).strip() else f'[{m.group(2).strip()}]({m.group(1).strip()})', text, flags=re.I|re.S)

    # Convert strong/b
    text = re.sub(r'<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>', r'**\1**', text, flags=re.I|re.S)
    # Convert em/i
    text = re.sub(r'<(?:em|i)[^>]*>(.*?)</(?:em|i)>', r'*\1*', text, flags=re.I|re.S)

    # Convert list items: <li>item</li> -> - item\n
    text = re.sub(r'<\s*li[^>]*>\s*(.*?)\s*<\s*/\s*li\s*>', r'- \1\n', text, flags=re.I|re.S)
    text = re.sub(r'<\s*/?\s*(?:ul|ol)[^>]*>', '\n', text, flags=re.I)

    # Convert <br> to single newline
    text = re.sub(r'<\s*br\s*/?\s*>', '\n', text, flags=re.I)

    # Convert </p>, </div> to double newlines
    text = re.sub(r'<\s*/\s*(?:p|div|tr|h[1-6])\s*>', '\n\n', text, flags=re.I)

    # Strip remaining tags
    text = re.sub(r'<[^>]+>', '', text)

    # HTML entities
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&bull;', '•')

    # Clean up whitespace on each line
    lines = [l.strip() for l in text.split('\n')]
    joined = '\n'.join(lines)
    # Collapse 3+ newlines into 2
    joined = re.sub(r'\n{3,}', '\n\n', joined)
    return joined.strip()

def format_text_to_email_html(text):
    if not text:
        return ''
    # If text already contains block HTML tags, preserve
    if re.search(r'<(?:p|div|table|ul|ol|header|section)[\s>]', text, re.I):
        return text

    blocks = re.split(r'\n\s*\n', text.strip())
    html_parts = []

    for block in blocks:
        clean_block = block.strip()
        if not clean_block:
            continue

        lines = [l.strip() for l in clean_block.split('\n') if l.strip()]

        # Check if block is a bullet list (lines start with bullet symbols)
        if all(re.match(r'^[•\-\*]\s+', l) for l in lines):
            items_html = []
            for l in lines:
                item_content = re.sub(r'^[•\-\*]\s+', '', l)
                item_content = format_inline_markdown(item_content)
                items_html.append(f'<li style="margin-bottom: 6px;">{item_content}</li>')
            html_parts.append(f'<ul style="margin: 12px 0 16px 0; padding-left: 20px; color: #27272a; line-height: 1.6; font-size: 14px;">{"".join(items_html)}</ul>')
            continue

        # Check if block is a numbered list
        if all(re.match(r'^\d+\.\s+', l) for l in lines):
            items_html = []
            for l in lines:
                item_content = re.sub(r'^\d+\.\s+', '', l)
                item_content = format_inline_markdown(item_content)
                items_html.append(f'<li style="margin-bottom: 6px;">{item_content}</li>')
            html_parts.append(f'<ol style="margin: 12px 0 16px 0; padding-left: 20px; color: #27272a; line-height: 1.6; font-size: 14px;">{"".join(items_html)}</ol>')
            continue

        # Standard paragraph
        formatted_lines = [format_inline_markdown(l) for l in lines]
        para_content = '<br/>\n'.join(formatted_lines)
        html_parts.append(f'<p style="margin: 0 0 16px 0; line-height: 1.65; color: #18181b; font-size: 14px;">{para_content}</p>')

    return '\n'.join(html_parts)

def format_inline_markdown(line):
    # **bold**
    res = re.sub(r'\*\*(.+?)\*\*', r'<strong style="color: #09090b; font-weight: 700;">\1</strong>', line)
    # *italic*
    res = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', res)
    # [text](url)
    res = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', r'<a href="\2" target="_blank" style="color: #059669; text-decoration: underline; font-weight: 600;">\1</a>', res)
    # bare urls
    res = re.sub(r'(?<!href=")(?<!">)(https?://[^\s<]+)', r'<a href="\1" target="_blank" style="color: #059669; text-decoration: underline; font-weight: 600;">\1</a>', res)
    return res

formatted = html_to_formatted_text(html_sample)
print('--- CONVERTED TO CLEAN TEXT (What user sees in textarea) ---')
print(formatted)
print('\n--- RE-CONVERTED TO EMAIL HTML (What recipient gets) ---')
re_html = format_text_to_email_html(formatted)
print(re_html)
