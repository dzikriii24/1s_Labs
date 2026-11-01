import os
import requests
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

api_key = os.environ.get('GEMINI_API', 'YOUR_GEMINI_API_KEY')
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}'

test_businesses = [
    {"name": "Alleira Batik", "category": "Retail Fashion", "city": "Jakarta Selatan"},
    {"name": "Armor Kopi", "category": "Coffee Shop", "city": "Bandung"},
    {"name": "BOOLAO", "category": "Fashion & Craft UMKM", "city": "Kab. Bandung"},
    {"name": "Sejiwa Coffee", "category": "Coffee Shop & Cafe", "city": "Bandung"}
]

for b in test_businesses:
    prompt = f"""
Sebagai AI Research Agent untuk 1sLabs Contact Intelligence, identifikasi informasi kontak publik resmi dari bisnis berikut:
Nama: {b['name']}
Kategori: {b['category']}
Kota/Wilayah: {b['city']}, Indonesia

Keluarkan JSON valid dengan skema:
{{
  "official_website": "url atau null",
  "public_phone": "nomor telepon publik atau null",
  "public_whatsapp": "nomor wa publik atau null",
  "public_email": "email bisnis publik atau null",
  "instagram_handle": "@handle atau url atau null",
  "public_address": "alamat toko/kantor atau null",
  "management_contact": {{
    "name": "nama pengelola/founder jika publik atau null",
    "role": "Owner | Founder | Store Manager | Manager | null"
  }},
  "confidence_score": number,
  "evidence_source": "string"
}}
ATURAN: Hanya sertakan kontak yang benar-benar ada dan diketahui. Jika tidak ditemukan, gunakan null. JANGAN MENGARANG.
"""

    r = requests.post(url, json={
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'responseMimeType': 'application/json'}
    }, timeout=20)
    print(f"\n--- {b['name']} ({b['city']}) ---")
    if r.status_code == 200:
        data = r.json()['candidates'][0]['content']['parts'][0]['text']
        print(data)
    else:
        print("Error:", r.status_code, r.text)

