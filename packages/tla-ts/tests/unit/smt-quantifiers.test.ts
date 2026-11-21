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

  it("frees the bound the quantifier analyzer makes before it adds one to it", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x0 Int) (x1 Int)) (<= x1 (f 2))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 378)"]);
  });

  it("counts the steps that rename the variables of a macro candidate", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(declare-fun g (Int Int) Int)",
        "(declare-const a Int)",
        "(assert (forall ((x Int) (y Int)) (or (= (+ x 1) a) (<= y x) (= (g x y) 0))))",
        "(assert (= (g 1 0) 1))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 588)"]);
  });

  it("instantiates a variable that indexes an array with the indices of the array's selects", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun A () (Array Int Int))",
        "(assert (forall ((x Int)) (or (p x) (> (select A x) 0))))",
        "(assert (not (p 2)))",
        "(assert (< (select A 5) 0))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 686)",
      "(",
      "  (define-fun A () (Array Int Int)",
      "    (store ((as const (Array Int Int)) (- 1)) 2 1))",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (not (= x!0 2)))",
      ")",
    ]);
  });

  it("interprets an array as a lambda of the default weight", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun A () (Array Int Int))",
        "(declare-fun B () (Array Int Bool))",
        "(assert (forall ((x Int)) (or (p x) (> (select A x) 0) (select B x))))",
        "(assert (not (p 2)))",
        "(assert (not (p 7)))",
        "(assert (< (select A 5) 0))",
        "(assert (not (select B 4)))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 1702)",
      "(",
      "  (define-fun B () (Array Int Bool)",
      "    ((as const (Array Int Bool)) false))",
      "  (define-fun A () (Array Int Int)",
      "    (lambda ((x!1 Int))",
      "  (let ((a!1 (ite (and (not (= x!1 2)) (= x!1 4)) 11798 (ite (= x!1 2) 1 3))))",
      "  (let ((a!2 (ite (and (not (= x!1 2)) (not (= x!1 4)) (not (= x!1 5)))",
      "                  8856",
      "                  a!1)))",
      "    (ite (and (not (= x!1 2)) (not (= x!1 4)) (= x!1 5)) (- 1) a!2)))))",
      "  (define-fun p ((x!0 Int)) Bool",
      "    (and (not (= x!0 2)) (not (= x!0 4)) (= x!0 5)))",
      ")",
    ]);
  });
});

describe("the model finder, as Z3 5.3.2 reads a recursive function", () => {
  it("treats a call with a ground recursion argument as uninterpreted", () => {
    expect(
      run([
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-sort U 0)",
        "(declare-fun val (U) Int)",
        "(define-fun-rec mem ((u U) (l L)) Bool (ite ((_ is nil) l) false (or (= (val u) (hd l)) (mem u (tl l)))))",
        "(declare-const a U)",
        "(declare-const b U)",
        "(declare-const c U)",
        "(assert (distinct (val a) (val b) (val c)))",
        "(assert (forall ((x U)) (mem x (cons 1 (cons 2 nil)))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 5028)"]);
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

  it("costs each instance 0 under the qi.cost of the AUFLIA tactic", () => {
    expect(
      run([
        "(set-logic AUFLIA)",
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (forall ((x Int)) (! (> (f x) (g x)) :pattern ((f x)) :weight 20)))",
        "(assert (= (g a) (f b)))",
        "(assert (> (g b) (f a)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 593)"]);
  });

  it("reads a qi.cost numeral as a float quotient of int64s", () => {
    const getOutput = (cost: string) =>
      run([
        `(set-option :smt.qi.cost "${cost}")`,
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (forall ((x Int)) (! (> (f x) (g x)) :pattern ((f x)) :weight 20)))",
        "(assert (= (g a) (f b)))",
        "(assert (> (g b) (f a)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]);
    expect(getOutput("10.00000001")).toEqual(["unsat", "(:rlimit 641)"]);
    expect(getOutput("20.0000001")).toEqual(["unsat", "(:rlimit 661)"]);
    expect(getOutput("18446744073709551616")).toEqual(["unsat", "(:rlimit 641)"]);
  });

  it("keeps a real sum out of the code tree of an integer sum", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun a () Int)",
        "(declare-fun b () Int)",
        "(declare-fun x () Real)",
        "(assert (<= a x))",
        "(assert (forall ((x0 Int)) (p (+ 1 x0))))",
        "(assert (=> (<= b x) (>= 2 b)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 848)"]);
  });
});

const getThresholdScript = (options: string[], check: string, query = "(get-info :rlimit)") => [
  ...options,
  "(declare-fun f (Int) Int)",
  "(declare-fun g (Int) Int)",
  "(declare-fun h (Int) Int)",
  "(declare-const a Int)",
  "(declare-const b Int)",
  "(declare-const c Int)",
  "(assert (forall ((x Int)) (! (= (h x) (h (h x))) :pattern ((h x)) :weight 25 :qid q0)))",
  "(assert (forall ((x Int)) (! (<= (g x) (g (h x))) :pattern ((g x)) :weight 25)))",
  "(assert (forall ((x Int)) (! (<= (f x) (f x)) :pattern ((f x)) :weight 25)))",
  "(assert (> (f (g 0)) (f (g c))))",
  "(assert (> a c))",
  check,
  query,
];

