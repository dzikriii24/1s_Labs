import paramiko

pkey = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\dzikri\.ssh\id_ed25519')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.119.237.132', username='u1zh8984', pkey=pkey)

sftp = ssh.open_sftp()

# Ensure api directory exists on remote docroot
try:
    sftp.mkdir('/home/u1zh8984/public_html/kimholidaytravel.id/api')
except Exception:
    pass

# Upload .env
local_env = r"C:\Users\dzikri\Downloads\KimHolidayTravel-SC\.env"
remote_env = "/home/u1zh8984/public_html/kimholidaytravel.id/.env"
sftp.put(local_env, remote_env)
print("Uploaded .env to remote kimholidaytravel.id")

# Upload api/db.php
local_db = r"C:\Users\dzikri\Downloads\KimHolidayTravel-SC\api\db.php"
remote_db = "/home/u1zh8984/public_html/kimholidaytravel.id/api/db.php"
sftp.put(local_db, remote_db)
print("Uploaded api/db.php to remote kimholidaytravel.id")

# Upload api/migrate.php
local_mig = r"C:\Users\dzikri\Downloads\KimHolidayTravel-SC\api\migrate.php"
remote_mig = "/home/u1zh8984/public_html/kimholidaytravel.id/api/migrate.php"
sftp.put(local_mig, remote_mig)
print("Uploaded api/migrate.php to remote kimholidaytravel.id")

# Upload api/gallery.php
local_gal = r"C:\Users\dzikri\Downloads\KimHolidayTravel-SC\api\gallery.php"
remote_gal = "/home/u1zh8984/public_html/kimholidaytravel.id/api/gallery.php"
sftp.put(local_gal, remote_gal)
print("Uploaded api/gallery.php to remote kimholidaytravel.id")

sftp.close()

# Test invoking db.php directly via PHP CLI on the server
stdin, stdout, stderr = ssh.exec_command("php /home/u1zh8984/public_html/kimholidaytravel.id/api/db.php")
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("PHP DB.PHP EXEC RESULT:")
print("OUT:", out)
print("ERR:", err)

# Test invoking gallery.php
stdin, stdout, stderr = ssh.exec_command("php /home/u1zh8984/public_html/kimholidaytravel.id/api/gallery.php")
out_gal = stdout.read().decode('utf-8')
print("PHP GALLERY.PHP EXEC RESULT:")
print("OUT:", out_gal[:500])

ssh.close()
