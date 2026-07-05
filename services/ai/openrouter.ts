import OpenAI from "openai";

const DEFAULT_MODEL = "x-ai/grok-4.3";

export type ChatRole = "system" | "user" | "assistant";

export interface OpenRouterMessage {
  role: ChatRole;
  content: string;
}

let client: OpenAI | null = null;

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Living Paris",
      },
    });
  }

  return client;
}

export async function chatCompletion(options: {
  messages: OpenRouterMessage[];
  jsonMode?: boolean;
}): Promise<string> {
  const completion = await getOpenRouterClient().chat.completions.create({
    model: getOpenRouterModel(),
    messages: options.messages,
    temperature: 0.2,
    max_tokens: options.jsonMode ? 512 : 1024,
    ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty content");
  }

  return content;
}
