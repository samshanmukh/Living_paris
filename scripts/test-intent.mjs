#!/usr/bin/env node
/**
 * Smoke test for intent extraction (Agent 2).
 * Usage: node scripts/test-intent.mjs "Plan a romantic evening under 60 euros"
 * Requires OPENROUTER_API_KEY in .env.local (loaded via dotenv if present).
 */
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

const phrase = process.argv.slice(2).join(" ") || "Plan a romantic evening under 60 euros";

loadEnvLocal();

const runner = `
import { extractIntent } from "../services/ai/intent-extractor.ts";
import { intentSchema } from "../lib/intent-schema.ts";

const phrase = ${JSON.stringify(phrase)};
const intent = await extractIntent({ message: phrase });
const parsed = intentSchema.safeParse(intent);
if (!parsed.success) {
  console.error("FAIL: invalid intent", parsed.error.flatten());
  process.exit(1);
}
console.log(JSON.stringify(intent, null, 2));
console.log("OK: intent valid");
`;

const result = spawnSync("npx", ["tsx", "--eval", runner], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
