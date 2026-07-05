import assert from "node:assert/strict";
import test from "node:test";
import { parseMessage } from "../../lib/parse-intent";
import { PERSONA_PRESETS } from "../../lib/persona/constants";
import {
  applyPersonaToIntent,
  detectPersonaFromMessage,
  resolvePersona,
} from "../../services/persona/resolve-persona";

test("parseMessage detects persona keywords", () => {
  assert.equal(parseMessage("I have asthma, need clean air").persona, "asthma");
  assert.equal(parseMessage("Need a step-free route").persona, "wheelchair");
  assert.equal(parseMessage("Where is halal food?").persona, "halal");
  assert.equal(parseMessage("Low stimulus outing please").persona, "sensory");
  assert.equal(parseMessage("Night safety — well lit streets").persona, "night-safety");
  assert.equal(parseMessage("Date night ideas").persona, "date-night");
  assert.equal(parseMessage("I'm blind, need metro clarity").persona, "visually-impaired");
});

test("detectPersonaFromMessage maps keywords to persona ids", () => {
  assert.equal(detectPersonaFromMessage("muslim food near me"), "halal");
  assert.equal(detectPersonaFromMessage("accessible route to the café"), "wheelchair");
  assert.equal(detectPersonaFromMessage("just a nice walk"), undefined);
});

test("resolvePersona returns preset when intent.persona is set", () => {
  const preset = resolvePersona({ persona: "wheelchair" });
  assert.ok(preset);
  assert.equal(preset?.id, "wheelchair");
  assert.equal(preset?.name, PERSONA_PRESETS.wheelchair.name);
});

test("resolvePersona returns null without persona on intent", () => {
  assert.equal(resolvePersona({ mood: "romantic" }), null);
});

test("applyPersonaToIntent merges primary layers and filter hints", () => {
  const intent = applyPersonaToIntent({}, PERSONA_PRESETS.halal);

  assert.equal(intent.persona, "halal");
  assert.deepEqual(intent.layers, PERSONA_PRESETS.halal.primaryLayers);
  assert.deepEqual(intent.dietary, ["halal"]);
});

test("applyPersonaToIntent sets accessibility from wheelchair preset", () => {
  const intent = applyPersonaToIntent({ mood: "food" }, PERSONA_PRESETS.wheelchair);

  assert.equal(intent.accessibility, true);
  assert.ok(intent.layers?.includes("accessibility"));
  assert.ok(intent.layers?.includes("metro-accessibility"));
});
