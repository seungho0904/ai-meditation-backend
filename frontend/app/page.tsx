import ZenBar from "@/components/ZenBar";
import MeditationClient from "@/components/MeditationClient";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e8ecf4]">
      {/* Soft ambient — dawn, not night */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-90 transition-opacity duration-1000 ease-out"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[68vh] w-[68vw] rounded-full bg-emerald-200/35 blur-[100px]" />
        <div className="absolute -right-1/4 bottom-0 h-[58vh] w-[58vw] rounded-full bg-sky-200/30 blur-[95px]" />
        <div className="absolute left-1/2 top-1/2 h-[42vh] w-[42vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100/25 blur-[85px]" />
      </div>

      <div className="zen-noise" aria-hidden>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" preserveAspectRatio="none">
          <filter id="zenNoiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#zenNoiseFilter)" />
        </svg>
      </div>

      <ZenBar />
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col px-6 py-10 md:min-h-[calc(100vh-4rem)] md:px-14 md:py-14 lg:px-16 lg:py-16">
        <MeditationClient />
      </main>
    </div>
  );
}
