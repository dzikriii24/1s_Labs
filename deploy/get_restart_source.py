import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

script = """
import clselect.clselectctlnodejsuser as m, inspect
print(inspect.getsource(m.restart))
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/get_source.py', 'w') as f:
    f.write(script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/u1zh8984/get_source.py && rm -f /home/u1zh8984/get_source.py')
print(stdout.read().decode())
print(stderr.read().decode())

ssh.close()
