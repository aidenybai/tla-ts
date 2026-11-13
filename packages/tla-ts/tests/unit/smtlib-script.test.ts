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

  it("throws at the dependencies of a tactic that drops them", () => {
    expect(() =>
      run([
        "(set-option :produce-unsat-cores true)",
        "(declare-const x Int)",
        "(assert (! (= x 1) :named a))",
        "(apply solve-eqs :print-dependencies true)",
      ]),
    ).toThrow(SmtUnsupportedError);
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
