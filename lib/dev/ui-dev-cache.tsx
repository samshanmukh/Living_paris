import type { Feature, LineString } from "geojson";
import { IntentIcon } from "@/lib/living-paris-intent/icons";
import type { LivingParisIntent, MapMood, PresetIntentId } from "@/lib/living-paris-intent/types";
import type { ExperienceResult, LayerType } from "@/lib/types";

export const UI_DEV_CACHE_KEY = "living-paris-ui-dev-cache";
export const UI_DEV_CACHE_VERSION = 1 as const;

export interface SerializableIntent {
  id: string;
  label: string;
  emoji: string;
  accentColor: string;
  glowColor: string;
  mapMood: MapMood;
  title: string;
  subtitle: string;
  response: string;
  distance: string;
  duration: string;
  route: LivingParisIntent["route"];
  stops: LivingParisIntent["stops"];
}

export interface UiDevCachePayload {
  version: typeof UI_DEV_CACHE_VERSION;
  savedAt: string;
  selectedPresetId: PresetIntentId | null;
  livingParisResponse: string | null;
  intent: SerializableIntent;
  result: ExperienceResult;
  routeGeometry: Feature<LineString> | null;
  hiddenLayers: LayerType[];
  mapSnapshot?: string;
}

export function isUiDevCacheEnabled(): boolean {
  return process.env.NEXT_PUBLIC_UI_DEV_CACHE === "true";
}

export function serializeIntent(intent: LivingParisIntent, emoji: string): SerializableIntent {
  return {
    id: intent.id,
    label: intent.label,
    emoji,
    accentColor: intent.accentColor,
    glowColor: intent.glowColor,
    mapMood: intent.mapMood,
    title: intent.title,
    subtitle: intent.subtitle,
    response: intent.response,
    distance: intent.distance,
    duration: intent.duration,
    route: intent.route,
    stops: intent.stops,
  };
}

export function hydrateIntent(data: SerializableIntent): LivingParisIntent {
  return {
    ...data,
    icon: <IntentIcon mood={data.mapMood} emoji={data.emoji} />,
  };
}

export function loadUiDevCache(): UiDevCachePayload | null {
  if (typeof window === "undefined" || !isUiDevCacheEnabled()) return null;

  try {
    const raw = window.localStorage.getItem(UI_DEV_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UiDevCachePayload;
    if (parsed.version !== UI_DEV_CACHE_VERSION) {
      window.localStorage.removeItem(UI_DEV_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveUiDevCache(payload: UiDevCachePayload): boolean {
  if (typeof window === "undefined" || !isUiDevCacheEnabled()) return false;

  try {
    window.localStorage.setItem(UI_DEV_CACHE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    if (payload.mapSnapshot) {
      try {
        window.localStorage.setItem(
          UI_DEV_CACHE_KEY,
          JSON.stringify({ ...payload, mapSnapshot: undefined })
        );
        return true;
      } catch {
        console.warn("[ui-dev-cache] Failed to save cache", error);
      }
    }
    return false;
  }
}

export function clearUiDevCache(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(UI_DEV_CACHE_KEY);
}

export function formatCacheAge(savedAt: string): string {
  const deltaMs = Date.now() - new Date(savedAt).getTime();
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
