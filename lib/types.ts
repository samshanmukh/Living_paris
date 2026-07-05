import type { Feature, FeatureCollection, Point } from "geojson";

export const LAYER_TYPES = [
  "cafes",
  "museums",
  "metro",
  "parks",
  "trees",
  "bikes",
  "accessibility",
  "noise",
  "air-quality",
] as const;

export type LayerType = (typeof LAYER_TYPES)[number];

export type BudgetLevel = "low" | "medium" | "high";
export type MoodType =
  | "romantic"
  | "family"
  | "rainy"
  | "photography"
  | "nightlife"
  | "relaxing"
  | "hidden"
  | "food"
  | "culture"
  | "general";

export interface ParisFeatureProperties {
  id: string;
  name: string;
  layer: LayerType;
  type: string;
  address?: string;
  arrondissement?: string;
  accessible?: boolean;
  indoor?: boolean;
  romantic?: boolean;
  familyFriendly?: boolean;
  quiet?: boolean;
  budgetLevel?: BudgetLevel;
  noiseLevel?: number;
  airQualityIndex?: number;
  capacity?: number;
  tags?: string[];
  dietary?: string[];
  source?: string;
  scoreHint?: number;
}

export type ParisFeature = Feature<Point, ParisFeatureProperties>;
export type ParisFeatureCollection = FeatureCollection<
  Point,
  ParisFeatureProperties
>;

export interface IntentQuery {
  mood?: MoodType;
  budget?: number;
  walk?: number;
  accessibility?: boolean;
  indoor?: boolean;
  rainy?: boolean;
  lat?: number;
  lon?: number;
  radius?: number;
  layers?: LayerType[];
  limit?: number;
  /** Total minutes the user has for the whole experience (e.g. "we only have an hour"). */
  timeBudget?: number;
  /** Dietary preferences, e.g. ["vegetarian"]. Boosts features tagged accordingly. */
  dietary?: string[];
}

export interface LayerMeta {
  id: LayerType;
  name: string;
  description: string;
  featureCount: number;
  source: string;
  updatedAt: string;
}

export interface SpatialQueryResult {
  intent: IntentQuery;
  layers: LayerType[];
  totalFeatures: number;
  geojson: ParisFeatureCollection;
  meta: {
    radiusMeters: number;
    center: [number, number];
    queryMs: number;
  };
}

// ---------------------------------------------------------------------------
// Experience Engine (Member 5) — decides what appears on the map
// ---------------------------------------------------------------------------

export type ExperienceId =
  | "date-night"
  | "family-day"
  | "hidden-gems"
  | "rainy-day"
  | "food-tour"
  | "photo-walk"
  | "museums-art"
  | "relaxing-walk"
  | "nightlife"
  | "local-explorer";

export type MapTheme = "romantic" | "rain" | "family" | "night" | "day";

export interface ExperienceMode {
  id: ExperienceId;
  name: string;
  emoji: string;
  description: string;
  /** Intent moods that map onto this experience. */
  moods: MoodType[];
  /** Layers this experience draws from, with relative weight (0..1). */
  layerWeights: Partial<Record<LayerType, number>>;
  /** Feature-property scoring weights applied on top of base score. */
  propertyWeights: {
    romantic?: number;
    familyFriendly?: number;
    indoor?: number;
    outdoor?: number;
    quiet?: number;
    accessible?: number;
    lowNoise?: number;
    tags?: Record<string, number>;
  };
  theme: MapTheme;
  /** Ideal number of itinerary stops for this experience. */
  defaultStops: number;
  /** Camera hint for the map team. */
  camera: { zoom: number; pitch: number };
}

export interface ScoredFeature {
  feature: ParisFeature;
  score: number;
  /** Human-readable reasons, for recommendation cards and AI replies. */
  reasons: string[];
  distanceMeters: number;
}

export interface ItineraryStop {
  order: number;
  id: string;
  name: string;
  layer: LayerType;
  coords: [number, number];
  reasons: string[];
  walkFromPreviousMinutes: number;
}

export interface Itinerary {
  stops: ItineraryStop[];
  totalWalkMinutes: number;
  totalDurationMinutes: number;
  fitsTimeBudget: boolean;
}

export interface MapMarker {
  id: string;
  name: string;
  coords: [number, number];
  layer: LayerType;
  score: number;
  highlighted: boolean;
  reasons: string[];
  noiseLevel?: number;
  airQualityIndex?: number;
  capacity?: number;
}

export interface MapState {
  flyTo: { center: [number, number]; zoom: number; pitch: number };
  theme: MapTheme;
  visibleLayers: LayerType[];
  markers: MapMarker[];
  /** Ordered waypoints for the route — feed to POST /api/routes. */
  routeWaypoints: { lon: number; lat: number; name: string }[];
}

export interface ExperienceResult {
  experience: {
    id: ExperienceId;
    name: string;
    emoji: string;
    description: string;
  };
  intent: IntentQuery;
  mapState: MapState;
  itinerary: Itinerary;
  recommendations: {
    id: string;
    name: string;
    layer: LayerType;
    score: number;
    reasons: string[];
    distanceMeters: number;
  }[];
  meta: { totalCandidates: number; queryMs: number };
}
