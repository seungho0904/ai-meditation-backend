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
    sessionLengthHint: "About 3–5 minutes · calm pace for beginners",
    sessionInProgress: "Session in progress",
    sessionComplete: "Session complete",
    sessionTimer: (elapsed: string, total: string) => `${elapsed} / ${total}`,
    sessionStreamDetail: (current: number, total: number) => `Sentence ${current} of ${total}`,
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
    apiOffline:
      "Cannot reach the meditation API. Start the backend on port 8000, then use “Retry” or switch back to this tab.",
    apiRetry: "Retry connection",
    apiMisconfigured:
      "The API is running, but OpenAI/Anthropic or ElevenLabs keys are missing in the server `.env`. Add your keys there (they are not stored in git) and restart uvicorn.",
    apiChecking: "Checking connection to the meditation API…",
    audioTruncated: "The voice was shortened to fit provider limits. You can still read the full script above.",
    wordsOnlyListen: "Your words are ready. Stream the voice below, or return to start a full session with audio.",
    progressScript: "Writing your meditation…",
    progressSession: "Preparing voice and script…",
    progressStream: "Streaming audio…",
    progressStreamChunk: (n: number) => `Playing sentence ${n}…`,
  },
  ko: {
    contextLabel: "지금 마음에 가장 가까이 있는 것을 적어 주세요.",
    contextPlaceholder: "정확할 필요 없습니다. 솔직한 한 숨만으로 충분합니다.",
    voiceSr: "음성",
    voiceDefaultOption: "부드러움 · 기본 음성",
    begin: "시작하기",
    beginBusy: "명상을 준비하고 있어요",
    sessionLengthHint: "약 3–5분 · 초보자도 편한 속도",
    sessionInProgress: "세션 진행 중",
    sessionComplete: "세션 완료",
    sessionTimer: (elapsed: string, total: string) => `${elapsed} / ${total}`,
    sessionStreamDetail: (current: number, total: number) => `${total}문장 중 ${current}번째`,
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
    apiOffline:
      "명상 API에 연결할 수 없어요. 백엔드를 8000 포트로 실행한 뒤 「다시 연결」을 누르거나 이 탭으로 돌아와 주세요.",
    apiRetry: "다시 연결",
    apiMisconfigured:
      "API는 떠 있지만 서버 `.env`에 OpenAI/Anthropic 또는 ElevenLabs 키가 없어요. 키를 넣고(깃에는 올라가지 않습니다) uvicorn을 다시 실행해 주세요.",
    apiChecking: "명상 API 연결을 확인하고 있어요…",
    audioTruncated: "음성 제공 한도 때문에 목소리가 일부 잘렸어요. 위 글은 전체를 읽을 수 있습니다.",
    wordsOnlyListen: "글이 준비됐어요. 아래에서 음성을 스트리밍하거나, 돌아가서 전체 세션을 시작할 수 있어요.",
    progressScript: "명상 글을 쓰고 있어요…",
    progressSession: "목소리와 글을 준비하고 있어요…",
    progressStream: "소리를 이어 붙이고 있어요…",
    progressStreamChunk: (n: number) => `${n}번째 문장 재생 중…`,
  },
} as const;

export type UiCopy = (typeof ui)[AppLocale];
