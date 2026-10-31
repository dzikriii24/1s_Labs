import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=10)

cmd = "curl -ILs https://1slabs.my.id/uploads/proofs/proof_1793316698883_4ea7b83f2f0a53b2.jpg ; curl -ILs https://1slabs.my.id/api/uploads/proofs/proof_1793316698883_4ea7b83f2f0a53b2.jpg"

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:\n", stdout.read().decode())
print("STDERR:\n", stderr.read().decode())
ssh.close()
