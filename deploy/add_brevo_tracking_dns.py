import paramiko
import json
import time

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)
    print("SSH Connected.")

    # 1. First parse zone to get latest SOA serial
    _, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
    zone_data = json.loads(out.read().decode('utf-8'))
    
    current_serial = None
    for rec in zone_data.get('result', {}).get('data', []):
        if rec.get('record_type') == 'SOA':
            import base64
            # serial is the 3rd item (index 2) in data_b64
            raw_serial = base64.b64decode(rec['data_b64'][2]).decode('utf-8')
            current_serial = int(raw_serial)
            break
            
    print(f"Current SOA serial: {current_serial}")

    # 2. Prepare records to add:
    # - r.mail CNAME pointing to mail-1slabs-my-id.r.brand.brevosend.com.
    # - brevo1._domainkey CNAME pointing to b1.1slabs-my-id.dkim.brevo.com.
    # - brevo2._domainkey CNAME pointing to b2.1slabs-my-id.dkim.brevo.com.
    records_to_add = [
        {
            "dname": "r.mail",
            "ttl": 14400,
            "record_type": "CNAME",
            "data": ["mail-1slabs-my-id.r.brand.brevosend.com."]
        },
        {
            "dname": "brevo1._domainkey",
            "ttl": 14400,
            "record_type": "CNAME",
            "data": ["b1.1slabs-my-id.dkim.brevo.com."]
        },
        {
            "dname": "brevo2._domainkey",
            "ttl": 14400,
            "record_type": "CNAME",
            "data": ["b2.1slabs-my-id.dkim.brevo.com."]
        }
    ]

    for record in records_to_add:
        # Re-fetch current serial before each edit
        _, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
        zone_data = json.loads(out.read().decode('utf-8'))
        import base64
        for rec in zone_data.get('result', {}).get('data', []):
            if rec.get('record_type') == 'SOA':
                current_serial = int(base64.b64decode(rec['data_b64'][2]).decode('utf-8'))
                break

        rec_json = json.dumps(record)
        escaped_json = rec_json.replace("'", "'\\''")
        cmd = f"uapi --output=json DNS mass_edit_zone zone=1slabs.my.id serial={current_serial} add='{escaped_json}'"
        print(f"Adding record with serial {current_serial}: {record['dname']} ({record['record_type']}) -> {record['data']}")
        _, stdout, stderr = ssh.exec_command(cmd)
        resp = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        try:
            parsed_resp = json.loads(resp)
            if parsed_resp.get('result', {}).get('status') == 1:
                print(f"-> SUCCESS for {record['dname']}")
            else:
                print(f"-> FAILED for {record['dname']}: {parsed_resp.get('result', {}).get('errors')}")
        except Exception as e:
            print(f"-> Raw response: {resp}, err: {err}")

    # Update SPF record to include Brevo
    print("\nUpdating SPF record...")
    _, out, _ = ssh.exec_command('uapi --output=json DNS parse_zone zone=1slabs.my.id')
    zone_data = json.loads(out.read().decode('utf-8'))
    import base64
    current_serial = None
    spf_line_index = None
    for rec in zone_data.get('result', {}).get('data', []):
        if rec.get('record_type') == 'SOA':
            current_serial = int(base64.b64decode(rec['data_b64'][2]).decode('utf-8'))
        if rec.get('record_type') == 'TXT' and rec.get('dname_raw') == '1slabs.my.id.':
            spf_line_index = rec.get('line_index')

    if spf_line_index is not None and current_serial is not None:
        edit_spf = {
            "line_index": spf_line_index,
            "dname": "1slabs.my.id.",
            "ttl": 14400,
            "record_type": "TXT",
            "data": ["v=spf1 ip4:103.119.237.132 include:scodepro.com include:spf.brevo.com +a +mx +ip4:194.233.65.45 ~all"]
        }
        escaped_spf = json.dumps(edit_spf).replace("'", "'\\''")
        cmd = f"uapi --output=json DNS mass_edit_zone zone=1slabs.my.id serial={current_serial} edit='{escaped_spf}'"
        _, stdout, stderr = ssh.exec_command(cmd)
        resp = stdout.read().decode('utf-8')
        try:
            parsed = json.loads(resp)
            if parsed.get('result', {}).get('status') == 1:
                print("-> SPF successfully updated with include:spf.brevo.com")
            else:
                print(f"-> SPF update failed: {parsed.get('result', {}).get('errors')}")
        except Exception as e:
            print(f"-> SPF raw response: {resp}")

    # 3. Verify DNS resolution locally on server
    time.sleep(2)
    print("\n--- Verifying DNS resolution ---")
    for rec in ["r.mail.1slabs.my.id", "brevo1._domainkey.1slabs.my.id", "brevo2._domainkey.1slabs.my.id"]:
        _, out, _ = ssh.exec_command(f"dig @127.0.0.1 +short {rec}")
        print(f"@127.0.0.1 {rec} -> {out.read().decode().strip()}")
        _, out2, _ = ssh.exec_command(f"dig +short {rec}")
        print(f"default resolver {rec} -> {out2.read().decode().strip()}")

    ssh.close()

if __name__ == '__main__':
    main()
