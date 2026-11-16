import { describe, expect, it } from "vite-plus/test";
import { decideSmt } from "../../src/prover/smt/solver/solver";

const OPTIONS = { timeLimitMs: 5000 };

const DECLARATIONS = [
  "(declare-fun x () Int)",
  "(declare-fun y () Real)",
  "(declare-fun p () Bool)",
  "(declare-fun f (Int Real) Int)",
];

const decideAssertion = (assertion: string) =>
  decideSmt([...DECLARATIONS, `(assert ${assertion})`, "(check-sat)"].join("\n"), OPTIONS);

describe("parseSmtlib builtin operators", () => {
  it.each(["(< 1 2 3)", "(<= 1 1 2)", "(> 3 2 1)", "(>= 2 2 1)", "(= x x x)"])(
    "chains %s into a conjunction of pairs",
    (chain) => {
      expect(decideAssertion(`(not ${chain})`)).toBe("unsat");
    },
  );

  it.each(["(< 1 3 2)", "(= 1 1 2)", "(distinct 1 2 1)"])("refutes %s", (formula) => {
    expect(decideAssertion(formula)).toBe("unsat");
  });

  it("reads - with one argument as negation and with more as subtraction", () => {
    expect(decideAssertion("(not (= (- 3) (- 0 3)))")).toBe("unsat");
    expect(decideAssertion("(not (= (- 7 2 1) 4))")).toBe("unsat");
  });

  it("divides from the left when / takes more than two arguments", () => {
    expect(decideAssertion("(not (= (/ 8.0 2.0 2.0) 2.0))")).toBe("unsat");
  });

  it("coerces integers to reals when an operator mixes them", () => {
    expect(decideAssertion("(not (= (+ x 0.5) (+ 0.5 x)))")).toBe("unsat");
    expect(decideAssertion("(not (= (ite p 1 2.0) (ite p 1.0 2)))")).toBe("unsat");
    expect(decideAssertion("(not (= (f x x) (f x (to_real x))))")).toBe("unsat");
  });

  it.each([
    [
      "(not p p)",
      "Wrong number of arguments (2) passed to function (declare-fun not (Bool) Bool) \narg: p\n\narg: p",
    ],
    [
      "(=> p)",
      "Wrong number of arguments (1) passed to function (declare-fun => (Bool Bool) Bool) \narg: p",
    ],
    ["(ite p 1)", "unknown constant ite (Bool Int) "],
    [
      "(ite 1 2 3)",
      "Sort mismatch at argument #1 for function (declare-fun ite (Bool Int Int) Int) supplied sort is Int",
    ],
    [
      "(= (mod x) 1)",
      "Wrong number of arguments (1) passed to function (declare-fun mod (Int Int) Int) \narg: x",
    ],
    [
      "(= (abs x x) 1)",
      "Wrong number of arguments (2) passed to function (declare-fun abs (Int) Int) \narg: x\n\narg: x",
    ],
    [
      "(and 1 p)",
      "Sort mismatch at argument #1 for function (declare-fun and (Bool Bool) Bool) supplied sort is Int",
    ],
  ])("rejects %s as Z3 does", (formula, message) => {
    expect(() => decideAssertion(formula)).toThrow(
      expect.objectContaining({ name: "SmtParseError", message }),
    );
  });

  it("rejects a declared function applied to the wrong sorts as Z3 does", () => {
    expect(() => decideAssertion("(= (f x) 1)")).toThrow(
      expect.objectContaining({
        name: "SmtParseError",
        message: "unknown constant f (Int) \ndeclared: (declare-fun f (Int Real) Int) ",
      }),
    );
  });

  it("rejects an undeclared function as Z3 does", () => {
    expect(() => decideAssertion("(nope x)")).toThrow(
      expect.objectContaining({ name: "SmtParseError", message: "unknown constant nope (Int) " }),
    );
  });
});
