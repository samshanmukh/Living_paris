import type { DioramaSceneId } from "@/lib/demo-bundles";

/** Isometric Marais block — golden hour reference mood. */
export function GoldenHourScene() {
  return (
    <svg
      viewBox="0 0 400 280"
      className="h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7e4c8" />
          <stop offset="55%" stopColor="#f3d9b8" />
          <stop offset="100%" stopColor="#e8c89a" />
        </linearGradient>
        <radialGradient id="gh-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#ffd98a" />
          <stop offset="100%" stopColor="#ffb84d" stopOpacity="0" />
        </radialGradient>
        <filter id="gh-soft-shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#8a6d4a" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect width="400" height="280" fill="url(#gh-sky)" />
      <circle cx="330" cy="52" r="38" fill="url(#gh-sun)" className="lp-diorama-sun" />
      <circle cx="330" cy="52" r="16" fill="#ffe9a8" opacity="0.95" />

      {/* Platform base */}
      <ellipse cx="200" cy="248" rx="168" ry="22" fill="#e8dcc8" opacity="0.55" />
      <path
        d="M 48 230 L 352 230 L 368 248 L 32 248 Z"
        fill="#faf5ec"
        stroke="#e5d9c4"
        strokeWidth="2"
        filter="url(#gh-soft-shadow)"
      />

      {/* Buildings — simplified isometric blocks */}
      <g className="lp-diorama-buildings">
        <BuildingBlock x={70} y={130} w={55} h={70} roof="#dfb99a" wall="#f0e0cc" windows />
        <BuildingBlock x={130} y={115} w={62} h={85} roof="#d4a574" wall="#ecd7bb" windows awning />
        <BuildingBlock x={200} y={125} w={58} h={75} roof="#e6c9a8" wall="#f3e6d2" windows />
        <BuildingBlock x={265} y={110} w={68} h={90} roof="#c99277" wall="#e8d5bc" windows awning />
        <BuildingBlock x={310} y={140} w={48} h={60} roof="#dfb99a" wall="#efe3cf" windows />
      </g>

      {/* Street */}
      <path
        d="M 60 228 L 340 228 L 320 218 L 80 218 Z"
        fill="#d8cfc0"
        opacity="0.85"
      />
      <path d="M 165 218 L 175 228 L 185 218" fill="#c9b89a" opacity="0.5" />

      {/* Trees */}
      <circle cx="95" cy="208" r="10" fill="#8fb87a" opacity="0.85" />
      <rect x="92" y="208" width="6" height="12" fill="#a08060" rx="1" />
      <circle cx="305" cy="205" r="9" fill="#8fb87a" opacity="0.8" />
      <rect x="302" y="205" width="6" height="11" fill="#a08060" rx="1" />
    </svg>
  );
}

/** Minuit reference — moon, lit windows, jazz-night mood. */
export function MinuitScene() {
  return (
    <svg
      viewBox="0 0 400 280"
      className="h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="mn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2438" />
          <stop offset="100%" stopColor="#2a3548" />
        </linearGradient>
        <radialGradient id="mn-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffef5" />
          <stop offset="70%" stopColor="#e8e4d0" />
          <stop offset="100%" stopColor="#c8c4b0" stopOpacity="0" />
        </radialGradient>
        <filter id="mn-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Star dots */}
      {[
        [40, 30],
        [120, 45],
        [200, 25],
        [280, 50],
        [350, 35],
        [80, 70],
        [300, 75],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.2" fill="#fff" opacity="0.5" />
      ))}

      <rect width="400" height="280" fill="url(#mn-sky)" />
      <circle cx="320" cy="48" r="28" fill="url(#mn-moon)" />
      <circle cx="320" cy="48" r="14" fill="#f5f2e8" />

      <ellipse cx="200" cy="248" rx="168" ry="22" fill="#0f1520" opacity="0.4" />
      <path
        d="M 48 230 L 352 230 L 368 248 L 32 248 Z"
        fill="#3a4558"
        stroke="#4a5568"
        strokeWidth="2"
      />

      <g className="lp-diorama-buildings">
        <BuildingBlock x={70} y={130} w={55} h={70} roof="#4a5568" wall="#5a6578" windows lit />
        <BuildingBlock x={130} y={115} w={62} h={85} roof="#3d4858" wall="#525d70" windows lit awning />
        <BuildingBlock x={200} y={125} w={58} h={75} roof="#454f60" wall="#586374" windows lit />
        <BuildingBlock x={265} y={110} w={68} h={90} roof="#3a4455" wall="#4f5a6d" windows lit awning />
        <BuildingBlock x={310} y={140} w={48} h={60} roof="#4a5568" wall="#5d6878" windows lit />
      </g>

      <path d="M 60 228 L 340 228 L 320 218 L 80 218 Z" fill="#2a3344" opacity="0.9" />

      {/* Warm street lamp glow */}
      <circle cx="170" cy="200" r="18" fill="#f0b45a" opacity="0.15" filter="url(#mn-glow)" />
      <circle cx="170" cy="200" r="4" fill="#ffd98a" opacity="0.9" />
    </svg>
  );
}