describe("the instantiation thresholds, as Z3 5.3.2 reads them", () => {
  it("instantiates eagerly up to smt.qi.eager_threshold", () => {
    expect(
      run(
        getThresholdScript(
          ["(set-logic UFLIA)", "(set-option :smt.qi.eager_threshold 50.0)"],
          "(check-sat)",
        ),
      ),
    ).toEqual(["sat", "(:rlimit 3299)"]);
  });

  it("reads qi.eager_threshold as a parameter of the smt tactic", () => {
    expect(
      run(getThresholdScript([], "(check-sat-using (using-params smt :qi.eager_threshold 50.0))")),
    ).toEqual(["sat", "(:rlimit 3118)"]);
  });

  it("instantiates at the final check up to smt.qi.lazy_threshold", () => {
    expect(
      run(
        getThresholdScript(
          ["(set-option :auto_config false)", "(set-option :smt.qi.lazy_threshold 100.0)"],
          "(check-sat)",
        ),
      ),
    ).toEqual(["sat", "(:rlimit 3276)"]);
  });

  it("instantiates eagerly up to smt.qi.eager_threshold in sat.euf", () => {
    expect(
      run(
        getThresholdScript(
          ["(set-option :sat.euf true)", "(set-option :smt.qi.eager_threshold 50.0)"],
          "(check-sat)",
          "(get-value ((g c)))",
        ),
      ),
    ).toEqual(["sat", "(((g c) (- 50015)))"]);
  });

  it("instantiates at the final check up to smt.qi.lazy_threshold in sat.euf", () => {
    expect(
      run(
        getThresholdScript(
          ["(set-option :sat.euf true)", "(set-option :smt.qi.lazy_threshold 100.0)"],
          "(check-sat)",
          "(get-value ((g c)))",
        ),
      ),
    ).toEqual(["sat", "(((g c) (- 93511)))"]);
  });

  it("puts the lazy threshold back to 20 in setup_AUFLIA", () => {
    expect(
      run([
        "(set-logic UFLIA)",
        "(set-option :smt.qi.lazy_threshold 100.0)",
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int) Int)",
        "(declare-const a Int)",
        "(assert (forall ((x Int)) (! (<= (g x) (f (g x))) :pattern ((g x)) :weight 25)))",
        "(assert (distinct 0 (f (g a))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 473)"]);
  });
});

const BOUNDED_BELOW = [
  "(declare-fun f (Int) Int)",
  "(declare-fun g (Int) Int)",
  "(assert (forall ((x Int)) (! (> (f x) (g x)) :pattern ((f x)))))",
  "(assert (forall ((x Int)) (! (> (g x) x) :pattern ((g x)))))",
];

const getBoundCheck = (argument: number) => [
  "(push)",
  `(assert (< (f ${argument}) 2))`,
  "(check-sat)",
  "(get-info :rlimit)",
  "(pop)",
];

describe("relevancy, as Z3 5.3.2 reads smt.relevancy", () => {
  it("matches each new term when relevancy is off", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi false)",
        "(set-option :smt.relevancy 0)",
        ...BOUNDED_BELOW,
        "(assert (< (f 3) 2))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 546)"]);
  });

  it("reads relevancy as a parameter of the smt tactic", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        ...BOUNDED_BELOW,
        "(assert (< (f 3) 2))",
        "(check-sat-using (using-params smt :relevancy 1))",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unsat", "(:rlimit 412)"]);
  });

  it("keeps the lowest level a check has used", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi false)",
        ...BOUNDED_BELOW,
        ...getBoundCheck(3),
        "(set-option :smt.relevancy 0)",
        ...getBoundCheck(5),
        "(set-option :smt.relevancy 2)",
        ...getBoundCheck(7),
      ]),
    ).toEqual(["unsat", "(:rlimit 394)", "unsat", "(:rlimit 548)", "unsat", "(:rlimit 707)"]);
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

  it("sets up its context with every theory, whatever the logic", () => {
    expect(
      run([
        "(set-logic AUFLIRA)",
        "(set-option :smt.qi.max_multi_patterns 3)",
        "(set-option :smt.array.extensional false)",
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun A () (Array Int Int))",
        "(declare-fun B () (Array Int Int))",
        "(declare-fun a () Int)",
        "(declare-fun b () Int)",
        "(declare-fun c () Int)",
        "(declare-fun r (Int) Real)",
        "(declare-fun x () Real)",
        "(assert (forall ((x0 Int)) (! (=> (and (<= (r (* 1 c)) (+ x (to_real c))) (< (+ 3 x0) (+ c x0))) (=> (> x0 b) (< (r (g a c)) (+ x (to_real b))))) :weight 0 :qid ax0)))",
        "(assert (forall ((x0 Int)) (! (p (+ b c)) :weight 0 :qid ax1)))",
        "(assert (forall ((x0 Int)) (<= (r (+ b x0)) (+ x (to_real c)))))",
        "(assert (or (and (< (+ b 3) c) (= (r (f b)) (+ x (to_real c)))) (and (p c) (< (r c) (+ x (to_real 2))))))",
        "(assert (or (=> (<= (f 1) (f 0)) (p (+ a b))) (or (>= (+ c b) (+ b a)) (> (f a) (f c)))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 4128)"]);
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
