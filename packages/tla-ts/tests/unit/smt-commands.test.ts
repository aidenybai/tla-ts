import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

// Each expected value is what z3 5.3.2 prints for the script.
describe("runSmtlibScript runs its commands as Z3 does", () => {
  // parse_check_sat shrinks the expression stack, so p is a new term at each check.
  it("releases the literals of a check once it has run", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(check-sat-assuming (p p))",
        "(simplify (and p p (> x 3)))",
        "(check-sat-assuming (p p))",
        "(push)",
        "(assert (or p p))",
        "(check-sat-assuming (p))",
        "(pop)",
        "(assert (or (not q) (not s) (not r) (not p)))",
        "(check-sat-assuming (q s r p))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "(and p (not (<= x 3)))", "sat", "sat", "unsat", "(q s r p)"]);
  });

  // context::m_unsat_core keeps the assumptions of the core alive until the next check.
  it("keeps the unsat core alive after its literals are released", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or p q))",
        "(check-sat-assuming ((not p) (not q)))",
        "(simplify (+ x 7))",
        "(simplify (* x 2))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not q) (not p)))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(+ 7 x)", "(* 2 x)", "((not p) (not q))", "unsat", "((not p) (not q))"]);
  });
});
