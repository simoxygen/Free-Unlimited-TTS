import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
FPS = 24
FOCAL_BASE = 0.92 * H

FONT_TITLE = "fonts/BebasNeue-Regular.ttf"
FONT_LABEL = "fonts/Inter.ttf"
FONT_TECH = "fonts/Michroma-Regular.ttf"

_font_cache = {}
def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


class Camera:
    def __init__(self, eye, target, focal_mult=1.0, up=(0.0, 1.0, 0.0)):
        self.eye = np.asarray(eye, float)
        self.target = np.asarray(target, float)
        self.up = np.asarray(up, float)
        self.focal = FOCAL_BASE * focal_mult
        fwd = self.target - self.eye
        self.fwd = fwd / np.linalg.norm(fwd)
        right = np.cross(self.fwd, self.up)
        self.right = right / np.linalg.norm(right)
        self.upv = np.cross(self.right, self.fwd)

    def project(self, pts):
        pts = np.atleast_2d(np.asarray(pts, float))
        rel = pts - self.eye
        x = rel @ self.right
        y = rel @ self.upv
        z = rel @ self.fwd
        valid = z > 0.08
        sx = self.focal * x / np.where(valid, z, 1.0) + W * 0.5
        sy = -self.focal * y / np.where(valid, z, 1.0) + H * 0.5
        return np.stack([sx, sy], axis=1), z, valid


def depth_fog(z, near=1.4, far=4.4):
    return np.clip((far - z) / (far - near), 0.05, 1.0)


def background(t_scene=0.0):
    top = np.array([9, 20, 30], float)
    bottom = np.array([2, 5, 9], float)
    ramp = np.linspace(0, 1, H)[:, None]
    img = (top[None, :] * (1 - ramp) + bottom[None, :] * ramp)
    buf = np.repeat(img[:, None, :], W, axis=1)
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy = W * 0.62, H * 0.40
    d2 = ((xx - cx) / 720.0) ** 2 + ((yy - cy) / 720.0) ** 2
    glow = np.exp(-d2 * 1.4) * 0.55
    tint = np.array([6, 26, 34], float)
    buf += tint[None, None, :] * glow[:, :, None]
    return buf


def add_dots(buf, cam, pts, color, radius=2, intensity=1.0, fog_strength=0.8, jitter=0.0):
    if len(pts) == 0:
        return
    xy, z, valid = cam.project(pts)
    if not valid.any():
        return
    xy = xy[valid]
    z = z[valid]
    fade = depth_fog(z) ** (fog_strength if fog_strength > 0 else 1)
    if fog_strength <= 0:
        fade[:] = 1.0
    col = np.asarray(color, float)[None, :] * (intensity * fade)[:, None]
    if jitter > 0:
        xy = xy + np.random.uniform(-jitter, jitter, xy.shape)
    ix = np.round(xy[:, 0]).astype(np.int64)
    iy = np.round(xy[:, 1]).astype(np.int64)
    R = int(radius)
    offs = np.arange(-R, R + 1)
    sig = max(radius, 0.9) * 0.75
    kern = np.exp(-(offs ** 2) / (2 * sig ** 2))
    kern /= kern.sum()
    for dj, wj in zip(offs, kern):
        yy = iy + dj
        ok = (yy >= 0) & (yy < H)
        for di in offs[np.abs(offs) >= 0]:
            w = wj * kern[np.where(offs == di)[0][0]] * 3.1416 * sig * sig
            xx = ix + di
            m = ok & (xx >= 0) & (xx < W)
            if m.any():
                np.add.at(buf, (yy[m], xx[m]), col[m] * w)


