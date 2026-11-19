import { describe, expect, it } from "vite-plus/test";
import { SmtInvariantError, SmtUnsupportedError } from "../../src/errors";
import {
  AstManager,
  KIND_APP,
  OP_ADD,
  OP_ITE,
  OP_MUL,
  SORT_INT,
  SORT_REAL,
} from "../../src/prover/smt/solver/ast";
import { Fpa2BvConverter } from "../../src/prover/smt/solver/fpa2bv-converter";
import { Optsmt } from "../../src/prover/smt/solver/optsmt";
import { getMultInverse, Rational } from "../../src/prover/smt/solver/rational";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../../src/prover/smt/solver/rewriter";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { createCommandReader, createSmtlibReader } from "../../src/prover/smt/solver/smtlib-parser";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output;
};

// The expected lines are the output of Z3 5.3.2 on the same script.
describe("tactics keep the dependencies Z3 keeps", () => {
  it("fm joins the dependencies of the constraints it resolves", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-const z Real)",
        "(assert (! (<= x y) :named a1))",
        "(assert (! (<= y z) :named a2))",
        "(assert (! (< z x) :named a3))",
        "(assert (! (< z 100.0) :named a4))",
        "(check-sat-using (then fm smt))",
        "(get-unsat-core)",
        "(apply fm :print_dependencies true)",
      ]),
    ).toEqual([
      "unsat",
      "(a2 a3 a1)",
      "(goals\n(goal\n  |- a2 a3 a1\n  false\n  :precision precise :depth 2)\n)",
    ]);
  });

  it("fm joins dependencies across several eliminations", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-const z Real)",
        "(declare-const u Real)",
        "(assert (! (<= (+ x y) 1.0) :named a1))",
        "(assert (! (<= (- y x) 1.0) :named a2))",
        "(assert (! (>= (+ y z) 5.0) :named a3))",
        "(assert (! (<= (+ z u) 1.0) :named a4))",
        "(assert (! (>= (- u x) 0.0) :named a5))",
        "(assert (! (>= (+ u x) 0.0) :named a6))",
        "(assert (! (<= (+ x y) 2.0) :named a7))",
        "(apply fm :print_dependencies true)",
        "(check-sat-using (then fm smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  |- a2 a5 a3 a4\n  false\n  :precision precise :depth 2)\n)",
      "unsat",
      "(a2 a5 a3 a4)",
    ]);
  });

  it("fm gives every formula it leaves the dependencies of its constraint", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-const z Real)",
        "(declare-const w Real)",
        "(declare-const i Int)",
        "(declare-const p Bool)",
        "(assert (! (<= x y) :named a1))",
        "(assert (! (or p (<= y z)) :named a2))",
        "(assert (! (< z w) :named a3))",
        "(assert (! (< (+ w (* 2.0 y)) 100.0) :named a4))",
        "(assert (! (> (+ x y) (to_real i)) :named a5))",
        "(assert (! (> i 3) :named a6))",
        "(assert (<= x 7.0))",
        "(assert (! (>= y (- 3.0)) :named a8))",
        "(assert (! (< x i) :named a9))",
        "(assert (! (not p) :named a10))",
        "(assert (! (> z 200.0) :named a11))",
        "(apply fm :print_dependencies true)",
        "(check-sat-using (then fm smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a2",
        "  (or p (<= (+ y (* (- 1.0) z)) 0.0))",
        "  |- a6",
        "  (not (<= i 3))",
        "  |- a8",
        "  (>= y (- 3.0))",
        "  |- a10",
        "  (not p)",
        "  |- a11",
        "  (not (<= z 200.0))",
        "  |- a3 a4",
        "  (not (>= (+ z (* 2.0 y)) 100.0))",
        "  |- a5 a1",
        "  (not (>= (+ (* (- 2.0) y) (to_real i)) 0.0))",
        "  |- a5",
        "  (not (>= (+ (* (- 1.0) y) (to_real i)) 7.0))",
        "  |- a5 a9",
        "  (not (>= (* (- 1.0) y) 0.0))",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
      "unsat",
      "(a11 a9 a5 a3 a4)",
    ]);
  });

  // lia2card_tactic passes g->dep(i) to update and asserts its axioms without one, so the bounds
  // it folds into the sum leave the core.
  it("lia2card keeps the dependency of each formula it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(declare-const p Bool)",
        "(assert (! (>= x 0) :named a1))",
        "(assert (! (<= x 1) :named a2))",
        "(assert (! (<= 0 y) :named a3))",
        "(assert (! (<= y 1) :named a4))",
        "(assert (! (and (<= 0 z) (<= z 1)) :named a4b))",
        "(assert (! (>= (+ x y z) 4) :named a5))",
        "(assert (! p :named a6))",
        "(apply lia2card :print_dependencies true)",
        "(check-sat-using (then lia2card smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  |- a5\n  false\n  :precision precise :depth 1)\n)",
      "unsat",
      "(a5)",
    ]);
  });

  it("fix-dl-var keeps the dependency of each formula it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (! (<= (- x y) 3) :named a1))",
        "(assert (! (<= (- y z) 3) :named a2))",
        "(assert (! (>= (- x z) 10) :named a3))",
        "(assert (! (<= x 4) :named a4))",
        "(assert (! (>= z (- 2)) :named a5))",
        "(check-sat-using (then fix-dl-var smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(a5 a3 a4)"]);
  });

  it("factor keeps the dependency of each formula it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(assert (! (= (- (* x x) (* y y)) 0.0) :named a1))",
        "(assert (! (> (- (* x x) 1.0) 0.0) :named a2))",
        "(assert (! (> x y) :named a3))",
        "(assert (! (> (+ x y) 0.0) :named a4))",
        "(assert (! (< (* x x x) 0.0) :named a5))",
        "(apply factor :print_dependencies true)",
        "(check-sat-using (then factor smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (or (= (+ y (* (- 1.0) x)) 0.0) (= (+ y x) 0.0))",
        "  |- a2",
        "  (> (* (+ x 1.0) (+ x (- 1.0))) 0.0)",
        "  |- a3",
        "  (> x y)",
        "  |- a4",
        "  (> (+ x y) 0.0)",
        "  |- a5",
        "  (< x 0.0)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a5 a3 a4)",
    ]);
  });

  it("fpa2bv keeps the dependency of each formula it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x (_ FloatingPoint 5 11))",
        "(declare-const y (_ FloatingPoint 5 11))",
        "(assert (! (fp.lt x y) :named a1))",
        "(assert (! (fp.lt y x) :named a2))",
        "(assert (! (not (fp.isNaN x)) :named a3))",
        "(check-sat-using (then fpa2bv smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(a1 a2)"]);
  });

  it("elim-uncnstr keeps the dependency of each formula it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-logic QF_LRA)",
        "(declare-const y Real)",
        "(declare-const z Real)",
        "(assert (<= y (/ 3.25 0.0)))",
        "(assert (! (<= y 1.0) :named n1))",
        "(assert (! (<= (+ z 1.0) 3.0) :named n3))",
        "(check-sat-using (then elim-uncnstr smt))",
        "(assert (! (> y 2.0) :named n2))",
        "(check-sat-using (then elim-uncnstr smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "unsat", "(n1 n2)"]);
  });

  it("keeps the dependencies in bit-blast, max-bv-sharing, card2bv and distribute-forall", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const b Bool)",
        "(assert (! (bvult x #x05) :named a1))",
        "(assert (! (= y (bvadd x #x01)) :named a2))",
        "(assert (! (bvugt y #x07) :named a3))",
        "(assert (! (or b (= x #x02)) :named a4))",
        "(check-sat-using (then max-bv-sharing bit-blast sat))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(a1 a2 a3)", "(:rlimit 305)"]);
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const b Bool)",
        "(declare-const n Int)",
        "(declare-const m Int)",
        "(assert (! (>= n 3) :named c1))",
        "(assert (! (<= (+ n m) 1) :named c2))",
        "(assert (! (>= m 0) :named c3))",
        "(assert (! b :named c4))",
        "(check-sat-using (then card2bv smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(c3 c1 c2)", "(:rlimit 250)"]);
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const b Bool)",
        "(declare-const n Int)",
        "(assert (! (forall ((z Int)) (and (> z n) b)) :named d1))",
        "(assert (! (not b) :named d2))",
        "(check-sat-using (then distribute-forall smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(d1 d2)", "(:rlimit 27)"]);
  });

  it("keeps the dependencies in ctx-simplify and takes no formula with one as context", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (! (= x 1) :named a1))",
        "(assert (or (= x 1) p))",
        "(assert (or (not (= x 1)) (= y 2)))",
        "(apply ctx-simplify)",
        "(assert (! (< y 2) :named a2))",
        "(check-sat-using (then ctx-simplify smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (= x 1)",
        "  (or (= x 1) p)",
        "  (or (not (= x 1)) (= y 2))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a1 a2)",
      "(:rlimit 325)",
    ]);
  });

  it("keeps the dependencies in nnf, normalize-bounds, purify-arith and dt2bv", () => {
    const check = (lines: string[], tactic: string) =>
      run([
        "(set-option :produce-unsat-cores true)",
        ...lines,
        `(check-sat-using ${tactic})`,
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]);
    expect(
      check(
        [
          "(declare-const p Bool)",
          "(declare-const q Bool)",
          "(declare-const r Bool)",
          "(assert (! (= p (and q r)) :named a1))",
          "(assert (! (not (= q (or p r))) :named a2))",
          "(assert (! q :named a3))",
          "(assert (! r :named a4))",
        ],
        "(then nnf smt)",
      ),
    ).toEqual(["unsat", "(a4 a2 a3)", "(:rlimit 293)"]);
    expect(
      check(
        [
          "(declare-const x Int)",
          "(declare-const y Int)",
          "(assert (! (>= x 3) :named a1))",
          "(assert (! (>= y (- 2)) :named a2))",
          "(assert (! (<= (+ x y) 0) :named a3))",
          "(assert (! (<= x 10) :named a4))",
        ],
        "(then normalize-bounds smt)",
      ),
    ).toEqual(["unsat", "(a3 a1 a2)", "(:rlimit 258)"]);
    expect(
      check(
        [
          "(declare-const x Int)",
          "(declare-const y Int)",
          "(assert (! (= (div x 2) 3) :named a1))",
          "(assert (! (= (mod x 2) 1) :named a2))",
          "(assert (! (< x 7) :named a3))",
          "(assert (! (> y (div y 3)) :named a4))",
        ],
        "(then purify-arith smt)",
      ),
    ).toEqual(["unsat", "(a3 a1 a2)", "(:rlimit 719)"]);
    expect(
      check(
        [
          "(declare-datatypes ((Color 0)) (((red) (green) (blue))))",
          "(declare-const c Color)",
          "(declare-const d Color)",
          "(declare-const p Bool)",
          "(assert (! (or (= c red) (= c green)) :named a1))",
          "(assert (! (not (= c red)) :named a2))",
          "(assert (! (= d c) :named a3))",
          "(assert (! (or p (not (= d green))) :named a4))",
          "(assert (! (not p) :named a5))",
        ],
        "(then dt2bv simplify bit-blast sat)",
      ),
    ).toEqual(["unsat", "(a4 a1 a3 a5 a2)", "(:rlimit 173)"]);
  });

  it("gives each clause of tseitin-cnf the dependencies of its formula", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(assert (! (or (and p q) (and r s)) :named a1))",
        "(assert (! (= p (or r (not s))) :named a2))",
        "(assert (! (ite q (not r) s) :named a3))",
        "(assert (! (not (and (or p r) (or q s))) :named a4))",
        "(assert (or (and p q) s))",
        "(check-sat-using (then tseitin-cnf sat))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(a4 a2 a1)", "(:rlimit 207)"]);
  });

  it("keeps the dependency of each clause that occf rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (! (or (> x 2) (< y 0) (> (+ x y) 5) p) :named a1))",
        "(assert (! (or (> x 2) (< y 0) (not p)) :named a2))",
        "(assert (! (<= x 2) :named a3))",
        "(assert (! (>= y 0) :named a4))",
        "(assert (or (> (+ x y) 5) (< y 0)))",
        "(assert (! (< (+ x y) 3) :named a5))",
        "(check-sat-using (then occf smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(a4 a5)", "(:rlimit 463)"]);
  });

  it("internalizes the assertions of the smt tactic once when it assumes the names", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (! p :named a1))",
        "(assert (! (not p) :named a2))",
        "(assert (! (or p q) :named a3))",
        "(check-sat-using smt)",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(a1 a2)", "(:rlimit 140)"]);
  });

  it("assumes the dependencies in the sat tactic, and loses them in a goal it leaves", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(declare-const x (_ BitVec 4))",
        "(push)",
        "(assert (! (or p q) :named a1))",
        "(assert (! (not p) :named a2))",
        "(assert (! (or (not q) s) :named a3))",
        "(assert (! (not s) :named a4))",
        "(assert (! (or r p) :named a5))",
        "(check-sat-using sat)",
        "(get-unsat-core)",
        "(get-info :rlimit)",
        "(pop)",
        "(assert (! (or p (bvult x #x3)) :named a1))",
        "(apply (using-params sat :max_conflicts 0))",
      ]),
    ).toEqual([
      "unsat",
      "(a4 a1 a2 a3)",
      "(:rlimit 73)",
      [
        "(goals",
        "(goal",
        "  (or (not a1) k!0)",
        "  (or (not p) k!0)",
        "  (or (not (bvult x #x3)) k!0)",
        "  (or p (bvult x #x3) (not k!0))",
        "  :precision over :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("der keeps the dependency of the quantifier it eliminates", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-fun f (Int) Int)",
        "(declare-const a Int)",
        "(assert (! (forall ((x Int)) (or (not (= x a)) (> (f x) 0))) :named a1))",
        "(assert (! (< (f a) 0) :named a2))",
        "(assert (! (> a 3) :named a3))",
        "(apply der :print_dependencies true)",
        "(check-sat-using (then der smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (> (f a) 0)",
        "  |- a2",
        "  (< (f a) 0)",
        "  |- a3",
        "  (> a 3)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a1 a2)",
      "(:rlimit 306)",
    ]);
  });

  it("dom-simplify leaves the formulas that have dependencies and keeps them", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const x Int)",
        "(assert p)",
        "(assert (ite p (> x 3) q))",
        "(assert (! (or (not p) (< x 2)) :named a1))",
        "(assert (! (ite p (< x 0) q) :named a2))",
        "(assert (! (or q (> x 5)) :named a3))",
        "(apply dom-simplify :print_dependencies true)",
        "(check-sat-using (then dom-simplify smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |-",
        "  p",
        "  |-",
        "  (> x 3)",
        "  |- a1",
        "  (or (not p) (< x 2))",
        "  |- a2",
        "  (ite p (< x 0) q)",
        "  |- a3",
        "  (or q (> x 5))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a1)",
      "(:rlimit 356)",
    ]);
  });

  it("unit-subsume-simplify keeps the dependencies of the clauses it does not subsume", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (! p :named a1))",
        "(assert (! (or p q) :named a2))",
        "(assert (! (or (not p) r) :named a3))",
        "(assert (! (or (not r) (not p)) :named a4))",
        "(assert (! (or q r) :named a5))",
        "(apply unit-subsume-simplify :print_dependencies true)",
        "(check-sat-using (then unit-subsume-simplify smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  p",
        "  |- a3",
        "  (or (not p) r)",
        "  |- a4",
        "  (or (not r) (not p))",
        "  :precision precise :depth 0)",
        ")",
      ].join("\n"),
      "unsat",
      "(a4 a1 a3)",
      "(:rlimit 1400)",
    ]);
  });

  it("propagate-ineqs takes no bound that has dependencies and keeps those it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (>= x 3))",
        "(assert (<= y 0))",
        "(assert (! (or (<= x 2) (> z 7)) :named a1))",
        "(assert (! (<= z 4) :named a2))",
        "(assert (! (>= x 1) :named a3))",
        "(apply propagate-ineqs :print_dependencies true)",
        "(check-sat-using (then propagate-ineqs smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (or false (> z 7))",
        "  |- a2",
        "  (<= z 4)",
        "  |- a3",
        "  (>= x 1)",
        "  |-",
        "  (>= x 3)",
        "  |-",
        "  (<= y 0)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a1 a2)",
      "(:rlimit 397)",
    ]);
  });

  it("solve-eqs joins the dependencies of the equations it substitutes", () => {
    const declarations = [
      "(set-option :produce-unsat-cores true)",
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(declare-const z Int)",
      "(declare-const w Int)",
      "(assert (! (= x (+ y 1)) :named a1))",
      "(assert (! (= y (* 2 z)) :named a2))",
      "(assert (= w (+ z 3)))",
      "(assert (! (> (+ x w) 10) :named a3))",
      "(assert (! (< z 1) :named a4))",
      "(assert (! (> w 0) :named a5))",
    ];
    expect(
      run([...declarations, "(apply solve-eqs :print_dependencies true)", "(get-info :rlimit)"]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a3 a2 a1",
        "  (not (<= w 5))",
        "  |- a4",
        "  (not (<= 4 w))",
        "  |- a5",
        "  (not (<= w 0))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "(:rlimit 283)",
    ]);
    expect(
      run([
        ...declarations,
        "(check-sat-using (then solve-eqs smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(a4 a3 a1 a2)", "(:rlimit 495)"]);
  });

  it("solve-eqs gives an equation it solves in context the dependencies of its formula", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (! (or (not p) (= x 5)) :named a1))",
        "(assert (! p :named a2))",
        "(assert (! (=> q (= y (+ x 1))) :named a3))",
        "(assert (! q :named a4))",
        "(assert (! (< (+ x y) 3) :named a5))",
        "(assert (! (> y 0) :named a6))",
        "(apply (using-params solve-eqs :context_solve true) :print_dependencies true)",
        "(check-sat-using (then (using-params solve-eqs :context_solve true) smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  |- a5 a3 a4 a1 a2\n  false\n  :precision precise :depth 1)\n)",
      "unsat",
      "(a5 a3 a4 a1 a2)",
      "(:rlimit 521)",
    ]);
  });

  it("pb2bv joins the dependencies of the bounds it uses", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (! (<= 0 x) :named a1))",
        "(assert (! (<= x 1) :named a2))",
        "(assert (! (and (<= 0 y) (<= y 1)) :named a3))",
        "(assert (! (or (= x 0) (>= (+ y z) 2)) :named a4))",
        "(assert (! (= x y) :named a5))",
        "(assert (! (<= 0 z) :named a6))",
        "(assert (! (<= z 0) :named a7))",
        "(assert (! (>= (+ x y) 1) :named a8))",
        "(apply pb2bv :print_dependencies true)",
        "(check-sat-using (then pb2bv bit-blast sat))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1 a2",
        "  true",
        "  |- a2 a1",
        "  true",
        "  |- a3",
        "  true",
        "  |- a3",
        "  true",
        "  |- a4 a7 a6 a3 a1 a2",
        "  (or (not k!0) (and k!1 k!2))",
        "  |- a5 a3 a1 a2",
        "  (= k!0 k!1)",
        "  |- a6 a7",
        "  true",
        "  |- a7 a6",
        "  (not k!2)",
        "  |- a8 a3 a1 a2",
        "  (or k!0 k!1)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a4 a7 a6 a5 a1 a8 a3 a2)",
      "(:rlimit 148)",
    ]);
  });

  it("add-bounds keeps the dependencies, so qflia keeps them too", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (! (>= x 3) :named a1))",
        "(assert (! (<= (+ x y) 1) :named a2))",
        "(assert (! (>= y 0) :named a3))",
        "(apply (using-params add-bounds :add_bound_lower -4 :add_bound_upper 4) :print_dependencies true)",
        "(check-sat-using (then (using-params add-bounds :add_bound_lower -4 :add_bound_upper 4) smt))",
        "(get-info :rlimit)",
        "(check-sat-using qflia)",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (>= x 3)",
        "  |- a2",
        "  (<= (+ x y) 1)",
        "  |- a3",
        "  (>= y 0)",
        "  |-",
        "  (<= x 4)",
        "  |-",
        "  (>= x (- 4))",
        "  |-",
        "  (<= y 4)",
        "  |-",
        "  (>= y (- 4))",
        "  :precision under :depth 1)",
        ")",
      ].join("\n"),
      "unknown",
      "(:rlimit 277)",
      "unsat",
      "(a3 a1 a2)",
      "(:rlimit 535)",
    ]);
  });

  it("bv-divrem-bounds keeps the dependencies and gives its lemmas none", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const a (_ BitVec 8))",
        "(declare-const b (_ BitVec 8))",
        "(assert (! (= (bvurem a b) #x05) :named a1))",
        "(assert (! (bvult b #x03) :named a2))",
        "(assert (! (not (= b #x00)) :named a3))",
        "(apply bv-divrem-bounds :print_dependencies true)",
        "(check-sat-using (then bv-divrem-bounds smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (= (bvurem a b) #x05)",
        "  |- a2",
        "  (bvult b #x03)",
        "  |- a3",
        "  (not (= b #x00))",
        "  |-",
        "  (or (= b #x00) (not (bvule b (bvurem a b))))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a3 a1 a2)",
      "(:rlimit 398)",
    ]);
  });

  it("bv1-blast keeps the dependency of each formula it splits", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(assert (! (= ((_ extract 1 0) x) #b10) :named a1))",
        "(assert (! (= x (concat #b00 ((_ extract 1 0) y))) :named a2))",
        "(assert (! (= ((_ extract 0 0) y) #b1) :named a3))",
        "(apply bv1-blast :print_dependencies true)",
        "(check-sat-using (then bv1-blast smt))",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  |- a1",
        "  (= k!3 #b0)",
        "  |- a2",
        "  (= k!3 k!7)",
        "  |- a3",
        "  (= k!7 #b1)",
        "  |- a1",
        "  (= k!2 #b1)",
        "  |- a2",
        "  (= k!2 k!6)",
        "  |- a2",
        "  (= k!1 #b0)",
        "  |- a2",
        "  (= k!0 #b0)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      "unsat",
      "(a3 a1 a2)",
      "(:rlimit 341)",
    ]);
  });

  it("a tactic that fails on unsat cores tracks the dependencies, so qfbv keeps them", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(declare-const b Bool)",
        "(assert (! (bvult x #x05) :named a1))",
        "(assert (! (= y (bvadd x #x01)) :named a2))",
        "(assert (! (bvugt y #x07) :named a3))",
        "(assert (! (or b (= x #x02)) :named a4))",
        "(apply reduce-bv-size :print_dependencies true)",
        "(check-sat-using (then reduce-bv-size smt))",
        "(get-unsat-core)",
        "(check-sat-using qfbv)",
        "(get-unsat-core)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      '(error "tactic failed: bv-size-reduction does not support unsat core production")',
      "unknown",
      '(error "line 11 column 15: unsat core is not available")',
      "unsat",
      "(a1 a3 a2)",
      "(:rlimit 704)",
    ]);
  });
});

