"""Synthesize all 27 Vietnamese Guided Sleep Meditation cues using pnnbao97/VieNeu-TTS
with a warm low-register female preset voice (Kim Chi or Huyền Mi), slightly slowed
down for calm, unhurried sleep guidance.

Outputs compact audio files to both:
  - apps/web-nextjs/public/audio/meditation/{cue_id}.wav (or .mp3 if ffmpeg available)
  - apps/mobile-flutter/assets/audio/meditation/{cue_id}.wav (or .mp3 if ffmpeg available)
"""

import os
import shutil
import subprocess
import sys
import wave
import numpy as np

# Exact 27 cues of Kịch bản 1: THIỀN BUÔNG THƯ BÊN DÒNG SUỐI MÁT
MEDITATION_CUES = [
    # Phần 1
    ("p1-c1", "Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất, như được ôm trọn trong vòng tay của đất mẹ dịu dàng."),
    ("p1-c2", "Hãy khép nhẹ đôi mắt lại, thả lỏng từng nhịp thở, để mọi lo lắng của ngày dài tan dần như những làn khói mỏng, bay nhẹ trong gió."),
    ("p1-c3", "Bây giờ, hãy để tâm trí bạn trôi nhẹ theo hơi thở. Khi hít vào, cảm nhận làn khí mát lành chảy vào lồng ngực, như một dòng suối trong lành đang tưới mát từng tế bào. Khi thở ra, hãy thả lỏng, buông thư, để mọi căng thẳng theo hơi thở mà tan biến."),
    ("p1-c4", "Tôi biết ơn hơi thở này. Tôi biết ơn sự sống đang chảy tràn trong tôi."),
    # Phần 2
    ("p2-c1", "Bây giờ, hãy đưa sự chú ý về vùng trán. Cảm nhận sự mềm mại, buông lỏng từng nếp nhăn, từng nét căng trên trán. Hãy để trán bạn được buông thư, nhẹ nhàng và mềm mại như những áng mây lững lờ trôi trên bầu trời."),
    ("p2-c2", "Di chuyển sự chú ý xuống đôi mắt. Hãy để đôi mắt khép lại thật êm đềm, thả lỏng, để ánh sáng của sự bình yên xoa dịu từng tế bào. Nếu đôi mắt đã mệt mỏi, hãy cho phép chúng nghỉ ngơi, trôi vào miền mơ dịu nhẹ."),
    ("p2-c3", "Tôi biết ơn đôi mắt. Tôi biết ơn đôi mắt đã nhìn ngắm thế giới này."),
    ("p2-c4", "Tiếp tục thả lỏng cơ mặt, buông thư đôi má, thả lỏng đôi môi, để mọi căng thẳng tan đi như giọt sương tan vào ánh bình minh."),
    ("p2-c5", "Hãy để hàm dưới của bạn hơi tách nhẹ, lưỡi đặt êm ái bên trong khoang miệng. Mọi biểu cảm trên gương mặt lúc này đều được xóa nhòa, chỉ còn lại nét bình thản, dịu dàng."),
    # Phần 3
    ("p3-c1", "Từ khuôn mặt, hãy nhẹ nhàng dẫn sự chú ý xuống vùng cổ và gáy. Cảm nhận hơi ấm lan tỏa, làm mềm đi những nút thắt mỏi mệt tích tụ suốt cả ngày dài."),
    ("p3-c2", "Di chuyển ý thức sang đôi vai. Hãy để đôi vai của bạn chìm sâu xuống mặt giường. Bạn không cần phải gồng mình gánh vác bất cứ điều gì vào lúc này nữa. Mọi trách nhiệm, mọi suy tư đều được đặt sang một bên. Đôi vai bạn trở nên nhẹ nhõm, mềm mại và hoàn toàn được nâng đỡ."),
    ("p3-c3", "Tôi biết ơn đôi vai này đã luôn vững vàng nâng đỡ tôi qua bao bộn bề cuộc sống."),
    ("p3-c4", "Dòng chảy thư giãn tiếp tục lan xuống hai cánh tay, qua khuỷu tay, cẳng tay, cổ tay, và chạm tới từng đầu ngón tay. Cảm nhận đôi bàn tay đang nằm yên bất động, ấm áp và thảnh thơi. Không còn nắm giữ, không còn vội vã."),
    ("p3-c5", "Tôi biết ơn đôi tay đã giúp tôi làm việc, chăm sóc bản thân và kết nối yêu thương với cuộc đời."),
    # Phần 4
    ("p4-c1", "Bây giờ, hãy quay trở về với vùng ngực. Cảm nhận lồng ngực bạn khẽ nâng lên khi hít vào, và hạ xuống thật êm ái khi thở ra. Hơi thở lúc này đã trở nên chậm rãi, sâu lắng và tự nhiên như nhịp sóng vỗ bờ."),
    ("p4-c2", "Lắng nghe nhịp đập dịu dàng nơi trái tim. Trái tim bạn đã làm việc cần mẫn suốt cả ngày, và giờ là lúc nó được nghỉ ngơi trong sự bình an tuyệt đối."),
    ("p4-c3", "Tôi biết ơn trái tim luôn đập nhịp nhàng, nuôi dưỡng sự sống và tình yêu thương bên trong tôi."),
    ("p4-c4", "Đưa sự chú ý ra phía sau lưng. Cảm nhận toàn bộ cột sống, từ đốt sống cổ xuống tận thắt lưng, đang trải dài và áp sát vào mặt đệm êm ái. Mọi áp lực dồn nén lên lưng đều tan biến, nhường chỗ cho cảm giác vững chãi và dễ chịu."),
    ("p4-c5", "Chuyển sự chú ý sang vùng bụng. Hãy để vùng bụng hoàn toàn mềm mại, không còn bất kỳ sự co thắt nào. Mọi cơ quan bên trong cơ thể đang được vỗ về, phục hồi và tái tạo năng lượng trong sự tĩnh lặng."),
    # Phần 5
    ("p5-c1", "Từ vùng hông, hãy để sự thư giãn chảy tràn xuống hai đùi, qua đầu gối, bắp chân, cổ chân, và lan tỏa khắp lòng bàn chân đến tận từng ngón chân."),
    ("p5-c2", "Cảm nhận đôi chân bạn đang nặng dần, chìm sâu vào sự êm ái của chiếc giường. Bao nhiêu bước đi, bao nhiêu chặng đường mệt nhoài của ngày hôm nay đều đang tan chảy vào mặt đất, trả lại sự thanh thản cho đôi chân."),
    ("p5-c3", "Tôi biết ơn đôi chân đã vững bước, đưa tôi đi qua biết bao hành trình."),
    # Phần 6
    ("p6-c1", "Lúc này, từ đỉnh đầu xuống tới tận các đầu ngón chân, toàn bộ cơ thể bạn là một khối thống nhất của sự bình yên, ấm áp và nhẹ bẫng."),
    ("p6-c2", "Bạn đang được bảo vệ, được che chở trong không gian tĩnh mịch của màn đêm. Bên tai chỉ còn lại tiếng suối chảy róc rách, trong lành, cuốn trôi đi những suy nghĩ cuối cùng còn sót lại trong tâm trí."),
    ("p6-c3", "Không cần cố gắng ngủ, cũng không cần điều khiển hơi thở nữa. Hãy cứ để cơ thể tự do trôi bồng bềnh trên dòng suối bình yên ấy."),
    ("p6-c4", "Tôi an toàn. Tôi bình yên. Tôi xứng đáng có một giấc ngủ sâu và trọn vẹn."),
    ("p6-c5", "Hãy thả lỏng, buông thư, và chìm sâu vào giấc ngủ ngon."),
]


