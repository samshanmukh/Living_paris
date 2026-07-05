"use client";

import type { ReactNode, RefObject } from "react";
import {
  CloudRain,
  LocateFixed,
  MapPin,
  Minus,
  Mountain,
  Plus,
  RotateCcw,
} from "lucide-react";
import type { MapRef } from "react-map-gl/mapbox";
import { rainModeLabel } from "@/lib/rainMode";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  mapRef: RefObject<MapRef | null>;
  rainMode: boolean;
  is3D: boolean;
  onToggleRain: () => void;
  onToggle3D: () => void;
  onRecenter: () => void;
}

export default function MapControls({
  mapRef,
  rainMode,
  is3D,
  onToggleRain,
  onToggle3D,
  onRecenter,
}: MapControlsProps) {
  const zoom = (delta: number) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.zoomTo(map.getZoom() + delta, { duration: 350 });
  };

  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
        duration: 1200,
      });
    });
  };

  return (
    <div className="pointer-events-auto absolute right-3 top-24 z-30 flex flex-col gap-2 sm:top-28">
      <ControlButton label="Recenter Paris" onClick={onRecenter}>
        <RotateCcw size={16} />
      </ControlButton>
      <ControlButton label="My location" onClick={geolocate}>
        <LocateFixed size={16} />
      </ControlButton>
      <ControlButton label="Zoom in" onClick={() => zoom(0.6)}>
        <Plus size={16} />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={() => zoom(-0.6)}>
        <Minus size={16} />
      </ControlButton>
      <ControlButton label={is3D ? "Switch to 2D" : "Switch to 3D"} onClick={onToggle3D}>
        <Mountain size={16} />
      </ControlButton>
      <ControlButton
        label={rainModeLabel(rainMode)}
        onClick={onToggleRain}
        active={rainMode}
      >
        <CloudRain size={16} />
      </ControlButton>
      <div className="glass mt-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium text-[var(--ink-soft)]">
        <MapPin size={12} className="mr-1 inline" />
        Companion map
      </div>
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "glass grid h-10 w-10 place-items-center rounded-2xl text-[var(--ink)] transition hover:scale-[1.03]",
        active && "ring-2 ring-[var(--accent)]"
      )}
    >
      {children}
    </button>
  );
}
