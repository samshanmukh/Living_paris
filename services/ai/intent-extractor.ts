import { intentSchema, type IntentInput } from "@/lib/intent-schema";
import { PARIS_CENTER } from "@/lib/constants";
import type { ChatMessage } from "@/lib/chat-types";
import { chatCompletion } from "./openrouter";
import { INTENT_RETRY_PROMPT, INTENT_SYSTEM_PROMPT } from "./prompts";

export interface ExtractIntentOptions {
  message: string;
  history?: ChatMessage[];
  context?: { lat?: number; lon?: number };
}

function mergeContext(
  intent: IntentInput,
  context?: { lat?: number; lon?: number }
): IntentInput {
  const merged = { ...intent };
  if (merged.lat == null && context?.lat != null) merged.lat = context.lat;
  if (merged.lon == null && context?.lon != null) merged.lon = context.lon;
  if (merged.lat == null && merged.lon == null) {
    merged.lat = PARIS_CENTER[1];
    merged.lon = PARIS_CENTER[0];
  }
  return merged;
}

function parseIntentJson(raw: string): IntentInput | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = intentSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function extractIntent(
  options: ExtractIntentOptions
): Promise<IntentInput> {
  const historyMessages =
    options.history?.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })) ?? [];

  const messages = [
    { role: "system" as const, content: INTENT_SYSTEM_PROMPT },
    ...historyMessages,
    { role: "user" as const, content: options.message },
  ];

  let raw = await chatCompletion({ messages, jsonMode: true });
  let intent = parseIntentJson(raw);

  if (!intent) {
    raw = await chatCompletion({
      messages: [
        ...messages,
        { role: "assistant", content: raw },
        { role: "user", content: INTENT_RETRY_PROMPT },
      ],
      jsonMode: true,
    });
    intent = parseIntentJson(raw);
  }

  if (!intent) {
    intent = { mood: "general" };
  }

  return mergeContext(intent, options.context);
}
