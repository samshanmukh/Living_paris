import { IntentIcon } from "@/lib/living-paris-intent/icons";
import type {
  UiChatMessage,
  UiIntentSummary,
  UiPlanStop,
  UiPresetChip,
} from "@/features/ui/types";

/** Mock data for /ui-sandbox and Lovable previews — no API or map deps. */

const romanticSummary: UiIntentSummary = {
  id: "date-night",
  title: "Romantic evening",
  subtitle: "Cafés, views, and a slow walk by the Seine",
  icon: <IntentIcon mood="romantic" emoji="❤️" />,
  accentColor: "#e879a9",
  glowColor: "rgba(232, 121, 169, 0.35)",
  distance: "2.1 km",
  duration: "45 min",
  moodEmoji: "🌙",
  sourceBadge: "demo",
};

const romanticStops: UiPlanStop[] = [
  {
    id: "stop-1",
    number: 1,
    name: "Café des Muse",
    category: "Café",
    description: "Terrace with soft lighting and a view of the courtyard.",
    duration: "40 min",
    imageBackground: "linear-gradient(145deg, #c68b59, #8b5a3c)",
  },
  {
    id: "stop-2",
    number: 2,
    name: "Pont des Arts",
    category: "View",
    description: "Golden hour over the river — classic Paris pause.",
    duration: "15 min",
    imageBackground: "linear-gradient(145deg, #d9a441, #c4593a)",
  },
];

const presets: UiPresetChip[] = [
  { id: "date-night", label: "Date night", emoji: "❤️", accentColor: "#e879a9" },
  { id: "rainy-day", label: "Rainy day", emoji: "🌧️", accentColor: "#5b7a99" },
  { id: "hidden-gems", label: "Hidden gems", emoji: "🧭", accentColor: "#8fa63e" },
  { id: "cozy-cafe", label: "Cozy café", emoji: "☕", accentColor: "#c68b59" },
];

const messages: UiChatMessage[] = [
  { id: "m1", role: "user", text: "Plan a romantic evening under €60" },
  {
    id: "m2",
    role: "assistant",
    text: "I found a slow loop — terrace café, river view, and a short walk back through the Marais.",
  },
];

export const uiDemoFixtures = {
  summary: romanticSummary,
  stops: romanticStops,
  presets,
  messages,
  response: "Golden hour on the Seine — I lined up two stops within a gentle 20-minute walk.",
  glowColor: romanticSummary.glowColor,
  accentColor: romanticSummary.accentColor,
};
