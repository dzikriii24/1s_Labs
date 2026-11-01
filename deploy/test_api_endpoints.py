import requests
import json

BASE_URL = "https://1slabs.my.id/api"

def main():
    print("=" * 60)
    print("Testing 1sLabs Live Marketing API Endpoints")
    print("=" * 60)

    # 1. Login
    login_payload = {
        "email": "dzikrirabbani2401@gmail.com",
        "password": "Password123!" # admin test credentials
    }

    session = requests.Session()
    # Try logging in with the known admin email
    res = session.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
    if res.status_code != 200:
        print(f"Login with standard password returned {res.status_code}: {res.text}")
        print("Fetching via server node direct test...")
        return
    
    token = res.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    print("Successfully authenticated.")

    # 2. Get Stats
    r = session.get(f"{BASE_URL}/admin/marketing/stats", headers=headers)
    print("\n[GET /admin/marketing/stats]:", r.status_code)
    if r.status_code == 200:
        stats = r.json()
        print("Total prospects:", stats.get('overview', {}).get('total_prospects'))
        print("Quota info:", stats.get('quota'))

    # 3. Get Indonesia Companies
    r = session.get(f"{BASE_URL}/admin/marketing/companies?scope=indonesia&limit=5", headers=headers)
    print("\n[GET /admin/marketing/companies?scope=indonesia]:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print(f"Found {data.get('pagination', {}).get('total')} Indonesia businesses")
        for c in data.get('data', [])[:3]:
            print(f"  - {c.get('name')} ({c.get('business_scale')}) - {c.get('city')}, WA: {c.get('whatsapp_number')}, IG: {c.get('instagram_url')}")

    # 4. Get International Companies
    r = session.get(f"{BASE_URL}/admin/marketing/companies?scope=international&limit=5", headers=headers)
    print("\n[GET /admin/marketing/companies?scope=international]:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print(f"Found {data.get('pagination', {}).get('total')} International businesses")
        for c in data.get('data', [])[:3]:
            print(f"  - {c.get('name')} ({c.get('country')}) - {c.get('category')}, Phone: {c.get('phone')}, Currency: {c.get('currency')}")

    # 5. Get Contacts
    r = session.get(f"{BASE_URL}/admin/marketing/contacts?limit=5", headers=headers)
    print("\n[GET /admin/marketing/contacts]:", r.status_code)
    if r.status_code == 200:
        data = r.json()
        print(f"Found {data.get('pagination', {}).get('total')} contacts")

if __name__ == '__main__':
    main()