def draw_polylines(overlay, cam, polylines, color, width=2, alpha=255, fog=True):
    if alpha <= 0:
        return
    d = ImageDraw.Draw(overlay)
    col = tuple(np.asarray(color, int)) + (int(alpha),)
    for pl in polylines:
        xy, z, valid = cam.project(pl)
        pts = [tuple(xy[i]) for i in range(len(pl)) if valid[i]]
        if len(pts) < 2:
            continue
        if fog:
            zv = z[valid].mean()
            f = depth_fog(np.array([zv]))[0]
            a = int(alpha * f)
            if a <= 3:
                continue
            c = tuple(np.asarray(color, int)) + (a,)
        else:
            c = col
        d.line(pts, fill=c, width=width, joint="curve")


def new_overlay():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def composite(buf, overlay, additive_mask=None):
    buf += np.asarray(overlay.convert("RGB"), float) * (np.asarray(overlay.getchannel("A"), float)[:, :, None] / 255.0)


def draw_text(img, xy, text, fnt, color, alpha=255, anchor="mm", spacing=4):
    if alpha <= 0:
        return
    d = ImageDraw.Draw(img)
    d.text(xy, text, font=fnt, fill=tuple(np.asarray(color, int)) + (int(alpha),), anchor=anchor, spacing=spacing)


def ease(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def clamp01(x):
    return np.clip(x, 0.0, 1.0)


_vign = None
def vignette_mask():
    global _vign
    if _vign is None:
        yy, xx = np.mgrid[0:H, 0:W]
        dx = (xx - W / 2) / (W / 2)
        dy = (yy - H / 2) / (H / 2)
        r = np.sqrt(dx ** 2 + dy ** 2)
        _vign = 1.0 - np.clip(r - 0.55, 0, 1) ** 2 * 0.85
    return _vign


def make_luts():
    x = np.arange(256, dtype=float) / 255.0
    r = np.clip(np.interp(x, [0, 0.5, 1], [0, 0.47, 1.0]) * 0.97 + 0.01, 0, 1)
    g = np.clip(np.interp(x, [0, 0.5, 1], [0, 0.50, 1.0]), 0, 1)
    b = np.clip(np.interp(x, [0, 0.5, 1], [0.01, 0.54, 1.0]) * 1.03 + 0.015, 0, 1)
    s = np.clip((x - x ** 2) * 0.25 + x, 0, 1)
    rl = (r * 0.9 + 0.1 * s) * 255
    gl = (g * 0.9 + 0.1 * s) * 255
    bl = (b * 0.9 + 0.1 * s) * 255
    return np.round(rl).astype(np.uint8), np.round(gl).astype(np.uint8), np.round(bl).astype(np.uint8)


LUT_R, LUT_G, LUT_B = make_luts()
BAR = int(round(H - W / 2.39) / 2)


def post_process(img, grain_amp=4.5, t_phase=0.0):
    arr = np.asarray(img, float)
    luma = arr @ np.array([0.299, 0.587, 0.114])
    bright = np.clip((luma - 175.0) / 80.0, 0, 1)[:, :, None]
    bright_rgb = np.clip(arr * bright[:, :, :], 0, 255).astype(np.uint8)
    bi = Image.fromarray(bright_rgb).resize((W // 4, H // 4), Image.BILINEAR)
    bi = bi.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(4))
    bi = bi.resize((W, H), Image.BILINEAR)
    arr = arr + np.asarray(bi, float) * 0.55
    out = np.empty_like(arr, dtype=np.uint8)
    out[:, :, 0] = LUT_R[np.clip(arr[:, :, 0], 0, 255).astype(np.uint8)]
    out[:, :, 1] = LUT_G[np.clip(arr[:, :, 1], 0, 255).astype(np.uint8)]
    out[:, :, 2] = LUT_B[np.clip(arr[:, :, 2], 0, 255).astype(np.uint8)]
    f = out.astype(float)
    f *= vignette_mask()[:, :, None]
    rng = np.random.default_rng(int(t_phase * 977) & 0xFFFF)
    f += rng.normal(0, grain_amp, (H, W, 1)) * 1.4
    out = np.clip(f, 0, 255).astype(np.uint8)
    if BAR > 0:
        out[:BAR] = 0
        out[H - BAR:] = 0
    return Image.fromarray(out)