describe("tactics where Z3 5.3.2 fails", () => {
  // Z3 answers the second check unknown, for "Sorts RoundingMode and (_ BitVec 3) are incompatible".
  it("fpa2bv blasts fp.sub as it blasts fp.add of the negation", () => {
    expect(
      run([
        "(declare-const x (_ FloatingPoint 2 3))",
        "(assert (not (fp.isNaN x)))",
        "(assert (not (fp.isInfinite x)))",
        "(push)",
        "(assert (fp.isNaN (fp.add RNE (fp #b0 #b01 #b00) (fp.neg x))))",
        "(check-sat-using (then fpa2bv simplify bit-blast sat))",
        "(pop)",
        "(assert (fp.isNaN (fp.sub RNE (fp #b0 #b01 #b00) x)))",
        "(check-sat-using (then fpa2bv simplify bit-blast sat))",
      ]),
    ).toEqual(["unsat", "unsat"]);
  });
});

describe("the logic check names a theory as Z3 does", () => {
  // check_logic prints m.get_family_name(fid), and the label family is a builtin it accepts.
  it("names the recfun family and accepts a label", () => {
    expect(
      run([
        "(set-logic QF_UFLIA)",
        "(define-fun-rec f ((n Int)) Int (ite (<= n 0) 0 (+ 1 (f (- n 1)))))",
        "(declare-const x Int)",
        "(assert (= x (f 2)))",
        "(check-sat)",
        "(assert (! (> x 0) :lblpos foo))",
        "(check-sat)",
      ]),
    ).toEqual(['(error "line 4 column 19: logic does not support theory recfun")', "sat", "sat"]);
  });
});

