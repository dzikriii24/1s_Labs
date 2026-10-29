import urllib.request
import json

BASE_URL = "https://1slabs.my.id/api"
HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Content-Type': 'application/json'
}

def login():
    data = json.dumps({"email": "admin@1slabs.my.id", "password": "Admin1sLabs2026!"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res['token']

def test_query():
    token = login()
    headers = {**HEADERS, 'Authorization': f'Bearer {token}'}
    service_code = 'SRV-2026-179F76'
    
    # Get databases
    req_db = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases", headers=headers)
    with urllib.request.urlopen(req_db) as resp:
        db_data = json.loads(resp.read().decode('utf-8'))
        print("Existing databases:", db_data)
        db_id = db_data['databases'][0]['id']
        db_name = db_data['databases'][0]['db_name']

    # Execute CREATE TABLE query
    create_sql = """
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    q_data = json.dumps({"sql": create_sql}).encode('utf-8')
    req_query = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases/{db_id}/query", data=q_data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req_query) as resp:
            q_res = json.loads(resp.read().decode('utf-8'))
            print("Query execution response:", q_res)
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code, e.read().decode('utf-8'))
        return

    # Now verify tables list
    req_tables = urllib.request.Request(f"{BASE_URL}/services/{service_code}/databases/{db_id}/tables", headers=headers)
    with urllib.request.urlopen(req_tables) as resp:
        tbl_data = json.loads(resp.read().decode('utf-8'))
        print("Tables in database:", tbl_data)

if __name__ == '__main__':
    test_query()
