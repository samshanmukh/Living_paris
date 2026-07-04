import type { ExperienceId, ExperienceMode, IntentQuery } from "@/lib/types";

/**
 * Experience modes — the personality presets of Living Paris.
 *
 * Each mode decides:
 *  - which data layers feed the map (layerWeights)
 *  - how features are scored (propertyWeights)
 *  - the visual theme + camera the map team should apply
 *  - how many itinerary stops feel right
 *
 * Tuning weights here changes what the whole app recommends — this file is
 * the single knob-panel for the Experience Engine.
 */
export const EXPERIENCE_MODES: Record<ExperienceId, ExperienceMode> = {
  "date-night": {
    id: "date-night",
    name: "Date Night",
    emoji: "\u2764\ufe0f",
    description: "Romantic cafés, quiet corners, and golden-hour walks along the Seine.",
    moods: ["romantic"],
    layerWeights: { cafes: 1.0, parks: 0.8, museums: 0.5 },
    propertyWeights: {
      romantic: 4,
      quiet: 2,
      lowNoise: 2,
      tags: { terrace: 1, scenic: 2 },
    },
    theme: "romantic",
    defaultStops: 3,
    camera: { zoom: 14.5, pitch: 55 },
  },
  "family-day": {
    id: "family-day",
    name: "Family Day",
    emoji: "\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67",
    description: "Parks, kid-friendly museums, and easy metro hops for the whole crew.",
    moods: ["family"],
    layerWeights: { parks: 1.0, museums: 0.8, metro: 0.5, cafes: 0.4 },
    propertyWeights: {
      familyFriendly: 4,
      accessible: 2,
      outdoor: 1,
      tags: { playground: 3, garden: 1 },
    },
    theme: "family",
    defaultStops: 3,
    camera: { zoom: 13.5, pitch: 45 },
  },
  "hidden-gems": {
    id: "hidden-gems",
    name: "Hidden Gems",
    emoji: "\ud83d\udc8e",
    description: "Community gardens, quiet passages, and spots tour groups never find.",
    moods: ["hidden"],
    layerWeights: { parks: 1.0, cafes: 0.8, trees: 0.4 },
    propertyWeights: {
      quiet: 3,
      lowNoise: 2,
      tags: { community: 3, quiet: 2, garden: 1 },
    },
    theme: "day",
    defaultStops: 4,
    camera: { zoom: 15, pitch: 50 },
  },
  "rainy-day": {
    id: "rainy-day",
    name: "Rainy Day",
    emoji: "\ud83c\udf27\ufe0f",
    description: "Museums, covered spots, and metro-connected shelter from the rain.",
    moods: ["rainy"],
    layerWeights: { museums: 1.0, metro: 0.7, cafes: 0.3 },
    propertyWeights: {
      indoor: 5,
      accessible: 1,
      tags: { covered: 3 },
    },
    theme: "rain",
    defaultStops: 2,
    camera: { zoom: 14, pitch: 40 },
  },
  "food-tour": {
    id: "food-tour",
    name: "Food Tour",
    emoji: "\ud83c\udf7d\ufe0f",
    description: "Terraces, bakeries, and the best bites within walking distance.",
    moods: ["food"],
    layerWeights: { cafes: 1.0, metro: 0.3 },
    propertyWeights: {
      tags: { terrace: 2, restaurant: 2, bakery: 3, vegetarian: 1 },
    },
    theme: "day",
    defaultStops: 4,
    camera: { zoom: 15, pitch: 50 },
  },
  "photo-walk": {
    id: "photo-walk",
    name: "Photography Tour",
    emoji: "\ud83d\udcf8",
    description: "Scenic viewpoints, leafy avenues, and photogenic facades.",
    moods: ["photography"],
    layerWeights: { parks: 1.0, museums: 0.7, trees: 0.6 },
    propertyWeights: {
      outdoor: 2,
      quiet: 1,
      tags: { scenic: 4, garden: 1 },
    },
    theme: "day",
    defaultStops: 4,
    camera: { zoom: 14.5, pitch: 60 },
  },
  "museums-art": {
    id: "museums-art",
    name: "Museums & Art",
    emoji: "\ud83c\udfad",
    description: "World-class collections and cultural landmarks.",
    moods: ["culture"],
    layerWeights: { museums: 1.0, metro: 0.4 },
    propertyWeights: {
      indoor: 2,
      accessible: 1,
      tags: { art: 2, monument: 1 },
    },
    theme: "day",
    defaultStops: 2,
    camera: { zoom: 14, pitch: 45 },
  },
  "relaxing-walk": {
    id: "relaxing-walk",
    name: "Relaxing Walk",
    emoji: "\ud83c\udf33",
    description: "Green, quiet, low-noise routes through parks and tree-lined streets.",
    moods: ["relaxing"],
    layerWeights: { parks: 1.0, trees: 0.7, cafes: 0.4 },
    propertyWeights: {
      quiet: 3,
      lowNoise: 3,
      outdoor: 2,
      tags: { garden: 2 },
    },
    theme: "day",
    defaultStops: 3,
    camera: { zoom: 14, pitch: 50 },
  },
  nightlife: {
    id: "nightlife",
    name: "Nightlife",
    emoji: "\ud83c\udf19",
    description: "Late cafés and well-connected night spots.",
    moods: ["nightlife"],
    layerWeights: { cafes: 1.0, metro: 0.6 },
    propertyWeights: {
      tags: { bar: 3, terrace: 1 },
    },
    theme: "night",
    defaultStops: 3,
    camera: { zoom: 15, pitch: 55 },
  },
  "local-explorer": {
    id: "local-explorer",
    name: "Local Explorer",
    emoji: "\ud83d\udeb6",
    description: "A balanced mix of the neighborhood's best, like a local would wander.",
    moods: ["general"],
    layerWeights: { cafes: 0.8, parks: 0.8, museums: 0.6, metro: 0.4 },
    propertyWeights: {
      quiet: 1,
      tags: {},
    },
    theme: "day",
    defaultStops: 3,
    camera: { zoom: 14, pitch: 50 },
  },
};

export const EXPERIENCE_LIST = Object.values(EXPERIENCE_MODES);

/**
 * Resolve which experience mode an intent maps to.
 *
 * Priority: explicit rain/indoor context wins (the "now it's raining" pivot),
 * then mood mapping, then the general fallback.
 */
export function resolveExperience(intent: IntentQuery): ExperienceMode {
  if (intent.rainy || (intent.indoor && !intent.mood)) {
    return EXPERIENCE_MODES["rainy-day"];
  }

  if (intent.mood) {
    const match = EXPERIENCE_LIST.find((mode) => mode.moods.includes(intent.mood!));
    if (match) return match;
  }

  return EXPERIENCE_MODES["local-explorer"];
}
