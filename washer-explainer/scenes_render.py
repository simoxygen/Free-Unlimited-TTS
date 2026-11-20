import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from engine import (W, H, FPS, FONT_TITLE, FONT_LABEL, FONT_TECH, Camera,
                    add_dots, draw_polylines, new_overlay, draw_text,
                    background, post_process, ease, clamp01, font)

DR = 0.235
Z0, Z1 = -0.22, 0.22
DRUM_CY = 0.05
CYAN = (64, 224, 230)
WATER = (80, 165, 232)
WATER_HI = (150, 220, 255)
AMBER = (255, 176, 92)
METAL = (110, 140, 165)
WHITE = (230, 238, 244)
CLOTH = (205, 170, 120)
CLOTH_HI = (255, 224, 182)


def ang_components(r, a):
    return r * np.cos(a), r * np.sin(a)


def circle_poly(r, z, n=72):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False) + 2 * np.pi / (n * 2)
    x, y = ang_components(r, a)
    return np.stack([x, DRUM_CY + y, np.full(n, z)], 1)


def dashed(poly, on=8, off=5):
    n = len(poly)
    segs, cur = [], []
    for i in range(n):
        if (i // on) % 2 == 0:
            cur.append(poly[i])
        else:
            if len(cur) > 1:
                segs.append(np.array(cur))
            cur = []
    if len(cur) > 1:
        segs.append(np.array(cur))
    return segs


def drum_local():
    rings = [circle_poly(DR, z, 64) for z in np.linspace(Z0, Z1, 9)]
    longs = []
    for k in range(14):
        a = 2 * np.pi * k / 14
        x, y = ang_components(DR, a)
        longs.append(np.stack([np.full(8, x * 0.995), np.full(8, DRUM_CY + y * 0.995), np.linspace(Z0, Z1, 8)], 1))
    holes = []
    for k in range(380):
        z = Z0 + 0.012 + (Z1 - Z0 - 0.032) * ((k * 0.618033) % 1.0)
        a = 2 * np.pi * ((k * 0.381966) % 1.0)
        x, y = ang_components(DR * 1.001, a)
        holes.append([x, DRUM_CY + y, z])
    vanes = []
    for m in range(3):
        a = 2 * np.pi * m / 3 + math.pi / 2
        for da in (-0.075, 0.075):
            aa = a + da
            x, y = ang_components(DR * 0.985, aa)
            vanes.append(np.stack([np.full(6, x), np.full(6, DRUM_CY + y), np.linspace(Z0 + 0.02, Z1 - 0.03, 6)], 1))
        e1 = np.array(ang_components(DR * 0.985, a - 0.075) + (Z0 + 0.02,))
        e2 = np.array(ang_components(DR * 0.985, a - 0.075) + (Z1 - 0.03,))
        f1 = np.array(ang_components(DR * 0.985, a + 0.075) + (Z0 + 0.02,))
        f2 = np.array(ang_components(DR * 0.985, a + 0.075) + (Z1 - 0.03,))
        vanes.append(np.stack([e1, e2], 0))
        vanes.append(np.stack([f1, f2], 0))
        vanes.append(np.stack([e1, f1], 0))
    spider = []
    hub = np.array([0, DRUM_CY, Z0 - 0.045])
    for m in range(3):
        a = 2 * np.pi * m / 3 + 0.4
        x, y = ang_components(DR, a)
        rim = np.array([x, DRUM_CY + y, Z0 + 0.01])
        tt = np.linspace(0, 1, 10)[:, None]
        spider.append(hub[None, :] * (1 - tt) + rim[None, :] * tt)
    return rings, longs, np.array(holes), vanes, spider


RINGS, LONGS, HOLES, VANES, SPIDER = drum_local()
TUB = []
for zz in (-0.15, 0.0, 0.15):
    TUB += dashed(circle_poly(0.274, zz, 96), 8, 5)


def rotz(pts, theta):
    if abs(theta) < 1e-9:
        return np.asarray(pts)
    c, s = math.cos(theta), math.sin(theta)
    M = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    return np.asarray(pts) @ M.T


def rotate_polys(polys, theta):
    return [rotz(p, theta) for p in polys]


HW, YLO, YHI, ZCLO, ZCHI = 0.375, -0.44, 0.46, -0.34, 0.36
CAB = []
for sx in (-HW, HW):
    for sz in (ZCLO, ZCHI):
        CAB.append(np.array([[sx, YLO + 0.06, sz], [sx, YHI - 0.06, sz]]))
for sy in (YLO + 0.06, YHI - 0.06):
    for sz in (ZCLO, ZCHI):
        CAB.append(np.array([[-HW, sy, sz], [HW, sy, sz]]))
for sx in (-HW, HW):
    for sy in (YLO + 0.06, YHI - 0.06):
        CAB.append(np.array([[sx, sy, ZCLO], [sx, sy, ZCHI]]))
DOOR_RING = circle_poly(0.29, 0.36, 88)
DOOR_RING2 = circle_poly(0.255, 0.372, 88)
PANEL = [np.array([[-HW, 0.30, ZCHI], [HW, 0.30, ZCHI]])]
FEET = [np.array([[sx * 0.8, YLO + 0.06, sz], [sx * 0.8, YLO - 0.04, sz]])
        for sx in (-1, 1) for sz in (ZCLO * 0.9, ZCHI * 0.9)]
DRAIN_HOSE = np.array([[0.05, -0.38, -0.05], [0.14, -0.46, 0.06], [0.34, -0.50, 0.13], [0.55, -0.53, 0.20]])
INLET = np.array([[0.0, 0.50, -0.30], [0.0, 0.42, -0.26], [0.0, 0.33, -0.21], [0.0, 0.26, -0.18]])


def cam_book(u, yaw0, drift, radius, el, target=(0, 0.0, 0.0), focal=1.0):
    yaw = yaw0 + drift * (u - 0.5)
    tgt = np.array(target, float)
    eye = np.array([
        tgt[0] + radius * math.cos(el) * math.cos(yaw),
        tgt[1] + radius * math.sin(el),
        tgt[2] + radius * math.cos(el) * math.sin(yaw),
    ])
    return Camera(eye, tgt, focal)


def add_ground_shadow(buf, cam):
    ov = new_overlay()
    d = ImageDraw.Draw(ov)
    c0, _, v0 = cam.project(np.array([-0.5, YLO - 0.05, -0.2]))
    c1, _, v1 = cam.project(np.array([0.5, YLO - 0.05, -0.2]))
    c2, _, v2 = cam.project(np.array([0.5, YLO - 0.05, 0.3]))
    c3, _, v3 = cam.project(np.array([-0.5, YLO - 0.05, 0.3]))
    if all([v0[0], v1[0], v2[0], v3[0]]):
        pts = [tuple(c0[0]), tuple(c1[0]), tuple(c2[0]), tuple(c3[0])]
        d.polygon(pts, fill=(0, 0, 0, 110))
        ov = ov.filter(ImageFilter.GaussianBlur(18))
        shade = np.asarray(ov.getchannel("A"), float)[:, :, None] / 255.0 * 0.55
        buf -= shade * 0.9


def scatter_cyl(n, r_max, z_span, seed):
    rng = np.random.default_rng(seed)
    r = r_max * np.sqrt(rng.random(n))
    a = rng.random(n) * 2 * math.pi
    z = z_span[0] + (z_span[1] - z_span[0]) * rng.random(n)
    return r, a, z


def cloth_field(seed=5, ncl=9, npc=80, r_frac=0.55):
    rng = np.random.default_rng(seed)
    ci = rng.integers(0, ncl, npc)
    ca = rng.random(npc) * 2 * math.pi
    cz = Z0 + 0.03 + rng.random(npc) * (Z1 - Z0 - 0.09)
    cr = DR * r_frac * (0.55 + 0.45 * rng.random(npc))
    base = np.stack([cr * np.cos(ca), cr * np.sin(ca), cz], 1)
    return base, ci, npc


def draw_machine_outline(ov, cam, alpha_box=30):
    draw_polylines(ov, cam, CAB, WHITE, 1, alpha_box)
    draw_polylines(ov, cam, FEET, WHITE, 1, int(alpha_box * 0.7))
    draw_polylines(ov, cam, PANEL, WHITE, 1, int(alpha_box * 0.9))
    draw_polylines(ov, cam, [DOOR_RING], CYAN, 2, min(255, int(alpha_box * 2.6)))
    draw_polylines(ov, cam, [DOOR_RING2], CYAN, 1, min(255, int(alpha_box * 1.8)))


def render_scene(idx, t, L, audio_dur):
    u = clamp01(t / max(L, 1e-6))
    buf = background(t)
    ov = new_overlay()
    cam = None
    labels = []

    if idx == 0:
        push = ease(clamp01(t / 7.0))
        cam = cam_book(u, -0.42, 0.38, 3.5 - 0.95 * push, 0.15 + 0.03 * u, (0, 0.02, -0.02), 0.88 + 0.14 * push)
        th = 0.5 * t
        add_ground_shadow(buf, cam)
        draw_machine_outline(ov, cam, 44)
        draw_polylines(ov, cam, TUB, METAL, 1, 26)
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 1, 42)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 1, 32)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 72)
        add_dots(buf, cam, rotz(HOLES, th), CYAN, 1, 0.5, 0.85)
        a0 = clamp01((t - 0.7) / 1.4)
        labels.append(("HOW IT WORKS", "title", a0))
        labels.append(("THE WASHING MACHINE", "sub", clamp01((t - 1.7) / 1.2)))

    elif idx == 1:
        cam = cam_book(u, -0.62, 0.75, 2.2, 0.11 + 0.05 * u, (0, 0.03, 0.02), 1.02)
        add_ground_shadow(buf, cam)
        draw_machine_outline(ov, cam, 26)
        draw_polylines(ov, cam, TUB, METAL, 2, 72)
        th = 0.35 * t
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 2, 82)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 1, 50)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 85)
        draw_polylines(ov, cam, rotate_polys(SPIDER, th), AMBER, 2, 95)
        add_dots(buf, cam, rotz(HOLES, th), CYAN, 1, 0.5, 0.85)
        labels.append(("THE INNER DRUM", "label:l", clamp01((t - 0.6) / 0.8),
                       (DR * 0.75, DRUM_CY + DR * 0.55, 0.06)))
        labels.append(("HOLDS THE LAUNDRY", "note:l", clamp01((t - 1.1) / 0.8)))
        labels.append(("THE OUTER TUB", "label:r", clamp01((t - 2.1) / 0.8),
                       (0.274, DRUM_CY - 0.19, -0.15)))
        labels.append(("CATCHES EVERY DROP OF WATER", "note:r", clamp01((t - 2.6) / 0.8)))

    elif idx == 2:
        cam = cam_book(u, -0.18, 0.55, 2.35, 0.13, (0, 0.06, -0.03), 1.05)
        add_ground_shadow(buf, cam)
        level = 0.115 * ease(clamp01(u * 1.15))
        draw_machine_outline(ov, cam, 24)
        draw_polylines(ov, cam, TUB, METAL, 1, 40)
        th = 0.18 * t
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 1, 52)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 1, 30)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 62)
        draw_polylines(ov, cam, [INLET], AMBER, 2, 90)
        r, a_, z = scatter_cyl(950, DR * 0.99, (Z0 + 0.02, Z1 - 0.03), 7)
        ycol = np.sqrt(np.clip(1 - (r / DR) ** 2, 0, 1))
        y = np.minimum(ycol * level * 1.9, level * 0.95)
        y += 0.006 * np.sin(t * 20 + z * 30)
        wob = 0.010 * np.cos(2 * math.pi * 1.1 * t + z * 9 + r * 4)
        keep = y < (level * 0.95 + wob)
        xw, yw = ang_components(r, a_ + 0.22 * t)
        wpos = np.stack([xw, DRUM_CY + np.minimum(y, level * 0.95) - level * 0.45, z], 1)
        nearsurf = np.minimum(y, level) > level * 0.62
        add_dots(buf, cam, wpos[keep], WATER, 1, 0.55, 0.75)
        add_dots(buf, cam, wpos[keep & nearsurf], WATER_HI, 1, 0.85, 0.6)
        n_s = 300
        sp = (np.arange(n_s) / n_s + 2.6 * t) % 1.0
        pfal = 0.26 - 2.4 * sp ** 2 * 0.26
        jx = 0.012 * np.sin(np.arange(n_s) * 12.9898 + t * 2)
        jz = -0.18 + 0.035 * sp + 0.01 * np.cos(np.arange(n_s) * 78.233 + t)
        sy0 = 0.30 + pfal
        stream = np.stack([jx, DRUM_CY + sy0 - level * 0.45, jz], 1)
        inair = stream[:, 1] > (DRUM_CY - level + 0.03)
        add_dots(buf, cam, stream[inair], WATER_HI, 2, 1.25, 0.45)
        add_dots(buf, cam, stream[inair] + np.random.uniform(-0.005, 0.005, (int(inair.sum()), 3)), WATER, 1, 0.7, 0.55)
        labels.append(("THE INLET VALVE", "label:l", clamp01((t - 0.5) / 0.8),
                       (0.0, 0.45, -0.29)))
        labels.append(("WATER MIXES WITH DETERGENT", "note:l", clamp01((t - 1.2) / 0.8)))

    elif idx == 3:
        cam = cam_book(u, 0.28 + 0.5 * u, 0.7, 2.1, 0.11 + 0.03 * math.sin(u * 2 * math.pi), (0, 0.0, 0), 1.08)
        add_ground_shadow(buf, cam)
        th = 0.62 * math.sin(2 * math.pi * 0.8 * t)
        draw_machine_outline(ov, cam, 22)
        draw_polylines(ov, cam, TUB, METAL, 1, 34)
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 1, 55)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 1, 36)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 92)
        level = 0.115
        r, a_, z = scatter_cyl(850, DR * 0.97, (Z0 + 0.02, Z1 - 0.04), 11)
        y = np.minimum(np.sqrt(np.clip(1 - (r / (DR * 2.1)) ** 2, 0, 1)) * level * 1.45, level * 0.95)
        y += 0.007 * np.sin(t * 16 + z * 24)
        slosh = 0.02 * th
        xs, ys = ang_components(r, a_ - 0.8 * th)
        keep = y < (level * 0.95 + slosh)
        wpos = np.stack([xs, DRUM_CY - level + y + slosh * 0.5, z], 1)
        add_dots(buf, cam, wpos[keep], WATER, 1, 0.55, 0.75)
        add_dots(buf, cam, wpos[keep & (y > level * 0.66)], WATER_HI, 1, 0.9, 0.6)
        base, ci, npc = cloth_field()
        sway = 0.42 * th + 0.12 * np.sin(t * 1.4 + ci * 2.4)
        cs, sn = np.cos(sway), np.sin(sway)
        cloth = np.stack([cs * base[:, 0] - sn * base[:, 1],
                          sn * base[:, 0] + cs * base[:, 1], base[:, 2]], 1)
        cloth[:, 2] += 0.010 * np.sin(t * 3.1 + ci)
        add_dots(buf, cam, cloth, CLOTH, 2, 1.5, 0.8, jitter=1.1)
        add_dots(buf, cam, cloth + np.random.normal(0, 0.010, (npc, 3)), CLOTH_HI, 1, 0.8, 0.9)
        nb = 70
        bi = (np.arange(nb) * 1.3 + 1.4 * t) % 1.0
        br = DR * 0.85 * np.sqrt(((np.arange(nb) * 0.618) % 1.0))
        ba = (np.arange(nb) * 2.399 + 0.5 * t) % (2 * math.pi)
        bx, by = ang_components(br, ba)
        bpts = np.stack([bx, DRUM_CY - level * 0.8 + level * 1.5 * bi, Z0 + 0.03 + 0.17 * ((np.arange(nb) * 0.7717) % 1.0)], 1)
        add_dots(buf, cam, bpts, (195, 235, 255), 1, 0.35 + 0.45 * np.abs(np.sin(t * 7 + np.arange(nb))), 0.5, jitter=0.8)
        labels.append(("THE WASH CYCLE", "label:l", clamp01((t - 0.5) / 0.8),
                       (DR * 0.9, DRUM_CY + DR * 0.4, 0.08)))
        labels.append(("TUMBLE + DETERGENT LIFTS THE DIRT", "note:l", clamp01((t - 1.1) / 0.8)))

    elif idx == 4:
        cam = cam_book(u, -0.08 + 0.3 * u, 0.5, 2.4, 0.14, (0, -0.05, 0.06), 1.02)
        add_ground_shadow(buf, cam)
        drain_u = clamp01(u / 0.55)
        level = 0.115 * (1 - ease(drain_u)) + 0.085 * ease(clamp01((u - 0.60) / 0.3))
        draw_machine_outline(ov, cam, 24)
        draw_polylines(ov, cam, rotate_polys(RINGS, 0.12 * t), CYAN, 1, 48)
        draw_polylines(ov, cam, rotate_polys(LONGS, 0.12 * t), CYAN, 1, 30)
        draw_polylines(ov, cam, rotate_polys(VANES, 0.12 * t), WHITE, 2, 66)
        draw_polylines(ov, cam, [DRAIN_HOSE], AMBER, 2, 95)
        r, a_, z = scatter_cyl(900, DR * 0.99, (Z0 + 0.02, Z1 - 0.03), 21)
        y = np.minimum(np.sqrt(np.clip(1 - (r / DR) ** 2, 0, 1)) * level * 1.15, level)
        vortex = (0.4 + 2.8 * drain_u) * t
        xs, ys = ang_components(r, a_ + vortex * (0.35 + 0.65 * drain_u))
        keep = y < level * 0.98
        wpos = np.stack([xs, DRUM_CY - level + y, z], 1)
        add_dots(buf, cam, wpos[keep], WATER, 1, 0.55, 0.75)
        n_s = 170
        sp = (np.arange(n_s) / n_s + 2.2 * t) % 1.0
        p0 = np.array([0.05, -0.40, -0.05])
        p1 = np.array([0.55, -0.60, 0.22])
        path = p0[None, :] * (1 - sp[:, None]) + p1[None, :] * sp[:, None]
        path[:, 1] -= 0.4 * sp ** 2
        path[:, 0] += 0.010 * np.sin(np.arange(n_s) * 9.7 + t * 22)
        add_dots(buf, cam, path, WATER_HI, 2, 1.15, 0.35)
        if level > 0.015 and u > 0.58:
            rin_a = ease(clamp01((u - 0.60) / 0.22))
            n_r = 220
            sr = (np.arange(n_r) / n_r + 2.6 * t) % 1.0
            pfal = 0.26 - 2.4 * sr ** 2 * 0.26
            stream_r = np.stack([0.010 * np.sin(np.arange(n_r) * 12.9898 + t * 2),
                                 DRUM_CY + 0.28 + pfal - level * 0.35,
                                 Z1 - 0.28 + 0.03 * sr], 1)
            inair = stream_r[:, 1] > (DRUM_CY - level + 0.02)
            add_dots(buf, cam, stream_r[inair], WATER_HI, 2, 1.1 * rin_a, 0.45)
        labels.append(("DRAIN PUMP", "label:l", clamp01((t - 0.4) / 0.8),
                       (0.12, -0.40, 0.0)))
        labels.append(("DIRTY WATER OUT", "note:l", clamp01((t - 1.0) / 0.8)))
        labels.append(("RINSE CYCLE", "label:r", clamp01((L * 0.75 - t) / 0.8),
                       (0.0, 0.42, -0.24)))
        labels.append(("FRESH WATER IN", "note:r", clamp01((L * 0.75 - t) / 0.8)))

    elif idx == 5:
        prog_o = ease(clamp01(u * 1.25))
        spin_t = 2 * math.pi * 13.0 * (u ** 2.6)
        shake = 0.007 * prog_o
        base_t = (0, 0.0, 0)
        cam = cam_book(u, 0.12, 0.32, 2.3 - 0.15 * prog_o, 0.10, base_t, 1.0 + 0.10 * prog_o)
        cam.eye = cam.eye + np.array([shake * math.sin(t * 71), shake * math.sin(t * 53 + 1.0), shake * math.sin(t * 65 + 2.0)])
        cam.__init__(cam.eye, cam.target, 1.0 + 0.10 * prog_o)
        add_ground_shadow(buf, cam)
        draw_machine_outline(ov, cam, 22)
        draw_polylines(ov, cam, TUB, METAL, 1, 26)
        th = spin_t
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 2, 85)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 2, 62)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 95)
        n = 650
        rng = np.random.default_rng(23)
        delay = rng.random(n)
        wp = clamp01((u - 0.10 - 0.55 * delay) / 0.45)
        pr = rng.random(n)
        rnow = 0.05 + (0.34 - 0.05) * ease(wp)
        anow = (rng.random(n)) * 2 * math.pi + spin_t * 2.2 * clamp01(wp)
        z = rng.random(n) * (Z1 - Z0) + Z0
        x, y = ang_components(rnow, anow)
        yoff = -0.02 * (1 - wp)
        pl = np.stack([x, DRUM_CY + yoff + y, z], 1)
        inside = rnow < DR
        add_dots(buf, cam, pl[inside], WATER, 1, 0.7, 0.6)
        add_dots(buf, cam, pl[~inside], WATER_HI, 2, 1.25, 0.35, jitter=0.8)
        base, ci, npc = cloth_field(r_frac=0.82)
        cloth = rotz(base, spin_t)
        add_dots(buf, cam, cloth, CLOTH, 2, 1.35, 0.75, jitter=0.7)
        add_dots(buf, cam, cloth + np.random.normal(0, 0.008, (npc, 3)), CLOTH_HI, 1, 0.7, 0.9)
        nl = 40
        la = (np.arange(nl) * 2.399963 + 0.18 * t) % (2 * math.pi)
        lr = DR + 0.035 + 0.11 * ((np.arange(nl) * 0.618) % 1.0)
        x0, y0 = ang_components(lr, la)
        x1, y1 = ang_components(lr * 1.3 + 0.05, la)
        s_lines = [np.array([[x0[k], DRUM_CY - 0.03 + y0[k], Z1 - 0.06],
                             [x1[k], DRUM_CY - 0.03 + y1[k], Z1 - 0.06]]) for k in range(nl)]
        draw_polylines(ov, cam, s_lines, CYAN, 1, int(60 * prog_o))
        labels.append(("THE SPIN CYCLE", "label:l", clamp01((t - 1.0) / 0.8),
                       (DR * 1.0, DRUM_CY + DR * 0.45, 0.05)))
        labels.append(("WATER FLIES OUT THROUGH THE HOLES", "note:l", clamp01((t - 1.6) / 0.8)))
        labels.append(("> 1000 RPM", "tech:tr", clamp01((t - 2.0) / 0.8)))

    else:
        push = ease(clamp01(u * 1.4))
        cam = cam_book(u, -0.32, 0.6, 3.2 - 0.5 * push, 0.13 + 0.02 * math.sin(u * 2.4), (0, 0.0, -0.01), 0.94)
        th = 0.25 * t
        add_ground_shadow(buf, cam)
        draw_machine_outline(ov, cam, 42)
        draw_polylines(ov, cam, TUB, METAL, 1, 24)
        draw_polylines(ov, cam, rotate_polys(RINGS, th), CYAN, 1, 40)
        draw_polylines(ov, cam, rotate_polys(LONGS, th), CYAN, 1, 30)
        draw_polylines(ov, cam, rotate_polys(VANES, th), WHITE, 2, 70)
        ns = 140
        si = (np.arange(ns) * 0.618033 + 0.04 * t) % 1.0
        sa = (np.arange(ns) * 2.399963 + 0.12 * t) % (2 * math.pi)
        sr = DR * 0.55 * si
        sx, sy = ang_components(sr, sa)
        tw = 0.35 + 0.65 * np.abs(np.sin(t * 5 + si * 40))
        spark = np.stack([sx, DRUM_CY + (-0.12 + 0.26 * si), Z0 + 0.02 + 0.40 * ((np.arange(ns) * 0.7717) % 1.0)], 1)
        add_dots(buf, cam, spark, CYAN, 1, 0.6 * tw, 0.85, jitter=1.4)
        labels.append(("PERFECTLY CLEAN", "title", clamp01((t - 0.8) / 1.3)))
        labels.append(("THE HIDDEN ENGINEERING OF LAUNDRY DAY", "sub", clamp01((t - 1.7) / 1.1)))
        labels.append(("MADE WITH CODE  ·  VOICE BY DEEPGRAM", "tech:tr", clamp01((t - 2.4) / 1.0)))

    composite_add(buf, ov)
    ov = new_overlay()
    draw_labels(ov, cam, labels, t)
    composite_add(buf, ov)

    im = Image.fromarray(np.clip(buf, 0, 255).astype(np.uint8))
    if idx != 0 and t < 0.28:
        ffac = t / 0.28
        im = Image.blend(im, Image.new("RGB", (W, H), (0, 0, 0)), 1 - ffac)
    if L - t < 0.22 and L - t >= 0:
        ffac = (L - t) / 0.22
        im = Image.blend(im, Image.new("RGB", (W, H), (0, 0, 0)), 1 - ffac)
    return im


