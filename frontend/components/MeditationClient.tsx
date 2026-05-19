"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SessionProgress from "@/components/SessionProgress";
import VoiceSphere from "@/components/VoiceSphere";
import {
  fetchDemoReadiness,
  fetchVoicePresets,
  postJson,
  streamSpeechSentences,
  type ScriptResponse,
  type SessionResponse,
  type VoicePresetRow,
} from "@/lib/api";
import { greetings } from "@/lib/i18n";
import {
  clampSessionEstimate,
  estimateScriptDurationSeconds,
} from "@/lib/sessionTiming";

const MIN_CONTEXT = 10;

type View = "compose" | "listen";

type ApiConnectivity = "checking" | "offline" | "misconfigured" | "ready";

export default function MeditationClient() {
  const { locale, t } = useLocale();
  const [view, setView] = useState<View>("compose");
  const [context, setContext] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | null>(null);
  const [presets, setPresets] = useState<VoicePresetRow[]>([]);
  const [voicePreset, setVoicePreset] = useState<string>("bella_style");
  const [busyKind, setBusyKind] = useState<"script" | "session" | "stream" | null>(null);
  const [streamChunkPlayed, setStreamChunkPlayed] = useState(0);
  const busy = busyKind !== null;
  const [error, setError] = useState<string | null>(null);
  const [audioActive, setAudioActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [streamOpen, setStreamOpen] = useState(false);
  const [audioTruncated, setAudioTruncated] = useState(false);
  const [playback, setPlayback] = useState({ current: 0, duration: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [streamChunkTotal, setStreamChunkTotal] = useState(0);
  const [streamElapsed, setStreamElapsed] = useState(0);
  const streamStartRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [connectivity, setConnectivity] = useState<ApiConnectivity>("checking");

  const estimatedSessionSeconds = useMemo(() => {
    if (!script) return 5 * 60;
    return clampSessionEstimate(estimateScriptDurationSeconds(script, locale));
  }, [script, locale]);

  const refreshApiStatus = useCallback(() => {
    void fetchDemoReadiness().then((r) => {
      if (!r.online) setConnectivity("offline");
      else if (!r.demoReady) setConnectivity("misconfigured");
      else setConnectivity("ready");
    });
  }, []);

  const greeting = useMemo(() => {
    const pair = greetings[locale];
    return pair[Math.floor(Math.random() * pair.length)]!;
  }, [locale]);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refreshApiStatus();
    };
    window.addEventListener("online", refreshApiStatus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("online", refreshApiStatus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refreshApiStatus]);

  useEffect(() => {
    if (connectivity !== "ready") return;
    fetchVoicePresets()
      .then(setPresets)
      .catch(() => setPresets([]));
  }, [connectivity]);

  const revokeSessionUrl = useCallback(() => {
    if (sessionAudioUrl) {
      URL.revokeObjectURL(sessionAudioUrl);
      setSessionAudioUrl(null);
    }
  }, [sessionAudioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => {
      setAudioActive(true);
      setPlaying(true);
    };
    const onPause = () => {
      setAudioActive(false);
      setPlaying(false);
    };
    const onEnded = () => {
      setAudioActive(false);
      setPlaying(false);
      setSessionComplete(true);
      setPlayback((p) => ({
        current: p.duration > 0 ? p.duration : p.current,
        duration: p.duration > 0 ? p.duration : estimatedSessionSeconds,
      }));
    };
    const onTimeUpdate = () => {
      const dur =
        Number.isFinite(el.duration) && el.duration > 0 ? el.duration : estimatedSessionSeconds;
      setPlayback({ current: el.currentTime, duration: dur });
    };
    const onLoadedMetadata = () => {
      const dur =
        Number.isFinite(el.duration) && el.duration > 0 ? el.duration : estimatedSessionSeconds;
      setPlayback({ current: el.currentTime, duration: dur });
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [sessionAudioUrl, estimatedSessionSeconds]);

  useEffect(() => {
    if (busyKind !== "stream") {
      streamStartRef.current = null;
      return;
    }
    streamStartRef.current = Date.now();
    setStreamElapsed(0);
    const id = window.setInterval(() => {
      if (streamStartRef.current) {
        setStreamElapsed(Math.floor((Date.now() - streamStartRef.current) / 1000));
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [busyKind]);

  useEffect(() => {
    const el = audioRef.current;
    if (el && sessionAudioUrl) el.volume = 0.88;
  }, [sessionAudioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!sessionAudioUrl || !el) return;
    el.load();
    void el.play().catch(() => {
      /* Autoplay may be blocked until user gesture; Play button remains available. */
    });
  }, [sessionAudioUrl]);

  const resetToCompose = () => {
    revokeSessionUrl();
    setView("compose");
    setScript(null);
    setError(null);
    setAudioActive(false);
    setPlaying(false);
    setBusyKind(null);
    setStreamChunkPlayed(0);
    setAudioTruncated(false);
    setStreamOpen(false);
    setPlayback({ current: 0, duration: 0 });
    setSessionComplete(false);
    setStreamChunkTotal(0);
    setStreamElapsed(0);
  };

  const sessionProgressView = useMemo(() => {
    const total =
      playback.duration > 0 ? playback.duration : estimatedSessionSeconds;
    if (sessionComplete) {
      return { ratio: 1, elapsed: total, total, complete: true };
    }
    if (sessionAudioUrl) {
      const ratio = total > 0 ? playback.current / total : 0;
      return { ratio, elapsed: playback.current, total, complete: false };
    }
    if (busyKind === "stream") {
      const chunkRatio =
        streamChunkTotal > 0 ? Math.min(1, streamChunkPlayed / streamChunkTotal) : 0;
      const timeRatio = total > 0 ? Math.min(1, streamElapsed / total) : 0;
      return {
        ratio: Math.min(1, Math.max(chunkRatio, timeRatio)),
        elapsed: streamElapsed,
        total,
        complete: false,
      };
    }
    return null;
  }, [
    sessionComplete,
    sessionAudioUrl,
    playback,
    estimatedSessionSeconds,
    busyKind,
    streamChunkTotal,
    streamChunkPlayed,
    streamElapsed,
  ]);

  const onPrepareWords = async () => {
    setError(null);
    revokeSessionUrl();
    setAudioTruncated(false);
    if (context.trim().length < MIN_CONTEXT) {
      setError(t.errMinChars(MIN_CONTEXT));
      return;
    }
    setBusyKind("script");
    try {
      const data = await postJson<ScriptResponse>("/api/v1/meditation/script", {
        context: context.trim(),
        locale,
      });
      setScript(data.script);
      setSessionComplete(false);
      setPlayback({ current: 0, duration: 0 });
      setStreamOpen(true);
      setView("listen");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errGeneric);
    } finally {
      setBusyKind(null);
    }
  };

  const onBeginSession = async () => {
    setError(null);
    revokeSessionUrl();
    setAudioTruncated(false);
    if (context.trim().length < MIN_CONTEXT) {
      setError(t.errMinChars(MIN_CONTEXT));
      return;
    }
    setBusyKind("session");
    try {
      const sessionBody: {
        context: string;
        locale: typeof locale;
        voice_preset?: string;
      } = {
        context: context.trim(),
        locale,
      };
      if (voicePreset !== "default") {
        sessionBody.voice_preset = voicePreset;
      }
      const data = await postJson<SessionResponse>("/api/v1/meditation/session", sessionBody);
      setScript(data.script);
      setSessionComplete(false);
      setPlayback({ current: 0, duration: 0 });
      setAudioTruncated(data.audio_truncated);
      setStreamOpen(false);
      const bin = atob(data.audio_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      setSessionAudioUrl(URL.createObjectURL(blob));
      setView("listen");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errGeneric);
    } finally {
      setBusyKind(null);
    }
  };

  const onStreamVoice = async () => {
    if (!script?.trim()) return;
    setError(null);
    setStreamChunkPlayed(0);
    setStreamChunkTotal(0);
    setSessionComplete(false);
    setBusyKind("stream");
    setAudioActive(true);
    try {
      await streamSpeechSentences(script, voicePreset === "default" ? undefined : voicePreset, {
        onMetadata: (count) => setStreamChunkTotal(count),
        onChunk: (index) => {
          setStreamChunkPlayed((p) => Math.max(p, index + 1));
        },
      });
      setSessionComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errStream);
    } finally {
      setBusyKind(null);
      setStreamChunkPlayed(0);
      setStreamChunkTotal(0);
      setAudioActive(false);
    }
  };

  const togglePlayback = () => {
    const el = audioRef.current;
    if (!el || !sessionAudioUrl) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const sphereBreathing =
    view === "compose" ? busy : !!(audioActive || busy);

  const apiBlocked = connectivity !== "ready";

  return (
    <div className="flex flex-1 flex-col">
      <audio ref={audioRef} src={sessionAudioUrl ?? undefined} className="hidden" preload="auto" />

      {view === "compose" && connectivity === "checking" && (
        <div
          role="status"
          className="zen-view-in mx-auto mb-6 w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 text-center shadow-sm"
        >
          <p className="text-sm font-normal leading-relaxed tracking-wide text-slate-600">{t.apiChecking}</p>
        </div>
      )}

      {view === "compose" && connectivity === "offline" && (
        <div
          role="status"
          className="zen-view-in mx-auto mb-6 w-full max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-center shadow-sm"
        >
          <p className="text-sm font-normal leading-relaxed tracking-wide text-amber-950">{t.apiOffline}</p>
          <button
            type="button"
            className="mt-4 rounded-full border border-amber-300/80 bg-white/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-900 transition-all duration-1000 hover:bg-white"
            onClick={() => void refreshApiStatus()}
          >
            {t.apiRetry}
          </button>
        </div>
      )}

      {view === "compose" && connectivity === "misconfigured" && (
        <div
          role="status"
          className="zen-view-in mx-auto mb-6 w-full max-w-xl rounded-2xl border border-violet-200/90 bg-violet-50/90 px-5 py-4 text-center shadow-sm"
        >
          <p className="text-sm font-normal leading-relaxed tracking-wide text-violet-950">{t.apiMisconfigured}</p>
          <button
            type="button"
            className="mt-4 rounded-full border border-violet-300/80 bg-white/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-violet-900 transition-all duration-1000 hover:bg-white"
            onClick={() => void refreshApiStatus()}
          >
            {t.apiRetry}
          </button>
        </div>
      )}

      {view === "compose" && (
        <div
          key="compose"
          className="zen-view-in flex flex-1 flex-col items-center transition-opacity duration-1000 ease-out"
        >
          <VoiceSphere breathing={sphereBreathing} dimmed={false} />

          <div className="glass-panel mt-2 w-full max-w-xl px-9 py-10 md:px-12 md:py-14">
            <h1 className="text-center text-lg font-semibold leading-snug tracking-wide text-slate-700 md:text-xl">
              {greeting}
            </h1>
            <label
              htmlFor="context"
              className="mt-10 block text-center text-sm font-normal tracking-wide text-slate-500"
            >
              {t.contextLabel}
            </label>
            <textarea
              id="context"
              rows={5}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t.contextPlaceholder}
              className="mt-8 w-full resize-none rounded-2xl border border-slate-200/90 bg-white/70 px-6 py-6 text-base font-normal tracking-wide text-slate-700 shadow-inner outline-none backdrop-blur-md transition-[box-shadow,border-color,opacity] duration-1000 ease-out placeholder:text-slate-400 focus:border-emerald-300/80 focus:shadow-[0_0_0_3px_rgba(167,243,208,0.35)]"
            />

            <div className="mt-10 flex flex-col gap-6 md:mt-12">
              <label className="sr-only" htmlFor="voice">
                {t.voiceSr}
              </label>
              <select
                id="voice"
                value={voicePreset}
                onChange={(e) => setVoicePreset(e.target.value)}
                disabled={busy || apiBlocked}
                className="w-full cursor-pointer rounded-2xl border border-slate-200/90 bg-white/65 px-6 py-4 text-sm font-normal tracking-wide text-slate-600 shadow-sm backdrop-blur-md transition-all duration-1000 ease-out focus:border-emerald-300/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="default">{t.voiceDefaultOption}</option>
                {presets.map((p) => (
                  <option key={p.preset} value={p.preset}>
                    {p.preset.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={busy || apiBlocked}
                onClick={() => void onBeginSession()}
                className="w-full rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-50/95 via-white/90 to-sky-50/90 px-8 py-5 text-sm font-semibold tracking-[0.14em] text-slate-700 shadow-sm transition-all duration-1000 ease-out hover:border-emerald-400/60 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? t.beginBusy : t.begin}
              </button>
              <p className="text-center text-xs font-normal tracking-wide text-slate-400">{t.sessionLengthHint}</p>

              <button
                type="button"
                disabled={busy || apiBlocked}
                onClick={() => void onPrepareWords()}
                className="text-center text-sm font-normal tracking-wide text-slate-500 underline-offset-[10px] transition-colors duration-1000 ease-out hover:text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.wordsOnly}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "listen" && script && (
        <div
          key="listen"
          className="zen-view-in flex flex-1 flex-col items-center transition-opacity duration-1000 ease-out"
        >
          <VoiceSphere breathing={sphereBreathing} dimmed={busy && !audioActive} />

          <div className="glass-panel mt-4 w-full max-w-xl px-9 py-10 md:mt-6 md:px-12 md:py-14">
            {sessionProgressView && (
              <SessionProgress
                t={t}
                ratio={sessionProgressView.ratio}
                elapsedSeconds={sessionProgressView.elapsed}
                totalSeconds={sessionProgressView.total}
                complete={sessionProgressView.complete}
                detail={
                  busyKind === "stream" && streamChunkTotal > 0
                    ? t.sessionStreamDetail(
                        Math.min(streamChunkPlayed, streamChunkTotal),
                        streamChunkTotal,
                      )
                    : null
                }
              />
            )}

            <article className="max-h-[min(48vh,28rem)] overflow-y-auto whitespace-pre-wrap text-center text-[0.95rem] font-normal leading-relaxed tracking-wide text-slate-600 md:text-base">
              {script}
            </article>

            {audioTruncated && (
              <p
                role="status"
                className="mt-6 text-center text-xs font-normal leading-relaxed tracking-wide text-amber-800/90"
              >
                {t.audioTruncated}
              </p>
            )}

            {!sessionAudioUrl && (
              <p className="mt-8 text-center text-sm font-normal leading-relaxed tracking-wide text-slate-500">
                {t.wordsOnlyListen}
              </p>
            )}

            {!sessionAudioUrl && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={busy || apiBlocked}
                  onClick={() => void onStreamVoice()}
                  className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-50/95 via-white/90 to-sky-50/90 px-8 py-4 text-sm font-semibold tracking-[0.12em] text-slate-700 shadow-sm transition-all duration-1000 ease-out hover:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busyKind === "stream" ? t.progressStream : t.streamVoice}
                </button>
              </div>
            )}

            {sessionAudioUrl && (
              <div className="mt-12 flex justify-center md:mt-14">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="flex h-14 min-w-[5.5rem] items-center justify-center rounded-full border border-slate-200/90 bg-white/80 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-md backdrop-blur-xl transition-all duration-1000 ease-out hover:border-emerald-300/80 hover:bg-white"
                  aria-label={playing ? t.pause : t.play}
                >
                  {playing ? t.pause : t.play}
                </button>
              </div>
            )}

            <details
              className="glass-panel-subtle mt-10 px-6 py-5 transition-all duration-1000 ease-out md:mt-12 md:px-8 md:py-6"
              open={streamOpen}
              onToggle={(e) => setStreamOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="cursor-pointer list-none text-center text-xs font-semibold tracking-[0.18em] text-slate-500 transition-colors duration-1000 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                {t.listenAlt}
              </summary>
              <p className="mt-6 text-center text-xs font-normal leading-relaxed tracking-wide text-slate-500">
                {t.listenHint}
              </p>
              <button
                type="button"
                disabled={busy || apiBlocked}
                onClick={() => void onStreamVoice()}
                className="mt-6 w-full rounded-2xl border border-slate-200/80 bg-white/55 py-4 text-xs font-normal tracking-wide text-slate-500 backdrop-blur-md transition-all duration-1000 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t.streamVoice}
              </button>
            </details>

            <div className="mt-12 flex justify-center md:mt-14">
              <button
                type="button"
                onClick={resetToCompose}
                className="text-sm font-normal tracking-[0.14em] text-slate-500 transition-colors duration-1000 ease-out hover:text-slate-700"
              >
                {t.return}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="glass-panel-subtle mx-auto mt-10 max-w-xl border border-rose-200/80 bg-rose-50/90 px-8 py-5 text-center text-sm font-normal tracking-wide text-rose-800 transition-all duration-1000"
          role="alert"
        >
          {error}
        </div>
      )}

      {busyKind && !error && (
        <div
          className="mx-auto mt-8 w-full max-w-md px-4 text-center transition-opacity duration-1000"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-xs font-normal tracking-[0.2em] text-slate-500">
            {busyKind === "script" && t.progressScript}
            {busyKind === "session" && t.progressSession}
            {busyKind === "stream" &&
              (streamChunkPlayed > 0 ? t.progressStreamChunk(streamChunkPlayed) : t.progressStream)}
          </p>
          <div className="zen-progress-track" aria-hidden>
            <div className="zen-progress-fill" />
          </div>
        </div>
      )}
    </div>
  );
}
