import {
  mapOpenMeteoAirQuality,
  mapWaqiFeed,
  OPEN_METEO_AIR_QUALITY_URL,
  waqiFeedUrl,
} from "@/lib/live-api-types";

export type LiveAirContext = {
  pm25: number | null;
  aqi: number | null;
  source: "open-meteo" | "waqi";
};

/** Fetch Paris air quality from Open-Meteo (same upstream as GET /api/live/air-quality). */
export async function fetchLiveAirQuality(): Promise<LiveAirContext | null> {
  try {
    const res = await fetch(OPEN_METEO_AIR_QUALITY_URL);
    if (!res.ok) return null;

    const body: unknown = await res.json();
    const mapped = mapOpenMeteoAirQuality(body);
    if (!mapped) return null;

    return {
      pm25: mapped.pm25,
      aqi: mapped.aqi,
      source: "open-meteo",
    };
  } catch {
    return null;
  }
}

/** Fetch Paris AQI from WAQI when WAQI_API_KEY is configured. */
export async function fetchLiveAqi(): Promise<LiveAirContext | null> {
  const apiKey = process.env.WAQI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch(waqiFeedUrl(apiKey));
    if (!res.ok) return null;

    const body: unknown = await res.json();
    const mapped = mapWaqiFeed(body);
    if (!mapped) return null;

    return {
      pm25: mapped.pm25,
      aqi: mapped.aqi,
      source: "waqi",
    };
  } catch {
    return null;
  }
}
