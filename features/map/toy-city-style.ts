import type { Map as MLMap } from "maplibre-gl";

/**
 * Recolors the liberty basemap into a warm "miniature city" look:
 * cream ground, pastel parks, powder water, soft warm roads.
 */
export function applyToyCityStyle(map: MLMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  const set = (id: string, prop: string, value: unknown) => {
    try {
      if (map.getLayer(id)) map.setPaintProperty(id, prop, value as never);
    } catch {
      // Property may not exist on this layer type — skip.
    }
  };

  set("background", "background-color", "#efe9df");

  for (const layer of style.layers) {
    const id = layer.id;

    if (id === "water" || id.startsWith("waterway")) {
      set(id, "fill-color", "#bcd7e8");
      set(id, "line-color", "#bcd7e8");
      continue;
    }

    if (id.startsWith("park") || id.startsWith("landcover_wood") || id.startsWith("landcover_grass")) {
      set(id, "fill-color", "#cfe3c0");
      set(id, "fill-opacity", 0.85);
      continue;
    }

    if (id.startsWith("landuse")) {
      set(id, "fill-color", "#eae2d3");
      continue;
    }

    if (id.startsWith("building")) {
      set(id, "fill-color", "#e6d9c8");
      set(id, "fill-extrusion-color", "#e6d9c8");
      continue;
    }

    if (id.includes("motorway") || id.includes("trunk_primary")) {
      set(id, "line-color", id.includes("casing") ? "#dcc9ae" : "#f7efe2");
      continue;
    }

    if (id.startsWith("road_") || id.startsWith("bridge_") || id.startsWith("tunnel_")) {
      if (id.includes("casing")) {
        set(id, "line-color", "#ded2bf");
      } else if (layer.type === "line") {
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
export function addToyBuildings(map: MLMap) {
  if (map.getLayer("lp-buildings")) return;

  const style = map.getStyle();
  const hasSource = style?.sources && "openmaptiles" in style.sources;
  if (!hasSource) return;

  if (map.getLayer("building-3d")) {
    try {
      map.removeLayer("building-3d");
    } catch {
      // Already gone.
    }
  }

  const firstSymbol = style.layers?.find(
    (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
  )?.id;

  try {
    map.addLayer(
      {
        id: "lp-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 12.5,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], ["get", "height"], 10],
            0,
            "#f3e6d2",
            18,
            "#ecd7bb",
            45,
            "#dfb99a",
            90,
            "#c99277",
          ],
          "fill-extrusion-height": [
            "*",
            1.25,
            ["coalesce", ["get", "render_height"], ["get", "height"], 12],
          ],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
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
