// tlapm's Optable: each operator's precedence range and fixity, by every spelling it has.

import type { Builtin } from "./expression";

export type Fixity = "Nonfix" | "Prefix" | "Postfix" | "InfixLeft" | "InfixNon" | "InfixRight";

export interface Operator {
  name: string;
  low: number;
  high: number;
  fixity: Fixity;
}

const OPERATORS: [string, number, number, Fixity, string[]][] = [
  ["=>", 1, 1, "InfixNon", []],
  ["<=>", 2, 2, "InfixNon", ["\\equiv"]],
  ["/\\", 3, 3, "InfixLeft", ["\\land"]],
  ["\\/", 3, 3, "InfixLeft", ["\\lor"]],
  ["~", 4, 4, "Prefix", ["\\neg", "\\lnot"]],
  ["=", 5, 5, "InfixNon", []],
  ["#", 5, 5, "InfixNon", ["/="]],
  ["SUBSET", 8, 8, "Prefix", []],
  ["UNION", 8, 8, "Prefix", []],
  ["DOMAIN", 9, 9, "Prefix", []],
  ["\\subseteq", 5, 5, "InfixNon", []],
  ["\\in", 5, 5, "InfixNon", []],
  ["\\notin", 5, 5, "InfixNon", []],
  ["\\", 8, 8, "InfixNon", []],
  ["\\cap", 8, 8, "InfixLeft", ["\\intersect"]],
  ["\\cup", 8, 8, "InfixLeft", ["\\union"]],
  ["\\X", 10, 13, "Prefix", ["\\times"]],
  ["'", 15, 15, "Postfix", []],
  ["~>", 2, 2, "InfixNon", ["\\leadsto"]],
  ["ENABLED", 4, 15, "Prefix", []],
  ["UNCHANGED", 4, 15, "Prefix", []],
  ["\\cdot", 5, 14, "InfixLeft", []],
  ["-+->", 2, 2, "InfixNon", []],
  ["[]", 4, 15, "Prefix", []],
  ["<>", 4, 15, "Prefix", []],
  ["^", 14, 14, "InfixNon", []],
  ["/", 13, 13, "InfixNon", []],
  ["*", 13, 13, "InfixLeft", []],
  ["-.", 12, 12, "Prefix", ["-"]],
  ["-", 11, 11, "InfixLeft", []],
  ["+", 10, 10, "InfixLeft", []],
  ["^+", 15, 15, "Postfix", []],
  ["^*", 15, 15, "Postfix", []],
  ["^#", 15, 15, "Postfix", []],
  ["<", 5, 5, "InfixNon", []],
  ["=<", 5, 5, "InfixNon", ["<=", "\\leq"]],
  [">", 5, 5, "InfixNon", []],
  [">=", 5, 5, "InfixNon", ["\\geq"]],
  ["...", 9, 9, "InfixNon", []],
  ["..", 9, 9, "InfixNon", []],
  ["|", 10, 11, "InfixLeft", []],
  ["||", 10, 11, "InfixLeft", []],
  ["&&", 13, 13, "InfixLeft", []],
  ["&", 13, 13, "InfixLeft", []],
  ["$$", 9, 13, "InfixLeft", []],
  ["$", 9, 13, "InfixLeft", []],
  ["??", 9, 13, "InfixLeft", []],
  ["%%", 10, 11, "InfixLeft", []],
  ["%", 10, 11, "InfixLeft", ["\\mod"]],
  ["##", 9, 13, "InfixLeft", []],
  ["++", 10, 10, "InfixLeft", []],
  ["--", 11, 11, "InfixLeft", []],
  ["**", 13, 13, "InfixLeft", []],
  ["//", 13, 13, "InfixNon", []],
  ["^^", 14, 14, "InfixNon", []],
  ["@@", 6, 6, "InfixLeft", []],
  ["!!", 9, 13, "InfixNon", []],
  ["|-", 5, 5, "InfixNon", []],
  ["|=", 5, 5, "InfixNon", []],
  ["-|", 5, 5, "InfixNon", []],
  ["=|", 5, 5, "InfixNon", []],
  ["<:", 7, 7, "InfixNon", []],
  [":>", 7, 7, "InfixNon", []],
  [":=", 5, 5, "InfixNon", []],
  ["::=", 5, 5, "InfixNon", []],
  ["(+)", 10, 10, "InfixLeft", ["\\oplus"]],
  ["(-)", 11, 11, "InfixLeft", ["\\ominus"]],
  ["(.)", 13, 13, "InfixLeft", ["\\odot"]],
  ["(/)", 13, 13, "InfixNon", ["\\oslash"]],
  ["(\\X)", 13, 13, "InfixLeft", ["\\otimes"]],
  ["\\uplus", 9, 13, "InfixLeft", []],
  ["\\sqcap", 9, 13, "InfixLeft", []],
  ["\\sqcup", 9, 13, "InfixLeft", []],
  ["\\div", 13, 13, "InfixNon", []],
  ["\\wr", 9, 14, "InfixNon", []],
  ["\\star", 13, 13, "InfixLeft", []],
  ["\\o", 13, 13, "InfixLeft", ["\\circ"]],
  ["\\bigcirc", 13, 13, "InfixLeft", []],
  ["\\bullet", 13, 13, "InfixLeft", []],
  ["\\prec", 5, 5, "InfixNon", []],
  ["\\succ", 5, 5, "InfixNon", []],
  ["\\preceq", 5, 5, "InfixNon", []],
  ["\\succeq", 5, 5, "InfixNon", []],
  ["\\sim", 5, 5, "InfixNon", []],
  ["\\simeq", 5, 5, "InfixNon", []],
  ["\\ll", 5, 5, "InfixNon", []],
  ["\\gg", 5, 5, "InfixNon", []],
  ["\\asymp", 5, 5, "InfixNon", []],
  ["\\subset", 5, 5, "InfixNon", []],
  ["\\supset", 5, 5, "InfixNon", []],
  ["\\supseteq", 5, 5, "InfixNon", []],
  ["\\approx", 5, 5, "InfixNon", []],
  ["\\cong", 5, 5, "InfixNon", []],
  ["\\sqsubset", 5, 5, "InfixNon", []],
  ["\\sqsubseteq", 5, 5, "InfixNon", []],
  ["\\sqsupset", 5, 5, "InfixNon", []],
  ["\\sqsupseteq", 5, 5, "InfixNon", []],
  ["\\doteq", 5, 5, "InfixNon", []],
  ["\\propto", 5, 5, "InfixNon", []],
];

