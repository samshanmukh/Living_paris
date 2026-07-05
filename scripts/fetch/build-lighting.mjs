import { fetchAll, isInParis, pointFeature } from "./shared.mjs";

const MAX_FEATURES = 5000;
const ARRONDISSEMENTS = Array.from(
  { length: 20 },
  (_, i) => `Arrondissement ${String(i + 1).padStart(2, "0")}`
);

export async function buildLighting() {
  console.log("Fetching public street lighting...");
  const perArr = Math.ceil(MAX_FEATURES / ARRONDISSEMENTS.length);

  const recordBatches = await Promise.all(
    ARRONDISSEMENTS.map((arr) =>
      fetchAll("eclairage-public", {
        maxRecords: perArr,
        where: `arrondissement = '${arr}' and geo_point_2d is not null`,
      })
    )
  );

  const records = recordBatches.flat().slice(0, MAX_FEATURES);

  const features = records
    .map((r, i) => {
      const lon = r.geo_point_2d?.lon ?? Number(r.x_wgs84);
      const lat = r.geo_point_2d?.lat ?? Number(r.y_wgs84);
      const id = `light-${r.cod_ouvrag ?? r.foyer ?? i}`;

      return pointFeature(id, lon, lat, {
        id,
        name: r.voie_libelle ?? r.voie_entiere ?? "Street light",
        layer: "lighting",
        type: "street-light",
        address: r.voie_entiere,
        arrondissement: r.arrondissement?.replace("Arrondissement ", "")?.toLowerCase?.(),
        indoor: /souterrain|sou/i.test(r.voie_categorie ?? r.voie_nature ?? ""),
        tags: [
          "lighting",
          r.luminaire_famille?.toLowerCase?.(),
          r.lib_regime?.toLowerCase?.(),
        ].filter(Boolean),
        source: "opendata.paris.fr/eclairage-public",
      });
    })
    .filter((f) => {
      const [lon, lat] = f.geometry.coordinates;
      return Number.isFinite(lon) && Number.isFinite(lat) && isInParis(lon, lat);
    });

  return { type: "FeatureCollection", features };
}
