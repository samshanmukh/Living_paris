import type { Feature, LineString, Position } from "geojson";
import type { IntentQuery, LayerMeta, SpatialQueryResult } from "@/lib/types";
import type { SceneId } from "@/lib/parisVisualizationData";

export type BackendSource = "worker" | "local-file-store";

export type RouteExperience = {
  profile: "walking" | "cycling";
  provider: "turf-estimate" | "mapbox";
  geometry: Feature<LineString>;
  distanceMeters: number;
  durationMinutes: number;
  cameraPath: Position[];
  accessible: boolean;
  note?: string;
};

export type ExperienceResponse = {
  sceneId: SceneId;
  status: string;
  reply: string;
  intent: IntentQuery;
  backendSource: BackendSource;
  datasets: LayerMeta[];
  spatial: SpatialQueryResult;
  route: RouteExperience | null;
  warnings: string[];
};