def pick_warm_female_voice(tts):
    voices = tts.list_preset_voices()
    print("Available VieNeu-TTS preset voices:")
    for desc, vid in voices:
        print(f"  - {desc} (ID: {vid})")

    # Priority: Kim Chi -> Huyền Mi -> any warm female voice
    for keywords in [
        ("kim chi", "kimchi", "kim_chi"),
        ("huyền mi", "huyen mi", "huyenmi", "huyen_mi"),
        ("ngọc huyền", "ngochuyen", "đoan trang", "doantrang", "thủy tiên", "female", "nữ"),
    ]:
        for desc, vid in voices:
            hay = f"{desc} {vid}".lower()
            if any(k in hay for k in keywords):
                print(f"Selected VieNeu-TTS voice: {desc} (ID: {vid})")
                return vid, desc

    if voices:
        desc, vid = voices[0]
        print(f"Fallback to first preset voice: {desc} (ID: {vid})")
        return vid, desc
    return None, "default"


def slow_down_and_soften(audio_f32: np.ndarray, orig_sr: int, target_sr: int = 22050, speed_factor: float = 0.90, is_final: bool = False) -> np.ndarray:
    """Apply gentle time-stretch (slightly slower) using librosa if available, warm roll-off,
    and gentle fade-in/fade-out (with deeper fade-out on the final cue)."""
    y = np.asarray(audio_f32, dtype=np.float32).flatten()

    try:
        import librosa
        # Slightly slower meditative delivery without altering vocal warmth
        if abs(speed_factor - 1.0) > 0.01:
            y = librosa.effects.time_stretch(y, rate=speed_factor)
        if orig_sr != target_sr:
            y = librosa.resample(y, orig_sr=orig_sr, target_sr=target_sr)
    except Exception:
        # Simple linear resample fallback
        if orig_sr != target_sr:
            new_len = int(len(y) * target_sr / orig_sr)
            y = np.interp(np.linspace(0, len(y) - 1, new_len), np.arange(len(y)), y).astype(np.float32)

    # Gentle loudness normalization (-3dB peak)
    peak = float(np.max(np.abs(y))) if len(y) > 0 else 1.0
    if peak > 1e-6:
        y = y * (0.72 / peak)

    # Smooth fade-in (60ms) and fade-out (150ms, or gradual fade on final cue)
    fade_in_n = min(int(0.06 * target_sr), len(y) // 4)
    if fade_in_n > 1:
        y[:fade_in_n] *= np.linspace(0.0, 1.0, fade_in_n, dtype=np.float32)

    if is_final:
        # Gradual fade down across the last 55% of the final sentence
        fade_out_n = min(int(len(y) * 0.55), len(y))
        if fade_out_n > 1:
            y[-fade_out_n:] *= np.linspace(1.0, 0.12, fade_out_n, dtype=np.float32)
    else:
        fade_out_n = min(int(0.15 * target_sr), len(y) // 4)
        if fade_out_n > 1:
            y[-fade_out_n:] *= np.linspace(1.0, 0.0, fade_out_n, dtype=np.float32)

    return np.clip(y, -0.95, 0.95)


def write_wav_16bit(path: str, samples: np.ndarray, sr: int) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = (samples * 32767.0).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def main() -> None:
    from vieneu import Vieneu

    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    web_dir = os.path.join(repo_root, "apps", "web-nextjs", "public", "audio", "meditation")
    mobile_dir = os.path.join(repo_root, "apps", "mobile-flutter", "assets", "audio", "meditation")
    os.makedirs(web_dir, exist_ok=True)
    os.makedirs(mobile_dir, exist_ok=True)

    print("Initializing VieNeu-TTS engine...")
    tts = Vieneu()
    voice_id, voice_desc = pick_warm_female_voice(tts)
    voice_data = tts.get_preset_voice(voice_id) if voice_id else None

    orig_sr = getattr(tts, "sample_rate", 24000)
    target_sr = 16000  # Clean, warm voice bandwidth while keeping total bundle size compact

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            ffmpeg_bin = None
    print(f"VieNeu sample_rate={orig_sr}, target_sr={target_sr}, ffmpeg={ffmpeg_bin or 'NONE'}")

    for idx, (cue_id, text) in enumerate(MEDITATION_CUES, start=1):
        is_final = cue_id == "p6-c5"
        print(f"[{idx:02d}/{len(MEDITATION_CUES)}] Synthesizing {cue_id}...")
        if voice_data is not None:
            raw_audio = tts.infer(text=text, voice=voice_data)
        else:
            raw_audio = tts.infer(text=text)

        processed = slow_down_and_soften(
            raw_audio,
            orig_sr=orig_sr,
            target_sr=target_sr,
            speed_factor=0.86 if is_final else 0.90,
            is_final=is_final,
        )

        wav_path = os.path.join(web_dir, f"{cue_id}.wav")
        write_wav_16bit(wav_path, processed, target_sr)

        if ffmpeg_bin:
            mp3_web = os.path.join(web_dir, f"{cue_id}.mp3")
            mp3_mobile = os.path.join(mobile_dir, f"{cue_id}.mp3")
            subprocess.run(
                [ffmpeg_bin, "-y", "-i", wav_path, "-b:a", "64k", "-ac", "1", mp3_web],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            os.remove(wav_path)
            shutil.copy2(mp3_web, mp3_mobile)
        else:
            mobile_wav = os.path.join(mobile_dir, f"{cue_id}.wav")
            shutil.copy2(wav_path, mobile_wav)

    print(f"Done! Synthesized all {len(MEDITATION_CUES)} cues with VieNeu-TTS ({voice_desc}).")


if __name__ == "__main__":
    main()
