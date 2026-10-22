"""Convierte una foto (mejorada o no) en la imagen final de la tienda:
fondo blanco limpio, producto centrado en lienzo 4:5, más un recorte sin fondo."""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

def finalize(src, out_main, out_cut=None, W=1000, H=1250, fill=0.78):
    im = Image.open(src).convert("RGB")
    if max(im.size) < 1200:  # sin mejora: ampliación suave
        f = 1200 / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
    a = np.asarray(im).astype(int)
    near = a.min(axis=2) > 238
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    fg = ~bg
    ys, xs = np.where(fg)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    bg = bg[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    arr = np.asarray(im).copy()
    arr[bg] = 255
    im = Image.fromarray(arr)
    scale = min(W * fill / im.width, H * fill / im.height)
    im2 = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), "white")
    canvas.paste(im2, ((W - im2.width) // 2, (H - im2.height) // 2))
    canvas.save(out_main, quality=88, method=6)
    if out_cut:
        alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
        c = im.copy(); c.putalpha(alpha); c.thumbnail((700, 900), Image.LANCZOS)
        c.save(out_cut, quality=90, method=6)

if __name__ == "__main__":
    kind = sys.argv[1]  # orig | prep
    root = "/home/claude/perfupox-store/public/products"
    ins = "/tmp/sr/in_orig" if kind == "orig" else "/tmp/sr/in_prep"
    outs = "/tmp/sr/out_orig" if kind == "orig" else "/tmp/sr/out_prep"
    n = e = 0
    for f in sorted(glob.glob(ins + "/*.png")):
        slug = os.path.basename(f)[:-4]
        enh = os.path.join(outs, slug + ".png")
        src = enh if os.path.exists(enh) else f
        e += src == enh
        if kind == "orig":
            finalize(src, f"{root}/originales/{slug}.webp", f"{root}/recortes/{slug}.webp")
        else:
            os.makedirs(f"{root}/referencias", exist_ok=True)
            finalize(src, f"{root}/referencias/{slug.removeprefix('preparada-')}.webp")
        n += 1
    print(f"{kind}: {n} imágenes, {e} mejoradas")
