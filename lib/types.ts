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
