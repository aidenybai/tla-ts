import { describe, expect, it } from "vite-plus/test";
import { SmtParseError } from "../../src/errors";
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
    ["(not p p)", "not"],
    ["(=> p)", "=>"],
    ["(ite p 1)", "ite"],
    ["(ite 1 2 3)", "ite"],
    ["(= (mod x) 1)", "mod"],
    ["(= (abs x x) 1)", "abs"],
    ["(= (f x) 1)", "f"],
    ["(and 1 p)", "and"],
  ])("rejects %s as an ill-sorted application of %s", (formula, operator) => {
    expect(() => decideAssertion(formula)).toThrow(
      new SmtParseError(`ill-sorted application of ${operator}`),
    );
  });

  it("rejects an undeclared function", () => {
    expect(() => decideAssertion("(nope x)")).toThrow(new SmtParseError("unknown function nope"));
  });
});
