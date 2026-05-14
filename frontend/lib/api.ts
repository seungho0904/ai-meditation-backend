const base =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function postJson<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const r = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!r.ok) {
    const detail =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `HTTP ${r.status}`;
    throw new Error(detail);
  }
  return data as T;
}

export type ScriptResponse = {
  prompt_version: string;
  provider: string;
  model: string;
  script: string;
  locale: "en" | "ko";
};

export type SessionResponse = ScriptResponse & {
  audio_format: string;
  audio_base64: string;
  audio_truncated: boolean;
};

export type VoicePresetRow = {
  preset: string;
  voice_id: string;
  description: string;
};

export async function fetchVoicePresets(): Promise<VoicePresetRow[]> {
  const r = await fetch(apiUrl("/api/v1/meditation/voice-presets"));
  if (!r.ok) throw new Error(`voice-presets: ${r.status}`);
  const data = (await r.json()) as { presets: VoicePresetRow[] };
  return data.presets ?? [];
}

function playMp3Base64(b64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Audio playback failed"));
    };
    void audio.play().catch(reject);
  });
}

export async function streamSpeechSentences(
  script: string,
  voicePreset: string | undefined,
  onChunk: (index: number, text: string) => void,
): Promise<void> {
  const r = await fetch(apiUrl("/api/v1/meditation/speech-stream"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      script,
      voice_preset: voicePreset || undefined,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    try {
      const j = JSON.parse(t) as { detail?: string };
      throw new Error(j.detail ?? r.statusText);
    } catch {
      throw new Error(t || r.statusText);
    }
  }
  const reader = r.body?.getReader();
  if (!reader) throw new Error("No response body");

  const dec = new TextDecoder();
  let carry = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += dec.decode(value, { stream: true });
    const parts = carry.split("\n");
    carry = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const obj = JSON.parse(trimmed) as {
        type: string;
        index?: number;
        text?: string;
        audio_base64?: string;
      };
      if (obj.type === "chunk" && obj.audio_base64 && obj.text !== undefined) {
        onChunk(obj.index ?? 0, obj.text);
        await playMp3Base64(obj.audio_base64);
      }
    }
  }
  if (carry.trim()) {
    const obj = JSON.parse(carry.trim()) as {
      type: string;
      audio_base64?: string;
      text?: string;
      index?: number;
    };
    if (obj.type === "chunk" && obj.audio_base64) {
      onChunk(obj.index ?? 0, obj.text ?? "");
      await playMp3Base64(obj.audio_base64);
    }
  }
}
