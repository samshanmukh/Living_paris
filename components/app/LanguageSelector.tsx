"use client";

import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/app/LanguageProvider";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <label className="language-selector">
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{t.language.label}</span>
      <select
        value={locale}
        aria-label={t.language.label}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LOCALES.map(({ code, labelKey }) => (
          <option key={code} value={code}>
            {t.language[labelKey]}
          </option>
        ))}
      </select>
    </label>
  );
}
