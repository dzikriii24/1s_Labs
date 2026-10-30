import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

script = """
import socket

open_ports = []
for port in range(3000, 9000):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.01)
    if s.connect_ex(('127.0.0.1', port)) == 0:
        open_ports.append(port)
    s.close()
print('Open ports on 127.0.0.1:', open_ports)
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/port_scan.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/u1zh8984/port_scan.py && rm -f /home/u1zh8984/port_scan.py')
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()
