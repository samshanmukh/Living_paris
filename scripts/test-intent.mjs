#!/usr/bin/env node
/**
 * Smoke test for intent extraction (Agent 2).
 * Usage: node scripts/test-intent.mjs "Plan a romantic evening under 60 euros"
 * Requires OPENROUTER_API_KEY in .env.local
 */
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

const phrase = process.argv.slice(2).join(" ") || "Plan a romantic evening under 60 euros";

loadEnvLocal();

const result = spawnSync(
  "npx",
  ["tsx", "scripts/test-intent-runner.ts", phrase],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
);

process.exit(result.status ?? 1);
