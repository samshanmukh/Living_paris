/**
 * Agent 1 — connectivity probes (no integration).
 * Run: npm run probe:sources
 */
import { loadEnvLocal } from "../load-env-local.mjs";

loadEnvLocal();

const PARIS_API =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets";
const IDFM_API =
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets";

const OVERPASS_HALAL_QUERY = `[out:json][timeout:25];
(
  node["diet:halal"](48.80,2.25,48.90,2.45);
  way["diet:halal"](48.80,2.25,48.90,2.45);
  relation["diet:halal"](48.80,2.25,48.90,2.45);
);
out count;`;

/** @typedef {{ name: string, status: string, http: string, notes: string, required: boolean }} ProbeResult */

/** @param {string} label @param {() => Promise<ProbeResult>} fn */
async function runProbe(label, fn) {
  try {
    return await fn();
  } catch (err) {
    return {
      name: label,
      status: "FAIL",
      http: "—",
      notes: err instanceof Error ? err.message : String(err),
      required: true,
    };
  }
}

/** @param {RequestInit & { url: string, timeoutMs?: number, retries?: number }} opts */
async function fetchWithTimeout({ url, timeoutMs = 30_000, retries = 0, ...init }) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status === 429 && attempt < retries) {
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, 2_000 * (attempt + 1))
        );
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= retries) throw err;
      await new Promise((resolveDelay) =>
        setTimeout(resolveDelay, 1_000 * (attempt + 1))
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error(`fetch failed: ${url}`);
}

/** @param {string} name @param {string} url @param {{ required?: boolean, method?: string, body?: string, headers?: Record<string, string>, retries?: number, validate?: (res: Response, body: unknown) => string | null }} opts */
async function probeHttp(name, url, opts = {}) {
  const {
    required = true,
    method = "GET",
    body,
    headers = {},
    retries = 0,
    validate,
  } = opts;

  const res = await fetchWithTimeout({
    url,
    method,
    body,
    headers,
    retries,
    redirect: "follow",
  });

  let parsed = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (method !== "HEAD" && contentType.includes("application/json")) {
    parsed = await res.json();
  } else if (method !== "HEAD") {
    await res.text();
  }

  let notes = res.statusText || "ok";
  if (validate) {
    const validationNote = validate(res, parsed);
    if (validationNote) notes = validationNote;
  }

  const pass = res.ok && !notes.startsWith("missing ");
  return {
    name,
    status: pass ? "PASS" : "FAIL",
    http: String(res.status),
    notes,
    required,
  };
}

/** @param {string} datasetId @param {boolean} [idfm=false] */
function parisRecordsUrl(datasetId, idfm = false) {
  const base = idfm ? IDFM_API : PARIS_API;
  return `${base}/${datasetId}/records?limit=1`;
}

/** @returns {Promise<ProbeResult>} */
async function probeOpenMeteo() {
  return probeHttp("Open-Meteo air-quality", "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=48.8566&longitude=2.3522&current=pm2_5", {
    validate: (_res, body) => {
      const pm =
        body &&
        typeof body === "object" &&
        "current" in body &&
        body.current &&
        typeof body.current === "object" &&
        "pm2_5" in body.current
          ? body.current.pm2_5
          : undefined;
      return pm == null ? "missing pm2_5 in response" : `pm2_5=${pm}`;
    },
  });
}

/** @returns {Promise<ProbeResult>} */
async function probeAladhan() {
  return probeHttp(
    "Aladhan prayer times",
    "https://api.aladhan.com/v1/timingsByCity?city=Paris&country=France&method=2",
    {
      validate: (_res, body) => {
        const code =
          body && typeof body === "object" && "code" in body ? body.code : null;
        return code === 200 ? "timings available" : "missing timings payload";
      },
    }
  );
}

/** @returns {Promise<ProbeResult>} */
async function probeOverpassHalal() {
  return probeHttp("Overpass halal (Paris bbox)", "https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "LivingParis/0.1 probe-sources",
    },
    body: `data=${encodeURIComponent(OVERPASS_HALAL_QUERY)}`,
    retries: 3,
    validate: (_res, body) => {
      const elements =
        body && typeof body === "object" && "elements" in body
          ? body.elements
          : null;
      if (!Array.isArray(elements) || elements.length === 0) {
        return "missing elements in Overpass response";
      }
      const countEl = elements.find((el) => el?.type === "count");
      if (countEl?.tags?.total != null) {
        return `halal count=${countEl.tags.total}`;
      }
      return `${elements.length} element(s)`;
    },
  });
}

