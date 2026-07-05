import type { ExperienceResult, IntentQuery } from "@/lib/types";
import type { RouteResponse } from "@/services/routing/route-planner";

/** Response contract for POST /api/chat (integrated pipeline). */
export interface IntegratedChatResponse {
  reply: string;
  intent: IntentQuery;
  result: ExperienceResult;
  route: RouteResponse | null;
  intentSource: "llm" | "heuristic";
}
