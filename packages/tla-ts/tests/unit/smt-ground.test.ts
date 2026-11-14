import { describe, expect, it } from "vite-plus/test";
import { runSmtlibScript } from "../../src/prover/smt/solver/smtlib-script";

const run = (lines: string[]) => {
  const output: string[] = [];
  runSmtlibScript(lines.join("\n"), { timeLimitMs: 5000 }, (line) => output.push(line));
  return output;
};

const CLOSED_QUANTIFIER = "(forall ((y Int)) (> (f y) 0))";
const FAILED_PROBE = '(error "tactic failed: fail tactic")';

// Each expected value is what Z3 5.3.2 prints for the script.
describe("a closed term that contains a quantifier is not ground", () => {
  it("keeps a lambda whose body is closed but holds a quantifier", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        `(simplify (lambda ((x Int)) ${CLOSED_QUANTIFIER}))`,
        `(simplify (lambda ((x Int)) (ite ${CLOSED_QUANTIFIER} 1 2)))`,
        "(simplify (lambda ((x Int)) (f 1)))",
      ]),
    ).toEqual([
      "(lambda ((x Int)) (forall ((y Int)) (not (<= (f y) 0))))",
      [
        "(lambda ((x Int))",
        "  (let ((a!1 (forall ((y Int)) (not (<= (f y) 0)))))",
        "    (ite a!1 1 2)))",
      ].join("\n"),
      "((as const (Array Int Int)) (f 1))",
    ]);
  });

  it("does not eliminate an unconstrained variable next to such a term", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-const x Int)",
        `(assert (> (+ x (ite ${CLOSED_QUANTIFIER} 1 2)) 0))`,
        "(apply elim-uncnstr)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (let ((a!1 (ite (forall ((y Int)) (> (f y) 0)) 1 2)))",
        "    (> (+ x a!1) 0))",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("finds no quasi macro whose head has such a term as an argument", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-fun g (Int Int) Int)",
        "(declare-const a Int)",
        `(assert (forall ((x Int)) (= (g x (ite ${CLOSED_QUANTIFIER} 1 2)) (+ x 1))))`,
        "(assert (> (g a 1) 0))",
        "(apply quasi-macros)",
      ]),
    ).toEqual([
      [
        "(goals",
        "(goal",
        "  (forall ((x Int))",
        "    (let ((a!1 (ite (forall ((y Int)) (> (f y) 0)) 1 2)))",
        "      (= (g x a!1) (+ x 1))))",
        "  (> (g a 1) 0)",
        "  :precision precise :depth 1)",
        ")",
      ].join("\n"),
    ]);
  });

  it("does not unfold a recursive function on a constructor that holds such a term", () => {
    expect(
      run([
        "(declare-fun f (Int) Int)",
        "(declare-datatypes ((L 0)) (((nil) (cons (hd Int) (tl L)))))",
        "(define-fun-rec sum ((l L)) Int (ite ((_ is nil) l) 0 (+ (hd l) (sum (tl l)))))",
        "(declare-const u L)",
        `(simplify (sum (cons (ite ${CLOSED_QUANTIFIER} 1 2) nil)))`,
        `(simplify (sum (cons (ite ${CLOSED_QUANTIFIER} 1 2) u)))`,
        "(simplify (sum (cons 1 u)))",
        `(simplify (sum (cons 1 (cons (ite ${CLOSED_QUANTIFIER} 1 2) nil))))`,
      ]),
    ).toEqual([
      [
        "(let ((a!1 (forall ((y Int)) (not (<= (f y) 0)))))",
        "  (sum (cons (ite a!1 1 2) nil)))",
      ].join("\n"),
      [
        "(let ((a!1 (forall ((y Int)) (not (<= (f y) 0)))))",
        "  (sum (cons (ite a!1 1 2) u)))",
      ].join("\n"),
      "(+ 1 (sum u))",
      [
        "(let ((a!1 (forall ((y Int)) (not (<= (f y) 0)))))",
        "  (sum (cons 1 (cons (ite a!1 1 2) nil))))",
      ].join("\n"),
    ]);
  });

  it("fails the nonlinear arithmetic probes on a division of such a term", () => {
    expect(
      run([
        "(declare-const w Real)",
        "(assert (> (/ (ite (forall ((y Real)) (> (* y y) (- 1.0))) 1.0 2.0) 3.0) w))",
        "(apply (if is-nra skip fail))",
        "(apply (if is-nira skip fail))",
      ]),
    ).toEqual([FAILED_PROBE, FAILED_PROBE]);
    expect(
      run([
        "(declare-const w Int)",
        "(assert (> (mod 7 (ite (forall ((y Int)) (> (* y y) (- 1))) 1 2)) w))",
        "(apply (if is-nia skip fail))",
        "(apply (if is-nira skip fail))",
      ]),
    ).toEqual([FAILED_PROBE, FAILED_PROBE]);
  });
});
