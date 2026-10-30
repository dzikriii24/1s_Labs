import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

test_script = """<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=u1zh8984_s6_kimhtravel;charset=utf8mb4', 'u1zh8984_u6kimh', 'Kimholiday2026*');
    echo "PDO CONNECTION SUCCESS!\\n";
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo "TABLES: " . implode(', ', $tables) . "\\n";
} catch (Exception $e) {
    echo "PDO ERROR: " . $e->getMessage() . "\\n";
}
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/test_pdo.php', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("php /home/u1zh8984/test_pdo.php && rm -f /home/u1zh8984/test_pdo.php")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
