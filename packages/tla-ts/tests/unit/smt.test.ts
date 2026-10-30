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

  // Doubles round 2^53 + 1 to 2^53 and 2^54 + 3 to 2^54 + 4, which flips each verdict.
  it("tells apart numerals past 2^53", () => {
    const problem = [
      "(declare-fun x () Int)",
      "(assert (= x 9007199254740993))",
      "(assert (not (= x 9007199254740992)))",
      "(check-sat)",
    ].join("\n");
    expect(decideSmt(problem, { timeLimitMs: 5000 })).toBe("sat");
  });

  it("computes exactly with numerals past 2^53", () => {
    const problems = [
      "(assert (= (* 2 x) 18014398509481987))",
      "(assert (= x 1180591620717411303424))\n(assert (not (= (div (- 1180591620717411303425) x) (- 2))))",
    ].map((assertions) => `(declare-fun x () Int)\n${assertions}\n(check-sat)\n`);
    for (const problem of problems) expect(decideSmt(problem, { timeLimitMs: 5000 })).toBe("unsat");
  });

  // Z3: unsat. The 2 of (* 2 a) is nested in a sum before the equality needs it as a term.
  it("relates a numeral to the arithmetic once a product has used it", () => {
    const problem = [
      "(declare-fun a () Int)",
      "(declare-fun b () Int)",
      "(assert (= (+ a b) 7))",
      "(assert (= (+ (* 2 a) (* (- 3) b)) 2))",
      "(check-sat)",
    ].join("\n");
    expect(decideSmt(problem, { timeLimitMs: 5000 })).toBe("unsat");
  });

  it("rejects an ill-sorted application", () => {
    expect(() =>
      decideSmt("(declare-fun p (Int) Bool)\n(assert (p true))\n(check-sat)\n", {
        timeLimitMs: 5000,
      }),
    ).toThrow(SmtParseError);
  });
});

// Each verdict is Z3's on the same problem.
describe("decideSmt on real arithmetic", () => {
  const decideLines = (...lines: string[]) =>
    decideSmt([...lines, "(check-sat)"].join("\n"), { timeLimitMs: 5000 });

  it("finds a real strictly between 0 and 1", () => {
    expect(decideLines("(declare-fun x () Real)", "(assert (< 0.0 x))", "(assert (< x 1.0))")).toBe(
      "sat",
    );
  });

  it("finds no integer strictly between 0 and 1", () => {
    expect(decideLines("(declare-fun x () Int)", "(assert (< 0 x))", "(assert (< x 1))")).toBe(
      "unsat",
    );
  });

  it("solves x + y = 1 and x - y = 0 with x = 1/2", () => {
    const lines = [
      "(declare-fun x () Real)",
      "(declare-fun y () Real)",
      "(assert (= (+ x y) 1.0))",
      "(assert (= (- x y) 0.0))",
    ];
    expect(decideLines(...lines)).toBe("sat");
    expect(decideLines(...lines, "(assert (not (= x (/ 1 2))))")).toBe("unsat");
  });

  it("rounds to_int down", () => {
    const lines = ["(declare-fun x () Real)", "(assert (= (to_int x) 2))"];
    expect(decideLines(...lines, "(assert (< x 2.0))")).toBe("unsat");
    expect(decideLines(...lines, "(assert (> x 2.5))", "(assert (< x 3.0))")).toBe("sat");
    expect(decideLines("(assert (not (= (to_int (- 1.5)) (- 2))))")).toBe("unsat");
  });

  it("decides is_int", () => {
    const lines = ["(declare-fun x () Real)", "(assert (< 1.0 x))", "(assert (< x 2.0))"];
    expect(decideLines(...lines, "(assert (is_int x))")).toBe("unsat");
    expect(decideLines(...lines, "(assert (not (is_int x)))")).toBe("sat");
    expect(
      decideLines(
        "(declare-fun x () Real)",
        "(assert (> (* 3.0 x) 1.0))",
        "(assert (< (* 3.0 x) 2.0))",
        "(assert (is_int x))",
      ),
    ).toBe("unsat");
  });

  it("keeps strict bounds strict", () => {
    const lines = ["(declare-fun x () Real)", "(assert (> (+ x 0.1) 0.3))"];
    expect(decideLines(...lines, "(assert (<= (* 10.0 x) 2.0))")).toBe("unsat");
    expect(decideLines(...lines, "(assert (<= (* 10.0 x) 2.5))")).toBe("sat");
  });

  it("refutes an infeasible linear system", () => {
    expect(
      decideLines(
        "(declare-fun a () Real)",
        "(declare-fun b () Real)",
        "(assert (= (+ (* 3.0 a) (* 2.0 b)) 7.0))",
        "(assert (= (- (* 6.0 a) (* 4.0 b)) 2.0))",
        "(assert (< a 1.0))",
      ),
    ).toBe("unsat");
  });

  it("coerces Int terms of Real positions", () => {
    expect(
      decideLines(
        "(declare-fun i () Int)",
        "(declare-fun y () Real)",
        "(assert (= (+ i y) 2.5))",
        "(assert (= y 0.25))",
      ),
    ).toBe("unsat");
  });

  it("does not answer a nonlinear real problem", () => {
    expect(
      decideLines("(declare-fun x () Real)", "(declare-fun y () Real)", "(assert (= (* x y) 2.0))"),
    ).toBe("unknown");
  });
});
