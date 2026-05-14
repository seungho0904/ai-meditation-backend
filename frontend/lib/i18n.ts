export type AppLocale = "en" | "ko";

const STORAGE_KEY = "zenit-locale";

export function envDefaultLocale(): AppLocale {
  const v = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim().toLowerCase();
  return v === "ko" ? "ko" : "en";
}

export function readStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const s = window.localStorage.getItem(STORAGE_KEY);
  if (s === "en" || s === "ko") return s;
  return null;
}

export function writeStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
}

export const greetings: Record<AppLocale, readonly [string, string]> = {
  en: [
    "What has stirred you today?",
    "This is a good moment to pause.",
  ],
  ko: [
    "오늘 당신을 소란스럽게 만든 것은 무엇인가요?",
    "잠시 멈춰 서기에 가장 좋은 시간입니다.",
  ],
};

export const ui = {
  en: {
    contextLabel: "What feels closest to you right now?",
    contextPlaceholder:
      "You do not need to be precise. One honest breath of truth is enough.",
    voiceSr: "Voice",
    voiceDefaultOption: "Gentle · default voice",
    begin: "Begin",
    beginBusy: "Gathering stillness",
    wordsOnly: "Words only",
    listenAlt: "Another way to listen",
    listenHint: "One sentence at a time — a slower unfolding of sound.",
    streamVoice: "Stream voice",
    return: "Return",
    play: "Play",
    pause: "Pause",
    errMinChars: (n: number) => `A few more words — at least ${n} characters.`,
    errGeneric: "Something slowed us down. Please try again.",
    errStream: "The listening path paused.",
  },
  ko: {
    contextLabel: "지금 마음에 가장 가까이 있는 것을 적어 주세요.",
    contextPlaceholder: "정확할 필요 없습니다. 솔직한 한 숨만으로 충분합니다.",
    voiceSr: "음성",
    voiceDefaultOption: "부드러움 · 기본 음성",
    begin: "시작하기",
    beginBusy: "명상을 준비하고 있어요",
    wordsOnly: "글만 받기",
    listenAlt: "다른 방식으로 듣기",
    listenHint: "한 문장씩, 더 천천히 펼쳐지는 소리입니다.",
    streamVoice: "음성 스트리밍",
    return: "돌아가기",
    play: "재생",
    pause: "일시정지",
    errMinChars: (n: number) => `조금만 더 적어 주세요. 최소 ${n}자입니다.`,
    errGeneric: "잠시 느려졌습니다. 다시 시도해 주세요.",
    errStream: "듣기 경로가 잠시 멈췄습니다.",
  },
} as const;

export type UiCopy = (typeof ui)[AppLocale];
