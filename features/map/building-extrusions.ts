import type { Map as MLMap } from "maplibre-gl";

/** 3D building mesh when the basemap exposes openmaptiles building layer. */
export function addBuildingExtrusions(map: MLMap) {
  if (map.getLayer("lp-buildings")) return;

  const style = map.getStyle();
  const hasSource = style?.sources && "openmaptiles" in style.sources;
  if (!hasSource) return;

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
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], ["get", "height"], 10],
            0,
            "#e8e0d4",
            40,
            "#c9bfb0",
            120,
            "#a89888",
          ],
          "fill-extrusion-height": [
            "coalesce",
            ["get", "render_height"],
            ["get", "height"],
            12,
          ],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.72,
        },
      },
      firstSymbol
    );
  } catch {
    // Basemap may not support extrusions — ignore.
  }
}
