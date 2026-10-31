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
        'curl -sI -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://1slabs.my.id/robots.txt',
        'curl -sI -A "GoogleInspectionTool/1.0" https://1slabs.my.id/robots.txt',
        'curl -sI https://1slabs.my.id/robots.txt',
        'curl -sLk https://1slabs.my.id/robots.txt | head -n 10',
    ]

    for c in cmds:
        print(f"=== {c} ===")
        stdin, stdout, stderr = ssh.exec_command(c)
        print(stdout.read().decode())

    ssh.close()

if __name__ == "__main__":
    main()

