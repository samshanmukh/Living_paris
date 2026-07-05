import assert from "node:assert/strict";
import test from "node:test";
import { runExperience } from "../../services/experience/engine";

const PARIS_CENTER = { lat: 48.8566, lon: 2.3522, walk: 15 };

test("halal persona includes halal layer in visibleLayers or markers", async () => {
  const result = await runExperience({ persona: "halal", ...PARIS_CENTER });
  const { visibleLayers, markers, contextMarkers = [] } = result.mapState;

  const hasHalalLayer = visibleLayers.includes("halal");
  const hasHalalMarker = markers.some((m) => m.layer === "halal");
  const hasHalalContext = contextMarkers.some((m) => m.layer === "halal");

  assert.ok(
    hasHalalLayer || hasHalalMarker || hasHalalContext,
    `expected halal in map output, layers=${visibleLayers.join(", ")}`
  );
  assert.equal(result.intent.persona, "halal");
  assert.ok(result.intent.dietary?.includes("halal"));
});

test("wheelchair persona includes metro-accessibility in context", async () => {
  const result = await runExperience({ persona: "wheelchair", ...PARIS_CENTER });
  const { visibleLayers, contextMarkers = [] } = result.mapState;

  assert.ok(
    visibleLayers.includes("metro-accessibility") ||
      contextMarkers.some((m) => m.layer === "metro-accessibility"),
    `expected metro-accessibility, layers=${visibleLayers.join(", ")}`
  );
  assert.equal(result.intent.accessibility, true);
});

test("asthma persona loads air-quality context markers", async () => {
  const result = await runExperience({ persona: "asthma", ...PARIS_CENTER });

  assert.ok(
    result.mapState.visibleLayers.includes("air-quality") ||
      (result.mapState.contextMarkers ?? []).some((m) => m.layer === "air-quality"),
    "expected air-quality context for asthma persona"
  );
});
