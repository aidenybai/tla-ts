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
        "(assert (= (- 10 3 2) 5))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("throws at a command it does not implement", () => {
    expect(() => run(["(check-sat)", "(get-model)"])).toThrow(SmtUnsupportedError);
  });
});
