import { z } from "zod";
import { PERSONA_IDS } from "./persona/types";
import { LAYER_TYPES } from "./types";

export const intentSchema = z.object({
  mood: z
    .enum([
      "romantic",
      "family",
      "rainy",
      "photography",
      "nightlife",
      "relaxing",
      "hidden",
      "food",
      "culture",
      "general",
    ])
    .optional(),
  budget: z.number().positive().optional(),
  walk: z.number().positive().optional(),
  accessibility: z.boolean().optional(),
  indoor: z.boolean().optional(),
  rainy: z.boolean().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  radius: z.number().positive().optional(),
  layers: z.array(z.enum(LAYER_TYPES)).optional(),
  limit: z.number().int().positive().max(500).optional(),
  timeBudget: z.number().positive().max(24 * 60).optional(),
  dietary: z.array(z.string().min(1)).max(10).optional(),
  persona: z.enum(PERSONA_IDS).optional(),
});

export type IntentInput = z.infer<typeof intentSchema>;
