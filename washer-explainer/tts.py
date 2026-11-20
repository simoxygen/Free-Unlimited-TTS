import json, os, sys, wave
import requests

BASE = os.path.dirname(os.path.abspath(__file__))
KEY = open(os.path.join(BASE, ".deepgram_key")).read().strip()

def synth(text, out_path, voices=("aura-2-orion-en", "aura-orion-en", "aura-asteria-en")):
    """Generate a WAV via Deepgram TTS. Tries voices in order until one works."""
    for model in voices:
        try:
            r = requests.post(
                "https://api.deepgram.com/v1/speak",
                params={"model": model, "encoding": "linear16", "sample_rate": "24000", "container": "wav"},
                headers={"Authorization": f"Token {KEY}", "Content-Type": "application/json"},
                json={"text": text},
                timeout=120,
            )
            if r.status_code == 200 and len(r.content) > 1000:
                with open(out_path, "wb") as f:
                    f.write(r.content)
                return model
            else:
                print(f"  [{model}] failed: {r.status_code} {r.text[:200]}")
        except Exception as e:
            print(f"  [{model}] error: {e}")
    return None

def wav_duration(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()

def main():
    with open(os.path.join(BASE, "scenes.json")) as f:
        cfg = json.load(f)

    result = {}
    for sc in cfg["scenes"]:
        out = os.path.join(BASE, "audio", f"{sc['id']}.wav")
        if os.path.exists(out) and os.path.getsize(out) > 1000:
            used = "cached"
        else:
            print(f"Synthesizing {sc['id']}...")
            used = synth(sc["narration"], out)
            if used is None:
                sys.exit(f"ALL voices failed for {sc['id']}")
        dur = wav_duration(out)
        result[sc["id"]] = {"audio": out, "duration": round(dur, 3), "voice": used}
        print(f"  {sc['id']}: {dur:.2f}s  voice={used}")

    with open(os.path.join(BASE, "audio", "durations.json"), "w") as f:
        json.dump(result, f, indent=2)
    print("done")

if __name__ == "__main__":
    main()
