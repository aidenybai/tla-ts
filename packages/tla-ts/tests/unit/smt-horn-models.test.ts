import { describe, expect, it } from "vite-plus/test";
import { AstManager, SORT_INT } from "../../src/prover/smt/solver/ast";
import { sortByAstLt } from "../../src/prover/smt/solver/muz/spacer-util";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 60000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

// The expected outputs are Z3 5.3.2's. spacer.use_iuc is off where Z3's lemma is an interpolant,
// which the port's subset cores do not produce.
describe("the model of a Horn goal", () => {
  it("is the invariant spacer found", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-fun inv (Int) Bool)",
        "(assert (forall ((x Int)) (=> (= x 0) (inv x))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (inv x) (< x 10) (= y (+ x 1))) (inv y))))",
        "(assert (forall ((x Int)) (=> (and (inv x) (> x 10)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual(["sat", "(", "  (define-fun inv ((x!0 Int)) Bool", "    (<= x!0 10))", ")"]);
  });

  it("defines the predicates the inliner removed", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun q (Int) Bool)",
        "(declare-fun r (Int) Bool)",
        "(assert (forall ((x Int)) (=> (> x 0) (p x))))",
        "(assert (forall ((x Int)) (=> (p x) (q (+ x 1)))))",
        "(assert (forall ((x Int)) (=> (q x) (r (+ x 1)))))",
        "(assert (forall ((x Int)) (=> (and (r x) (< x 0)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun q ((x!0 Int)) Bool",
      "    (let ((a!1 (exists ((x!1 Int))",
      "                 (! (and (not (<= x!1 0)) (= x!0 (+ 1 x!1))) :weight 0))))",
      "      (or (not (<= x!0 1)) a!1)))",
      "  (define-fun r ((x!0 Int)) Bool",
      "    (let ((a!1 (exists ((x!1 Int))",
      "                 (! (and (not (<= x!1 1)) (= x!0 (+ 1 x!1))) :weight 0))))",
      "      (or (not (<= x!0 2)) a!1)))",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (not (<= x!0 0)))",
      ")",
    ]);
  });

  it("defines an inlined predicate over the invariant of its body", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun q (Int Bool) Bool)",
        "(assert (forall ((x Int)) (=> (>= x 0) (p x))))",
        "(assert (forall ((x Int) (b Bool)) (=> (and (p x) (= b (> x 4))) (q x b))))",
        "(assert (forall ((x Int) (b Bool)) (=> (and (q x b) (q (+ x 1) b) b (< x 2)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun q ((x!0 Int) (x!1 Bool)) Bool",
      "    (and (>= x!0 0) (not (= (<= x!0 4) x!1))))",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (>= x!0 0))",
      ")",
    ]);
  });

  it("defines the predicates the cone of influence removed", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun unused (Int Int) Bool)",
        "(declare-fun dead (Int) Bool)",
        "(assert (forall ((x Int)) (=> (= x 1) (p x))))",
        "(assert (forall ((x Int)) (=> (and (p x) (< x 100)) (p (* 2 x)))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x) (= y x)) (unused x y))))",
        "(assert (forall ((x Int)) (=> (and (dead x) (> x 3)) (dead (+ x 1)))))",
        "(assert (forall ((x Int)) (=> (and (p x) (<= x 0)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun unused ((x!0 Int) (x!1 Int)) Bool",
      "    true)",
      "  (define-fun dead ((x!0 Int)) Bool",
      "    false)",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (not (<= x!0 0)))",
      ")",
    ]);
  });

  it("defines a predicate the query does not reach by its rules", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(assert (forall ((x Int)) (=> (= x 0) (p x))))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual(["sat", "(", "  (define-fun p ((x!0 Int)) Bool", "    (= x!0 0))", ")"]);
  });

  it("defines a total relation as true", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun t (Int) Bool)",
        "(declare-fun b () Bool)",
        "(assert (forall ((x Int)) (t x)))",
        "(assert (forall ((x Int)) (=> (= x 0) (p x))))",
        "(assert (forall ((x Int)) (=> (and (p x) (t x) (< x 3)) (p (+ x 1)))))",
        "(assert (=> (p 7) b))",
        "(assert (forall ((x Int)) (=> (and (p x) (> x 3)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun b () Bool",
      "    true)",
      "  (define-fun t ((x!0 Int)) Bool",
      "    true)",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (<= x!0 3))",
      ")",
    ]);
  });

  it("gives a sliced predicate its arguments back", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-fun p (Int Int) Bool)",
        "(declare-fun c () Bool)",
        "(assert (forall ((x Int) (y Int)) (=> (= x 0) (p x y))))",
        "(assert (forall ((x Int) (y Int) (z Int)) (=> (and (p x y) (< x 3)) (p (+ x 1) z))))",
        "(assert (forall ((x Int) (y Int)) (=> (and (p x y) (> x 5)) c)))",
        "(assert (=> c false))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun c () Bool",
      "    false)",
      "  (define-fun p ((x!0 Int) (x!1 Int)) Bool",
      "    (<= x!0 5))",
      ")",
    ]);
  });

  it("defines a predicate that lost every constraint to slicing", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-fun p (Int Int) Bool)",
        "(declare-fun s (Int) Bool)",
        "(assert (forall ((x Int) (y Int)) (=> (= x 0) (p x y))))",
        "(assert (forall ((x Int) (y Int) (z Int)) (=> (and (p x y) (< x 3)) (p (+ x 1) z))))",
        "(assert (forall ((x Int)) (=> (> x 0) (s x))))",
        "(assert (forall ((x Int)) (=> (and (s x) (< x 10)) (s (+ x 2)))))",
        "(assert (forall ((x Int) (y Int) (z Int)) (=> (and (p x y) (s z) (> x 5) (< z 0)) false)))",
        "(check-sat)",
        "(get-model)",
        "(eval (p 1 7))",
        "(eval (s 0))",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun p ((x!0 Int) (x!1 Int)) Bool",
      "    true)",
      "  (define-fun s ((x!0 Int)) Bool",
      "    (not (<= x!0 (- 1))))",
      ")",
      "true",
      "true",
    ]);
  });

  it("hides the query of several goals and lists the predicates in table order", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun q (Int) Bool)",
        "(assert (forall ((x Int)) (=> (= x 0) (p x))))",
        "(assert (forall ((x Int)) (=> (and (p x) (< x 5)) (p (+ x 1)))))",
        "(assert (forall ((x Int)) (=> (= x 10) (q x))))",
        "(assert (forall ((x Int)) (=> (and (q x) (> x 7)) (q (- x 1)))))",
        "(assert (forall ((x Int)) (=> (and (p x) (> x 5)) false)))",
        "(assert (forall ((x Int)) (=> (and (q x) (< x 7)) false)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun q ((x!0 Int)) Bool",
      "    (>= x!0 7))",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (<= x!0 5))",
      ")",
    ]);
  });

  it("evaluates a predicate", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun z () Bool)",
        "(assert (=> true z))",
        "(assert (forall ((x Int)) (=> (and z (= x 0)) (p x))))",
        "(assert (forall ((x Int)) (=> (and (p x) (< x 0)) false)))",
        "(check-sat)",
        "(get-model)",
        "(eval (p 0))",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun z () Bool",
      "    true)",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (= x!0 0))",
      ")",
      "true",
    ]);
  });
});

