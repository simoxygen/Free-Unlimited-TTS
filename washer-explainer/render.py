import json, os, subprocess, sys, time
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

from engine import W, H, FPS, post_process
from scenes_render import render_scene
from audio_build import load_timeline, build_mix


def scene_at(t_global, timeline):
    for s in timeline:
        if t_global < s["start"] + s["len"]:
            return s
    return timeline[-1]


def render_frame(t_global, timeline, post=True):
    sc = scene_at(t_global, timeline)
    raw = render_scene(sc["idx"], t_global - sc["start"], sc["len"], sc["audio_dur"])
    if post:
        raw = post_process(raw, t_phase=t_global)
    return raw


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "video"
    timeline, total = load_timeline()

    if mode == "preview":
        for tt in [float(x) for x in sys.argv[2].split(",")]:
            sc = scene_at(tt, timeline)
            raw = render_frame(tt, timeline)
            out = os.path.join(BASE, "viz", f"prev_{tt:05.1f}_s{sc['idx']}.png")
            raw.save(out)
            print("saved", out)
        return

    if mode == "scene_preview":
        for idx in range(len(timeline)):
            sc = timeline[idx]
            raw = render_scene(idx, sc["len"] * 0.55, sc["len"], sc["audio_dur"])
            raw = post_process(raw, t_phase=sc["start"] + sc["len"] * 0.55)
            out = os.path.join(BASE, "viz", f"scene_{idx}.png")
            raw.save(out)
            print("saved", out)
        return

    if mode == "video":
        build_mix()
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        nframes = int((total + 0.4) * FPS)
        outpath = os.path.join(BASE, "washer_explainer.mp4")
        cmd = [ff, "-y", "-loglevel", "error",
               "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
               "-i", os.path.join(BASE, "audio", "mix.wav"),
               "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "192k", "-shortest",
               "-movflags", "+faststart", outpath]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        t_start = time.time()
        for i in range(nframes):
            t_global = i / FPS
            frame = render_frame(t_global, timeline)
            proc.stdin.write(frame.tobytes())
            if i % (FPS * 5) == 0:
                el = time.time() - t_start
                print(f"frame {i}/{nframes}  t={t_global:5.1f}s  elapsed={el:5.0f}s", flush=True)
        proc.stdin.close()
        proc.wait()
        print("encoded:", outpath, os.path.getsize(outpath) // 1024, "KB")


if __name__ == "__main__":
    main()
