import type { MapMood } from "./types";

interface IntentIconProps {
  mood: MapMood;
  emoji: string;
  className?: string;
}

export function IntentIcon({ mood, emoji, className = "" }: IntentIconProps) {
  const ring: Record<MapMood, string> = {
    romantic: "ring-[#e879a9]/40 bg-[#e879a9]/15",
    rainy: "ring-[#5b7a99]/40 bg-[#5b7a99]/20",
    hidden: "ring-[#8fa63e]/40 bg-[#8fa63e]/15",
    cozy: "ring-[#c68b59]/40 bg-[#c68b59]/15",
    culture: "ring-[#9b8cff]/40 bg-[#9b8cff]/15",
    custom: "ring-[#d9a441]/35 bg-[#d9a441]/12",
  };

  return (
    <span
      className={`grid h-8 w-8 place-items-center rounded-full text-base ring-1 ${ring[mood]} ${className}`}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

export function MoodWeatherIcon({ mood }: { mood: MapMood }) {
  const icon: Record<MapMood, string> = {
    romantic: "🌙",
    rainy: "🌧️",
    hidden: "🧭",
    cozy: "☕",
    culture: "🎭",
    custom: "✨",
  };
  return <span className="text-sm">{icon[mood]}</span>;
}
