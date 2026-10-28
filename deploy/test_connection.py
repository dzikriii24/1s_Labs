import paramiko
import sys

hostname = "194.233.65.45"
username = "u1zh8984"
key_path = r"C:\Users\dzikri\.ssh\id_rsa"
passphrase = "Rabbani2401*"

print(f"Connecting to {username}@{hostname}...")
try:
    pkey = paramiko.RSAKey.from_private_key_file(key_path, password=passphrase)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=hostname, port=22, username=username, pkey=pkey, timeout=15)
    print("SSH Connection successful!")

    stdin, stdout, stderr = ssh.exec_command("pwd && ls -la public_html/1slabs.my.id/")
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("Remote output:")
    print(out)
    if err:
        print("Remote error:", err)

    sftp = ssh.open_sftp()
    print("SFTP channel opened successfully!")
    remote_files = sftp.listdir("public_html/1slabs.my.id")
    print(f"Files in public_html/1slabs.my.id: {remote_files}")
    sftp.close()
    ssh.close()
    print("Done!")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
