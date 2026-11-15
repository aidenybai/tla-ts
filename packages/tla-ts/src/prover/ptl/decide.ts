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

// ptl_to_trp and LS4 reach no verdict on text that this reads as undefined.
const parseLs4 = (text: string): PtlFormula | undefined => {
  const tokens = text.replace(/;.*/g, "").match(/<=>|<->|=>|->|[A-Za-z]\w*|\S/g) ?? [];
  let position = 0;
  const isIdentifier = (token: string | undefined): token is string =>
    token !== undefined && /^[A-Za-z]/.test(token) && !KEYWORDS.has(token) && !RESERVED.test(token);
  const takeList = () => {
    const items: string[] = [];
    for (;;) {
      const token = tokens[position++];
      if (!isIdentifier(token)) return undefined;
      items.push(token);
      if (tokens[position] !== ",") return items;
      position += 1;
    }
  };
  const parsePrefix = (): PtlFormula | undefined => {
    const token = tokens[position++];
    if (token === undefined) return undefined;
    const prefix = PREFIX_OPERATORS.get(token);
    if (prefix !== undefined) {
      const body = parsePrefix();
      // ptl_to_trp does not translate the past operators.
      return body === undefined || prefix === "Past" ? undefined : { kind: prefix, body };
    }
    if (token === "!" || token === "?") {
      if (tokens[position++] !== "[") return undefined;
      const variables = takeList();
      // foyacc.mly checks only that the last variable of the list is uppercase.
      return variables !== undefined &&
        /^[A-Z]/.test(variables[variables.length - 1]) &&
        tokens[position++] === "]"
        ? parsePrefix()
        : undefined;
    }
    if (token === "(") {
      const inner = parseBinary(0);
      return tokens[position++] === ")" ? inner : undefined;
    }
    if (token === "True" || token === "False") return { kind: "Constant", value: token === "True" };
    // LS4 reads no predicate with arguments and no identifier longer than 31 characters.
    return isIdentifier(token) && tokens[position] !== "(" && token.length <= MAX_LS4_IDENTIFIER
      ? { kind: "Atom", name: token }
      : undefined;
  };
  const parseOperators = (level: number, left: PtlFormula | undefined): PtlFormula | undefined => {
    const kind = BINARY_LEVELS[level].get(tokens[position] ?? "");
    if (left === undefined || kind === undefined) return left;
    position += 1;
    const right = parseBinary(level + 1);
    return right === undefined ? undefined : parseOperators(level, { kind, left, right });
  };
  const parseBinary = (level: number): PtlFormula | undefined =>
    level === BINARY_LEVELS.length ? parsePrefix() : parseOperators(level, parseBinary(level + 1));
  const formula = parseBinary(0);
  return position < tokens.length ? undefined : formula;
};

export const decidePtl = (text: string, options: DecideOptions): Verdict => {
  const deadline = performance.now() + options.timeLimitMs;
  const formula = parseLs4(text);
  return formula === undefined
    ? "unknown"
    : getSatisfiability(
        formula,
        () => options.signal?.aborted === true || performance.now() > deadline,
      );
};
