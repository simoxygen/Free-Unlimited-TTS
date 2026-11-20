import json, os, sys
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))


def load_timeline():
    with open(os.path.join(BASE, "scenes.json")) as f:
        scenes = json.load(f)["scenes"]
    with open(os.path.join(BASE, "audio", "durations.json")) as f:
        durs = json.load(f)
    lead = [1.2, 0.8, 0.8, 0.8, 0.8, 0.9, 0.8]
    tail = [1.0, 1.3, 1.3, 1.3, 1.3, 1.6, 2.2]
    timeline, t0 = [], 0.0
    for i, sc in enumerate(scenes):
        d = durs[sc["id"]]["duration"]
        L = lead[i] + d + tail[i]
        timeline.append({"idx": i, "id": sc["id"], "start": t0, "len": L,
                         "audio_dur": d, "audio": durs[sc["id"]]["audio"],
                         "narration_at": t0 + lead[i]})
        t0 += L
    total = t0 + 0.4
    return timeline, total


SR = 44100


def read_wav(path):
    import wave
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(float) / 32768.0
        if w.getnchannels() == 2:
            data = data.reshape(-1, 2).mean(1)
    return data


def write_wav(path, data, sr=SR):
    import wave
    x = np.clip(data, -1, 1)
    pcm = (x * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def adsr(n, a, r):
    env = np.ones(n)
    an, rn = int(a * SR), int(r * SR)
    if an > 0:
        env[:an] = np.linspace(0, 1, an)
    if rn > 0:
        env[-rn:] *= np.linspace(1, 0, rn)
    return env


def music_bed(total, spin_start, riser_start, n):
    t = np.arange(n) / SR
    out = np.zeros(n)

    drone = 0.16 * np.sin(2 * np.pi * 55 * t) + 0.10 * np.sin(2 * np.pi * 55.4 * t) + 0.05 * np.sin(2 * np.pi * 110.3 * t)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.05 * t)
    out += drone * lfo

    chords = [
        (110.0, 130.81, 164.81),
        (87.31, 110.0, 130.81),
        (98.0, 123.47, 146.83),
        (110.0, 130.81, 164.81),
        (98.0, 116.54, 146.83),
        (87.31, 110.0, 146.83),
        (110.0, 130.81, 164.81),
    ]
    seg = 12.0
    nseg = int(np.ceil(total / seg))
    for s in range(nseg):
        f = chords[s % len(chords)]
        i0, i1 = int(s * seg * SR), min(int((s + 1) * seg * SR), len(t))
        tt = t[i0:i1]
        env = adsr(i1 - i0, seg * 0.35, seg * 0.45)
        pad = np.zeros(i1 - i0)
        for k, freq in enumerate(f):
            for h, amp in ((1, 1.0), (2, 0.35), (3, 0.15)):
                det = 1 + (k - 1) * 0.0012
                pad += amp * np.sin(2 * np.pi * freq * h * det * tt + k * 0.7)
        out[i0:i1] += 0.030 * pad * env

    th = t % 2.4
    beat_env = np.exp(-th * 6.0)
    out += 0.10 * beat_env * np.sin(2 * np.pi * 44 * np.minimum(t, th + 1e-9))

    riser = np.zeros_like(t)
    rm = (t >= riser_start) & (t <= spin_start)
    rt = (t[rm] - riser_start) / max(spin_start - riser_start, 1e-6)
    f_sweep = 160 + 640 * rt ** 2
    riser[rm] = 0.05 * rt ** 2.5 * np.sin(2 * np.pi * np.cumsum(f_sweep) / SR)
    out += riser
    out[rm] += 0.030 * rt ** 3 * np.random.default_rng(3).normal(0, 1, rm.sum())

    boom_t = np.arange(int(2.5 * SR)) / SR
    boom = 0.5 * np.exp(-boom_t * 2.2) * np.sin(2 * np.pi * (36 + 24 * np.exp(-boom_t * 8)) * boom_t)
    i0 = int(spin_start * SR)
    i1 = min(i0 + len(boom), len(out))
    out[i0:i1] += boom[: i1 - i0]

    return out


def build_mix():
    timeline, total = load_timeline()
    n = int((total + 0.5) * SR)
    mix = np.zeros(n)
    duck = np.zeros(n)
    for sc in timeline:
        narr = read_wav(sc["audio"])
        i0 = int(sc["narration_at"] * SR)
        i1 = min(i0 + len(narr), n)
        mix[i0:i1] += 0.92 * narr[: i1 - i0]
        duck[i0:i1] = 1.0
    spin = next(sc for sc in timeline if sc["id"] == "s6_spin")
    riser_start = spin["start"] + spin["len"] * 0.30
    music = music_bed(total, spin["start"] + spin["len"] * 0.42, riser_start, n)
    kernel = int(0.15 * SR)
    pad = np.convolve(duck, np.ones(kernel) / kernel, mode="same")
    gain = 1.0 - 0.45 * np.clip(pad * 8, 0, 1)
    out = mix + music * gain
    endfade = int(1.6 * SR)
    out[-endfade:] *= np.linspace(1, 0, endfade)
    out[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.88
    write_wav(os.path.join(BASE, "audio", "mix.wav"), out)
    return timeline, total


if __name__ == "__main__":
    timeline, total = build_mix()
    print(f"total duration: {total:.2f}s  mix: {os.path.getsize(os.path.join(BASE, 'audio', 'mix.wav')) // 1024}KB")
    for sc in timeline:
        print(f"  {sc['id']}: start={sc['start']:.2f} len={sc['len']:.2f}")
