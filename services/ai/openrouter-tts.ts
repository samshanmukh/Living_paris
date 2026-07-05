const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const DEFAULT_TTS_MODEL = "x-ai/grok-voice-tts-1.0";
const DEFAULT_VOICE = "Ara";

export function getOpenRouterTtsModel(): string {
  return process.env.OPENROUTER_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL;
}

export function getOpenRouterTtsVoice(): string {
  return process.env.OPENROUTER_TTS_VOICE?.trim() || DEFAULT_VOICE;
}

/** Synthesize speech via OpenRouter → Grok Voice TTS. Returns MP3 bytes. */
export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const input = text.trim().slice(0, 15000);
  if (!input) {
    throw new Error("Text is empty");
  }

  const res = await fetch(OPENROUTER_SPEECH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Living Paris",
    },
    body: JSON.stringify({
      model: getOpenRouterTtsModel(),
      input,
      voice: getOpenRouterTtsVoice(),
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenRouter TTS failed (${res.status}): ${detail}`);
  }

  return res.arrayBuffer();
}
