import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const PARIS_API = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets";

async function fetchRecords(datasetId, { limit = 100, offset = 0, where } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (where) params.set("where", where);

  const url = `${PARIS_API}/${datasetId}/records?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed ${datasetId}: ${res.status}`);
  return res.json();
}

async function fetchAll(datasetId, { pageSize = 100, maxRecords = 2000, where } = {}) {
  const all = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total && all.length < maxRecords) {
    const batch = await fetchRecords(datasetId, {
      limit: Math.min(pageSize, maxRecords - all.length),
      offset,
      where,
    });
    total = batch.total_count ?? 0;
    all.push(...(batch.results ?? []));
    offset += pageSize;
    if (!batch.results?.length) break;
  }

  return all;
}

function writeGeoJSON(filename, collection) {
  return fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(collection, null, 0),
    "utf8"
  );
}

function pointFeature(id, lon, lat, properties) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties,
  };
}

function arrondissementFromPostal(code) {
  if (!code) return undefined;
  const match = String(code).match(/750(\d{2})/);
  return match ? `${match[1]}e` : undefined;
}

async function buildCafes() {
  console.log("Fetching café terraces...");
  const records = await fetchAll("terrasses-autorisations", {
    maxRecords: 800,
    where: "geo_point_2d is not null",
  });

  const features = records
    .filter((r) => r.geo_point_2d?.lon && r.geo_point_2d?.lat)
    .map((r, i) =>
      pointFeature(
        `cafe-${r.siret ?? i}`,
        r.geo_point_2d.lon,
        r.geo_point_2d.lat,
        {
          id: `cafe-${r.siret ?? i}`,
          name: r.nom_enseigne ?? r.adresse ?? "Café terrace",
          layer: "cafes",
          type: "cafe",
          address: r.adresse,
          arrondissement: arrondissementFromPostal(r.arrondissement),
          accessible: false,
          indoor: false,
          romantic: [5, 6, 7, 8].includes(Number(String(r.arrondissement).slice(-2))),
          familyFriendly: true,
          quiet: false,
          budgetLevel: "medium",
          tags: ["terrace", "outdoor", r.typologie?.toLowerCase?.() ?? "terrace"].filter(Boolean),
          source: "opendata.paris.fr/terrasses-autorisations",
        }
      )
    );

  return { type: "FeatureCollection", features };
}

async function buildBikes() {
  console.log("Fetching Vélib stations...");
  const records = await fetchAll("velib-emplacement-des-stations", { maxRecords: 2000 });

  const features = records
    .filter((r) => r.coordonnees_geo?.lon && r.coordonnees_geo?.lat)
    .map((r) =>
      pointFeature(`bike-${r.stationcode}`, r.coordonnees_geo.lon, r.coordonnees_geo.lat, {
        id: `bike-${r.stationcode}`,
        name: r.name ?? `Vélib ${r.stationcode}`,
        layer: "bikes",
        type: "bike-station",
        accessible: true,
        indoor: false,
        capacity: r.capacity,
        tags: ["velib", "cycling", "transport"],
        source: "opendata.paris.fr/velib-emplacement-des-stations",
      })
    );

  return { type: "FeatureCollection", features };
}

async function buildTrees() {
  console.log("Fetching trees...");
  const records = await fetchAll("les-arbres", { maxRecords: 1200 });

  const features = records
    .filter((r) => r.geo_point_2d?.lon && r.geo_point_2d?.lat)
    .map((r) =>
      pointFeature(`tree-${r.idbase ?? r.idemplacement}`, r.geo_point_2d.lon, r.geo_point_2d.lat, {
        id: `tree-${r.idbase ?? r.idemplacement}`,
        name: `${r.libellefrancais ?? r.genre ?? "Tree"} — ${r.adresse ?? "Paris"}`,
        layer: "trees",
        type: "tree",
        address: r.adresse,
        arrondissement: r.arrondissement?.replace("PARIS ", "").replace(" ARRDT", "").toLowerCase(),
        familyFriendly: true,
        quiet: true,
        romantic: r.remarquable === "OUI",
        tags: ["tree", r.domanialite?.toLowerCase?.()].filter(Boolean),
        source: "opendata.paris.fr/les-arbres",
      })
    );

  return { type: "FeatureCollection", features };
}

