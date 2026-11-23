import { createHash } from "node:crypto";
import { describe, expect, it } from "vite-plus/test";
import { PATTERN_DATABASE } from "../../src/prover/smt/solver/pattern-database-text";
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

const getGroundPatternScript = (options: string[], check: string) => [
  "(set-option :auto_config false)",
  "(set-option :smt.mbqi false)",
  "(set-option :smt.qi.lazy_threshold 10.0)",
  ...options,
  "(declare-fun p (Int) Bool)",
  "(declare-fun q (Int) Bool)",
  "(declare-fun r (Int) Bool)",
  "(declare-fun s (Int) Bool)",
  "(declare-fun a (Int) Bool)",
  "(declare-fun w (Int) Bool)",
  "(declare-fun h (Int) Int)",
  "(declare-fun m (Int Int) Int)",
  "(assert (p 0))",
  "(assert (a 0))",
  "(assert (s 9))",
  "(assert (not (q 100)))",
  "(assert (forall ((x Int)) (! (=> (p x) (and (p (+ x 1)) (r x) (q (h x)))) :pattern ((p x)))))",
  "(assert (forall ((y Int)) (! (or (not (a y)) (not (r 9)) (forall ((z Int)) (! (w z) :pattern ((m z (h 9)))))) :pattern ((a y)))))",
  "(assert (forall ((x Int)) (! (=> (s x) (= (h x) 100)) :pattern ((h x)))))",
  check,
  "(get-info :rlimit)",
];

