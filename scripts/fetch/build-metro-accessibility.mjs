import { fetchAllIdfm, isInParis, pointFeature } from "./shared.mjs";

function isAccessible(levelId, levelName) {
  if (levelId === 1) return false;
  if (levelId === 6) return true;
  if (levelId === 3 || levelId === 4) return true;
  return /autonomie|accessible/i.test(levelName ?? "") && !/non accessible/i.test(levelName ?? "");
}

export async function buildMetroAccessibility() {
  console.log("Fetching metro station accessibility from IDFM...");
  const records = await fetchAllIdfm("accessibilite-en-gare", { maxRecords: 500 });

  const byStop = new Map();

  for (const r of records) {
    const lon = r.stop_point_geopoint?.lon;
    const lat = r.stop_point_geopoint?.lat;
    if (lon == null || lat == null || !isInParis(lon, lat)) continue;

    const accessible = isAccessible(r.accessibility_level_id, r.accessibility_level_name);
    const key = r.stop_name ?? r.stop_point_id;
    const existing = byStop.get(key);

    if (!existing || (accessible && !existing.accessible)) {
      byStop.set(key, { ...r, lon, lat, accessible });
    }
  }

  const features = [...byStop.values()].map((r) => {
    const id = `metro-acc-${r.stop_point_id?.split(":").pop() ?? r.stop_name}`;

    return pointFeature(id, r.lon, r.lat, {
      id,
      name: r.stop_name ?? "Metro station",
      layer: "metro-accessibility",
      type: "metro-station",
      accessible: r.accessible,
      indoor: true,
      familyFriendly: true,
      tags: [
        "metro",
        "accessibility",
        r.accessible ? "accessible" : "not-accessible",
        r.accessibility_level_name?.toLowerCase?.(),
      ].filter(Boolean),
      accessibilityLevel: r.accessibility_level_name,
      source: "data.iledefrance-mobilites.fr/accessibilite-en-gare",
    });
  });

  return { type: "FeatureCollection", features };
}