async function buildParks() {
  console.log("Fetching community gardens...");
  const records = await fetchAll("jardins-relais", { maxRecords: 100 });

  const curated = [
    ["park-luxembourg", "Jardin du Luxembourg", 2.3372, 48.8462, "6e"],
    ["park-tuileries", "Jardin des Tuileries", 2.3273, 48.8634, "1er"],
    ["park-buttes-chaumont", "Parc des Buttes-Chaumont", 2.3828, 48.8809, "19e"],
    ["park-champ-de-mars", "Champ de Mars", 2.2988, 48.8556, "7e"],
    ["park-plantes", "Jardin des Plantes", 2.3598, 48.8437, "5e"],
    ["park-bercy", "Parc de Bercy", 2.3824, 48.8361, "12e"],
    ["park-monceau", "Parc Monceau", 2.3078, 48.8799, "8e"],
    ["park-villette", "Parc de la Villette", 2.3934, 48.8938, "19e"],
  ];

  const features = [
    ...records
      .filter((r) => r.geo_point_2d?.lon && r.geo_point_2d?.lat)
      .map((r, i) =>
        pointFeature(`park-relais-${r.idt ?? i}`, r.geo_point_2d.lon, r.geo_point_2d.lat, {
          id: `park-relais-${r.idt ?? i}`,
          name: r.nom_de_la_structure ?? r.projet ?? "Community garden",
          layer: "parks",
          type: "community-garden",
          address: r.adresse,
          arrondissement: r.code_postal ? arrondissementFromPostal(r.code_postal) : undefined,
          familyFriendly: true,
          quiet: true,
          romantic: false,
          accessible: true,
          indoor: false,
          tags: ["garden", "community"],
          source: "opendata.paris.fr/jardins-relais",
        })
      ),
    ...curated.map(([id, name, lon, lat, arr]) =>
      pointFeature(id, lon, lat, {
        id,
        name,
        layer: "parks",
        type: "park",
        arrondissement: arr,
        familyFriendly: true,
        quiet: true,
        romantic: ["park-luxembourg", "park-monceau", "park-champ-de-mars"].includes(id),
        accessible: true,
        indoor: false,
        tags: ["park", "green-space"],
        source: "curated-paris-parks",
      })
    ),
  ];

  return { type: "FeatureCollection", features };
}

async function buildAccessibility() {
  console.log("Fetching accessible accommodations...");
  const records = await fetchAll("accessibilite-des-hebergements-en-ile-de-france-paris-je-t-aime", {
    maxRecords: 600,
    where: "ville like 'Paris'",
  });

  const curated = [
    ["acc-louvre", "Louvre Museum — Step-free access", 2.3376, 48.8606, true],
    ["acc-orsay", "Musée d'Orsay — PMR access", 2.3266, 48.86, true],
    ["acc-pompidou", "Centre Pompidou — Accessible entrance", 2.3522, 48.8607, true],
    ["acc-bastille-opera", "Opéra Bastille — Accessible", 2.3694, 48.8529, true],
  ];

  const features = [
    ...records
      .filter((r) => r.latitude && r.longitude)
      .filter((r) => Number(r.nb_chambres_pmr) > 0 || Number(r.nb_chambre_sourd) > 0)
      .map((r) =>
        pointFeature(`acc-hotel-${r.id}`, Number(r.longitude), Number(r.latitude), {
          id: `acc-hotel-${r.id}`,
          name: r.etablissement ?? "Accessible accommodation",
          layer: "accessibility",
          type: "accessible-hotel",
          address: r.adresse,
          accessible: true,
          indoor: true,
          familyFriendly: Number(r.nb_chambres_famille) > 0,
          tags: ["pmr", "accessible", "hotel"],
          source: "opendata.paris.fr/accessibilite-hebergements",
        })
      ),
    ...curated.map(([id, name, lon, lat]) =>
      pointFeature(id, lon, lat, {
        id,
        name,
        layer: "accessibility",
        type: "accessible-poi",
        accessible: true,
        indoor: true,
        familyFriendly: true,
        tags: ["pmr", "accessible", "culture"],
        source: "curated-accessible-pois",
      })
    ),
  ];

  return { type: "FeatureCollection", features };
}

