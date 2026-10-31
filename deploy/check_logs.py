import paramiko
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def main():
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

    cmds = [
        "ls -la /home/u1zh8984/logs",
        "find /home/u1zh8984/logs -type f",
        "grep -i 'robots.txt' /home/u1zh8984/logs/* 2>/dev/null | tail -n 20",
        "grep -i 'google' /home/u1zh8984/logs/* 2>/dev/null | tail -n 20",
        "tail -n 20 /home/u1zh8984/logs/1slabs.my.id-ssl_log 2>/dev/null || true",
        "tail -n 20 /home/u1zh8984/logs/1slabs.my.id 2>/dev/null || true"
    ]

    for c in cmds:
        print(f"=== {c} ===")
        stdin, stdout, stderr = ssh.exec_command(c)
        print(stdout.read().decode())

    ssh.close()

if __name__ == "__main__":
    main()

