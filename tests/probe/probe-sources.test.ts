import { spawn } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/probe/probe-sources.mjs");

function runProbeScript(): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [SCRIPT], {
      cwd: ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
}

test("probe:sources exits 0 when required sources are reachable", async () => {
  const { exitCode, stdout, stderr } = await runProbeScript();

  assert.match(stdout, /\| Source \| Status \| HTTP \| Notes \|/);
  assert.match(stdout, /Required: \d+ passed/);

  if (exitCode !== 0) {
    console.error("probe-sources stderr:", stderr);
    console.error("probe-sources stdout:", stdout);
  }

  assert.equal(exitCode, 0, "probe-sources should exit 0 when required probes pass");
});
