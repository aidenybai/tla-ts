import type { Expr, Sequent } from "../../obligations/expression";
import type { AxiomArgument } from "./table";

export type Type =
  | { kind: "Idv" | "Bool" | "Int" | "Real" | "String" }
  | { kind: "Set"; element: Type }
  | { kind: "Fun"; domain: Type; range: Type }
  | { kind: "Product"; items: Type[] }
  | { kind: "Record"; fields: { name: string; type: Type }[] };

export const IDV: Type = { kind: "Idv" };
export const BOOL: Type = { kind: "Bool" };
export const INT: Type = { kind: "Int" };
export const STRING: Type = { kind: "String" };

const ATOMS = ["Idv", "Bool", "Int", "Real", "String"];

export const getTypeName = (type: Type): string => {
  switch (type.kind) {
    case "Set":
      return `Set$${getTypeName(type.element)}$`;
    case "Fun":
      return `Fun$${getTypeName(type.domain)}${getTypeName(type.range)}$`;
    case "Product":
      return `Prd$${type.items.map(getTypeName).join("")}$`;
    case "Record":
      return `Rec${type.fields.map((field) => `!${field.name}${getTypeName(field.type)}`).join("")}$`;
    default:
      return type.kind;
  }
};

export const isSameType = (left: Type, right: Type) => getTypeName(left) === getTypeName(right);

// The order Stdlib.compare gives T_t.ty, whose constructors TVar and TFSet tla-ts never builds.
export const getTypeKey = (type: Type): AxiomArgument => {
  switch (type.kind) {
    case "Set":
      return [2, getTypeKey(type.element)];
    case "Fun":
      return [4, getTypeKey(type.domain), getTypeKey(type.range)];
    case "Product":
      return [5, type.items.map(getTypeKey)];
    case "Record":
      return [6, type.fields.map((field) => [field.name, getTypeKey(field.type)])];
    default:
      return [1, ATOMS.indexOf(type.kind)];
  }
};

// The SMT sort of a value of this type. tlapm also gives a STRING-bounded variable the sort String,
// though its membership in StrSet then needs an Idv, so a string stays an Idv here.
export const getSort = (type: Type | undefined) =>
  type?.kind === "Int" || type?.kind === "Bool" ? type.kind : "Idv";

interface Search {
  infer: (expression: Expr, depth: number) => Type | undefined;
  isTarget: (expression: Expr, depth: number) => boolean;
}

const getBuiltin = (expression: Expr) =>
  expression.kind === "Apply" && expression.operator.kind === "Internal"
    ? expression.operator.builtin
    : undefined;

const getFirst = (items: (() => Type | undefined)[]) =>
  items.reduce<Type | undefined>((found, item) => found ?? item(), undefined);

const getAgreed = (left: () => Type | undefined, right: () => Type | undefined) => {
  const found = left();
  if (found === undefined) return undefined;
  const next = right();
  return next !== undefined && isSameType(found, next) ? next : undefined;
};

const visit = (
  search: Search,
  isPositive: boolean,
  depth: number,
  expression: Expr,
): Type | undefined => {
  const builtin = getBuiltin(expression);
  const args = expression.kind === "Apply" ? expression.args : [];
  const recurse = (inner: Expr, isInnerPositive = isPositive) =>
    visit(search, isInnerPositive, depth, inner);
  switch (builtin) {
    case "Mem":
    case "Notmem":
      if (
        args.length === 2 &&
        search.isTarget(args[0], depth) &&
        (builtin === "Notmem") === isPositive
      ) {
        const type = search.infer(args[1], depth);
        return type?.kind === "Set" ? type.element : undefined;
      }
      return undefined;
    case "Eq":
    case "Neq": {
      if (args.length !== 2 || (builtin === "Neq") !== isPositive) return undefined;
      if (search.isTarget(args[0], depth)) return search.infer(args[1], depth);
      return search.isTarget(args[1], depth) ? search.infer(args[0], depth) : undefined;
    }
    case "Conj":
    case "Disj":
      return (builtin === "Disj") === isPositive
        ? getFirst(args.map((arg) => () => recurse(arg)))
        : getAgreed(
            () => recurse(args[0]),
            () => recurse(args[1]),
          );
    case "Neg":
      return recurse(args[0], !isPositive);
    case "Implies":
      return getFirst([() => recurse(args[0], !isPositive), () => recurse(args[1])]);
  }
  switch (expression.kind) {
    // T_hyps folds a list that must agree from None, so it never agrees.
    case "List":
      return expression.bullet !== "Refs" && (expression.bullet === "Or") === isPositive
        ? getFirst(expression.items.map((item) => () => recurse(item)))
        : undefined;
    case "Quant":
      return (expression.quantifier === "Forall") === isPositive
        ? visit(search, isPositive, depth + expression.bounds.length, expression.body)
        : undefined;
    case "Sequent":
      return isPositive ? visitSequent(search, depth, expression.sequent) : undefined;
    default:
      return undefined;
  }
};

const visitSequent = (search: Search, depth: number, sequent: Sequent) =>
  getFirst([
    ...sequent.context.map(
      (hyp, index) => () =>
        hyp.kind === "Fact" && hyp.visibility === "Visible"
          ? visit(search, false, depth + index, hyp.expression)
          : undefined,
    ),
    () => visit(search, true, depth + sequent.context.length, sequent.active),
  ]);

export const searchType = (search: Search, isPositive: boolean, expression: Expr) =>
  visit(search, isPositive, 0, expression);
