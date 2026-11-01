import paramiko
import json
import base64

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

# We want to keep the first occurrence of each and remove subsequent ones
while True:
    _, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
    zone_data = json.loads(out.read().decode('utf-8'))
    
    current_serial = None
    seen = set()
    to_remove = None
    
    for rec in zone_data.get('result', {}).get('data', []):
        if rec.get('record_type') == 'SOA':
            current_serial = int(base64.b64decode(rec['data_b64'][2]).decode('utf-8'))
        dname = rec.get('dname_raw', '')
        if dname in ['r.mail', 'brevo1._domainkey', 'brevo2._domainkey']:
            if dname in seen:
                to_remove = rec.get('line_index')
                break
            else:
                seen.add(dname)
                
    if to_remove is None:
        print("No more duplicates found!")
        break
        
    print(f"Removing duplicate line {to_remove} (serial {current_serial})...")
    cmd = f"uapi --output=json DNS mass_edit_zone zone=1slabs.my.id serial={current_serial} remove={to_remove}"
    _, stdout, stderr = ssh.exec_command(cmd)
    res = json.loads(stdout.read().decode('utf-8'))
    if res.get('result', {}).get('status') == 1:
        print(f"Removed line {to_remove} successfully.")
    else:
        print(f"Failed to remove: {res.get('result', {}).get('errors')}")
        break

# Final list
_, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
zone_data = json.loads(out.read().decode('utf-8'))
print("\n--- Final Brevo Records in Zone ---")
for rec in zone_data.get('result', {}).get('data', []):
    dname = rec.get('dname_raw', '')
    if any(k in dname for k in ['r.mail', 'brevo1', 'brevo2']):
        l = rec.get('line_index')
        t = rec.get('record_type')
        d = [base64.b64decode(x).decode('utf-8', errors='replace') for x in rec.get('data_b64', [])]
        print(f"Line {l}: {dname:20} {t:6} -> {d}")

ssh.close()

