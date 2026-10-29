"""Make icons/icon-192.png and icons/icon-512.png from icons/matrix-logo.png (1024px).
Run from the Matrix folder: python3 tools/make-icons.py
Needs Pillow. Only needed when the logo changes."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, 'icons', 'matrix-logo.png')).convert('RGBA')
for size in (192, 512):
    src.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, 'icons', 'icon-%d.png' % size), optimize=True)
    print('wrote icon-%d.png' % size)
