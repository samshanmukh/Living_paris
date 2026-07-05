import type { ExperienceResult } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";
import { IntentIcon } from "./icons";
import { PRESET_BY_ID } from "./presets";
import type {
  LivingParisIntent,
  LivingParisStop,
  ParsedFreeformIntent,
  PresetIntentDefinition,
  PresetIntentId,
  StopVisualStyle,
} from "./types";

const STYLE_GRADIENT: Record<StopVisualStyle, string> = {
  museum: "linear-gradient(135deg,#b4a5d6,#8677b8)",
  cafe: "linear-gradient(135deg,#e0b48c,#c68b59)",
  bakery: "linear-gradient(135deg,#eccf9b,#d4a054)",
  gallery: "linear-gradient(135deg,#b9aef0,#9b8cff)",
  view: "linear-gradient(135deg,#a8c4dc,#7ba0c0)",
  restaurant: "linear-gradient(135deg,#e09475,#c4593a)",
  shop: "linear-gradient(135deg,#c9bda9,#a3947d)",
  park: "linear-gradient(135deg,#a8cba0,#6b9a76)",
};

function layerToVisualStyle(layer: string): StopVisualStyle {
  switch (layer) {
    case "museums":
      return "museum";
    case "cafes":
      return "cafe";
    case "parks":
    case "trees":
      return "park";
    case "metro":
      return "shop";
    default:
      return "view";
  }
}

function layerToCategory(layer: string): string {
  switch (layer) {
    case "cafes":
      return "Café";
    case "museums":
      return "Museum";
    case "parks":
      return "Park";
    case "metro":
      return "Metro";
    case "trees":
      return "Green walk";
    default:
      return "Spot";
  }
}

function formatDistance(meters?: number): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(minutes?: number): string {
  if (minutes == null) return "—";
  return `${Math.round(minutes)} min`;
}

export function buildShellIntent(
  preset: PresetIntentDefinition,
  overrides?: Partial<LivingParisIntent>
): LivingParisIntent {
  return {
    id: preset.id,
    label: preset.label,
    icon: <IntentIcon mood={preset.mapMood} emoji={preset.emoji} />,
    accentColor: preset.accentColor,
    glowColor: preset.glowColor,
    mapMood: preset.mapMood,
    title: preset.title,
    subtitle: preset.subtitle,
    response: preset.responseTemplate,
    distance: "…",
    duration: "…",
    route: [],
    stops: [],
    ...overrides,
  };
}

export function buildIntentFromParsedShell(parsed: ParsedFreeformIntent): LivingParisIntent {
  const preset = parsed.presetId ? PRESET_BY_ID[parsed.presetId] : undefined;
  const title = parsed.customTitle ?? preset?.title ?? "Your Paris Moment";
  const subtitle = parsed.customSubtitle ?? preset?.subtitle ?? "Shaped around what you asked for";
  const label = parsed.customLabel ?? preset?.label ?? title;
  const mapMood = parsed.mapMood;

  return {
    id: parsed.presetId ?? `custom-${Date.now()}`,
    label,
    icon: <IntentIcon mood={mapMood} emoji={preset?.emoji ?? "✨"} />,
    accentColor: parsed.accentColor,
    glowColor: parsed.glowColor,
    mapMood,
    title,
    subtitle,
    response: parsed.customResponse ?? preset?.responseTemplate ?? "Living Paris is planning…",
    distance: "…",
    duration: parsed.timeBudgetMinutes ? `${parsed.timeBudgetMinutes} min` : "…",
    route: [],
    stops: [],
  };
}

export function buildIntentFromApi(
  theme: {
    preset?: PresetIntentDefinition;
    parsed?: ParsedFreeformIntent;
    shell: LivingParisIntent;
  },
  result: ExperienceResult,
  route: RouteResponse | null,
  reply: string
): LivingParisIntent {
  const { shell, preset, parsed } = theme;
  const stops: LivingParisStop[] = result.itinerary.stops.map((stop) => {
    const visualStyle = layerToVisualStyle(stop.layer);
    return {
      id: stop.id,
      number: stop.order,
      name: stop.name,
      category: layerToCategory(stop.layer),
      description: stop.reasons.slice(0, 2).join(" · ") || stop.layer,
      duration:
        stop.walkFromPreviousMinutes > 0
          ? `${Math.round(stop.walkFromPreviousMinutes)} min walk`
          : "Stay a while",
      image: STYLE_GRADIENT[visualStyle],
      visualStyle,
    };
  });

  const routeCoords =
    route?.geometry?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) ??
    result.mapState.routeWaypoints.map((waypoint) => ({
      lat: waypoint.lat,
      lng: waypoint.lon,
    }));

  const distance = route
    ? formatDistance(route.distanceMeters)
    : formatDistance(result.itinerary.totalWalkMinutes * 80);

  const duration = route
    ? formatDuration(route.durationMinutes)
    : formatDuration(result.itinerary.totalDurationMinutes);

  return {
    ...shell,
    title: parsed?.customTitle ?? preset?.title ?? result.experience.name,
    subtitle:
      parsed?.customSubtitle ??
      preset?.subtitle ??
      result.experience.description,
    label: parsed?.customLabel ?? preset?.label ?? result.experience.name,
    response: reply,
    distance,
    duration,
    route: routeCoords,
    stops,
    icon: (
      <IntentIcon
        mood={shell.mapMood}
        emoji={preset?.emoji ?? result.experience.emoji}
      />
    ),
  };
}

export function buildIdleIntent(): LivingParisIntent {
  return {
    id: "idle",
    label: "Living Paris",
    icon: <IntentIcon mood="custom" emoji="🗼" />,
    accentColor: "#d9a441",
    glowColor: "rgba(217, 164, 65, 0.25)",
    mapMood: "custom",
    title: "Living Paris",
    subtitle: "Ask for a mood — or pick a preset below",
    response: "Tell me what kind of Paris you want tonight.",
    distance: "—",
    duration: "—",
    route: [],
    stops: [],
  };
}

export type { PresetIntentId };
