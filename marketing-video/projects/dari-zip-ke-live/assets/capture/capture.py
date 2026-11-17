"""Capture the real 1sLabs portal UI (served read-only from the source repo, API mocked).

Outputs (assets/screenshots/*.png at 2x DPR) and assets/screenshots/layout.json
(element rects in CSS px, used by Remotion camera moves).
Run:  python capture.py
"""
import json
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

import fixtures as fx
import harness as hx

W, H = 1440, 900
TMP = hx.HERE / "_tmp"
TMP.mkdir(exist_ok=True)
LAYOUT = {}


def make_zip():
    p = TMP / "kopisenja-api.zip"
    with zipfile.ZipFile(p, "w") as z:
        z.writestr("index.js", fx.INDEX_JS)
        z.writestr("package.json", '{"name":"kopisenja-api","version":"1.0.0","main":"index.js"}')
        z.writestr("routes/menu.js", "module.exports = require('express').Router();\n")
    return p


def make_proof():
    p = TMP / "bukti-transfer-contoh.png"
    img = Image.new("RGB", (480, 640), "#f5f5f4")
    d = ImageDraw.Draw(img)
    try:
        f1 = ImageFont.truetype("arial.ttf", 30)
        f2 = ImageFont.truetype("arial.ttf", 20)
    except Exception:
        f1 = f2 = ImageFont.load_default()
    d.rectangle([30, 30, 450, 610], outline="#d4d4d8", width=2)
    d.text((60, 70), "BUKTI TRANSFER", fill="#111111", font=f1)
    d.text((60, 130), "CONTOH, BUKAN TRANSAKSI NYATA", fill="#71717a", font=f2)
    d.text((60, 200), "Status: Berhasil", fill="#059669", font=f2)
    p.parent.mkdir(exist_ok=True)
    img.save(p)
    return p


def rects(page, mapping):
    out = {}
    for key, sel in mapping.items():
        try:
            loc = page.locator(sel).first
            bb = loc.bounding_box(timeout=1500)
            if bb:
                out[key] = {k: round(v, 1) for k, v in bb.items()}
        except Exception as e:  # selector not present in this state
            print("  rect miss", key, str(e)[:60])
    return out


def snap(page, name, mapping=None, redact=False):
    hx.redact(page, price=redact)
    page.wait_for_timeout(450)
    hx.shot(page, name)
    LAYOUT[name] = {"width": W, "height": H, "rects": rects(page, mapping or {})}


def goto(page, path, wait=1800):
    page.goto(hx.BASE + path)
    page.wait_for_timeout(wait)