describe("the floating-point conversions round as Z3 does", () => {
  // mk_to_fp_real maps a rounding-mode numeral other than 0 to 4 to MPF_ROUND_TOWARD_ZERO, which
  // rounds 10^30 to the largest finite number where the nearest modes give infinity.
  it("rounds toward zero for the rounding-mode numerals 5 to 7", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const converter = new Fpa2BvConverter(manager, new Rewriter(manager, TACTIC_REWRITER_OPTIONS));
    const sort = manager.mkFpSort(5, 11);
    const value = manager.mkNumeralOfSort(Rational.of(10n ** 30n), SORT_REAL);
    const convert = (mode: bigint) =>
      converter.mkToFpReal(sort, manager.mkBvNumeral(mode, 3), value);
    const towardZero = convert(4n);
    expect(convert(0n)).not.toBe(towardZero);
    expect([convert(5n), convert(6n), convert(7n)]).toEqual([towardZero, towardZero, towardZero]);
  });

  // Z3 runs out of memory on a numeral of 2^30 bits here, and the port leaves the term.
  it("leaves the infinity test of an integer conversion with a 31-bit exponent", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(simplify (fp.isInfinite ((_ to_fp 31 8) RNE (to_real x))))",
        "(simplify (fp.isNormal ((_ to_fp 33 8) RTP (to_real x))))",
        "(simplify (fp.isInfinite ((_ to_fp 34 8) RNE (to_real x))))",
      ]),
    ).toEqual([
      "(fp.isInfinite ((_ to_fp 31 8) roundNearestTiesToEven (to_real x)))",
      "(fp.isNormal ((_ to_fp 33 8) roundTowardPositive (to_real x)))",
      "(fp.isInfinite ((_ to_fp 34 8) roundNearestTiesToEven (to_real x)))",
    ]);
  });

  // Z3 runs out of memory here too, and the port answers unknown as at its other limits.
  it("answers unknown for a symbolic conversion to a 31-bit exponent", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (fp.isInfinite ((_ to_fp 31 3) RTP (to_real x))))",
        "(check-sat)",
      ]),
    ).toEqual(["unknown"]);
  });
});

describe("the optimizer releases what Z3 releases", () => {
  // optsmt::add rewrites with a local th_rewriter, whose cache dies with it.
  it("keeps no term of the objective rewriter's cache", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const mkInt = (name: string) =>
      manager.mkApp(manager.mkFuncDecl(name, [], SORT_INT), [], SORT_INT);
    const sum = manager.mkApp(OP_ADD, [mkInt("x"), mkInt("y")], SORT_INT);
    const scaled = manager.mkApp(OP_MUL, [manager.mkNumeral(5n), sum], SORT_INT);
    const inner = manager.mkApp(OP_ADD, [sum, scaled], SORT_INT);
    const term = manager.mkApp(
      OP_ADD,
      [mkInt("x"), manager.mkApp(OP_MUL, [manager.mkNumeral(2n), inner], SORT_INT)],
      SORT_INT,
    );
    manager.incRef(term);
    const optsmt = new Optsmt(
      manager,
      {
        manager,
        isMbqi: false,
        mbqiMaxIterations: 0,
        isFindingMacros: false,
        setup: { logic: undefined, isAutoConfig: true },
        write: () => {},
        parameters: new Map(),
        hasDefinitions: () => false,
        destructors: [],
        cleanups: [],
        inits: [],
      },
      { getBaseModel: () => null, setModel: () => {} },
      {
        bisectRounds: 0,
        isNlsat: false,
        isDualBounds: false,
        supremumRlimit: 0,
        isLexAfterUnbounded: false,
      },
    );
    const warmUp = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    manager.decRef(warmUp.rewrite(term));
    warmUp.release();
    const numAsts = manager.getNumAsts();
    optsmt.add(term);
    optsmt.release();
    expect(manager.getNumAsts()).toBe(numAsts);
  });
});

describe("recursive definitions fold the ites Z3 folds", () => {
  // Z3's (get-proof) prints the definitions: fold-rec-1 is the ite on (> a 108), fold-rec-2 the one
  // on (> a 109), fold-rec-3 the one on (> a 107) and fold-rec-4 the one on (> a 106).
  it("takes the tied ite that comes first in the hash table and numbers the folds from 1", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const command = createCommandReader(
      [
        "(define-fun-rec f ((x Int) (a Int)) Int",
        "  (ite (>= x 13)",
        "    (ite (>= x 5)",
        "      (ite (>= x 7)",
        "        (ite (>= a 18)",
        "          (ite (> a 106) (+ 8 (f (- x 2) (+ a 1))) 2)",
        "          (ite (> a 107) (+ 0 (f (- x 2) (+ a 1))) 4))",
        "        0)",
        "      1)",
        "    (ite (>= a 3)",
        "      (ite (>= x 7)",
        "        (ite (< x 3) (ite (> a 108) (+ 21 (f (- x 3) a)) 2) 3)",
        "        (ite (> a 13) 1 (ite (> a 109) (+ 29 (f (- x 2) a)) 0)))",
        "      1)))",
      ].join("\n"),
    ).read();
    if (command === undefined) throw new SmtInvariantError("the script has a command");
    createSmtlibReader(manager).declareCommand(command);
    const folds = new Map(
      [...manager.recFunDefs.values()].map((def) => [
        manager.funcDecls[def.decl].name,
        manager.kinds[def.rhs] === KIND_APP && manager.getOp(def.rhs) === OP_ITE
          ? manager.getRationalValue(manager.getArg(manager.getArg(def.rhs, 0), 1)).toString()
          : "",
      ]),
    );
    expect(
      ["fold-rec-1", "fold-rec-2", "fold-rec-3", "fold-rec-4", "fold-rec-0", "fold-rec-5"].map(
        (name) => folds.get(name),
      ),
    ).toEqual(["108", "109", "107", "106", undefined, undefined]);
  });
});

describe("rationals", () => {
  it("rejects a double that is no rational number", () => {
    expect(() => Rational.fromDouble(Number.NaN)).toThrow(SmtInvariantError);
    expect(() => Rational.fromDouble(Number.POSITIVE_INFINITY)).toThrow(SmtInvariantError);
    expect(() => Rational.fromDouble(Number.NEGATIVE_INFINITY)).toThrow(SmtInvariantError);
    expect(Rational.fromDouble(0.1).toString()).toBe("3602879701896397/36028797018963968");
  });

  // rational::mult_inverse: 171 * 3 = 513 = 2 * 256 + 1.
  it("inverts an odd value modulo a power of two", () => {
    expect(getMultInverse(3n, 8)).toBe(171n);
    expect(getMultInverse(1n, 8)).toBe(1n);
    expect(getMultInverse(6n, 8)).toBeUndefined();
  });

  it("elim-uncnstr solves a product by the inverse of its coefficient", () => {
    expect(
      run([
        "(set-option :produce-models true)",
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(assert (bvule (bvmul #x03 x) #x10))",
        "(assert (bvule #x05 (bvmul #x06 y)))",
        "(check-sat-using (then elim-uncnstr smt))",
        "(get-model)",
        "(simplify (= (bvmul #x03 x) #x09))",
      ]),
    ).toEqual([
      "sat",
      "(\n  (define-fun x () (_ BitVec 8)\n    #xb0)\n  (define-fun y () (_ BitVec 8)\n    #x30)\n)",
      "(= x #x03)",
    ]);
  });
});

describe("tseitin-cnf, as Z3 5.3.2 composes it", () => {
  it("leaves the core tactic out once the simplifier decides the goal", () => {
    expect(
      run([
        "(declare-const b0 Bool)",
        "(declare-const b1 Bool)",
        "(push)",
        "(assert (not (and false b0 true)))",
        "(apply tseitin-cnf)",
        "(pop)",
        "(assert (and true b0 (not (and false b1))))",
        "(apply tseitin-cnf)",
        "(assert (or (and false b1) false))",
        "(apply tseitin-cnf)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  :precision precise :depth 1)\n)",
      "(goals\n(goal\n  b0\n  :precision precise :depth 2)\n)",
      "(goals\n(goal\n  false\n  :precision precise :depth 1)\n)",
    ]);
  });
});

describe("elim-term-ite, as Z3 5.3.2 names the term if-then-elses", () => {
  it("defines a numbered name for each and hides the names from the model", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const b Bool)",
        "(assert (> (+ (ite b x y) (ite (> x y) x 2)) (ite b x y)))",
        "(apply elim-term-ite)",
        "(check-sat-using (then elim-term-ite smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (> (+ k!0 k!1) k!0)\n  (or (not b) (= k!0 x))\n  (or b (= k!0 y))\n  (or (not (> x y)) (= k!1 x))\n  (or (> x y) (= k!1 2))\n  :precision precise :depth 1)\n)",
      "sat",
      "(\n  (define-fun b () Bool\n    false)\n  (define-fun x () Int\n    2)\n  (define-fun y () Int\n    3)\n)",
    ]);
  });

  it("names the terms of each subgoal afresh", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(assert (or c d))",
        "(assert (> (ite c a b) 0))",
        "(apply (then split-clause elim-term-ite))",
        "(assert (not c))",
        "(assert (< a 0))",
        "(check-sat-using (then split-clause elim-term-ite smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  c\n  (> k!0 0)\n  (or (not c) (= k!0 a))\n  (or c (= k!0 b))\n  :precision precise :depth 2)\n(goal\n  d\n  (> k!1 0)\n  (or (not c) (= k!1 a))\n  (or c (= k!1 b))\n  :precision precise :depth 2)\n)",
      "sat",
      "(\n  (define-fun c () Bool\n    false)\n  (define-fun d () Bool\n    true)\n  (define-fun b () Int\n    1)\n  (define-fun a () Int\n    (- 1))\n)",
    ]);
  });

  it("names a term under a quantifier by its bound variables", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const x Int)",
        "(assert (forall ((z Int)) (> (f (ite (> z 0) z x)) 0)))",
        "(apply elim-term-ite)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (forall ((z Int)) (> (f (k!0 z)) 0))\n  (forall ((x!1 Int))\n    (! (or (not (> x!1 0)) (= (k!0 x!1) x!1)) :pattern ((k!0 x!1))))\n  (forall ((x!1 Int)) (! (or (> x!1 0) (= (k!0 x!1) x)) :pattern ((k!0 x!1))))\n  :precision precise :depth 1)\n)",
    ]);
  });

  it("asserts the definitions without dependencies", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const b Bool)",
        "(assert (! (> (ite b x 3) 5) :named a1))",
        "(assert (! (< x 0) :named a2))",
        "(assert (! b :named a3))",
        "(check-sat-using (then elim-term-ite smt))",
        "(get-unsat-core)",
        "(apply (then elim-term-ite elim-term-ite))",
      ]),
    ).toEqual([
      "unsat",
      "(a3 a1 a2)",
      "(goals\n(goal\n  (> k!1 5)\n  (< x 0)\n  b\n  (or (not b) (= k!1 x))\n  (or b (= k!1 3))\n  :precision precise :depth 2)\n)",
    ]);
  });

  it("lets nlsat decide a nonlinear problem with term if-then-elses", () => {
    expect(
      run([
        "(set-logic QF_NRA)",
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-const b Bool)",
        "(assert (= (* (ite b x 3.0) x) 2.0))",
        "(assert (> (* y y) (ite (> x 0.0) x 1.0)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(\n  (define-fun y () Real\n    (- 1.0))\n  (define-fun b () Bool\n    false)\n  (define-fun x () Real\n    (/ 2.0 3.0))\n)",
    ]);
  });
});

