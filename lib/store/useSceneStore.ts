import { create } from "zustand";
import type { ParisWeatherSnapshot } from "@/lib/parisWeather";

export type LightPreset = "dawn" | "day" | "dusk" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

interface SceneState {
  hour: number;
  season: Season;
  rainOverride: boolean | null;
  snowing: boolean;
  isRaining: boolean;
  lightPreset: LightPreset;
  applyWeather: (weather: ParisWeatherSnapshot) => void;
  setRainOverride: (value: boolean | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  hour: 17,
  season: "summer",
  rainOverride: null,
  snowing: false,
  isRaining: false,
  lightPreset: "dusk",
  applyWeather: (weather) =>
    set({
      hour: weather.hour,
      season: weather.season,
      snowing: weather.snowing,
      isRaining: weather.isRaining,
      lightPreset: weather.lightPreset,
    }),
  setRainOverride: (value) => set({ rainOverride: value }),
}));

export function effectiveRain(scene: SceneState): boolean {
  if (scene.rainOverride != null) return scene.rainOverride;
  return scene.isRaining;
}