function buildMuseums() {
  const museums = [
    ["louvre", "Musée du Louvre", 2.3376, 48.8606, "1er", true, "high"],
    ["orsay", "Musée d'Orsay", 2.3266, 48.86, "7e", true, "medium"],
    ["pompidou", "Centre Pompidou", 2.3522, 48.8607, "4e", true, "medium"],
    ["rodin", "Musée Rodin", 2.3158, 48.8553, "7e", true, "medium"],
    ["orsay", "Musée de l'Orangerie", 2.3225, 48.8638, "1er", true, "medium"],
    ["carnavalet", "Musée Carnavalet", 2.3622, 48.8573, "3e", true, "low"],
    ["cluny", "Musée de Cluny", 2.344, 48.8503, "5e", true, "medium"],
    ["picasso", "Musée Picasso", 2.3625, 48.8597, "3e", true, "medium"],
    ["petit-palais", "Petit Palais", 2.3146, 48.8661, "8e", true, "low"],
    ["invalides", "Musée de l'Armée", 2.3126, 48.8567, "7e", true, "medium"],
    ["science", "Cité des Sciences", 2.3878, 48.8956, "19e", true, "medium"],
    ["quai-branly", "Musée du Quai Branly", 2.2978, 48.8609, "7e", true, "high"],
  ];

  const features = museums.map(([id, name, lon, lat, arr, indoor, budget], i) =>
    pointFeature(`museum-${id}-${i}`, lon, lat, {
      id: `museum-${id}-${i}`,
      name,
      layer: "museums",
      type: "museum",
      arrondissement: arr,
      indoor: indoor,
      accessible: true,
      familyFriendly: ["science", "carnavalet", "petit-palais"].includes(id),
      romantic: ["rodin", "orsay", "petit-palais"].includes(id),
      quiet: true,
      budgetLevel: budget,
      tags: ["museum", "culture", "indoor"],
      source: "curated-paris-museums",
    })
  );

  return { type: "FeatureCollection", features };
}

function buildMetro() {
  const stations = [
    ["chatelet", "Châtelet", 2.347, 48.8583, ["1", "4", "7", "11", "14"]],
    ["gare-du-nord", "Gare du Nord", 2.3553, 48.8809, ["4", "5", "RER B", "RER D"]],
    ["gare-de-lyon", "Gare de Lyon", 2.3735, 48.8448, ["1", "14", "RER A", "RER D"]],
    ["republique", "République", 2.3631, 48.8676, ["3", "5", "8", "9", "11"]],
    ["bastille", "Bastille", 2.3686, 48.853, ["1", "5", "8"]],
    ["trocadero", "Trocadéro", 2.2876, 48.8624, ["6", "9"]],
    ["montparnasse", "Montparnasse", 2.3212, 48.8422, ["4", "6", "12", "13"]],
    ["nation", "Nation", 2.3957, 48.8484, ["1", "2", "6", "9"]],
    ["oberkampf", "Oberkampf", 2.3795, 48.865, ["5", "9"]],
    ["pigalle", "Pigalle", 2.3372, 48.882, ["2", "12"]],
    ["saint-michel", "Saint-Michel", 2.3444, 48.8534, ["4", "RER B", "RER C"]],
    ["concorde", "Concorde", 2.3212, 48.8656, ["1", "8", "12"]],
    ["louvre-rivoli", "Louvre — Rivoli", 2.3417, 48.8606, ["1"]],
    ["bir-hakeim", "Bir-Hakeim", 2.2893, 48.8534, ["6"]],
    ["denfert", "Denfert-Rochereau", 2.3324, 48.8338, ["4", "6", "RER B"]],
    ["gare-austerlitz", "Gare d'Austerlitz", 2.3649, 48.8422, ["5", "10", "RER C"]],
  ];

  const features = stations.map(([id, name, lon, lat, lines]) =>
    pointFeature(`metro-${id}`, lon, lat, {
      id: `metro-${id}`,
      name,
      layer: "metro",
      type: "metro-station",
      indoor: true,
      accessible: ["chatelet", "gare-du-nord", "gare-de-lyon", "montparnasse"].includes(id),
      familyFriendly: true,
      tags: ["metro", "transport", ...lines.map((l) => `line-${l}`)],
      source: "curated-ratp-stations",
    })
  );

  return { type: "FeatureCollection", features };
}

