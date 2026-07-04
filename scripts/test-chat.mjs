#!/usr/bin/env node
/**
 * Smoke test for POST /api/chat (Agent 3).
 * Usage: node scripts/test-chat.mjs "Plan a romantic evening under 60 euros"
 * Requires: npm run dev + npm run dev:api running, OPENROUTER_API_KEY in .env.local
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

for (const key of ["message", "intent", "mapState"]) {
  if (!(key in data)) {
    console.error(`FAIL: missing response key "${key}"`);
    process.exit(1);
  }
}

console.log("message:", data.message);
console.log("intent:", JSON.stringify(data.intent));
console.log(
  "mapState:",
  JSON.stringify({
    center: data.mapState.center,
    theme: data.mapState.theme,
    features: data.mapState.highlights?.features?.length ?? 0,
  })
);
console.log("OK: /api/chat");
