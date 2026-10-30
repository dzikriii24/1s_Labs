import paramiko

HOSTNAME = "194.233.65.45"
USERNAME = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_rsa"
PASSPHRASE = "Rabbani2401*"

pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=PASSPHRASE)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOSTNAME, port=22, username=USERNAME, pkey=pkey, timeout=15)

def run(cmd):
    print(f"=== CMD: {cmd} ===")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if out:
        print("STDOUT:\n", out)
    if err:
        print("STDERR:", err)

php_code = "<?php echo 'DOC_ROOT: ' . $_SERVER['DOCUMENT_ROOT'] . ' SCRIPT: ' . __FILE__; ?>"

run(f"echo \"{php_code}\" > /home/u1zh8984/public_html/1slabs.my.id/test_info.php")
run(f"echo \"{php_code}\" > /home/u1zh8984/public_html/test_info.php")

run("curl -k -s https://194.233.65.45/test_info.php -H 'Host: 1slabs.my.id'")
run("curl -s https://1slabs.my.id/test_info.php")

run("rm -f /home/u1zh8984/public_html/1slabs.my.id/test_info.php /home/u1zh8984/public_html/test_info.php")

ssh.close()
