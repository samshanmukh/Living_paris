import type { IntentInput } from "@/lib/intent-schema";
import type { SpatialQueryResult } from "@/lib/types";

function moodLabel(mood?: string): string {
  if (!mood || mood === "general") return "Paris";
  return mood.replace(/-/g, " ");
}

export function generateChatMessage(
  intent: IntentInput,
  spatial: SpatialQueryResult
): string {
  const count = spatial.totalFeatures;
  const topNames = spatial.geojson.features
    .slice(0, 3)
    .map((f) => f.properties.name)
    .filter(Boolean);

  const parts: string[] = [];

  if (intent.mood && intent.mood !== "general") {
    parts.push(`I found ${count} places for a ${moodLabel(intent.mood)} experience`);
  } else {
    parts.push(`I found ${count} places in Paris`);
  }

  if (intent.budget != null) {
    parts.push(`within about €${intent.budget}`);
  }

  if (intent.walk != null) {
    parts.push(`within a ${intent.walk}-minute walk`);
  }

  if (intent.accessibility) {
    parts.push("with accessibility in mind");
  }

  if (intent.rainy || intent.indoor) {
    parts.push("— good options while the weather is wet");
  }

  let message = parts.join(" ") + ".";

  if (topNames.length > 0) {
    message += ` Highlights include ${topNames.join(", ")}.`;
  }

  if (count === 0) {
    message =
      "I couldn't find matching spots nearby. Try widening your walk time or changing the mood.";
  }

  return message;
}
