#!/usr/bin/env python3
"""
Generates the procedural wallpaper library in assets/wallpapers/.

Wallpapers 001-002 are produced from the AI-generated source art
(assets/wallpaper-aurora.png / wallpaper-dune.png) by build-wallpapers.sh;
this script generates 003-100 as seeded, dark-friendly abstract gradients
with soft glow orbs, fine grain and a vignette. Output: 1600x900 JPEG.

Re-running is deterministic (fixed seeds) and overwrites identical files.
"""
import colorsys
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "wallpapers")
W, H = 1600, 900
SMALL_W, SMALL_H = 400, 225  # gradients are authored small, then upscaled

# Curated dark/mid-tone palettes (hue stops) so white dashboard UI stays readable.
PALETTES = [
    (0.72, 0.62), (0.78, 0.55), (0.58, 0.52), (0.52, 0.45), (0.88, 0.72),
    (0.95, 0.80), (0.08, 0.95), (0.36, 0.45), (0.45, 0.58), (0.66, 0.50),
    (0.60, 0.70), (0.83, 0.60), (0.04, 0.90), (0.50, 0.62), (0.70, 0.80),
    (0.15, 0.05), (0.30, 0.42), (0.55, 0.48), (0.90, 0.65), (0.76, 0.58),
    (0.62, 0.78), (0.48, 0.38), (0.20, 0.10), (0.68, 0.60),
]


def gradient_image(rng: random.Random, hue_a: float, hue_b: float) -> Image.Image:
    """Two-hue diagonal gradient rendered small, upscaled for smoothness."""
    img = Image.new("RGB", (SMALL_W, SMALL_H))
    px = img.load()
    angle = rng.uniform(0, math.tau)
    dx, dy = math.cos(angle), math.sin(angle)
    sat = rng.uniform(0.45, 0.75)
    for y in range(SMALL_H):
        for x in range(SMALL_W):
            t = 0.5 + (x / SMALL_W - 0.5) * dx + (y / SMALL_H - 0.5) * dy
            t = min(1.0, max(0.0, t))
            # Interpolate hue the short way around the colour wheel so a
            # red-to-magenta pair does not sweep through green and blue.
            delta = (hue_b - hue_a + 0.5) % 1.0 - 0.5
            hue = hue_a + delta * t
            light = 0.16 + 0.30 * t + rng.uniform(-0.01, 0.01)
            r, g, b = colorsys.hls_to_rgb(hue % 1.0, min(0.62, light), sat)
            px[x, y] = (int(r * 255), int(g * 255), int(b * 255))
    return img.resize((W, H), Image.BICUBIC)


def add_glows(img: Image.Image, rng: random.Random, hue_b: float) -> Image.Image:
    """Soft radial light orbs composited over the gradient."""
    overlay = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(overlay)
    for _ in range(rng.randint(3, 5)):
        cx, cy = rng.uniform(-0.1, 1.1) * W, rng.uniform(-0.1, 1.0) * H
        radius = rng.uniform(180, 520)
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            fill=rng.randint(28, 64),
        )
    overlay = overlay.filter(ImageFilter.GaussianBlur(120))
    r, g, b = colorsys.hls_to_rgb(hue_b % 1.0, 0.55, 0.7)
    glow = Image.new("RGB", (W, H), (int(r * 255), int(g * 255), int(b * 255)))
    return Image.composite(glow, img, overlay)


def add_grain_and_vignette(img: Image.Image, rng: random.Random) -> Image.Image:
    noise = Image.effect_noise((W // 2, H // 2), 12).resize((W, H))
    img = Image.blend(img, Image.merge("RGB", (noise, noise, noise)), 0.05)
    vignette = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(vignette)
    draw.ellipse([-W * 0.25, -H * 0.35, W * 1.25, H * 1.35], fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(180))
    black = Image.new("RGB", (W, H), (4, 6, 16))
    return Image.composite(img, black, vignette.point(lambda v: 140 + v * 115 // 255))


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for index in range(3, 101):
        rng = random.Random(10_000 + index)
        hue_a, hue_b = PALETTES[(index * 7) % len(PALETTES)]
        img = gradient_image(rng, hue_a, hue_b)
        img = add_glows(img, rng, hue_b)
        img = add_grain_and_vignette(img, rng)
        path = os.path.join(OUT_DIR, f"wallpaper-{index:03d}.jpg")
        img.save(path, "JPEG", quality=70, optimize=True, progressive=True)
    print("generated", len(range(3, 101)), "wallpapers in", OUT_DIR)


if __name__ == "__main__":
    main()