// OCaml's Hashtbl.find returns the most recent binding, so later aliases win over earlier names.
const OPERATOR_TABLE = new Map<string, Operator>();
for (const [name, low, high, fixity, aliases] of OPERATORS) {
  const operator = { name, low, high, fixity };
  for (const spelling of [name, ...aliases]) OPERATOR_TABLE.set(spelling, operator);
}

const getNonfix = (name: string): Operator => ({ name, low: -1, high: -1, fixity: "Nonfix" });

export const lookupOperator = (name: string) => OPERATOR_TABLE.get(name) ?? getNonfix(name);

const STANDARD_NAMES: Partial<Record<Builtin, string>> = {
  Implies: "=>",
  Equiv: "<=>",
  Conj: "/\\",
  Disj: "\\/",
  Neg: "~",
  Eq: "=",
  Neq: "#",
  SUBSET: "SUBSET",
  UNION: "UNION",
  DOMAIN: "DOMAIN",
  Subseteq: "\\subseteq",
  Mem: "\\in",
  Notmem: "\\notin",
  Setminus: "\\",
  Cap: "\\cap",
  Cup: "\\cup",
  Prime: "'",
  StrongPrime: "'",
  Leadsto: "~>",
  ENABLED: "ENABLED",
  UNCHANGED: "UNCHANGED",
  Cdot: "\\cdot",
  Actplus: "-+->",
  BoxTrue: "[]",
  BoxFalse: "[]",
  Diamond: "<>",
  Plus: "+",
  Minus: "-",
  Times: "*",
  Ratio: "/",
  Quotient: "\\div",
  Remainder: "%",
  Exp: "^",
  Lteq: "=<",
  Lt: "<",
  Gteq: ">=",
  Gt: ">",
  Range: "..",
  Cat: "\\o",
  OneArg: ":>",
  Extend: "@@",
};

export const getStandardForm = (builtin: Builtin): Operator => {
  if (builtin === "Divides") return { name: "?|", low: 10, high: 11, fixity: "InfixNon" };
  if (builtin === "Uminus") return { ...lookupOperator("-."), name: "-" };
  const name = STANDARD_NAMES[builtin];
  return name ? lookupOperator(name) : getNonfix(builtin);
};
