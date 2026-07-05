export const PARIS_API =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets";
export const IDFM_API =
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets";

export const PARIS_BOUNDS = {
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

export async function fetchRecords(datasetId, opts) {
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

export async function fetchAll(datasetId, opts) {
  return fetchAllFrom(fetchRecords, datasetId, opts);
}

export async function fetchAllIdfm(datasetId, opts) {
  return fetchAllFrom(fetchIdfmRecords, datasetId, opts);
}

export function isInParis(lon, lat) {
  return (
    lon >= PARIS_BOUNDS.minLon &&
    lon <= PARIS_BOUNDS.maxLon &&
    lat >= PARIS_BOUNDS.minLat &&
    lat <= PARIS_BOUNDS.maxLat
  );
}

export function pointFeature(id, lon, lat, properties) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat] },
    properties,
  };
}
