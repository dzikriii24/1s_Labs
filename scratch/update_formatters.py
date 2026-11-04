import re

with open('src/utils/emailFormatter.ts', 'r', encoding='utf-8') as f:
    ts_code = f.read()

clean_func_ts = """export function cleanMojibake(str: string): string {
  if (!str) return '';
  return str
    .replace(/3[^\\d\\s]+5/g, '3-5')
    .replace(/1[^\\d\\s]+2/g, '1-2')
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
}"""

ts_code = re.sub(r'export function cleanMojibake\(str: string\): string \{[\s\S]*?\}', lambda m: clean_func_ts, ts_code)
with open('src/utils/emailFormatter.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

with open('backend/src/utils/emailFormatter.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

clean_func_js = """function cleanMojibake(str) {
  if (!str) return '';
  return String(str)
    .replace(/3[^\\d\\s]+5/g, '3-5')
    .replace(/1[^\\d\\s]+2/g, '1-2')
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
}"""

js_code = re.sub(r'function cleanMojibake\(str\) \{[\s\S]*?\}', lambda m: clean_func_js, js_code)
with open('backend/src/utils/emailFormatter.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Both emailFormatter files updated successfully!")
