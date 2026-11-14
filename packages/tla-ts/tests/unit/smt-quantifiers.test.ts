import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

describe("a quantifier keeps what Z3 5.3.2 keeps", () => {
  it("tells two quantifiers apart by their :qid", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(simplify (and (forall ((x Int)) (! (> (f x) 0) :qid qa)) (forall ((x Int)) (! (> (f x) 0) :qid qb))))",
      ]),
    ).toEqual([
      "(let ((a!1 (forall ((x Int)) (! (not (<= (f x) 0)) :qid qa)))",
      "      (a!2 (forall ((x Int)) (! (not (<= (f x) 0)) :qid qb))))",
      "  (and a!1 a!2))",
    ]);
  });

  it("does not bring back a quantifier freed under another :qid", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(simplify (forall ((x Int)) (> (f x) 0)))",
        "(simplify (forall ((x Int)) (! (> (f x) 0) :qid qa)))",
      ]),
    ).toEqual([
      "(forall ((x Int)) (not (<= (f x) 0)))",
      "(forall ((x Int)) (! (not (<= (f x) 0)) :qid qa))",
    ]);
  });
});
