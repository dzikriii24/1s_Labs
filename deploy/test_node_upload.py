import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

# 1. Create a full 33MB file and wait for completion
stdin, stdout, stderr = ssh.exec_command("dd if=/dev/zero of=/home/u1zh8984/oneslabs-backend/test_real_33m.bin bs=1M count=33")
stdout.channel.recv_exit_status()

stdin, stdout, stderr = ssh.exec_command("ls -la /home/u1zh8984/oneslabs-backend/test_real_33m.bin")
print("FILE STAT:", stdout.read().decode('utf-8', errors='replace').strip())

# 2. Get JWT token
cmd = "node -e 'const jwt=require(\"jsonwebtoken\"); console.log(jwt.sign({id:21,email:\"customer_flowtest@1slabs.my.id\",role:\"customer\"}, \"oneslabs_secure_jwt_secret_key_2026_x89a1b2c3d4e5f\"));'"
stdin, stdout, stderr = ssh.exec_command(f"cd /home/u1zh8984/oneslabs-backend && {cmd}")
token = stdout.read().decode('utf-8', errors='replace').strip()

# 3. Test curl upload with real 33MB file to https://1slabs.my.id
curl_cmd = f"curl -k -i -X POST 'https://1slabs.my.id/api/services/SRV-2026-62DECA/files/upload?path=/src/mixed' -H 'Authorization: Bearer {token}' -F 'files=@/home/u1zh8984/oneslabs-backend/test_real_33m.bin;filename=test_real_33m.bin' -F 'paths=test_real_33m.bin'"
print("Running curl upload of full 33MB file...")
stdin, stdout, stderr = ssh.exec_command(curl_cmd)
out = stdout.read().decode('utf-8', errors='replace')
print("CURL OUTPUT:")
print(out[:1000])

# Clean up
ssh.exec_command("rm -f /home/u1zh8984/oneslabs-backend/test_real_33m.bin /home/u1zh8984/public_html/kimholidaytravel.id/src/mixed/test_real_33m.bin")
ssh.close()
