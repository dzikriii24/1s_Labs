import os

path = r'src/components/admin/views/hr/HREmailCampaignsTab.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add cleanMojibake at the top of component
helper = """
function cleanMojibake(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/â€˜|â€™/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/[“”]/g, '"')
    .replace(/ðŸ“…/g, '')
    .replace(/â°/g, '');
}
"""

if 'function cleanMojibake' not in text:
    text = text.replace('export const HREmailCampaignsTab: React.FC = () => {', helper + '\nexport const HREmailCampaignsTab: React.FC = () => {')

# Apply cleanMojibake in template fetch and selections
text = text.replace(
    'setTemplates(res.templates);',
    'const cleaned = (res.templates || []).map(t => ({ ...t, name: cleanMojibake(t.name), subject: cleanMojibake(t.subject), body_html: cleanMojibake(t.body_html), body_text: cleanMojibake(t.body_text || "") }));\n        setTemplates(cleaned);'
)

text = text.replace(
    'setComposeSubject(t.subject);',
    'setComposeSubject(cleanMojibake(t.subject));'
)
text = text.replace(
    'setComposeBody(t.body_html);',
    'setComposeBody(cleanMojibake(t.body_html));'
)
text = text.replace(
    'setComposeSubject(tmpl.subject);',
    'setComposeSubject(cleanMojibake(tmpl.subject));'
)
text = text.replace(
    'setComposeBody(tmpl.body_html);',
    'setComposeBody(cleanMojibake(tmpl.body_html));'
)

# In replacePreviewText
text = text.replace(
    'const sampleName = recipientName ||',
    'text = cleanMojibake(text);\n    const sampleName = recipientName ||'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated HREmailCampaignsTab.tsx with cleanMojibake successfully.')