describe("blast-term-ite, as Z3 5.3.2 lifts the term if-then-elses", () => {
  it("lifts each one out of its parent, under a quantifier too but not into a pattern", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-const c1 Bool)",
        "(declare-const c2 Bool)",
        "(declare-const c3 Bool)",
        "(declare-const e1 Int)",
        "(declare-const e2 Int)",
        "(declare-const e3 Int)",
        "(declare-const e4 Int)",
        "(assert (p (f (ite c1 (ite c2 e1 (ite c3 e2 e3)) e4))))",
        "(assert (forall ((x Int)) (! (> (f (ite c1 x e1)) (+ (ite c2 x e2) 1)) :pattern ((f x)))))",
        "(assert (= (f (ite c3 e1 e1)) e2))",
        "(apply blast-term-ite)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (let ((a!1 (ite c2 (p (f e1)) (ite c3 (p (f e2)) (p (f e3))))))\n    (ite c1 a!1 (p (f e4))))\n  (forall ((x Int))\n    (! (ite c1\n            (ite c2 (> (f x) (+ x 1)) (> (f x) (+ e2 1)))\n            (ite c2 (> (f e1) (+ x 1)) (> (f e1) (+ e2 1))))\n       :pattern ((f x))))\n  (= (f e1) e2)\n  :precision precise :depth 1)\n)",
    ]);
  });

  it("keeps the dependencies of the formulas it rewrites", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-fun f (Int) Int)",
        "(declare-const c1 Bool)",
        "(declare-const e1 Int)",
        "(declare-const e2 Int)",
        "(assert (! (> (f (ite c1 e1 e2)) 3) :named a1))",
        "(assert (! (= e1 e2) :named a2))",
        "(assert (! (< (f e2) 2) :named a3))",
        "(check-sat-using (then blast-term-ite smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(a3 a1 a2)"]);
  });
});

describe("the arithmetic probes, as Z3 5.3.2 measures a goal", () => {
  it("measure both sides of each comparison and each numeral", () => {
    expect(
      run([
        '(set-option :diagnostic-output-channel "stdout")',
        "(declare-const x Int)",
        "(declare-const y Real)",
        "(declare-fun f (Int) Int)",
        "(declare-const b Bool)",
        "(assert (> (* x x (f x)) 3))",
        "(assert (= (* 2.5 y y y) (/ 7.0 3.0)))",
        "(assert (forall ((z Int)) (<= (* z x) (- 300))))",
        "(assert (= b (> x 1000000)))",
        '(apply (and-then (echo "max-deg " arith-max-deg " avg-deg " arith-avg-deg) (echo "max-bw " arith-max-bw " avg-bw " arith-avg-bw) (fail-if (> arith-avg-deg 1))))',
      ]),
    ).toEqual([
      "max-deg 3 avg-deg 1.25",
      "max-bw 20 avg-bw 6.83333",
      '(error "tactic failed: fail-if tactic")',
    ]);
  });

  it("finds no QF_AUFLIA goal once an array is selected from", () => {
    const probe =
      '(apply (and-then (if is-qfauflia (echo "qfauflia") (echo "other")) (fail-if (> 1 0))))';
    expect(
      run([
        '(set-option :diagnostic-output-channel "stdout")',
        "(declare-const j Int)",
        "(declare-const a (Array Int Int))",
        "(declare-fun f (Int) (Array Int Int))",
        "(assert (> j 0))",
        "(assert (= a (f j)))",
        probe,
        "(assert (> (select a j) 0))",
        probe,
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "qfauflia",
      '(error "tactic failed: fail-if tactic")',
      "other",
      '(error "tactic failed: fail-if tactic")',
      "sat",
      "(:rlimit 318)",
    ]);
  });
});

describe("qfufbv, as Z3 5.3.2 answers QF_UFBV", () => {
  it("ackermannizes the functions and bit-blasts the goal", () => {
    expect(
      run([
        "(set-logic QF_UFBV)",
        "(declare-const v (_ BitVec 4))",
        "(declare-fun f ((_ BitVec 4)) (_ BitVec 4))",
        "(assert (distinct v #b1101))",
        "(assert (bvult (f v) (f #x1)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(\n  (define-fun v () (_ BitVec 4)\n    #x0)\n  (define-fun f ((x!0 (_ BitVec 4))) (_ BitVec 4)\n    (ite (= x!0 #x1) #xf\n      #x0))\n)",
    ]);
  });
});

describe("try-for, as Z3 5.3.2 runs it", () => {
  it("turns an error of its tactic into a tactic failure, which or-else catches", () => {
    expect(
      run([
        "(set-logic QF_LRA)",
        "(declare-const y Real)",
        "(assert (> (/ y 0.0) 1.0))",
        "(check-sat-using (or-else (try-for smt 100) skip))",
        "(get-info :reason-unknown)",
        "(check-sat-using (or-else smt skip))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "unknown")',
      "unknown",
      '(:reason-unknown "Benchmark contains uninterpreted function symbols, but specified logic does not support them.")',
    ]);
  });

  it("turns a resource limit inside its tactic into a tactic failure, which or-else catches", () => {
    expect(
      run([
        "(set-option :rlimit 1)",
        "(declare-const x (_ BitVec 4))",
        "(assert (= (bvmul x x) #x4))",
        "(check-sat-using (or-else (try-for (then bit-blast sat) 100) skip))",
        "(get-info :reason-unknown)",
        "(check-sat-using (try-for (then bit-blast sat) 100))",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "unknown")',
      "unknown",
      '(:reason-unknown "max. resource limit exceeded")',
    ]);
  });
});

describe("purify-arith, as Z3 5.3.2 composes it", () => {
  it("stops at a goal that one of its steps decides", () => {
    expect(
      run([
        "(apply purify-arith)",
        "(declare-const x Int)",
        "(assert (or (> x 2) (distinct (* x 0) (mod (- 1) 5))))",
        "(apply purify-arith)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  :precision precise :depth 1)\n)",
      "(goals\n(goal\n  :precision precise :depth 2)\n)",
    ]);
  });
});

describe("split-clause, as Z3 5.3.2 splits a goal", () => {
  it("splits the first clause, or the largest, into a subgoal for each literal", () => {
    expect(
      run([
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(assert (or a (> x 5)))",
        "(assert (or a b c))",
        "(apply split-clause)",
        "(apply (using-params split-clause :split_largest_clause true))",
        "(reset)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(apply split-clause)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal\n  (> x 0)\n  a\n  (or a b c)\n  :precision precise :depth 1)",
        "(goal\n  (> x 0)\n  (> x 5)\n  (or a b c)\n  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      [
        "(goals",
        "(goal\n  (> x 0)\n  (or a (> x 5))\n  a\n  :precision precise :depth 1)",
        "(goal\n  (> x 0)\n  (or a (> x 5))\n  b\n  :precision precise :depth 1)",
        "(goal\n  (> x 0)\n  (or a (> x 5))\n  c\n  :precision precise :depth 1)",
        ")",
      ].join("\n"),
      '(error "tactic failed: split-clause tactic failed, goal does not contain any clause")',
    ]);
  });

  it("looks for a clause before it checks for proofs", () => {
    expect(
      run([
        "(set-option :produce-proofs true)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(assert a)",
        "(assert (not b))",
        "(apply split-clause)",
        "(check-sat-using split-clause)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(error "tactic failed: split-clause tactic failed, goal does not contain any clause")',
      "unknown",
      '(:reason-unknown "split-clause tactic failed, goal does not contain any clause")',
    ]);
  });

  it("keeps the dependencies of the goal, so the smt tactic assumes each name", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(assert (or a (> x 5)))",
        "(assert (! (or a b c) :named n1))",
        "(check-sat-using (then split-clause smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun n1 () Bool\n    (or a b c))",
        "  (define-fun x () Int\n    1)",
        "  (define-fun a () Bool\n    true)",
        "  (define-fun b () Bool\n    false)",
        "  (define-fun c () Bool\n    false)",
        ")",
      ].join("\n"),
    ]);
  });

  // Z3 answers () after then and repeat, whose core it loses.
  it("joins the cores of the subgoals a combinator shows unsat, as par-then does", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const a Bool)",
        "(declare-const x Int)",
        "(assert (! (or a (> x 5)) :named n1))",
        "(assert (! (not a) :named n2))",
        "(assert (! (< x 0) :named n3))",
        "(assert (> x (- 9)))",
        "(check-sat-using (par-then split-clause smt))",
        "(get-unsat-core)",
        "(check-sat-using (then split-clause smt))",
        "(get-unsat-core)",
        "(check-sat-using (repeat (or-else split-clause smt)))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(n1 n3 n2)", "unsat", "(n1 n3 n2)", "unsat", "(n1 n3 n2)"]);
  });
});

describe("if-no-models, as Z3 5.3.2 runs it", () => {
  it("runs its tactic when the goal produces no models", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(apply (if-no-models fail))",
        "(set-option :produce-models false)",
        "(apply (if-no-models fail))",
        "(check-sat-using (if-no-models fail))",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (> x 0)\n  :precision precise :depth 0)\n)",
      '(error "tactic failed: fail tactic")',
      "unknown",
    ]);
  });

  it("leaves no model converter to print after a simplifier when the goal produces no models", () => {
    expect(
      run([
        "(set-option :produce-models false)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= x (+ y 1)))",
        "(assert (> y 2))",
        "(apply (then propagate-values solve-eqs) :print_model_converter true)",
      ]),
    ).toEqual(["(goals\n(goal\n  (not (<= x 3))\n  :precision precise :depth 2)\n)"]);
  });
});

