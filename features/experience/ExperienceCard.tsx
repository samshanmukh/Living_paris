"use client";

import ExperiencePlanCard from "@/features/ui/components/ExperiencePlanCard";
import { toUiExperiencePlan } from "@/features/ui/adapters/living-paris";
import type { ExperienceResult } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

interface ExperienceCardProps {
  result: ExperienceResult | null;
  route: RouteResponse | null;
  open: boolean;
  focusedStopId?: string | null;
  onToggle: () => void;
}

export default function ExperienceCard({
  result,
  route,
  open,
  focusedStopId,
  onToggle,
}: ExperienceCardProps) {
  if (!result) return null;

  return (
    <ExperiencePlanCard
      plan={toUiExperiencePlan(result, route)}
      open={open}
      focusedStopId={focusedStopId}
      onToggle={onToggle}
    />
  );
}
