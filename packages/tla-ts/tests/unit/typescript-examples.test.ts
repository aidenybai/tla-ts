import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { check, type CheckResult } from "../../src";
import { describe, expect, it } from "vite-plus/test";
import { compileAndCheck } from "./compile-worker";

const EXAMPLES = join(import.meta.dirname, "../fixtures/typescript/examples");

// The ports that compare collections with ===, which TLA+'s equality was where today's compiler
// read them, and which Node compares by identity, so that they don't check as the originals do.
const IDENTITY_COMPARED = new Map([
  ["dining-philosophers", "compares a philosopher's Set of forks with a new Set by ==="],
  ["ewd840", "compares the array active with the array of the state before a step by ==="],
  ["lock", "compares the Set of pc's keys with procs by ==="],
]);

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
    const model = files.find((file) => file.endsWith(".ts"));
    const config = files.find((file) => file.endsWith(".cfg"));
    if (model === undefined || config === undefined) continue;
    const reason = IDENTITY_COMPARED.get(name);
    // Skipped where the port relies on ===, as IDENTITY_COMPARED says.
    (reason === undefined ? it : it.skip)(
      reason === undefined ? name : `${name}, which ${reason}`,
      async () => {
        const original = await check({
          source: readFileSync(join(directory, config.replace(/\.cfg$/, ".tla")), "utf8"),
          config: readFileSync(join(directory, config), "utf8"),
          loadModule: (module) => {
            const path = join(directory, `${module}.tla`);
            return existsSync(path) ? readFileSync(path, "utf8") : undefined;
          },
        });
        const path = join(directory, model);
        const ported = await compileAndCheck(readFileSync(path, "utf8"), path);
        expect(original.failure?.message).toBeUndefined();
        expect(ported.error).toBeUndefined();
        expect(ported.failure).toBeUndefined();
        expect({
          status: ported.status,
          generatedStates: ported.generatedStates,
          distinctStates: ported.distinctStates,
          depth: ported.depth,
          traceLength: ported.traceLength,
        }).toEqual(getSummary(original));
      },
      900_000,
    );
  }
});
