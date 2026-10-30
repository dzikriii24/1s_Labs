import requests
import json

url = "https://1slabs.my.id/api/debug-domain?domain=kimholidaytravel.id"
try:
    resp = requests.get(url, headers={"Cache-Control": "no-cache", "Pragma": "no-cache"}, timeout=10)
    print("Status:", resp.status_code)
    print("Headers:", resp.headers)
    print("Body:", resp.text)
except Exception as e:
    print("Error:", e)
