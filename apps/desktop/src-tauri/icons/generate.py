"""
Generate all Tauri icon formats for RiftLens.
Design: dark hexagon + cyan crosshair lens + gold borders
"""
import math
import os
from PIL import Image, ImageDraw

SIZE = 1024
OUT = os.path.dirname(__file__)

BG         = (10, 14, 26, 255)       # #0a0e1a
GOLD       = (200, 155, 60, 255)     # #c89b3c
GOLD_DIM   = (200, 155, 60, 100)
CYAN       = (0, 212, 255, 255)      # #00d4ff
CYAN_DIM   = (0, 212, 255, 140)
TRANSP     = (0, 0, 0, 0)

def hex_points(cx, cy, r, flat_top=True):
    pts = []
    for i in range(6):
        angle = math.radians(60 * i + (0 if flat_top else 30))
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts

def draw_polygon_aa(draw, pts, fill=None, outline=None, width=1):
    if fill:
        draw.polygon(pts, fill=fill)
    if outline:
        n = len(pts)
        for i in range(n):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % n]
            draw.line([(x0, y0), (x1, y1)], fill=outline, width=width)

def draw_circle_outline(draw, cx, cy, r, color, width):
    bb = [cx - r, cy - r, cx + r, cy + r]
    for w in range(width):
        rr = r - w // 2
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=color)

def generate(size):
    img = Image.new("RGBA", (size, size), TRANSP)
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    pad = size * 0.04

    # --- Hexagon background (flat-top) ---
    hex_r = cx - pad
    pts = hex_points(cx, cy, hex_r, flat_top=False)
    draw_polygon_aa(draw, pts, fill=BG)

    # --- Gold border (outer hex) ---
    bw = max(2, int(size * 0.012))
    draw_polygon_aa(draw, pts, outline=GOLD, width=bw)

    # --- Gold inner hex accent ---
    inner_pts = hex_points(cx, cy, hex_r * 0.82, flat_top=False)
    draw_polygon_aa(draw, inner_pts, outline=GOLD_DIM, width=max(1, bw // 2))

    # --- Lens outer ring ---
    lens_r = int(hex_r * 0.46)
    ring_w = max(3, int(size * 0.014))
    draw_circle_outline(draw, cx, cy, lens_r, CYAN, ring_w)

    # --- Lens inner ring ---
    inner_lens_r = int(lens_r * 0.62)
    draw_circle_outline(draw, cx, cy, inner_lens_r, CYAN_DIM, max(1, ring_w // 2))

    # --- Center dot ---
    dot_r = int(lens_r * 0.16)
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=CYAN)

    # --- Crosshair lines ---
    gap = int(lens_r * 0.18)
    reach = int(hex_r * 0.62)
    lw = max(2, int(size * 0.008))

    # Horizontal
    draw.line([(cx - reach, cy), (cx - lens_r - gap, cy)], fill=CYAN, width=lw)
    draw.line([(cx + lens_r + gap, cy), (cx + reach, cy)], fill=CYAN, width=lw)
    # Vertical
    draw.line([(cx, cy - reach), (cx, cy - lens_r - gap)], fill=CYAN, width=lw)
    draw.line([(cx, cy + lens_r + gap), (cx, cy + reach)], fill=CYAN, width=lw)

    # --- Gold corner notch accents (LoL style) ---
    notch_len = int(hex_r * 0.15)
    notch_w = max(2, int(size * 0.008))
    # top-left notch
    tx, ty = pts[5]
    bx, by = pts[0]
    mx, my = (tx + bx) / 2, (ty + by) / 2
    dx, dy = bx - tx, by - ty
    length = math.hypot(dx, dy)
    nx, ny = -dy / length, dx / length
    x0 = mx + nx * notch_len * 0.3
    y0 = my + ny * notch_len * 0.3
    x1 = mx - nx * notch_len * 0.3
    y1 = my - ny * notch_len * 0.3
    draw.line([(x0, y0), (x1, y1)], fill=GOLD, width=notch_w)

    # bottom-right notch (opposite vertex)
    tx2, ty2 = pts[2]
    bx2, by2 = pts[3]
    mx2, my2 = (tx2 + bx2) / 2, (ty2 + by2) / 2
    x0b = mx2 + nx * notch_len * 0.3
    y0b = my2 + ny * notch_len * 0.3
    x1b = mx2 - nx * notch_len * 0.3
    y1b = my2 - ny * notch_len * 0.3
    draw.line([(x0b, y0b), (x1b, y1b)], fill=GOLD, width=notch_w)

    return img

print("Generating 1024x1024 master...")
master = generate(SIZE)
master.save(os.path.join(OUT, "icon.png"))
print("  icon.png ok")

for dim in [32, 128]:
    resized = master.resize((dim, dim), Image.LANCZOS)
    resized.save(os.path.join(OUT, f"{dim}x{dim}.png"))
    print(f"  {dim}x{dim}.png ok")

resized_2x = master.resize((256, 256), Image.LANCZOS)
resized_2x.save(os.path.join(OUT, "128x128@2x.png"))
print("  128x128@2x.png ok")

# ico (Windows) — multi-size embedded
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
ico_imgs = [master.resize(s, Image.LANCZOS) for s in ico_sizes]
ico_imgs[0].save(
    os.path.join(OUT, "icon.ico"),
    format="ICO",
    sizes=ico_sizes,
    append_images=ico_imgs[1:],
)
print("  icon.ico ok")

print("\nDone. icns must be generated with: iconutil (macOS only)")
print("Run: python3 generate_icns.py")
