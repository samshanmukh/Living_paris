import type { Map as MapboxMap } from "mapbox-gl";

/**
 * Recolors the Mapbox light basemap into a warm "miniature city" look:
 * cream ground, pastel parks, powder water, soft warm roads.
 */
export function applyToyCityStyle(map: MapboxMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  const set = (id: string, prop: string, value: unknown) => {
    try {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, prop as Parameters<typeof map.setPaintProperty>[1], value as never);
      }
    } catch {
      // Property may not exist on this layer type — skip.
    }
  };

  for (const layer of style.layers) {
    const id = layer.id;
    const lower = id.toLowerCase();

    if (layer.type === "background") {
      set(id, "background-color", "#efe9df");
      continue;
    }

    if (lower.includes("water")) {
      if (layer.type === "fill") set(id, "fill-color", "#bcd7e8");
      if (layer.type === "line") set(id, "line-color", "#a9c9de");
      continue;
    }

    if (
      lower.includes("park") ||
      lower.includes("grass") ||
      lower.includes("wood") ||
      lower.includes("golf") ||
      lower.includes("pitch") ||
      lower.includes("vegetation")
    ) {
      if (layer.type === "fill") {
        set(id, "fill-color", "#cfe3c0");
        set(id, "fill-opacity", 0.85);
      }
      continue;
    }

    if (lower === "land" || lower.includes("landuse") || lower.includes("landcover")) {
      if (layer.type === "fill") set(id, "fill-color", "#eae2d3");
      continue;
    }

    if (lower.includes("building")) {
      if (layer.type === "fill") set(id, "fill-color", "#e6d9c8");
      if (layer.type === "fill-extrusion") set(id, "fill-extrusion-color", "#e6d9c8");
      continue;
    }

    if (
      layer.type === "line" &&
      (lower.includes("road") || lower.includes("bridge") || lower.includes("tunnel") || lower.includes("street"))
    ) {
      if (lower.includes("case") || lower.includes("casing")) {
        set(id, "line-color", "#ded2bf");
      } else {
        set(id, "line-color", "#faf5ec");
      }
      continue;
    }

    if (layer.type === "symbol") {
      set(id, "text-color", "#8a7d6b");
      set(id, "text-halo-color", "#f7f2e9");
    }
  }
}

/** Warm terracotta-roofed 3D buildings — the miniature diorama look. */
export function addToyBuildings(map: MapboxMap) {
  if (map.getLayer("lp-buildings")) return;

  const style = map.getStyle();
  const hasComposite = style?.sources && "composite" in style.sources;
  if (!hasComposite) return;

  const firstSymbol = style.layers?.find((layer) => layer.type === "symbol")?.id;

  try {
    map.addLayer(
      {
        id: "lp-buildings",
        type: "fill-extrusion",
        source: "composite",
        "source-layer": "building",
        minzoom: 12.5,
        filter: ["==", ["get", "extrude"], "true"],
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "height"], 10],
            0,
            "#f3e6d2",
            18,
            "#ecd7bb",
            45,
            "#dfb99a",
            90,
            "#c99277",
          ],
          "fill-extrusion-height": ["*", 1.25, ["coalesce", ["get", "height"], 12]],
          "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
          "fill-extrusion-opacity": 0.92,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      firstSymbol
    );
  } catch {
    // Basemap may not support extrusions — ignore.
  }
}
