#!/usr/bin/env python3
"""Original, deterministic synthesis; no samples, recordings, or external audio.
Generated WAVs are dedicated to CC0-1.0; see assets/audio/se/README.md.
Run with Python 3 (standard library only). Never runs in the app.
"""
import math
from pathlib import Path
import random
import struct
import wave

RATE = 44100
ROOT = Path(__file__).resolve().parents[1] / 'assets/audio/se'


def render(name, duration, voices=(), rustle=0.0, peak=0.30):
    rng = random.Random(20260914)
    samples = []
    filtered = 0.0
    for i in range(round(duration * RATE)):
        t = i / RATE
        filtered = 0.82 * filtered + 0.18 * rng.uniform(-1, 1)
        # Soft attack and short band-limited paper noise, with no sharp digital click.
        value = rustle * filtered * (1 - math.exp(-t / 0.008)) * math.exp(-t / 0.035)
        for offset, frequency, decay, level in voices:
            u = t - offset
            if u >= 0:
                envelope = (1 - math.exp(-u / 0.007)) * math.exp(-u / decay)
                value += level * envelope * (math.sin(2 * math.pi * frequency * u)
                    + 0.14 * math.sin(2 * math.pi * frequency * 2.76 * u)
                    + 0.035 * math.sin(2 * math.pi * frequency * 4.12 * u))
        value *= min(1.0, (duration - t) / 0.04)
        samples.append(value)
    gain = peak / max(abs(x) for x in samples)
    with wave.open(str(ROOT / (name + '.wav')), 'wb') as output:
        output.setparams((1, 2, RATE, len(samples), 'NONE', 'not compressed'))
        output.writeframes(b''.join(struct.pack('<h', round(x * gain * 32767)) for x in samples))


if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    render('card-place', .19, [(0, 430, .024, 1), (0, 710, .015, .2)], rustle=.22, peak=.28)
    render('card-remove', .14, rustle=1, peak=.20)
    render('reset', .28, [(0, 390, .026, .6), (.055, 310, .025, .4)], rustle=.5, peak=.25)
    render('confirm', .60, [(0, 740, .11, 1), (.055, 1110, .12, .18)], peak=.30)
    render('result', 1.10, [(0, 587.33, .23, 1), (.09, 880, .24, .30)], peak=.28)
    render('perfect', 1.50, [(0, 587.33, .27, 1), (.12, 880, .28, .45), (.24, 1174.66, .26, .23)], peak=.32)
    render('button', .09, [(0, 510, .012, 1)], rustle=.08, peak=.18)
    print('Generated 7 original mono PCM WAVs (44.1 kHz, 16 bit).')
