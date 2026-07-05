import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech } from "@/services/ai/openrouter-tts";

export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string().min(1).max(15000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const audio = await synthesizeSpeech(parsed.data.text);
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