describe("the models check-sat-using leaves, as Z3 5.3.2 makes them", () => {
  it("converts a model for an undecided goal that has a model converter", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const b Bool)",
        "(assert (= x (+ y 1)))",
        "(assert (or b (> (* y y) 2)))",
        "(check-sat-using solve-eqs)",
        "(get-model)",
      ]),
    ).toEqual([
      "unknown",
      "(\n  (define-fun x () Int\n    0)\n  (define-fun y () Int\n    (- 1))\n  (define-fun b () Bool\n    false)\n)",
    ]);
  });

  it("converts a model for an undecided goal through the empty model trail of a simplifier", () => {
    const problem = [
      "(declare-const x Int)",
      "(declare-const b Bool)",
      "(assert (or b (> (* x x) 2)))",
    ];
    const model = "(\n  (define-fun b () Bool\n    false)\n  (define-fun x () Int\n    0)\n)";
    expect(
      run([
        ...problem,
        "(check-sat-using solve-eqs)",
        "(get-model)",
        "(reset)",
        ...problem,
        "(check-sat-using dom-simplify)",
        "(get-model)",
      ]),
    ).toEqual(["unknown", model, "unknown", model]);
  });

  it("converts a model for an undecided goal through the empty model trail of der and qe-light", () => {
    const model = "(\n  (define-fun b () Bool\n    false)\n  (define-fun x () Int\n    0)\n)";
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const b Bool)",
        "(assert (or b (> (* x x) 2)))",
        "(check-sat-using der)",
        "(get-model)",
        "(check-sat-using qe-light)",
        "(get-model)",
      ]),
    ).toEqual(["unknown", model, "unknown", model]);
  });

  it("copies the model of the tactic that decided the goal in the order of its table", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (! (= x (+ y 1)) :named a1))",
        "(assert (! (> y 2) :named a2))",
        "(check-sat-using smt)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(\n  (define-fun a2 () Bool\n    (> y 2))\n  (define-fun a1 () Bool\n    (= x (+ y 1)))\n  (define-fun y () Int\n    3)\n  (define-fun x () Int\n    4)\n)",
    ]);
  });

  it("seeds the search of the smt tactic with its random_seed", () => {
    const vars = ["x0", "x1", "x2", "x3", "x4"];
    expect(
      run([
        "(set-logic QF_LIA)",
        ...vars.map((name) => `(declare-const ${name} Int)`),
        ...vars.map((name) => `(assert (and (<= 0 ${name}) (<= ${name} 9)))`),
        "(assert (or (< (+ x0 x4) 4) (> (- x0 x4) -1)))",
        "(assert (or (< (+ x1 x2) 7) (> (- x1 x2) 1)))",
        "(assert (or (< (+ x1 x0) 12) (> (- x1 x0) 2)))",
        "(assert (or (< (+ x1 x3) 9) (> (- x1 x3) 3)))",
        "(assert (or (< (+ x4 x2) 11) (> (- x4 x2) 0)))",
        "(assert (or (< (+ x4 x2) 3) (> (- x4 x2) 3)))",
        "(check-sat-using (using-params smt :random_seed 1))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(\n  (define-fun x4 () Int\n    1)\n  (define-fun x1 () Int\n    4)\n  (define-fun x2 () Int\n    0)\n  (define-fun x0 () Int\n    1)\n  (define-fun x3 () Int\n    0)\n)",
    ]);
  });

  it("sets up the smt tactic without the static features under auto_config false", () => {
    const lines = [
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(assert (<= (+ x (* 2 y)) 3))",
    ];
    expect(
      run([
        ...lines,
        "(check-sat-using (using-params smt :auto_config false))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 95)"]);
    expect(
      run([
        "(set-option :smt.auto_config false)",
        ...lines,
        "(check-sat-using (using-params smt :auto_config true))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 82)"]);
  });

  it("takes arith.branch_cut_ratio in the smt tactic, whose cuts lp.int_hammer_period sets", () => {
    const lines = [
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(declare-const z Int)",
      "(assert (and (<= (+ (* 2 x) y) 3) (>= x 1) (or (>= y 2) (>= z 5)) (or (<= y 0) (<= z 1))))",
    ];
    expect(
      run([
        ...lines,
        "(check-sat-using (using-params smt :arith.branch_cut_ratio 10000000))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 219)"]);
    expect(
      run([
        ...lines,
        "(check-sat-using (using-params smt :smt.arith.branch_cut_ratio 1))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 219)"]);
  });

  it("gives the cube, Gomory and hnf heuristics the period of lp.int_hammer_period", () => {
    const lines = [
      "(set-logic QF_LIA)",
      "(declare-const x0 Int)",
      "(declare-const x1 Int)",
      "(declare-const x2 Int)",
      "(declare-const x3 Int)",
      "(assert (and (>= (+ (* -4 x0) (* 5 x1) (* 2 x2) (* 19 x3)) 23) (<= (+ (* -4 x0) (* 5 x1) (* 2 x2) (* 19 x3)) 24)))",
      "(assert (and (>= (+ (* -3 x0) (* -5 x1) (* -10 x2) (* -7 x3)) -5) (<= (+ (* -3 x0) (* -5 x1) (* -10 x2) (* -7 x3)) -4)))",
      "(assert (and (>= (+ (* 18 x0) (* -11 x1) (* 18 x2) (* -10 x3)) 14) (<= (+ (* 18 x0) (* -11 x1) (* 18 x2) (* -10 x3)) 14)))",
      "(assert (and (>= x0 -40) (<= x0 40)))",
      "(assert (and (>= x1 -40) (<= x1 40)))",
      "(assert (and (>= x2 -40) (<= x2 40)))",
      "(assert (and (>= x3 -40) (<= x3 40)))",
      "(check-sat)",
      "(get-info :rlimit)",
    ];
    expect(run(lines)).toEqual(["unsat", "(:rlimit 9280)"]);
    expect(run(["(set-option :lp.int_hammer_period 1)", ...lines])).toEqual([
      "unsat",
      "(:rlimit 14390)",
    ]);
    expect(run(["(set-option :lp.int_hammer_period 2.0)", ...lines])).toEqual([
      "unsat",
      "(:rlimit 16751)",
    ]);
    expect(
      run([
        "(set-option :sat.euf true)",
        ...lines,
        "(set-option :lp.int_hammer_period 1)",
        "(assert (> x0 -41))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 4414)", "unsat", "(:rlimit 7199)"]);
  });

  it("reads smt.arith.propagate_eqs in the kernel and in the smt tactic", () => {
    const lines = [
      "(set-option :smt.arith.propagate_eqs false)",
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(declare-fun f (Int) Int)",
      "(assert (<= x y))",
      "(assert (<= y x))",
      "(assert (not (= (f x) (f y))))",
    ];
    expect(run([...lines, "(check-sat)", "(get-info :rlimit)"])).toEqual([
      "unsat",
      "(:rlimit 196)",
    ]);
    expect(run([...lines, "(check-sat-using smt)", "(get-info :rlimit)"])).toEqual([
      "unsat",
      "(:rlimit 142)",
    ]);
  });

  it("rejects the other options of lp", () => {
    const lines = ["(declare-const x Int)", "(assert (>= (* 3 x) 101))", "(check-sat)"];
    expect(() => run(["(set-option :lp.random_hammers false)", ...lines])).toThrow(
      new SmtUnsupportedError("the option :lp.random_hammers"),
    );
    expect(run(["(set-option :lp.int_hammer_period 4294967296)", ...lines])).toEqual([
      "(error \"line 1 column 35: invalid value '4294967296' for unsigned int parameter 'int_hammer_period'\")",
      "sat",
    ]);
  });

  it("runs the smt tactics of qflia that skip cuts without auto_config", () => {
    const declarations = ["(set-logic QF_LIA)", "(declare-const x Int)", "(declare-const y Int)"];
    expect(
      run([
        ...declarations,
        "(assert (>= (+ x y) 3))",
        "(assert (<= (- x y) 1))",
        "(assert (>= (+ (* 2 x) (* 3 y)) 7))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 410)"]);
    expect(
      run([
        ...declarations,
        "(assert (and (<= 0 x) (<= x 50) (<= 0 y) (<= y 50)))",
        "(assert (>= (+ x y) 30))",
        "(assert (<= (- x y) 1))",
        "(assert (>= (+ (* 2 x) (* 3 y)) 71))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 558)"]);
  });

  it("eliminates unconstrained terms in elim-uncnstr without the definitions of a model", () => {
    expect(
      run([
        "(set-option :produce-models false)",
        "(declare-datatypes ((C 0)) (((k0) (k1) (k2))))",
        "(declare-const x C)",
        "(declare-const p Bool)",
        "(assert (or p (= x k0)))",
        "(assert (not p))",
        "(apply elim-uncnstr)",
      ]),
    ).toEqual(["(goals\n(goal\n  (or p k!0)\n  (not p)\n  :precision precise :depth 1)\n)"]);
    expect(
      run([
        "(set-option :produce-models false)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (<= (+ x (* 2 y)) 3))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 91)"]);
  });

  it("builds no model converter in the tactics that skip it when the goal has no models", () => {
    const fm = [
      "(declare-const x Real)",
      "(declare-const y Real)",
      "(declare-const z Real)",
      "(assert (<= x y))",
      "(assert (>= x 0))",
      "(assert (<= y z))",
      "(assert (<= z 5))",
      "(check-sat-using (then fm smt))",
    ];
    const lia2pb = [
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(assert (and (<= 0 x) (<= x 5) (<= 0 y) (<= y 3)))",
      "(assert (= (+ x y) 7))",
      "(check-sat-using (then lia2pb smt))",
    ];
    const normalizeBounds = [
      "(declare-const x Int)",
      "(declare-const y Int)",
      "(assert (and (<= 3 x) (<= x 9) (<= 2 y)))",
      "(assert (<= (+ x y) 12))",
      "(check-sat-using (then normalize-bounds smt))",
    ];
    const purifyArith = [
      "(declare-const x Real)",
      "(declare-const y Real)",
      "(assert (> (/ x y) 1))",
      "(check-sat-using (then purify-arith smt))",
    ];
    const reduceArgs = [
      "(declare-fun f (Int Int) Int)",
      "(declare-const x Int)",
      "(assert (> (f x 1) (f x 2)))",
      "(check-sat-using (then reduce-args smt))",
    ];
    const ackermannize = [
      "(declare-fun f ((_ BitVec 4)) (_ BitVec 4))",
      "(declare-const a (_ BitVec 4))",
      "(declare-const b (_ BitVec 4))",
      "(assert (not (= (f a) (f b))))",
      "(check-sat-using (then ackermannize_bv bit-blast sat))",
    ];
    const getRlimit = (lines: string[]) =>
      run(["(set-option :produce-models false)", ...lines, "(get-info :rlimit)"]);
    expect(getRlimit(fm)).toEqual(["sat", "(:rlimit 33)"]);
    expect(getRlimit(lia2pb)).toEqual(["sat", "(:rlimit 519)"]);
    expect(getRlimit(normalizeBounds)).toEqual(["sat", "(:rlimit 145)"]);
    expect(getRlimit(purifyArith)).toEqual(["sat", "(:rlimit 392)"]);
    expect(getRlimit(reduceArgs)).toEqual(["sat", "(:rlimit 102)"]);
    expect(getRlimit(ackermannize)).toEqual(["sat", "(:rlimit 159)"]);
  });

  it("walks each formula that is not a constraint with the pb2bv rewriter in pb2bv", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (or p q))",
        "(assert (not p))",
        "(check-sat-using (then pb2bv sat))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 24)"]);
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (<= (+ x (* 2 y)) 3))",
        "(check-sat-using qflia)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 92)"]);
  });

  it("completes the models of nlsat and nlqsat with false, as a model rather than a proto_model does", () => {
    const bools = ["(declare-const b0 Bool)", "(declare-const b1 Bool)", "(declare-const b2 Bool)"];
    const bindings =
      "  (define-fun b0 () Bool\n    false)\n  (define-fun b1 () Bool\n    false)\n  (define-fun b2 () Bool\n    false)\n";
    expect(
      run([
        "(declare-const x Real)",
        ...bools,
        "(assert (= (* x x) 4.0))",
        "(check-sat-using nlsat)",
        "(get-model)",
        "(reset)",
        "(declare-const x Real)",
        ...bools,
        "(assert (exists ((z Real)) (and (> z 0.0) (= (* z x) 1.0))))",
        "(check-sat-using nlqsat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      `(\n  (define-fun x () Real\n    (- 2.0))\n${bindings})`,
      "sat",
      `(\n  (define-fun x () Real\n    1.0)\n${bindings})`,
    ]);
  });

  it("rejects uninterpreted sorts in qsat with a default_exception, which apply reports as an error", () => {
    expect(
      run([
        "(declare-sort S 0)",
        "(declare-fun a () S)",
        "(assert (exists ((x S)) (not (= x a))))",
        "(check-sat-using qsat)",
        "(get-info :reason-unknown)",
        "(apply qsat)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "qsat does not apply to uninterpreted sorts")',
      '(error "line 6 column 11: qsat does not apply to uninterpreted sorts")',
    ]);
  });
});

describe("hoist_ite, as Z3 5.3.2 simplifies", () => {
  it("moves the summands every branch shares out of an if-then-else", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(declare-const w Int)",
        "(declare-const c Bool)",
        "(declare-const d Bool)",
        "(assert (= w (+ (ite c (+ x y w) (ite d (+ y x z) (+ w y x 3))) 1)))",
        "(assert (> (+ (ite c (+ x y z w) (+ z w y x 1)) (ite d (+ x 2) (+ x 4)) w) 0))",
        "(apply (using-params simplify :hoist_ite true))",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (let ((a!1 (+ 1 (ite c w (ite d z (+ 3 w))) y x)))\n    (= w a!1))\n  (not (<= (+ (ite c 0 1) z y (* 2 w) (* 2 x) (ite d 2 4)) 0))\n  :precision precise :depth 1)\n)",
    ]);
  });
});

