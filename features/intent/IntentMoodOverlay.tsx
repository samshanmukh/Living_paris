"use client";

import MoodGlowOverlay from "@/features/ui/components/MoodGlowOverlay";
import IntentHeaderCard from "@/features/ui/components/IntentHeaderCard";
import { toUiIntentSummary } from "@/features/ui/adapters/living-paris";
import type { LivingParisIntent } from "@/lib/living-paris-intent";

interface IntentMoodOverlayProps {
  intent: LivingParisIntent;
}

export default function IntentMoodOverlay({ intent }: IntentMoodOverlayProps) {
  if (intent.id === "idle") return null;
  return <MoodGlowOverlay glowColor={intent.glowColor} />;
}

interface IntentHeaderProps {
  intent: LivingParisIntent;
  isGenerating: boolean;
  intentSource?: "llm" | "heuristic" | null;
}

export function IntentHeader({ intent, isGenerating, intentSource }: IntentHeaderProps) {
  return (
    <IntentHeaderCard
      summary={toUiIntentSummary(intent, {
        sourceBadge: intentSource === "llm" ? "Grok" : intentSource === "heuristic" ? "local" : undefined,
      })}
      isGenerating={isGenerating}
    />
  );
}
