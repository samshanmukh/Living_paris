import { PERSONA_PRESETS } from "@/lib/persona/constants";
import type { PersonaPreset, PersonaId } from "@/lib/persona/types";
import type { IntentQuery, LayerType } from "@/lib/types";

/** Message keyword patterns → persona id (first match wins). */
const PERSONA_KEYWORD_PATTERNS: [RegExp, PersonaId][] = [
  [/blind|visual impair(?:ment|ed)/i, "visually-impaired"],
  [/wheelchair|step[- ]free|accessible route/i, "wheelchair"],
  [/asthma|clean air/i, "asthma"],
  [/halal|muslim food/i, "halal"],
  [/sensory|low stimulus/i, "sensory"],
  [/\bquiet\b/i, "sensory"],
  [/night safety|well lit/i, "night-safety"],
  [/date night|romantic evening/i, "date-night"],
];

export function detectPersonaFromMessage(message: string): PersonaId | undefined {
  for (const [pattern, id] of PERSONA_KEYWORD_PATTERNS) {
    if (pattern.test(message)) return id;
  }
  return undefined;
}

export function resolvePersona(intent: IntentQuery): PersonaPreset | null {
  if (!intent.persona) return null;
  return PERSONA_PRESETS[intent.persona] ?? null;
}

export function applyPersonaToIntent(
  intent: IntentQuery,
  persona: PersonaPreset
): IntentQuery {
  const merged: IntentQuery = { ...intent, persona: persona.id };

  merged.layers = [...new Set<LayerType>([
    ...(intent.layers ?? []),
    ...persona.primaryLayers,
  ])];

  if (persona.filterHints.accessibility) {
    merged.accessibility = true;
  }

  if (persona.filterHints.dietary?.length) {
    merged.dietary = [
      ...new Set([...(intent.dietary ?? []), ...persona.filterHints.dietary]),
    ];
  }

  return merged;
}
