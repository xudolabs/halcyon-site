#!/usr/bin/env python3
"""Make the blurred section background for a book from its cover.
Usage: python tools/make_bg.py trigger   (reads assets/covers/trigger.jpg, writes assets/bg/trigger.jpg)
Needs: pip install pillow
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance
slug = sys.argv[1]
c = Image.open(f"assets/covers/{slug}.jpg").convert("RGB")
w, h = c.size
art = c.crop((0, int(h * .25), w, int(h * .86)))          # skip the title and author lettering
W, H = 1600, 900
s = max(W / art.width, H / art.height)
art = art.resize((int(art.width * s), int(art.height * s)), Image.LANCZOS)
x, y = (art.width - W) // 2, (art.height - H) // 2
art = art.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(36))
art = ImageEnhance.Color(ImageEnhance.Brightness(art).enhance(.62)).enhance(1.15)
art.save(f"assets/bg/{slug}.jpg", quality=72, optimize=True, progressive=True)
print(f"wrote assets/bg/{slug}.jpg")