const getMultiPatternScript = (options: string[], check: string) => [
  "(set-option :auto_config false)",
  "(set-option :smt.mbqi false)",
  ...options,
  "(declare-fun p (Int Int) Bool)",
  "(declare-fun q (Int) Int)",
  "(declare-fun r (Int) Int)",
  "(declare-fun h (Int) Int)",
  "(declare-fun k (Int) Int)",
  "(declare-const a Int)",
  "(declare-const b Int)",
  "(assert (forall ((x Int) (y Int)) (! (p x y) :pattern ((q x) (r y)) :pattern ((h x) (k y)))))",
  "(assert (= (h a) (k b)))",
  "(assert (not (p a b)))",
  check,
  "(get-info :rlimit)",
];

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

  it("lowers a ground pattern term to the generation of its quantifier", () => {
    expect(run(getGroundPatternScript([], "(check-sat)"))).toEqual(["unsat", "(:rlimit 1893)"]);
  });

  it("keeps the generation of a term under smt.qi.update_generation false", () => {
    const options = ["(set-option :smt.qi.update_generation false)"];
    expect(run(getGroundPatternScript(options, "(check-sat)"))).toEqual([
      "unknown",
      "(:rlimit 2025)",
    ]);
    expect(run(getGroundPatternScript(options, "(check-sat-using smt)"))).toEqual([
      "unknown",
      "(:rlimit 1727)",
    ]);
  });

  it("matches smt.qi.max_multi_patterns more multi-patterns eagerly", () => {
    const options = ["(set-option :smt.qi.max_multi_patterns 1)"];
    expect(run(getMultiPatternScript([], "(check-sat)"))).toEqual(["unsat", "(:rlimit 385)"]);
    expect(run(getMultiPatternScript(options, "(check-sat)"))).toEqual(["unsat", "(:rlimit 362)"]);
    expect(run(getMultiPatternScript(options, "(check-sat-using smt)"))).toEqual([
      "unsat",
      "(:rlimit 266)",
    ]);
  });

  it("matches smt.qi.max_multi_patterns more multi-patterns eagerly in sat.euf", () => {
    const options = ["(set-option :sat.euf true)"];
    expect(run(getMultiPatternScript(options, "(check-sat)"))).toEqual(["unsat", "(:rlimit 175)"]);
    expect(
      run(
        getMultiPatternScript(
          [...options, "(set-option :smt.qi.max_multi_patterns 1)"],
          "(check-sat)",
        ),
      ),
    ).toEqual(["unsat", "(:rlimit 147)"]);
  });

  it("cancels the search past smt.qi.max_instances", () => {
    const options = ["(set-option :smt.qi.max_instances 3)"];
    const reason = '(:reason-unknown "smt tactic failed to show goal to be sat/unsat canceled")';
    expect(
      run([...getGroundPatternScript(options, "(check-sat)"), "(get-info :reason-unknown)"]),
    ).toEqual(["unknown", "(:rlimit 1155)", reason]);
    expect(
      run([
        ...getGroundPatternScript(options, "(check-sat-using smt)"),
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", "(:rlimit 857)", reason]);
  });

  it("counts the instances toward smt.qi.max_instances across the checks of a context", () => {
    const getOutput = (maxInstances: number) =>
      run([
        ...getGroundPatternScript(
          [`(set-option :smt.qi.max_instances ${maxInstances})`, "(push)"],
          "(check-sat)",
        ),
        "(get-info :reason-unknown)",
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-info :reason-unknown)",
      ]);
    expect(getOutput(3)).toEqual([
      "unknown",
      "(:rlimit 881)",
      '(:reason-unknown "canceled")',
      "unknown",
      "(:rlimit 935)",
      '(:reason-unknown "(incomplete quantifiers)")',
    ]);
    expect(getOutput(12)).toEqual([
      "unknown",
      "(:rlimit 1294)",
      '(:reason-unknown "canceled")',
      "unknown",
      "(:rlimit 1321)",
      '(:reason-unknown "canceled")',
    ]);
  });

  it("stops instantiating past smt.qi.max_instances in sat.euf", () => {
    expect(
      run([
        ...getGroundPatternScript(
          ["(set-option :sat.euf true)", "(set-option :smt.qi.max_instances 3)"],
          "(check-sat)",
        ),
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unknown", "(:rlimit 858)", '(:reason-unknown "incomplete theory quant")']);
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

  it("evaluates each quantifier body for mbqi on an empty model cache in sat.euf", () => {
    expect(run(getThresholdScript(["(set-option :sat.euf true)"], "(check-sat)"))).toEqual([
      "sat",
      "(:rlimit 1189)",
    ]);
  });

  it("reports the limit that stops a rewrite inside the sat.euf search as Z3 does", () => {
    expect(
      [315, 322, 427, 882, 1100].map((innerRlimit) =>
        run(
          getThresholdScript(
            [`(set-option :rlimit ${innerRlimit})`, "(set-option :sat.euf true)"],
            "(check-sat)",
            "(get-info :reason-unknown)",
          ),
        ),
      ),
    ).toEqual([
      ["unknown", '(:reason-unknown "canceled")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
      ["unknown", '(:reason-unknown "max. resource limit exceeded")'],
    ]);
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

  it("matches the new terms from when MBQI registers a quantifier, before it is assigned", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.relevancy 0)",
        "(set-option :smt.mbqi true)",
        "(declare-fun f (Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-const a Int)",
        "(assert (p (f 1)))",
        "(assert (p (f 2)))",
        "(assert (or (> a 3) (forall ((x Int)) (! (> (f x) x) :pattern ((f x))))))",
        "(assert (or (< a 2) (forall ((x Int)) (! (=> (p x) (> (f x) 0)) :pattern ((p x))))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 2591)"]);
  });
});

describe("e-matching, as Z3 5.3.2 reads smt.ematching", () => {
  const UNKNOWN = [
    "unknown",
    '(:reason-unknown "smt tactic failed to show goal to be sat/unsat (incomplete quantifiers)")',
  ];

  it("leaves a check unknown without the instances e-matching finds", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi false)",
        "(set-option :smt.ematching false)",
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (! (> (f x) x) :pattern ((f x)))))",
        "(assert (< (f 3) 2))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([...UNKNOWN, "(:rlimit 287)"]);
  });

  it("reads ematching as a parameter of the smt tactic", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(assert (forall ((x Int)) (! (> (f x) x) :pattern ((f x)))))",
        "(assert (< (f 3) 2))",
        "(check-sat-using (using-params smt :ematching false :mbqi false :auto_config false))",
        "(get-info :reason-unknown)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([...UNKNOWN, "(:rlimit 201)"]);
  });

  it("infers no patterns", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.ematching false)",
        "(declare-fun a () Int)",
        "(declare-fun p (Int) Bool)",
        "(assert (forall ((x Int)) (or (> x a) (< x (* 2 a)))))",
        "(assert (> a 0))",
        "(assert (p a))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 498)"]);
  });
});