def main():
    zip_path = make_zip()
    proof = make_proof()
    with hx.vite_server():
        with sync_playwright() as p:
            browser, ctx = hx.new_context(p, W, H, 2)
            page = ctx.new_page()
            page.on("pageerror", lambda e: print("PAGEERROR", str(e)[:160]))

            # 1. Node.js apps, stopped
            fx.STATE.app_status = "stopped"
            goto(page, "/portal?tab=nodejs")
            node_map = {
                "header": "text=Node.js Application Manager",
                "createBtn": "button:has-text('Buat Aplikasi Node.js Baru')",
                "stats": "div.grid >> nth=0",
                "appCard": "div:has(> div:has-text('kopisenja-api')):has(button:has-text('File Manager')) >> nth=-1",
                "appName": "h3:has-text('kopisenja-api')",
                "statusBadge": "span:has-text('Stopped'), span:has-text('Running')",
                "startBtn": "button:has-text('Start'), button:has-text('Restart')",
                "fileMgrBtn": "button:has-text('File Manager')",
                "deployBtn": "button:has-text('Deploy ZIP')",
                "kebab": "button:has(svg.lucide-more-vertical)",
                "sidebarNode": "button:has-text('Node.js APIs')",
            }
            snap(page, "node_stopped", node_map)

            # 2. click Start for real
            page.get_by_role("button", name="Start").first.click()
            page.wait_for_timeout(1200)
            page.locator("button.swal2-confirm").click()
            page.wait_for_timeout(900)
            snap(page, "node_running", node_map)

            # 3. logs via menu
            page.locator("button:has(svg.lucide-more-vertical)").first.click()
            page.wait_for_timeout(500)
            snap(page, "node_menu", {"menu": "div:has(> button:has-text('Lihat Log Server'))",
                                      "logsItem": "button:has-text('Lihat Log Server')"})
            page.get_by_text("Lihat Log Server").click()
            page.wait_for_timeout(1200)
            snap(page, "node_logs", {"modal": "div.max-w-2xl", "logBox": "div.font-mono.bg-gray-950"})

            # 4. create dialog (filled)
            goto(page, "/portal?tab=nodejs")
            page.get_by_role("button", name="Buat Aplikasi Node.js Baru").click()
            page.wait_for_timeout(800)
            page.get_by_placeholder("contoh: api-toko, auth-service, inventory-be").fill("kopisenja-api")
            page.wait_for_timeout(900)
            snap(page, "node_create", {
                "modal": "div.max-w-lg, div.max-w-xl, div.max-w-md >> nth=0",
                "nameField": "input[placeholder^='contoh: api-toko']",
                "version": "select >> nth=1",
                "startup": "input[value='index.js']",
                "submit": "button:has-text('Buat Aplikasi')",
            })

            # 5. deploy ZIP dialog with file chosen
            goto(page, "/portal?tab=nodejs")
            page.get_by_role("button", name="Deploy ZIP").click()
            page.wait_for_timeout(700)
            page.locator("input[type=file]").first.set_input_files(str(zip_path))
            page.wait_for_timeout(800)
            snap(page, "node_deploy", {
                "dropzone": "div.border-dashed",
                "submit": "button:has-text('Mulai Deploy')",
            })

            # 6. file manager modal + editor
            goto(page, "/portal?tab=nodejs")
            page.get_by_role("button", name="File Manager").first.click()
            page.wait_for_timeout(1400)
            snap(page, "node_files", {
                "uploadBtn": "button:has-text('Upload File')",
                "npmBtn": "button:has-text('npm install')",
                "restartBtn": "button:has-text('Restart Server')",
                "indexRow": "div:has-text('index.js'):has(svg) >> nth=-1",
            })
            try:
                page.locator("tr:has-text('index.js') button").first.click()
                page.wait_for_timeout(1300)
                snap(page, "node_editor", {"editor": "textarea, .monaco-editor, div.font-mono >> nth=0"})
            except Exception as e:
                print("editor step failed", str(e)[:100])

            # 7. service detail tabs
            tabs = [
                ("detail_overview", "Ringkasan & Resource"),
                ("detail_analytics", "Analitik Web"),
                ("detail_files", "File Manager"),
                ("detail_ftp", "Akun FTP / FTPS"),
                ("detail_db", "Database MySQL"),
            ]
            page.set_viewport_size({"width": W, "height": 1300})
            goto(page, "/portal?tab=detail&service=SRV-DEMO-0001", 2200)
            tabbar = {"tabbar": "div:has(> button:has-text('Ringkasan & Resource'))"}
            for key, label in tabs:
                page.get_by_role("button", name=label).first.click()
                page.wait_for_timeout(1500)
                m = dict(tabbar)
                for _, lab in tabs:
                    m["tab:" + lab] = f"button:has-text('{lab}')"
                snap(page, key, m)
                if key == "detail_files":
                    # simulate the real drag overlay by dispatching a native dragenter
                    page.evaluate("""() => {
                      const t = document.querySelector('table') || document.querySelector('[class*=file]');
                      if (!t) return;
                      const dt = new DataTransfer();
                      t.dispatchEvent(new DragEvent('dragenter', {bubbles: true, cancelable: true, dataTransfer: dt}));
                    }""")
                    page.wait_for_timeout(700)
                    snap(page, "detail_files_drag", m)

            page.set_viewport_size({"width": W, "height": H})
            # 8. payment page
            fx.STATE.proof_uploaded = False
            goto(page, "/payment/ORD-DEMO-0001", 2200)
            pay_map = {
                "qrCard": "img[alt*='QRIS'], img[src*='__qr']",
                "amount": "text=TOTAL TAGIHAN",
                "steps": "text=PETUNJUK PEMBAYARAN QRIS",
                "summary": "text=Rincian Layanan yang Dipesan",
                "upload": "text=Pilih File Bukti Pembayaran",
                "form": "text=Konfirmasi Pembayaran Anda",
            }
            snap(page, "pay_qris", pay_map, redact=True)
            page.locator("input[type=file]").first.set_input_files(str(proof))
            page.wait_for_timeout(500)
            page.get_by_placeholder("Contoh: BCA / GoPay / Livin Mandiri").fill("GoPay")
            page.wait_for_timeout(300)
            page.evaluate("window.scrollTo(0, 420)")
            page.wait_for_timeout(500)
            snap(page, "pay_form", pay_map, redact=True)

            browser.close()
    (hx.OUT / "layout.json").write_text(json.dumps(LAYOUT, indent=1), encoding="utf-8")
    print("UNMATCHED:", sorted(hx.UNMATCHED))


if __name__ == "__main__":
    main()
