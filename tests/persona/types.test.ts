import assert from "node:assert/strict";
import test from "node:test";
import { PERSONA_PRESETS } from "../../lib/persona/constants";
import { PERSONA_IDS } from "../../lib/persona/types";
import { LAYER_TYPES } from "../../lib/types";

test("PERSONA_PRESETS has exactly 7 persona keys", () => {
  assert.equal(Object.keys(PERSONA_PRESETS).length, 7);
  for (const id of PERSONA_IDS) {
    assert.ok(
      PERSONA_PRESETS[id],
      `expected preset for persona "${id}"`
    );
    assert.equal(PERSONA_PRESETS[id].id, id);
  }
});

test("new persona layers are registered in LAYER_TYPES", () => {
  for (const layer of ["lighting", "halal", "metro-accessibility"] as const) {
    assert.ok(
      (LAYER_TYPES as readonly string[]).includes(layer),
      `expected "${layer}" in LAYER_TYPES`
    );
  }
});

test("each preset primary and overlay layers are valid LayerType values", () => {
  const validLayers = new Set<string>(LAYER_TYPES);

  for (const preset of Object.values(PERSONA_PRESETS)) {
    for (const layer of [...preset.primaryLayers, ...preset.overlayLayers]) {
      assert.ok(
        validLayers.has(layer),
        `${preset.id}: layer "${layer}" is not in LAYER_TYPES`
      );
    }
  }
});
