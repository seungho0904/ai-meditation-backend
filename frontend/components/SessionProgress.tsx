"use client";

import { formatSessionClock } from "@/lib/sessionTiming";
import type { UiCopy } from "@/lib/i18n";

type SessionProgressProps = {
  t: UiCopy;
  /** 0–1 */
  ratio: number;
  elapsedSeconds: number;
  totalSeconds: number;
  complete?: boolean;
  /** e.g. stream sentence 2 of 8 */
  detail?: string | null;
};

export default function SessionProgress({
  t,
  ratio,
  elapsedSeconds,
  totalSeconds,
  complete = false,
  detail = null,
}: SessionProgressProps) {
  const pct = complete ? 100 : Math.min(100, Math.max(0, ratio * 100));
  const label = complete
    ? t.sessionComplete
    : t.sessionTimer(formatSessionClock(elapsedSeconds), formatSessionClock(totalSeconds));

  return (
    <div
      className="mt-8 w-full"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-3 text-xs font-normal tracking-[0.14em] text-slate-500">
        <span>{complete ? t.sessionComplete : t.sessionInProgress}</span>
        <span className="tabular-nums text-slate-600">
          {complete
            ? formatSessionClock(totalSeconds)
            : `${formatSessionClock(elapsedSeconds)} / ${formatSessionClock(totalSeconds)}`}
        </span>
      </div>
      <div className="zen-session-progress-track mt-3">
        <div className="zen-session-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {detail && !complete && (
        <p className="mt-2 text-center text-[0.65rem] font-normal tracking-wide text-slate-400">{detail}</p>
      )}
    </div>
  );
}
