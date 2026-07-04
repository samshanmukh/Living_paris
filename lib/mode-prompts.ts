import type { ExperienceId } from "@/lib/types";

/** Default natural-language prompts for each experience mode (demo chips). */
export const MODE_PROMPTS: Record<ExperienceId, string> = {
  "date-night": "Plan a romantic evening under 60 euros",
  "family-day": "I'm traveling with kids — parks and easy metro stops",
  "hidden-gems": "Show me quiet local places tourists miss",
  "rainy-day": "It's raining — find indoor places nearby",
  "food-tour": "Best food within a 15-minute walk",
  "photo-walk": "Show me hidden photography spots in Paris",
  "museums-art": "Show me museums and art places I can visit today",
  "relaxing-walk": "Find a calm, green walk with cafés along the way",
  nightlife: "Plan a fun night out with late cafés and metro access",
  "local-explorer": "Wander like a local — mix of cafés, parks, and culture",
};

export const OPENING_CHIP_IDS: ExperienceId[] = [
  "date-night",
  "family-day",
  "hidden-gems",
  "food-tour",
  "rainy-day",
  "photo-walk",
  "museums-art",
  "relaxing-walk",
  "nightlife",
  "local-explorer",
];
