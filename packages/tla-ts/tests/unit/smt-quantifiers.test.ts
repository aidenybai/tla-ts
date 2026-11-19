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

  it("counts the steps of the quantifier analyzer", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(assert (forall ((x Int)) (and (p x) (or (p (f x)) (= (f x) x)))))",
        "(push)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 174)"]);
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(assert (forall ((x Int) (y Int)) (or (= (f x) (g y)) (= (f y) (g x)) (= (f x) (f y)))))",
        "(push)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["(:rlimit 185)"]);
  });

  it("makes the model finder with smt.mbqi off", () => {
    const lines = ["(set-option :smt.mbqi false)", "(declare-const x Int)", "(assert (> x 0))"];
    expect(run([...lines, "(push)", "(get-info :rlimit)"])).toEqual(["(:rlimit 50)"]);
    expect(run([...lines, "(check-sat-using smt)", "(get-info :rlimit)"])).toEqual([
      "sat",
      "(:rlimit 65)",
    ]);
  });

  it("frees the instantiation sets of a quantifier's macro", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(declare-sort U 0)",
        "(declare-fun f (U) U)",
        "(declare-fun g (U) U)",
        "(declare-fun h (U U) U)",
        "(declare-fun p (U) Bool)",
        "(declare-const c1 U)",
        "(declare-const c3 U)",
        "(assert (forall ((x U)) (p x)))",
        "(assert (forall ((x U) (y U)) (! (= x (h y x)) :pattern ((f x) (g y)) :qid q2)))",
        "(assert (p (h c3 (g c1))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 1301)", "sat", "(:rlimit 2581)"]);
  });
});

describe("e-matching, as Z3 5.3.2 counts its steps", () => {
  it("counts the steps of the matcher and of the instantiation queue", () => {
    const lines = [
      "(declare-fun f (Int) Int)",
      "(declare-const a Int)",
      "(declare-const b Int)",
      "(assert (forall ((x Int)) (! (> (f x) x) :pattern ((f x)))))",
      "(assert (= (f a) b))",
      "(assert (< b a))",
      "(check-sat)",
      "(get-info :rlimit)",
    ];
    expect(run(["(set-option :smt.mbqi false)", ...lines])).toEqual(["unsat", "(:rlimit 469)"]);
    expect(run(["(set-option :smt.mbqi false)", "(push)", ...lines])).toEqual([
      "unsat",
      "(:rlimit 296)",
    ]);
  });

  it("reads no cancel flag between the lazy instances of a final check", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi false)",
        "(declare-fun f (Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-const c0 Int)",
        "(assert (forall ((x Int)) (p (f (f x)))))",
        "(assert (= c0 0))",
        "(assert (not (= c0 (f 0))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 981)"]);
  });
});

describe("the model checker, as Z3 5.3.2 counts its steps", () => {
  it("pushes its context as the kernel does", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(declare-fun h (Int Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-const c0 Int)",
        "(declare-const c1 Int)",
        "(declare-const c2 Int)",
        "(assert (forall ((x Int)) (! (p (f x)) :pattern ((f x)) :weight 4)))",
        "(assert (p (g 0)))",
        "(assert (= 1 c1))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 356)"]);
  });

  it("leaves the quantifiers out of validate_model", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (= (f x) x)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 187)"]);
  });

  it("makes its context on a check that finds no quantifier relevant", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const a Int)",
        "(assert (or (> a 3) (forall ((x Int)) (> (f x) x))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 362)"]);
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

  it("drops the bounds on a variable that occurs in nothing else, as elim_bounds does", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (> a b))",
        "(assert (forall ((x Int)) (or (<= x 3) (> (f a) (+ b 5)))))",
        "(assert (< (f b) 10))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(",
      "  (define-fun b () Int",
      "    0)",
      "  (define-fun a () Int",
      "    1)",
      "  (define-fun f ((x!0 Int)) Int",
      "    (ite (= x!0 0) 0",
      "      6))",
      ")",
    ]);
  });
});
