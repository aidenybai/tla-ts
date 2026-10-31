// Decides the text tlapm sends LS4, as LS4 does: unsat when the negated obligation has no model,
// which proves the obligation.

import { TlaSyntaxError } from "../../errors";
import type { DecideOptions, Verdict } from "../verdict";
import { getSatisfiability, type PtlFormula } from "./tableau";

// LS4's input syntax, as tlapm writes it: every operator is parenthesized except the facts of a
// sequent, which are joined by & before ->.
const parseLs4 = (text: string): PtlFormula => {
  const tokens = text.match(/<->|->|[()~&|]|[\w']+|\S/g) ?? [];
  const state = { position: 0 };
  const take = (expected?: string) => {
    const token = tokens[state.position++];
    if (token === undefined || (expected !== undefined && token !== expected))
      throw new TlaSyntaxError(
        `Expected ${expected ?? "a formula"} in LS4 input, found ${token ?? "the end"}`,
      );
    return token;
  };
  const parseUnary = (): PtlFormula => {
    const token = take();
    if (token === "(") {
      const inner = parseEquiv();
      take(")");
      return inner;
    }
    if (token === "~" || token === "not") return { kind: "Not", body: parseUnary() };
    if (token === "always") return { kind: "Always", body: parseUnary() };
    if (token === "sometime") return { kind: "Eventually", body: parseUnary() };
    if (token === "next") return { kind: "Next", body: parseUnary() };
    if (!/^[\w']+$/.test(token))
      throw new TlaSyntaxError(`Expected a formula in LS4 input, found ${token}`);
    return { kind: "Atom", name: token };
  };
  const parseJunction = (operator: string, kind: "And" | "Or", parseOperand: () => PtlFormula) => {
    const operands = [parseOperand()];
    while (tokens[state.position] === operator) {
      take();
      operands.push(parseOperand());
    }
    return operands.reduce((left, right) => ({ kind, left, right }));
  };
  const parseImplies = (): PtlFormula => {
    const left = parseJunction("|", "Or", () => parseJunction("&", "And", parseUnary));
    if (tokens[state.position] !== "->") return left;
    take();
    return { kind: "Implies", left, right: parseImplies() };
  };
  const parseEquiv = (): PtlFormula => {
    const left = parseImplies();
    if (tokens[state.position] !== "<->") return left;
    take();
    return { kind: "Equiv", left, right: parseEquiv() };
  };
  const formula = parseEquiv();
  if (state.position < tokens.length)
    throw new TlaSyntaxError(`Expected the end of LS4 input, found ${tokens[state.position]}`);
  return formula;
};

export const decidePtl = (text: string, options: DecideOptions): Verdict => {
  const deadline = performance.now() + options.timeLimitMs;
  return getSatisfiability(
    parseLs4(text),
    () => options.signal?.aborted === true || performance.now() > deadline,
  );
};
