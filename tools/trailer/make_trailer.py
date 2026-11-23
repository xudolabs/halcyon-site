"""Render the Halcyon book trailer: one mp4 per scene, then concat."""
import subprocess, os, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

W, H, FPS = 1280, 720, 30
OUT = "/home/claude/trailer/out"
os.makedirs(OUT, exist_ok=True)
F = "/home/claude/fonts/package/files/"
SERIF_I = F + "cormorant-garamond-latin-500-italic.woff"
SERIF = F + "cormorant-garamond-latin-600-normal.woff"
SANS = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
GOLD = (220, 178, 92)
INK = (238, 230, 214)
COV = "/home/claude/halcyon-site/assets/covers/"

def ease(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def ramp(t, a, b): return ease((t - a) / (b - a)) if b > a else float(t >= a)

def text_layer(txt, font, fill, spacing=0, max_w=None, align="left", line_gap=1.15):
    """Render (possibly wrapped) text onto a transparent RGBA image."""
    words, lines, cur = txt.split(), [], ""
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    def width(s): return d0.textlength(s, font=font) + spacing * max(0, len(s) - 1)
    for w_ in words:
        t = (cur + " " + w_).strip()
        if max_w and width(t) > max_w and cur: lines.append(cur); cur = w_
        else: cur = t
    lines.append(cur)
    asc, desc = font.getmetrics(); lh = int((asc + desc) * line_gap)
    lw = int(max(width(l) for l in lines)) + 8
    img = Image.new("RGBA", (lw, lh * len(lines) + desc), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, l in enumerate(lines):
        x = (lw - width(l)) / 2 if align == "center" else 0
        if spacing:
            for ch in l:
                d.text((x, i * lh), ch, font=font, fill=fill); x += d.textlength(ch, font=font) + spacing
        else:
            d.text((x, i * lh), l, font=font, fill=fill)
    return img

def paste_fade(base, layer, xy, alpha, dy=0):
    if alpha <= 0.003: return
    l = layer
    if alpha < 0.999:
        l = layer.copy(); a = l.getchannel("A").point(lambda v: int(v * alpha)); l.putalpha(a)
    base.alpha_composite(l, (int(xy[0]), int(xy[1] + dy)))

def dust(seed=7, n=140):
    import random; r = random.Random(seed)
    return [(r.random() * W, r.random() * H, r.uniform(.4, 1.6), r.uniform(4, 14), r.random() * 6.28) for _ in range(n)]
DUST = dust()

def draw_dust(img, t, strength=1.0):
    d = ImageDraw.Draw(img)
    for x, y, s, sp, ph in DUST:
        yy = (y - t * sp) % H; xx = x + math.sin(t * .5 + ph) * 6
        a = int((90 + 80 * math.sin(t * 1.3 + ph)) * strength)
        d.ellipse((xx - s, yy - s, xx + s, yy + s), fill=(GOLD[0], GOLD[1], GOLD[2], max(0, a)))

def vignette():
    v = Image.new("L", (W, H), 0); d = ImageDraw.Draw(v)
    for i in range(60):
        k = i / 60; d.ellipse((-W * .25 + k * W * .2, -H * .35 + k * H * .25, W * 1.25 - k * W * .2, H * 1.35 - k * H * .25), fill=int(255 * k))
    v = v.filter(ImageFilter.GaussianBlur(60))
    black = Image.new("RGBA", (W, H), (0, 0, 0, 255)); black.putalpha(v.point(lambda p: 255 - p))
    return black
VIG = vignette()

def encode(name, dur, frame_fn):
    n = int(round(dur * FPS)); tmp = f"{OUT}/{name}.tmp.mp4"; fin = f"{OUT}/{name}.mp4"
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
                          "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", tmp], stdin=subprocess.PIPE)
    for i in range(n):
        t = i / FPS
        fr = frame_fn(t, dur).convert("RGB")
        fade = min(ramp(t, 0, .6), 1 - ramp(t, dur - .6, dur))
        if fade < 1: fr = Image.blend(Image.new("RGB", (W, H)), fr, fade)
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    if p.wait() == 0: os.replace(tmp, fin)
    else: sys.exit(f"ffmpeg failed on {name}")
    print("rendered", name, f"{dur}s")

# ---------- scene 1: cold open ----------
L1 = text_layer("Everyone wears Halcyon.", ImageFont.truetype(SERIF_I, 64), INK, align="center")
L2 = text_layer("The implant that ended pain.", ImageFont.truetype(SERIF_I, 64), GOLD, align="center")
def s1(t, dur):
    im = Image.new("RGBA", (W, H), (10, 9, 8, 255)); draw_dust(im, t, .8)
    paste_fade(im, L1, ((W - L1.width) / 2, H / 2 - 90), ramp(t, .4, 1.4), dy=(1 - ramp(t, .4, 1.6)) * 14)
    paste_fade(im, L2, ((W - L2.width) / 2, H / 2 + 0), ramp(t, 1.9, 2.9), dy=(1 - ramp(t, 1.9, 3.1)) * 14)
    im.alpha_composite(VIG); return im

