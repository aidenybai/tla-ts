import { describe, expect, it } from "vite-plus/test";
import { SmtUnsupportedError } from "../../src/errors";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output;
};

describe("runSmtlibScript prints what Z3 prints", () => {
  // z3test's regressions/smt2/z3.29.smt2, with what Z3 prints for it.
  it("answers each check-sat in its scope, and reports a constant that pop removed", () => {
    expect(
      run([
        "(set-option :produce-models true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(push)",
        "(assert (= (+ x y) 10))",
        "(assert (= (+ x (* 2 y)) 20))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (= (+ (* 3 x) y) 10))",
        "(assert (= (+ (* 2 x) (* 2 y)) 21))",
        "(check-sat)",
        "(declare-const p Bool)",
        "(pop)",
        "(assert p)",
      ]),
    ).toEqual(["sat", "unsat", '(error "line 15 column 8: unknown constant p")']);
  });

  it("counts the columns of the first line from 1", () => {
    expect(run(["(assert q)"])).toEqual(['(error "line 1 column 9: unknown constant q")']);
  });

  it("goes on after an error, and stops at exit", () => {
    expect(run(['(echo "start")', "(pop)", "(check-sat)", "(exit)", "(check-sat)"])).toEqual([
      "start",
      '(error "line 2 column 4: invalid pop command, argument is greater than the current stack depth")',
      "sat",
    ]);
  });

  it("prints success once :print-success is on", () => {
    expect(
      run(["(set-option :print-success true)", "(declare-const b Bool)", "(assert (not b))"]),
    ).toEqual(["success", "success", "success"]);
  });

  it("expands define-fun and takes check-sat's assumptions", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(define-fun both ((a Bool) (b Bool)) Bool (and a b))",
        "(assert (or p q))",
        "(check-sat (not p))",
        "(check-sat (not p) (not q))",
        "(check-sat-assuming ((both (not p) (not q))))",
      ]),
    ).toEqual(["sat", "unsat", "unsat"]);
  });

  it("nests xor to the right and - to the left", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(assert (xor a a a))",
        "(assert (not (xor false)))",
        "(assert (= (- 10 3 2) 5))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("reports a declaration of the same signature twice", () => {
    expect(run(["(declare-fun a () Bool)", "(declare-fun a () Bool)"])).toEqual([
      "(error \"line 2 column 22: invalid declaration, constant 'a' (with the given signature) already declared\")",
    ]);
  });

  it("answers an optimization by its hard constraints", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 3))",
        "(minimize x)",
        "(assert-soft (< x 0))",
        "(check-sat)",
        "(assert (< x 2))",
        "(check-sat)",
      ]),
    ).toEqual(["sat", "unsat"]);
  });

  it("prints the simplified term, as in z3test's t27.smt2 and abs.smt2", () => {
    expect(
      run([
        "(simplify (distinct 0 1 2 3 4 5 6))",
        "(declare-fun a () Int)",
        "(simplify (distinct 0 1 2 3 a 4 5 6))",
        "(simplify (abs a))",
      ]),
    ).toEqual(["true", "(distinct 0 1 2 3 a 4 5 6)", "(ite (>= a 0) a (* (- 1) a))"]);
  });

  it("names a deep subterm with let, as Z3's printer does", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(simplify (forall ((x Int) (y Int)) (=> (> x y) (> (+ x a) (+ y a b b b b b b b b b)))))",
      ]),
    ).toEqual([
      [
        "(forall ((x Int) (y Int))",
        "  (let ((a!1 (not (<= x (+ y (* 9 b))))))",
        "    (or (<= x y) a!1)))",
      ].join("\n"),
    ]);
  });

  it("prints the goal that apply's tactic leaves, as in z3test's t64.smt2", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (>= x 0))",
        "(assert (and (>= x 1) (not (or (not (and (>= x 2) (>= x 5))) (>= x 3)))))",
        "(apply simplify)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (>= x 0)",
        "  (>= x 1)",
        "  (>= x 2)",
        "  (>= x 5)",
        "  (not (>= x 3))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("throws at a theory it does not implement", () => {
    expect(() => run(["(declare-const f Float32)"])).toThrow(SmtUnsupportedError);
    expect(() => run(["(assert (= (str.len 1) 1))"])).toThrow(SmtUnsupportedError);
  });

  it("throws at a command it does not implement", () => {
    expect(() => run(["(check-sat)", "(get-model)"])).toThrow(SmtUnsupportedError);
  });
});
