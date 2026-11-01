import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

sftp = ssh.open_sftp()
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\src\services\marketing\gemini.service.js", "/home/u1zh8984/oneslabs-backend/src/services/marketing/gemini.service.js")
sftp.put(r"c:\Users\dzikri\Downloads\1sLabs-website\backend\index.js", "/home/u1zh8984/oneslabs-backend/index.js")
sftp.close()

# Restart Node
ssh.exec_command("touch /home/u1zh8984/oneslabs-backend/tmp/restart.txt")
ssh.exec_command("cloudlinux-selector restart --json --interpreter nodejs --app-root oneslabs-backend")

print("Uploaded gemini.service.js & index.js and restarted.")
ssh.close()

