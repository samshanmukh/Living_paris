"use client";

import { CONTEXT_OVERLAY_LAYERS } from "@/lib/map-layer-styles";
import { LAYER_METADATA } from "@/lib/constants";
import type { LayerType } from "@/lib/types";

interface MapLayerControlsProps {
  visibleLayers: LayerType[];
  hiddenLayers: Set<LayerType>;
  onToggle: (layer: LayerType) => void;
}

const OVERLAY_LABELS: Partial<Record<LayerType, string>> = {
  bikes: "Bikes",
  noise: "Noise",
  "air-quality": "Air",
};

export default function MapLayerControls({
  visibleLayers,
  hiddenLayers,
  onToggle,
}: MapLayerControlsProps) {
  const toggles = visibleLayers.filter((layer) => CONTEXT_OVERLAY_LAYERS.includes(layer));
  if (!toggles.length) return null;

  return (
    <div className="pointer-events-auto flex flex-wrap justify-center gap-1.5">
      {toggles.map((layer) => {
        const on = !hiddenLayers.has(layer);
        const label = OVERLAY_LABELS[layer] ?? LAYER_METADATA[layer]?.name ?? layer;
        return (
          <button
            key={layer}
            type="button"
            onClick={() => onToggle(layer)}
            className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide transition ${
              on
                ? "bg-[#2b241c]/85 text-white shadow-sm"
                : "lp-glass text-[#8a7d6b] ring-1 ring-[#e0d5c2]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
