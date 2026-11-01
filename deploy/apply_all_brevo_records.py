import paramiko
import json
import base64
import time

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def get_zone_data(ssh):
    _, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
    return json.loads(out.read().decode('utf-8'))

def get_serial(zone_data):
    for rec in zone_data.get('result', {}).get('data', []):
        if rec.get('record_type') == 'SOA':
            return int(base64.b64decode(rec['data_b64'][2]).decode('utf-8'))
    return None

def execute_mass_edit(ssh, edit=None, add=None):
    zone_data = get_zone_data(ssh)
    serial = get_serial(zone_data)
    
    cmd_parts = [f"uapi --output=json DNS mass_edit_zone zone=1slabs.my.id serial={serial}"]
    if edit:
        escaped_edit = json.dumps(edit).replace("'", "'\\''")
        cmd_parts.append(f"edit='{escaped_edit}'")
    if add:
        escaped_add = json.dumps(add).replace("'", "'\\''")
        cmd_parts.append(f"add='{escaped_add}'")
        
    cmd = " ".join(cmd_parts)
    _, stdout, stderr = ssh.exec_command(cmd)
    resp = stdout.read().decode('utf-8')
    res = json.loads(resp)
    if res.get('result', {}).get('status') == 1:
        print("-> Operation succeeded.")
    else:
        print("-> Operation failed:", res.get('result', {}).get('errors'))
    return res

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
    print("SSH Connected.")

    # Step 1: Update DMARC
    zone_data = get_zone_data(ssh)
    dmarc_line = None
    mail_line = None
    for rec in zone_data.get('result', {}).get('data', []):
        if rec.get('dname_raw') == '_dmarc' and rec.get('record_type') == 'TXT':
            dmarc_line = rec.get('line_index')
        elif rec.get('dname_raw') == 'mail' and rec.get('record_type') == 'CNAME':
            mail_line = rec.get('line_index')

    print(f"1. Updating DMARC record at line {dmarc_line}...")
    execute_mass_edit(ssh, edit={
        "line_index": dmarc_line,
        "dname": "_dmarc",
        "ttl": 14400,
        "record_type": "TXT",
        "data": ["v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com"]
    })

    print(f"2. Updating Branded record (mail CNAME) at line {mail_line}...")
    execute_mass_edit(ssh, edit={
        "line_index": mail_line,
        "dname": "mail",
        "ttl": 14400,
        "record_type": "CNAME",
        "data": ["mail-1slabs-my-id.brand.brevosend.com."]
    })

    print("3. Adding Brevo code (TXT on 1slabs.my.id.)...")
    execute_mass_edit(ssh, add={
        "dname": "1slabs.my.id.",
        "ttl": 14400,
        "record_type": "TXT",
        "data": ["brevo-code:6faed1be8da5145dd3d758f7ced84936"]
    })

    print("4. Adding Image Redirection Record (img.mail CNAME)...")
    execute_mass_edit(ssh, add={
        "dname": "img.mail",
        "ttl": 14400,
        "record_type": "CNAME",
        "data": ["mail-1slabs-my-id.img.brand.brevosend.com."]
    })

    time.sleep(2)
    print("\n--- Verifying All Updated Records ---")
    queries = [
        ("TXT", "1slabs.my.id"),
        ("TXT", "_dmarc.1slabs.my.id"),
        ("CNAME", "mail.1slabs.my.id"),
        ("CNAME", "r.mail.1slabs.my.id"),
        ("CNAME", "img.mail.1slabs.my.id"),
        ("CNAME", "brevo1._domainkey.1slabs.my.id"),
        ("CNAME", "brevo2._domainkey.1slabs.my.id")
    ]
    for rtype, name in queries:
        _, out, _ = ssh.exec_command(f"dig +short {rtype} {name}")
        res = out.read().decode().strip().replace("\n", " -> ")
        print(f"{rtype:5} {name:32} = {res}")

    ssh.close()

if __name__ == '__main__':
    main()

