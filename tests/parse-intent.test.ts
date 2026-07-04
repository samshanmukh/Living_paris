import assert from "node:assert/strict";
import test from "node:test";
import { parseMessage } from "../lib/parse-intent";

test("train of thought does not trigger rainy", () => {
  const patch = parseMessage("Pardon — I lost my train of thought.");
  assert.equal(patch.rainy, undefined);
});

test("explicit rain sets rainy", () => {
  const patch = parseMessage("It's raining");
  assert.equal(patch.rainy, true);
});

test("walk context does not set timeBudget from minutes", () => {
  const patch = parseMessage("Best food within a 15-min walk");
  assert.equal(patch.walk, 15);
  assert.equal(patch.timeBudget, undefined);
});

test("hour without walk sets timeBudget", () => {
  const patch = parseMessage("We only have an hour");
  assert.equal(patch.timeBudget, 60);
  assert.equal(patch.walk, undefined);
});
