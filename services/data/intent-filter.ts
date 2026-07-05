import type { IntentQuery, LayerType, ParisFeature } from "@/lib/types";
import { MOOD_LAYER_MAP } from "@/lib/constants";
import { PERSONA_PRESETS } from "@/lib/persona/constants";
import type { PersonaFilterHints } from "@/lib/persona/types";

function budgetToLevel(budget?: number): "low" | "medium" | "high" | undefined {
  if (budget == null) return undefined;
  if (budget <= 30) return "low";
  if (budget <= 70) return "medium";
  return "high";
}

function matchesBudget(
  feature: ParisFeature,
  budget?: number
): boolean {
  if (budget == null || !feature.properties.budgetLevel) return true;
  const level = budgetToLevel(budget);
  if (!level) return true;

  const order = { low: 0, medium: 1, high: 2 };
  return order[feature.properties.budgetLevel] <= order[level];
}

function matchesMood(feature: ParisFeature, mood?: string): boolean {
  if (!mood || mood === "general") return true;

  const props = feature.properties;

  switch (mood) {
    case "romantic":
      return Boolean(props.romantic || props.layer === "cafes" || props.quiet);
    case "family":
      return Boolean(props.familyFriendly || props.layer === "parks");
    case "rainy":
      return Boolean(props.indoor || props.layer === "museums" || props.layer === "metro");
    case "photography":
      return Boolean(
        props.layer === "parks" ||
          props.layer === "trees" ||
          props.layer === "museums" ||
          props.tags?.includes("scenic")
      );
    case "nightlife":
      return Boolean(props.layer === "cafes" || props.layer === "metro");
    case "relaxing":
      return Boolean(props.quiet || props.layer === "parks" || props.layer === "trees");
    case "hidden":
      return Boolean(
        props.layer === "trees" ||
          props.tags?.includes("community") ||
          props.tags?.includes("quiet")
      );
    case "food":
      return props.layer === "cafes";
    case "culture":
      return props.layer === "museums";
    default:
      return true;
  }
}

function personaFilterHints(intent: IntentQuery): PersonaFilterHints | undefined {
  if (!intent.persona) return undefined;
  return PERSONA_PRESETS[intent.persona]?.filterHints;
}

function matchesDietary(feature: ParisFeature, dietary?: string[]): boolean {
  if (!dietary?.length) return true;
  const featureDietary = feature.properties.dietary ?? [];
  if (!featureDietary.length) return false;
  return dietary.some((pref) =>
    featureDietary.some((tag) => tag.toLowerCase() === pref.toLowerCase())
  );
}

export function resolveLayers(intent: IntentQuery): LayerType[] {
  if (intent.layers?.length) return intent.layers;

  if (intent.rainy || intent.indoor) {
    return ["museums", "metro", "accessibility"];
  }

  const mood = intent.mood ?? "general";
  const moodLayers = MOOD_LAYER_MAP[mood] ?? MOOD_LAYER_MAP.general;

  if (intent.persona) {
    const primaryLayers = PERSONA_PRESETS[intent.persona]?.primaryLayers;
    if (primaryLayers?.length) {
      return [...new Set([...primaryLayers, ...moodLayers])];
    }
  }

  return moodLayers;
}

export function filterByIntent(
  features: ParisFeature[],
  intent: IntentQuery
): ParisFeature[] {
  const layers = new Set(resolveLayers(intent));
  const hints = personaFilterHints(intent);
  const accessibility =
    intent.accessibility || hints?.accessibility === true;
  const dietary =
    hints?.dietary?.length
      ? [...new Set([...(intent.dietary ?? []), ...hints.dietary])]
      : intent.dietary;
  const requireQuiet = hints?.quiet === true;

  return features.filter((feature) => {
    const props = feature.properties;

    if (!layers.has(props.layer)) return false;
    if (accessibility && props.accessible === false) return false;
    if (intent.indoor && !props.indoor) return false;
    if (intent.rainy && !props.indoor && props.layer !== "metro") return false;
    if (!matchesMood(feature, intent.mood)) return false;
    if (!matchesBudget(feature, intent.budget)) return false;
    if (dietary?.length && !matchesDietary(feature, dietary)) return false;
    if (requireQuiet && !props.quiet) return false;

    if (intent.mood === "relaxing" || intent.mood === "romantic") {
      if (props.noiseLevel != null && props.noiseLevel > 75) return false;
    }

    return true;
  });
}

export function scoreFeature(
  feature: ParisFeature,
  intent: IntentQuery
): number {
  let score = propsBaseScore(feature);

  if (intent.mood === "romantic" && feature.properties.romantic) score += 3;
  if (intent.mood === "family" && feature.properties.familyFriendly) score += 3;
  if (intent.mood === "rainy" && feature.properties.indoor) score += 4;
  if (intent.accessibility && feature.properties.accessible) score += 3;
  if (feature.properties.quiet) score += 1;
  if (feature.properties.noiseLevel != null && feature.properties.noiseLevel < 65)
    score += 2;
  if (
    feature.properties.airQualityIndex != null &&
    feature.properties.airQualityIndex < 45
  )
    score += 1;

  return score;
}

function propsBaseScore(feature: ParisFeature): number {
  return feature.properties.scoreHint ?? 1;
}

export function rankFeatures(
  features: ParisFeature[],
  intent: IntentQuery
): ParisFeature[] {
  return [...features]
    .map((f) => ({ feature: f, score: scoreFeature(f, intent) }))
    .sort((a, b) => b.score - a.score)
    .map(({ feature }) => feature);
}
