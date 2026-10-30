import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh.connect('103.119.237.132', 22, 'u1zh8984', pkey=pkey)

cmd = 'uapi --output=json AddonDomain listaddondomains'
res = json.loads(ssh.exec_command(cmd)[1].read().decode())
print(f"Total cPanel Addon Domains: {len(res['result']['data'])}")
for d in res['result']['data']:
    if 'kimholiday' in d['domain'] or '1slabs' in d['domain']:
        print(f"Domain: {d['domain']} | Dir: {d['dir']} | Subdomain: {d['subdomain']}")

cmd2 = 'curl -s -I https://1slabs.my.id/assets/index-CUyleAFs.js | head -n 4'
print("\nFrontend Asset Header:")
print(ssh.exec_command(cmd2)[1].read().decode())

ssh.close()
