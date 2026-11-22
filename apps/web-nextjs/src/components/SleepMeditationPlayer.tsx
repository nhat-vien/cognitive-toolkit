'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SCRIPT_1_BROOK_432HZ,
  STUDIO_MEDITATION_TRACKS,
  SleepMeditationAudioEngine,
  flattenMeditationCues,
  formatMeditationClock,
  type SleepMeditationScript,
  type StudioMeditationTrack,
} from '../clinical/sleep-meditation.ts';

interface SleepMeditationPlayerProps {
  script?: SleepMeditationScript;
  lang?: 'vi' | 'en';
}

type PlayerMode = 'studio-3' | 'step-cues';
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

  const [mode, setMode] = useState<PlayerMode>('studio-3');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    STUDIO_MEDITATION_TRACKS[0]?.id ?? 'voice-1-suoi-mat',
  );
  const selectedTrack: StudioMeditationTrack =
    STUDIO_MEDITATION_TRACKS.find((t) => t.id === selectedTrackId) ?? STUDIO_MEDITATION_TRACKS[0]!;

  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [trackPositionSec, setTrackPositionSec] = useState(0);
  const [trackDurationSec, setTrackDurationSec] = useState(selectedTrack.durationSeconds);

  const [cueIndex, setCueIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(script.defaultTotalDurationMinutes);

  // Audio mixer controls (Pure Forest Brook + Warm 432Hz @ 30% default + Studio Voice)
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.9);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [brookVolume, setBrookVolume] = useState(0.45);
  const [freq432Volume, setFreq432Volume] = useState(0.30);
  const [loopTrack, setLoopTrack] = useState(false);
  const [showFullScript, setShowFullScript] = useState(false);

  const voiceEnabledRef = useRef(voiceEnabled);
  const voiceVolumeRef = useRef(voiceVolume);
  const voiceRateRef = useRef(voiceRate);
  const loopTrackRef = useRef(loopTrack);
  voiceEnabledRef.current = voiceEnabled;
  voiceVolumeRef.current = voiceVolume;
  voiceRateRef.current = voiceRate;
  loopTrackRef.current = loopTrack;

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
        voiceAudioElRef.current.ontimeupdate = null;
        voiceAudioElRef.current.onloadedmetadata = null;
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
    setTrackPositionSec(0);
  };

  useEffect(() => {
    return () => {
      activeRunIdRef.current += 1;
      clearAllTimers();
      stopVoicePlayback();
      audioRef.current?.stop(0.3);
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setBrookVolume(brookVolume);
  }, [brookVolume]);

  useEffect(() => {
    audioRef.current?.setFreq432Volume(freq432Volume);
  }, [freq432Volume]);

  useEffect(() => {
    if (voiceAudioElRef.current) {
      voiceAudioElRef.current.volume = voiceEnabled ? voiceVolume : 0;
    }
  }, [voiceVolume, voiceEnabled]);

  useEffect(() => {
    if (voiceAudioElRef.current) {
      voiceAudioElRef.current.playbackRate = voiceRate;
    }
  }, [voiceRate]);

  useEffect(() => {
    if (voiceAudioElRef.current && mode === 'studio-3') {
      voiceAudioElRef.current.loop = loopTrack;
    }
  }, [loopTrack, mode]);

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

  // --- STUDIO 3-TRACK PLAYBACK ---
  const startStudioTrack = (track: StudioMeditationTrack) => {
    activeRunIdRef.current += 1;
    const runId = activeRunIdRef.current;
    clearAllTimers();
    stopVoicePlayback();

    setMode('studio-3');
    setSelectedTrackId(track.id);
    setTrackPositionSec(0);
    setTrackDurationSec(track.durationSeconds);
    setIsPaused(false);
    setElapsedSeconds(0);
    setPhase('speaking');

    if (!audioRef.current) {
      audioRef.current = new SleepMeditationAudioEngine();
    }
    audioRef.current.start({ brookVolume, freq432Volume });
    startSessionClock(runId, sleepTimerMinutes);

    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      const audioEl = new window.Audio(track.audioUrl);
      audioEl.volume = voiceEnabledRef.current ? voiceVolumeRef.current : 0;
      audioEl.playbackRate = voiceRateRef.current;
      audioEl.loop = loopTrackRef.current;
      voiceAudioElRef.current = audioEl;

      audioEl.onloadedmetadata = () => {
        if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
          setTrackDurationSec(Math.round(audioEl.duration));
        }
      };
      audioEl.ontimeupdate = () => {
        if (activeRunIdRef.current !== runId) return;
        setTrackPositionSec(Math.floor(audioEl.currentTime));
      };
      audioEl.onended = () => {
        if (activeRunIdRef.current !== runId) return;
        if (loopTrackRef.current) {
          audioEl.currentTime = 0;
          void audioEl.play().catch(() => {});
        } else {
          setPhase('outro-ambient');
        }
      };
      void audioEl.play().catch(() => {
        // ignore autoplay errors
      });
    }
  };

  const handleSeekStudioTrack = (newSec: number) => {
    setTrackPositionSec(newSec);
    if (voiceAudioElRef.current) {
      voiceAudioElRef.current.currentTime = newSec;
    }
  };

  // --- STEP-BY-STEP 27-CUE PLAYBACK ---
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
        if (loopTrackRef.current) {
          setPhase('pausing');
          runCountdown(5, runId, () => playCueAtIndex(0, runId));
        } else {
          setPhase('outro-ambient');
          setCountdownSeconds(0);
        }
        return;
      }
      setPhase('pausing');
      runCountdown(cue.pauseAfterSeconds, runId, () => {
        playCueAtIndex(idx + 1, runId);
      });
    };

    if (!voiceEnabledRef.current || typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      const wordCount = cue.textVi.split(/\s+/).length;
      runCountdown(Math.max(4, Math.round(wordCount / 2.4)), runId, proceedToPause);
      return;
    }

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
      proceedToPause();
    };
    void audioEl.play().catch(() => {
      if (activeRunIdRef.current !== runId) return;
      proceedToPause();
    });
  };

  const startStepCues = (startAtCueIndex = 0) => {
    activeRunIdRef.current += 1;
    const runId = activeRunIdRef.current;
    clearAllTimers();
    stopVoicePlayback();

    setMode('step-cues');
    if (!audioRef.current) {
      audioRef.current = new SleepMeditationAudioEngine();
    }
    audioRef.current.start({ brookVolume, freq432Volume });
    setIsPaused(false);
    setElapsedSeconds(0);
    setCueIndex(startAtCueIndex);
    startSessionClock(runId, sleepTimerMinutes);
    playCueAtIndex(startAtCueIndex, runId);
  };

  const handleTogglePause = () => {
    if (phase === 'idle' || phase === 'completed') {
      if (mode === 'studio-3') {
        startStudioTrack(selectedTrack);
      } else {
        startStepCues(0);
      }
      return;
    }

    if (!isPaused) {
      if (mode === 'studio-3' && voiceAudioElRef.current && phase === 'speaking') {
        voiceAudioElRef.current.pause();
        audioRef.current?.stop(0.5);
        clearAllTimers();
        setIsPaused(true);
      } else {
        activeRunIdRef.current += 1;
        clearAllTimers();
        stopVoicePlayback();
        audioRef.current?.stop(0.6);
        setIsPaused(true);
      }
    } else {
      const runId = activeRunIdRef.current + 1;
      activeRunIdRef.current = runId;
      audioRef.current?.start({ brookVolume, freq432Volume: 0 });
      setIsPaused(false);
      startSessionClock(runId, sleepTimerMinutes);

      if (mode === 'studio-3') {
        if (voiceAudioElRef.current && phase === 'speaking') {
          void voiceAudioElRef.current.play().catch(() => {});
        }
      } else if (phase !== 'outro-ambient') {
        playCueAtIndex(cueIndex, runId);
      }
    }
  };

  const totalTargetSeconds = sleepTimerMinutes * 60;
  const remainingSessionSeconds = Math.max(0, totalTargetSeconds - elapsedSeconds);

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
            🌙 {lang === 'vi' ? 'Bộ 3 Bài Thiền Buông Thư Phòng Thu' : '3 Studio Guided Sleep Meditations'}
          </span>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', color: '#f7faf9' }}>
            🌊 Thiền Buông Thư Hỗ Trợ Giấc Ngủ Sâu
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#b4c9c5' }}>
            Chọn 1 trong 3 giọng đọc trầm ấm chuẩn phòng thu kết hợp tiếng suối chảy êm dịu.
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

      {/* 3 Studio Voice Track Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        {STUDIO_MEDITATION_TRACKS.map((track) => {
          const isSelected = mode === 'studio-3' && selectedTrack.id === track.id;
          const isPlayingThis = isSelected && phase === 'speaking' && !isPaused;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => startStudioTrack(track)}
              style={{
                textAlign: 'left',
                padding: '14px 15px',
                borderRadius: '14px',
                border: isSelected
                  ? '1.8px solid #7ec8b8'
                  : '1px solid rgba(255,255,255,0.14)',
                backgroundColor: isSelected
                  ? 'rgba(126, 200, 184, 0.16)'
                  : 'rgba(255,255,255,0.04)',
                color: '#eef6f5',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(126, 200, 184, 0.2)',
                    color: '#a3e8d9',
                  }}
                >
                  {track.voiceStyleBadgeVi}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#9eb6b3', fontWeight: 600 }}>
                  {isPlayingThis ? '🔊 Đang phát' : `⏱ ${formatMeditationClock(track.durationSeconds)}`}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#f7fbfa', lineHeight: 1.35 }}>
                {track.titleVi}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b9ceca', lineHeight: 1.45 }}>
                {track.descriptionVi}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Player Stage */}
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(8, 14, 21, 0.58)',
          border: '1px solid rgba(126, 200, 184, 0.22)',
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
            marginBottom: '10px',
          }}
        >
          {phase === 'idle' && `✨ Sẵn sàng: ${selectedTrack.titleVi}`}
          {phase === 'speaking' &&
            (mode === 'studio-3'
              ? `🎙️ ${selectedTrack.voiceNameVi}`
              : `🎙️ ${currentCue.partTitleVi}`)}
          {phase === 'pausing' && `🍃 ${currentCue.partTitleVi} • Thả lỏng (${countdownSeconds}s)`}
          {phase === 'outro-ambient' &&
            '🌌 Giọng đọc đã kết thúc — Giữ tiếng suối chảy êm dịu ru ngủ'}
          {phase === 'completed' && '🌙 Phiên thiền đã kết thúc êm dịu. Chúc bạn ngủ ngon.'}
        </div>

        <p
          style={{
            margin: '4px auto 14px auto',
            maxWidth: '660px',
            fontSize: '1.02rem',
            lineHeight: 1.65,
            color: '#f2f7f6',
            fontWeight: 500,
          }}
        >
          {mode === 'studio-3'
            ? phase === 'outro-ambient'
              ? 'Hãy thả lỏng toàn thân và tiếp tục lắng nghe tiếng suối chảy róc rách để chìm vào giấc ngủ sâu…'
              : selectedTrack.descriptionVi
            : `“${currentCue.textVi}”`}
        </p>

        {/* Seek Bar for Studio Track */}
        {mode === 'studio-3' && (
          <div style={{ maxWidth: '540px', margin: '0 auto 14px auto' }}>
            <input
              type="range"
              min={0}
              max={Math.max(1, trackDurationSec)}
              value={Math.min(trackPositionSec, trackDurationSec)}
              onChange={(e) => handleSeekStudioTrack(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: '#9eb6b3',
                marginTop: '4px',
              }}
            >
              <span>{formatMeditationClock(trackPositionSec)}</span>
              <span>Hẹn giờ còn lại: {formatMeditationClock(remainingSessionSeconds)}</span>
              <span>{formatMeditationClock(trackDurationSec)}</span>
            </div>
          </div>
        )}

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
              ? `▶ Phát ${selectedTrack.titleVi.split(':')[0]}`
              : isPaused
                ? '▶ Tiếp tục phát'
                : '⏸ Tạm dừng'}
          </button>

          <button
            type="button"
            onClick={() => setLoopTrack((prev) => !prev)}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: loopTrack
                ? '1.5px solid #7ec8b8'
                : '1px solid rgba(255,255,255,0.2)',
              backgroundColor: loopTrack
                ? 'rgba(126, 200, 184, 0.22)'
                : 'transparent',
              color: loopTrack ? '#e9fbf7' : '#d0dedb',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            {loopTrack ? '🔁 Lặp bài: Đang bật' : '🔁 Lặp bài: Tắt'}
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

      {/* 3-Channel Mixer (Voice + Speed Slider + Brook + 432Hz @ 30% default) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
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
              <span>🎙️ Âm lượng giọng đọc</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#c4dad6', marginTop: '8px', marginBottom: '4px' }}>
            <span>⏩ Tốc độ đọc</span>
            <strong>{voiceRate.toFixed(2)}x</strong>
          </div>
          <input
            type="range"
            min={0.70}
            max={1.15}
            step={0.05}
            value={voiceRate}
            onChange={(e) => setVoiceRate(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8fa9a5' }}>
            <span>Chậm (0.70x)</span>
            <span>Chuẩn (1.0x)</span>
            <span>Nhanh (1.15x)</span>
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
            Tiếp tục chảy êm dịu ru ngủ sau khi giọng đọc kết thúc
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
          <div style={{ fontSize: '0.74rem', color: '#9eb6b3', marginTop: '4px' }}>
            Mặc định 30% dịu ấm (có thể kéo về 0% nếu muốn tắt)
          </div>
        </div>
      </div>

      {/* Footer Utilities: Switch to 27-Cue Mode & Full Script */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => (mode === 'studio-3' ? startStepCues(0) : startStudioTrack(selectedTrack))}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '10px',
            padding: '6px 12px',
            color: '#c9dfdb',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {mode === 'studio-3'
            ? '🎧 Chuyển sang bản 27 câu có đếm ngược [Nghỉ Xs] (VieNeu-TTS)'
            : '🎙️ Quay lại 3 bài Thiền Phòng Thu'}
        </button>

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
          {showFullScript ? '▲ Ẩn kịch bản chữ' : '▼ Xem kịch bản chữ 6 phần'}
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
            maxHeight: '320px',
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
