import paramiko

HOSTNAME = "103.119.237.132"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

# 1. Check directory structure for hr mail
print("--- 1. Check /home/u1zh8984/mail/1slabs.my.id/hr ---")
cmd = "ls -la /home/u1zh8984/mail/1slabs.my.id/hr"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

print("--- 2. Check /home/u1zh8984/mail/1slabs.my.id/hr/new ---")
cmd = "ls -la /home/u1zh8984/mail/1slabs.my.id/hr/new"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

print("--- 3. Check /home/u1zh8984/mail/1slabs.my.id/hr/cur ---")
cmd = "ls -la /home/u1zh8984/mail/1slabs.my.id/hr/cur"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

print("--- 4. Check other mail folders for hr (junk, spam, etc.) ---")
cmd = "find /home/u1zh8984/mail -maxdepth 4 -name '*hr*'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

print("--- 5. Check hr_email_replies in database ---")
cmd = "mysql -u u1zh8984_oneslabs -p'Rabbani2401*' u1zh8984_oneslabs -e 'SELECT * FROM hr_email_replies;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

print("--- 6. Check Exim mainlog for hr@1slabs.my.id ---")
cmd = "grep -i 'hr@1slabs.my.id' /var/log/exim_mainlog | tail -n 20 2>/dev/null || cat /home/u1zh8984/.cpanel/email_accounts.json 2>/dev/null"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))

ssh.close()

