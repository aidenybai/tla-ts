import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { check } from "../../src";
import { describe, expect, it } from "vite-plus/test";
import { type Checked, compileAndCheck, exploreInNode } from "./compile-worker";

const EXAMPLES = join(import.meta.dirname, "../fixtures/typescript/examples");

const getCounts = (checked: Checked) => ({
  status: checked.status,
  generatedStates: checked.generatedStates,
  distinctStates: checked.distinctStates,
  depth: checked.depth,
});

// Each port checks as Node runs it, as a search of its states in Node finds them, and as its
// original checks, but for the states generated: a call that writes nothing is no step, where an
// action of the original may be enabled and leave the state as it was.
describe("ports of tlaplus/Examples check like the originals", () => {
  for (const name of readdirSync(EXAMPLES).sort()) {
    const directory = join(EXAMPLES, name);
    const files = readdirSync(directory);
    const model = files.find((file) => file.endsWith(".ts"));
    const config = files.find((file) => file.endsWith(".cfg"));
    if (model === undefined || config === undefined) continue;
    it(
      name,
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
        const source = readFileSync(path, "utf8");
        const ported = await compileAndCheck(source, path);
        const explored = await exploreInNode(source, path);
        expect(original.failure?.message).toBeUndefined();
        expect(ported.error).toBeUndefined();
        expect(ported.failure).toBeUndefined();
        expect(explored.error).toBeUndefined();
        expect(getCounts(ported)).toEqual(getCounts(explored));
        expect({
          status: ported.status,
          distinctStates: ported.distinctStates,
          depth: ported.depth,
          traceLength: ported.traceLength,
        }).toEqual({
          status: original.status,
          distinctStates: original.distinctStates,
          depth: original.depth,
          traceLength: original.violation?.trace.length,
        });
      },
      900_000,
    );
  }
});
