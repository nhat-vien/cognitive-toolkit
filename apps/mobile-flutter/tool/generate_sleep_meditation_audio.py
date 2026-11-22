"""Generate a seamless looping ambient WAV file combining:
1. Gentle forest brook / flowing stream (filtered pink/brown noise with organic trickle modulation)
2. Warm 432Hz harmonic drone (432Hz + 216Hz sub-octave + subtle 648Hz fifth with slow breathing LFO)

Outputs: apps/mobile-flutter/assets/audio/brook_432hz_loop.wav
16-bit PCM mono, 22050 Hz, 16 seconds (~705 KB), crossfaded for click-free looping.
"""

import math
import os
import random
import struct
import wave


def generate_brook_432hz_wav(output_path: str, duration_sec: float = 16.0, sample_rate: int = 22050) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    rng = random.Random(432)

    crossfade_sec = 2.0
    total_sec = duration_sec + crossfade_sec
    total_samples = int(total_sec * sample_rate)
    out_samples = int(duration_sec * sample_rate)
    xfade_samples = int(crossfade_sec * sample_rate)

    # Filter state variables for realistic water/brook texture
    lp1 = 0.0
    lp2 = 0.0
    lp_trickle = 0.0
    hp_prev = 0.0
    hp_in_prev = 0.0

    # Pre-generate raw samples (brook + 432Hz harmonic pad)
    raw = [0.0] * total_samples

    # Exact integer cycles over duration_sec so 432Hz pad loops phase-continuously
    # 432 * 16 = 6912 cycles (exact integer!)
    # 216 * 16 = 3456 cycles (exact integer!)
    # 648 * 16 = 10368 cycles (exact integer!)
    # Breathing LFO: 2 cycles over 16s = 0.125 Hz (8-second breath cycle)
    two_pi = 2.0 * math.pi

    for i in range(total_samples):
        t = i / sample_rate

        # 1. Forest Brook (brown/pink noise shaped into gentle flowing water + soft trickles)
        white = rng.uniform(-1.0, 1.0)
        # Soft lowpass to remove harsh hiss (cutoff ~1600Hz)
        lp1 = lp1 + 0.28 * (white - lp1)
        # Second gentle layer for deeper water flow (~450Hz)
        lp2 = lp2 + 0.09 * (lp1 - lp2)
        # Bandpass-like trickle component (difference between lp1 and lp2)
        band = lp1 - lp2

        # Organic water ripple modulation (slow overlapping waves)
        ripple1 = 0.65 + 0.35 * math.sin(two_pi * 0.25 * t + 0.4 * math.sin(two_pi * 0.125 * t))
        ripple2 = 0.70 + 0.30 * math.sin(two_pi * 0.375 * t + 1.3)
        trickle_mod = 0.5 + 0.5 * math.sin(two_pi * 0.625 * t + 0.8 * math.cos(two_pi * 0.1875 * t))

        # Highpass gentle cleanup to prevent DC rumble
        brook_raw = (lp2 * 0.55 * ripple1) + (band * 0.60 * ripple2) + (band * 0.25 * trickle_mod)
        hp_out = 0.995 * (hp_prev + brook_raw - hp_in_prev)
        hp_prev = hp_out
        hp_in_prev = brook_raw

        # Smooth soft trickle shimmer
        lp_trickle = lp_trickle + 0.35 * (hp_out - lp_trickle)
        brook = lp_trickle * 0.42

        # 2. Warm 432Hz Harmonic Soundscape
        breath_lfo = 0.78 + 0.22 * math.sin(two_pi * (2.0 / duration_sec) * t)
        shimmer_lfo = 0.85 + 0.15 * math.sin(two_pi * (3.0 / duration_sec) * t + 1.0)

        tone_216 = math.sin(two_pi * 216.0 * t) * 0.10 * breath_lfo
        tone_432 = math.sin(two_pi * 432.0 * t) * 0.14 * breath_lfo
        tone_648 = math.sin(two_pi * 648.0 * t) * 0.03 * shimmer_lfo

        harmonic_432 = tone_216 + tone_432 + tone_648

        raw[i] = brook + harmonic_432

    # Seamless crossfade: blend tail [out_samples : out_samples + xfade_samples] into head [0 : xfade_samples]
    final_pcm = bytearray()
    for i in range(out_samples):
        if i < xfade_samples:
            alpha = i / xfade_samples  # 0 -> 1
            # Equal-power crossfade
            w_head = math.sin(alpha * math.pi * 0.5)
            w_tail = math.cos(alpha * math.pi * 0.5)
            sample = raw[i] * w_head + raw[out_samples + i] * w_tail
        else:
            sample = raw[i]

        # Soft limiter
        sample = max(-0.92, min(0.92, sample))
        int_val = int(sample * 32767.0)
        final_pcm.extend(struct.pack('<h', int_val))

    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(final_pcm))

    size_kb = os.path.getsize(output_path) / 1024.0
    print(f"Generated {output_path} ({size_kb:.1f} KB, {duration_sec}s seamless loop @ {sample_rate}Hz)")


if __name__ == '__main__':
    target = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'assets',
        'audio',
        'brook_432hz_loop.wav',
    )
    generate_brook_432hz_wav(target)
