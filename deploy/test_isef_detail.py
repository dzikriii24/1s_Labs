import requests
import re

headers = {'User-Agent': 'Mozilla/5.0'}
r = requests.get('https://bm.isef.co.id/umkm', headers=headers, timeout=15)
slugs = re.findall(r'href=[\'"](/umkm/iksp[^\'"]+)[\'"]', r.text)
print('Slugs found:', len(slugs), slugs[:3])

if slugs:
    for slug in slugs[:3]:
        det_url = 'https://bm.isef.co.id' + slug
        r_det = requests.get(det_url, headers=headers, timeout=15)
        print('\n--- Detail URL:', det_url)
        # Find any tel, mailto, wa.me, instagram, website
        links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', r_det.text)
        contact_links = [l for l in links if any(k in l.lower() for k in ['wa.me', 'whatsapp', 'tel:', 'mailto:', 'instagram.com', 'http'])]
        print('Contact links found:', contact_links[:10])
        # Find text with phone or email patterns
        emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', r_det.text)
        phones = re.findall(r'(?:08|\+628)[0-9-]{8,15}', r_det.text)
        print('Emails:', emails)
        print('Phones:', phones)

