// tlapm's E_tuply_declarations: declarations such as <<x, y>> \in S become declarations of names.

import type { Bound, BoundDomain, Defn, Expr } from "./expression";

export type TuplyBound =
  | { kind: "Name"; name: string; domain: BoundDomain }
  | { kind: "Tuple"; names: string[]; domain: Expr };

const getOpaque = (name: string): Expr => ({ kind: "Opaque", name });

const getNamesTuple = (names: string[]): Expr => ({
  kind: "Tuple",
  elements: names.map(getOpaque),
});

const getEquality = (left: Expr, right: Expr): Expr => ({
  kind: "Apply",
  operator: { kind: "Internal", builtin: "Eq" },
  args: [left, right],
});

export const getUnbounded = (names: string[]): Bound[] =>
  names.map((name) => ({ name, level: "Constant", domain: { kind: "NoDomain" } }));

const getFactors = (domain: Expr | undefined, names: string[]) =>
  domain?.kind === "Product" && domain.factors.length === names.length ? domain.factors : undefined;

// Each name is the matching item of the tuple: x == t[1], y == t[2].
const getItemDefinitions = (tuple: string, names: string[]): Defn[] =>
  names.map((name, index) => ({
    kind: "Operator",
    name,
    body: {
      kind: "FcnApp",
      function: getOpaque(tuple),
      args: [{ kind: "Num", integer: String(index + 1), fraction: "" }],
    },
  }));

const getFactorBounds = (names: string[], factors: Expr[]): Bound[] =>
  names.map((name, index) => ({
    name,
    level: "Constant",
    domain: { kind: "Domain", expression: factors[index] },
  }));

const getNamedBound = (bound: Extract<TuplyBound, { kind: "Name" }>): Bound => ({
  name: bound.name,
  level: "Constant",
  domain: bound.domain,
});

// \E <<x, y>> \in A \X B: P becomes \E x \in A, y \in B: P, and \E <<x, y>> \in S: P becomes
// \E x, y: <<x, y>> \in S /\ P. Each domain quantifies separately, the last one innermost.
export const expandQuant = (
  quantifier: "Forall" | "Exists",
  bounds: TuplyBound[],
  body: Expr,
): Expr => {
  const groups: TuplyBound[][] = [];
  bounds.forEach((bound) => {
    if (bound.kind === "Name" && bound.domain.kind === "Ditto") groups.at(-1)?.push(bound);
    else groups.push([bound]);
  });
  return groups.reduceRight((inner: Expr, group): Expr => {
    const first = group[0];
    if (first.kind === "Name") {
      return {
        kind: "Quant",
        quantifier,
        bounds: group.flatMap((bound) => (bound.kind === "Name" ? [getNamedBound(bound)] : [])),
        body: inner,
        location: inner.location,
      };
    }
    const factors = getFactors(first.domain, first.names);
    if (factors) {
      return {
        kind: "Quant",
        quantifier,
        bounds: getFactorBounds(first.names, factors),
        body: inner,
        location: inner.location,
      };
    }
    const membership: Expr = {
      kind: "Apply",
      operator: { kind: "Internal", builtin: quantifier === "Exists" ? "Mem" : "Notmem" },
      args: [getNamesTuple(first.names), first.domain],
    };
    return {
      kind: "Quant",
      quantifier,
      bounds: getUnbounded(first.names),
      body: {
        kind: "List",
        bullet: quantifier === "Exists" ? "And" : "Or",
        items: [membership, inner],
      },
      location: inner.location,
    };
  }, body);
};

// CHOOSE <<x, y>> \in A \X B: P binds t \in A \X B with x == t[1], y == t[2], and any other
// domain binds t with \E x, y: t = <<x, y>> /\ P.
const getChooseBody = (
  name: string,
  names: string[],
  domain: Expr | undefined,
  body: Expr,
): Expr =>
  getFactors(domain, names)
    ? { kind: "Let", definitions: getItemDefinitions(name, names), body }
    : {
        kind: "Quant",
        quantifier: "Exists",
        bounds: getUnbounded(names),
        body: {
          kind: "List",
          bullet: "And",
          items: [getEquality(getOpaque(name), getNamesTuple(names)), body],
        },
      };

export const expandChoose = (names: string[], domain: Expr | undefined, body: Expr): Expr => {
  const name = `choose#${names[0]}`;
  return { kind: "Choose", name, domain, body: getChooseBody(name, names, domain, body) };
};

export const expandSetSt = (names: string[], domain: Expr, body: Expr): Expr => {
  const name = `setst#${names[0]}`;
  return { kind: "SetSt", name, domain, body: getChooseBody(name, names, domain, body) };
};

// A set or function constructor binds each tuple as fcn#x, with its names defined in a LET around
// the value. A set constructor over a matching product binds the names to its factors instead.
const expandConstructorBounds = (bounds: TuplyBound[], value: Expr, isSetOf: boolean) => {
  const expanded = bounds.map((bound): { bounds: Bound[]; definitions: Defn[] } => {
    if (bound.kind === "Name") return { bounds: [getNamedBound(bound)], definitions: [] };
    const factors = getFactors(bound.domain, bound.names);
    if (factors && isSetOf) {
      return { bounds: getFactorBounds(bound.names, factors), definitions: [] };
    }
    const name = `fcn#${bound.names[0]}`;
    const fcnBound: Bound = {
      name,
      level: "Constant",
      domain: { kind: "Domain", expression: bound.domain },
    };
    if (factors) return { bounds: [fcnBound], definitions: getItemDefinitions(name, bound.names) };
    const choice = `choose#${name}`;
    return {
      bounds: [fcnBound],
      definitions: [
        {
          kind: "Operator",
          name: choice,
          body: expandChoose(
            bound.names,
            undefined,
            getEquality(getOpaque(name), getNamesTuple(bound.names)),
          ),
        },
        ...getItemDefinitions(choice, bound.names),
      ],
    };
  });
  const definitions = expanded.flatMap((item) => item.definitions);
  return {
    bounds: expanded.flatMap((item) => item.bounds),
    value: definitions.length === 0 ? value : { kind: "Let" as const, definitions, body: value },
  };
};

export const expandSetOf = (element: Expr, bounds: TuplyBound[]): Expr => {
  const expanded = expandConstructorBounds(bounds, element, true);
  return { kind: "SetOf", element: expanded.value, bounds: expanded.bounds };
};

export const expandFcn = (bounds: TuplyBound[], body: Expr): Expr => {
  const expanded = expandConstructorBounds(bounds, body, false);
  return { kind: "Fcn", bounds: expanded.bounds, body: expanded.value };
};
