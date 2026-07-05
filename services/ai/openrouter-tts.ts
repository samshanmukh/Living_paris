import { getOpenRouterClient } from "./openrouter";

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
  const input = text.trim().slice(0, 15000);
  if (!input) {
    throw new Error("Text is empty");
  }

  const response = await getOpenRouterClient().audio.speech.create({
    model: getOpenRouterTtsModel(),
    input,
    voice: getOpenRouterTtsVoice(),
    response_format: "mp3",
  });

  return response.arrayBuffer();
}
