'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SCRIPT_1_BROOK_432HZ,
  SleepMeditationAudioEngine,
  flattenMeditationCues,
  formatMeditationClock,
  type SleepMeditationScript,
} from '../clinical/sleep-meditation.ts';

interface SleepMeditationPlayerProps {
  script?: SleepMeditationScript;
  lang?: 'vi' | 'en';
}

type PlayerPhase = 'idle' | 'intro-ambient' | 'speaking' | 'pausing' | 'outro-ambient' | 'completed';

export function SleepMeditationPlayer({
  script = SCRIPT_1_BROOK_432HZ,
  lang = 'vi',
}: SleepMeditationPlayerProps) {
  const allCues = useMemo(() => flattenMeditationCues(script), [script]);
  const audioRef = useRef<SleepMeditationAudioEngine | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRunIdRef = useRef<number>(0);

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [cueIndex, setCueIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(script.defaultTotalDurationMinutes);

  // Audio mixer controls (tuned for warm, soothing night listening)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.72);
  const [voiceRate, setVoiceRate] = useState(0.68);
  const [brookVolume, setBrookVolume] = useState(0.78);
  const [freq432Volume, setFreq432Volume] = useState(0.20);
  const [showFullScript, setShowFullScript] = useState(false);

  const voiceEnabledRef = useRef(voiceEnabled);
  const voiceVolumeRef = useRef(voiceVolume);
  const voiceRateRef = useRef(voiceRate);
  voiceEnabledRef.current = voiceEnabled;
  voiceVolumeRef.current = voiceVolume;
  voiceRateRef.current = voiceRate;

  const currentCue = allCues[Math.min(cueIndex, allCues.length - 1)] ?? allCues[0]!;

  const clearAllTimers = () => {
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  const cancelSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  };

  const stopSession = () => {
    activeRunIdRef.current += 1;
    clearAllTimers();
    cancelSpeech();
    audioRef.current?.stop(1.0);
    setPhase('idle');
    setIsPaused(false);
    setCountdownSeconds(0);
    setElapsedSeconds(0);
  };

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      clearAllTimers();
      cancelSpeech();
      audioRef.current?.stop(0.3);
    };
  }, []);

  // Sync volume sliders live with Web Audio API engine
  useEffect(() => {
    audioRef.current?.setBrookVolume(brookVolume);
  }, [brookVolume]);

  useEffect(() => {
    audioRef.current?.setFreq432Volume(freq432Volume);
  }, [freq432Volume]);

  const startSessionClock = (runId: number, targetMinutes: number) => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    const totalTargetSeconds = targetMinutes * 60;
    sessionTimerRef.current = setInterval(() => {
      if (activeRunIdRef.current !== runId) return;
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalTargetSeconds) {
          // Gentle fade-out at minute 30
          activeRunIdRef.current += 1;
          clearAllTimers();
          cancelSpeech();
          audioRef.current?.stop(3.5);
          setPhase('completed');
          setIsPaused(false);
        }
        return next;
      });
    }, 1000);
  };

  const runCountdown = (seconds: number, runId: number, onComplete: () => void) => {
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    if (seconds <= 0) {
      setCountdownSeconds(0);
      onComplete();
      return;
    }
    let remaining = seconds;
    setCountdownSeconds(remaining);
    pauseTimerRef.current = setInterval(() => {
      if (activeRunIdRef.current !== runId) {
        if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
        return;
      }
      remaining -= 1;
      setCountdownSeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        if (pauseTimerRef.current) {
          clearInterval(pauseTimerRef.current);
          pauseTimerRef.current = null;
        }
        onComplete();
      }
    }, 1000);
  };

  const playCueAtIndex = (idx: number, runId: number) => {
    if (activeRunIdRef.current !== runId) return;
    if (idx >= allCues.length) {
      setPhase('outro-ambient');
      setCountdownSeconds(0);
      return;
    }

    const cue = allCues[idx];
    if (!cue) {
      setPhase('outro-ambient');
      setCountdownSeconds(0);
      return;
    }
    setCueIndex(idx);
    setPhase('speaking');
    setCountdownSeconds(0);

    const proceedToPause = () => {
      if (activeRunIdRef.current !== runId) return;
      if (cue.isFinalFadeOut) {
        setPhase('outro-ambient');
        setCountdownSeconds(0);
        return;
      }
      setPhase('pausing');
      runCountdown(cue.pauseAfterSeconds, runId, () => {
        playCueAtIndex(idx + 1, runId);
      });
    };

    const hasSpeechApi =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';

    if (voiceEnabledRef.current && hasSpeechApi) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(cue.textVi);
        utterance.lang = 'vi-VN';
        utterance.rate = cue.isFinalFadeOut
          ? Math.max(0.56, voiceRateRef.current - 0.08)
          : voiceRateRef.current;
        // Warm, soft, low-pitch female tone (eliminates sharp/shrill TTS edge)
        utterance.pitch = 0.84;
        utterance.volume = cue.isFinalFadeOut
          ? Math.max(0.20, voiceVolumeRef.current * 0.5)
          : voiceVolumeRef.current;

        const voices = window.speechSynthesis.getVoices();
        const viVoices = voices.filter(
          (v) => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('viet'),
        );
        // Prioritize natural warm female Vietnamese voices (HoaiMy, Linh, Google Tiếng Việt)
        // and avoid male voices (NamMinh, An)
        const preferredFemaleVoice =
          viVoices.find((v) => /hoaimy|hoài my/i.test(v.name) && /natural|online/i.test(v.name)) ??
          viVoices.find((v) => /hoaimy|hoài my|linh|female|nữ/i.test(v.name)) ??
          viVoices.find((v) => !/namminh|nam minh|\ban\b|male|nam/i.test(v.name)) ??
          viVoices[0];
        if (preferredFemaleVoice) {
          utterance.voice = preferredFemaleVoice;
        }

        utterance.onend = () => {
          proceedToPause();
        };
        utterance.onerror = () => {
          proceedToPause();
        };
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback to timed reading below
      }
    }

    // Fallback reading duration (~2.5 words/sec) if voice is muted or TTS unavailable
    const wordCount = cue.textVi.split(/\s+/).length;
    const estimatedReadSec = Math.max(4, Math.round(wordCount / 2.6));
    runCountdown(estimatedReadSec, runId, proceedToPause);
  };

  const startMeditation = (skipIntro = false, startAtCueIndex = 0) => {
    activeRunIdRef.current += 1;
    const runId = activeRunIdRef.current;
    clearAllTimers();
    cancelSpeech();

    if (!audioRef.current) {
      audioRef.current = new SleepMeditationAudioEngine();
    }
    audioRef.current.start({ brookVolume, freq432Volume });
    setIsPaused(false);
    setElapsedSeconds(0);
    setCueIndex(startAtCueIndex);
    startSessionClock(runId, sleepTimerMinutes);

    if (skipIntro || startAtCueIndex > 0) {
      playCueAtIndex(startAtCueIndex, runId);
    } else {
      setPhase('intro-ambient');
      runCountdown(script.introAmbientSeconds, runId, () => {
        playCueAtIndex(0, runId);
      });
    }
  };

  const handleTogglePause = () => {
    if (phase === 'idle' || phase === 'completed') {
      startMeditation(false, 0);
      return;
    }

    if (!isPaused) {
      // Pause speech & timers while keeping state
      activeRunIdRef.current += 1;
      clearAllTimers();
      cancelSpeech();
      audioRef.current?.stop(0.6);
      setIsPaused(true);
    } else {
      // Resume from current cue
      const runId = activeRunIdRef.current + 1;
      activeRunIdRef.current = runId;
      audioRef.current?.start({ brookVolume, freq432Volume });
      setIsPaused(false);
      startSessionClock(runId, sleepTimerMinutes);
      if (phase === 'intro-ambient') {
        runCountdown(Math.max(1, countdownSeconds), runId, () => playCueAtIndex(0, runId));
      } else if (phase === 'outro-ambient') {
        setPhase('outro-ambient');
      } else {
        playCueAtIndex(cueIndex, runId);
      }
    }
  };

  const handleJumpToPart = (partIndex: number) => {
    const targetCueIdx = allCues.findIndex((c) => c.partIndex === partIndex);
    if (targetCueIdx >= 0) {
      startMeditation(true, targetCueIdx);
    }
  };

  const totalTargetSeconds = sleepTimerMinutes * 60;
  const remainingSessionSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);
  const progressPct = Math.min(100, Math.round((elapsedSeconds / Math.max(1, totalTargetSeconds)) * 100));

  return (
    <section
      aria-label="Thiền Buông Thư Hỗ Trợ Giấc Ngủ"
      style={{
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(155deg, #131b26 0%, #1a2634 52%, #142429 100%)',
        color: '#edf2f0',
        border: '1px solid rgba(138, 198, 186, 0.25)',
        boxShadow: '0 14px 36px rgba(9, 15, 24, 0.28)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(126, 200, 184, 0.16)',
              color: '#9ee2d4',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            🌙 {script.numberLabel} • {lang === 'vi' ? 'Hỗ trợ Giấc ngủ Sâu' : 'Deep Sleep Body-Scan'}
          </span>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', color: '#f7faf9' }}>
            🌊 {script.titleVi}
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#b4c9c5' }}>
            {script.settingVi} • {script.soundscapeVi}
          </p>
        </div>

        {/* Sleep Timer Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#9eb6b3' }}>Hẹn giờ ngủ:</span>
          {[15, 30, 45].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSleepTimerMinutes(mins)}
              style={{
                padding: '5px 11px',
                borderRadius: '10px',
                border:
                  sleepTimerMinutes === mins
                    ? '1.5px solid #7ec8b8'
                    : '1px solid rgba(255,255,255,0.16)',
                backgroundColor:
                  sleepTimerMinutes === mins ? 'rgba(126, 200, 184, 0.22)' : 'rgba(255,255,255,0.05)',
                color: sleepTimerMinutes === mins ? '#e6faf5' : '#b7cac7',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {mins} phút
            </button>
          ))}
        </div>
      </div>

      {/* Live Teleprompter & Breathing Ripple Stage */}
      <div
        style={{
          padding: '22px 20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(8, 14, 21, 0.55)',
          border: '1px solid rgba(126, 200, 184, 0.2)',
          textAlign: 'center',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: 'rgba(126, 200, 184, 0.14)',
            color: '#9ee2d4',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          {phase === 'idle' && '✨ Sẵn sàng buông thư — Hãy nằm xuống thoải mái'}
          {phase === 'intro-ambient' &&
            `🌊 Nhạc nền suối chảy & 432Hz mở đầu (${countdownSeconds}s)`}
          {phase === 'speaking' && `🎙️ ${currentCue.partTitleVi}`}
          {phase === 'pausing' &&
            `🍃 ${currentCue.partTitleVi} • Đang thả lỏng (${countdownSeconds}s)`}
          {phase === 'outro-ambient' &&
            '🌌 Giọng đọc đã lắng xuống — Giữ tiếng suối & sóng 432Hz ru ngủ'}
          {phase === 'completed' && '🌙 Phiên thiền 30 phút đã kết thúc êm dịu. Chúc bạn ngủ ngon.'}
        </div>

        {/* Active Spoken Line */}
        <p
          style={{
            margin: '4px auto 14px auto',
            maxWidth: '680px',
            fontSize: '1.08rem',
            lineHeight: 1.72,
            color: '#f2f7f6',
            fontWeight: 500,
            minHeight: '72px',
          }}
        >
          {phase === 'idle'
            ? '“Hãy nằm xuống, để cơ thể bạn được nâng niu bởi mặt đất, như được ôm trọn trong vòng tay của đất mẹ dịu dàng.”'
            : phase === 'intro-ambient'
              ? 'Nhắm nhẹ đôi mắt… lắng nghe tiếng suối chảy róc rách và tần số 432Hz êm dịu lan tỏa khắp căn phòng…'
              : phase === 'outro-ambient'
                ? script.outroNoteVi
                : phase === 'completed'
                  ? 'Chúc bạn một giấc ngủ thật sâu, an lành và trọn vẹn.'
                  : `“${currentCue.textVi}”`}
        </p>

        {/* Session Progress & Clock */}
        <div style={{ maxWidth: '520px', margin: '0 auto 14px auto' }}>
          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #5ba898, #8fd4c4)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#9eb6b3',
              marginTop: '6px',
            }}
          >
            <span>Đã phát: {formatMeditationClock(elapsedSeconds)}</span>
            <span>
              Câu {Math.min(cueIndex + 1, allCues.length)}/{allCues.length}
            </span>
            <span>Còn lại: {formatMeditationClock(remainingSessionSeconds)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleTogglePause}
            style={{
              padding: '11px 24px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #4b9b8a, #69b8a6)',
              color: '#0c1816',
              fontWeight: 800,
              fontSize: '0.94rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(95, 180, 162, 0.35)',
            }}
          >
            {phase === 'idle' || phase === 'completed'
              ? '▶ Bắt đầu Thiền Buông Thư (Đầy đủ 30s nhạc mở đầu)'
              : isPaused
                ? '▶ Tiếp tục phát'
                : '⏸ Tạm dừng'}
          </button>

          {(phase === 'idle' || phase === 'intro-ambient') && (
            <button
              type="button"
              onClick={() => startMeditation(true, 0)}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(158, 226, 212, 0.4)',
                backgroundColor: 'rgba(126, 200, 184, 0.12)',
                color: '#d4f3ec',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              ⏭ Vào ngay Phần 1 (Bỏ qua 30s nhạc dạo)
            </button>
          )}

          {phase !== 'idle' && (
            <button
              type="button"
              onClick={stopSession}
              style={{
                padding: '10px 16px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'transparent',
                color: '#d0dedb',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              ⏹ Dừng hẳn
            </button>
          )}
        </div>
      </div>

      {/* Independent 3-Channel Sound Mixer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              <span>🎙️ Giọng đọc dẫn thiền</span>
            </label>
            <strong>{Math.round(voiceVolume * 100)}%</strong>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={voiceVolume}
            disabled={!voiceEnabled}
            onChange={(e) => setVoiceVolume(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9eb6b3', marginTop: '4px' }}>
            <span>Tốc độ đọc: {voiceRate.toFixed(2)}x (Nữ trầm ấm)</span>
            <button
              type="button"
              onClick={() => setVoiceRate((r) => (r <= 0.65 ? 0.74 : 0.62))}
              style={{
                background: 'none',
                border: 'none',
                color: '#8fd4c4',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              {voiceRate <= 0.65 ? 'Đổi chậm vừa' : 'Đổi siêu chậm'}
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
            <span>🌊 Tiếng suối chảy róc rách</span>
            <strong>{Math.round(brookVolume * 100)}%</strong>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={brookVolume}
            onChange={(e) => setBrookVolume(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
            <span>🎵 Sóng âm tần số 432Hz</span>
            <strong>{Math.round(freq432Volume * 100)}%</strong>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={freq432Volume}
            onChange={(e) => setFreq432Volume(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* 6 Parts Quick Jump */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.82rem', color: '#9eb6b3', marginBottom: '8px', fontWeight: 600 }}>
          Chuyển nhanh đến từng phần của bài Thiền Buông Thư:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {script.parts.map((part) => {
            const isCurrentPart = phase !== 'idle' && phase !== 'intro-ambient' && currentCue.partIndex === part.index;
            return (
              <button
                key={part.index}
                type="button"
                onClick={() => handleJumpToPart(part.index)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: isCurrentPart
                    ? '1.5px solid #7ec8b8'
                    : '1px solid rgba(255,255,255,0.14)',
                  backgroundColor: isCurrentPart
                    ? 'rgba(126, 200, 184, 0.22)'
                    : 'rgba(255,255,255,0.04)',
                  color: isCurrentPart ? '#eefaf7' : '#bdd0cd',
                  fontSize: '0.81rem',
                  fontWeight: isCurrentPart ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                Phần {part.index}: {part.bodyRegionVi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Full Script */}
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={() => setShowFullScript((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ee2d4',
            cursor: 'pointer',
            fontSize: '0.83rem',
            fontWeight: 600,
          }}
        >
          {showFullScript ? '▲ Ẩn toàn văn kịch bản' : '▼ Xem toàn văn kịch bản & nhịp nghỉ [Nghỉ Xs]'}
        </button>
      </div>

      {showFullScript && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: 'rgba(8, 14, 21, 0.45)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: '340px',
            overflowY: 'auto',
            fontSize: '0.86rem',
            lineHeight: 1.65,
          }}
        >
          {script.parts.map((part) => (
            <div key={part.index} style={{ marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, color: '#9ee2d4', marginBottom: '4px' }}>
                {part.titleVi}
              </div>
              {part.cues.map((cue) => (
                <p key={cue.id} style={{ margin: '0 0 6px 0', color: '#dce8e6' }}>
                  {cue.textVi}{' '}
                  {cue.pauseAfterSeconds > 0 && (
                    <span style={{ color: '#7ec8b8', fontSize: '0.78rem', fontWeight: 700 }}>
                      [Nghỉ {cue.pauseAfterSeconds}s]
                    </span>
                  )}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