describe("arith_lhs and arith_ineq_lhs, as Z3 5.3.2 simplifies", () => {
  it("reads arith_lhs and arith_ineq_lhs as two parameters", () => {
    expect(
      run([
        "(declare-const y0 Real)",
        "(declare-const y2 Real)",
        "(declare-const n Int)",
        "(declare-const m Int)",
        "(simplify (= y0 y2) :arith_lhs true)",
        "(simplify (* y2 y0) :arith_lhs true)",
        "(simplify (+ y2 y0 (* 3.0 y2 y0)) :arith_ineq_lhs true)",
        "(simplify (= (- 0 n m) 4) :arith_ineq_lhs true)",
        "(simplify (= (- 0 n m) 4))",
      ]),
    ).toEqual([
      "(= (+ y0 (* (- 1.0) y2)) 0.0)",
      "(* y0 y2)",
      "(+ y2 y0 (* 3.0 y2 y0))",
      "(= (+ n m) (- 4))",
      "(= (+ (* (- 1) n) (* (- 1) m)) 4)",
    ]);
  });
});

describe("theory_pb, as Z3 5.3.2 internalizes it", () => {
  it("gives an argument that another theory owns a proxy", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= (+ (ite (> x 0) 1 0) (ite (> y 0) 1 0)) 1))",
        "(assert (> (+ x y) 4))",
        "(check-sat-using (then lia2card smt))",
        "(get-model)",
      ]),
    ).toEqual(["sat", "(\n  (define-fun y () Int\n    5)\n  (define-fun x () Int\n    0)\n)"]);
  });
});

describe("qffd, as Z3 5.3.2 stops its finite-domain solver", () => {
  const goal = [
    "(declare-const p Bool)",
    "(declare-const q Bool)",
    "(declare-const r Bool)",
    "(assert (not (and (or p q) (=> q r) (= p r))))",
  ];

  it("fails with canceled once the limit stops the preprocessing or the search of the SAT solver", () => {
    expect(
      run([
        ...goal,
        "(set-option :rlimit 100)",
        "(check-sat-using qffd)",
        "(get-info :reason-unknown)",
        "(set-option :rlimit 155)",
        "(check-sat-using qffd)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
    ]);
  });

  it("counts the steps of its simplifiers and leaves the SAT solver empty when the limit stops them", () => {
    expect(
      run([
        ...goal,
        "(set-option :rlimit 1)",
        "(check-sat-using qffd)",
        "(get-info :reason-unknown)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(set-option :rlimit 166)",
        "(check-sat-using qffd)",
        "(get-info :reason-unknown)",
        "(set-option :rlimit 167)",
        "(check-sat-using qffd)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
      "unknown",
      '(:reason-unknown "canceled")',
      "sat",
    ]);
  });

  it("converts the model of its SAT solver within the limit of the tactic", () => {
    expect(
      run([
        "(declare-datatypes ((C 0)) (((red) (green) (blue))))",
        "(declare-const c C)",
        "(declare-const d C)",
        "(declare-const p Bool)",
        "(assert (distinct c d))",
        "(assert (or p (not (= c red))))",
        "(assert (=> p (= d green)))",
        "(set-option :rlimit 280)",
        "(check-sat-using qffd)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", '(:reason-unknown "max. resource limit exceeded")']);
  });

  it("frees the model of the finite-domain solver at its next check", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p1 Bool)",
        "(declare-const b0 (_ BitVec 4))",
        "(declare-const b1 (_ BitVec 4))",
        "(declare-const b2 (_ BitVec 4))",
        "(assert (bvult (bvsub b1 (bvadd b1 (_ bv4 4))) b2))",
        "(assert (or (=> (bvule b1 b0) (bvult (bvadd b0 (bvadd b2 b0)) b2)) (not (= (bvand b2 b2) b1))))",
        "(assert (distinct (bvor (bvsub b0 (_ bv5 4)) b0) (bvsub b1 (_ bv4 4))))",
        "(check-sat)",
        "(get-model)",
        "(assert (bvule b2 (bvmul (_ bv6 4) b0)))",
        "(check-sat-assuming (p1))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun b2 () (_ BitVec 4)",
        "    #xe)",
        "  (define-fun b0 () (_ BitVec 4)",
        "    #xd)",
        "  (define-fun b1 () (_ BitVec 4)",
        "    #xb)",
        "  (define-fun p1 () Bool",
        "    false)",
        ")",
      ].join("\n"),
      "sat",
      [
        "(",
        "  (define-fun p1 () Bool",
        "    true)",
        "  (define-fun b2 () (_ BitVec 4)",
        "    #xe)",
        "  (define-fun b0 () (_ BitVec 4)",
        "    #xd)",
        "  (define-fun b1 () (_ BitVec 4)",
        "    #xb)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the model of the finite-domain solver at a check that follows get-model", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p1 Bool)",
        "(declare-const b0 (_ BitVec 4))",
        "(declare-const b1 (_ BitVec 4))",
        "(declare-const b2 (_ BitVec 4))",
        "(assert (or (=> (bvule b1 b0) (bvult (bvadd (bvadd b2 b0) (bvadd b2 b0)) b2)) (= b2 (bvmul (_ bv8 4) b1))))",
        "(assert (distinct (bvsub b0 (_ bv5 4)) (bvsub b1 (_ bv4 4))))",
        "(check-sat)",
        "(get-model)",
        "(check-sat)",
        "(assert (bvule b2 (bvmul (_ bv6 4) b0)))",
        "(check-sat-assuming (p1))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun b2 () (_ BitVec 4)",
        "    #x7)",
        "  (define-fun b1 () (_ BitVec 4)",
        "    #xf)",
        "  (define-fun b0 () (_ BitVec 4)",
        "    #xc)",
        "  (define-fun p1 () Bool",
        "    false)",
        ")",
      ].join("\n"),
      "sat",
      "sat",
      [
        "(",
        "  (define-fun p1 () Bool",
        "    true)",
        "  (define-fun b2 () (_ BitVec 4)",
        "    #x2)",
        "  (define-fun b1 () (_ BitVec 4)",
        "    #xf)",
        "  (define-fun b0 () (_ BitVec 4)",
        "    #xd)",
        ")",
      ].join("\n"),
    ]);
  });

  it("keeps the preprocessed goal of the SAT solver and the terms it cached until its next check", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p1 Bool)",
        "(declare-const b0 (_ BitVec 4))",
        "(declare-const b1 (_ BitVec 4))",
        "(declare-const b2 (_ BitVec 4))",
        "(assert (bvult (bvsub b1 (bvadd b1 (_ bv4 4))) b2))",
        "(assert (or (=> (bvule b1 b0) (bvult (bvadd b0 (bvadd b2 b0)) b2)) (not (= (bvand b2 b2) b1))))",
        "(assert (distinct (bvor (bvsub b0 (_ bv5 4)) b0) (bvsub b1 (_ bv4 4))))",
        "(check-sat)",
        "(check-sat-assuming (p1 (bvule b2 (bvmul (_ bv6 4) b0))))",
        "(check-sat-assuming ((bvule b2 (bvmul (_ bv6 4) b1))))",
        "(get-value (b1))",
      ]),
    ).toEqual(["sat", "sat", "sat", "((b1 #x5))"]);
  });

  // Deviation from Z3: Z3 5.3.2 crashes at the second check.
  it("raises once for a datatype whose declaration failed and keeps the reason of its SAT solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-datatypes ((C 0)) ((k0)(k1)))",
        "(declare-const e0 C)",
        "(declare-const e1 C)",
        "(assert (= e0 e1))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      '(error "line 2 column 32: invalid datatype declaration, too many data-type bodies defined")',
      "unknown",
      '(:reason-unknown "no reason given")',
      "(:rlimit 12)",
      "unknown",
      '(:reason-unknown "(sat.giveup interpreted functions sent to SAT solver (declare-fun = (C C) Bool)\n)")',
    ]);
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-datatypes ((C 0)) ((k0)(k1)))",
        "(declare-const e0 C)",
        "(declare-const e1 C)",
        "(declare-const p Bool)",
        "(assert (= e0 e1))",
        "(push 1)",
        "(assert (or p ((_ is k1) e1)))",
      ]),
    ).toEqual([
      '(error "line 2 column 32: invalid datatype declaration, too many data-type bodies defined")',
      '(error "line 7 column 7: datatype constructors have not been created")',
      '(error "line 8 column 27: invalid datatype recognizer, unknown constructor k1")',
    ]);
  });

  it("answers check-sat of QF_FD with the finite-domain solver and the reason of its SAT solver", () => {
    expect(
      [1, 64, 193, 262, 280].map((rlimit) =>
        run([
          "(set-logic QF_FD)",
          "(declare-datatypes ((C 0)) (((red) (green) (blue))))",
          "(declare-const c C)",
          "(declare-const d C)",
          "(declare-const p Bool)",
          "(assert (distinct c d))",
          "(assert (or p (not (= c red))))",
          "(assert (=> p (= d green)))",
          `(set-option :rlimit ${rlimit})`,
          "(check-sat)",
          "(get-info :reason-unknown)",
        ]),
      ),
    ).toEqual([
      ["unknown", '(:reason-unknown "sat.canceled")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
      ["unknown", '(:reason-unknown "no reason given")'],
      ["unknown", '(:reason-unknown "sat.canceled")'],
      ["sat", '(:reason-unknown "no reason given")'],
    ]);
  });

  it("counts no steps of the simplifiers of QF_FD without assertions", () => {
    expect(run(["(set-logic QF_FD)", "(check-sat)", "(get-info :rlimit)"])).toEqual([
      "sat",
      "(:rlimit 4)",
    ]);
  });

  it("has no model after check-sat of QF_FD answers unknown", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(assert (and (<= 0 x) (<= x 5)))",
        "(assert (or p (> x 2)))",
        "(set-option :rlimit 5)",
        "(check-sat)",
        "(get-model)",
        "(set-option :rlimit 0)",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "unknown",
      '(error "line 8 column 10: model is not available")',
      "sat",
      "(\n  (define-fun p () Bool\n    true)\n  (define-fun x () Int\n    0)\n)",
    ]);
  });

  it("replaces the bounded integers without counting steps, as expr_safe_replace does", () => {
    expect(
      [253, 254].map((rlimit) =>
        run([
          "(set-logic QF_FD)",
          "(declare-const x Int)",
          "(declare-const y Int)",
          "(assert (<= 0 x))",
          "(assert (<= x 5))",
          "(assert (<= 1 y))",
          "(assert (<= y 6))",
          "(assert (= (+ x y) 7))",
          "(assert (distinct x y))",
          `(set-option :rlimit ${rlimit})`,
          "(check-sat)",
          "(get-info :reason-unknown)",
        ]),
      ),
    ).toEqual([
      ["unknown", '(:reason-unknown "sat.canceled")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
    ]);
  });

  it("keeps the formulas of QF_FD as asserted and flattens them after each simplifier", () => {
    expect(
      [255, 256].map((rlimit) =>
        run([
          "(set-logic QF_FD)",
          "(declare-const x Int)",
          "(declare-const y Int)",
          "(assert (<= 0 x 5))",
          "(assert (<= 1 y 6))",
          "(assert (= (+ x y) 7))",
          "(assert (distinct x y))",
          `(set-option :rlimit ${rlimit})`,
          "(check-sat)",
          "(get-info :reason-unknown)",
        ]),
      ),
    ).toEqual([
      ["unknown", '(:reason-unknown "sat.canceled")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
    ]);
  });

  it("keeps one finite-domain solver across the checks and scopes of QF_FD", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(assert (or a b))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 23)", "sat", "(:rlimit 33)"]);
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :produce-models true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (and (<= 0 x) (<= x 5) (<= 2 y) (<= y 9)))",
        "(assert (< x y))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
        "(push 1)",
        "(assert (= x 4))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
        "(pop 1)",
        "(assert (> y 7))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(\n  (define-fun y () Int\n    9)\n  (define-fun x () Int\n    0)\n)",
        "(:rlimit 688)",
        "sat",
        "(\n  (define-fun y () Int\n    9)\n  (define-fun x () Int\n    4)\n)",
        "(:rlimit 771)",
        "sat",
        "(\n  (define-fun y () Int\n    9)\n  (define-fun x () Int\n    4)\n)",
        "(:rlimit 1010)",
      ].join("\n"),
    );
  });

  it("checks the assumptions of QF_FD with the finite-domain solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :produce-models true)",
        "(declare-datatypes ((C 0)) (((red) (green) (blue))))",
        "(declare-const c C)",
        "(declare-const d C)",
        "(declare-const p Bool)",
        "(assert (not (= c d)))",
        "(check-sat)",
        "(get-model)",
        "(push 1)",
        "(assert (= c blue))",
        "(check-sat-assuming (p))",
        "(get-model)",
        "(pop 1)",
        "(check-sat-assuming ((not p)))",
        "(get-model)",
        "(get-info :rlimit)",
      ]).join("\n"),
    ).toBe(
      [
        "sat",
        "(\n  (define-fun c () C\n    blue)\n  (define-fun d () C\n    green)\n  (define-fun p () Bool\n    false)\n)",
        "sat",
        "(\n  (define-fun p () Bool\n    true)\n  (define-fun c () C\n    blue)\n  (define-fun d () C\n    green)\n)",
        "sat",
        "(\n  (define-fun p () Bool\n    false)\n  (define-fun c () C\n    blue)\n  (define-fun d () C\n    green)\n)",
        "(:rlimit 342)",
      ].join("\n"),
    );
  });

  it("converts the model of QF_FD when it is first asked for", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (and (<= 0 x) (<= x 5) (<= 2 y) (<= y 9)))",
        "(assert (< x y))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-value (x))",
        "(get-info :rlimit)",
        "(get-value (x))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 680)", "((x 0))", "(:rlimit 689)", "((x 0))", "(:rlimit 690)"]);
  });

  it("counts the steps of a QF_FD check that gives up", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const p Bool)",
        "(declare-fun f (Bool) Bool)",
        "(assert (= (f p) (f (not p))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(push 1)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(pop 1)",
      ]),
    ).toEqual(["unknown", "(:rlimit 93)", "unknown", "(:rlimit 97)"]);
  });

  it("keeps a named formula of QF_FD that reads a constant the simplifiers define", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(assert (and (<= 0 x) (<= x 3)))",
        "(check-sat)",
        "(assert (! (= x 7) :named n))",
        "(check-sat)",
        "(get-unsat-core)",
      ]),
    ).toEqual(["sat", "unsat", "(n)"]);
  });

  it("numbers the declarations without the one Z3 makes as it starts the smt solver", () => {
    const getModel = (options: string[]) =>
      run([
        ...options,
        "(declare-datatypes ((C 0)) (((k0) (k1) (k2) (k3) (k4) (k5) (k6))))",
        "(declare-datatypes ((D 0)) (((d0) (d1) (d2) (d3) (d4) (d5) (d6) (d7) (d8))))",
        "(declare-const e0 C)",
        "(declare-const e1 D)",
        "(check-sat)",
        "(get-model)",
      ]);
    const getExpected = (first: string, second: string) => [
      "sat",
      [
        "(",
        "  (define-fun e0 () C",
        `    ${first})`,
        "  (define-fun e1 () D",
        `    ${second})`,
        ")",
      ].join("\n"),
    ];
    expect(getModel(["(set-logic QF_FD)"])).toEqual(getExpected("k5", "d2"));
    expect(getModel(["(set-logic QF_DT)"])).toEqual(getExpected("k1", "d5"));
    expect(getModel(["(set-option :parallel.enable true)", "(set-logic QF_FD)"])).toEqual(
      getExpected("k1", "d5"),
    );
  });

  it("keeps the 1-bit zero Z3 makes as it starts the smt solver", () => {
    expect(
      run([
        "(declare-const x (_ BitVec 1))",
        "(assert (= x #b0))",
        "(check-sat-using smt)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 50)"]);
  });

  it("makes a declared sort at its first use, as psort_user_decl does", () => {
    const getModel = (before: string[], between: string[]) =>
      run([
        "(set-logic QF_FD)",
        "(declare-sort U 0)",
        ...before,
        "(declare-datatypes ((C 0)) (((k0) (k1) (k2) (k3) (k4) (k5) (k6))))",
        ...between,
        "(declare-datatypes ((D 0)) (((d0) (d1) (d2) (d3) (d4) (d5) (d6) (d7) (d8))))",
        "(declare-const e0 C)",
        "(declare-const e1 D)",
        "(check-sat)",
        "(get-model)",
      ]);
    const getExpected = (first: string, second: string, isUsed: boolean) => [
      "sat",
      [
        "(",
        ...(isUsed ? ["  (define-fun u () U", "    U!val!0)"] : []),
        "  (define-fun e0 () C",
        `    ${first})`,
        "  (define-fun e1 () D",
        `    ${second})`,
        ")",
      ].join("\n"),
    ];
    expect(getModel([], [])).toEqual(getExpected("k5", "d2", false));
    expect(getModel(["(declare-const u U)"], [])).toEqual(getExpected("k4", "d8", true));
    expect(getModel([], ["(declare-const u U)"])).toEqual(getExpected("k5", "d8", true));
  });
});

