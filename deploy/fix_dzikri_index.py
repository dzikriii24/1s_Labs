import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=15)

index_js = """// 1sLabs Managed Node.js Application
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Application Health Check (supports both Passenger-stripped and direct URI)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    application: 'backend-dzikri',
    domain: 'dzikri.1slabs.my.id',
    uptime_seconds: Math.floor(process.uptime()),
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

// Root API Endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di API Node.js backend-dzikri (dzikri.1slabs.my.id)!',
    endpoints: {
      health: '/api/health',
      root: '/api'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server backend-dzikri berjalan pada port ${PORT}`);
});
"""

sftp = ssh.open_sftp()
with sftp.file("/home/u1zh8984/apps/u2_backend-dzikri/index.js", "w") as f:
    f.write(index_js)
sftp.close()

# Restart
ssh.exec_command("/usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --app-root apps/u2_backend-dzikri")
print("Updated index.js and restarted apps/u2_backend-dzikri")
ssh.close()