function buildNoise() {
  const stations = [
    ["noise-auteuil", "Auteuil", 2.263, 48.847, 87.1],
    ["noise-vincennes", "Porte de Vincennes", 2.413, 48.848, 83.4],
    ["noise-soulie", "Rue Soulie", 2.389, 48.832, 78.9],
    ["noise-sebastopol", "Sébastopol", 2.349, 48.867, 77.9],
    ["noise-anatole", "Anatole France", 2.275, 48.858, 76.9],
    ["noise-rivoli", "Rivoli", 2.329, 48.857, 76.6],
    ["noise-stmichel", "Saint-Michel", 2.344, 48.853, 74.6],
    ["noise-luxembourg", "Luxembourg (quiet)", 2.337, 48.846, 62.0],
    ["noise-buttes", "Buttes-Chaumont (quiet)", 2.383, 48.881, 58.5],
    ["noise-marais", "Le Marais (moderate)", 2.362, 48.857, 68.0],
  ];

  const features = stations.map(([id, name, lon, lat, db]) =>
    pointFeature(id, lon, lat, {
      id,
      name,
      layer: "noise",
      type: "noise-station",
      noiseLevel: db,
      quiet: db < 65,
      romantic: db < 65,
      indoor: false,
      tags: ["noise", db < 65 ? "quiet" : db < 75 ? "moderate" : "loud"],
      source: "opendata.paris.fr/bruit-evolution + curated",
    })
  );

  return { type: "FeatureCollection", features };
}

function buildAirQuality() {
  const stations = [
    ["aq-belleville", "Parc de Belleville", 2.384, 48.872, 42],
    ["aq-pere-lachaise", "Père Lachaise", 2.393, 48.861, 38],
    ["aq-menilmontant", "Ménilmontant", 2.389, 48.866, 45],
    ["aq-pyrenées", "Rue des Pyrénées", 2.401, 48.868, 40],
    ["aq-eiffel", "Champ de Mars", 2.298, 48.856, 35],
    ["aq-louvre", "Louvre area", 2.337, 48.861, 44],
    ["aq-bastille", "Bastille", 2.369, 48.853, 48],
    ["aq-nation", "Nation", 2.396, 48.848, 46],
  ];

  const features = stations.map(([id, name, lon, lat, aqi]) =>
    pointFeature(id, lon, lat, {
      id,
      name,
      layer: "air-quality",
      type: "air-quality-station",
      airQualityIndex: aqi,
      quiet: aqi < 40,
      familyFriendly: aqi < 50,
      tags: ["air-quality", aqi < 40 ? "good" : aqi < 50 ? "moderate" : "poor"],
      source: "opendata.paris.fr/respirons-mieux + curated",
    })
  );

  return { type: "FeatureCollection", features };
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const layers = {
    cafes: await buildCafes(),
    bikes: await buildBikes(),
    trees: await buildTrees(),
    parks: await buildParks(),
    accessibility: await buildAccessibility(),
    museums: buildMuseums(),
    metro: buildMetro(),
    noise: buildNoise(),
    "air-quality": buildAirQuality(),
  };

  const manifest = {
    updatedAt: new Date().toISOString(),
    layers: Object.entries(layers).map(([id, collection]) => ({
      id,
      featureCount: collection.features.length,
      path: `/data/${id}.geojson`,
    })),
  };

  for (const [id, collection] of Object.entries(layers)) {
    await writeGeoJSON(`${id}.geojson`, collection);
    console.log(`  ✓ ${id}.geojson (${collection.features.length} features)`);
  }

  await fs.writeFile(
    path.join(DATA_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log(`\nDone. ${manifest.layers.length} layers written to public/data/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
