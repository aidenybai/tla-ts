import { describe, expect, it } from "vite-plus/test";
import { decideIsabelle } from "../../src/prover/isabelle/decide";
import { parseTheory } from "../../src/prover/isabelle/isar/theory";
import { runTheory } from "../../src/prover/isabelle/isar/toplevel";
import { loadLogic } from "../../src/prover/isabelle/tla/logic";

const wrap = (body: string) => `theory T imports Constant begin\n${body}\nend\n`;

const decide = (body: string) => decideIsabelle(wrap(body), { timeLimitMs: 30_000 });

const run = (body: string) =>
  runTheory(loadLogic(), parseTheory(wrap(body)), {
    deadline: Date.now() + 30_000,
    signal: undefined,
  });

describe("the where attribute names its variables as Args.var reads them", () => {
  it.each(["?a", "a"])("instantiates %s", (variable) => {
    expect(decide(`lemma fixes x shows "x = x" by (rule refl[where ${variable} = "x"])`)).toBe(
      "unsat",
    );
  });

  it("reports a variable the theorem lacks", () => {
    expect(() => run('lemma fixes x shows "x = x" by (rule refl[where ?zz = "x"])')).toThrow(
      "No such variable in theorem: ?zz",
    );
  });
});
