import type { PersonaPreset } from "./types";

export const PERSONA_PRESETS: Record<
  PersonaPreset["id"],
  PersonaPreset
> = {
  asthma: {
    id: "asthma",
    name: "Clean Air Path",
    emoji: "🌿",
    description:
      "Parks, side streets, and cafés away from heavy traffic — with live air-quality context.",
    primaryLayers: ["parks", "trees", "cafes", "air-quality"],
    overlayLayers: ["air-quality", "noise"],
    filterHints: { quiet: true },
    scoringBoosts: {
      outdoor: 3,
      quiet: 3,
      lowNoise: 4,
      tags: { park: 3, garden: 2 },
    },
  },
  wheelchair: {
    id: "wheelchair",
    name: "Accessible Dining",
    emoji: "♿",
    description:
      "Step-free venues, flat routes, and metro stations with lift access.",
    primaryLayers: ["accessibility", "cafes", "museums", "metro-accessibility"],
    overlayLayers: ["metro-accessibility", "accessibility"],
    filterHints: { accessibility: true },
    scoringBoosts: {
      accessible: 5,
      indoor: 1,
      tags: { stepfree: 3, ramp: 2 },
    },
  },
  halal: {
    id: "halal",
    name: "Halal Dining",
    emoji: "🕌",
    description:
      "Halal-tagged cafés and restaurants with prayer-time context.",
    primaryLayers: ["halal", "cafes"],
    overlayLayers: ["halal"],
    filterHints: { dietary: ["halal"] },
    scoringBoosts: {
      tags: { halal: 5, muslim: 2 },
    },
  },
  sensory: {
    id: "sensory",
    name: "Sensory-Safe Outing",
    emoji: "🤫",
    description:
      "Quiet interiors, low-stimulus paths, and calm green spaces.",
    primaryLayers: ["parks", "museums", "cafes"],
    overlayLayers: ["noise"],
    filterHints: { quiet: true },
    scoringBoosts: {
      quiet: 5,
      lowNoise: 4,
      indoor: 2,
      tags: { quiet: 3, calm: 2 },
    },
  },
  "night-safety": {
    id: "night-safety",
    name: "Night Safety Route",
    emoji: "🌙",
    description:
      "Well-lit streets, busy corners, and late-open venues after dark.",
    primaryLayers: ["lighting", "cafes", "metro"],
    overlayLayers: ["lighting"],
    filterHints: {},
    scoringBoosts: {
      lowNoise: 1,
      tags: { late: 2, lit: 3 },
    },
  },
  "date-night": {
    id: "date-night",
    name: "Date Night",
    emoji: "🌹",
    description:
      "Romantic cafés, quiet corners, and golden-hour walks.",
    primaryLayers: ["cafes", "parks", "museums"],
    overlayLayers: ["noise", "lighting"],
    filterHints: {},
    scoringBoosts: {
      romantic: 4,
      quiet: 2,
      lowNoise: 2,
      tags: { terrace: 1, scenic: 2 },
    },
  },
  "visually-impaired": {
    id: "visually-impaired",
    name: "Transit Clarity",
    emoji: "🚇",
    description:
      "Simple metro geometry, tactile guidance, and well-lit exits.",
    primaryLayers: ["metro-accessibility", "metro", "accessibility"],
    overlayLayers: ["metro-accessibility", "lighting"],
    filterHints: { accessibility: true },
    scoringBoosts: {
      accessible: 4,
      tags: { tactile: 3, audio: 2, beacon: 2 },
    },
  },
};