/** Soft daytime — calm, accessible, health-focused demos. */
export function SoftDayScene() {
  return (
    <svg
      viewBox="0 0 400 280"
      className="h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef4f8" />
          <stop offset="100%" stopColor="#e4ebe3" />
        </linearGradient>
      </defs>

      <rect width="400" height="280" fill="url(#sd-sky)" />

      <ellipse cx="200" cy="248" rx="168" ry="22" fill="#d8e0d4" opacity="0.5" />
      <path
        d="M 48 230 L 352 230 L 368 248 L 32 248 Z"
        fill="#f7f5f0"
        stroke="#e0ddd4"
        strokeWidth="2"
      />

      <g className="lp-diorama-buildings">
        <BuildingBlock x={70} y={130} w={55} h={70} roof="#d4cfc4" wall="#ebe6dc" windows />
        <BuildingBlock x={130} y={115} w={62} h={85} roof="#c9c4b8" wall="#e5e0d6" windows awning />
        <BuildingBlock x={200} y={125} w={58} h={75} roof="#d0cbc0" wall="#ece7dd" windows />
        <BuildingBlock x={265} y={110} w={68} h={90} roof="#bfb9ae" wall="#e2ddd3" windows awning />
        <BuildingBlock x={310} y={140} w={48} h={60} roof="#d4cfc4" wall="#ebe6dc" windows />
      </g>

      <path d="M 60 228 L 340 228 L 320 218 L 80 218 Z" fill="#ddd8cc" opacity="0.75" />
      <circle cx="100" cy="205" r="11" fill="#9bc49a" opacity="0.75" />
      <rect x="97" y="205" width="6" height="13" fill="#8a9078" rx="1" />
      <circle cx="290" cy="208" r="10" fill="#9bc49a" opacity="0.7" />
      <rect x="287" y="208" width="6" height="12" fill="#8a9078" rx="1" />
    </svg>
  );
}

function BuildingBlock({
  x,
  y,
  w,
  h,
  roof,
  wall,
  windows = false,
  lit = false,
  awning = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  roof: string;
  wall: string;
  windows?: boolean;
  lit?: boolean;
  awning?: boolean;
}) {
  return (
    <g>
      <path
        d={`M ${x} ${y + h} L ${x + w} ${y + h} L ${x + w + 12} ${y + h - 18} L ${x + 12} ${y + h - 18} Z`}
        fill={roof}
      />
      <path
        d={`M ${x} ${y + h} L ${x + 12} ${y + h - 18} L ${x + 12} ${y + 18} L ${x} ${y + 36} Z`}
        fill={wall}
        opacity="0.92"
      />
      <path
        d={`M ${x} ${y + 36} L ${x + 12} ${y + 18} L ${x + w + 12} ${y + 18} L ${x + w} ${y + h} L ${x} ${y + h} Z`}
        fill={wall}
      />
      {windows &&
        [0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={x + 16 + col * 18}
              y={y + 50 + row * 22}
              width="10"
              height="12"
              rx="1"
              fill={lit ? "#ffd98a" : "#d4cbb8"}
              opacity={lit ? 0.85 : 0.6}
              className={lit ? "lp-diorama-window" : undefined}
            />
          ))
        )}
      {awning && (
        <path
          d={`M ${x + 8} ${y + h - 4} L ${x + w + 4} ${y + h - 4} L ${x + w + 8} ${y + h - 14} L ${x + 4} ${y + h - 14} Z`}
          fill="#c4593a"
          opacity="0.85"
        />
      )}
    </g>
  );
}

export function DioramaScene({ sceneId }: { sceneId: DioramaSceneId }) {
  switch (sceneId) {
    case "golden-hour":
      return <GoldenHourScene />;
    case "minuit":
      return <MinuitScene />;
    case "soft-day":
      return <SoftDayScene />;
  }
}
