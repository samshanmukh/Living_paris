import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const PARIS_API = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets";
const IDFM_API =
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets";

const PARIS_BOUNDS = {
  minLon: 2.249,
  maxLon: 2.421,
  minLat: 48.815,
  maxLat: 48.902,
};

async function fetchRecordsFrom(baseUrl, datasetId, { limit = 100, offset = 0, where } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (where) params.set("where", where);

  const url = `${baseUrl}/${datasetId}/records?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Failed ${datasetId}: ${res.status}`);
  return res.json();
}

async function fetchRecords(datasetId, opts) {
  return fetchRecordsFrom(PARIS_API, datasetId, opts);
}

async function fetchIdfmRecords(datasetId, opts) {
  return fetchRecordsFrom(IDFM_API, datasetId, opts);
}

async function fetchAllFrom(fetchFn, datasetId, { pageSize = 100, maxRecords = 2000, where } = {}) {
  const all = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total && all.length < maxRecords) {
    const batch = await fetchFn(datasetId, {
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

async function fetchAll(datasetId, opts) {
  return fetchAllFrom(fetchRecords, datasetId, opts);
}

async function fetchAllIdfm(datasetId, opts) {
  return fetchAllFrom(fetchIdfmRecords, datasetId, opts);
}

function isInParis(lon, lat) {
  return (
    lon >= PARIS_BOUNDS.minLon &&
    lon <= PARIS_BOUNDS.maxLon &&
    lat >= PARIS_BOUNDS.minLat &&
    lat <= PARIS_BOUNDS.maxLat
  );
}

function parseAccessibilityField(raw) {
  if (!raw) return false;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const handicaps = parsed.handicaps ?? [];
    return handicaps.some(
      (h) =>
        h.status === "true" ||
        /mobilit|pmr|fauteuil|wheelchair/i.test(h.name ?? "")
    );
  } catch {
    return false;
  }
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
  console.log("Fetching parks and gardens...");
  const [relaisRecords, parcRecords] = await Promise.all([
    fetchAll("jardins-relais", { maxRecords: 100 }),
    fetchAll("lieux-municipaux", {
      maxRecords: 200,
      where: "categorie = 'Parcs, jardins et bois'",
    }),
  ]);

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

  const seen = new Set();

  const features = [
    ...relaisRecords
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
    ...parcRecords
      .filter((r) => r.longitude && r.latitude)
      .map((r) =>
        pointFeature(`park-municipal-${r.id}`, r.longitude, r.latitude, {
          id: `park-municipal-${r.id}`,
          name: r.name,
          layer: "parks",
          type: "park",
          address: r.address_street,
          arrondissement: arrondissementFromPostal(r.address_postcode),
          familyFriendly: true,
          quiet: true,
          romantic: /luxembourg|monceau|buttes|tuileries/i.test(r.name ?? ""),
          accessible: parseAccessibilityField(r.accessibility),
          indoor: false,
          tags: ["park", "municipal"],
          source: "opendata.paris.fr/lieux-municipaux",
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
  ].filter((f) => {
    const key = `${f.properties.name}-${f.geometry.coordinates.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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

async function buildMuseums() {
  console.log("Fetching museums and cultural venues...");
  const categories = [
    "Musées municipaux",
    "Théâtres et établissements culturels soutenus",
    "Lieux de decouverte et d initiation",
  ];

  const records = (
    await Promise.all(
      categories.map((categorie) =>
        fetchAll("lieux-municipaux", {
          maxRecords: 200,
          where: `categorie = '${categorie.replace(/'/g, "''")}'`,
        })
      )
    )
  ).flat();

  const nationalSupplement = [
    ["louvre", "Musée du Louvre", 2.3376, 48.8606, "high"],
    ["orsay", "Musée d'Orsay", 2.3266, 48.86, "medium"],
    ["pompidou", "Centre Pompidou", 2.3522, 48.8607, "medium"],
    ["rodin", "Musée Rodin", 2.3158, 48.8553, "medium"],
    ["orangerie", "Musée de l'Orangerie", 2.3225, 48.8638, "medium"],
    ["quai-branly", "Musée du Quai Branly", 2.2978, 48.8609, "high"],
    ["invalides", "Musée de l'Armée", 2.3126, 48.8567, "medium"],
    ["science", "Cité des Sciences et de l'Industrie", 2.3878, 48.8956, "medium"],
  ];

  const seen = new Set();

  const features = [
    ...records
      .filter((r) => r.longitude && r.latitude)
      .map((r) => {
        const accessible = parseAccessibilityField(r.accessibility);
        const isMuseum = /musée|museum/i.test(r.categorie ?? "") || /musée|museum/i.test(r.name ?? "");
        return pointFeature(`culture-${r.id}`, r.longitude, r.latitude, {
          id: `culture-${r.id}`,
          name: r.name,
          layer: "museums",
          type: isMuseum ? "museum" : "cultural-venue",
          address: r.address_street,
          arrondissement: arrondissementFromPostal(r.address_postcode),
          indoor: true,
          accessible,
          familyFriendly: /découverte|science|enfant|famil/i.test(r.name ?? ""),
          romantic: /rodin|petit|orangerie|romant/i.test(r.name ?? ""),
          quiet: true,
          budgetLevel: /municipal|petit|carnavalet/i.test(r.name ?? "") ? "low" : "medium",
          tags: ["culture", isMuseum ? "museum" : "venue", r.categorie?.toLowerCase?.()].filter(Boolean),
          source: "opendata.paris.fr/lieux-municipaux",
        });
      }),
    ...nationalSupplement.map(([id, name, lon, lat, budget]) =>
      pointFeature(`museum-national-${id}`, lon, lat, {
        id: `museum-national-${id}`,
        name,
        layer: "museums",
        type: "museum",
        indoor: true,
        accessible: true,
        familyFriendly: id === "science",
        romantic: ["rodin", "orangerie"].includes(id),
        quiet: true,
        budgetLevel: budget,
        tags: ["museum", "culture", "indoor", "national"],
        source: "supplement-national-museums",
      })
    ),
  ].filter((f) => {
    const key = f.properties.name?.toLowerCase?.() ?? f.properties.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { type: "FeatureCollection", features };
}

async function buildMetro() {
  console.log("Fetching Paris metro stations from IDFM...");
  const records = await fetchAllIdfm("arrets", {
    maxRecords: 1000,
    where: "arrtype = 'metro'",
  });

  const byName = new Map();

  for (const r of records) {
    const lon = r.arrgeopoint?.lon;
    const lat = r.arrgeopoint?.lat;
    if (lon == null || lat == null || !isInParis(lon, lat)) continue;

    const name = r.arrname;
    const existing = byName.get(name);
    const accessible = r.arraccessibility === "true";

    if (!existing || (accessible && !existing.accessible)) {
      byName.set(name, { ...r, lon, lat, accessible });
    }
  }

  const features = [...byName.values()].map((r) =>
    pointFeature(`metro-${r.arrid}`, r.lon, r.lat, {
      id: `metro-${r.arrid}`,
      name: r.arrname,
      layer: "metro",
      type: "metro-station",
      indoor: true,
      accessible: r.accessible,
      familyFriendly: true,
      tags: ["metro", "transport", `zone-${r.arrfarezone ?? "?"}`],
      source: "data.iledefrance-mobilites.fr/arrets",
    })
  );

  return { type: "FeatureCollection", features };
}

const NOISE_STATION_COORDS = {
  auteuil: { name: "Auteuil", lon: 2.263, lat: 48.847 },
  vincennes: { name: "Porte de Vincennes", lon: 2.413, lat: 48.848 },
  malesherbes: { name: "Malesherbes", lon: 2.309, lat: 48.879 },
  courcelles: { name: "Courcelles", lon: 2.304, lat: 48.879 },
  soulie: { name: "Rue Soulie", lon: 2.389, lat: 48.832 },
  poissoniere: { name: "Poissonnière", lon: 2.348, lat: 48.871 },
  sebastopol: { name: "Sébastopol", lon: 2.349, lat: 48.867 },
  anatolefrance: { name: "Anatole France", lon: 2.275, lat: 48.858 },
  rivoli: { name: "Rivoli", lon: 2.329, lat: 48.857 },
  gesvres: { name: "Gesvres", lon: 2.348, lat: 48.857 },
  stgermain: { name: "Saint-Germain", lon: 2.333, lat: 48.854 },
  stmichel: { name: "Saint-Michel", lon: 2.344, lat: 48.853 },
  bastille: { name: "Bastille", lon: 2.369, lat: 48.853 },
  fremicourt: { name: "Frémicourt", lon: 2.301, lat: 48.842 },
  lecourbe: { name: "Lecourbe", lon: 2.301, lat: 48.842 },
};

async function buildNoise() {
  console.log("Building noise monitoring layer...");
  const records = await fetchAll(
    "bruit-evolution-de-l-indice-du-bruit-mesure-sur-des-stations-parisiennes",
    { maxRecords: 20 }
  );

  const latest = records.sort((a, b) => Number(b.annee) - Number(a.annee))[0] ?? {};
  const features = [];

  for (const [key, coords] of Object.entries(NOISE_STATION_COORDS)) {
    const dayKey = `lden_bruit_routier_${key}`;
    const nightKey = `ln_bruit_routier_${key}`;
    const dayDb = latest[dayKey];
    const nightDb = latest[nightKey];
    const db = dayDb ?? nightDb;

    if (db == null) continue;

    features.push(
      pointFeature(`noise-${key}`, coords.lon, coords.lat, {
        id: `noise-${key}`,
        name: coords.name,
        layer: "noise",
        type: "noise-station",
        noiseLevel: db,
        quiet: db < 65,
        romantic: db < 65,
        indoor: false,
        tags: ["noise", db < 65 ? "quiet" : db < 75 ? "moderate" : "loud"],
        source: "opendata.paris.fr/bruit-evolution",
      })
    );
  }

  return { type: "FeatureCollection", features };
}

const AIR_QUALITY_STATIONS = {
  parc_de_belleville: { name: "Parc de Belleville", lon: 2.384, lat: 48.872 },
  pere_lachaise: { name: "Père Lachaise", lon: 2.393, lat: 48.861 },
  bd_menilmontant: { name: "Bd Ménilmontant", lon: 2.388, lat: 48.867 },
  stade_louis_lumiere: { name: "Stade Louis Lumière", lon: 2.402, lat: 48.862 },
  rue_menilmontant: { name: "Rue Ménilmontant", lon: 2.389, lat: 48.865 },
  rue_des_pyrenees: { name: "Rue des Pyrénées", lon: 2.401, lat: 48.868 },
  place_st_fargeau: { name: "Place St Fargeau", lon: 2.397, lat: 48.872 },
};

async function buildAirQuality() {
  console.log("Building air quality monitoring layer...");
  const records = await fetchAll("respirons-mieux-dans-le-20eme-donnees-mini-stations", {
    maxRecords: 500,
  });

  const features = [];

  for (const [column, coords] of Object.entries(AIR_QUALITY_STATIONS)) {
    const values = records
      .map((r) => Number(r[column]))
      .filter((v) => Number.isFinite(v));

    if (!values.length) continue;

    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    features.push(
      pointFeature(`aq-${column}`, coords.lon, coords.lat, {
        id: `aq-${column}`,
        name: coords.name,
        layer: "air-quality",
        type: "air-quality-station",
        airQualityIndex: avg,
        quiet: avg < 40,
        familyFriendly: avg < 50,
        tags: ["air-quality", avg < 40 ? "good" : avg < 50 ? "moderate" : "poor"],
        source: "opendata.paris.fr/respirons-mieux",
      })
    );
  }

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
    museums: await buildMuseums(),
    metro: await buildMetro(),
    noise: await buildNoise(),
    "air-quality": await buildAirQuality(),
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
