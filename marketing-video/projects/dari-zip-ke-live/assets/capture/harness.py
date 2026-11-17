"""Capture harness: boots the source repo's Vite dev server (read-only) and drives it with
Playwright. All /api calls are fulfilled from fixtures.py. All non-local network except
Google Fonts is blocked, so nothing reaches production or third parties."""
import json
import os
import subprocess
import sys
import time
import urllib.request
from contextlib import contextmanager
from pathlib import Path

import qrcode
from playwright.sync_api import sync_playwright

import fixtures as fx

SRC_REPO = Path(__file__).resolve().parents[5]  # .../1sLabs-website
HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "screenshots"
PORT = 5199
BASE = f"http://127.0.0.1:{PORT}"
UNMATCHED = set()


def qr_png_bytes():
    import io
    img = qrcode.make("https://1slabs.my.id/hosting", box_size=12, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@contextmanager
def vite_server():
    env = dict(os.environ)
    proc = subprocess.Popen(
        ["npx.cmd" if os.name == "nt" else "npx", "vite", "--port", str(PORT), "--strictPort", "--host", "127.0.0.1"],
        cwd=str(SRC_REPO), env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        for _ in range(90):
            try:
                urllib.request.urlopen(BASE, timeout=1)
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("vite did not start")
        yield
    finally:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            proc.terminate()


def install_routes(context):
    qr = qr_png_bytes()

    def route(r):
        req = r.request
        url = req.url
        if url.startswith(BASE):
            path = url[len(BASE):]
            if path.startswith("/__qr.png"):
                return r.fulfill(status=200, content_type="image/png", body=qr)
            if path.startswith("/api/") or path.startswith("/uploads/"):
                body = None
                try:
                    body = req.post_data_json
                except Exception:
                    body = None
                res = fx.handle(req.method, path, body)
                if res is None:
                    UNMATCHED.add(f"{req.method} {path.split('?')[0]}")
                    return r.fulfill(status=200, content_type="application/json", body=fx.dumps(fx.EMPTY_FALLBACK))
                status, data = res
                return r.fulfill(status=status, content_type="application/json", body=fx.dumps(data))
            return r.continue_()
        host = url.split("/")[2] if "//" in url else ""
        if host.endswith(("fonts.googleapis.com", "fonts.gstatic.com", "image2url.com")):
            return r.continue_()
        return r.abort()

    context.route("**/*", route)


def new_context(p, width=1280, height=900, dsf=2, authed=True):
    browser = p.chromium.launch(args=["--disable-web-security"])
    ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=dsf, locale="id-ID")
    if authed:
        ctx.add_init_script(
            "localStorage.setItem('oneslabs_token','demo-token');"
            f"localStorage.setItem('oneslabs_user', {json.dumps(json.dumps(fx.USER))});"
            "localStorage.setItem('theme','light');")
    else:
        ctx.add_init_script("localStorage.setItem('theme','light');")
    install_routes(ctx)
    return browser, ctx


REDACT_JS = r"""
(opts) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    let v = n.nodeValue;
    let o = v;
    v = v.replace(/103\.119\.237\.132/g, '203.0.113.10');
    v = v.replace(/NMID:\s*\S+\s*\/\s*\S+/g, 'NMID: ID•••••••••• / A01');
    v = v.replace(/domainmurah\.net/g, 'example.net');
    if (opts.price) v = v.replace(/Rp\s?[0-9][0-9.,]*/g, 'Rp •••.•••');
    if (v !== o) n.nodeValue = v;
  }
}
"""


def redact(page, price=False):
    page.evaluate(REDACT_JS, {"price": price})


def shot(page, name, selector=None, full=False, clip=None):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.png"
    if selector:
        page.locator(selector).first.screenshot(path=str(path))
    else:
        page.screenshot(path=str(path), full_page=full, clip=clip)
    print("saved", path.name)
    return path
