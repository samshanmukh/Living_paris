import type { LayerType } from "../types";

export const PERSONA_IDS = [
  "asthma",
  "wheelchair",
  "halal",
  "sensory",
  "night-safety",
  "date-night",
  "visually-impaired",
] as const;

export type PersonaId = (typeof PERSONA_IDS)[number];

/** Intent-level filter hints applied when a persona is active. */
export interface PersonaFilterHints {
  accessibility?: boolean;
  dietary?: string[];
  quiet?: boolean;
}

/**
 * Partial property weights aligned with ExperienceMode.propertyWeights.
 * Persona presets merge these on top of experience-mode scoring.
 */
export interface PersonaScoringBoosts {
  romantic?: number;
  familyFriendly?: number;
  indoor?: number;
  outdoor?: number;
  quiet?: number;
  accessible?: number;
  lowNoise?: number;
  tags?: Record<string, number>;
}

export interface PersonaPreset {
  id: PersonaId;
  name: string;
  emoji: string;
  description: string;
  /** Layers that drive destination search and itinerary stops. */
  primaryLayers: LayerType[];
  /** Ambient/context layers shown on the map but not used as stops. */
  overlayLayers: LayerType[];
  filterHints: PersonaFilterHints;
  scoringBoosts: PersonaScoringBoosts;
}
