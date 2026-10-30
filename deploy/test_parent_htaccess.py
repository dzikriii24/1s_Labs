import paramiko, http.client, ssl

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

# Test syntax error in public_html/1slabs.my.id/.htaccess
ssh.exec_command("echo 'InvalidParentDirectiveTest123' >> /home/u1zh8984/public_html/1slabs.my.id/.htaccess")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

conn = http.client.HTTPSConnection('194.233.65.45', 443, context=ctx)
headers = {'Host': '1slabs.my.id', 'User-Agent': 'Mozilla/5.0'}
conn.request('GET', '/api/health', headers=headers)
resp = conn.getresponse()
print('Parent htaccess test response -> HTTP', resp.status)
print(resp.read().decode())
conn.close()

# Revert syntax error
ssh.exec_command("sed -i '/InvalidParentDirectiveTest123/d' /home/u1zh8984/public_html/1slabs.my.id/.htaccess")
ssh.close()
