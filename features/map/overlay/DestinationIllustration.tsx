"use client";

import type { SceneKind } from "./types";
import { overlayPalette as c } from "./palette";

interface DestinationIllustrationProps {
  scene: SceneKind;
  highlighted?: boolean;
}

/** Miniature 2.5D architectural vignettes — SVG + layered CSS perspective. */
export default function DestinationIllustration({
  scene,
  highlighted,
}: DestinationIllustrationProps) {
  return (
    <div
      className="relative origin-bottom"
      style={{
        width: highlighted ? 78 : 68,
        height: highlighted ? 86 : 76,
        transform: "rotateX(58deg) rotateZ(-10deg)",
        transformStyle: "preserve-3d",
        filter: highlighted
          ? "drop-shadow(0 18px 22px rgba(43,36,28,0.28))"
          : "drop-shadow(0 12px 16px rgba(43,36,28,0.22))",
      }}
    >
      <svg viewBox="0 0 80 88" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="lp-roof" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.terracottaSoft} />
            <stop offset="100%" stopColor={c.terracotta} />
          </linearGradient>
          <linearGradient id="lp-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf3e8" />
            <stop offset="100%" stopColor="#e8dcc8" />
          </linearGradient>
          <linearGradient id="lp-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.amberGlow} />
            <stop offset="100%" stopColor={c.amber} />
          </linearGradient>
        </defs>

        {/* Ground shadow plate */}
        <ellipse cx="40" cy="82" rx="28" ry="6" fill="rgba(43,36,28,0.12)" />

        {scene === "cafe" && <CafeScene />}
        {scene === "bakery" && <BakeryScene />}
        {scene === "museum" && <MuseumScene />}
        {scene === "restaurant" && <RestaurantScene />}
        {scene === "bookstore" && <BookstoreScene />}
        {scene === "park" && <ParkScene />}
        {scene === "courtyard" && <CourtyardScene />}
      </svg>
    </div>
  );
}

