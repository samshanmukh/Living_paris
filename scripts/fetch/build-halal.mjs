import { PARIS_BOUNDS, isInParis, pointFeature } from "./shared.mjs";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `[out:json][timeout:60];
node["diet:halal"](${PARIS_BOUNDS.minLat},${PARIS_BOUNDS.minLon},${PARIS_BOUNDS.maxLat},${PARIS_BOUNDS.maxLon});
out body;`;

export async function buildHalal() {
  console.log("Fetching halal dining from OpenStreetMap (Overpass)...");

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "LivingParis/0.1 fetch-data",
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!res.ok) throw new Error(`Overpass halal failed: ${res.status}`);

  const data = await res.json();
  const elements = data.elements ?? [];

  const features = elements
    .filter((el) => el.type === "node" && el.lat != null && el.lon != null)
    .filter((el) => isInParis(el.lon, el.lat))
    .map((el) => {
      const tags = el.tags ?? {};
      const name = tags.name ?? tags["name:fr"] ?? tags["name:en"] ?? "Halal restaurant";
      const id = `halal-${el.id}`;

      return pointFeature(id, el.lon, el.lat, {
        id,
        name,
        layer: "halal",
        type: tags.amenity ?? "restaurant",
        address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined,
        dietary: ["halal"],
        indoor: true,
        familyFriendly: true,
        tags: ["halal", tags.cuisine, tags.amenity].filter(Boolean),
        source: "openstreetmap/overpass",
      });
    });

  return { type: "FeatureCollection", features };
}
