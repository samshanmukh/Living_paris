import { PRESET_BY_ID } from "./presets";
import type { MapMood, ParsedFreeformIntent, PresetIntentId } from "./types";

const MOOD_COLORS: Record<MapMood, { accent: string; glow: string }> = {
  romantic: { accent: "#e879a9", glow: "rgba(232, 121, 169, 0.45)" },
  rainy: { accent: "#d4a054", glow: "rgba(91, 122, 153, 0.5)" },
  hidden: { accent: "#8fa63e", glow: "rgba(201, 168, 76, 0.42)" },
  cozy: { accent: "#c68b59", glow: "rgba(198, 139, 89, 0.45)" },
  culture: { accent: "#9b8cff", glow: "rgba(155, 140, 255, 0.4)" },
  custom: { accent: "#d9a441", glow: "rgba(217, 164, 65, 0.38)" },
};

function parseBudget(text: string): number | undefined {
  const match = text.match(/(?:€|eur[o]?s?\s*)(\d{1,4})|(\d{1,4})\s*(?:€|euros?)|under\s+(\d{1,4})/i);
  if (!match) return undefined;
  return Number(match[1] ?? match[2] ?? match[3]);
}

function parseTimeBudget(text: string): number | undefined {
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  if (/an hour|one hour/i.test(text)) return 60;
  const mins = text.match(/(\d{1,3})\s*(?:minutes?|mins?)\b/i);
  if (mins) return Number(mins[1]);
  return undefined;
}

function scorePreset(text: string, presetId: PresetIntentId): number {
  const lower = text.toLowerCase();
  const patterns: Record<PresetIntentId, RegExp[]> = {
    "date-night": [/romantic|date night|anniversary|partner|proposal|girlfriend|boyfriend/i],
    "rainy-day": [/rain|rainy|drizzle|pouring|cozy rainy|under cover|indoor/i],
    "hidden-gems": [/hidden|secret|local|off the beaten|no tourists|gem/i],
    "cozy-cafe": [/cozy|caf[eé]|coffee|bookstore|quiet.*caf|warm corner|espresso/i],
    "art-culture": [/art|museum|gallery|culture|exhibit|monument/i],
  };
  return patterns[presetId].reduce((score, pattern) => score + (pattern.test(lower) ? 2 : 0), 0);
}

/**
 * Local freeform intent parser — replace with LLM/API later.
 * Maps keywords to closest preset or builds a custom hybrid intent.
 */
export function parseFreeformIntent(text: string): ParsedFreeformIntent {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const budget = parseBudget(trimmed);
  const timeBudgetMinutes = parseTimeBudget(trimmed);

  const scores = (Object.keys(PRESET_BY_ID) as PresetIntentId[]).map((id) => ({
    id,
    score: scorePreset(trimmed, id),
  }));
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  const hasBookCafe = /bookstore|book shop|quiet.*caf|caf[eé].*book/i.test(lower);
  const hasRomanticBudget = /romantic/i.test(lower) && (budget != null || /not too expensive|low[- ]key|cheap/i.test(lower));
  const hasBeautifulFood = /beautiful|scenic|view/i.test(lower) && /food|eat|restaurant|dinner|lunch/i.test(lower);
  const hasMarais = /marais|le marais/i.test(lower);

  if (hasBookCafe) {
    const colors = MOOD_COLORS.cozy;
    return {
      mapMood: "custom",
      customLabel: "Quiet Café Wander",
      customTitle: "Quiet Café Wander",
      customSubtitle: "Bookstores, soft corners, and unhurried sips",
      customResponse: "I mapped a quiet café wander — literary, calm, and very local.",
      accentColor: colors.accent,
      glowColor: colors.glow,
      promptText: trimmed,
      timeBudgetMinutes,
      budget,
    };
  }

  if (hasRomanticBudget) {
    const colors = MOOD_COLORS.romantic;
    return {
      presetId: "date-night",
      mapMood: "romantic",
      customLabel: "Low-Key Date Night",
      customTitle: "Low-Key Date Night",
      customSubtitle: "Romantic without the splurge — warm and walkable",
      customResponse: "Low-key romance — intimate spots that stay kind to your budget.",
      accentColor: colors.accent,
      glowColor: colors.glow,
      promptText: trimmed,
      timeBudgetMinutes,
      budget,
    };
  }

  if (hasBeautifulFood) {
    const colors = MOOD_COLORS.custom;
    return {
      mapMood: "custom",
      customLabel: "Beautiful & Delicious",
      customTitle: "Beautiful & Delicious",
      customSubtitle: "Scenic views paired with something worth tasting",
      customResponse: "Beautiful views and good food — here's the tastiest scenic loop.",
      accentColor: colors.accent,
      glowColor: colors.glow,
      promptText: trimmed,
      timeBudgetMinutes,
      budget,
    };
  }

  if (best.score >= 2 && best.id) {
    const preset = PRESET_BY_ID[best.id];
    // Marais requests default to a 90-minute budget — keep the backend in
    // sync with the subtitle instead of only implying it in copy.
    const effectiveTime = timeBudgetMinutes ?? (hasMarais ? 90 : undefined);
    return {
      presetId: best.id,
      mapMood: preset.mapMood,
      accentColor: preset.accentColor,
      glowColor: preset.glowColor,
      promptText: trimmed,
      timeBudgetMinutes: effectiveTime,
      budget,
      customTitle: hasMarais ? `${preset.title} · Le Marais` : undefined,
      customSubtitle: hasMarais
        ? `Tailored for ${effectiveTime ?? 90} minutes near Le Marais`
        : timeBudgetMinutes
          ? `About ${timeBudgetMinutes} minutes, trimmed to fit`
          : undefined,
    };
  }

  const colors = MOOD_COLORS.custom;
  return {
    mapMood: "custom",
    customLabel: "Your Paris Moment",
    customTitle: "Your Paris Moment",
    customSubtitle: hasMarais ? "Shaped around Le Marais" : "Shaped around what you asked for",
    customResponse: "Got it — I'm reshaping Paris around what you described.",
    accentColor: colors.accent,
    glowColor: colors.glow,
    promptText: trimmed,
    timeBudgetMinutes,
    budget,
  };
}
