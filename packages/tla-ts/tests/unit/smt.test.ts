import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { SmtParseError } from "../../src/errors";
import { checkSmt, decideSmt } from "../../src/prove/smt/solver/solver";

interface RecordedVerdict {
  z3: string;
  source: string;
}

const DIRECTORY = join(import.meta.dirname, "../fixtures/smt");

const verdicts: Record<string, RecordedVerdict> = JSON.parse(
  readFileSync(join(DIRECTORY, "verdicts.json"), "utf8"),
);

const read = (name: string) => readFileSync(join(DIRECTORY, name), "utf8");

const decide = (name: string) => decideSmt(read(name), { timeLimitMs: 5000 });

// (g x) is f applied depth times to x, and (g 0) is not: unsat after one instance.
const getDeepProblem = (depth: number) => {
  const nest = (term: string) => `${"(f ".repeat(depth)}${term}${")".repeat(depth)}`;
  return [
    "(declare-fun f (Int) Int)",
    "(declare-fun g (Int) Int)",
    `(assert (forall ((x Int)) (! (= (g x) ${nest("x")}) :pattern ((g x)))))`,
    `(assert (not (= (g 0) ${nest("0")})))`,
    "(check-sat)",
  ].join("\n");
};

describe("decideSmt proves what Z3 proves", () => {
  for (const name of Object.keys(verdicts).filter(
    (innerName) => verdicts[innerName].z3 === "unsat",
  ))
    it(`proves ${verdicts[name].source}`, () => {
      expect(decide(name)).toBe("unsat");
    });
});

describe("decideSmt never proves what Z3 refutes", () => {
  for (const name of Object.keys(verdicts).filter((innerName) => verdicts[innerName].z3 === "sat"))
    it(`does not prove ${verdicts[name].source}`, () => {
      expect(decide(name)).not.toBe("unsat");
    });
});

describe("decideSmt", () => {
  it("answers the same way with the same instances when run twice", () => {
    const text = read("Barriers-63.smt");
    const first = checkSmt(text, { timeLimitMs: 5000 });
    const second = checkSmt(text, { timeLimitMs: 5000 });
    expect(first.numInstances).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  it("gives up when the signal aborts", () => {
    const controller = new AbortController();
    controller.abort();
    expect(
      decideSmt(read("Barriers-63.smt"), { timeLimitMs: 5000, signal: controller.signal }),
    ).toBe("unknown");
  });

  it("proves a problem whose terms are nested thousands deep", () => {
    expect(decideSmt(getDeepProblem(2500), { timeLimitMs: 5000 })).toBe("unsat");
  });

  it("answers instead of throwing when a recursion exhausts the stack", () => {
    expect(["unsat", "unknown"]).toContain(decideSmt(getDeepProblem(20000), { timeLimitMs: 5000 }));
  });

  it("rejects an ill-sorted application", () => {
    expect(() =>
      decideSmt("(declare-fun p (Int) Bool)\n(assert (p true))\n(check-sat)\n", {
        timeLimitMs: 5000,
      }),
    ).toThrow(SmtParseError);
  });
});
