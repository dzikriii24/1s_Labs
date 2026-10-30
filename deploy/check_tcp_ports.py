import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print(out)
    if err:
        print("STDERR:", err)

# Check /proc/net/tcp for listening ports (state 0A = LISTEN)
parse_tcp = """
python3 -c "
with open('/proc/net/tcp') as f:
    for line in f.readlines()[1:]:
        parts = line.strip().split()
        state = parts[3]
        if state == '0A': # LISTEN
            ip_hex, port_hex = parts[1].split(':')
            port = int(port_hex, 16)
            ip = '.'.join(str(int(ip_hex[i:i+2], 16)) for i in (6, 4, 2, 0))
            inode = parts[9]
            print(f'LISTEN {ip}:{port} (inode: {inode})')
"
"""
run(parse_tcp)

# Test curl to 127.0.0.1:3000
run("curl -s -i http://127.0.0.1:3000/ || true")
run("curl -s -i http://127.0.0.1:3000/api/orders/check-domain || true")

ssh.close()
