"use client";

import LanguagePicker from "@/features/ui/components/LanguagePicker";
import { LOCALES } from "@/lib/i18n";
import { useLanguage } from "@/components/app/LanguageProvider";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <LanguagePicker
      value={locale}
      ariaLabel={t.language.label}
      options={LOCALES.map(({ code, labelKey }) => ({
        code,
        label: t.language[labelKey],
      }))}
      onChange={(code) => setLocale(code as typeof locale)}
    />
  );
}
