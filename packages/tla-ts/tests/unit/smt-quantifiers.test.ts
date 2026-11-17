import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output.join("\n").split("\n");
};

const PREDICATES = ["(declare-fun p (Int Int) Bool)", "(declare-fun q (Int) Bool)"];

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

  it("substitutes a macro's argument into a no-pattern", () => {
    expect(
      run([
        ...PREDICATES,
        "(define-fun h ((a Int)) Bool (forall ((z Int)) (! (p z a) :no-pattern (p z a))))",
        "(simplify (h 3))",
      ]),
    ).toEqual(["(forall ((z Int)) (! (p z 3) :no-pattern (p z 3)))"]);
  });

  it("shifts the no-pattern of a macro argument that moves under a binder", () => {
    expect(
      run([
        ...PREDICATES,
        "(define-fun g ((b Bool)) Bool (forall ((w Int)) (or b (q w))))",
        "(simplify (forall ((y Int)) (g (forall ((z Int)) (! (p z y) :no-pattern (p z y))))))",
      ]),
    ).toEqual([
      "(forall ((y Int) (w Int))",
      "  (or (q w) (forall ((z Int)) (! (p z y) :no-pattern (p z y)))))",
    ]);
  });

  it("shifts the no-pattern of a let binding used under a binder", () => {
    expect(
      run([
        ...PREDICATES,
        "(simplify (forall ((y Int)) (let ((a (forall ((z Int)) (! (p z y) :no-pattern (p z y))))) (forall ((w Int)) (or a (q w))))))",
      ]),
    ).toEqual([
      "(forall ((y Int) (w Int))",
      "  (or (forall ((z Int)) (! (p z y) :no-pattern (p z y))) (q w)))",
    ]);
  });

  it("shifts the no-pattern of a term a beta reduction moves under a binder", () => {
    expect(
      run([
        ...PREDICATES,
        "(simplify (forall ((y Int)) (select (lambda ((b Bool)) (forall ((w Int)) (or b (q w)))) (forall ((z Int)) (! (p z y) :no-pattern (p z y))))))",
      ]),
    ).toEqual([
      "(forall ((y Int) (w Int))",
      "  (or (q w) (forall ((z Int)) (! (p z y) :no-pattern (p z y)))))",
    ]);
  });

  // Z3's enum2bv rewriter reads the no-patterns from a vector it has already shrunk, so it gets
  // the ones the quantifier had before the rewrite.
  it("leaves the no-patterns of a quantifier over an enumeration as they were under dt2bv", () => {
    expect(
      run([
        "(declare-datatypes ((Color 0)) (((red) (green) (blue))))",
        "(declare-fun q (Int) Bool)",
        "(declare-const c Color)",
        "(assert (forall ((x Color) (z Int)) (! (or (q z) (= c x)) :no-pattern (= c x))))",
        "(assert (forall ((z Int)) (! (or (q z) (= c red)) :no-pattern (= c red))))",
        "(assert (exists ((x Color) (z Int)) (! (or (q z) (= c x)) :no-pattern (= c x) :no-pattern (q z) :qid foo)))",
        "(apply dt2bv)",
      ]),
    ).toEqual([
      "(goals",
      "(goal",
      "  (forall ((x (_ BitVec 2)) (z Int))",
      "    (! (=> (bvule x #b10) (or (q z) (= c!0 x))) :no-pattern (= c x)))",
      "  (forall ((z Int)) (or (q z) (= c!0 #b00)))",
      "  (exists ((x (_ BitVec 2)) (z Int))",
      "    (! (and (bvule x #b10) (or (q z) (= c!0 x)))",
      "       :no-pattern (= c x)",
      "       :no-pattern (q z)",
      "       :qid foo))",
      "  (bvule c!0 #b10)",
      "  :precision precise :depth 1)",
      ")",
    ]);
  });

  it("frees the last result of a rewriter with the rewriter", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(simplify (<= (* x y) 0.0))",
        "(simplify (>= (* x y) 0.0))",
      ]),
    ).toEqual([
      "(or (not (= (>= x 0.0) (>= y 0.0))) (= x 0.0) (= y 0.0))",
      "(or (= (>= x 0.0) (>= y 0.0)) (= x 0.0) (= y 0.0))",
    ]);
  });
});

describe("the model finder, as Z3 5.3.2 cleans up its instantiation sets", () => {
  it("keeps a term whose value is a string", () => {
    expect(
      run([
        "(declare-fun g (String) String)",
        "(declare-const s String)",
        '(assert (= (g s) "c"))',
        "(assert (forall ((x String)) (not (= (g x) x))))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun s () String",
      '    "")',
      "  (define-fun g ((x!0 String)) String",
      '    (ite (= x!0 "") "c"',
      '      ""))',
      ")",
    ]);
  });
});

describe("the preprocessing setup_AUFLIA turns on, as Z3 5.3.2 runs it", () => {
  it("lifts the one term if-then-else out of each application with a bound variable", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(declare-const a Int)",
        "(assert (forall ((w Int)) (= (g w) (+ (f w) (ite (> a 2) 1 w)))))",
        "(assert (> a 0))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun a () Int",
      "    3)",
      "  (define-fun f ((x!0 Int)) Int",
      "    (- 1))",
      "  (define-fun g ((x!0 Int)) Int",
      "    0)",
      ")",
    ]);
  });
});
