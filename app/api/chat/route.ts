import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { intentSchema } from "@/lib/intent-schema";
import { mergeIntent, parseMessage } from "@/lib/parse-intent";
import type { ExperienceResult, IntentQuery } from "@/lib/types";
import { runExperience } from "@/services/experience/engine";
import { planRoute, type RouteResponse } from "@/services/routing/route-planner";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(600),
  /** Accumulated intent from previous turns (conversation memory). */
  intent: intentSchema.optional(),
});

function describeStops(result: ExperienceResult): string {
  const stops = result.itinerary.stops;
  if (!stops.length) {
    return "I couldn't find spots matching that nearby — try widening the walk radius.";
  }
  const names = stops.map((s, i) => `${i + 1}. ${s.name}`).join("  ·  ");
  return names;
}

/**
 * Templated reply generation.
 *
 * TEMPORARY: Member 3 (AI) replaces this + parseMessage with an OpenRouter
 * call. The response contract stays identical so the UI won't change.
 */
function buildReply(
  result: ExperienceResult,
  patch: Partial<IntentQuery>,
  intent: IntentQuery
): string {
  const { experience, itinerary } = result;
  const parts: string[] = [];

  if (patch.rainy) {
    parts.push(
      `Rain in Paris — noted. I moved everything under a roof: ${describeStops(result)}.`
    );
  } else if (patch.timeBudget != null) {
    parts.push(
      `With ${patch.timeBudget} minutes, here's the tight version: ${describeStops(result)}. About ${itinerary.totalDurationMinutes} minutes door to door.`
    );
  } else if (patch.dietary?.length) {
    parts.push(
      `Good to know — I reshuffled for ${patch.dietary.join(" and ")} options: ${describeStops(result)}.`
    );
  } else {
    parts.push(
      `${experience.emoji} ${experience.name} it is. ${describeStops(result)}.`
    );
  }

  if (!patch.timeBudget) {
    parts.push(
      `~${itinerary.totalWalkMinutes} min of walking, ${itinerary.totalDurationMinutes} min all in.`
    );
  }

  if (intent.budget != null && !patch.rainy && !patch.dietary?.length) {
    parts.push(`Everything fits under €${intent.budget}.`);
  }

  if (!itinerary.fitsTimeBudget) {
    parts.push(`Heads up: that runs past your time budget even trimmed down.`);
  }

  return parts.join(" ");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, intent: previousIntent } = parsed.data;

  const patch = parseMessage(message);
  const intent = mergeIntent(previousIntent, patch);

  try {
    const result = await runExperience(intent);

    // Resolve the walking route server-side so the map can draw immediately.
    let route: RouteResponse | null = null;
    if (result.mapState.routeWaypoints.length >= 2) {
      try {
        route = await planRoute({
          waypoints: result.mapState.routeWaypoints,
          profile: "walking",
        });
      } catch {
        route = null;
      }
    }

    return NextResponse.json({
      reply: buildReply(result, patch, intent),
      intent,
      understood: patch,
      result,
      route,
    });
  } catch (error) {
    console.error("POST /api/chat failed:", error);
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
      "Conversational endpoint: message + accumulated intent in, reply + experience + route out. Parsing/reply are heuristic placeholders for the AI team (Member 3) to replace with OpenRouter — the response contract must stay the same.",
    exampleBody: {
      message: "I'm taking my girlfriend on a first date tonight, under €60",
      intent: {},
    },
    responseShape: {
      reply: "string — Paris's answer for the chat",
      intent: "merged conversation intent (send back on the next turn)",
      understood: "what this turn changed",
      result: "ExperienceResult — mapState, itinerary, recommendations",
      route: "RouteResponse | null — walking route geometry + cameraPath",
    },
  });
}