describe("eq2bv, as Z3 5.3.2 encodes the bounded integers", () => {
  // Deviation from Z3: Z3 5.3.2 reads the dependencies of the bounds after it frees them, and crashes.
  it("asserts the bounds of each bit-vector with the dependencies of the integer bounds", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(assert (! (>= x 0) :named a1))",
        "(assert (! (<= x 3) :named a2))",
        "(assert (! (or (= x 1) (= x 2) (= x 5)) :named a3))",
        "(assert (! (=> p (= x 3)) :named a4))",
        "(assert (! (not (= x 1)) :named a5))",
        "(assert (! (not (= x 2)) :named a6))",
        "(check-sat-using (then eq2bv simplify bit-blast sat))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(a6 a3 a2 a5)"]);
  });

  it("names the bit-vector of each integer in the order of its hash table", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (>= x 0))",
        "(assert (<= x 3))",
        "(assert (or (= x 1) (= x 2) (= x 5)))",
        "(assert (=> p (= x 3)))",
        "(assert (or (= y 0) (= y 4)))",
        "(assert (<= y 7))",
        "(assert (>= y 0))",
        "(apply eq2bv)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  true",
        "  true",
        "  (or (= z!1 #b001) (= z!1 #b010) (= z!1 #b101))",
        "  (=> p (= z!1 #b011))",
        "  (or (= z!0 #b000) (= z!0 #b100))",
        "  true",
        "  true",
        "  (bvule #b000 z!0)",
        "  (bvule z!0 #b100)",
        "  (bvule #b001 z!1)",
        "  (bvule z!1 #b011)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });
});

