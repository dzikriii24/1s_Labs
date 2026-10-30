import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

cmd = """python3 -c "
import os, glob

for p in glob.glob('/proc/[0-9]*'):
    try:
        with open(os.path.join(p, 'cmdline'), 'rb') as f:
            cmd = f.read().decode('utf-8', errors='ignore').replace('\\x00', ' ')
            if 'node' in cmd or 'oneslabs' in cmd or 'passenger' in cmd:
                print(p, cmd)
    except Exception:
        pass
"
"""
stdin, stdout, stderr = ssh.exec_command(cmd)
print('Procs in /proc:')
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()
