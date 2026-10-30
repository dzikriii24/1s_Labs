import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

# Verify direct execution in oneslabs-app
cmd = '/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node /home/u1zh8984/test_direct_handler.js'
stdin, stdout, stderr = ssh.exec_command(cmd)
print('Direct handler test:')
print(stdout.read().decode())

# Write updated .htaccess
htaccess_content = """<IfModule Litespeed>
CacheLookup off
</IfModule>
<IfModule mod_headers.c>
Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
Header set Pragma "no-cache"
Header set Expires "0"
</IfModule>

# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/u1zh8984/oneslabs-app"
PassengerBaseURI "/api"
PassengerNodejs "/home/u1zh8984/nodevenv/oneslabs-backend/22/bin/node"
PassengerAppType node
PassengerStartupFile index.js
PassengerAppLogFile "/home/u1zh8984/oneslabs-app/passenger.log"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
"""

sftp = ssh.open_sftp()
with sftp.file('/home/u1zh8984/public_html/1slabs.my.id/api/.htaccess', 'w') as f:
    f.write(htaccess_content)
sftp.close()
print('Updated .htaccess with PassengerAppRoot oneslabs-app and cache bypass')

# Create restart.txt in oneslabs-app/tmp
ssh.exec_command('mkdir -p /home/u1zh8984/oneslabs-app/tmp && touch /home/u1zh8984/oneslabs-app/tmp/restart.txt')

ssh.close()
