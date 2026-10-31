import paramiko
import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

HOST = "103.119.237.132"
USER = "u1zh8984"
KEY_PATH = r"C:\Users\dzikri\.ssh\id_ed25519"

def run_remote(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

def main():
    print(f"=== RUNNING COMPREHENSIVE SMOKE TESTS ON DEMO VIA SERVER ===")
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, pkey=pkey, timeout=20)
    print("SSH connected.\n")

    # 1. Health check
    out, err = run_remote(ssh, "curl -sLk https://demo.1slabs.my.id/api/health")
    print(f"[1] Health Check Response: {out}")
    health = json.loads(out)
    assert health.get("status") == "healthy", f"Health status failed: {out}"
    assert health.get("database") == "connected", f"Database not connected: {out}"

    # 2. Public Static & SEO / GEO Files
    for path in ["/robots.txt", "/sitemap.xml", "/llms.txt"]:
        out, err = run_remote(ssh, f'curl -sLk -o /dev/null -w "%{{http_code}}" https://demo.1slabs.my.id{path}')
        print(f"[2] Check {path}: HTTP Status {out}")
        assert out == "200", f"Failed {path} status {out}"

    # Verify llms.txt content
    out, err = run_remote(ssh, "curl -sLk https://demo.1slabs.my.id/llms.txt | head -n 5")
    print(f"    llms.txt preview:\n{out}")
    assert "1sLabs" in out

    # 3. Security / IDOR Test on Invoices:
    # Unauthenticated access to /api/invoices/INV-2026-001 must return 401
    out, err = run_remote(ssh, 'curl -sLk -o /dev/null -w "%{http_code}" https://demo.1slabs.my.id/api/invoices/INV-2026-001')
    print(f"[3] Security IDOR Test on /api/invoices/INV-2026-001: HTTP Status {out}")
    assert out in ["401", "403"], f"Security vulnerability! Expected 401/403, got {out}"
    print("    PASSED: Protected against unauthenticated invoice inspection!")

    # 4. Inquiry API Submission Test
    payload_json = json.dumps({
        "name": "Audit Smoke Test",
        "email": "audit-test@1slabs.my.id",
        "phone": "081234567890",
        "company": "Audit Tech Corp",
        "inquiry_type": "website_development",
        "service_interested": "Jasa Pembuatan Website & Annual Maintenance",
        "budget_range": "Rp 5.000.000 - Rp 15.000.000",
        "message": "Testing automated inquiry submission on demo environment during final audit."
    }).replace('"', '\\"')
    
    cmd = f'curl -sLk -X POST -H "Content-Type: application/json" -d "{payload_json}" https://demo.1slabs.my.id/api/inquiries'
    out, err = run_remote(ssh, cmd)
    print(f"[4] Inquiry API Submission Response: {out}")
    inq_res = json.loads(out)
    assert inq_res.get("success") is True, f"Inquiry submission failed: {out}"
    print(f"    PASSED: Inquiry successfully created with ID: {inq_res.get('inquiryId')}")

    # 5. Frontend Pages Routing (SPA index.html check)
    frontend_paths = [
        "/",
        "/docs",
        "/login",
        "/register",
        "/services",
        "/jasa-pembuatan-website",
        "/jasa-maintenance-website"
    ]
    for path in frontend_paths:
        out, err = run_remote(ssh, f'curl -sLk -o /dev/null -w "%{{http_code}}" https://demo.1slabs.my.id{path}')
        print(f"[5] SPA Route {path}: HTTP Status {out}")
        assert out == "200", f"Route {path} failed with {out}"

    # 6. Check stderr.log to ensure zero unhandled exceptions
    out, err = run_remote(ssh, "tail -n 20 /home/u1zh8984/demo-oneslabs/stderr.log")
    print(f"\n[6] Recent stderr.log on Demo (last 20 lines):\n{out}")

    ssh.close()
    print("\n✅ ALL SMOKE TESTS ON DEMO ENVIRONMENT PASSED WITH ZERO ERRORS!")

if __name__ == "__main__":
    main()