describe("the goals of a tactic free what Z3 5.3.2 frees", () => {
  it("frees the model converter of apply's goal, so the next bit-blast numbers its bits anew", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const v0 (_ BitVec 2))",
        "(declare-const v1 (_ BitVec 2))",
        "(assert (bvult (bvmul v0 v1) #b10))",
        "(assert (bvuge (bvadd v1 #b01) v0))",
        "(apply bit-blast :print false)",
        "(apply (then simplify bit-blast))",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (let ((a!1 (ite k!4",
        "                  (ite k!5 (not (= k!7 k!6)) k!7)",
        "                  (not (or (not k!5) (not k!6))))))",
        "    (not a!1))",
        "  (let ((a!1 (or k!5 (not (or (not k!4) (not k!6)))))",
        "        (a!2 (or (not (or (not k!4) (not k!6))) (= k!7 k!6))))",
        "    (or (not (or k!5 (= k!7 k!6))) (not a!1) (not a!2)))",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the goal that repeat copies when its tactic fails", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const v0 (_ BitVec 2))",
        "(declare-const v1 (_ BitVec 2))",
        "(assert (bvult (bvmul v0 v1) #b10))",
        "(assert (bvuge (bvadd v1 #b01) v0))",
        "(apply (then bit-blast (or-else (repeat fail) skip)) :print false)",
        "(apply (then simplify bit-blast))",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (let ((a!1 (ite k!4",
        "                  (ite k!5 (not (= k!7 k!6)) k!7)",
        "                  (not (or (not k!5) (not k!6))))))",
        "    (not a!1))",
        "  (let ((a!1 (or k!5 (not (or (not k!4) (not k!6)))))",
        "        (a!2 (or (not (or (not k!4) (not k!6))) (= k!7 k!6))))",
        "    (or (not (or k!5 (= k!7 k!6))) (not a!1) (not a!2)))",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the children of or-else first to last", () => {
    expect(
      run([
        "(declare-const y Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(push)",
        "(assert (forall ((x Int)) (> (+ x 0 y) (* 1 a))))",
        "(assert (and (<= 0 a) (<= a 1) (<= 0 b) (<= b 1) (> (+ a b (* 0 y)) 0)))",
        "(apply (or-else (then simplify elim-uncnstr fail) (then simplify lia2card fail) skip) :print false)",
        "(pop)",
        "(declare-const v0 (_ BitVec 3))",
        "(declare-const v1 (_ BitVec 3))",
        "(assert (bvult (bvmul v0 v1) #b010))",
        "(assert (bvuge (bvadd v1 #b001) v0))",
        "(apply (then simplify bit-blast))",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (let ((a!1 (= (or (not k!2) (not k!6) (not k!3) (not k!5))",
        "                (= (or (not k!3) (not k!6)) (or (not k!2) (not k!7))))))",
        "    (= a!1 (or (not k!4) (not k!5))))",
        "  (let ((a!1 (not (= k!7 (or (not k!5) (not k!6)))))",
        "        (a!2 (or k!3 (not (or (not k!2) (not k!5)))))",
        "        (a!3 (or (not (or (not k!2) (not k!5))) (= k!6 k!5))))",
        "  (let ((a!4 (or (not (or k!3 (= k!6 k!5))) (not a!2) (not a!3))))",
        "    (or (not (or k!4 a!1)) (not (or k!4 (not a!4))) (not (or a!1 (not a!4))))))",
        "  (let ((a!1 (ite k!2",
        "                  (ite k!3 (not (= k!6 k!5)) k!6)",
        "                  (not (or (not k!3) (not k!5))))))",
        "    (not a!1))",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the atoms of the sat tactic, so a second check of QF_BV does Z3's work", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const v0 (_ BitVec 8))",
        "(declare-const v1 (_ BitVec 8))",
        "(assert (bvsge v1 (bvor v0 v0)))",
        "(assert (= (bvor (bvurem v1 (_ bv159 8)) (bvurem v1 v1)) (bvadd (_ bv94 8) v0)))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 7583)", "sat", "(:rlimit 14970)"]);
  });

  it("frees the model that a model converter replaces, so the next check does Z3's work", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(set-option :produce-models true)",
        "(declare-const v0 (_ BitVec 6))",
        "(declare-const v1 (_ BitVec 6))",
        "(declare-const p0 Bool)",
        "(declare-const p1 Bool)",
        "(declare-const p2 Bool)",
        "(assert (=> (bvult (bvurem (_ bv38 6) (bvshl v1 (_ bv17 6))) (bvshl v0 v0)) (not p1)))",
        "(assert (distinct (_ bv21 6) (_ bv22 6)))",
        "(get-info :rlimit)",
        "(check-sat)",
        "(assert (bvult v0 (_ bv14 6)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 0)", "sat", "sat", "(:rlimit 610)"]);
  });

  it("frees the model of the last check before the next check starts, as cmd_context does", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const v0 (_ BitVec 8))",
        "(declare-const v1 (_ BitVec 8))",
        "(declare-const p0 Bool)",
        "(assert (bvsge v1 (bvor v0 v0)))",
        "(assert (=> (not p0) (bvule (bvxor (bvlshr v1 (_ bv160 8)) (bvsub (_ bv157 8) v1)) v0)))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 1412)", "sat", "(:rlimit 2838)"]);
  });

  it("keeps the formulas of the goal of an unknown check until the next one, as tactic2solver does", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then simplify tseitin-cnf)")',
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(assert (or (and a b) (and (not a) c) (and b (not c))))",
        "(check-sat)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or (and p q) (and (not p) r) (and q (not r))))",
        "(apply tseitin-cnf)",
      ]),
    ).toEqual([
      "unknown",
      [
        "(goals",
        "(goal",
        "  (or b (not a) (not c))",
        "  (or b (not a))",
        "  (or a b c)",
        "  (or b c)",
        "  (or q (not p) (not r))",
        "  (or q (not p))",
        "  (or p q r)",
        "  (or q r)",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the kernel of the smt tactic as the tactic returns, so the next check does Z3's work", () => {
    expect(
      run([
        "(declare-const x0 Int)",
        "(declare-const x1 Int)",
        "(declare-const x3 Int)",
        "(declare-fun f (Int) Int)",
        "(assert (or (< (- 7 (f 5) (f 7)) (f x0)) (<= x3 (- x1 5))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(assert (= 24 (* 8 x1)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 298)", "sat", "(:rlimit 485)"]);
  });

  it("frees the propagated atoms of the kernel's assertions after the rest of the kernel", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (<= (+ (* 4 y) (* 1 z) x) (+ (* 3 y) z (* 3 x))))",
        "(assert (distinct (+ z y x) -4))",
        "(assert (not (< (+ z y) 2)))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(declare-const u Int)",
        "(declare-const v Int)",
        "(declare-const w Int)",
        "(assert (= (+ x z w 7) -4))",
        "(assert (= (+ v x 0) 1))",
        "(assert (<= (+ u (* 3 w) 5) (+ w 3)))",
        "(assert (>= (+ x w (* 4 z)) (+ (* 2 x) v (* 1 w) 0)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 408)", "sat", "(:rlimit 882)"]);
  });

  it("frees the terms the kernel of the smt tactic makes, so QF_FD numbers the next ones", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> (+ x y) 3))",
        "(assert (< (* 2 x) y))",
        "(check-sat-using smt)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or (and p q) (and (not p) r) (and q (not r))))",
        "(apply tseitin-cnf)",
      ]),
    ).toEqual([
      "sat",
      [
        "(goals",
        "(goal",
        "  (not (<= (+ x y) 3))",
        "  (not (<= y (* 2 x)))",
        "  (or r p q)",
        "  (or (not p) q)",
        "  (or (not p) (not r) q)",
        "  (or r q)",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });

  it("frees the values of the proto model with the kernel of the smt tactic", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const a (_ BitVec 4))",
        "(declare-const b (_ BitVec 4))",
        "(assert (bvult a b))",
        "(assert (= (bvadd a b) #x9))",
        "(check-sat-using smt)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or (and p q) (and (not p) r) (and q (not r))))",
        "(apply tseitin-cnf)",
      ]),
    ).toEqual([
      "sat",
      [
        "(goals",
        "(goal",
        "  (not (bvule b a))",
        "  (= a (bvadd #x9 (bvmul #xf b)))",
        "  (or r p q)",
        "  (or (not p) q (not r))",
        "  (or (not p) q)",
        "  (or r q)",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
    ]);
  });
});

describe("tactic2solver, as Z3 5.3.2 keeps its tactic", () => {
  it("keeps the cache of lia2card's rewriter across the checks", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then lia2card smt)")',
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (> (+ a b) 5))",
        "(assert (< (- a b) 3))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 191)", "sat", "(:rlimit 357)"]);
  });

  it("forgets the sorts dt2bv saw in an earlier check", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then dt2bv smt)")',
        "(declare-datatypes ((C 0)) (((r) (g) (b))))",
        "(declare-fun f (C) Int)",
        "(declare-const x C)",
        "(declare-const y Real)",
        "(assert (= (^ 2.0 y) 3.0))",
        "(assert (not (= x r)))",
        "(push)",
        "(assert (= (f x) 1))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(pop)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 567)", "unknown", "(:rlimit 1053)"]);
  });

  it("frees and-then's subgoals when a branch fails", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then split-clause dt2bv smt)")',
        "(declare-datatypes ((C 0)) (((r) (g) (b))))",
        "(declare-const x C)",
        "(declare-const q Real)",
        "(assert (= (^ 2.0 q) 3.0))",
        "(assert (or (= x b) true))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 344)", "unknown", "(:rlimit 686)"]);
  });

  it("frees and-then's one new subgoal when the second tactic returns or fails", () => {
    const getClauses = (tactic: string) =>
      run([
        "(declare-fun f ((_ BitVec 4)) (_ BitVec 4))",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(assert (bvult (f (f x)) (f y)))",
        "(assert (or (= x y) (= (f x) #x2)))",
        `(apply ${tactic})`,
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(assert (or (and p q) (and (not p) r) (and q (not r))))",
        "(apply tseitin-cnf)",
      ])
        .join("\n")
        .split("\n")
        .slice(-8, -2);
    expect(getClauses("(then ackermannize_bv ackermannize_bv)")).toEqual([
      "  (not (bvule (f y) (f (f x))))",
      "  (or (= x y) (= (f x) #x2))",
      "  (or p q r)",
      "  (or q (not p) (not r))",
      "  (or q (not p))",
      "  (or q r)",
    ]);
    expect(getClauses("(then ackermannize_bv fail)")).toEqual([
      "  (not (bvule (f y) (f (f x))))",
      "  (or (= x y) (= (f x) #x2))",
      "  (or p q r)",
      "  (or q (not p) (not r))",
      "  (or q (not p))",
      "  (or q r)",
    ]);
  });

  it("reads tactic.default_tactic as it makes the solver", () => {
    expect(
      run([
        "(declare-const a Int)",
        '(set-option :tactic.default_tactic "(then fail smt)")',
        "(assert (> a 5))",
        "(check-sat)",
        "(reset-assertions)",
        "(assert (> a 5))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["sat", "unknown", '(:reason-unknown "fail tactic")']);
  });

  it("reads the sat parameters as each check runs its tactic", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then simplify sat)")',
        "(declare-const a Bool)",
        "(declare-const b Bool)",
        "(declare-const c Bool)",
        "(assert (or a b))",
        "(assert (or a (not b)))",
        "(assert (or (not a) c))",
        "(assert (or (not a) (not c)))",
        "(check-sat)",
        "(set-option :sat.max_conflicts 0)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "unknown", '(:reason-unknown "no reason given")', "(:rlimit 87)"]);
  });

  it("reads tactic.default_tactic as one s-expression", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(fail-if true)")',
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      '(error "line 1 column 10: invalid probe, unknown builtin probe true")',
      "(:rlimit 0)",
    ]);
  });

  it("builds tactic.default_tactic as it makes the solver", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(fail-if true)")',
        "(declare-const q Real)",
        "(assert (> q 0.0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      '(error "line 1 column 10: invalid probe, unknown builtin probe true")',
      '(error "line 3 column 11: unknown constant q")',
      "unknown",
      "(:rlimit 0)",
    ]);
  });

  it("reports the parse errors of tactic.default_tactic under an empty file name", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(then smt")',
        "(declare-const q Real)",
        "(assert (> q 0.0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      '(error ": line 1 column 10: invalid s-expression, unexpected end of file")',
      "sat",
      "(:rlimit 69)",
    ]);
  });

  it("parses tactic.default_tactic as a user's tactic, without the lazy combinator", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "(lazy smt)")',
        "(declare-const q Real)",
        "(assert (> q 0.0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      '(error "line 1 column 10: invalid tactic, unknown tactic combinator lazy")',
      '(error "line 3 column 11: unknown constant q")',
      "unknown",
      "(:rlimit 0)",
    ]);
  });

  it("ignores an empty tactic.default_tactic", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic "")',
        "(declare-const q Real)",
        "(assert (> q 0.0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 69)"]);
  });

  it("reports a closing parenthesis that starts tactic.default_tactic", () => {
    expect(
      run([
        '(set-option :tactic.default_tactic ")")',
        "(declare-const q Real)",
        "(assert (> q 0.0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      `(error ": line 1 column 1: invalid s-expression, unexpected ')'")`,
      "sat",
      "(:rlimit 69)",
    ]);
  });
});

describe("the default tactic, as Z3 5.3.2 builds it", () => {
  it("refuses the core of a lazy tactic, whose dependencies it can't know", () => {
    expect(() =>
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (! (or p q) :named a1))",
        "(assert (! (not p) :named a2))",
        "(assert (! (not q) :named a3))",
        "(check-sat-using default)",
        "(get-unsat-core)",
      ]),
    ).toThrow(SmtUnsupportedError);
  });

  it("takes the parameters of the smt tactic its finite-field branch runs", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 0))",
        "(check-sat-using (using-params default :random_seed 3))",
      ]),
    ).toEqual(["sat"]);
  });
});
