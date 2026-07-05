import { NextRequest, NextResponse } from "next/server";
import { formatZodError } from "@/lib/format-zod-error";
import { chatRequestSchema } from "@/lib/chat-types";
import { intentSchema } from "@/lib/intent-schema";
import { EXPERIENCE_LIST } from "@/services/experience/modes";
import { runIntegratedChat } from "@/services/chat/pipeline";

export const maxDuration = 60;

const integratedChatSchema = chatRequestSchema.extend({
  intent: intentSchema.optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = integratedChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  try {
    const result = await runIntegratedChat(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    const message = error instanceof Error ? error.message : "Chat request failed";

    if (message.startsWith("Invalid chat payload")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("OPENROUTER")) {
      return NextResponse.json(
        { error: message, hint: "Set OPENROUTER_API_KEY in .env.local" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Chat pipeline failed",
        hint: "Run `npm run fetch-data` to prepare GeoJSON datasets",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/chat",
    description:
      "Natural language in → LLM/heuristic intent → Experience Engine → reply + mapState + itinerary + route",
    pipeline: ["intent extraction (OpenRouter or heuristics)", "runExperience()", "planRoute()"],
    modes: EXPERIENCE_LIST.map((m) => ({
      id: m.id,
      name: m.name,
      emoji: m.emoji,
      theme: m.theme,
    })),
    exampleBody: {
      message: "Plan a romantic evening under 60 euros",
      intent: {},
      history: [],
      context: { lat: 48.8566, lon: 2.3522 },
    },
    responseShape: {
      reply: "string — Paris's answer for the chat",
      intent: "merged conversation intent (send back on the next turn)",
      result: "ExperienceResult — mapState, itinerary, recommendations",
      route: "RouteResponse | null — walking route geometry",
      intentSource: "'llm' | 'heuristic'",
    },
  });
}
