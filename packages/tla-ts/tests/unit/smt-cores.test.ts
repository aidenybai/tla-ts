import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

// Each expected value is what z3 5.3.2 prints for the script.
describe("runSmtlibScript orders cores and terms as Z3 does", () => {
  // context::mk_unsat_core maps each literal of the conflict to its own assumption.
  it("keeps both polarities of an assumed variable in the unsat core", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(check-sat-assuming (p (not p)))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not p) p))",
        "(get-unsat-core)",
        "(check-sat-assuming (q (not p) r p (not q)))",
        "(get-unsat-core)",
        "(assert (! (or p q) :named a1))",
        "(assert (! (or p (not q)) :named a2))",
        "(check-sat-assuming (q (not q)))",
        "(get-unsat-core)",
        "(check-sat-assuming ((not p)))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "unsat",
      "(p (not p))",
      "unsat",
      "(p (not p))",
      "unsat",
      "(p (not p))",
      "unsat",
      "(q (not q))",
      "unsat",
      "((not p) a1 a2)",
    ]);
  });

  // pb_rewriter's compare: q is parsed before p here, and p has the smaller id.
  it("orders the arguments of a pseudo-Boolean constraint by ast id", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(simplify q)",
        "(assert p)",
        "(simplify ((_ pbge 2 1 1 1) q p r))",
        "(simplify ((_ pbeq 3 1 2 3) q r p))",
        "(simplify ((_ pble 3 1 2 3) q p r))",
      ]),
    ).toEqual([
      "q",
      "((_ at-least 2) p q r)",
      "((_ pbeq 3 3 1 2) p q r)",
      "(or (not r) (and (not p) (not q)))",
    ]);
  });

  // arith_qe_util::normalize_sum sorts by mul_lt, which compares ids.
  it("orders the terms of an equality that qe solves by ast id", () => {
    expect(
      run([
        "(declare-const u Int)",
        "(declare-const v Int)",
        "(declare-const w Int)",
        "(simplify (+ w v))",
        "(assert (> u 0))",
        "(assert (exists ((x Int)) (and (<= (+ (* 3 w) (* 2 v) u x) 0) (>= (+ x u (* 2 v) (* 3 w)) 0) (> x v))))",
        "(apply qe)",
      ]),
    ).toEqual([
      "(+ w v)",
      "(goals",
      "(goal",
      "  (> u 0)",
      "  (<= (+ (* 3 v) u (* 3 w)) (- 1))",
      "  :precision precise :depth 1)",
      ")",
    ]);
  });

  // tseitin_cnf_tactic's swap_if_gt compares ids.
  it("orders the atoms of an or of three ands by ast id", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(simplify (and c b))",
        "(assert (or a b))",
        "(assert (or (not (or c a)) (not (or b a)) (not (or c b))))",
        "(apply tseitin-cnf)",
      ]),
    ).toEqual([
      "(and c b)",
      "(goals",
      "(goal",
      "  (or a b)",
      "  (or (not a) (not c))",
      "  (or (not a) (not b))",
      "  (or (not c) (not b))",
      "  :precision precise :depth 1)",
      ")",
    ]);
  });

  // propagate_values_tactic::run only eliminates redundancies under proofs.
  it("leaves the goal to propagate-values as it is when proofs are on", () => {
    expect(
      run([
        "(set-option :produce-proofs true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (= x 3))",
        "(assert (> (+ x y) 5))",
        "(assert p)",
        "(assert (or p (> y 0)))",
        "(assert p)",
        "(apply propagate-values)",
        "(apply (then simplify propagate-values))",
      ]),
    ).toEqual([
      "(goals",
      "(goal",
      "  (= x 3)",
      "  (> (+ x y) 5)",
      "  p",
      "  (or p (> y 0))",
      "  :precision precise :depth 1)",
      ")",
      "(goals",
      "(goal",
      "  (= x 3)",
      "  (not (<= (+ x y) 5))",
      "  p",
      "  (or p (not (<= y 0)))",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  it("propagates values when proofs are off", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (= x 3))",
        "(assert (> (+ x y) 5))",
        "(assert p)",
        "(assert (or p (> y 0)))",
        "(assert p)",
        "(apply propagate-values)",
        "(apply (then simplify propagate-values))",
      ]),
    ).toEqual([
      "(goals",
      "(goal",
      "  (= x 3)",
      "  (not (<= y 2))",
      "  p",
      "  :precision precise :depth 1)",
      ")",
      "(goals",
      "(goal",
      "  (= x 3)",
      "  (not (<= y 2))",
      "  p",
      "  :precision precise :depth 2)",
      ")",
    ]);
  });

  // smt_solver::get_unsat_core runs mus on the core its context's last check left, so a second
  // get-unsat-core minimizes the empty core of the last satisfiable check of mus.
  it("minimizes the core with checks of the kernel under smt.core.minimize", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-option :smt.core.minimize true)",
        "(set-logic QF_LIA)",
        "(declare-const b0 Bool)",
        "(declare-const b1 Bool)",
        "(declare-const x Int)",
        "(assert (! (> x 2) :named n1))",
        "(check-sat-assuming ((not b0) b1 (< x 0) b0))",
        "(get-unsat-core)",
        "(get-unsat-core)",
        "(check-sat-assuming ((< x 0) b1))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "((not b0) b0)", "()", "unsat", "((< x 0) n1)"]);
  });
});
