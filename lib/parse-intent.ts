import type { IntentQuery, LayerType, MoodType } from "./types";
import { detectPersonaFromMessage } from "@/services/persona/resolve-persona";

/**
 * Heuristic natural-language → intent parser.
 *
 * TEMPORARY: this is the demo fallback until Member 3 (AI) replaces the
 * parsing step inside /api/chat with an OpenRouter LLM call. The contract —
 * message + previous intent in, merged intent out — must stay the same.
 *
 * Each turn PATCHES the accumulated intent (conversation memory) rather than
 * replacing it: "it's raining" keeps the romantic date context from turn 1.
 */

const MOOD_PATTERNS: [RegExp, MoodType][] = [
  [/date|romantic|girlfriend|boyfriend|partner|anniversary|proposal/i, "romantic"],
  [/kid|child|family|son|daughter/i, "family"],
  [/hidden|secret|local|off the beaten|no tourists?|crowd/i, "hidden"],
  [/photo|instagram|camera|shoot/i, "photography"],
  [/night ?life|bar|drink|party|late night/i, "nightlife"],
  [/relax|calm|quiet|chill|peaceful|slow/i, "relaxing"],
  [/eat|food|hungry|lunch|dinner|restaurant|brunch|bakery/i, "food"],
  [/museum|art|culture|exhibit|gallery/i, "culture"],
];

const DIETARY_PATTERNS: [RegExp, string][] = [
  [/vegetarian|veggie/i, "vegetarian"],
  [/vegan/i, "vegan"],
  [/gluten[- ]?free/i, "gluten-free"],
  [/halal/i, "halal"],
  [/kosher/i, "kosher"],
];

function parseBudget(message: string): number | undefined {
  const match = message.match(/(?:€|eur[o]?s?\s*)(\d{1,4})|(\d{1,4})\s*(?:€|euros?)/i);
  if (match) return Number(match[1] ?? match[2]);
  const under = message.match(/under\s+(\d{1,4})/i);
  if (under) return Number(under[1]);
  return undefined;
}

function parseTimeBudget(message: string): number | undefined {
  const hours = message.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  if (/an hour|one hour/i.test(message)) return 60;
  if (/half an hour|30 min/i.test(message)) return 30;
  const mins = message.match(/(\d{1,3})\s*(?:minutes?|mins?)\b/i);
  if (mins) return Number(mins[1]);
  return undefined;
}

function parseWalk(message: string): number | undefined {
  const match = message.match(/(\d{1,3})[- ]?min(?:ute)?s?\s*walk/i);
  if (match) return Number(match[1]);
  return undefined;
}

/** Parse one message into an intent patch (only the fields it mentions). */
export function parseMessage(message: string): Partial<IntentQuery> {
  const patch: Partial<IntentQuery> = {};

  for (const [pattern, mood] of MOOD_PATTERNS) {
    if (pattern.test(message)) {
      patch.mood = mood;
      break;
    }
  }

  if (
    /\b(?:rain(?:ing|y)?|pouring|drizzl(?:e|ing|y)?|storm(?:y|ing)?)\b/i.test(
      message
    )
  ) {
    if (/stop(ped)? raining|not raining|sun.?s? (?:back )?out|cleared up/i.test(message)) {
      patch.rainy = false;
    } else {
      patch.rainy = true;
    }
  }
  if (/indoor|inside|covered/i.test(message)) patch.indoor = true;
  if (/wheelchair|accessib|step[- ]free|stroller/i.test(message)) {
    patch.accessibility = true;
  }

  const budget = parseBudget(message);
  if (budget != null) patch.budget = budget;

  const walk = parseWalk(message);
  if (walk != null) patch.walk = walk;

  const hasWalkContext = walk != null || /\bwalk(?:ing)?\b/i.test(message);
  if (!hasWalkContext) {
    const timeBudget = parseTimeBudget(message);
    if (timeBudget != null) patch.timeBudget = timeBudget;
  }

  const dietary = DIETARY_PATTERNS.filter(([p]) => p.test(message)).map(([, d]) => d);
  if (dietary.length) patch.dietary = dietary;

  if (/bike|vélib|velib|cycl(?:e|ing)|bicycle/i.test(message)) {
    patch.layers = [...new Set<LayerType>([...(patch.layers ?? []), "bikes"])];
  }

  const persona = detectPersonaFromMessage(message);
  if (persona) patch.persona = persona;

  return patch;
}

/** Merge a new turn's patch into the accumulated conversation intent. */
export function mergeIntent(
  previous: IntentQuery | undefined,
  patch: Partial<IntentQuery>
): IntentQuery {
  const merged: IntentQuery = { ...previous, ...patch };

  // Combine dietary lists across turns instead of overwriting.
  if (previous?.dietary?.length && patch.dietary?.length) {
    merged.dietary = [...new Set([...previous.dietary, ...patch.dietary])];
  }

  if (previous?.layers?.length && patch.layers?.length) {
    merged.layers = [...new Set([...previous.layers, ...patch.layers])];
  }

  return merged;
}
