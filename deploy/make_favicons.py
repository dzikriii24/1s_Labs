from PIL import Image
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = r"public\logo-1slabs.png"
PUBLIC_DIR = "public"

def main():
    print("Generating comprehensive favicon suite from:", MASTER_PATH)
    master = Image.open(MASTER_PATH).convert("RGBA")
    w, h = master.size
    print(f"Master size: {w}x{h}")

    # Generate various sizes
    sizes = {
        "favicon-16x16.png": (16, 16),
        "favicon-32x32.png": (32, 32),
        "favicon-48x48.png": (48, 48),    # Crucial for Google Search!
        "favicon-96x96.png": (96, 96),    # Crucial for Google Search 2x!
        "favicon-144x144.png": (144, 144),# Google 3x
        "favicon-192x192.png": (192, 192),# PWA & Google 4x
        "favicon-512x512.png": (512, 512),# PWA & Schema.org
        "apple-touch-icon.png": (180, 180),
    }

    for filename, (sw, sh) in sizes.items():
        out_path = os.path.join(PUBLIC_DIR, filename)
        resized = master.resize((sw, sh), Image.Resampling.LANCZOS)
        resized.save(out_path, format="PNG", optimize=True)
        print(f"Saved {filename} ({sw}x{sh})")

    # Generate multi-size favicon.ico (16, 32, 48)
    ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    icon_sizes = [(16, 16), (32, 32), (48, 48)]
    master.save(ico_path, format="ICO", sizes=icon_sizes)
    print(f"Saved favicon.ico with sizes: {icon_sizes}")

    print("All favicon assets successfully generated from logo-1slabs.png!")

if __name__ == "__main__":
    main()

