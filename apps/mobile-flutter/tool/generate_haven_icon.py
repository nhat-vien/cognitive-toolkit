#!/usr/bin/env python3
"""
Pure Python stdlib generator for Haven (Equilibria) 1024x1024 app icon PNGs.
No external Pillow/numpy dependencies required.
Generates:
  - assets/icon/haven_icon.png (Alabaster #FAF9F6 background, Lavender halo, Sage leaves, Amber sun)
  - assets/icon/haven_icon_foreground.png (Transparent background, centered within Android adaptive safe zone)
"""

import math
import os
import struct
import zlib

SIZE = 1024
CX = SIZE / 2.0
CY = SIZE / 2.0


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if v < lo else (hi if v > hi else v)


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    t = clamp((x - edge0) / (edge1 - edge0))
    return t * t * (3.0 - 2.0 * t)


def blend(dst: tuple[float, float, float, float], src: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    sa = src[3]
    if sa <= 0.0:
        return dst
    if sa >= 1.0:
        return src
    da = dst[3]
    out_a = sa + da * (1.0 - sa)
    if out_a <= 0.0:
        return (0.0, 0.0, 0.0, 0.0)
    r = (src[0] * sa + dst[0] * da * (1.0 - sa)) / out_a
    g = (src[1] * sa + dst[1] * da * (1.0 - sa)) / out_a
    b = (src[2] * sa + dst[2] * da * (1.0 - sa)) / out_a
    return (r, g, b, out_a)


def sd_circle(x: float, y: float, cx: float, cy: float, r: float) -> float:
    return math.hypot(x - cx, y - cy) - r


def sd_rotated_ellipse(x: float, y: float, cx: float, cy: float, rx: float, ry: float, angle_rad: float) -> float:
    dx = x - cx
    dy = y - cy
    ca = math.cos(angle_rad)
    sa = math.sin(angle_rad)
    lx = dx * ca + dy * sa
    ly = -dx * sa + dy * ca
    # Normalized radial distance approx in pixels
    norm = math.hypot(lx / rx, ly / ry)
    scale = min(rx, ry)
    return (norm - 1.0) * scale


def sd_capsule(x: float, y: float, ax: float, ay: float, bx: float, by: float, r: float) -> float:
    pax = x - ax
    pay = y - ay
    bax = bx - ax
    bay = by - ay
    h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay))
    return math.hypot(pax - bax * h, pay - bay * h) - r


