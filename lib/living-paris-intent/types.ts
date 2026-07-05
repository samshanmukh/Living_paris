import type { ReactNode } from "react";

export type MapMood = "rainy" | "romantic" | "hidden" | "cozy" | "culture" | "custom";

export type StopVisualStyle =
  | "museum"
  | "cafe"
  | "bakery"
  | "gallery"
  | "view"
  | "restaurant"
  | "shop"
  | "park";

export type PresetIntentId =
  | "date-night"
  | "rainy-day"
  | "hidden-gems"
  | "cozy-cafe"
  | "art-culture";

export interface LivingParisStop {
  id: string;
  number: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  image: string;
  visualStyle: StopVisualStyle;
}

export interface LivingParisIntent {
  id: string;
  label: string;
  icon: ReactNode;
  accentColor: string;
  glowColor: string;
  mapMood: MapMood;
  title: string;
  subtitle: string;
  response: string;
  distance: string;
  duration: string;
  route: Array<{ lat: number; lng: number }>;
  stops: LivingParisStop[];
}

export interface PresetIntentDefinition {
  id: PresetIntentId;
  label: string;
  emoji: string;
  prompt: string;
  accentColor: string;
  glowColor: string;
  mapMood: MapMood;
  title: string;
  subtitle: string;
  responseTemplate: string;
}

export interface ParsedFreeformIntent {
  presetId?: PresetIntentId;
  mapMood: MapMood;
  customLabel?: string;
  customTitle?: string;
  customSubtitle?: string;
  customResponse?: string;
  accentColor: string;
  glowColor: string;
  promptText: string;
  timeBudgetMinutes?: number;
  budget?: number;
}
