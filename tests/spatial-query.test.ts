import { test } from "node:test";
import assert from "node:assert/strict";
import { createSpatialEngine } from "../services/data/spatial-engine";
import { FileDataStore } from "../services/data/file-store";
import { createCachedDataStore } from "../services/data/store";

const engine = createSpatialEngine(createCachedDataStore(new FileDataStore()));

test("romantic + accessibility returns cafes or museums near center", async () => {
  const result = await engine.runSpatialQuery({
    mood: "romantic",
    budget: 60,
    walk: 15,
    accessibility: true,
    lat: 48.8566,
    lon: 2.3522,
    limit: 20,
  });

  assert.ok(result.totalFeatures > 0, "expected at least one feature");
  const layers = new Set(result.geojson.features.map((f) => f.properties.layer));
  assert.ok(
    layers.has("cafes") || layers.has("museums") || layers.has("parks"),
    `expected romantic layers, got: ${[...layers].join(", ")}`
  );
});

test("rainy query returns mostly indoor places", async () => {
  const result = await engine.runSpatialQuery({
    mood: "rainy",
    rainy: true,
    walk: 15,
    lat: 48.8566,
    lon: 2.3522,
    limit: 20,
  });

  assert.ok(result.totalFeatures > 0, "expected at least one feature");
  const indoorOrMetro = result.geojson.features.filter(
    (f) => f.properties.indoor || f.properties.layer === "metro"
  );
  assert.ok(
    indoorOrMetro.length >= result.totalFeatures / 2,
    "rainy query should mostly return indoor or metro features"
  );
});

test("cafes include dietary tags for vegetarian name hints", async () => {
  const collection = await engine.loadLayer("cafes");
  const withDietary = collection.features.filter(
    (f) => (f.properties.dietary?.length ?? 0) > 0
  );
  assert.ok(withDietary.length > 0, "expected some cafes with dietary tags");
});