/** @returns {Promise<ProbeResult>} */
async function probeWaqi() {
  const token = process.env.WAQI_API_KEY?.trim();
  if (!token) {
    console.warn("WARN: WAQI_API_KEY not set — skipping WAQI probe");
    return {
      name: "WAQI air quality",
      status: "SKIP",
      http: "—",
      notes: "WAQI_API_KEY not set",
      required: true,
    };
  }

  const url = `https://api.waqi.info/feed/geo:48.8566;2.3522/?token=${encodeURIComponent(token)}`;
  return probeHttp("WAQI air quality", url, {
    validate: (_res, body) => {
      const status =
        body && typeof body === "object" && "status" in body ? body.status : null;
      return status === "ok" ? "feed ok" : `status=${String(status)}`;
    },
  });
}

/** @param {string} datasetId @param {boolean} [idfm=false] */
async function probeParisDataset(datasetId, idfm = false) {
  const label = idfm ? `IDFM ${datasetId}` : `Paris ${datasetId}`;
  return probeHttp(label, parisRecordsUrl(datasetId, idfm), {
    validate: (_res, body) => {
      const count =
        body && typeof body === "object" && "total_count" in body
          ? body.total_count
          : undefined;
      const results =
        body && typeof body === "object" && "results" in body
          ? body.results
          : null;
      if (!Array.isArray(results)) return "missing results array";
      return `total_count=${count ?? "?"} sample=${results.length}`;
    },
  });
}

/** @returns {Promise<ProbeResult>} */
async function probeAcceslibreCsv() {
  return probeHttp(
    "Acceslibre CSV",
    "https://static.data.gouv.fr/resources/accessibilite-des-etablissements-recevant-du-public-erp-pour-les-personnes-en-situation-de-handicap/20260704-232131/acceslibre.csv",
    {
      method: "HEAD",
      validate: (res) =>
        res.ok ? "HEAD ok" : `HEAD failed: ${res.statusText}`,
    }
  );
}

/** @returns {Promise<ProbeResult>} */
async function probeBruitparifOptional() {
  const result = await probeHttp(
    "Bruitparif open-data (optional)",
    "https://www.bruitparif.fr/fr/open-data",
    { required: false }
  );
  if (result.http === "404") {
    return {
      ...result,
      status: "FAIL (expected)",
      notes: "404 as documented",
    };
  }
  return result;
}

/** @returns {Promise<ProbeResult>} */
async function probeIdfmAscenseursOptional() {
  const result = await probeParisDataset("etat-des-ascenseurs", true);
  result.name = "IDFM etat-des-ascenseurs (optional)";
  result.required = false;
  if (result.http === "403") {
    return {
      ...result,
      status: "FAIL (expected)",
      notes: "403 as documented",
    };
  }
  return result;
}

/** @param {ProbeResult[]} results */
function printTable(results) {
  console.log("| Source | Status | HTTP | Notes |");
  console.log("| --- | --- | --- | --- |");
  for (const row of results) {
    const notes = row.notes.replace(/\|/g, "\\|").replace(/\n/g, " ");
    console.log(
      `| ${row.name} | ${row.status} | ${row.http} | ${notes} |`
    );
  }
}

/** @param {ProbeResult[]} results */
function summarize(results) {
  const required = results.filter((r) => r.required);
  const requiredFailed = required.filter(
    (r) => r.status !== "PASS" && r.status !== "SKIP"
  );
  const passed = required.filter((r) => r.status === "PASS").length;
  const skipped = required.filter((r) => r.status === "SKIP").length;

  console.log("");
  console.log(
    `Required: ${passed} passed, ${skipped} skipped, ${requiredFailed.length} failed (${required.length} total)`
  );

  return requiredFailed.length === 0;
}

async function main() {
  const results = [];

  results.push(await runProbe("Open-Meteo air-quality", probeOpenMeteo));
  results.push(await runProbe("Aladhan prayer times", probeAladhan));
  results.push(await runProbe("Overpass halal (Paris bbox)", probeOverpassHalal));
  results.push(await runProbe("WAQI air quality", probeWaqi));

  for (const datasetId of [
    "respirons-mieux-dans-le-20eme-donnees-mini-stations",
    "bruit-evolution-de-l-indice-du-bruit-mesure-sur-des-stations-parisiennes",
    "eclairage-public",
    "accessibilite-des-hebergements-en-ile-de-france-paris-je-t-aime",
  ]) {
    results.push(
      await runProbe(`Paris ${datasetId}`, () => probeParisDataset(datasetId))
    );
  }

  for (const datasetId of ["arrets", "accessibilite-en-gare"]) {
    results.push(
      await runProbe(`IDFM ${datasetId}`, () =>
        probeParisDataset(datasetId, true)
      )
    );
  }

  results.push(await runProbe("Acceslibre CSV", probeAcceslibreCsv));

  results.push(
    await runProbe("Bruitparif open-data (optional)", probeBruitparifOptional)
  );
  results.push(
    await runProbe(
      "IDFM etat-des-ascenseurs (optional)",
      probeIdfmAscenseursOptional
    )
  );

  printTable(results);
  const ok = summarize(results);
  process.exit(ok ? 0 : 1);
}

main();
