"use client";

import { Languages } from "lucide-react";

export interface LanguageOption {
  code: string;
  label: string;
}

interface LanguagePickerProps {
  value: string;
  options: LanguageOption[];
  ariaLabel: string;
  onChange: (code: string) => void;
}

export default function LanguagePicker({
  value,
  options,
  ariaLabel,
  onChange,
}: LanguagePickerProps) {
  return (
    <label className="language-selector">
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{ariaLabel}</span>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
