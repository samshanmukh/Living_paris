"use client";

import { motion } from "framer-motion";
import type { PresetIntentId } from "@/lib/living-paris-intent";

interface PresetChip {
  id: PresetIntentId;
  label: string;
  emoji: string;
  accentColor: string;
}

interface IntentPresetChipsProps {
  presets: PresetChip[];
  selectedId: PresetIntentId | null;
  disabled?: boolean;
  onSelect: (id: PresetIntentId) => void;
}

export default function IntentPresetChips({
  presets,
  selectedId,
  disabled,
  onSelect,
}: IntentPresetChipsProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
      {presets.map((preset) => {
        const selected = selectedId === preset.id;
        return (
          <motion.button
            key={preset.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            disabled={disabled}
            onClick={() => onSelect(preset.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all disabled:opacity-45 ${
              selected
                ? "border-transparent text-white shadow-lg"
                : "lp-glass border-[#e0d5c2] text-[#6b6155] hover:border-[#c9b995] hover:text-[#2b241c]"
            }`}
            style={
              selected
                ? {
                    backgroundColor: preset.accentColor,
                    boxShadow: `0 8px 22px -8px ${preset.accentColor}`,
                  }
                : undefined
            }
          >
            <span className="mr-1">{preset.emoji}</span>
            {preset.label}
          </motion.button>
        );
      })}
    </div>
  );
}
