import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def post_json(url, data, token=None):
    body = json.dumps(data).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as res:
            return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

# 1. Login with dzikrirabbani2401@gmail.com / Rabbani2401*
status, login_res = post_json('https://1slabs.my.id/api/auth/login', {
    'email': 'dzikrirabbani2401@gmail.com',
    'password': 'Password123!'
})
print("Login status:", status, "token present:", 'token' in login_res.get('data', {}))
token = login_res.get('data', {}).get('token')

if not token:
    # Try another known password
    status, login_res = post_json('https://1slabs.my.id/api/auth/login', {
        'email': 'dzikrirabbani2401@gmail.com',
        'password': 'Rabbani2401*'
    })
    print("Login retry status:", status, "token present:", 'token' in login_res.get('data', {}))
    token = login_res.get('data', {}).get('token')

for domain in ['kimholidaytravel.id', 'kimholidaytravelxxx.id', 'kimholidaytravel.com']:
    st, resp = post_json('https://1slabs.my.id/api/orders/check-domain', {'domain': domain}, token=token)
    print(f"\nDomain: {domain}\nStatus: HTTP {st}\nResponse: {resp}")
