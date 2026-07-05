#!/usr/bin/env node
/**
 * Smoke test for POST /api/chat (integrated pipeline).
 * Usage: node scripts/test-chat.mjs "Plan a romantic evening under 60 euros"
 * Requires: npm run dev running, OPENROUTER_API_KEY in .env.local for LLM path
 */
import { loadEnvLocal } from "./load-env-local.mjs";

const phrase = process.argv.slice(2).join(" ") || "Plan a romantic evening under 60 euros";
const base = process.env.CHAT_URL ?? "http://localhost:3000";

loadEnvLocal();

const res = await fetch(`${base}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: phrase }),
});

const data = await res.json();

if (!res.ok) {
  console.error("FAIL:", res.status, data);
  process.exit(1);
}

for (const key of ["reply", "intent", "result", "intentSource"]) {
  if (!(key in data)) {
    console.error(`FAIL: missing response key "${key}"`);
    process.exit(1);
  }
}

console.log("reply:", data.reply);
console.log("intentSource:", data.intentSource);
console.log("intent:", JSON.stringify(data.intent));
console.log(
  "experience:",
  data.result.experience.name,
  "· markers:",
  data.result.mapState.markers.length,
  "· stops:",
  data.result.itinerary.stops.length
);
console.log("OK: /api/chat");
