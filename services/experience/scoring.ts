import * as turf from "@turf/turf";
import type {
  ExperienceMode,
  IntentQuery,
  ParisFeature,
  ScoredFeature,
} from "@/lib/types";

const NOISE_QUIET_DB = 65;
const NOISE_LOUD_DB = 75;

/**
 * Name/tag hints per dietary preference. The open datasets don't carry
 * dietary metadata yet, so this heuristic keeps the "she's vegetarian" turn
 * working until Member 4 enriches the layers with real tags.
 */
const DIETARY_HINTS: Record<string, string[]> = {
  vegetarian: ["veg", "veggie", "vegetarian", "bio", "green", "salad"],
  vegan: ["vegan", "veg", "veggie", "bio", "green"],
  "gluten-free": ["gluten", "bio"],
  halal: ["halal"],
  kosher: ["kosher", "cacher"],
};

/**
 * Score one feature for a given experience mode + intent.
 *
 * The score combines:
 *  1. base quality hint from the data layer (scoreHint)
 *  2. layer weight — how central this layer is to the experience
 *  3. property weights — mode-specific boosts (romantic, indoor, quiet...)
 *  4. intent context boosts — accumulated conversation state (dietary,
 *     accessibility, lingering romantic mood during a rainy pivot)
 *  5. distance decay — closer places win ties
 *
 * Reasons are collected along the way so the frontend can show "why this
 * place" on recommendation cards and the AI can narrate choices.
 */
export function scoreFeatureForExperience(
  feature: ParisFeature,
  mode: ExperienceMode,
  intent: IntentQuery,
  center: [number, number]
): ScoredFeature {
  const props = feature.properties;
  const reasons: string[] = [];

  const layerWeight = mode.layerWeights[props.layer] ?? 0.2;
  let score = (props.scoreHint ?? 1) * layerWeight * 2;

  const w = mode.propertyWeights;

  if (w.romantic && props.romantic) {
    score += w.romantic;
    reasons.push("romantic spot");
  }
  if (w.familyFriendly && props.familyFriendly) {
    score += w.familyFriendly;
    reasons.push("family friendly");
  }
  if (w.indoor && props.indoor) {
    score += w.indoor;
    reasons.push("indoor — stays dry");
  }
  if (w.outdoor && props.indoor === false) {
    score += w.outdoor;
  }
  if (w.quiet && props.quiet) {
    score += w.quiet;
    reasons.push("quiet corner");
  }
  if (w.accessible && props.accessible) {
    score += w.accessible;
    reasons.push("step-free access");
  }
  if (w.lowNoise && props.noiseLevel != null && props.noiseLevel < NOISE_QUIET_DB) {
    score += w.lowNoise;
    reasons.push("low street noise");
  }
  if (w.tags && props.tags?.length) {
    for (const tag of props.tags) {
      const boost = w.tags[tag];
      if (boost) {
        score += boost;
        reasons.push(tag);
      }
    }
  }

  // --- Intent context boosts (conversation memory, independent of mode) ---

  // A rainy pivot mid-date should still prefer romantic indoor places.
  if (intent.mood === "romantic" && mode.id !== "date-night" && props.romantic) {
    score += 2;
    reasons.push("still fits the date");
  }
  if (intent.accessibility && props.accessible) {
    score += 2;
    if (!reasons.includes("step-free access")) reasons.push("step-free access");
  }
  // Dietary hints only make sense for food places.
  if (intent.dietary?.length && props.layer === "cafes") {
    const name = props.name?.toLowerCase() ?? "";
    for (const diet of intent.dietary) {
      const needle = diet.toLowerCase();
      const hints = DIETARY_HINTS[needle] ?? [needle];
      const inTags = props.tags?.some((t) => hints.includes(t));
      const inName = hints.some((h) => name.includes(h));
      if (inTags || inName) {
        score += 4;
        reasons.push(`${diet} options`);
      }
    }
  }

  // Loud places actively hurt calm experiences.
  if (
    (mode.id === "date-night" || mode.id === "relaxing-walk" || mode.id === "hidden-gems") &&
    props.noiseLevel != null &&
    props.noiseLevel > NOISE_LOUD_DB
  ) {
    score -= 3;
  }

  // --- Distance decay: 0..2 bonus, linear falloff over 2km ---
  const distanceMeters = turf.distance(
    turf.point(center),
    turf.point(feature.geometry.coordinates),
    { units: "meters" }
  );
  score += Math.max(0, 2 - distanceMeters / 1000);

  return { feature, score, reasons, distanceMeters: Math.round(distanceMeters) };
}

/**
 * Hard filters that remove features entirely (vs. soft scoring above).
 * Kept minimal — the engine prefers reranking over emptying the map.
 */
export function passesHardFilters(
  feature: ParisFeature,
  mode: ExperienceMode,
  intent: IntentQuery
): boolean {
  const props = feature.properties;

  if (intent.accessibility && props.accessible === false) {
    return false;
  }

  // Rainy day: outdoor-only places drop off the map (matches spatial API filter).
  if (
    (intent.rainy || mode.id === "rainy-day") &&
    props.indoor === false &&
    (props.layer === "cafes" || props.layer === "parks")
  ) {
    return false;
  }

  if (intent.budget != null && props.budgetLevel) {
    const order = { low: 0, medium: 1, high: 2 } as const;
    const level = intent.budget <= 30 ? "low" : intent.budget <= 70 ? "medium" : "high";
    if (order[props.budgetLevel] > order[level]) return false;
  }

  return true;
}

export function rankForExperience(
  features: ParisFeature[],
  mode: ExperienceMode,
  intent: IntentQuery,
  center: [number, number]
): ScoredFeature[] {
  return features
    .filter((f) => passesHardFilters(f, mode, intent))
    .map((f) => scoreFeatureForExperience(f, mode, intent, center))
    .sort((a, b) => b.score - a.score);
}
