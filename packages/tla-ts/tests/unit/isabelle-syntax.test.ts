import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { decideIsabelle } from "../../src/prover/isabelle/decide";

const theory = readFileSync(join(import.meta.dirname, "../fixtures/isabelle/TLAPS-2.thy"), "utf8");

describe("decideIsabelle reads a theory's inner syntax", () => {
  it("answers unknown for a symbol that never closes", () => {
    expect(theory).toContain('\\<notin> (a_CONSTANTunde_Sunde_a)))))"');
    expect(decideIsabelle(theory.replace("\\<notin>", "\\<notin"), { timeLimitMs: 30_000 })).toBe(
      "unknown",
    );
  });
});
