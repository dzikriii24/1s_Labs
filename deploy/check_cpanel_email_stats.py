import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\dzikri\.ssh\id_ed25519")
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

commands = [
    "/usr/bin/uapi StatsBar get_stats display=email_accounts|email_forwarders|email_autoresponders|email_filters",
    "cat /home/u1zh8984/.cpanel/email_accounts.yaml 2>/dev/null || true",
    "ls -la /var/spool/mail/u1zh8984 2>/dev/null || true",
    "grep -rn 'Daily sending limit' /home/u1zh8984 2>/dev/null || true"
]

for cmd in commands:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("OUT:", stdout.read().decode())
    print("ERR:", stderr.read().decode())

ssh.close()