def write_png(path: str, rows: bytearray) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)

    def make_chunk(chunk_type: bytes, data: bytes) -> bytes:
        chunk = chunk_type + data
        crc = zlib.crc32(chunk) & 0xFFFFFFFF
        return struct.pack("!I", len(data)) + chunk + struct.pack("!I", crc)

    ihdr = struct.pack("!IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    compressed = zlib.compress(bytes(rows), level=6)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(make_chunk(b"IHDR", ihdr))
        f.write(make_chunk(b"IDAT", compressed))
        f.write(make_chunk(b"IEND", b""))


def render_icon(transparent_bg: bool) -> bytearray:
    stride = 1 + SIZE * 4
    buf = bytearray(stride * SIZE)

    # Palette
    alabaster = (250.0, 249.0, 246.0, 1.0)
    sage_halo_bg = (213.0, 232.0, 220.0, 0.55)
    lavender = (121.0, 114.0, 152.0, 1.0)
    lavender_soft = (184.0, 176.0, 208.0, 0.45)
    sage = (106.0, 168.0, 130.0, 1.0)
    deep_sage = (82.0, 135.0, 103.0, 1.0)
    amber_sun = (242.0, 192.0, 120.0, 1.0)

    # Scale inner artwork slightly down for adaptive safe zone
    s = 0.78 if transparent_bg else 1.0

    halo_r = 350.0 * s
    ring_outer = 310.0 * s
    ring_inner = 294.0 * s

    sun_cx, sun_cy, sun_r = CX, CY - 210.0 * s, 46.0 * s
    sun_glow_r = 86.0 * s

    stem_ax, stem_ay = CX, CY + 215.0 * s
    stem_bx, stem_by = CX, CY - 120.0 * s

    left_cx, left_cy = CX - 115.0 * s, CY + 25.0 * s
    right_cx, right_cy = CX + 115.0 * s, CY - 15.0 * s
    center_cx, center_cy = CX, CY - 80.0 * s

    for y in range(SIZE):
        row_offset = y * stride
        buf[row_offset] = 0  # Filter None
        fy = float(y)
        for x in range(SIZE):
            fx = float(x)
            col = (0.0, 0.0, 0.0, 0.0) if transparent_bg else alabaster

            # Soft radial pastel tint in center
            d_center = math.hypot(fx - CX, fy - CY)

            # Soft sage circle sanctuary backdrop
            if d_center < halo_r + 4.0:
                a = 1.0 - smoothstep(halo_r - 2.0, halo_r + 2.0, d_center)
                col = blend(col, (sage_halo_bg[0], sage_halo_bg[1], sage_halo_bg[2], sage_halo_bg[3] * a))

            # Subtle lavender outer sanctuary ring
            if ring_inner - 4.0 < d_center < ring_outer + 4.0:
                a_out = 1.0 - smoothstep(ring_outer - 2.0, ring_outer + 2.0, d_center)
                a_in = smoothstep(ring_inner - 2.0, ring_inner + 2.0, d_center)
                a = a_out * a_in
                col = blend(col, (lavender_soft[0], lavender_soft[1], lavender_soft[2], 0.85 * a))

            # Soft amber sun halo & sun orb
            d_sun = math.hypot(fx - sun_cx, fy - sun_cy)
            if d_sun < sun_glow_r:
                glow_a = (1.0 - smoothstep(sun_r, sun_glow_r, d_sun)) * 0.35
                col = blend(col, (amber_sun[0], amber_sun[1], amber_sun[2], glow_a))
            if d_sun < sun_r + 2.0:
                a = 1.0 - smoothstep(sun_r - 1.5, sun_r + 1.5, d_sun)
                col = blend(col, (amber_sun[0], amber_sun[1], amber_sun[2], a))

            # Left sage botanical leaf
            d_left = sd_rotated_ellipse(fx, fy, left_cx, left_cy, 125.0 * s, 68.0 * s, 0.58)
            if d_left < 2.0:
                a = 1.0 - smoothstep(-1.5, 1.5, d_left)
                col = blend(col, (sage[0], sage[1], sage[2], a))

            # Right lavender-sage balance leaf
            d_right = sd_rotated_ellipse(fx, fy, right_cx, right_cy, 125.0 * s, 68.0 * s, -0.58)
            if d_right < 2.0:
                a = 1.0 - smoothstep(-1.5, 1.5, d_right)
                col = blend(col, (lavender[0], lavender[1], lavender[2], a))

            # Center top lotus / sprout petal
            d_mid = sd_rotated_ellipse(fx, fy, center_cx, center_cy, 52.0 * s, 88.0 * s, 0.0)
            if d_mid < 2.0:
                a = 1.0 - smoothstep(-1.5, 1.5, d_mid)
                col = blend(col, (sage[0], sage[1], sage[2], a * 0.92))

            # Central grounding stem
            d_stem = sd_capsule(fx, fy, stem_ax, stem_ay, stem_bx, stem_by, 12.0 * s)
            if d_stem < 2.0:
                a = 1.0 - smoothstep(-1.5, 1.5, d_stem)
                col = blend(col, (deep_sage[0], deep_sage[1], deep_sage[2], a))

            px = row_offset + 1 + x * 4
            buf[px] = int(clamp(col[0] / 255.0) * 255.0)
            buf[px + 1] = int(clamp(col[1] / 255.0) * 255.0)
            buf[px + 2] = int(clamp(col[2] / 255.0) * 255.0)
            buf[px + 3] = int(clamp(col[3]) * 255.0)

    return buf


def main() -> None:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    icon_dir = os.path.join(base_dir, "assets", "icon")
    main_icon = os.path.join(icon_dir, "haven_icon.png")
    fg_icon = os.path.join(icon_dir, "haven_icon_foreground.png")

    print("Generating haven_icon.png (1024x1024)...")
    write_png(main_icon, render_icon(transparent_bg=False))
    print("Generating haven_icon_foreground.png (1024x1024)...")
    write_png(fg_icon, render_icon(transparent_bg=True))
    print("Done:", main_icon, os.path.getsize(main_icon), fg_icon, os.path.getsize(fg_icon))


if __name__ == "__main__":
    main()
