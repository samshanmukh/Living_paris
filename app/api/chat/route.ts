import { NextRequest, NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/chat-types";
import { formatZodError } from "@/lib/format-zod-error";
import { handleChat } from "@/services/ai/chat-orchestrator";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  try {
    const result = await handleChat(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    const message = error instanceof Error ? error.message : "Chat request failed";
    const isOpenRouter = message.includes("OPENROUTER");
    const isSpatial = message.includes("Spatial query failed");

    if (isOpenRouter) {
      return NextResponse.json(
        { error: message, hint: "Set OPENROUTER_API_KEY in .env.local" },
        { status: 502 }
      );
    }

    if (isSpatial) {
      return NextResponse.json(
        {
          error: message,
          hint: "Run `npm run dev:api` and `npm run upload-data` first",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/chat",
    description:
      "Natural language in → Grok intent → spatial query → message + mapState for UI and maps",
    exampleBody: {
      message: "Plan a romantic evening under 60 euros",
      context: { lat: 48.8566, lon: 2.3522 },
    },
    responseShape: {
      message: "string — chat bubble text",
      intent: "IntentInput — see lib/intent-schema.ts",
      mapState: "ChatMapState — center, activeLayers, highlights, theme",
    },
  });
}
