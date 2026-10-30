import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

script = """
import imaplib
import poplib

print('--- Testing IMAP port 143 ---')
try:
    m = imaplib.IMAP4('127.0.0.1', 143)
    res = m.login('info@1slabs.my.id', 'Rabbani2401*')
    print('IMAP LOGIN SUCCESS info@1slabs.my.id:', res)
    m.logout()
except Exception as e:
    print('IMAP info@1slabs.my.id FAILED:', e)

try:
    m = imaplib.IMAP4('127.0.0.1', 143)
    res = m.login('info', 'Rabbani2401*')
    print('IMAP LOGIN SUCCESS info:', res)
    m.logout()
except Exception as e:
    print('IMAP info FAILED:', e)

try:
    m = imaplib.IMAP4('127.0.0.1', 143)
    res = m.login('dzikri@1slabs.my.id', 'Rabbani2401*')
    print('IMAP LOGIN SUCCESS dzikri@1slabs.my.id:', res)
    m.logout()
except Exception as e:
    print('IMAP dzikri@1slabs.my.id FAILED:', e)

print('--- Testing POP3 port 110 ---')
try:
    p = poplib.POP3('127.0.0.1', 110)
    p.user('info@1slabs.my.id')
    res = p.pass_('Rabbani2401*')
    print('POP3 LOGIN SUCCESS info@1slabs.my.id:', res)
    p.quit()
except Exception as e:
    print('POP3 info@1slabs.my.id FAILED:', e)
"""

stdin, stdout, stderr = ssh.exec_command(f"python3 -c \"{script}\"")
print(stdout.read().decode('utf-8'))
print("STDERR:\n", stderr.read().decode('utf-8'))

ssh.close()