describe("the quantifier solver of sat.euf, as Z3 5.3.2 reads smt.ematching and smt.mbqi", () => {
  const getOutput = (options: string[], assertion: string) =>
    run([
      "(set-option :sat.euf true)",
      ...options,
      "(declare-fun f (Int) Int)",
      "(declare-fun g (Int) Int)",
      "(declare-fun a () Int)",
      "(assert (forall ((x Int)) (! (> (f x) (g x)) :pattern ((f x)))))",
      assertion,
      "(check-sat-using sat)",
      "(get-info :reason-unknown)",
      "(get-info :rlimit)",
    ]);
  const GIVE_UP = ["unknown", '(:reason-unknown "incomplete theory quant")'];

  it("gives up without mbqi once e-matching has nothing left", () => {
    expect(getOutput(["(set-option :smt.mbqi false)"], "(assert (< a 0))")).toEqual([
      ...GIVE_UP,
      "(:rlimit 99)",
    ]);
  });

  it("gives up without e-matching or mbqi", () => {
    expect(
      getOutput(
        ["(set-option :smt.mbqi false)", "(set-option :smt.ematching false)"],
        "(assert (< (f a) (g a)))",
      ),
    ).toEqual([...GIVE_UP, "(:rlimit 98)"]);
  });

  it("counts a step for each term that e_internalize visits", () => {
    expect(getOutput([], "(assert (< (f a) (g a)))")).toEqual([
      "unsat",
      '(:reason-unknown "")',
      "(:rlimit 87)",
    ]);
  });
});

describe("the sub-solver of sat.euf's mbqi, as Z3 5.3.2's mk_smt2_solver picks it", () => {
  const getOutput = (options: string[], check: string) =>
    run([
      "(set-option :produce-models true)",
      ...options,
      "(declare-sort U 0)",
      "(declare-fun f (U) U)",
      "(declare-const a U)",
      "(declare-const b U)",
      "(assert (forall ((x U)) (= (f (f x)) x)))",
      "(assert (not (= (f a) a)))",
      "(assert (= (f b) a))",
      check,
      "(get-info :rlimit)",
      "(get-model)",
    ]);
  const getModel = (rlimit: number) => [
    "sat",
    `(:rlimit ${rlimit})`,
    "(",
    "  ;; universe for U:",
    "  ;;   U!val!0 U!val!1 ",
    "  ;; -----------",
    "  ;; definitions for universe elements:",
    "  (declare-fun U!val!0 () U)",
    "  (declare-fun U!val!1 () U)",
    "  ;; cardinality constraint:",
    "  (forall ((x U)) (or (= x U!val!0) (= x U!val!1)))",
    "  ;; -----------",
    "  (define-fun b () U",
    "    U!val!1)",
    "  (define-fun x!0 () U",
    "    U!val!0)",
    "  (define-fun a () U",
    "    U!val!0)",
    "  (define-fun f ((x!0 U)) U",
    "    (ite (= x!0 U!val!0) U!val!1",
    "      U!val!0))",
    ")",
  ];

  it("is the smt kernel when sat.euf is set only on the tactic", () => {
    expect(getOutput([], "(check-sat-using (using-params sat :euf true))")).toEqual(getModel(357));
  });

  it("seeds the smt kernel from the global smt.random_seed", () => {
    expect(
      getOutput(
        ["(set-option :smt.random_seed 5)"],
        "(check-sat-using (using-params sat :euf true))",
      ),
    ).toEqual(getModel(356));
  });

  it("reads the global sat parameters, not the tactic's", () => {
    expect(
      getOutput(
        ["(set-option :sat.euf true)"],
        "(check-sat-using (using-params sat :random_seed 7))",
      ),
    ).toEqual(getModel(243));
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

  it("binds a complete counterexample to the root it reads last in hash-table order", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(set-option :smt.mbqi.max_iterations 4)",
        "(declare-sort U 0)",
        "(declare-fun cast (Int) U)",
        "(declare-fun proj (U) Int)",
        "(declare-fun f (Int) Int)",
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(declare-const c Int)",
        "(declare-const d Int)",
        "(declare-const e Int)",
        "(assert (forall ((x Int)) (! (=> (< x 0) (= x (proj (cast x)))) :pattern ((cast x)))))",
        "(assert (= (proj (cast 1)) 1))",
        "(assert (and (<= (- (f a) (f b)) (- 2)) (not (= (- (f a) (f b)) 7))))",
        "(assert (and (<= (- (f c) (f d) (f e)) (- 2)) (not (= (- (f c) (f d) (f e)) 7))))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["unknown", "(:rlimit 3291)"]);
  });

  it("adds smt.mbqi.max_cexs counterexamples more each round", () => {
    const queries = ["(get-info :rlimit)", "(get-value ((f 0) (f 10)))"];
    expect(run(getMaxCexsScript([], queries))).toEqual([
      "sat",
      "(:rlimit 32090)",
      "(((f 0) 0)",
      " ((f 10) (- 10)))",
    ]);
    expect(run(getMaxCexsScript(["(set-option :smt.mbqi.max_cexs 3)"], queries))).toEqual([
      "sat",
      "(:rlimit 33156)",
      "(((f 0) 1)",
      " ((f 10) (- 9)))",
    ]);
  });

  it("adds smt.mbqi.max_cexs counterexamples more each round in sat.euf", () => {
    const options = ["(set-option :sat.euf true)"];
    const queries = ["(get-value ((f 0) (f 10)))"];
    expect(run(getMaxCexsScript(options, queries))).toEqual([
      "sat",
      "(((f 0) 264333)",
      " ((f 10) (- 53500)))",
    ]);
    expect(
      run(getMaxCexsScript([...options, "(set-option :smt.mbqi.max_cexs 3)"], queries)),
    ).toEqual(["sat", "(((f 0) 369270)", " ((f 10) (- 282194)))"]);
  });

  it("takes a macro of the AUF fragment as a template from smt.mbqi.force_template", () => {
    const script = [
      "(set-option :auto_config false)",
      "(set-option :smt.ematching false)",
      "(declare-fun f (Int) Int)",
      "(declare-fun g (Int) Int)",
      "(declare-fun p (Int) Bool)",
      "(declare-const a Int)",
      "(assert (forall ((x Int)) (= (f x) (g 5))))",
      "(assert (forall ((x Int)) (=> (p x) (> (f x) a))))",
      "(assert (p 3))",
      "(check-sat)",
      "(get-info :rlimit)",
    ];
    expect(run(script)).toEqual(["sat", "(:rlimit 948)"]);
    expect(run(["(set-option :smt.mbqi.force_template 1)", ...script])).toEqual([
      "sat",
      "(:rlimit 1128)",
    ]);
  });

  it("checks only the quantifiers whose qid starts with smt.mbqi.id", () => {
    const getOutput = (attribute: string) =>
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.ematching false)",
        '(set-option :smt.mbqi.id "a")',
        "(declare-fun f (Int) Int)",
        `(assert (forall ((x Int)) (! (> (f x) 0)${attribute})))`,
        "(check-sat)",
        "(get-info :rlimit)",
        "(get-info :reason-unknown)",
      ]);
    const incomplete =
      '(:reason-unknown "smt tactic failed to show goal to be sat/unsat (incomplete quantifiers)")';
    expect(getOutput(" :qid ab")).toEqual(["sat", "(:rlimit 182)", '(:reason-unknown "")']);
    expect(getOutput(" :qid b")).toEqual(["unknown", "(:rlimit 155)", incomplete]);
    expect(getOutput("")).toEqual(["unknown", "(:rlimit 155)", incomplete]);
  });
});

