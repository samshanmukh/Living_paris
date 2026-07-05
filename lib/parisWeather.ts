import type { LightPreset, Season } from "@/lib/store/useSceneStore";

const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;

export interface ParisWeatherSnapshot {
  hour: number;
  season: Season;
  isRaining: boolean;
  snowing: boolean;
  lightPreset: LightPreset;
  temperatureC: number;
}

function seasonFromMonth(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function lightPresetFromHour(hour: number): LightPreset {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "dusk";
  return "night";
}

/** Open-Meteo → Mapbox lightPreset + rain/snow flags for Paris. */
export async function fetchParisWeather(): Promise<ParisWeatherSnapshot> {
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: String(PARIS_LAT),
      longitude: String(PARIS_LON),
      current: "temperature_2m,is_day,precipitation,weather_code,snowfall",
      timezone: "Europe/Paris",
      forecast_days: "1",
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");

  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      precipitation?: number;
      weather_code?: number;
      snowfall?: number;
    };
  };

  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  const precip = data.current?.precipitation ?? 0;
  const snowfall = data.current?.snowfall ?? 0;
  const code = data.current?.weather_code ?? 0;
  const isRaining = precip > 0.1 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
  const snowing = snowfall > 0 || [71, 73, 75, 77, 85, 86].includes(code);

  return {
    hour,
    season: seasonFromMonth(month),
    isRaining,
    snowing,
    lightPreset: lightPresetFromHour(hour),
    temperatureC: data.current?.temperature_2m ?? 18,
  };
}
