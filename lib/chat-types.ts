import { z } from "zod";
import type { IntentInput } from "@/lib/intent-schema";
import type { LayerType, ParisFeatureCollection } from "@/lib/types";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(chatMessageSchema).max(20).optional(),
  context: z
    .object({
      lat: z.number().min(-90).max(90).optional(),
      lon: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type MapTheme = "default" | "rain" | "night" | "romantic" | "family";

/** Interim map payload for Rushendra — replace with Experience Engine MapState when merged. */
export interface ChatMapState {
  center: [number, number];
  zoom?: number;
  activeLayers: LayerType[];
  highlights: ParisFeatureCollection;
  theme: MapTheme;
  meta?: {
    radiusMeters: number;
    totalFeatures: number;
    queryMs: number;
  };
}

export interface ChatResponse {
  message: string;
  intent: IntentInput;
  mapState: ChatMapState;
}
