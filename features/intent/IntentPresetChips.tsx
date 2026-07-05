"use client";

import type { DemoScenarioId } from "@/lib/demo-bundles";
import type { PresetIntentId } from "@/lib/living-paris-intent";
import PresetChipRow from "@/features/ui/components/PresetChipRow";
import { toUiPresetChips } from "@/features/ui/adapters/living-paris";

export type ScenarioChipId = PresetIntentId | DemoScenarioId;

export interface PresetChipOption {
  id: ScenarioChipId;
  label: string;
  emoji: string;
  accentColor: string;
}

interface IntentPresetChipsProps {
  presets: PresetChipOption[];
  selectedId: ScenarioChipId | null;
  disabled?: boolean;
  onSelect: (id: ScenarioChipId) => void;
}

export default function IntentPresetChips({
  presets,
  selectedId,
  disabled,
  onSelect,
}: IntentPresetChipsProps) {
  return (
    <PresetChipRow
      presets={toUiPresetChips(presets)}
      selectedId={selectedId}
      disabled={disabled}
      onSelect={(id) => onSelect(id as ScenarioChipId)}
    />
  );
}