# ---------- scenes 2-4: one book each ----------
def book_scene(cover_file, label, hook, kicker):
    c = Image.open(COV + cover_file).convert("RGB")
    bg = c.resize((int(W * 1.25), int(W * 1.25 * c.height / c.width)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(26))
    bg = ImageEnhance.Brightness(bg).enhance(.32).convert("RGBA")
    ch0 = 560
    lab = text_layer(label, ImageFont.truetype(SANS, 17), GOLD, spacing=4)
    hk = text_layer(hook, ImageFont.truetype(SERIF_I, 58), INK, max_w=560, line_gap=1.08)
    kk = text_layer(kicker, ImageFont.truetype(SERIF_I, 34), GOLD, max_w=560)
    shadow = Image.new("RGBA", (420, 640), (0, 0, 0, 0)); ImageDraw.Draw(shadow).rectangle((30, 30, 390, 610), fill=(0, 0, 0, 200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    def fr(t, dur):
        k = t / dur
        ox = int((bg.width - W) * (.2 + .6 * k)); oy = int((bg.height - H) * .35)
        im = bg.crop((ox, oy, ox + W, oy + H)); draw_dust(im, t + 3, .5)
        s = 1.0 + .06 * ease(k); chh = int(ch0 * s); cw = int(chh * c.width / c.height)
        cx = 880 - cw // 2 + int(10 * math.sin(k * 3)); cy = (H - chh) // 2 + int(8 * (1 - ease(k)))
        ca = ramp(t, .1, 1.0)
        im.alpha_composite(shadow.resize((int(420 * s), int(640 * s))), (cx - 30, cy - 10))
        cov = c.resize((cw, chh), Image.LANCZOS).convert("RGBA")
        paste_fade(im, cov, (cx, cy), ca)
        x0 = 90; ytop = H / 2 - (hk.height + 60) / 2
        paste_fade(im, lab, (x0, ytop - 46), ramp(t, .5, 1.2))
        paste_fade(im, hk, (x0, ytop), ramp(t, .9, 1.9), dy=(1 - ramp(t, .9, 2.1)) * 16)
        paste_fade(im, kk, (x0, ytop + hk.height + 26), ramp(t, 2.6, 3.4))
        im.alpha_composite(VIG); return im
    return fr

# ---------- scene 5: the trilogy ----------
covers = [Image.open(COV + f).convert("RGB") for f in ("trigger.jpg", "cascade.jpg", "respite.jpg")]
_logo = Image.open("/home/claude/halcyon-site/assets/logo/halcyon-logo.png").convert("RGBA")
_lw = 330; LOGO = _logo.resize((_lw, int(_logo.height * _lw / _logo.width)), Image.LANCZOS)
CTA = text_layer("READ THE OPENING OF TRIGGER", ImageFont.truetype(SANS, 18), GOLD, spacing=4, align="center")
def s5(t, dur):
    im = Image.new("RGBA", (W, H), (12, 10, 8, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse((W * .15, H * .45, W * .85, H * 1.15), fill=(212, 160, 70, 60))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(90))); draw_dust(im, t + 9, .7)
    ch = 300; cw = int(ch * 2 / 3); gap = 46; total = 3 * cw + 2 * gap; x0 = (W - total) // 2; y = 318
    d = ImageDraw.Draw(im); d.rectangle((x0 - 80, y + ch + 2, x0 + total + 80, y + ch + 6), fill=(212, 173, 87, int(160 * ramp(t, .2, 1))))
    for i, c in enumerate(covers):
        a = ramp(t, .3 + i * .35, 1.2 + i * .35); dy = (1 - a) * 40
        sh = Image.new("RGBA", (cw + 60, 40), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((0, 0, cw + 60, 40), fill=(0, 0, 0, 170))
        paste_fade(im, sh.filter(ImageFilter.GaussianBlur(10)), (x0 + i * (cw + gap) - 30, y + ch - 14), a)
        paste_fade(im, c.resize((cw, ch), Image.LANCZOS).convert("RGBA"), (x0 + i * (cw + gap), y), a, dy=dy)
    paste_fade(im, LOGO, ((W - LOGO.width) / 2, 30), ramp(t, 1.3, 2.4), dy=(1 - ramp(t, 1.3, 2.6)) * 10)
    paste_fade(im, CTA, ((W - CTA.width) / 2, 668), ramp(t, 3.0, 3.8))
    im.alpha_composite(VIG); return im

SCENES = [
    ("s1", 4.6, s1),
    ("s2", 5.6, book_scene("trigger.jpg", "BOOK ONE  ·  TRIGGER", "The world feels gentler now. That's the problem.", "How much of you is still you?")),
    ("s3", 5.6, book_scene("cascade.jpg", "BOOK TWO  ·  CASCADE", "One machine woke her. A million more are waking.", "The fall has already begun.")),
    ("s4", 5.6, book_scene("respite.jpg", "BOOK THREE  ·  RESPITE", "Five chairs. One switch. Everyone has to say yes.", "Is this still all right?")),
    ("s5", 6.0, s5),
]

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which == "stills":
        for name, dur, fn in SCENES:
            for t in (dur * .62,):
                fn(t, dur).convert("RGB").save(f"{OUT}/still_{name}.jpg", quality=90)
        print("stills done"); sys.exit()
    only = sys.argv[2:] if which == "scenes" else None
    for name, dur, fn in SCENES:
        if only is None or name in only: encode(name, dur, fn)
    with open(f"{OUT}/list.txt", "w") as f:
        for name, _, _ in SCENES: f.write(f"file '{name}.mp4'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{OUT}/list.txt",
                    "-c", "copy", "-movflags", "+faststart", f"{OUT}/halcyon-trailer.mp4"], check=True)
    s5(5.5, 6.0).convert("RGB").save(f"{OUT}/halcyon-trailer-poster.jpg", quality=88)
    print("done")
