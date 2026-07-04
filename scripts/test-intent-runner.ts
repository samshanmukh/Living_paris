import { loadEnvLocal } from "./load-env-local.mjs";
import { extractIntent } from "../services/ai/intent-extractor";
import { intentSchema } from "../lib/intent-schema";

loadEnvLocal();

async function main() {
  const phrase =
    process.argv.slice(2).join(" ") || "Plan a romantic evening under 60 euros";

  const intent = await extractIntent({ message: phrase });
  const parsed = intentSchema.safeParse(intent);

  if (!parsed.success) {
    console.error("FAIL: invalid intent", parsed.error.flatten());
    process.exit(1);
  }

  console.log(JSON.stringify(intent, null, 2));
  console.log("OK: intent valid");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
