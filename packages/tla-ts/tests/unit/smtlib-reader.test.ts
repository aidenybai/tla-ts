import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";
import { decideSmt } from "../../src/prover/smt/solver/solver";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output;
};

describe("set-logic after the first declaration, as Z3 5.3.2 prints it", () => {
  it("keeps the declared functions and the operators of every theory", () => {
    expect(
      run([
        "(declare-fun f () Int)",
        "(set-logic QF_LIA)",
        "(assert (= f 0))",
        "(check-sat)",
        "(get-model)",
        "(declare-const b (_ BitVec 3))",
        "(simplify (bvadd b #b001))",
        "(simplify (implies true false))",
      ]),
    ).toEqual(["sat", "(\n  (define-fun f () Int\n    0)\n)", "(bvadd #b001 b)", "false"]);
  });

  it("takes Int from a logic of reals only, and reads its numerals as reals", () => {
    expect(
      run([
        "(declare-fun f () Int)",
        "(set-logic QF_NRA)",
        "(declare-const x Int)",
        "(simplify (+ f 1))",
        "(simplify 2)",
      ]),
    ).toEqual([
      "(error \"line 3 column 17: Invalid constant declaration: unknown sort 'Int'\")",
      "(+ 1.0 (to_real f))",
      "2.0",
    ]);
  });

  it("keeps the sorts of the other theories once a command has used the manager", () => {
    expect(
      run(["(simplify 1)", "(set-logic QF_BV)", "(declare-const x Int)", "(simplify (+ x 1))"]),
    ).toEqual(["1", "(+ 1 x)"]);
  });

  it("reports a second logic, and one after an assertion, at the name of the logic", () => {
    expect(run(["(set-logic QF_LIA)", "(set-logic QF_LRA  )"])).toEqual([
      '(error "line 2 column 11: the logic has already been set")',
    ]);
    expect(run(["(declare-const p Bool)", "(assert p)", "(set-logic QF_LRA  )"])).toEqual([
      '(error "line 3 column 11: logic must be set before initialization")',
    ]);
  });

  it("keeps the declared functions in decideSmt", () => {
    expect(
      decideSmt(
        [
          "(declare-fun f () Int)",
          "(set-logic QF_LIA)",
          "(assert (distinct f f))",
          "(check-sat)",
        ].join("\n"),
        { timeLimitMs: 5000 },
      ),
    ).toBe("unsat");
  });
});

describe("terms nested 20,000 deep, which Z3 5.3.2 reads on its own stack", () => {
  const DEPTH = 20000;

  it("reads nested lets", () => {
    expect(
      run([
        "(declare-const x Int)",
        `(assert (= x (let ((y x)) ${"(let ((y y)) ".repeat(DEPTH - 1)}y${")".repeat(DEPTH)}))`,
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("reads nested quantifiers", () => {
    expect(
      run([
        "(declare-fun p (Int) Bool)",
        `(assert ${"(forall ((y Int)) ".repeat(DEPTH)}(p y)${")".repeat(DEPTH)})`,
        '(echo "done")',
      ]),
    ).toEqual(["done"]);
  });

  it("reads nested attributed terms", () => {
    const labels = Array.from({ length: DEPTH }, (_unused, index) => ` :lblpos l${index})`);
    expect(
      run([
        "(declare-const p Bool)",
        `(assert ${"(! ".repeat(DEPTH)}p${labels.join("")})`,
        '(echo "done")',
      ]),
    ).toEqual(["done"]);
  });
});
