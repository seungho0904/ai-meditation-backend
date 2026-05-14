"use client";

/**
 * zenit sphere — soft moon-pearl: bright center, sage edge, no dark “face” rings.
 */
export default function VoiceSphere({
  breathing,
  dimmed,
}: {
  breathing: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className="relative mx-auto flex w-full max-w-md items-center justify-center transition-opacity duration-1000 ease-out"
      style={{ paddingBlock: "clamp(3rem, 8vw, 6rem)" }}
    >
      <div
        className={`relative aspect-square w-[min(14rem,72vw)] md:w-[min(16rem,60vw)] ${
          breathing ? "voice-sphere-breath" : ""
        } ${dimmed ? "opacity-70" : "opacity-100"}`}
      >
        {/* Soft garden mist — pastel only */}
        <div
          className="absolute inset-[-50%] rounded-full bg-gradient-to-br from-emerald-100/50 via-sky-100/35 to-violet-100/25 blur-[64px] voice-sphere-aurora-shimmer"
          aria-hidden
        />
        <div
          className="absolute inset-[-28%] rounded-full bg-gradient-to-tr from-[#d4e8d0]/45 to-[#d0dcf0]/35 blur-[40px]"
          aria-hidden
        />

        {/* Light aurora ring — no deep navy */}
        <div
          className="absolute inset-[-10%] rounded-full opacity-75 voice-sphere-aurora"
          style={{
            background:
              "conic-gradient(from 200deg, rgba(196, 220, 190, 0.75), rgba(186, 210, 235, 0.65), rgba(210, 205, 235, 0.55), rgba(196, 220, 190, 0.7))",
          }}
          aria-hidden
        />

        {/* Single main orb: bright center → sage rim (reads as moon / breath, not a mask) */}
        <div
          className="absolute inset-[4%] rounded-full border border-white/70 shadow-[0_12px_40px_rgba(100,116,139,0.12),inset_0_-20px_40px_rgba(125,148,120,0.08)]"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, #ffffff 0%, #f4f7f4 28%, #e2ebe0 55%, #c5d6c0 78%, #b0c4ab 100%)",
          }}
          aria-hidden
        />

        {/* One soft sky tint on the lower-right — dimension without “eyes” */}
        <div
          className="pointer-events-none absolute inset-[18%] rounded-full opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 72% 78%, rgba(186, 210, 235, 0.35) 0%, transparent 55%)",
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
