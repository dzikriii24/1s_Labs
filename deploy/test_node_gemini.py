import paramiko

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)

sftp = ssh.open_sftp()
with sftp.file("/home/u1zh8984/oneslabs-backend/test_gemini.js", "w") as f:
    f.write("""
require('dotenv').config({ path: '/home/u1zh8984/oneslabs-backend/.env' });
const { callGeminiApi } = require('./src/services/marketing/gemini.service');

async function test() {
  try {
    const res = await callGeminiApi({
      prompt: 'Respond with valid JSON: {"status": "ok", "message": "Gemini active on server"}',
      model: 'gemini-3.8-flash'
    });
    console.log('Gemini OK:', JSON.stringify(res));
  } catch (err) {
    console.error('Gemini Failed:', err.message);
  } finally {
    process.exit(0);
  }
}
test();
""")
sftp.close()

stdin, stdout, stderr = ssh.exec_command("cd /home/u1zh8984/oneslabs-backend && node test_gemini.js")
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())

ssh.close()
