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

  it("drops the last check at a pop past the stack, but not at one it cannot read", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 2))",
        "(check-sat)",
        "(pop 1)",
        "(get-model)",
        "(get-info :reason-unknown)",
        "(check-sat)",
        "(pop 0)",
        "(get-value (x))",
        "(check-sat)",
        "(pop -1)",
        "(get-value (x))",
      ]),
    ).toEqual([
      "sat",
      '(error "line 4 column 6: invalid pop command, argument is greater than the current stack depth")',
      '(error "line 5 column 10: model is not available")',
      '(:reason-unknown "state of the most recent check-sat command is not known")',
      "sat",
      '(error "line 9 column 14: model is not available")',
      "sat",
      '(error "line 11 column 5: invalid push command, value is negative.")',
      "((x 3))",
    ]);
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

  it("prints success at exit", () => {
    expect(run(["(set-option :print-success true)", "(exit)", "(check-sat)"])).toEqual([
      "success",
      "success",
    ]);
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
        "(assert (not (xor false)))",
        "(assert (= (- 10 3 2) 5))",
        "(check-sat)",
      ]),
    ).toEqual(["sat"]);
  });

  it("reports a declaration of the same signature twice", () => {
    expect(run(["(declare-fun a () Bool)", "(declare-fun a () Bool)"])).toEqual([
      "(error \"line 2 column 22: invalid declaration, constant 'a' (with the given signature) already declared\")",
    ]);
  });

  it("answers an optimization by its hard constraints", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (> x 3))",
        "(minimize x)",
        "(assert-soft (< x 0))",
        "(check-sat)",
        "(assert (< x 2))",
        "(check-sat)",
      ]),
    ).toEqual(["sat", "unsat"]);
  });

  it("walks the pareto front of objectives that elim01 turns into soft constraints", () => {
    expect(
      run([
        "(set-option :opt.priority pareto)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (<= 0 x 2))",
        "(assert (<= 0 y 2))",
        "(assert (<= (+ x y) 3))",
        "(maximize x)",
        "(maximize y)",
        "(check-sat)",
        "(get-objectives)",
        "(check-sat)",
        "(get-objectives)",
        "(check-sat)",
        "(check-sat)",
      ]),
    ).toEqual([
      "sat",
      "(objectives\n (x 1)\n (y 2)\n)",
      "sat",
      "(objectives\n (x 2)\n (y 1)\n)",
      "unsat",
      "sat",
    ]);
  });

  it("gives the objectives 0 when the hard constraints are false", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(assert (< x 10))",
        "(assert-soft p :weight 3 :id g)",
        "(assert-soft (not p) :weight 2 :id g)",
        "(maximize x)",
        "(minimize (+ x 1))",
        "(check-sat)",
        "(get-objectives)",
        "(push)",
        "(assert false)",
        "(check-sat)",
        "(get-objectives)",
      ]),
    ).toEqual([
      "sat",
      "(objectives\n (g 2)\n (x 9)\n ((+ x 1) 10)\n)",
      "unsat",
      "(objectives\n (g 0)\n (x 0)\n ((+ x 1) 0)\n)",
    ]);
  });

  it("prints the simplified term, as in z3test's t27.smt2 and abs.smt2", () => {
    expect(
      run([
        "(simplify (distinct 0 1 2 3 4 5 6))",
        "(declare-fun a () Int)",
        "(simplify (distinct 0 1 2 3 a 4 5 6))",
        "(simplify (abs a))",
      ]),
    ).toEqual(["true", "(distinct 0 1 2 3 a 4 5 6)", "(ite (>= a 0) a (* (- 1) a))"]);
  });

  it("names a deep subterm with let, as Z3's printer does", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(simplify (forall ((x Int) (y Int)) (=> (> x y) (> (+ x a) (+ y a b b b b b b b b b)))))",
      ]),
    ).toEqual([
      [
        "(forall ((x Int) (y Int))",
        "  (let ((a!1 (not (<= x (+ y (* 9 b))))))",
        "    (or (<= x y) a!1)))",
      ].join("\n"),
    ]);
  });

  it("prints the goal that apply's tactic leaves, as in z3test's t64.smt2", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (>= x 0))",
        "(assert (and (>= x 1) (not (or (not (and (>= x 2) (>= x 5))) (>= x 3)))))",
        "(apply simplify)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (>= x 0)",
        "  (>= x 1)",
        "  (>= x 2)",
        "  (>= x 5)",
        "  (not (>= x 3))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("reads options back, and stops at an error once told to, as in z3test's error.smt2", () => {
    expect(
      run([
        "(get-option :smt.relevancy)",
        "(set-option :auto-config false)",
        "(get-option :auto-config)",
        "(define-const x Bool 10)",
        "(set-option :error-behavior immediate-exit)",
        "(get-option :error-behavior)",
        "(define-const x Bool 10)",
        '(echo "continued...")',
      ]),
    ).toEqual([
      "2",
      "false",
      '(error "line 4 column 23: invalid constant definition, sort mismatch")',
      "immediate-exit",
      '(error "line 7 column 23: invalid constant definition, sort mismatch")',
    ]);
  });

  it("evaluates a term in the model, as in z3test's idl.smt2 and t16.smt2", () => {
    expect(
      run([
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (>= (- a (ite (<= a 0) (* 3 b) b)) 2))",
        "(check-sat)",
        "(eval (>= (- a (ite (<= a 0) (* 3 b) b)) 2))",
        "(eval (bv2int (bvadd #x0a #xf0)))",
      ]),
    ).toEqual(["sat", "true", "250"]);
  });

  it("prints each term of get-value as the script spells it, with its value", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= x 3))",
        "(check-sat)",
        "(get-value (x   ( + x 1 ) y))",
      ]),
    ).toEqual(["sat", "((x 3)\n (( + x 1 ) 4)\n (y 0))"]);
  });

  it("prints the model with the declared constants it leaves out, as in z3test's model_compact_bug.smt2", () => {
    expect(
      run([
        "(declare-fun p (Int) Bool)",
        "(declare-const z Int)",
        "(assert (p 1))",
        "(assert (p 2))",
        "(assert (p 3))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun z () Int",
        "    0)",
        "  (define-fun p ((x!0 Int)) Bool",
        "    true)",
        ")",
      ].join("\n"),
    ]);
  });

  it("completes a floating-point constant that no assertion mentions as NaN", () => {
    expect(
      run([
        "(set-logic QF_FP)",
        "(declare-const z0 (_ FloatingPoint 3 5))",
        "(declare-const z1 (_ FloatingPoint 3 5))",
        "(assert (fp.isNegative z1))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun z1 () (_ FloatingPoint 3 5)",
        "    (_ -zero 3 5))",
        "  (define-fun z0 () (_ FloatingPoint 3 5)",
        "    (_ NaN 3 5))",
        ")",
      ].join("\n"),
    ]);
  });

  it("takes the fresh values of a model in the order that their stubs were made", () => {
    expect(
      run([
        "(declare-fun x0 () Int)",
        "(declare-fun x1 () Int)",
        "(declare-fun q (Int Int) Bool)",
        "(declare-const a0 (Array Int Int))",
        "(declare-const a2 (Array Int Int))",
        "(assert (distinct (select (store a0 x0 x1) 1) (ite (= (ite (q 6 (- x0)) (- 2) x0) (select (store a2 x1 x1) x0)) x0 (- x0 x1))))",
        "(check-sat)",
        "(get-value (a0 a2))",
      ]),
    ).toEqual([
      "sat",
      [
        "((a0 ((as const (Array Int Int)) 2))",
        " (a2 (store ((as const (Array Int Int)) 4) 1 (- 2))))",
      ].join("\n"),
    ]);
  });

  it("completes the empty model of a goal that simplifies to true", () => {
    expect(
      run([
        "(declare-sort U 0)",
        "(declare-fun u () U)",
        "(declare-const b Bool)",
        "(assert (or b (= u u)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun u () U",
        "    U!val!0)",
        "  (define-fun b () Bool",
        "    false)",
        ")",
      ].join("\n"),
    ]);
  });

  it("prints a named term's definition in the model as the script spells it", () => {
    expect(
      run([
        "(declare-fun x () Int)",
        "(assert (! (> (abs x) 2) :named a0))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun x () Int",
        "    3)",
        "  (define-fun a0 () Bool",
        "    (> (abs x) 2))",
        ")",
      ].join("\n"),
    ]);
  });

  it("qualifies a constant that a named term of the same name overloads", () => {
    expect(
      run([
        "(declare-const a0 (Array Int Int))",
        "(declare-const x Int)",
        "(assert (! (= a0 (store a0 x 1)) :named a0))",
        "(simplify a0)",
        "(simplify (! (> x 2) :named x))",
        "(simplify (x 1))",
        "(apply skip)",
        "(reset)",
        "(declare-const y Int)",
        "(assert (! (> y 2) :named n))",
        "(declare-const p Bool)",
        "(assert (! (not p) :named q))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "(= (as a0 (Array Int Int)) (store (as a0 (Array Int Int)) x 1))",
      "(not (<= (as x Int) 2))",
      '(error "line 6 column 14: ambiguous constant reference, more than one constant with the same sort, use a qualified expression (as <symbol> <sort>) to disambiguate x")',
      [
        "(goals",
        "(goal",
        "  (= (as a0 (Array Int Int)) (store (as a0 (Array Int Int)) (as x Int) 1))",
        "  :precision precise :depth 0)",
        ")",
      ].join("\n"),
      "sat",
      [
        "(",
        "  (define-fun y () Int",
        "    3)",
        "  (define-fun p () Bool",
        "    false)",
        "  (define-fun q () Bool",
        "    (not p))",
        "  (define-fun n () Bool",
        "    (> y 2))",
        ")",
      ].join("\n"),
    ]);
  });

  it("prints the names of an unsat core, as in z3test's t10.smt2", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-fun p () Bool)",
        "(declare-fun q () Bool)",
        "(declare-fun r () Bool)",
        "(declare-fun s () Bool)",
        "(declare-fun t () Bool)",
        "(assert (! (=> p q) :named PQ))",
        "(assert (! (=> q r) :named QR))",
        "(assert (! (=> r s) :named RS))",
        "(assert (! (=> s t) :named ST))",
        "(assert (! (not (=> q s)) :named NQS))",
        "(check-sat)",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(QR RS NQS)"]);
  });

  it("evaluates in a model of arrays, as in z3test's mev_array.smt2", () => {
    expect(
      run([
        "(declare-const a (Array Int Int))",
        "(declare-const b (Array Int Int))",
        "(assert (let ((base (store ((as const (Array Int Int)) 0) 42 15)))",
        "  (and (= a base) (= b (store base 5 3)))))",
        "(check-sat)",
        "(eval (= (store (store a 6 7) 5 8) (store (store b 6 7) 5 8)))",
        "(eval (= (store a 6 7) (store (store b 6 7) 5 0)))",
        "(eval (= a b))",
      ]),
    ).toEqual(["sat", "true", "true", "false"]);
  });

  it("expands a select over a store or an if-then-else in eval", () => {
    expect(
      run([
        "(declare-sort E 0)",
        "(declare-const e0 E)",
        "(declare-const e2 E)",
        "(declare-const i0 Int)",
        "(declare-const i2 Int)",
        "(declare-const p Bool)",
        "(declare-const a (Array Int E))",
        "(declare-const b (Array Int Int))",
        "(declare-const c (Array Int Int))",
        "(check-sat)",
        "(eval (= e0 (select (store a i0 e2) i2)))",
        "(eval (+ (select b 0) (select c 0) (select (ite p b c) i2)))",
      ]),
    ).toEqual([
      "sat",
      "(= e0 (ite (= i0 i2) e2 (select a i2)))",
      "(+ (select b 0) (select c 0) (ite p (select b i2) (select c i2)))",
    ]);
  });

  it("expands the same select again in a later eval", () => {
    expect(
      run([
        "(declare-const i0 Int)",
        "(declare-const i2 Int)",
        "(declare-const a2 (Array Int Int))",
        "(check-sat)",
        "(eval (+ 1 (select (store a2 i0 3) i2)))",
        "(eval (+ 1 (select (store a2 i0 3) i2)))",
      ]),
    ).toEqual([
      "sat",
      "(+ 1 (ite (= i0 i2) 3 (select a2 i2)))",
      "(+ 1 (ite (= i0 i2) 3 (select a2 i2)))",
    ]);
  });

  it("keeps a distinct of more than two terms in eval", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const z Int)",
        "(assert (= x 1))",
        "(check-sat)",
        "(eval (distinct x y z))",
        "(eval (distinct x 1 z))",
        "(eval (distinct x 2 3))",
        "(get-value ((distinct x y z)))",
      ]),
    ).toEqual(["sat", "(distinct 1 y z)", "false", "true", "(((distinct x y z) false))"]);
  });

  // z3test's regressions/smt2/fp-rem-1.smt2, with what Z3 prints for it.
  it("decides floating-point terms with the smt core and with the fpa2bv tactic", () => {
    expect(
      run([
        "(set-logic QF_FP)",
        "(define-sort FPN () (_ FloatingPoint 11 53))",
        "(declare-const x FPN)",
        "(assert (= x (fp.rem (_ +zero 11 53) (fp #b0 #b01111111111 #x0000000000000))))",
        "(check-sat)",
        "(check-sat-using smt)",
        "(check-sat-using (then fpa2bv smt))",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "sat",
      "sat",
      "(\n  (define-fun x () (_ FloatingPoint 11 53)\n    (_ +zero 11 53))\n)",
    ]);
  });

  it("carries assertion names through tactics into the unsat core", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(assert (! (and p (or q (> x 2))) :named a))",
        "(assert (! (=> p (= y 4)) :named b))",
        "(assert (! (not (or (< y x) q)) :named c))",
        "(assert (! (> x 3) :named d))",
        "(assert (! (< x 5) :named e))",
        "(assert (! (> (+ x y) 8) :named f))",
        "(check-sat-using (then (repeat propagate-values) smt))",
        "(get-unsat-core)",
        "(check-sat-using (or-else (then simplify fail) smt))",
        "(get-unsat-core)",
      ]),
    ).toEqual(["unsat", "(c f b a)", "unsat", "(f e a b)"]);
  });

  // z3test's regressions/smt2/3042.smt2, then an unsat core and a parallel parameter.
  it("decides with psmt, the parallel smt tactic", () => {
    expect(
      run([
        "(set-option :smt.arith.solver 6)",
        "(set-option :produce-unsat-cores true)",
        "(declare-fun a () Int)",
        "(declare-fun b () Int)",
        "(declare-fun c () Int)",
        "(declare-fun d () Int)",
        "(declare-fun e () Int)",
        "(assert (let ((f (< 0 e d))) (or (and (= c (/ 2.0 e)) (forall ((g Int)) " +
          "(= (<= g d) (forall ((h Int)) (> h g))))) (< b a) f)))",
        "(check-sat-using psmt)",
        "(assert (! (> a 5) :named n1))",
        "(assert (! (< a 3) :named n2))",
        "(check-sat-using psmt)",
        "(get-unsat-core)",
        "(set-option :parallel.num_bb_threads 3)",
        "(check-sat-using psmt)",
      ]),
    ).toEqual(["sat", "unsat", "(n1 n2)", "unknown"]);
  });

  it("counts each propagate-values pass as a round", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= y (+ x 1)))",
        "(assert (= x 0))",
        "(apply (using-params propagate-values :max_rounds 1))",
        "(apply (using-params propagate-values :max_rounds 2))",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (= y (+ x 1))\n  (= x 0)\n  :precision precise :depth 1)\n)",
      "(goals\n(goal\n  (= y 1)\n  (= x 0)\n  :precision precise :depth 1)\n)",
    ]);
  });

  it("finds no macros while a defined function is in scope", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const x Int)",
        "(assert (forall ((y Int)) (= (f y) (+ y 1))))",
        "(assert (> (f x) 3))",
        "(push)",
        "(define-fun two () Int 2)",
        "(apply macro-finder)",
        "(pop)",
        "(apply macro-finder)",
      ]),
    ).toEqual([
      "(goals\n(goal\n  (forall ((y Int)) (= (f y) (+ y 1)))\n  (> (f x) 3)\n  :precision precise :depth 0)\n)",
      "(goals\n(goal\n  (not (<= x 2))\n  :precision precise :depth 1)\n)",
    ]);
  });

  // z3test's regressions/smt2/sine9.smt2, then the bounds Z3 puts on other transcendental
  // functions, and a Taylor bound of nlsat.
  it("bounds the values of transcendental functions", () => {
    expect(
      run([
        "(declare-fun x () Real)",
        "(declare-fun y () Real)",
        "(push)",
        "(assert (< (sin x) -1.0))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (> (atan x) 2.0))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (> (atan2 y x) 4.0))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (> pi 4.0))",
        "(check-sat)",
        "(pop)",
        "(push)",
        "(assert (> (exp x) 2.0))",
        "(assert (< x 0.5))",
        "(check-sat)",
        "(pop)",
        "(assert (>= (cos x) 1.0))",
        "(check-sat)",
      ]),
    ).toEqual(["unsat", "unsat", "unsat", "unsat", "unsat", "sat"]);
  });

  it("refines transcendental functions in the nlsat tactic", () => {
    expect(
      run([
        "(declare-fun x () Real)",
        "(push)",
        "(assert (> (exp (exp x)) 100.0))",
        "(assert (< x 0.0))",
        "(check-sat-using qfnra-nlsat)",
        "(pop)",
        "(assert (> (exp x) 2.0))",
        "(check-sat-using qfnra-nlsat)",
        "(get-value (x))",
      ]),
    ).toEqual(["unsat", "sat", "((x 2.0))"]);
  });

  // From z3test's string-ops.smt2. The second check goes on from the unfolding depth the first
  // raised, and sees the string literals as units, as Z3's one incremental kernel does.
  it("keeps one kernel across incremental checks, as in z3test's string-ops.smt2", () => {
    expect(
      run([
        "(declare-const a String)",
        "(push)",
        '(assert (= (str.len a) (+ 3 (str.indexof a "abc"))))',
        "(assert (= (str.len a) 4))",
        "(check-sat)",
        "(pop)",
        "(push)",
        '(assert (str.contains "abc" a))',
        '(assert (str.contains "bcd" a))',
        "(check-sat)",
        "(get-model)",
        "(pop)",
      ]),
    ).toEqual(["sat", "sat", '(\n  (define-fun a () String\n    "b")\n)']);
  });

  it("throws at the dependencies of a tactic that drops them", () => {
    expect(() =>
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(assert (! (= x 1) :named a))",
        "(apply ctx-solver-simplify :print-dependencies true)",
      ]),
    ).toThrow(SmtUnsupportedError);
  });

  it("answers uninterpreted functions with sat.euf's solver", () => {
    const header = ["(set-option :sat.euf true)", "(declare-sort U 0)"];
    expect(
      run([
        ...header,
        "(declare-fun f (U) U)",
        "(declare-fun a () U)",
        "(declare-fun b () U)",
        "(declare-fun p (U) Bool)",
        "(assert (= (f a) b))",
        "(assert (not (= (f b) a)))",
        "(assert (or (p a) (p (f a))))",
        "(assert (not (p b)))",
        "(check-sat)",
        "(get-value ((p a) (= (f b) b) (= a b)))",
        "(reset)",
        ...header,
        "(declare-fun f (U) U)",
        "(declare-fun a () U)",
        "(assert (= (f (f (f a))) a))",
        "(assert (= (f (f (f (f (f a))))) a))",
        "(assert (not (= (f a) a)))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-fun x () Bool)",
        "(declare-fun y () Bool)",
        "(declare-fun g (Bool) U)",
        "(declare-fun a () U)",
        "(assert (= (g x) a))",
        "(assert (not (= (g y) a)))",
        "(assert (or x y))",
        "(check-sat)",
        "(get-value (x y (= (g true) a)))",
      ]),
    ).toEqual([
      "sat",
      "(((p a) true)\n ((= (f b) b) false)\n ((= a b) false))",
      "unsat",
      "sat",
      "((x false)\n (y true)\n ((= (g true) a) false))",
    ]);
  });

  it("instantiates sat.euf's quantifiers by e-matching and model-based instantiation", () => {
    const header = [
      "(set-option :sat.euf true)",
      "(set-option :tactic.default_tactic smt)",
      "(declare-sort U 0)",
      "(declare-fun f (U) U)",
      "(declare-fun a () U)",
    ];
    expect(
      run([
        ...header,
        "(declare-fun b () U)",
        "(assert (forall ((x U)) (= (f x) a)))",
        "(assert (not (= (f b) a)))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-fun p (U) Bool)",
        "(assert (forall ((x U)) (=> (p x) (p (f x)))))",
        "(assert (p a))",
        "(assert (not (p (f (f a)))))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(assert (forall ((x U)) (not (= (f x) x))))",
        "(check-sat)",
        "(get-value ((f a) (= (f a) a)))",
        "(reset)",
        ...header,
        "(declare-fun r (U U) Bool)",
        "(assert (forall ((x U)) (exists ((y U)) (r x y))))",
        "(assert (forall ((x U) (y U)) (not (r x y))))",
        "(check-sat)",
      ]),
    ).toEqual(["unsat", "unsat", "sat", "(((f a) U!val!1)\n ((= (f a) a) false))", "unsat"]);
  });

  it("checks with sat.euf's incremental solver after push", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :produce-models true)",
        "(set-option :produce-unsat-cores true)",
        "(declare-sort U 0)",
        "(declare-fun f (U) U)",
        "(declare-fun p (U) Bool)",
        "(declare-fun a () U)",
        "(declare-fun b () U)",
        "(assert (forall ((x U)) (= (f (f x)) x)))",
        "(push)",
        "(assert (= (f a) b))",
        "(assert (not (= (f b) a)))",
        "(check-sat)",
        "(pop)",
        "(assert (= (f a) b))",
        "(assert (not (= a b)))",
        "(check-sat)",
        "(get-model)",
        "(declare-fun q () Bool)",
        "(assert (=> q (not (= a (f b)))))",
        "(check-sat-assuming (q))",
        "(check-sat-assuming ((not q)))",
        "(push)",
        "(assert (! (p a) :named n1))",
        "(assert (! (not (p (f (f a)))) :named n2))",
        "(check-sat)",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "unsat",
      "sat",
      [
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
        "  (define-fun a () U",
        "    U!val!0)",
        "  (define-fun b () U",
        "    U!val!1)",
        "  (define-fun x!1 () U",
        "    U!val!1)",
        "  (define-fun f ((x!0 U)) U",
        "    (ite (= x!0 U!val!0) U!val!1",
        "      U!val!0))",
        "  (define-fun p ((x!0 U)) Bool",
        "    false)",
        ")",
      ].join("\n"),
      "unsat",
      "sat",
      "unsat",
      "(n2 n1)",
    ]);
  });

  it("answers arithmetic with sat.euf's arith solver", () => {
    const header = ["(set-option :sat.euf true)", "(set-option :tactic.default_tactic smt)"];
    expect(
      run([
        ...header,
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (> x 2))",
        "(assert (< (+ x y) 1))",
        "(assert (>= y (- 5)))",
        "(check-sat)",
        "(get-value (x y))",
        "(reset)",
        ...header,
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(declare-fun f (Real) Real)",
        "(assert (= (f x) (+ y 1)))",
        "(assert (<= x y))",
        "(assert (<= y x))",
        "(assert (not (= (f y) (+ x 1))))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(assert (= (mod x 3) 2))",
        "(assert (= (div y 4) x))",
        "(assert (> y 10))",
        "(assert (< y 30))",
        "(check-sat)",
        "(get-value (x y))",
        "(reset)",
        ...header,
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(assert (= (* x y) 2.0))",
        "(assert (> x 0.0))",
        "(assert (< y 1.0))",
        "(check-sat)",
        "(get-value (x y))",
        "(reset)",
        ...header,
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(assert (= (/ x y) 2.0))",
        "(assert (= y 0.0))",
        "(assert (= x 1.0))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "((x 4)\n (y (- 4)))",
      "unsat",
      "sat",
      "((x 5)\n (y 23))",
      "sat",
      "((x 4.0)\n (y (/ 1.0 2.0)))",
      "sat",
      [
        "(",
        "  (define-fun y () Real",
        "    0.0)",
        "  (define-fun x () Real",
        "    1.0)",
        "  (define-fun /0 ((x!0 Real) (x!1 Real)) Real",
        "    (ite (and (= x!0 1.0) (= x!1 0.0)) 2.0",
        "      0.0))",
        ")",
      ].join("\n"),
    ]);
  });

  it("answers bit-vectors with sat.euf's bv solver", () => {
    const header = ["(set-option :sat.euf true)", "(set-option :tactic.default_tactic smt)"];
    expect(
      run([
        ...header,
        "(declare-const x (_ BitVec 16))",
        "(declare-const y (_ BitVec 16))",
        "(assert (= (bvudiv x y) #x0003))",
        "(assert (= (bvurem x y) #x0002))",
        "(assert (bvult y #x0010))",
        "(assert (bvugt y #x0004))",
        "(check-sat)",
        "(get-value (x y))",
        "(reset)",
        ...header,
        "(declare-fun f ((_ BitVec 8)) (_ BitVec 8))",
        "(declare-fun g ((_ BitVec 8)) (_ BitVec 8))",
        "(declare-const x (_ BitVec 8))",
        "(declare-const y (_ BitVec 8))",
        "(assert (= (f (bvadd x #x01)) (g y)))",
        "(assert (not (= (f (bvadd y #x01)) (g x))))",
        "(assert (= x y))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-const x (_ BitVec 8))",
        "(declare-const n Int)",
        "(assert (= (bv2nat x) n))",
        "(assert (> n 200))",
        "(assert (< n 202))",
        "(check-sat)",
        "(get-value (x n))",
        "(reset)",
        ...header,
        "(declare-fun p ((_ BitVec 4)) Bool)",
        "(declare-const x (_ BitVec 4))",
        "(declare-const y (_ BitVec 4))",
        "(declare-const z (_ BitVec 4))",
        "(assert (p x))",
        "(assert (p y))",
        "(assert (not (p z)))",
        "(assert (= (bvadd x y) z))",
        "(assert (= (bvadd x z) y))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "((x #x0017)\n (y #x0007))",
      "unsat",
      "sat",
      "((x #xc9)\n (n 201))",
      "sat",
      [
        "(",
        "  (define-fun y () (_ BitVec 4)",
        "    #x1)",
        "  (define-fun z () (_ BitVec 4)",
        "    #x9)",
        "  (define-fun x () (_ BitVec 4)",
        "    #x8)",
        "  (define-fun p ((x!1 (_ BitVec 4))) Bool",
        "    (ite (= x!1 #x8) true",
        "    (ite (= x!1 #x1) true",
        "    (ite (= x!1 #x9) false",
        "      #unspecified))))",
        ")",
      ].join("\n"),
    ]);
  });

  it("answers floating point with sat.euf's fpa solver", () => {
    const header = [
      "(set-option :sat.euf true)",
      "(set-option :tactic.default_tactic smt)",
      "(declare-const x (_ FloatingPoint 3 5))",
    ];
    expect(
      run([
        ...header,
        "(declare-const b (_ BitVec 8))",
        "(assert (= ((_ to_fp 3 5) b) x))",
        "(assert (fp.isNegative x))",
        "(assert (fp.isNormal x))",
        "(assert (= ((_ fp.to_ubv 4) RTZ (fp.abs x)) #x3))",
        "(check-sat)",
        "(get-value (x b))",
        "(reset)",
        ...header,
        "(declare-const y (_ FloatingPoint 3 5))",
        "(assert (fp.isNormal x))",
        "(assert (fp.isSubnormal y))",
        "(check-sat)",
        "(get-value (x y))",
        "(reset)",
        ...header,
        "(assert (fp.gt x (fp #b0 #b010 #x0)))",
        "(check-sat)",
        "(get-value (x))",
      ]),
    ).toEqual([
      "sat",
      "((x (fp #b1 #b100 #xb))\n (b #xcb))",
      "sat",
      "((x (fp #b0 #b010 #x0))\n (y (fp #b0 #b000 #x1)))",
      "sat",
      "((x (fp #b0 #b010 #x1)))",
    ]);
  });

  it("answers arrays with sat.euf's array solver", () => {
    const header = [
      "(set-option :sat.euf true)",
      "(set-option :tactic.default_tactic smt)",
      "(declare-const a (Array Int Int))",
    ];
    expect(
      run([
        ...header,
        "(declare-const b (Array Int Int))",
        "(declare-const i Int)",
        "(declare-const j Int)",
        "(assert (= (store a i 1) (store b j 2)))",
        "(assert (not (= i j)))",
        "(check-sat)",
        "(get-value (i j (select a j) (select b i)))",
        "(reset)",
        ...header,
        "(declare-const b (Array Int Int))",
        "(assert (= (default a) 1))",
        "(assert (= b (store a 2 3)))",
        "(assert (= (select b 5) 4))",
        "(check-sat)",
        "(get-model)",
        "(reset)",
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(declare-const a (Array (_ BitVec 8) (_ BitVec 8)))",
        "(declare-const i (_ BitVec 8))",
        "(assert (= (bvadd (select a i) (select a (bvadd i #x01))) #x10))",
        "(assert (bvugt (select a i) #x0a))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      "((i (- 23921))\n (j 8365)\n ((select a j) 2)\n ((select b i) 1))",
      "sat",
      [
        "(",
        "  (define-fun a () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 1) 5 4))",
        "  (define-fun b () (Array Int Int)",
        "    (store (store ((as const (Array Int Int)) 1) 5 4) 2 3))",
        ")",
      ].join("\n"),
      "sat",
      [
        "(",
        "  (define-fun i () (_ BitVec 8)",
        "    #x7f)",
        "  (define-fun a () (Array (_ BitVec 8) (_ BitVec 8))",
        "    (store ((as const (Array (_ BitVec 8) (_ BitVec 8))) #x80) #x80 #x90))",
        ")",
      ].join("\n"),
    ]);
  });

  it("gives up on the string terms sat.euf has no solver for", () => {
    expect(
      run([
        "(set-option :auto_config false)",
        "(set-option :smt.mbqi true)",
        "(set-option :produce-unsat-cores true)",
        "(set-option :sat.random_seed 5)",
        "(set-option :sat.euf true)",
        "(declare-const s0 String)",
        "(declare-const s1 String)",
        "(declare-const s2 String)",
        "(assert (! (not (not (str.is_digit (str.at s2 (- 1))))) :named a0))",
        '(assert (! (str.<= (str.from_int (str.indexof s0 s1 2)) (ite (str.is_digit (str.replace_all s0 s1 "")) (str.substr s0 (- 3) (- 3)) (str.from_code 0))) :named a1))',
        '(assert (! (and (str.in_re (str.replace s0 "00" s1) (re.union (re.range "b" "b") (re.range "b" "c"))) (xor (str.suffixof s1 s0) (str.suffixof (str.at s1 (- 3)) (str.replace s2 s0 "")))) :named a2))',
        '(assert (not (=> (str.suffixof (str.from_int (- 1)) (str.replace s2 s2 s2)) (distinct (str.replace_all s0 s0 "c") s1))))',
        "(check-sat)",
        "(get-model)",
        "(get-info :reason-unknown)",
        "(get-model)",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "unknown",
      '(error "line 14 column 10: model is not available")',
      [
        '(:reason-unknown "(sat.giveup interpreted functions sent to SAT solver (declare-fun str.is_digit (String) Bool)',
        "(declare-fun s0 () String)",
        "(declare-fun s1 () String)",
        "(declare-fun String () String)",
        "(declare-fun str.replace_all (String String String) String)",
        "(declare-fun str.indexof (String String Int) Int)",
        "(declare-fun str.from_int (Int) String)",
        "(declare-fun str.< (String String) Bool)",
        "(declare-fun String () String)",
        "(declare-fun str.in_re (String (RegEx String)) Bool)",
        "(declare-fun String () String)",
        "(declare-fun str.replace (String String String) String)",
        "(declare-fun String () String)",
        "(declare-fun String () String)",
        "(declare-fun re.range (String String) (RegEx String))",
        "(declare-fun str.suffixof (String String) Bool)",
        "(declare-fun ite (Bool String String) String)",
        ')")',
      ].join("\n"),
      '(error "line 16 column 10: model is not available")',
      '(error "line 17 column 15: unsat core is not available")',
    ]);
  });

  it("answers datatypes with sat.euf's datatype solver", () => {
    const header = ["(set-option :sat.euf true)", "(set-option :tactic.default_tactic smt)"];
    expect(
      run([
        ...header,
        "(declare-datatypes ((P 0)) (((mk (fst Int) (snd Bool)))))",
        "(declare-const p P)",
        "(declare-const q P)",
        "(assert (= (fst p) 3))",
        "(assert (not (= p q)))",
        "(assert (= (fst q) 3))",
        "(check-sat)",
        "(get-model)",
        "(reset)",
        ...header,
        "(declare-datatypes ((T 0)) (((leaf (v Int)) (node (kids (Array Int T))))))",
        "(declare-const x T)",
        "(declare-const y T)",
        "(assert (= x (node (store (kids y) 0 (leaf 3)))))",
        "(assert ((_ is node) y))",
        "(check-sat)",
        "(get-model)",
        "(reset)",
        ...header,
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-const x L)",
        "(declare-const y L)",
        "(assert (= x (cons 1 y)))",
        "(assert (= y (cons 2 x)))",
        "(check-sat)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun q () P",
        "    (mk 3 true))",
        "  (define-fun p () P",
        "    (mk 3 false))",
        ")",
      ].join("\n"),
      "sat",
      [
        "(",
        "  (define-fun y () T",
        "    (node (store ((as const (Array Int T)) (leaf 0)) 0 (leaf 3))))",
        "  (define-fun x () T",
        "    (node (store ((as const (Array Int T)) (leaf 0)) 0 (leaf 3))))",
        ")",
      ].join("\n"),
      "unsat",
    ]);
  });

  // The first case is z3test's regressions/issues/5454.smt2.
  it("answers recursive functions with sat.euf's recfun solver", () => {
    const header = ["(set-option :sat.euf true)", "(set-option :tactic.default_tactic smt)"];
    expect(
      run([
        ...header,
        "(define-funs-rec ((f () Int) (pred ((y Int)) Bool)) (0 (ite (< y 0) false (ite (= y 0) true (pred (- y 2))))))",
        "(assert (not (pred 5)))",
        "(check-sat)",
        "(get-value ((pred 5) (pred 4) (pred 3)))",
        "(get-info :rlimit)",
        "(reset)",
        ...header,
        "(define-fun-rec len ((n Int)) Int (ite (<= n 0) 0 (+ 1 (len (- n 1)))))",
        "(declare-const x Int)",
        "(assert (= (len x) 4))",
        "(check-sat)",
        "(get-value (x))",
        "(get-info :rlimit)",
        "(reset)",
        ...header,
        "(define-fun-rec even ((n Int)) Bool (ite (= n 0) true (ite (= n 1) false (even (- n 2)))))",
        "(assert (even 7))",
        "(check-sat)",
        "(get-info :rlimit)",
        "(reset)",
        ...header,
        "(define-fun-rec f ((n Int)) Int (ite (<= n 0) 1 (* 2 (f (- n 1)))))",
        "(declare-const x Int)",
        "(assert (> (f x) 100))",
        "(assert (< x 10))",
        "(check-sat)",
        "(get-value (x (f x)))",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      ["(((pred 5) false)", " ((pred 4) true)", " ((pred 3) false))"].join("\n"),
      "(:rlimit 603)",
      "sat",
      "((x 4))",
      "(:rlimit 882)",
      "unsat",
      "(:rlimit 143)",
      "sat",
      ["((x 7)", " ((f x) 128))"].join("\n"),
      "(:rlimit 1921)",
    ]);
  });

  it("answers unknown when sat.euf's recfun research drops the assumptions, as Z3 does", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(define-fun-rec len ((n Int)) Int (ite (<= n 0) 0 (+ 1 (len (- n 1)))))",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(assert (=> p (= (len x) 3)))",
        "(check-sat-assuming (p))",
        "(get-info :rlimit)",
        "(get-info :reason-unknown)",
        "(get-model)",
        "(get-value (p))",
      ]),
    ).toEqual([
      "unknown",
      "(:rlimit 88)",
      '(:reason-unknown "no reason given")',
      [
        "(",
        "  (define-fun p () Bool",
        "    false)",
        "  (define-fun x () Int",
        "    (- 8855))",
        ")",
      ].join("\n"),
      "((p false))",
    ]);
  });

  it("answers unknown where sat.euf's recfun research drops a named assertion and Z3 answers sat", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(define-fun-rec len ((n Int)) Int (ite (<= n 0) 0 (+ 1 (len (- n 1)))))",
        "(declare-const x Int)",
        "(assert (! (= (len x) 3) :named a))",
        "(assert (< x 2))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(get-value (a x (len x)))",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "unknown",
      '(:reason-unknown "no reason given")',
      ["((a false)", " (x (- 11797))", " ((len x) 0))"].join("\n"),
      "(:rlimit 170)",
    ]);
  });

  it("validates the sat.euf model each time the incremental sat solver builds it", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (=> p (and (> x 3) (< (+ x y) 2))))",
        "(check-sat-assuming (p))",
        "(get-info :rlimit)",
        "(get-model)",
        "(get-info :rlimit)",
        "(get-value (p (+ x y)))",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 53)",
      [
        "(",
        "  (define-fun p () Bool",
        "    true)",
        "  (define-fun x () Int",
        "    4)",
        "  (define-fun y () Int",
        "    (- 21241))",
        ")",
      ].join("\n"),
      "(:rlimit 64)",
      ["((p true)", " ((+ x y) (- 21237)))"].join("\n"),
      "(:rlimit 78)",
    ]);
  });

  it("skips validating the sat.euf model under smt.arith.ignore_int", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(set-option :smt.arith.ignore_int true)",
        "(declare-const x Int)",
        "(declare-const y Int)",
        "(declare-const p Bool)",
        "(assert (=> p (and (> x 3) (< (+ x y) 2))))",
        "(check-sat-assuming (p))",
        "(get-info :rlimit)",
        "(get-model)",
        "(get-info :rlimit)",
        "(get-value (p (+ x y)))",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      "(:rlimit 53)",
      [
        "(",
        "  (define-fun p () Bool",
        "    true)",
        "  (define-fun x () Int",
        "    4)",
        "  (define-fun y () Int",
        "    (- 21241))",
        ")",
      ].join("\n"),
      "(:rlimit 57)",
      ["((p true)", " ((+ x y) (- 21237)))"].join("\n"),
      "(:rlimit 64)",
    ]);
  });

  it("completes an array-ext interpretation so its witnesses drop from the model", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(declare-const a (Array Int Int))",
        "(declare-const b (Array Int Int))",
        "(declare-const i Int)",
        "(assert (= (store a i 1) (store b i 1)))",
        "(assert (not (= a b)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun a () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 2) 0 8367))",
        "  (define-fun b () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 2) 0 1))",
        "  (define-fun i () Int",
        "    0)",
        ")",
      ].join("\n"),
    ]);
  });

  it("prints a sat.euf universe in the order its values were made", () => {
    expect(
      run([
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(declare-sort U 0)",
        "(declare-fun a (U) U)",
        "(declare-const x U)",
        "(declare-const y U)",
        "(assert (= (a x) y))",
        "(assert (= (a y) x))",
        "(assert (not (= x y)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
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
        "  (define-fun x () U",
        "    U!val!0)",
        "  (define-fun y () U",
        "    U!val!1)",
        "  (define-fun a ((x!1 U)) U",
        "    (ite (= x!1 U!val!0) U!val!1",
        "    (ite (= x!1 U!val!1) U!val!0",
        "      #unspecified)))",
        ")",
      ].join("\n"),
    ]);
  });

  describe("lists the universes of several sorts in the hash order of a model's sort map", () => {
    const getUniverseHeaders = (output: string[]) =>
      output
        .flatMap((text) => text.split("\n"))
        .filter((line) => line.startsWith("  ;; universe for"));
    const TWO_SORTS = [
      "(declare-sort Key 0)",
      "(declare-sort B 0)",
      "(declare-const x Key)",
      "(declare-const y Key)",
      "(declare-const u B)",
      "(declare-const v B)",
    ];

    it("as model::copy copies the smt kernel's model", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(assert (not (= x y)))",
            "(assert (not (= u v)))",
            "(check-sat)",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for B:", "  ;; universe for Key:"]);
    });

    it("as sat.euf's user_sort registers them", () => {
      expect(
        getUniverseHeaders(
          run([
            "(set-option :sat.euf true)",
            "(declare-sort A 0)",
            "(declare-sort B 0)",
            "(declare-sort U 0)",
            "(declare-const x0 A)",
            "(declare-const y0 A)",
            "(declare-const x1 B)",
            "(declare-const y1 B)",
            "(declare-const x2 U)",
            "(declare-const y2 U)",
            "(assert (not (= x0 y0)))",
            "(assert (not (= x1 y1)))",
            "(assert (not (= x2 y2)))",
            "(check-sat)",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for B:", "  ;; universe for A:", "  ;; universe for U:"]);
    });

    it("as generic_model_converter registers the sorts of eliminated constants", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(assert (= x y))",
            "(assert (= u v))",
            "(check-sat-using (then simplify solve-eqs smt))",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for B:", "  ;; universe for Key:"]);
    });

    it("as fpa2bv_model_converter copies them in the source model's order", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(declare-const z (_ FloatingPoint 3 5))",
            "(assert (not (= x y)))",
            "(assert (not (= u v)))",
            "(assert (fp.isNormal z))",
            "(check-sat-using (then fpa2bv smt))",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for B:", "  ;; universe for Key:"]);
    });

    it("as bit_blaster_model_converter copies them again, in the copy's hash order", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(declare-const bv (_ BitVec 2))",
            "(assert (not (= x y)))",
            "(assert (not (= u v)))",
            "(assert (bvult bv #b10))",
            "(check-sat-using (then bit-blast smt))",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for Key:", "  ;; universe for B:"]);
    });

    it("as ackr_model_converter copies them again, in the copy's hash order", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(assert (not (= x y)))",
            "(assert (not (= u v)))",
            "(check-sat-using (then ackermannize_bv smt))",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for Key:", "  ;; universe for B:"]);
    });

    it("as eq2bv's model converter copies them again, in the copy's hash order", () => {
      expect(
        getUniverseHeaders(
          run([
            ...TWO_SORTS,
            "(declare-const i Int)",
            "(assert (not (= x y)))",
            "(assert (not (= u v)))",
            "(assert (and (<= 0 i) (<= i 2)))",
            "(assert (not (= i 1)))",
            "(assert (not (= i 0)))",
            "(check-sat-using (then eq2bv smt))",
            "(get-model)",
          ]),
        ),
      ).toEqual(["  ;; universe for Key:", "  ;; universe for B:"]);
    });
  });

  it("orders sat.euf model dependencies by expression id", () => {
    expect(
      run([
        "(set-logic ALL)",
        "(set-option :sat.euf true)",
        "(set-option :tactic.default_tactic smt)",
        "(declare-sort U 0)",
        "(declare-const a (Array U U))",
        "(declare-const x U)",
        "(declare-const y U)",
        "(assert (= (select a x) y))",
        "(assert (= (select a y) x))",
        "(assert (not (= x y)))",
        "(check-sat)",
        "(get-value (x y (select a x)))",
      ]),
    ).toEqual(["sat", "((x U!val!1)\n (y U!val!0)\n ((select a x) U!val!0))"]);
  });

  // z3test's regressions/issues/5482.smt2, and quantifiers whose model-based instantiation projects
  // its variables, with what Z3 prints for them.
  it("projects sat.euf's model-based instantiations through the theories", () => {
    const header = [
      "(set-option :sat.euf true)",
      "(set-option :tactic.default_tactic smt)",
      "(set-option :model_validate true)",
    ];
    expect(
      run([
        ...header,
        "(declare-fun A () (Array (_ FloatingPoint 2 2) (_ FloatingPoint 2 2)))",
        "(declare-fun A2 () (Array (_ FloatingPoint 2 2) (_ FloatingPoint 2 2)))",
        "(assert (forall ((AP (_ FloatingPoint 2 2))) (forall ((D (Array Int (Array Int (_ FloatingPoint 2 2))))) (and (not (= A A2)) (= (select (D 0) 1) (_ +oo 2 2)) (= (select A (_ +oo 2 2)) (select A (_ -oo 2 2)))))))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-const a Int)",
        "(declare-const b Int)",
        "(assert (forall ((x Int)) (or (< x a) (> x b))))",
        "(check-sat)",
        "(get-model)",
        "(reset)",
        ...header,
        "(declare-const a Int)",
        "(assert (forall ((x Int)) (or (< x a) (= (div x 2) 5) (> x (+ a 10)))))",
        "(check-sat)",
        "(reset)",
        ...header,
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(declare-const l L)",
        "(assert (forall ((m L)) (not (= (cons 1 m) l))))",
        "(assert ((_ is cons) l))",
        "(check-sat)",
        "(get-value (l))",
      ]),
    ).toEqual([
      "unsat",
      "sat",
      [
        "(",
        "  (define-fun b () Int",
        "    0)",
        "  (define-fun a () Int",
        "    1)",
        "  (define-fun x!0 () Int",
        "    1)",
        ")",
      ].join("\n"),
      "unsat",
      "sat",
      "((l (cons 0 nil)))",
    ]);
  });

  it("projects the arguments of sat.euf's functions onto the values they have", () => {
    const header = [
      "(set-option :sat.euf true)",
      "(set-option :tactic.default_tactic smt)",
      "(set-option :model_validate true)",
      "(declare-fun f (Int) Int)",
    ];
    expect(
      run([
        ...header,
        "(assert (forall ((x Int) (y Int)) (=> (<= x y) (<= (f x) (f y)))))",
        "(assert (= (f 0) 0))",
        "(assert (= (f 4) 2))",
        "(check-sat)",
        "(get-model)",
        "(reset)",
        ...header,
        "(assert (forall ((x Int)) (=> (and (<= 0 x) (<= x 3)) (= (f x) (* 2 x)))))",
        "(assert (= (f 2) 5))",
        "(check-sat)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun x!2 () Int",
        "    2)",
        "  (define-fun y!3 () Int",
        "    2)",
        "  (define-fun f ((x!0 Int)) Int",
        "    (ite (<= 4 x!0) 2 0))",
        ")",
      ].join("\n"),
      "unsat",
    ]);
  });

  it("keeps a term under 64 bound variables apart from its neighbour under none", () => {
    const binders = Array.from({ length: 64 }, (_unused, index) => `(y${index} Int)`).join(" ");
    const forall = `(forall (${binders}) (R x y0))`;
    const exists = `(exists (${binders}) (R x y0))`;
    expect(
      run([
        "(declare-fun P (Int) Bool)",
        "(declare-fun R (Int Int) Bool)",
        `(simplify (forall ((x Int)) (let ((t (and ${forall} ${exists}))) (exists ((z Int)) (and (P z) t)))))`,
        `(dbg-used-vars (forall ((x Int)) (and (or ${forall} ${exists}) (or ${forall} (P 0)))))`,
        `(assert (forall ((x Int)) (let ((t (or (forall (${binders}) (= x y0)) (exists (${binders}) (= x y0))))) (exists ((z Int)) t))))`,
        "(check-sat)",
      ]),
    ).toEqual([
      [
        "(forall ((x Int))",
        "  (exists ((z Int))",
        "    (and (P z) (forall ((y0 Int)) (R x y0)) (exists ((y0 Int)) (R x y0)))))",
      ].join("\n"),
      "(vars\n  (0      Int))",
      "sat",
    ]);
  });

  it("reports a malformed # literal and skips a #| |# comment", () => {
    expect(
      run([
        "(assert (= #xfg #x0))",
        "(assert (= #x #x0))",
        "(assert (= #b #b0))",
        "(assert (= #q12 #x0))",
        '(echo "a") #| (echo "b")',
        "|# (assert q)",
        "(simplify (bvadd #xA5 #b10100101))",
      ]),
    ).toEqual([
      '(error "line 1 column 15: unknown constant g")',
      '(error "line 2 column 13: invalid empty bit-vector literal")',
      '(error "line 3 column 13: invalid empty bit-vector literal")',
      "(error \"line 4 column 12: invalid bit-vector literal, expecting 'x' or 'b'\")",
      "a",
      '(error "line 6 column 11: unknown constant q")',
      "#x4a",
    ]);
  });

  it("takes only an integer exponent for an even power", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(declare-const y Real)",
        "(simplify (>= (* (^ x 2.0) (^ y 2.0)) 0.0))",
      ]),
    ).toEqual(["(or (= (>= (^ x 2.0) 0.0) (>= (^ y 2.0) 0.0)) (= x 0.0) (= y 0.0))"]);
  });

  it("keeps the bounds of a variable that fm finds under a quantifier", () => {
    expect(
      run([
        "(declare-const x Real)",
        "(declare-fun f (Real) Real)",
        "(assert (forall ((y Real)) (! (> (f y) x) :pattern ((f y)))))",
        "(assert (<= (f 0.0) 0.0))",
        "(assert (>= x 1.0))",
        "(apply fm)",
        "(check-sat-using (then fm smt))",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (forall ((y Real)) (! (not (<= (+ (f y) (* (- 1.0) x)) 0.0)) :pattern ((f y))))",
        "  (<= (f 0.0) 0.0)",
        "  (>= x 1.0)",
        "  :precision precise :depth 2)",
        ")",
      ].join("\n"),
      "unsat",
    ]);
  });

  it("leaves fp.isInfinite and fp.isNormal of an integer whose overflow bound is too large", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(simplify (fp.isInfinite ((_ to_fp 40 8) RNE (to_real x))))",
        "(simplify (fp.isNormal ((_ to_fp 40 8) RNE (to_real x))))",
      ]),
    ).toEqual([
      "(fp.isInfinite ((_ to_fp 40 8) roundNearestTiesToEven (to_real x)))",
      "(fp.isNormal ((_ to_fp 40 8) roundNearestTiesToEven (to_real x)))",
    ]);
  });

  it("orders an unsat core by expression id, not by where the expression is stored", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const r Bool)",
        "(declare-const s Bool)",
        "(simplify (and p p (> x 2)))",
        "(simplify (and p p (> x 3)))",
        "(simplify (and p p (> x 2)))",
        "(assert (or (not q) (not r) (not s) (not p)))",
        "(check-sat-assuming (q r s p))",
        "(get-unsat-core)",
      ]),
    ).toEqual([
      "(and p (not (<= x 2)))",
      "(and p (not (<= x 3)))",
      "(and p (not (<= x 2)))",
      "unsat",
      "(q r s p)",
    ]);
  });

  it("reports a command Z3 does not know, also one named like a property of Object", () => {
    expect(
      run([
        "(constructor)",
        "(toString 1 (2 3))",
        "(__proto__)",
        "(asert (> 1 0))",
        "(set-option :print-success true)",
        "(foo)",
        '(echo "x")',
      ]),
    ).toEqual([
      "unsupported",
      "; constructor line: 1 position: 13",
      "unsupported",
      "; toString line: 2 position: 17",
      "unsupported",
      "; __proto__ line: 3 position: 10",
      "unsupported",
      "; asert line: 4 position: 14",
      "success",
      "unsupported",
      "; foo line: 6 position: 4",
      "x",
    ]);
  });

  it("reports an answer that differs from the one set-info :status announces, also after reset", () => {
    expect(
      run([
        "(set-info :status unsat)",
        "(declare-const p Bool)",
        "(assert p)",
        "(check-sat)",
        "(get-model)",
        "(set-info :status sat)",
        "(check-sat-assuming ((not p)))",
        "(check-sat-using smt)",
        "(set-info :status foo)",
        "(set-info :status)",
        "(set-info :status (unsat))",
        "(set-info status sat)",
        "(set-info :status unknown :x)",
        "(check-sat-assuming ((not p)))",
        "(set-info :status sat)",
        "(reset)",
        "(assert false)",
        "(check-sat-using simplify)",
      ]),
    ).toEqual([
      "sat",
      '(error "line 4 column 10: check annotation that says unsat")',
      "(\n  (define-fun p () Bool\n    true)\n)",
      "unsat",
      '(error "line 7 column 29: check annotation that says sat")',
      "sat",
      "(error \"line 9 column 18: invalid ':status' attribute\")",
      '(error "line 10 column 17: invalid command, argument(s) missing")',
      '(error "line 11 column 18: invalid option value")',
      '(error "line 12 column 10: invalid command argument, keyword expected")',
      '(error "line 13 column 26: invalid command, too many arguments")',
      "unsat",
      "unsat",
      '(error "line 18 column 25: check annotation that says sat")',
    ]);
  });

  it("rejects apply and check-sat-using under both proofs and unsat cores, and keeps the last check", () => {
    const error = "Frontend does not support simultaneous generation of proofs and unsat cores";
    expect(
      run([
        "(set-option :produce-proofs true)",
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(assert (> x 2))",
        "(check-sat)",
        "(apply simplify)",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      `(error "line 6 column 15: ${error}")`,
      `(error "line 7 column 20: ${error}")`,
      '(:reason-unknown "")',
      "(\n  (define-fun x () Int\n    3)\n)",
    ]);
  });

  it("keeps the answer of the last check across reset-assertions", () => {
    expect(
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(declare-const b Bool)",
        "(assert (! (> x 2) :named a1))",
        "(check-sat)",
        "(reset-assertions)",
        "(get-info :reason-unknown)",
        "(get-model)",
        "(get-value (x))",
        "(assert (! (< x 0) :named a2))",
        "(assert (! (> x 0) :named a3))",
        "(check-sat)",
        "(reset-assertions)",
        "(get-unsat-core)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      '(:reason-unknown "unknown")',
      "(\n  (define-fun a1 () Bool\n    (> x 2))\n  (define-fun x () Int\n    3)\n  (define-fun b () Bool\n    false)\n)",
      "((x 3))",
      "unsat",
      "(a2 a3)",
      '(error "line 15 column 10: model is not available")',
    ]);
  });

  it("gives the reason of inc_sat_solver after an answer of the finite-domain or bit-vector solver", () => {
    expect(
      run([
        "(set-logic QF_FD)",
        "(declare-const b Bool)",
        "(assert b)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-assuming ((not b)))",
        "(get-info :reason-unknown)",
        "(reset)",
        "(set-option :produce-unsat-cores true)",
        "(set-logic QF_BV)",
        "(declare-const v (_ BitVec 4))",
        "(assert (! (= v #x1) :named a0))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using smt)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      "sat",
      '(:reason-unknown "no reason given")',
      "unsat",
      '(:reason-unknown "no reason given")',
      "sat",
      '(:reason-unknown "no reason given")',
      "sat",
      '(:reason-unknown "")',
    ]);
  });

  it("answers unknown for formulas outside the logic that the smt setup rejects", () => {
    const reason =
      "Benchmark contains uninterpreted function symbols, but specified logic does not support them.";
    expect(
      run([
        "(set-logic QF_LIA)",
        "(declare-const x Int)",
        "(assert (>= (div x 0) 1))",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(check-sat-using (or-else smt skip))",
        "(get-info :reason-unknown)",
        "(apply smt)",
        "(minimize x)",
        "(check-sat)",
        "(get-info :reason-unknown)",
        "(reset)",
        "(set-logic QF_LRA)",
        "(declare-const r Real)",
        "(assert (> (/ r 0.0) 2.5))",
        "(check-sat-using qflra)",
        "(get-info :reason-unknown)",
        "(push)",
        "(check-sat)",
      ]),
    ).toEqual([
      "unknown",
      `(:reason-unknown "${reason}")`,
      "unknown",
      `(:reason-unknown "${reason}")`,
      "(goals\n(goal\n  :precision precise :depth 0)\n)",
      `(error "line 10 column 10: ${reason}")`,
      '(:reason-unknown "unknown")',
      "unknown",
      `(:reason-unknown "${reason}")`,
      "sat",
    ]);
  });

  it("sets up no context whose formulas are inconsistent, so its setup rejects nothing", () => {
    expect(
      run([
        "(set-logic QF_LRA)",
        "(declare-const y Real)",
        "(assert (>= y (/ 3.1 0.0)))",
        "(assert (>= y (+ 3.0 y)))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual(["unsat", '(:reason-unknown "")']);
  });

  it("reports where Z3 raises on a datatype whose declaration failed", () => {
    expect(
      run([
        "(declare-datatype Opt ((none) (some (the X))))",
        "(declare-const o Opt)",
        "(declare-const p Opt)",
        "(check-sat)",
        "(get-value (o))",
        "(get-model)",
        "(reset)",
        "(declare-datatype Opt ((none) (some (the X))))",
        "(declare-const o Opt)",
        "(assert (not ((_ is none) o)))",
        "(declare-const p Opt)",
        "(assert (distinct o p))",
        "(check-sat)",
        "(get-info :reason-unknown)",
      ]),
    ).toEqual([
      `(error "line 1 column 19: invalid datatype declaration, unknown sort 'X'")`,
      "sat",
      '((error "line 5 column 14: datatype constructors have not been created")',
      '(error "line 6 column 10: constructor not available")',
      `(error "line 8 column 18: invalid datatype declaration, unknown sort 'X'")`,
      '(error "line 10 column 27: datatype constructors have not been created")',
      "unknown",
      '(:reason-unknown "constructor not available")',
    ]);
  });

  it("forgets the constructors of a datatype at a pop, as the datatype plugin does", () => {
    expect(
      run([
        "(declare-datatype Opt ((none) (some (the X))))",
        "(declare-const o Opt)",
        "(push)",
        "(check-sat)",
        "(get-model)",
        "(pop)",
        "(check-sat)",
        "(get-model)",
        "(get-model)",
      ]),
    ).toEqual([
      `(error "line 1 column 19: invalid datatype declaration, unknown sort 'X'")`,
      "sat",
      '(error "line 5 column 10: datatype constructors have not been created")',
      "sat",
      '(error "line 8 column 10: datatype constructors have not been created")',
      '(error "line 9 column 10: constructor not available")',
    ]);
  });

  it("orders div0 and mod0 in a model by the hashes of their declarations", () => {
    expect(
      run([
        "(declare-const x Int)",
        "(assert (distinct 5 (div x 0)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun x () Int\n    21238)",
        "  (define-fun mod0 ((x!0 Int) (x!1 Int)) Int\n    0)",
        "  (define-fun div0 ((x!0 Int) (x!1 Int)) Int\n    0)",
        ")",
      ].join("\n"),
    ]);
  });

  it("takes an array's default from its selects in the order of the hashes of their indices", () => {
    expect(
      run([
        "(declare-const a (Array Int Int))",
        "(assert (= (select a 5) 10))",
        "(assert (= (select a 1) 11))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun a () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 11) 5 10))",
        ")",
      ].join("\n"),
    ]);
  });

  it("assigns the Boolean macros in the order of cmd_context's dictionary, which a pop does not shrink", () => {
    expect(
      run([
        "(declare-const p Bool)",
        "(declare-const q Bool)",
        "(declare-const x Int)",
        "(define-fun d1 () Bool (> x 2))",
        "(define-fun d2 () Int x)",
        "(assert (! (or p q) :named a0))",
        "(assert (! (> x 5) :named zz))",
        "(assert (! (not q) :named a1))",
        "(assert (! (=> q p) :named b))",
        "(check-sat)",
        "(get-assignment)",
        "(push)",
        "(define-fun d3 () Bool (< x 0))",
        "(assert (! true :named c9))",
        "(get-assignment)",
        "(pop)",
        "(check-sat)",
        "(get-assignment)",
      ]),
    ).toEqual([
      "sat",
      "((a0 true) (d1 true) (a1 true) (zz true) (b true))",
      '(error "line 15 column 15: model is not available")',
      "sat",
      "((b true) (a1 true) (a0 true) (d1 true) (zz true))",
    ]);
  });

  it("completes the model in the order of cmd_context's func decl dictionary, which a pop does not shrink", () => {
    expect(
      run([
        ...["a", "b", "c", "d", "e", "f", "g"].map((name) => `(declare-fun ${name} () Int)`),
        "(push 1)",
        "(declare-fun w () Int)",
        "(pop 1)",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        ...["f", "b", "a", "d", "g", "c", "e"].flatMap((name) => [
          `  (define-fun ${name} () Int`,
          "    0)",
        ]),
        ")",
      ].join("\n"),
    ]);
  });

  it("answers QF_BV in scopes with inc_sat_solver, whose bit-blaster pops with them", () => {
    expect(
      run([
        "(set-logic QF_BV)",
        "(declare-const b0 Bool)",
        "(declare-const v0 (_ BitVec 3))",
        "(push)",
        "(assert (distinct v0 #b101))",
        "(assert b0)",
        "(check-sat)",
        "(get-model)",
        "(pop)",
        "(declare-const v1 (_ BitVec 2))",
        "(assert (= ((_ extract 1 0) v0) (bvnot v1)))",
        "(assert (bvult v1 #b01))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun b0 () Bool\n    true)",
        "  (define-fun v0 () (_ BitVec 3)\n    #b000)",
        ")",
      ].join("\n"),
      "sat",
      [
        "(",
        "  (define-fun v1 () (_ BitVec 2)\n    #b00)",
        "  (define-fun v0 () (_ BitVec 3)\n    #b011)",
        "  (define-fun b0 () Bool\n    false)",
        ")",
      ].join("\n"),
    ]);
  });

  it("gives an array of bit-vectors the default of a bit-vector value made before it", () => {
    expect(
      run([
        "(declare-const v0 (_ BitVec 4))",
        "(declare-const a0 (Array (_ BitVec 4) (_ BitVec 4)))",
        "(assert (not (= v0 (select (store a0 v0 v0) #x0))))",
        "(check-sat-using smt)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun v0 () (_ BitVec 4)\n    #x1)",
        "  (define-fun a0 () (Array (_ BitVec 4) (_ BitVec 4))\n    (store ((as const (Array (_ BitVec 4) (_ BitVec 4))) #x1) #x0 #x0))",
        ")",
      ].join("\n"),
    ]);
  });

  it("interprets array-ext in the model and keeps the arrays it compares", () => {
    expect(
      run([
        "(set-option :produce-models true)",
        "(declare-const a0 (Array Int Int))",
        "(declare-const a1 (Array Int Int))",
        "(declare-const i0 Int)",
        "(declare-const i1 Int)",
        "(assert (not (= a1 (store a1 (select a0 i0) i1))))",
        "(assert (not (= (store a0 (select a1 i1) (select a1 i1)) a1)))",
        "(check-sat)",
        "(get-model)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun a0 () (Array Int Int)",
        "    (store (store ((as const (Array Int Int)) 3) 9 11) 4 7))",
        "  (define-fun a1 () (Array Int Int)",
        "    (store (store (store ((as const (Array Int Int)) 2) 5 6) 9 10) 7 8))",
        "  (define-fun i1 () Int",
        "    5)",
        "  (define-fun i0 () Int",
        "    4)",
        "  (define-fun k!3 ((x!0 Int)) Int",
        "    (ite (= x!0 6) 6",
        "    (ite (= x!0 9) 11",
        "    (ite (= x!0 4) 7",
        "      3))))",
        "  (define-fun k!0 ((x!0 Int)) Int",
        "    (ite (= x!0 5) 6",
        "    (ite (= x!0 9) 10",
        "    (ite (= x!0 7) 8",
        "      2))))",
        ")",
      ].join("\n"),
    ]);
  });

  it("expands a select of a store as it asserts the formula", () => {
    expect(
      run([
        "(set-option :produce-models true)",
        "(declare-const a0 (Array Int Int))",
        "(declare-const i0 Int)",
        "(assert (< (select (store a0 2 -1) i0) 0))",
        "(check-sat)",
        "(get-info :rlimit)",
      ]),
    ).toEqual(["sat", "(:rlimit 224)"]);
  });

  it("counts the steps of a model cleanup as Z3 does", () => {
    expect(
      run([
        "(declare-const a0 (Array Int Int))",
        "(declare-const a2 (Array Int Int))",
        "(declare-const i0 Int)",
        "(declare-const i1 Int)",
        "(assert (>= (select (store a0 (select a0 i0) i1) 0) 2))",
        "(assert (= a2 a0))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun a0 () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 3) 4 0))",
        "  (define-fun i1 () Int",
        "    2)",
        "  (define-fun i0 () Int",
        "    4)",
        "  (define-fun a2 () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 3) 4 0))",
        ")",
      ].join("\n"),
      "(:rlimit 288)",
    ]);
  });

  it("keeps the array of a function interpretation as Z3 does", () => {
    expect(
      run([
        "(declare-const a0 (Array Int Int))",
        "(declare-const a1 (Array Int Int))",
        "(declare-const a2 (Array Int Int))",
        "(declare-const i0 Int)",
        "(declare-const i1 Int)",
        "(assert (= (store a1 i1 (select a2 i0)) a2))",
        "(assert (= (store a2 i0 i0) a0))",
        "(check-sat)",
        "(get-model)",
        "(get-info :rlimit)",
      ]),
    ).toEqual([
      "sat",
      [
        "(",
        "  (define-fun a1 () (Array Int Int)",
        "    ((as const (Array Int Int)) 2))",
        "  (define-fun i1 () Int",
        "    3)",
        "  (define-fun a2 () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 2) 3 4))",
        "  (define-fun i0 () Int",
        "    3)",
        "  (define-fun a0 () (Array Int Int)",
        "    (store ((as const (Array Int Int)) 2) 3 3))",
        ")",
      ].join("\n"),
      "(:rlimit 270)",
    ]);
  });

  it("throws at a theory it does not implement", () => {
    expect(() =>
      run(["(declare-const b (_ BitVec 8))", '(assert (= (str.from_ubv b) "12"))', "(check-sat)"]),
    ).toThrow(SmtUnsupportedError);
  });

  it("throws at a command it does not implement", () => {
    expect(() => run(["(check-sat)", "(get-proof)"])).toThrow(SmtUnsupportedError);
  });
});
