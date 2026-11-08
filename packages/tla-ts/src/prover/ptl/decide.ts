// Decides the text tlapm sends LS4, as LS4 does: unsat when the negated obligation has no model,
// which proves the obligation.

import { TlaSyntaxError } from "../../errors";
import type { DecideOptions, Verdict } from "../verdict";
import { getSatisfiability, type BinaryKind, type PtlFormula } from "./tableau";

// ptl_to_trp's binary operators, from the loosest.
const BINARY_LEVELS = [
  new Map<string, BinaryKind>([["until", "Until"]]),
  new Map<string, BinaryKind>([["unless", "Unless"]]),
  new Map<string, BinaryKind>([
    ["<=>", "Equiv"],
    ["<->", "Equiv"],
  ]),
  new Map<string, BinaryKind>([["|", "Or"]]),
  new Map<string, BinaryKind>([
    ["=>", "Implies"],
    ["->", "Implies"],
  ]),
  new Map<string, BinaryKind>([["&", "And"]]),
];

const PREFIX_OPERATORS = new Map<string, "Not" | "Always" | "Eventually" | "Next" | "Past">([
  ["~", "Not"],
  ["not", "Not"],
  ["always", "Always"],
  ["sometime", "Eventually"],
  ["next", "Next"],
  ["alwaysp", "Past"],
  ["sometimep", "Past"],
]);

const KEYWORDS = new Set([
  ...PREFIX_OPERATORS.keys(),
  ...BINARY_LEVELS.flatMap((operators) => [...operators.keys()]),
  "True",
  "False",
]);

const RESERVED = /^(skolem|hidden|constant|NV_V\w*|NVV\w*)$/;

const MAX_LS4_IDENTIFIER = 31;

const parseLs4 = (text: string): PtlFormula => {
  const tokens = text.replace(/;.*/g, "").match(/<=>|<->|=>|->|[A-Za-z]\w*|\S/g) ?? [];
  const state = { position: 0 };
  const reject = (reason: string): never => {
    throw new TlaSyntaxError(`LS4 reaches no verdict: ${reason}`);
  };
  const peek = () => tokens[state.position] ?? "";
  const take = (expected?: string) => {
    const token = tokens[state.position++];
    if (token === undefined || (expected !== undefined && token !== expected))
      return reject(`expected ${expected ?? "a formula"}, found ${token ?? "the end"}`);
    return token;
  };
  const checkIdentifier = (token: string) => {
    if (!/^[A-Za-z]/.test(token) || KEYWORDS.has(token))
      reject(`expected an identifier, found ${token}`);
    if (RESERVED.test(token)) reject(`${token} is reserved`);
    return token;
  };
  const takeIdentifier = () => checkIdentifier(take());
  const takeList = () => {
    const items = [takeIdentifier()];
    while (peek() === ",") {
      take();
      items.push(takeIdentifier());
    }
    return items;
  };
  const parsePrefix = (): PtlFormula => {
    const token = take();
    const prefix = PREFIX_OPERATORS.get(token);
    if (prefix !== undefined) {
      const body = parsePrefix();
      return prefix === "Past"
        ? reject(`ptl_to_trp does not translate ${token}`)
        : { kind: prefix, body };
    }
    if (token === "!" || token === "?") {
      take("[");
      // foyacc.mly checks only that the last variable of the list is uppercase.
      const variables = takeList();
      if (!/^[A-Z]/.test(variables[variables.length - 1]))
        reject(`${variables[variables.length - 1]} is not uppercase`);
      take("]");
      return parsePrefix();
    }
    if (token === "(") {
      const inner = parseBinary(0);
      take(")");
      return inner;
    }
    if (token === "True" || token === "False") return { kind: "Constant", value: token === "True" };
    const name = checkIdentifier(token);
    if (peek() === "(") {
      take();
      takeList();
      take(")");
      reject(`LS4 does not read the predicate ${name} with arguments`);
    }
    if (name.length > MAX_LS4_IDENTIFIER) reject(`the identifier ${name} is too long`);
    return { kind: "Atom", name };
  };
  const parseOperators = (level: number, left: PtlFormula): PtlFormula => {
    const kind = BINARY_LEVELS[level].get(peek());
    if (kind === undefined) return left;
    take();
    return parseOperators(level, { kind, left, right: parseBinary(level + 1) });
  };
  const parseBinary = (level: number): PtlFormula =>
    level === BINARY_LEVELS.length ? parsePrefix() : parseOperators(level, parseBinary(level + 1));
  const formula = parseBinary(0);
  if (state.position < tokens.length) reject(`expected the end, found ${peek()}`);
  return formula;
};

export const decidePtl = (text: string, options: DecideOptions): Verdict => {
  const deadline = performance.now() + options.timeLimitMs;
  try {
    return getSatisfiability(
      parseLs4(text),
      () => options.signal?.aborted === true || performance.now() > deadline,
    );
  } catch (error) {
    if (error instanceof TlaSyntaxError) return "unknown";
    throw error;
  }
};
