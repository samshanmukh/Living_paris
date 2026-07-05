"use client";

import { formatCacheAge } from "@/lib/dev/ui-dev-cache";

interface UiDevToolbarProps {
  savedAt: string | null;
  frozen: boolean;
  onCapture: () => void;
  onUseLiveMap: () => void;
  onClear: () => void;
}

export default function UiDevToolbar({
  savedAt,
  frozen,
  onCapture,
  onUseLiveMap,
  onClear,
}: UiDevToolbarProps) {
  return (
    <div className="pointer-events-auto fixed left-3 top-1/2 z-[60] max-w-[200px] -translate-y-1/2 rounded-2xl border border-white/12 bg-black/75 px-3 py-2.5 text-[11px] text-white/70 shadow-xl backdrop-blur-md">
      <p className="font-semibold text-white/90">UI dev cache</p>
      <p className="mt-0.5 text-white/45">
        {savedAt ? `Saved ${formatCacheAge(savedAt)}` : "Nothing saved yet"}
        {frozen ? " · frozen map" : " · live map"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onCapture}
          className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white/80 hover:bg-white/16"
        >
          Save snapshot
        </button>
        {frozen && (
          <button
            type="button"
            onClick={onUseLiveMap}
            className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white/80 hover:bg-white/16"
          >
            Live map
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white/80 hover:bg-white/16"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
