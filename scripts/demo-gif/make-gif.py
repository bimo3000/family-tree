"""Turns the frames recorded by demo.spec.ts into the README demo GIF (`npm run demo-gif`).

Needs Python 3 with Pillow (`pip install pillow`, or `sudo apt install python3-pil`).
"""

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / "test-results" / "demo-frames"
OUT = ROOT / "docs" / "assets" / "demo.gif"
# About 15 frames per second: smooth enough for a mouse pointer, and browsers slow down
# GIF frames shorter than 20 ms anyway.
MIN_FRAME_MS = 66

durations = json.loads((FRAMES / "durations.json").read_text())
paths = sorted(FRAMES.glob("*.png"))
assert len(paths) == len(durations), "frames and durations.json do not match"

# Keep a frame only after MIN_FRAME_MS have passed; it lasts until the next kept one.
# A frame identical to the one before just makes that one last longer.
frames: list[Image.Image] = []
times: list[int] = []
for path, ms in zip(paths, durations):
    image = Image.open(path).convert("RGB")
    if frames and (times[-1] < MIN_FRAME_MS or image.tobytes() == frames[-1].tobytes()):
        times[-1] += ms
        continue
    frames.append(image)
    times.append(ms)

# One palette for all frames (taken from a sample), so colours don't flicker between frames.
# No dithering: the flat UI colours stay clean and compress well.
sample = frames[:: max(1, len(frames) // 12)]
w, h = frames[0].size
mosaic = Image.new("RGB", (w, h * len(sample)))
for i, image in enumerate(sample):
    mosaic.paste(image, (0, h * i))
palette = mosaic.quantize(256, method=Image.Quantize.MEDIANCUT)
indexed = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]

OUT.parent.mkdir(parents=True, exist_ok=True)
indexed[0].save(
    OUT,
    save_all=True,
    append_images=indexed[1:],
    duration=times,
    loop=0,
    optimize=True,
)
size = OUT.stat().st_size / 1e6
print(f"{OUT.relative_to(ROOT)}: {len(indexed)} frames, {sum(times) / 1000:.1f} s, {w}×{h}, {size:.1f} MB")
