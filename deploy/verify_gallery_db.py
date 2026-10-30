import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

cmd = """php -r "
require '/home/u1zh8984/public_html/kimholidaytravel.id/api/db.php';
\$count = \$pdo->query('SELECT COUNT(*) FROM gallery')->fetchColumn();
echo 'TOTAL ROWS IN GALLERY TABLE: ' . \$count . PHP_EOL;
" """

test_php = """<?php
require '/home/u1zh8984/public_html/kimholidaytravel.id/api/db.php';
$count = $pdo->query('SELECT COUNT(*) FROM gallery')->fetchColumn();
echo "TOTAL ROWS IN GALLERY TABLE: " . $count . PHP_EOL;
$rows = $pdo->query('SELECT id, title, image_url FROM gallery LIMIT 3')->fetchAll();
print_r($rows);
"""
sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/check_gal.php', 'w') as f:
    f.write(test_php)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("php /home/u1zh8984/check_gal.php && rm -f /home/u1zh8984/check_gal.php")
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
