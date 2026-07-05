import type { ReactNode } from "react";

/** Plain data shapes for Lovable-friendly UI — no domain imports. */

export type UiChatRole = "user" | "assistant";

export interface UiChatMessage {
  id: string;
  role: UiChatRole;
  text: string;
}

export interface UiPresetChip {
  id: string;
  label: string;
  emoji: string;
  accentColor: string;
}

export interface UiPlanStop {
  id: string;
  number: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  /** CSS background (gradient or color) for the stop thumbnail. */
  imageBackground: string;
}

export interface UiIntentSummary {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accentColor: string;
  glowColor: string;
  /** Shown in drawer header when a plan exists, e.g. "2.1 km". */
  distance?: string;
  /** Shown in drawer header when a plan exists, e.g. "45 min". */
  duration?: string;
  /** Optional mood emoji shown beside the title (e.g. 🌧️). */
  moodEmoji?: string;
  /** Small badge, e.g. "Grok" or "local". */
  sourceBadge?: string;
}

export interface UiExperienceSummary {
  emoji: string;
  name: string;
  subtitle: string;
}

export interface UiItineraryStop {
  id: string;
  order: number;
  name: string;
  layer: string;
  layerDotClass: string;
  detailLine: string;
}

export interface UiRecommendation {
  id: string;
  name: string;
  score: number;
}

export interface UiRouteSummary {
  distanceKm: string;
  durationMinutes: number;
  provider: string;
  note?: string;
}

export interface UiExperiencePlan {
  summary: UiExperienceSummary;
  route?: UiRouteSummary | null;
  stops: UiItineraryStop[];
  recommendations: UiRecommendation[];
  totalWalkMinutes: number;
  totalDurationMinutes: number;
  fitsTimeBudget: boolean;
  emptyMessage?: string;
}
