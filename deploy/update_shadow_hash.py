import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

remote_code = '''
import crypt
import shutil

shadow_path = '/home/u1zh8984/etc/1slabs.my.id/shadow'
try:
    shutil.copyfile(shadow_path, shadow_path + '.bak')
except Exception as e:
    print('Backup notice:', e)

with open(shadow_path, 'r') as f:
    lines = f.readlines()

new_hash = crypt.crypt('Rabbani2401*', crypt.mksalt(crypt.METHOD_SHA512))

new_lines = []
for line in lines:
    if line.startswith('info:'):
        parts = line.strip().split(':')
        parts[1] = new_hash
        new_lines.append(':'.join(parts) + '\\n')
        print("Updated info line with new SHA512 hash.")
    else:
        new_lines.append(line)

with open(shadow_path, 'w') as f:
    f.writelines(new_lines)

print("Shadow file written successfully.")
'''

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/update_info_shadow.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python3 /home/u1zh8984/update_info_shadow.py && rm -f /home/u1zh8984/update_info_shadow.py")
print("Stdout:", stdout.read().decode('utf-8'))
print("Stderr:", stderr.read().decode('utf-8'))

ssh.close()
