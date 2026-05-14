"use client";

import { useLocale } from "@/components/LocaleProvider";
import type { AppLocale } from "@/lib/i18n";

/**
 * zenit — minimal wordmark + locale toggle (en default, ko).
 */
export default function ZenBar() {
  const { locale, setLocale } = useLocale();

  const pill = (code: AppLocale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition-all duration-1000 ease-out ${
        locale === code
          ? "bg-emerald-600/15 text-emerald-800"
          : "text-slate-500 hover:text-slate-700"
      }`}
      aria-pressed={locale === code}
      aria-label={code === "en" ? "English" : "Korean"}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-[#e8ecf4]/85 backdrop-blur-xl transition-colors duration-1000 ease-out">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-6 md:h-16 md:px-14 lg:px-16">
        <span className="text-[0.95rem] font-semibold lowercase tracking-widest text-slate-600 md:text-base">
          zenit
        </span>
        <div
          className="flex items-center gap-0.5 rounded-full border border-white/60 bg-white/40 p-0.5 shadow-sm"
          role="group"
          aria-label="Language"
        >
          {pill("en", "EN")}
          {pill("ko", "KO")}
        </div>
      </div>
    </header>
  );
}
