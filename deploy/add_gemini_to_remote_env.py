import os
import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

gemini_key = os.environ.get("GEMINI_API", "YOUR_GEMINI_API_KEY")
gemini_line = f"\n# Gemini AI Integration\nGEMINI_API={gemini_key}\nGEMINI_MODEL=gemini-3.8-flash\n"

ssh.exec_command(f'echo "{gemini_line}" >> /home/u1zh8984/oneslabs-backend/.env')
ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
ssh.exec_command("cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend")

print("Appended GEMINI_API to remote .env and restarted.")

# Verify
stdin, stdout, stderr = ssh.exec_command("grep GEMINI /home/u1zh8984/oneslabs-backend/.env")
print("Remote grep:", stdout.read().decode().strip())

ssh.close()

