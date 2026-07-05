import type { PresetChipOption } from "@/features/intent/IntentPresetChips";
import type {
  UiChatMessage,
  UiExperiencePlan,
  UiIntentSummary,
  UiPlanStop,
  UiPresetChip,
} from "@/features/ui/types";
import { layerDotClass } from "@/features/ui/tokens";
import type { LivingParisIntent, MapMood } from "@/lib/living-paris-intent";
import type { ExperienceResult } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

const moodEmoji: Record<MapMood, string> = {
  romantic: "🌙",
  rainy: "🌧️",
  hidden: "🧭",
  cozy: "☕",
  culture: "🎭",
  custom: "✨",
};

export function toUiIntentSummary(
  intent: LivingParisIntent,
  options?: { sourceBadge?: string }
): UiIntentSummary {
  return {
    id: intent.id,
    title: intent.title,
    subtitle: intent.subtitle,
    icon: intent.icon,
    accentColor: intent.accentColor,
    glowColor: intent.glowColor,
    distance: intent.distance,
    duration: intent.duration,
    moodEmoji: intent.id === "idle" ? undefined : moodEmoji[intent.mapMood],
    sourceBadge: options?.sourceBadge,
  };
}

export function toUiPlanStops(intent: LivingParisIntent): UiPlanStop[] {
  return intent.stops.map((stop) => ({
    id: stop.id,
    number: stop.number,
    name: stop.name,
    category: stop.category,
    description: stop.description,
    duration: stop.duration,
    imageBackground: stop.image,
  }));
}

export function toUiPresetChips(presets: PresetChipOption[]): UiPresetChip[] {
  return presets.map(({ id, label, emoji, accentColor }) => ({
    id,
    label,
    emoji,
    accentColor,
  }));
}

export type DomainChatMessage = { id: string; role: "user" | "paris"; text: string };

export function toUiChatMessages(messages: DomainChatMessage[]): UiChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role === "paris" ? "assistant" : "user",
    text: message.text,
  }));
}

export function toUiExperiencePlan(
  result: ExperienceResult,
  route: RouteResponse | null
): UiExperiencePlan {
  const { experience, itinerary, intent, recommendations } = result;
  const hasStops = itinerary.stops.length > 0;

  const subtitleParts = [
    hasStops
      ? `${itinerary.stops.length} stops · ${itinerary.totalDurationMinutes} min`
      : "No stops in range yet",
    route ? `${Math.round(route.durationMinutes)} min walk (${route.provider})` : null,
    intent.budget != null ? `under €${intent.budget}` : null,
    !itinerary.fitsTimeBudget && hasStops ? "over time budget" : null,
  ].filter(Boolean);

  const topRecommendations = recommendations
    .filter((item) => !itinerary.stops.some((stop) => stop.id === item.id))
    .slice(0, 4)
    .map((item) => ({ id: item.id, name: item.name, score: item.score }));

  return {
    summary: {
      emoji: experience.emoji,
      name: experience.name,
      subtitle: subtitleParts.join(" · "),
    },
    route: route
      ? {
          distanceKm: (route.distanceMeters / 1000).toFixed(1),
          durationMinutes: route.durationMinutes,
          provider: route.provider,
          note: route.note,
        }
      : null,
    stops: itinerary.stops.map((stop) => ({
      id: stop.id,
      order: stop.order,
      name: stop.name,
      layer: stop.layer,
      layerDotClass: layerDotClass[stop.layer] ?? "bg-ink",
      detailLine: [
        stop.walkFromPreviousMinutes > 0
          ? `${Math.round(stop.walkFromPreviousMinutes)} min walk`
          : null,
        stop.reasons.slice(0, 2).join(" · ") || stop.layer,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    recommendations: topRecommendations,
    totalWalkMinutes: itinerary.totalWalkMinutes,
    totalDurationMinutes: itinerary.totalDurationMinutes,
    fitsTimeBudget: itinerary.fitsTimeBudget,
  };
}