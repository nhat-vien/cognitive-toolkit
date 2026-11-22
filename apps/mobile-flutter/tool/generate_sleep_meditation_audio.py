"""Generate a seamless looping ambient WAV file of a gentle, warm forest brook:
Tiếng suối chảy róc rách giữa rừng tĩnh lặng (ZERO 432Hz tone).

Outputs:
  - apps/mobile-flutter/assets/audio/brook_432hz_loop.wav (kept filename for asset compatibility)
  - apps/web-nextjs/public/audio/meditation/brook_loop.wav
16-bit PCM mono, 22050 Hz, 16 seconds (~689 KB), crossfaded for click-free looping.
"""

import math
import os
import random
import shutil
import struct
import wave


def generate_forest_brook_wav(output_path: str, duration_sec: float = 16.0, sample_rate: int = 22050) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    rng = random.Random(2026)

    crossfade_sec = 2.0
    total_sec = duration_sec + crossfade_sec
    total_samples = int(total_sec * sample_rate)
    out_samples = int(duration_sec * sample_rate)
    xfade_samples = int(crossfade_sec * sample_rate)

    lp1 = 0.0
    lp2 = 0.0
    lp_trickle = 0.0
    hp_prev = 0.0
    hp_in_prev = 0.0

    raw = [0.0] * total_samples
    two_pi = 2.0 * math.pi

    for i in range(total_samples):
        t = i / sample_rate

        # Pure Forest Brook (warm flowing water + gentle organic trickles, zero tonal buzz)
        white = rng.uniform(-1.0, 1.0)
        lp1 = lp1 + 0.26 * (white - lp1)
        lp2 = lp2 + 0.085 * (lp1 - lp2)
        band = lp1 - lp2

        ripple1 = 0.65 + 0.35 * math.sin(two_pi * 0.25 * t + 0.4 * math.sin(two_pi * 0.125 * t))
        ripple2 = 0.70 + 0.30 * math.sin(two_pi * 0.375 * t + 1.3)
        trickle_mod = 0.5 + 0.5 * math.sin(two_pi * 0.625 * t + 0.8 * math.cos(two_pi * 0.1875 * t))

        brook_raw = (lp2 * 0.58 * ripple1) + (band * 0.58 * ripple2) + (band * 0.24 * trickle_mod)
        hp_out = 0.995 * (hp_prev + brook_raw - hp_in_prev)
        hp_prev = hp_out
        hp_in_prev = brook_raw

        lp_trickle = lp_trickle + 0.28 * (hp_out - lp_trickle)
        raw[i] = lp_trickle * 0.72

    final_pcm = bytearray()
    for i in range(out_samples):
        if i < xfade_samples:
            alpha = i / xfade_samples
            w_head = math.sin(alpha * math.pi * 0.5)
            w_tail = math.cos(alpha * math.pi * 0.5)
            sample = raw[i] * w_head + raw[out_samples + i] * w_tail
        else:
            sample = raw[i]

        sample = max(-0.92, min(0.92, sample))
        int_val = int(sample * 32767.0)
        final_pcm.extend(struct.pack('<h', int_val))

    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(final_pcm))

    size_kb = os.path.getsize(output_path) / 1024.0
    print(f"Generated {output_path} ({size_kb:.1f} KB, {duration_sec}s seamless pure brook loop @ {sample_rate}Hz)")


def generate_warm_432hz_wav(output_path: str, duration_sec: float = 16.0, sample_rate: int = 22050) -> None:
    """Generate a soft, warm 432Hz + 216Hz harmonic pad (no shrill overtone, seamless loop)."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    out_samples = int(duration_sec * sample_rate)
    two_pi = 2.0 * math.pi
    final_pcm = bytearray()

    for i in range(out_samples):
        t = i / sample_rate
        # Exact integer cycles over 16.0s -> 100% phase-continuous seamless loop
        breath_lfo = 0.82 + 0.18 * math.sin(two_pi * (2.0 / duration_sec) * t)
        tone_216 = math.sin(two_pi * 216.0 * t) * 0.14 * breath_lfo
        tone_432 = math.sin(two_pi * 432.0 * t) * 0.10 * breath_lfo
        sample = max(-0.90, min(0.90, tone_216 + tone_432))
        final_pcm.extend(struct.pack('<h', int(sample * 32767.0)))

    with wave.open(output_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(final_pcm))

    size_kb = os.path.getsize(output_path) / 1024.0
    print(f"Generated {output_path} ({size_kb:.1f} KB, {duration_sec}s seamless warm 432Hz loop @ {sample_rate}Hz)")


if __name__ == '__main__':
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    mobile_target = os.path.join(repo_root, 'apps', 'mobile-flutter', 'assets', 'audio', 'brook_432hz_loop.wav')
    mobile_432 = os.path.join(repo_root, 'apps', 'mobile-flutter', 'assets', 'audio', 'freq_432hz_loop.wav')
    web_target = os.path.join(repo_root, 'apps', 'web-nextjs', 'public', 'audio', 'meditation', 'brook_loop.wav')
    generate_forest_brook_wav(mobile_target)
    generate_warm_432hz_wav(mobile_432)
    os.makedirs(os.path.dirname(web_target), exist_ok=True)
    shutil.copy2(mobile_target, web_target)
    print(f"Copied pure brook loop to {web_target}")
