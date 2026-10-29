import paramiko
import urllib.request
import time
import json

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

test_code = """const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        url: req.url,
        method: req.method,
        status: 'ok'
    }));
});
server.listen();
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/oneslabs-backend/index.js', 'w') as f:
    f.write(test_code)
sftp.close()

# touch restart.txt to reload Passenger
ssh.exec_command('mkdir -p /home/u1zh8984/oneslabs-backend/tmp && touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt')
ssh.close()
print("Restart touched. Waiting 3 seconds...")
time.sleep(3)

# Test accessing https://1slabs.my.id/api and https://1slabs.my.id/api/test-route
for path in ['https://1slabs.my.id/api', 'https://1slabs.my.id/api/test-route', 'https://1slabs.my.id/api/health']:
    try:
        req = urllib.request.Request(path, headers={'User-Agent': 'TestRunner/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read().decode('utf-8')
            print(f"URL: {path} -> {data}")
    except Exception as e:
        print(f"URL: {path} -> Error: {e}")
