import { chatRequestSchema, type ChatMessage } from "@/lib/chat-types";
import { intentSchema } from "@/lib/intent-schema";
import { mergeIntent, parseMessage } from "@/lib/parse-intent";
import type { ExperienceResult, IntentQuery } from "@/lib/types";
import { extractIntent } from "@/services/ai/intent-extractor";
import { runExperience } from "@/services/experience/engine";
import { planRoute, type RouteResponse } from "@/services/routing/route-planner";

export type IntentSource = "llm" | "heuristic";

export interface IntegratedChatResult {
  reply: string;
  intent: IntentQuery;
  result: ExperienceResult;
  route: RouteResponse | null;
  intentSource: IntentSource;
}

const integratedChatSchema = chatRequestSchema.extend({
  intent: intentSchema.optional(),
});

function describeStops(result: ExperienceResult): string {
  const stops = result.itinerary.stops;
  if (!stops.length) {
    return "I couldn't find spots matching that nearby — try widening the walk radius.";
  }
  return stops.map((s, i) => `${i + 1}. ${s.name}`).join("  ·  ");
}

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
    parts.push(`${experience.emoji} ${experience.name} it is. ${describeStops(result)}.`);
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
    parts.push("Heads up: that runs past your time budget even trimmed down.");
  }

  return parts.join(" ");
}

async function resolveIntentPatch(
  message: string,
  history: ChatMessage[] | undefined,
  context: { lat?: number; lon?: number } | undefined
): Promise<{ patch: Partial<IntentQuery>; source: IntentSource }> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const llmIntent = await extractIntent({ message, history, context });
      return { patch: llmIntent, source: "llm" };
    } catch (error) {
      console.warn("LLM intent extraction failed, falling back to heuristics:", error);
    }
  }

  return { patch: parseMessage(message), source: "heuristic" };
}

export async function runIntegratedChat(body: unknown): Promise<IntegratedChatResult> {
  const parsed = integratedChatSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`Invalid chat payload: ${parsed.error.message}`);
  }

  const { message, history, context, intent: previousIntent } = parsed.data;
  const { patch, source } = await resolveIntentPatch(message, history, context);
  const intent = mergeIntent(previousIntent, patch);

  const result = await runExperience(intent);

  let route: RouteResponse | null = null;
  if (result.mapState.routeWaypoints.length >= 2) {
    try {
      route = await planRoute({
        waypoints: result.mapState.routeWaypoints,
        profile: "walking",
        accessible: intent.accessibility,
      });
    } catch {
      route = null;
    }
  }

  return {
    reply: buildReply(result, patch, intent),
    intent,
    result,
    route,
    intentSource: source,
  };
}
