import assert from "node:assert/strict";
import test from "node:test";
import type { ParisFeature, ParisFeatureProperties } from "../../lib/types";
import { filterByIntent, resolveLayers } from "../../services/data/intent-filter";

function makeFeature(overrides: Partial<ParisFeatureProperties>): ParisFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
    properties: {
      id: "test-1",
      name: "Test Place",
      layer: "cafes",
      type: "cafe",
      ...overrides,
    },
  };
}

test("wheelchair persona resolves accessibility-related layers", () => {
  const layers = resolveLayers({ persona: "wheelchair", mood: "general" });

  assert.ok(layers.includes("accessibility"));
  assert.ok(layers.includes("metro-accessibility"));
  assert.ok(layers.includes("cafes"));
});

test("explicit intent.layers override persona layer union", () => {
  const layers = resolveLayers({
    persona: "wheelchair",
    layers: ["parks"],
  });

  assert.deepEqual(layers, ["parks"]);
});

test("halal persona filter keeps only features with halal dietary tag", () => {
  const halalCafe = makeFeature({
    id: "halal-cafe",
    layer: "halal",
    dietary: ["halal"],
  });
  const regularCafe = makeFeature({
    id: "regular-cafe",
    layer: "cafes",
    dietary: ["vegetarian"],
  });

  const filtered = filterByIntent([halalCafe, regularCafe], {
    persona: "halal",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.properties.id, "halal-cafe");
});

test("wheelchair persona filter drops non-accessible venues", () => {
  const accessible = makeFeature({
    id: "accessible-cafe",
    layer: "cafes",
    accessible: true,
  });
  const notAccessible = makeFeature({
    id: "stairs-cafe",
    layer: "cafes",
    accessible: false,
  });

  const filtered = filterByIntent([accessible, notAccessible], {
    persona: "wheelchair",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.properties.id, "accessible-cafe");
});