describe("a datatype accessor in a Horn rule", () => {
  it("is interpreted when the datatype has one constructor", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-datatypes ((Pair 0)) (((mk (fst Int) (snd Int)))))",
        "(declare-fun p (Pair) Bool)",
        "(assert (forall ((x Pair)) (=> (= (fst x) 0) (p x))))",
        "(assert (forall ((x Pair)) (=> (and (p x) (> (fst x) 7)) false)))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("is interpreted under the recognizer of its constructor", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-fun p (L) Bool)",
        "(assert (forall ((x L)) (=> (and ((_ is cons) x) (= (hd x) 0)) (p x))))",
        "(assert (forall ((x L)) (=> (and (p x) ((_ is cons) x) (> (hd x) 7)) false)))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("is interpreted in the else branch of the other recognizer", () => {
    expect(
      run([
        "(set-option :fp.spacer.use_iuc false)",
        "(set-logic HORN)",
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-fun p (L) Bool)",
        "(assert (forall ((x L)) (=> (ite ((_ is nil) x) true (= (hd x) 0)) (p x))))",
        "(assert (forall ((x L)) (=> (and (p x) (not ((_ is nil) x)) (> (hd x) 7)) false)))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("is uninterpreted without a recognizer", () => {
    expect(
      run([
        "(set-logic HORN)",
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-fun p (Int) Bool)",
        "(assert (forall ((a Int) (x L)) (=> (and (= a (hd x)) (> a 0)) (p a))))",
        "(assert (forall ((a Int)) (=> (and (p a) (< a 0)) false)))",
        "(check-sat)",
      ]),
    ).toEqual(["unknown"]);
  });
});

describe("the order of a spacer cube", () => {
  it("is by ast id, as under ast_lt_proc", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const olderB = manager.mkApp(manager.mkFuncDecl("b", [], SORT_INT), [], SORT_INT);
    const newerA = manager.mkApp(manager.mkFuncDecl("a", [], SORT_INT), [], SORT_INT);
    expect(sortByAstLt(manager, [newerA, olderB])).toEqual([olderB, newerA]);
  });
});
