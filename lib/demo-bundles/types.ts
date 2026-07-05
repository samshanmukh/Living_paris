import type { MapMood, StopVisualStyle } from "@/lib/living-paris-intent/types";

export type DemoScenarioId =
  | "asthma-air-quality"
  | "accessible-dining"
  | "date-night-40"
  | "vi-transit"
  | "sensory-friendly"
  | "night-safety";

export type DioramaSceneId = "golden-hour" | "minuit" | "soft-day";

export interface DemoDioramaMarker {
  id: string;
  /** 0–100 percent within the stage viewport */
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  highlighted?: boolean;
  stopNumber?: number;
}

export interface DemoStop {
  id: string;
  number: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  image: string;
  visualStyle: StopVisualStyle;
}

export interface DemoBundle {
  id: DemoScenarioId;
  label: string;
  emoji: string;
  sceneId: DioramaSceneId;
  headerPill: string;
  accentColor: string;
  glowColor: string;
  mapMood: MapMood;
  title: string;
  subtitle: string;
  reply: string;
  distance: string;
  duration: string;
  /** SVG path `d` in 400×280 viewBox coordinates */
  routePath: string;
  markers: DemoDioramaMarker[];
  stops: DemoStop[];
}
