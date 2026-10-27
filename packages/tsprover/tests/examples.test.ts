import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { check, type CheckResult } from "tla-ts";
import { describe, expect, it } from "vite-plus/test";
import { compile } from "../src";

// Each directory holds a spec from tlaplus/Examples, its config, and a TypeScript port of it.
const EXAMPLES = join(import.meta.dirname, "examples");

const getSummary = (result: CheckResult) => ({
  status: result.status,
  generatedStates: result.generatedStates,
  distinctStates: result.distinctStates,
  depth: result.depth,
  traceLength: result.violation?.trace.length,
});

describe("ports of tlaplus/Examples check like the originals", () => {
  for (const name of readdirSync(EXAMPLES).sort()) {
    const directory = join(EXAMPLES, name);
    const files = readdirSync(directory);
    const proof = files.find((file) => file.endsWith(".proof.ts"));
    const config = files.find((file) => file.endsWith(".cfg"));
    if (proof === undefined || config === undefined) continue;
    it(name, async () => {
      const original = await check({
        source: readFileSync(join(directory, config.replace(/\.cfg$/, ".tla")), "utf8"),
        config: readFileSync(join(directory, config), "utf8"),
        loadModule: (module) => {
          const path = join(directory, `${module}.tla`);
          return existsSync(path) ? readFileSync(path, "utf8") : undefined;
        },
      });
      const path = join(directory, proof);
      const ported = await check(compile(readFileSync(path, "utf8"), path));
      expect(original.failure?.message).toBeUndefined();
      expect(ported.failure?.message).toBeUndefined();
      expect(getSummary(ported)).toEqual(getSummary(original));
    });
  }
});
