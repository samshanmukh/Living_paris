export const PARIS_COORDS = { lat: 48.8566, lon: 2.3522 } as const;

export const OPEN_METEO_AIR_QUALITY_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=48.8566&longitude=2.3522&current=pm2_5,pm10,european_aqi";

export const ALADHAN_PRAYER_TIMES_URL =
  "https://api.aladhan.com/v1/timingsByCity?city=Paris&country=France&method=2";

export function waqiFeedUrl(apiKey: string): string {
  return `https://api.waqi.info/feed/geo:${PARIS_COORDS.lat};${PARIS_COORDS.lon}/?token=${encodeURIComponent(apiKey)}`;
}

export type AirQualityLiveResponse = {
  source: "open-meteo";
  pm25: number | null;
  pm10: number | null;
  aqi: number | null;
  updatedAt: string;
  coords: { lat: number; lon: number };
};

export type WaqiLiveResponse = {
  source: "waqi";
  aqi: number;
  pm25: number | null;
  city: string;
  updatedAt: string;
};

export type AladhanDate = {
  readable?: string;
  timestamp?: string;
  hijri?: Record<string, unknown>;
  gregorian?: Record<string, unknown>;
};

export type PrayerTimesLiveResponse = {
  source: "aladhan";
  timings: Record<string, string>;
  date: AladhanDate | null;
};

export function mapOpenMeteoAirQuality(
  body: unknown,
  coords: { lat: number; lon: number } = PARIS_COORDS
): AirQualityLiveResponse | null {
  if (!body || typeof body !== "object") return null;

  const current =
    "current" in body && body.current && typeof body.current === "object"
      ? (body.current as Record<string, unknown>)
      : null;
  if (!current) return null;

  const updatedAt =
    typeof current.time === "string" ? current.time : new Date().toISOString();

  return {
    source: "open-meteo",
    pm25: typeof current.pm2_5 === "number" ? current.pm2_5 : null,
    pm10: typeof current.pm10 === "number" ? current.pm10 : null,
    aqi: typeof current.european_aqi === "number" ? current.european_aqi : null,
    updatedAt,
    coords,
  };
}

export function mapWaqiFeed(body: unknown): WaqiLiveResponse | null {
  if (!body || typeof body !== "object") return null;
  if ("status" in body && body.status !== "ok") return null;

  const data =
    "data" in body && body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
  if (!data || typeof data.aqi !== "number") return null;

  const iaqi =
    data.iaqi && typeof data.iaqi === "object"
      ? (data.iaqi as Record<string, unknown>)
      : null;
  const pm25Entry =
    iaqi?.pm25 && typeof iaqi.pm25 === "object"
      ? (iaqi.pm25 as { v?: unknown })
      : null;

  const cityEntry =
    data.city && typeof data.city === "object"
      ? (data.city as { name?: unknown })
      : null;
  const timeEntry =
    data.time && typeof data.time === "object"
      ? (data.time as { iso?: unknown })
      : null;

  return {
    source: "waqi",
    aqi: data.aqi,
    pm25: typeof pm25Entry?.v === "number" ? pm25Entry.v : null,
    city: typeof cityEntry?.name === "string" ? cityEntry.name : "Paris",
    updatedAt:
      typeof timeEntry?.iso === "string"
        ? timeEntry.iso
        : new Date().toISOString(),
  };
}

export function mapAladhanTimings(body: unknown): PrayerTimesLiveResponse | null {
  if (!body || typeof body !== "object") return null;
  if ("code" in body && body.code !== 200) return null;

  const data =
    "data" in body && body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
  if (!data) return null;

  const rawTimings =
    data.timings && typeof data.timings === "object"
      ? (data.timings as Record<string, unknown>)
      : null;
  if (!rawTimings) return null;

  const timings: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawTimings)) {
    if (typeof value === "string") timings[key] = value;
  }
  if (!timings.Fajr || !timings.Maghrib) return null;

  const date =
    data.date && typeof data.date === "object"
      ? (data.date as AladhanDate)
      : null;

  return { source: "aladhan", timings, date };
}
