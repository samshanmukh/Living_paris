/** Design tokens — copy into Lovable or reference from globals.css @theme. */

export const palette = {
  cream: "#f3ede2",
  creamSoft: "#faf6ee",
  ink: "#2b241c",
  inkSoft: "#6b6155",
  inkMuted: "#8a7d6b",
  inkFaint: "#a09380",
  inkWhisper: "#b3a893",
  terracotta: "#c4593a",
  forest: "#3e6b4a",
  gold: "#d9a441",
  rain: "#5b7a99",
  border: "#e5dbc9",
  borderSoft: "#ece2d0",
  borderInput: "#e0d5c2",
  surface: "#efe7d8",
  canvas: "#efe9df",
} as const;

export const drawerSnap = {
  collapsed: "232px",
  expanded: 0.74,
} as const;

export const layerDotClass: Record<string, string> = {
  cafes: "bg-terracotta",
  museums: "bg-gold",
  parks: "bg-forest",
  trees: "bg-forest",
  metro: "bg-rain",
};
