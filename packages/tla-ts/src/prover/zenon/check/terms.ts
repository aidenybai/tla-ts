import type { ExprKind } from "../expr";
import type { Definition } from "../parse";
import type { PlainRuleName, RuleArgs } from "../proof";

type TermKind = ExprKind | "subst";

// "subst" stands for its first argument with the variable named symbol replaced by its second
// argument.
export interface Term {
  kind: TermKind;
  symbol: string;
  args: Term[];
}

export interface CheckContext {
  hypotheses: Term[];
  definitions: Definition[];
}

export interface RuleSpec {
  premises: Term[];
  branches: Term[][];
}

export type RelationProperty = "reflexive" | "symmetric" | "transitive";

// What a variable stands for while printing a key: the depth of its binder, or a term substituted
// for it with the environment where the substitution was made. A substituted term prints where it
// lands, so its own binders get depths below the binders around it.
export type Binding = number | { formula: Term; env: Env; operators?: Operators };

export type Env = Map<string, Binding>;

export type Operators = Map<string, Term>;

export interface Checker {
  context: CheckContext;
  getKey: (formula: Term, env: Env, depth: number, operators?: Operators) => string;
  getTopKey: (formula: Term) => string;
  isSame: (left: Term, right: Term) => boolean;
  bind: (kind: "all" | "ex", type: string, build: (bound: Term) => Term) => Term;
  ensureRelation: (symbol: string, properties: RelationProperty[]) => void;
}

export type SpecTable<Name extends PlainRuleName> = {
  [Key in Name]: (args: RuleArgs<Key, Term>, checker: Checker, uses: Term[]) => RuleSpec;
};

export class UncheckedError extends Error {}

export const ensure: (condition: boolean) => asserts condition = (condition) => {
  if (!condition) throw new UncheckedError();
};

export const term = (kind: TermKind, symbol: string, args: Term[]): Term => ({
  kind,
  symbol,
  args,
});
export const variable = (name: string) => term("var", name, []);
export const app = (symbol: string, args: Term[]) => term("app", symbol, args);
export const not = (operand: Term) => term("not", "", [operand]);
export const and = (left: Term, right: Term) => term("and", "", [left, right]);
export const or = (left: Term, right: Term) => term("or", "", [left, right]);
export const imply = (left: Term, right: Term) => term("imply", "", [left, right]);
export const equiv = (left: Term, right: Term) => term("equiv", "", [left, right]);
export const equal = (left: Term, right: Term) => app("=", [left, right]);
export const member = (element: Term, set: Term) => app("TLA.in", [element, set]);
export const fapply = (fcn: Term, argument: Term) => app("TLA.fapply", [fcn, argument]);
export const domain = (fcn: Term) => app("TLA.DOMAIN", [fcn]);
export const TRUE = term("true", "", []);
export const FALSE = term("false", "", []);

export const instantiate = (binder: Term, value: Term) =>
  term("subst", binder.args[0].symbol, [binder.args[1], value]);

export const isApp = (formula: Term, symbol: string, arity?: number) =>
  formula.kind === "app" &&
  formula.symbol === symbol &&
  (arity === undefined || formula.args.length === arity);

export const expectApp = (formula: Term, symbol: string, arity?: number) => {
  ensure(isApp(formula, symbol, arity));
  return formula.args;
};

export const expectKind = (formula: Term, kind: TermKind) => {
  ensure(formula.kind === kind);
  return formula.args;
};

export const expectNot = (formula: Term) => expectKind(formula, "not")[0];

export const isVariable = (formula: Term, name: string) =>
  formula.kind === "var" && formula.symbol === name;

// Escapes could spell one string two ways, so they don't count.
export const getStringText = (formula: Term) => {
  ensure(isApp(formula, "$string", 1) && formula.args[0].kind === "var");
  const text = formula.args[0].symbol;
  ensure(!text.includes("\\"));
  return text;
};

export const getPairs = (args: Term[]) => {
  ensure(args.length % 2 === 0);
  const pairs: [Term, Term][] = [];
  for (let index = 0; index < args.length; index += 2) pairs.push([args[index], args[index + 1]]);
  return pairs;
};

export const makeNatural = (count: number) => {
  let result = variable("0");
  for (let index = 0; index < count; index++) result = fapply(variable("TLA.Succ"), result);
  return result;
};
