"""Payment page card crops (QR card, summary before/after, proof form before/after submit)."""
import json
from playwright.sync_api import sync_playwright

import fixtures as fx
import harness as hx
import capture as c1

FIND_CARD = """
(text) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeValue.trim().toLowerCase().startsWith(text.toLowerCase())) {
      let el = n.parentElement;
      while (el && el !== document.body) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (parseFloat(cs.borderTopLeftRadius) >= 20 && r.width > 300) {
          return {x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height};
        }
        el = el.parentElement;
      }
    }
  }
  return null;
}
"""

OUT = hx.OUT
L3 = {}


def card(page, name, text):
    r = page.evaluate(FIND_CARD, text)
    assert r, text
    page.screenshot(path=str(OUT / f"{name}.png"), clip=r, full_page=True)
    L3[name] = {"w": round(r["width"], 1), "h": round(r["height"], 1)}
    print("saved", name, L3[name])


def main():
    proof = c1.make_proof()
    with hx.vite_server():
        with sync_playwright() as p:
            browser, ctx = hx.new_context(p, 1440, 1400, 2)
            page = ctx.new_page()
            fx.STATE.proof_uploaded = False
            c1.goto(page, "/payment/ORD-DEMO-0001", 2400)
            hx.redact(page, price=True)
            card(page, "pc_qr", "KODE PEMBAYARAN")
            card(page, "pc_summary_before", "Rincian Layanan yang Dipesan")
            card(page, "pc_form_before", "Konfirmasi Pembayaran Anda")
            page.locator("input[type=file]").first.set_input_files(str(proof))
            page.get_by_placeholder("Contoh: BCA / GoPay / Livin Mandiri").fill("GoPay")
            page.get_by_placeholder("Contoh: Budi Santoso").fill("Rani")
            page.wait_for_timeout(500)
            card(page, "pc_form_filled", "Konfirmasi Pembayaran Anda")
            page.get_by_role("button", name="Saya Sudah Bayar").click()
            page.wait_for_timeout(2400)
            hx.redact(page, price=True)
            card(page, "pc_summary_after", "Rincian Layanan yang Dipesan")
            card(page, "pc_form_after", "Konfirmasi Pembayaran Anda")
            browser.close()
    (OUT / "layout3.json").write_text(json.dumps(L3, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
