import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('194.233.65.45', username='u1zh8984', key_filename=r'C:\Users\dzikri\.ssh\id_rsa', passphrase='Rabbani2401*')

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(f'>>> {cmd}')
    if out.strip():
        print('STDOUT:', out.strip())
    if err.strip():
        print('STDERR:', err.strip())
    return out

# 1. Copy backend to oneslabs-app
run('rm -rf /home/u1zh8984/oneslabs-app')
run('cp -a /home/u1zh8984/oneslabs-backend /home/u1zh8984/oneslabs-app')

# 2. Symlink nodevenv
run('ln -sfn /home/u1zh8984/nodevenv/oneslabs-backend/22 /home/u1zh8984/nodevenv/oneslabs-app')
run('mkdir -p /home/u1zh8984/nodevenv/oneslabs-app && ln -sfn /home/u1zh8984/nodevenv/oneslabs-backend/22 /home/u1zh8984/nodevenv/oneslabs-app/22')

# 3. Update CloudLinux selector to new-app-root
run('cloudlinux-selector set --json --interpreter nodejs --domain 1slabs.my.id --app-root oneslabs-backend --new-app-root oneslabs-app --skip-web-check')

# 4. Check .htaccess in api
run('cat /home/u1zh8984/public_html/1slabs.my.id/api/.htaccess')

ssh.close()
