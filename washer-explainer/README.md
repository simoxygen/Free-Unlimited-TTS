# How a Washing Machine Works — Code-Generated 3D Explainer

Fully code-generated cinematic explainer video, no editing software, no stock assets:

- **Visuals**: custom 3D renderer written from scratch in numpy + Pillow
  (perspective projection, depth fog, additive particle splatting, wireframe geometry,
  bloom, teal/orange grade, vignette, film grain, 2.39:1 letterbox)
- **Voice**: [Deepgram Aura TTS](https://deepgram.com) (`aura-2-orion-en`), one narration clip per scene
- **Music**: procedural cinematic score synthesized with numpy
  (sub drone, pad chords, heartbeat pulse, riser + sub-bass boom into the spin cycle, narration ducking)
- **Edit**: scene timeline is driven by the *actual duration of each narration clip*,
  frames piped straight into ffmpeg (libx264), then graded/re-encoded

## Output

`washer_explainer_final.mp4` — 81 s, 1920x1080, 24 fps, AAC audio.

## Scenes

1. **HOW IT WORKS** — slow dolly-in on the machine
2. **THE TWO DRUMS** — inner drum vs outer tub, callout labels with leader lines
3. **WATER INTAKE** — inlet valve opens, water stream + rising pool
4. **THE WASH CYCLE** — oscillating drum tumble, clothes, sloshing water, bubbles
5. **DRAIN AND RINSE** — vortex draining through the pump hose, then fresh rinse water
6. **THE SPIN CYCLE** — drum ramps to speed, clothes pinned to the wall, water jets through the holes
7. **PERFECTLY CLEAN** — outro title

## Usage

```bash
pip install numpy pillow imageio-ffmpeg requests

# 1) put your Deepgram API key in .deepgram_key
# 2) generate narration + measure durations
python3 tts.py

# 3) preview / full render
python3 render.py scene_preview          # one PNG per scene
python3 render.py preview 5.5,39.5       # arbitrary timestamps
python3 render.py video                  # renders washer_explainer.mp4 (~15 min)

# 4) final encode (tames film-grain bitrate)
ffmpeg -i washer_explainer.mp4 -vf hqdn3d=2.0:1.5:5:4 \
  -c:v libx264 -crf 27 -preset slow -c:a copy washer_explainer_final.mp4
```

## Files

| File | Purpose |
|---|---|
| `scenes.json` | narration script + scene metadata |
| `tts.py` | Deepgram TTS synthesis per scene |
| `engine.py` | camera, projection, particle splats, post FX |
| `scenes_render.py` | machine geometry + the 7 scene animations |
| `audio_build.py` | narration timeline + procedural score, outputs `audio/mix.wav` |
| `render.py` | frame loop, pipes raw frames into ffmpeg |

Keep `.deepgram_key` out of any repo — add it to `.gitignore`.