const getMaxCexsScript = (options: string[], queries: string[]) => [
  "(set-option :auto_config false)",
  "(set-option :smt.ematching false)",
  ...options,
  "(declare-fun f (Int) Int)",
  "(assert (forall ((x Int)) (=> (and (<= 0 x) (<= x 9)) (> (f x) (f (+ x 1))))))",
  "(check-sat)",
  ...queries,
];

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

describe("the pattern database setup_AUFLIA turns on, as Z3 5.3.2 loads it", () => {
  it("holds the bytes of Z3's ast/pattern/database.smt2", () => {
    expect(createHash("sha256").update(PATTERN_DATABASE).digest("hex")).toBe(
      "3b19a7e9f88910f7796f7ead70160a6a636fa33a27b812d3d51c90a3080b2bec",
    );
  });

  it("loads it at the first universal quantifier, though that one has patterns", () => {
    expect(
      run([
        "(set-logic AUFLIA)",
        "(set-option :smt.mbqi false)",
        "(set-option :smt.qi.lazy_threshold 10.0)",
        "(set-option :smt.qi.max_multi_patterns 1)",
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int Int) Int)",
        "(declare-fun p (Int) Bool)",
        "(declare-fun A () (Array Int Int))",
        "(declare-fun B () (Array Int Int))",
        "(declare-fun a () Int)",
        "(declare-fun b () Int)",
        "(declare-fun c () Int)",
        "(assert (forall ((x0 Int)) (! (or (and (>= (* -2 a) (+ c x0)) (p (+ 3 a))) (=> (<= (+ -2 c) b) (p (g b a)))) :pattern ((p x0)))))",
        "(assert (or (or (< 1 (g 2 b)) (p (+ b b))) (=> (> (* 1 b) (+ a -2)) (> a (+ c c)))))",
        "(assert (and (> (+ 1 a) (+ c c)) (= a (* 2 0))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(assert (< (+ 3 a) 2))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 1165)", "unsat", "(:rlimit 1368)"]);
  });

  it("gives a quantifier the weight of the database entry it matches", () => {
    const getOutput = (weight: number) =>
      run([
        "(set-option :smt.mbqi false)",
        "(declare-sort U 0)",
        "(declare-fun f (U) U)",
        "(declare-fun g (U) U)",
        "(declare-fun h (U U) U)",
        "(declare-fun p (U) Bool)",
        "(declare-const c0 U)",
        "(declare-const c1 U)",
        "(declare-const c2 U)",
        "(assert (forall ((x U)) (! (= (f x) (h c0 c2)) :pattern ((f x)) :pattern ((g x)) :qid q0)))",
        "(assert (forall ((x U)) (! (p (f x)) :pattern ((f x)))))",
        `(assert (forall ((x U)) (! (= (g (f x)) x) :pattern ((g (f x))) :weight ${weight})))`,
        "(assert (p (f c1)))",
        "(assert (p (h (f c0) (f c0))))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(assert (= c0 (h c2 c1)))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]);
    const expected = ["sat", "(:rlimit 2378)", "unknown", "(:rlimit 2810)"];
    expect(getOutput(5)).toEqual(expected);
    expect(getOutput(0)).toEqual(expected);
  });
});

describe("qsat, as Z3 5.3.2 counts its steps", () => {
  const getRlimit = (assertion: string) =>
    run(["(declare-const c Int)", `(assert ${assertion})`, "(check-sat)", "(get-info :rlimit)"]);

  it("removes the labels before it hoists and validates the assumptions it takes from the model", () => {
    expect(getRlimit("(forall ((x Int)) (=> (>= x c) (>= (+ x 1) c)))")).toEqual([
      "sat",
      "(:rlimit 443)",
    ]);
    expect(getRlimit("(forall ((x Int)) (=> (> x c) (> x (- c 1))))")).toEqual([
      "sat",
      "(:rlimit 467)",
    ]);
    expect(
      run([
        "(declare-const c Int)",
        "(assert (forall ((x Int)) (! (=> (>= x c) (>= (+ x 1) c)) :lblpos L)))",
        "(check-sat-using qsat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 358)"]);
  });

  it("rewrites a projection while its term graph lives and then rewrites the constant arrays", () => {
    expect(getRlimit("(forall ((x Int)) (> (+ x c) 3))")).toEqual(["unsat", "(:rlimit 379)"]);
    expect(getRlimit("(forall ((x Int)) (> (+ (* 2 c) 1) x))")).toEqual(["unsat", "(:rlimit 456)"]);
    expect(getRlimit("(forall ((x Int)) (=> (> x 0) (> (+ x c) 0)))")).toEqual([
      "sat",
      "(:rlimit 772)",
    ]);
  });
});

describe("the proto model, as Z3 5.3.2 leaves its array equalities unexpanded", () => {
  const ARRAYS = [
    "(declare-const a (Array Int Int))",
    "(declare-const b (Array Int Int))",
    "(declare-fun p (Int) Bool)",
    "(declare-fun f (Int) Int)",
  ];
  const CHECK = ["(check-sat)", "(get-info :rlimit)", "(get-value ((select a 0) (select b 0)))"];

  it("evaluates a quantifier body with an array equality in the model checker", () => {
    expect(
      run([
        ...ARRAYS,
        "(assert (forall ((x Int)) (=> (p x) (= (store a x 1) b))))",
        "(assert (p 2))",
        "(assert (not (= a b)))",
        ...CHECK,
      ]),
    ).toEqual(["sat", "(:rlimit 1073)", "(((select a 0) 3)", " ((select b 0) 3))"]);
  });

  it("evaluates an array disequality as it validates the model after mbqi", () => {
    expect(
      run([
        ...ARRAYS,
        "(assert (forall ((x Int)) (> (f x) 0)))",
        "(assert (not (= a b)))",
        "(assert (= (select a 1) (select b 1)))",
        ...CHECK,
      ]),
    ).toEqual(["sat", "(:rlimit 503)", "(((select a 0) 2)", " ((select b 0) 2))"]);
  });

  it("evaluates an equality of a function's array value", () => {
    expect(
      run([
        ...ARRAYS,
        "(declare-fun g (Int) (Array Int Int))",
        "(assert (forall ((x Int)) (or (= (g x) a) (= (g x) b))))",
        "(assert (not (= a b)))",
        "(assert (= (select (g 1) 0) 7))",
        ...CHECK,
      ]),
    ).toEqual(["sat", "(:rlimit 577)", "(((select a 0) 7)", " ((select b 0) 4))"]);
  });
});