function CafeScene() {
  return (
    <>
      <path d="M12 58 L68 58 L72 68 L8 68 Z" fill="url(#lp-wall)" stroke="#d8ccb8" />
      <path d="M10 38 L70 38 L68 58 L12 58 Z" fill="url(#lp-wall)" />
      <path d="M8 34 L72 34 L68 38 L12 38 Z" fill="url(#lp-roof)" />
      <path d="M6 30 Q40 18 74 30 L72 34 L8 34 Z" fill={c.terracotta} opacity="0.92" />
      {/* Awning stripes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={14 + i * 9}
          y="40"
          width="4.5"
          height="10"
          fill={i % 2 ? c.cream : c.terracottaSoft}
          opacity="0.9"
        />
      ))}
      <rect x="22" y="48" width="12" height="10" rx="1" fill="url(#lp-window)" opacity="0.95" />
      <rect x="46" y="48" width="12" height="10" rx="1" fill="url(#lp-window)" opacity="0.85" />
      <circle cx="58" cy="66" r="2.5" fill={c.espresso} opacity="0.5" />
      <rect x="54" y="64" width="8" height="1.5" rx="0.5" fill={c.stoneDeep} />
    </>
  );
}

function BakeryScene() {
  return (
    <>
      <path d="M14 56 L66 56 L70 68 L10 68 Z" fill="url(#lp-wall)" />
      <path d="M12 36 L68 36 L66 56 L14 56 Z" fill="#f5ebdc" />
      <path d="M10 32 L70 32 L68 36 L12 36 Z" fill="url(#lp-roof)" />
      <rect x="24" y="42" width="32" height="12" rx="2" fill="url(#lp-window)" />
      <circle cx="32" cy="48" r="3" fill="#e8b87a" />
      <circle cx="40" cy="47" r="2.5" fill="#d4955f" />
      <circle cx="48" cy="48" r="2.8" fill="#edc088" />
      <rect x="28" y="28" width="24" height="6" rx="3" fill={c.amber} opacity="0.85" />
      <text x="40" y="33" textAnchor="middle" fontSize="4.5" fill={c.espresso} fontWeight="600">
        BOULANGERIE
      </text>
    </>
  );
}

function MuseumScene() {
  return (
    <>
      <path d="M10 58 L70 58 L74 68 L6 68 Z" fill="#e7ded0" />
      <path d="M14 40 L66 40 L68 58 L12 58 Z" fill="url(#lp-wall)" />
      <rect x="20" y="44" width="8" height="14" fill="#ddd2c4" />
      <rect x="56" y="44" width="8" height="14" fill="#ddd2c4" />
      <path d="M18 40 L62 40 L58 28 L22 28 Z" fill="#f3ede2" />
      <path d="M16 28 L64 28 L60 24 L20 24 Z" fill="url(#lp-roof)" />
      <circle cx="40" cy="50" r="5" fill={c.stoneDeep} opacity="0.35" />
      <path d="M36 50 L40 44 L44 50 Z" fill={c.charcoal} opacity="0.5" />
    </>
  );
}

function RestaurantScene() {
  return (
    <>
      <path d="M12 58 L68 58 L72 68 L8 68 Z" fill="url(#lp-wall)" />
      <path d="M14 38 L66 38 L68 58 L12 58 Z" fill="#f7efe3" />
      <path d="M10 34 L70 34 L68 38 L12 38 Z" fill={c.stoneDeep} />
      <rect x="20" y="44" width="40" height="12" rx="1" fill="url(#lp-window)" opacity="0.9" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={26 + i * 14} cy="62" r="1.2" fill={c.amberGlow} />
      ))}
      <ellipse cx="22" cy="66" rx="5" ry="2" fill={c.mossSoft} opacity="0.7" />
      <ellipse cx="58" cy="66" rx="5" ry="2" fill={c.mossSoft} opacity="0.7" />
    </>
  );
}

function BookstoreScene() {
  return (
    <>
      <path d="M14 56 L66 56 L70 68 L10 68 Z" fill="url(#lp-wall)" />
      <path d="M16 38 L64 38 L66 56 L14 56 Z" fill="#f3ebe0" />
      <rect x="22" y="42" width="8" height="12" fill={c.terracottaSoft} />
      <rect x="32" y="44" width="6" height="10" fill={c.moss} opacity="0.65" />
      <rect x="40" y="43" width="7" height="11" fill={c.amber} opacity="0.75" />
      <rect x="49" y="45" width="6" height="9" fill={c.stoneDeep} opacity="0.55" />
      <circle cx="58" cy="46" r="4" fill={c.amberGlow} opacity="0.8" />
      <path d="M12 36 L68 36 L64 32 L16 32 Z" fill="url(#lp-roof)" />
    </>
  );
}

function ParkScene() {
  return (
    <>
      <path d="M8 62 Q40 54 72 62 L70 68 L10 68 Z" fill={c.mossSoft} opacity="0.55" />
      <path d="M18 58 L62 58 L60 66 L20 66 Z" fill="#e8dcc8" opacity="0.8" />
      <circle cx="28" cy="48" r="10" fill={c.moss} opacity="0.75" />
      <circle cx="52" cy="46" r="12" fill={c.mossSoft} opacity="0.8" />
      <rect x="36" y="56" width="8" height="2" rx="1" fill={c.stoneDeep} opacity="0.6" />
      <path d="M34 58 L42 58 L40 52 Z" fill={c.stone} />
    </>
  );
}

function CourtyardScene() {
  return (
    <>
      <path d="M16 58 L64 58 L68 68 L12 68 Z" fill="#e9dfd1" />
      <path d="M22 42 Q40 28 58 42 L56 58 L24 58 Z" fill="url(#lp-wall)" />
      <path d="M20 40 L60 40 L58 36 L22 36 Z" fill={c.stoneDeep} opacity="0.55" />
      <path
        d="M26 48 Q40 38 54 48"
        fill="none"
        stroke={c.moss}
        strokeWidth="2"
        opacity="0.55"
      />
      <circle cx="40" cy="62" r="3" fill="#bcd7e8" opacity="0.65" />
      <circle cx="48" cy="36" r="2.5" fill={c.amberGlow} opacity="0.9" />
    </>
  );
}
