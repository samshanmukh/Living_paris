import type { PresetIntentDefinition } from "./types";

export const PRESET_INTENTS: PresetIntentDefinition[] = [
  {
    id: "date-night",
    label: "Date Night",
    emoji: "🌹",
    prompt: "Plan a romantic evening under 60 euros",
    accentColor: "#e879a9",
    glowColor: "rgba(232, 121, 169, 0.45)",
    mapMood: "romantic",
    title: "Date Night",
    subtitle: "Soft light, quiet corners, and a walk worth remembering",
    responseTemplate: "I found a low-key romantic route — unhurried, warm, and under budget.",
  },
  {
    id: "rainy-day",
    label: "Rainy Day",
    emoji: "🌧️",
    prompt: "It's raining — find indoor places nearby",
    accentColor: "#d4a054",
    glowColor: "rgba(91, 122, 153, 0.5)",
    mapMood: "rainy",
    title: "Rainy Day",
    subtitle: "Shelter, warmth, and Paris under a softer sky",
    responseTemplate: "Rain noted — I moved everything under cover and kept the mood gentle.",
  },
  {
    id: "hidden-gems",
    label: "Hidden Gems",
    emoji: "💎",
    prompt: "Show me quiet local places tourists miss",
    accentColor: "#8fa63e",
    glowColor: "rgba(201, 168, 76, 0.42)",
    mapMood: "hidden",
    title: "Hidden Gems",
    subtitle: "Quiet passages and spots tour groups never find",
    responseTemplate: "Here are the places locals actually linger — off the obvious trail.",
  },
  {
    id: "cozy-cafe",
    label: "Cozy Café",
    emoji: "☕",
    prompt: "Find a calm café wander with warm corners nearby",
    accentColor: "#c68b59",
    glowColor: "rgba(198, 139, 89, 0.45)",
    mapMood: "cozy",
    title: "Cozy Café",
    subtitle: "Espresso warmth, soft corners, and an easy stroll",
    responseTemplate: "I plotted a cozy café loop — unhurried, warm, and very Paris.",
  },
  {
    id: "art-culture",
    label: "Art & Culture",
    emoji: "🎨",
    prompt: "Show me museums and art places I can visit today",
    accentColor: "#9b8cff",
    glowColor: "rgba(155, 140, 255, 0.4)",
    mapMood: "culture",
    title: "Art & Culture",
    subtitle: "Galleries, collections, and cultural landmarks nearby",
    responseTemplate: "Culture first — here's a refined route through Paris's creative side.",
  },
];

export const PRESET_BY_ID = Object.fromEntries(
  PRESET_INTENTS.map((preset) => [preset.id, preset])
) as Record<(typeof PRESET_INTENTS)[number]["id"], PresetIntentDefinition>;
