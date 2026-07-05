import { create } from "zustand";
import type { Feature, LineString } from "geojson";
import { filterRainFriendly } from "@/lib/rainMode";
import { planRouteClient, spatialQuery } from "@/lib/map-api";
import type { ExperienceResult, IntentQuery, ParisFeature } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

interface CityState {
  features: ParisFeature[];
  allFeatures: ParisFeature[];
  selectedId: string | null;
  hoveredId: string | null;
  route: RouteResponse | null;
  routeGeometry: Feature<LineString> | null;
  center: [number, number];
  rainMode: boolean;
  isPlanning: boolean;

  select: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleRainMode: () => void;
  setRainMode: (value: boolean) => void;
  syncFromExperience: (
    result: ExperienceResult,
    routeGeometry: Feature<LineString> | null,
    route: RouteResponse | null
  ) => void;
  planItinerary: (intent: IntentQuery) => Promise<void>;
}

function markersToFeatures(result: ExperienceResult): ParisFeature[] {
  return result.mapState.markers.map((marker) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: marker.coords },
    properties: {
      id: marker.id,
      name: marker.name,
      layer: marker.layer,
      type: marker.layer,
      indoor: marker.layer === "museums" || marker.layer === "metro",
    },
  }));
}

export const useCityStore = create<CityState>((set, get) => ({
  features: [],
  allFeatures: [],
  selectedId: null,
  hoveredId: null,
  route: null,
  routeGeometry: null,
  center: [2.3522, 48.8566],
  rainMode: false,
  isPlanning: false,

  select: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
  toggleRainMode: () => {
    const next = !get().rainMode;
    set({
      rainMode: next,
      features: next ? filterRainFriendly(get().allFeatures) : get().allFeatures,
    });
  },
  setRainMode: (value) =>
    set({
      rainMode: value,
      features: value ? filterRainFriendly(get().allFeatures) : get().allFeatures,
    }),

  syncFromExperience: (result, routeGeometry, route) => {
    const allFeatures = markersToFeatures(result);
    const rainMode = get().rainMode;
    set({
      allFeatures,
      features: rainMode ? filterRainFriendly(allFeatures) : allFeatures,
      routeGeometry,
      route,
      center: result.mapState.flyTo.center,
      selectedId: null,
    });
  },

  planItinerary: async (intent) => {
    set({ isPlanning: true });
    try {
      const spatial = await spatialQuery(intent);
      const allFeatures = spatial.geojson.features.slice(0, 40);
      const rainMode = get().rainMode || !!intent.rainy;
      const features = rainMode ? filterRainFriendly(allFeatures) : allFeatures;

      let route: RouteResponse | null = null;
      let routeGeometry: Feature<LineString> | null = null;

      if (features.length >= 2) {
        route = await planRouteClient({
          waypoints: features.slice(0, 5).map((feature) => ({
            lon: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
            name: feature.properties.name,
          })),
          profile: "walking",
          accessible: intent.accessibility,
        });
        routeGeometry = route.geometry;
      }

      set({
        allFeatures,
        features,
        route,
        routeGeometry,
        center: spatial.meta.center,
        rainMode,
      });
    } finally {
      set({ isPlanning: false });
    }
  },
}));
