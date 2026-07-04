import { en } from "./messages/en";
import { fr } from "./messages/fr";
import type { Locale, Messages } from "./types";

export type { CommonOption, Locale, Messages, SceneCopy } from "./types";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: { code: Locale; labelKey: "english" | "french" }[] = [
  { code: "en", labelKey: "english" },
  { code: "fr", labelKey: "french" },
];

const catalogs: Record<Locale, Messages> = {
  en,
  fr,
};

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "fr";
}

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}