def composite_add(buf, overlay):
    a = np.asarray(overlay.getchannel("A"), float)[:, :, None] / 255.0
    buf += np.asarray(overlay.convert("RGB"), float) * a


def draw_labels(ov, cam, labels, t):
    d = ImageDraw.Draw(ov)
    for lab in labels:
        text, pos, alpha = lab[0], lab[1], lab[2]
        anchor3d = lab[3] if len(lab) > 3 else None
        a = int(clamp01(alpha) * 255)
        if a <= 0 or not text:
            continue
        if pos == "title":
            draw_text(ov, (W / 2, H * 0.33), text, font(FONT_TITLE, 170), (238, 244, 248), a, "mm")
            wt = d.textlength(text, font=font(FONT_TITLE, 170))
            d.rectangle([W / 2 - wt / 2 * clamp01(alpha * 1.6), H * 0.33 + 96,
                         W / 2 + wt / 2 * clamp01(alpha * 1.6), H * 0.33 + 100], fill=(64, 224, 230, a))
        elif pos == "sub":
            draw_text(ov, (W / 2, H * 0.33 + 132), text, font(FONT_TECH, 28), (150, 196, 212), int(a * 0.92), "mm", spacing=6)
        elif pos == "label:l" or pos == "label:r":
            lx = W * 0.115 if pos.endswith("l") else W * 0.685
            ly = H * 0.70 if pos.endswith("l") else H * 0.70
            f = font(FONT_TITLE, 76)
            d.text((lx, ly), text, font=f, fill=(238, 244, 248, a), anchor="lm")
            d.line([(lx, ly + 48), (lx + d.textlength(text, font=f), ly + 48)], fill=(64, 224, 230, a), width=3)
            if anchor3d is not None:
                xy, z, valid = cam.project(np.array(anchor3d))
                if valid[0]:
                    am = int(a * 0.65)
                    d.line([(lx - 12, ly - 6), (xy[0, 0] * 0.1 + (lx - 12) * 0.9, (xy[0, 1] + ly) / 2)], fill=(64, 224, 230, am), width=2)
                    d.line([((xy[0, 0] * 0.1 + (lx - 12) * 0.9), (xy[0, 1] + ly) / 2), (xy[0, 0], xy[0, 1])], fill=(64, 224, 230, am), width=2)
                    d.ellipse([xy[0, 0] - 6, xy[0, 1] - 6, xy[0, 0] + 6, xy[0, 1] + 6], outline=(64, 224, 230, a), width=2)
        elif pos == "note:l" or pos == "note:r":
            lx = W * 0.115 if pos.endswith("l") else W * 0.685
            draw_text(ov, (lx, H * 0.70 + 62), text, font(FONT_LABEL, 30), (168, 202, 218), int(a * 0.85), "lm", spacing=2)
        elif pos == "tech:tr":
            f = font(FONT_TECH, 26)
            d.text((W * 0.5, H * 0.565), text, font=f, fill=(140, 185, 200, int(a * 0.8)), anchor="mm", spacing=5)
        elif pos == "tech":
            f = font(FONT_TECH, 26)
            d.text((W * 0.5, H * 0.80), text, font=f, fill=(140, 185, 200, int(a * 0.75)), anchor="mm", spacing=8)
