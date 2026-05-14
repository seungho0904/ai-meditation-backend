"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import VoiceSphere from "@/components/VoiceSphere";
import {
  fetchVoicePresets,
  postJson,
  streamSpeechSentences,
  type ScriptResponse,
  type SessionResponse,
  type VoicePresetRow,
} from "@/lib/api";
import { greetings } from "@/lib/i18n";

const MIN_CONTEXT = 10;

type View = "compose" | "listen";

export default function MeditationClient() {
  const { locale, t } = useLocale();
  const [view, setView] = useState<View>("compose");
  const [context, setContext] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | null>(null);
  const [presets, setPresets] = useState<VoicePresetRow[]>([]);
  const [voicePreset, setVoicePreset] = useState<string>("bella_style");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioActive, setAudioActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [streamOpen, setStreamOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const greeting = useMemo(() => {
    const pair = greetings[locale];
    return pair[Math.floor(Math.random() * pair.length)]!;
  }, [locale]);

  useEffect(() => {
    fetchVoicePresets()
      .then(setPresets)
      .catch(() => setPresets([]));
  }, []);

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
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [sessionAudioUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (el && sessionAudioUrl) el.volume = 0.88;
  }, [sessionAudioUrl]);

  const resetToCompose = () => {
    revokeSessionUrl();
    setView("compose");
    setScript(null);
    setError(null);
    setAudioActive(false);
    setPlaying(false);
  };

  const onPrepareWords = async () => {
    setError(null);
    revokeSessionUrl();
    if (context.trim().length < MIN_CONTEXT) {
      setError(t.errMinChars(MIN_CONTEXT));
      return;
    }
    setBusy("…");
    try {
      const data = await postJson<ScriptResponse>("/api/v1/meditation/script", {
        context: context.trim(),
        locale,
      });
      setScript(data.script);
      setView("listen");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errGeneric);
    } finally {
      setBusy(null);
    }
  };

  const onBeginSession = async () => {
    setError(null);
    revokeSessionUrl();
    if (context.trim().length < MIN_CONTEXT) {
      setError(t.errMinChars(MIN_CONTEXT));
      return;
    }
    setBusy("…");
    try {
      const data = await postJson<SessionResponse>("/api/v1/meditation/session", {
        context: context.trim(),
        locale,
      });
      setScript(data.script);
      const bin = atob(data.audio_base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      setSessionAudioUrl(URL.createObjectURL(blob));
      setView("listen");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errGeneric);
    } finally {
      setBusy(null);
    }
  };

  const onStreamVoice = async () => {
    if (!script?.trim()) return;
    setError(null);
    setBusy("…");
    setAudioActive(true);
    try {
      await streamSpeechSentences(
        script,
        voicePreset === "default" ? undefined : voicePreset,
        () => {},
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errStream);
    } finally {
      setBusy(null);
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
    view === "compose" ? !!busy : !!(audioActive || busy);

  return (
    <div className="flex flex-1 flex-col">
      <audio ref={audioRef} src={sessionAudioUrl ?? undefined} className="hidden" preload="auto" />

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
                disabled={!!busy}
                className="w-full cursor-pointer rounded-2xl border border-slate-200/90 bg-white/65 px-6 py-4 text-sm font-normal tracking-wide text-slate-600 shadow-sm backdrop-blur-md transition-all duration-1000 ease-out focus:border-emerald-300/70 focus:outline-none disabled:opacity-50"
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
                disabled={!!busy}
                onClick={() => void onBeginSession()}
                className="w-full rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-50/95 via-white/90 to-sky-50/90 px-8 py-5 text-sm font-semibold tracking-[0.14em] text-slate-700 shadow-sm transition-all duration-1000 ease-out hover:border-emerald-400/60 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy ? t.beginBusy : t.begin}
              </button>

              <button
                type="button"
                disabled={!!busy}
                onClick={() => void onPrepareWords()}
                className="text-center text-sm font-normal tracking-wide text-slate-500 underline-offset-[10px] transition-colors duration-1000 ease-out hover:text-emerald-700 hover:underline disabled:opacity-40"
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
          <VoiceSphere breathing={sphereBreathing} dimmed={!!busy && !audioActive} />

          <div className="glass-panel mt-4 w-full max-w-xl px-9 py-10 md:mt-6 md:px-12 md:py-14">
            <article className="max-h-[min(48vh,28rem)] overflow-y-auto whitespace-pre-wrap text-center text-[0.95rem] font-normal leading-relaxed tracking-wide text-slate-600 md:text-base">
              {script}
            </article>

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
                disabled={!!busy}
                onClick={() => void onStreamVoice()}
                className="mt-6 w-full rounded-2xl border border-slate-200/80 bg-white/55 py-4 text-xs font-normal tracking-wide text-slate-500 backdrop-blur-md transition-all duration-1000 hover:bg-white/80 disabled:opacity-40"
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

      {busy && !error && (
        <p className="mt-8 text-center text-xs font-normal tracking-[0.28em] text-slate-400 transition-opacity duration-1000">
          …
        </p>
      )}
    </div>
  );
}
