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

type PlayerPhase = 'idle' | 'speaking' | 'pausing' | 'outro-ambient' | 'completed';

export function SleepMeditationPlayer({
  script = SCRIPT_1_BROOK_432HZ,
  lang = 'vi',
}: SleepMeditationPlayerProps) {
  const allCues = useMemo(() => flattenMeditationCues(script), [script]);
  const audioRef = useRef<SleepMeditationAudioEngine | null>(null);
  const voiceAudioElRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRunIdRef = useRef<number>(0);

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [cueIndex, setCueIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(script.defaultTotalDurationMinutes);

  // Audio mixer controls (Pure Forest Brook + VieNeu-TTS Kim Chi / Huyen Mi voice)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.85);
  const [voiceRate, setVoiceRate] = useState(0.92);
  const [brookVolume, setBrookVolume] = useState(0.75);
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

  const stopVoicePlayback = () => {
    if (voiceAudioElRef.current) {
      try {
        voiceAudioElRef.current.onended = null;
        voiceAudioElRef.current.onerror = null;
        voiceAudioElRef.current.pause();
        voiceAudioElRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      voiceAudioElRef.current = null;
    }
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
    stopVoicePlayback();
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
      stopVoicePlayback();
      audioRef.current?.stop(0.3);
    };
  }, []);

  // Sync live volume & speed sliders
  useEffect(() => {
    audioRef.current?.setBrookVolume(brookVolume);
  }, [brookVolume]);

  useEffect(() => {
    if (voiceAudioElRef.current) {
      voiceAudioElRef.current.volume = voiceVolume;
    }
  }, [voiceVolume]);

  useEffect(() => {
    if (voiceAudioElRef.current) {
      voiceAudioElRef.current.playbackRate = voiceRate;
    }
  }, [voiceRate]);

  const startSessionClock = (runId: number, targetMinutes: number) => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    const totalTargetSeconds = targetMinutes * 60;
    sessionTimerRef.current = setInterval(() => {
      if (activeRunIdRef.current !== runId) return;
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalTargetSeconds) {
          activeRunIdRef.current += 1;
          clearAllTimers();
          stopVoicePlayback();
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

  const playBrowserTtsFallback = (cueText: string, isFinal: boolean, proceedToPause: () => void) => {
    const hasSpeechApi =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';

    if (hasSpeechApi) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(cueText);
        utterance.lang = 'vi-VN';
        utterance.rate = isFinal ? 0.60 : 0.68;
        utterance.pitch = 0.84;
        utterance.volume = isFinal ? Math.max(0.2, voiceVolumeRef.current * 0.5) : voiceVolumeRef.current;

        const voices = window.speechSynthesis.getVoices();
        const viVoices = voices.filter(
          (v) => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('viet'),
        );
        const femaleVoice =
          viVoices.find((v) => /hoaimy|hoài my|linh|female|nữ/i.test(v.name)) ?? viVoices[0];
        if (femaleVoice) utterance.voice = femaleVoice;

        utterance.onend = proceedToPause;
        utterance.onerror = proceedToPause;
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // fallback timer below
      }
    }
    const wordCount = cueText.split(/\s+/).length;
    const estSec = Math.max(4, Math.round(wordCount / 2.4));
    runCountdown(estSec, activeRunIdRef.current, proceedToPause);
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

    if (!voiceEnabledRef.current) {
      const wordCount = cue.textVi.split(/\s+/).length;
      const estimatedReadSec = Math.max(4, Math.round(wordCount / 2.4));
      runCountdown(estimatedReadSec, runId, proceedToPause);
      return;
    }

    // Play studio-synthesized VieNeu-TTS (Kim Chi / Huyen Mi) audio clip
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      stopVoicePlayback();
      const audioEl = new window.Audio(`/audio/meditation/${cue.id}.mp3`);
      audioEl.volume = cue.isFinalFadeOut
        ? Math.max(0.25, voiceVolumeRef.current * 0.65)
        : voiceVolumeRef.current;
      audioEl.playbackRate = cue.isFinalFadeOut
        ? Math.max(0.78, voiceRateRef.current - 0.06)
        : voiceRateRef.current;
      voiceAudioElRef.current = audioEl;

      audioEl.onended = () => {
        if (activeRunIdRef.current !== runId) return;
        proceedToPause();
      };
      audioEl.onerror = () => {
        if (activeRunIdRef.current !== runId) return;
        playBrowserTtsFallback(cue.textVi, Boolean(cue.isFinalFadeOut), proceedToPause);
      };

      void audioEl.play().catch(() => {
        if (activeRunIdRef.current !== runId) return;
        playBrowserTtsFallback(cue.textVi, Boolean(cue.isFinalFadeOut), proceedToPause);
      });
      return;
    }

    playBrowserTtsFallback(cue.textVi, Boolean(cue.isFinalFadeOut), proceedToPause);
  };

  // Start immediately into Phần 1 (no 30s intro, no 432Hz tone)
  const startMeditation = (startAtCueIndex = 0) => {
    activeRunIdRef.current += 1;
    const runId = activeRunIdRef.current;
    clearAllTimers();
    stopVoicePlayback();

    if (!audioRef.current) {
      audioRef.current = new SleepMeditationAudioEngine();
    }
    audioRef.current.start({ brookVolume, freq432Volume: 0 });
    setIsPaused(false);
    setElapsedSeconds(0);
    setCueIndex(startAtCueIndex);
    startSessionClock(runId, sleepTimerMinutes);
    playCueAtIndex(startAtCueIndex, runId);
  };

  const handleTogglePause = () => {
    if (phase === 'idle' || phase === 'completed') {
      startMeditation(0);
      return;
    }

    if (!isPaused) {
      activeRunIdRef.current += 1;
      clearAllTimers();
      stopVoicePlayback();
      audioRef.current?.stop(0.6);
      setIsPaused(true);
    } else {
      const runId = activeRunIdRef.current + 1;
      activeRunIdRef.current = runId;
      audioRef.current?.start({ brookVolume, freq432Volume: 0 });
      setIsPaused(false);
      startSessionClock(runId, sleepTimerMinutes);
      if (phase === 'outro-ambient') {
        setPhase('outro-ambient');
      } else {
        playCueAtIndex(cueIndex, runId);
      }
    }
  };

  const handleJumpToPart = (partIndex: number) => {
    const targetCueIdx = allCues.findIndex((c) => c.partIndex === partIndex);
    if (targetCueIdx >= 0) {
      startMeditation(targetCueIdx);
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

      {/* Live Teleprompter Stage */}
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
          {phase === 'idle' && '✨ Sẵn sàng buông thư — Bấm phát để bắt đầu ngay Phần 1'}
          {phase === 'speaking' && `🎙️ ${currentCue.partTitleVi}`}
          {phase === 'pausing' &&
            `🍃 ${currentCue.partTitleVi} • Đang thả lỏng (${countdownSeconds}s)`}
          {phase === 'outro-ambient' &&
            '🌌 Giọng đọc đã lắng xuống — Giữ tiếng suối chảy êm dịu ru ngủ'}
          {phase === 'completed' && '🌙 Phiên thiền đã kết thúc êm dịu. Chúc bạn ngủ ngon.'}
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
              padding: '11px 26px',
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
              ? '▶ Bắt đầu Thiền Buông Thư Ngay'
              : isPaused
                ? '▶ Tiếp tục phát'
                : '⏸ Tạm dừng'}
          </button>

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

      {/* Independent 2-Channel Sound Mixer (Voice + Pure Forest Brook) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
              <span>🎙️ Giọng nữ trầm VieNeu-TTS</span>
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
            <span>Nhịp đọc chậm êm: {voiceRate.toFixed(2)}x</span>
            <button
              type="button"
              onClick={() => setVoiceRate((r) => (r <= 0.88 ? 0.96 : 0.86))}
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
              {voiceRate <= 0.88 ? 'Chậm vừa (0.96x)' : 'Siêu chậm (0.86x)'}
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
          <div style={{ fontSize: '0.74rem', color: '#9eb6b3', marginTop: '4px' }}>
            Âm thanh dòng suối tự nhiên, không chói tai
          </div>
        </div>
      </div>

      {/* 6 Parts Quick Jump */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.82rem', color: '#9eb6b3', marginBottom: '8px', fontWeight: 600 }}>
          Chuyển nhanh đến từng phần của bài Thiền Buông Thư:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {script.parts.map((part) => {
            const isCurrentPart = phase !== 'idle' && currentCue.partIndex === part.index;
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
