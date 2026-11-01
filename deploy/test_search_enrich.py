import requests
import re
from urllib.parse import unquote

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def search_business_web(query_str):
    url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query_str)}"
    r = requests.get(url, headers=headers, timeout=10)
    links = []
    # Duckduckgo returns /l/?uddg=...
    for m in re.finditer(r'href="([^"]*uddg=[^"]*)"', r.text):
        raw = m.group(1)
        uddg_m = re.search(r'uddg=([^&]+)', raw)
        if uddg_m:
            target = unquote(uddg_m.group(1))
            if not any(skip in target for skip in ['duckduckgo.com', 'yandex', 'google.com/search']):
                links.append(target)
    return links

targets = [
    "Alleira Batik website instagram contact",
    "BOOLAO fashion bandung website instagram",
    "Sejiwa Coffee Bandung contact website instagram",
    "Warung Nasi Ibu Imas Bandung telepon whatsapp"
]

for q in targets:
    print(f"\nQuery: {q}")
    res = search_business_web(q)
    for l in res[:5]:
        print("  Found link:", l)

