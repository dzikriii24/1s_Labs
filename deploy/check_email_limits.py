import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\dzikri\.ssh\id_ed25519")
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

commands = [
    "/usr/bin/uapi Email list_pops_with_disk",
    "/usr/bin/uapi Email get_main_account_disk_usage",
    "cat /etc/virtual/limit 2>/dev/null || true",
    "cat /etc/virtual/1slabs.my.id/limit 2>/dev/null || true",
    "cat /var/cpanel/users/u1zh8984 2>/dev/null | grep -iE 'mail|max_email|maxmail' || true"
]

for cmd in commands:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("OUT:", stdout.read().decode())
    print("ERR:", stderr.read().decode())

ssh.close()
