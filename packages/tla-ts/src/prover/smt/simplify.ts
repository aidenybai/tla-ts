// encode/n_rewrite.ml: elim_notmem, elim_bounds, apply_ext and simplify_sets, the rewrites of sets
// that tlapm's --debug flags rwsetext, rw and rw+ turn on.

import {
  applyBuiltin,
  at,
  mapChildren,
  mapHyp,
  type Bound,
  type BoundDomain,
  type Builtin,
  type Expr,
  type Hyp,
  type Sequent,
} from "../../obligations/expression";
import {
  bumpBy,
  consSubstitution,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Substitution,
} from "../../obligations/substitution";
import type { Polarity } from "./extensionality";

const getBuiltin = (expression: Expr) =>
  expression.kind === "Apply" && expression.operator.kind === "Internal"
    ? expression.operator.builtin
    : undefined;

const builtin = (name: Builtin, args: Expr[]): Expr => applyBuiltin(name, args, {});

const variable = (index: number): Expr => ({ kind: "Ix", index });

const NO_DOMAIN: BoundDomain = { kind: "NoDomain" };

const getUnbounded = (name: string): Bound => ({ name, level: "Constant", domain: NO_DOMAIN });

const mapHypExpressions = (hyp: Hyp, map: (expression: Expr) => Expr) => mapHyp(hyp, map, "all");

const elimNotmem = (expression: Expr): Expr => {
  const inner = mapChildren(expression, elimNotmem);
  if (inner.kind !== "Apply" || getBuiltin(inner) !== "Notmem") return inner;
  return at(builtin("Neg", [builtin("Mem", inner.args)]), inner);
};

// Each bound's domain becomes a membership after the quantifier, the first bound's the farthest.
const elimBoundsQuantifier = (expression: Extract<Expr, { kind: "Quant" }>): Expr => {
  const count = expression.bounds.length;
  const domains = expression.bounds.reduce<(Expr | undefined)[]>((found, bound) => {
    if (bound.domain.kind === "Domain")
      return [...found, shiftExpr(count, elimBounds(bound.domain.expression))];
    return [...found, bound.domain.kind === "Ditto" ? found.at(-1) : undefined];
  }, []);
  const memberships = domains.flatMap((domain, index) =>
    domain === undefined ? [] : [builtin("Mem", [variable(count - index), domain])],
  );
  const body = elimBounds(expression.body);
  const bounds = expression.bounds.map((bound) => ({ ...bound, domain: NO_DOMAIN }));
  if (memberships.length === 0) return { ...expression, bounds, body };
  const guarded =
    expression.quantifier === "Exists"
      ? ({ kind: "List", bullet: "And", items: [...memberships, body] } satisfies Expr)
      : builtin("Implies", [
          memberships.length === 1
            ? memberships[0]
            : { kind: "List", bullet: "And", items: memberships },
          body,
        ]);
  return { ...expression, bounds, body: guarded };
};

const elimBoundsSequent = (sequent: Sequent): Sequent => {
  const state = sequent.context.reduce<{ substitution: Substitution; context: Hyp[] }>(
    (current, hyp) => {
      if (hyp.kind !== "Fresh" || hyp.domain === undefined) {
        const mapped = substituteHyp(current.substitution, hyp);
        return {
          substitution: bumpBy(1, current.substitution),
          context: [...current.context, mapHypExpressions(mapped, elimBounds)],
        };
      }
      const domain = elimBounds(substituteExpr(current.substitution, hyp.domain));
      const fact: Hyp = {
        kind: "Fact",
        expression: builtin("Mem", [variable(1), shiftExpr(1, domain)]),
        visibility: hyp.domainVisibility,
        time: "Now",
      };
      return {
        substitution: {
          kind: "Compose",
          outer: shift(1),
          inner: bumpBy(1, current.substitution),
        },
        context: [...current.context, { ...hyp, domain: undefined }, fact],
      };
    },
    { substitution: shift(0), context: [] },
  );
  return {
    context: state.context,
    active: elimBounds(substituteExpr(state.substitution, sequent.active)),
  };
};

const elimBounds = (expression: Expr): Expr => {
  if (expression.kind === "Quant") return elimBoundsQuantifier(expression);
  if (expression.kind === "Sequent")
    return { ...expression, sequent: elimBoundsSequent(expression.sequent) };
  if (expression.kind === "Choose" && expression.domain !== undefined) {
    const membership = builtin("Mem", [variable(1), shiftExpr(1, elimBounds(expression.domain))]);
    return {
      ...expression,
      domain: undefined,
      body: builtin("Conj", [membership, elimBounds(expression.body)]),
    };
  }
  return mapChildren(expression, elimBounds);
};

const isSet = (expression: Expr) => {
  switch (expression.kind) {
    case "SetEnum":
    case "SetSt":
    case "SetOf":
    case "Product":
    case "Arrow":
    case "Rect":
      return true;
    case "Internal":
      return ["STRING", "BOOLEAN", "Nat", "Int"].includes(expression.builtin);
    case "Apply":
      return (
        expression.args.length === 2 &&
        ["Cap", "Cup", "Setminus", "Range"].includes(getBuiltin(expression) ?? "")
      );
    default:
      return false;
  }
};

const invert = (polarity: Polarity): Polarity =>
  polarity === "Positive" ? "Negative" : polarity === "Negative" ? "Positive" : "Neither";

// Rewrite.rewrite_by_extensionality: \A x : x \in left <=> x \in right, or => for a subset.
const getExtensional = (connective: Builtin, left: Expr, right: Expr): Expr => ({
  kind: "Quant",
  quantifier: "Forall",
  bounds: [getUnbounded("x")],
  body: builtin(connective, [
    builtin("Mem", [variable(1), shiftExpr(1, left)]),
    builtin("Mem", [variable(1), shiftExpr(1, right)]),
  ]),
});

type Visit = (polarity: Polarity, expression: Expr) => Expr;

// The visits of Expr.Visit.map that apply_ext and simplify_sets share: a sequent's hypotheses take
// the opposite polarity, and the arguments of an application take neither.
const visitLogic = (visit: Visit, polarity: Polarity, expression: Expr): Expr => {
  if (expression.kind === "Sequent") {
    const sequent = expression.sequent;
    const context = sequent.context.map((hyp) =>
      mapHypExpressions(hyp, (inner) => visit(invert(polarity), inner)),
    );
    return { ...expression, sequent: { context, active: visit(polarity, sequent.active) } };
  }
  if (expression.kind !== "Apply")
    return mapChildren(expression, (inner) => visit(polarity, inner));
  const args = expression.args;
  switch (getBuiltin(expression)) {
    case "Implies":
      return { ...expression, args: [visit(invert(polarity), args[0]), visit(polarity, args[1])] };
    case "Equiv":
      return at(
        builtin("Conj", [
          builtin("Implies", [visit(invert(polarity), args[0]), visit(polarity, args[1])]),
          builtin("Implies", [visit(invert(polarity), args[1]), visit(polarity, args[0])]),
        ]),
        expression,
      );
    case "Neg":
      return { ...expression, args: [visit(invert(polarity), args[0])] };
    default:
      return { ...expression, args: args.map((arg) => visit("Neither", arg)) };
  }
};

// Rewrite.apply_ext_visitor. Synthesize gives every equality the sort Idv, which apply_ext reads
// back as its type parameter. It finds none on \subseteq and raises an internal error, so this
// rewrites \subseteq over Idv.
const applyExt: Visit = (polarity, expression) => {
  if (expression.kind === "Apply" && expression.args.length === 2) {
    const left = expression.args[0];
    const right = expression.args[1];
    const isSetEquality = isSet(left) || isSet(right);
    const kind = getBuiltin(expression);
    if (kind === "Eq" && polarity === "Positive" && isSetEquality)
      return at(
        getExtensional("Equiv", applyExt(polarity, left), applyExt(polarity, right)),
        expression,
      );
    if (kind === "Neq" && polarity === "Negative" && isSetEquality)
      return at(
        builtin("Neg", [
          getExtensional("Equiv", applyExt(polarity, left), applyExt(polarity, right)),
        ]),
        expression,
      );
    if (kind === "Subseteq" && polarity === "Positive")
      return at(
        getExtensional("Implies", applyExt(polarity, left), applyExt(polarity, right)),
        expression,
      );
    if (kind === "Conj" || kind === "Disj")
      return { ...expression, args: [applyExt(polarity, left), applyExt(polarity, right)] };
  }
  return visitLogic(applyExt, polarity, expression);
};

const SET_LIMIT = 10;

const getMembership = (polarity: Polarity, element: Expr, set: Expr): Expr | undefined => {
  const visit = (inner: Expr) => simplifySet(polarity, inner);
  const mem = (left: Expr, right: Expr) => builtin("Mem", [left, right]);
  switch (set.kind) {
    case "SetEnum": {
      if (set.elements.length === 0) return { kind: "Internal", builtin: "FALSE" };
      const left = visit(element);
      const equalities = set.elements.map((inner) => builtin("Eq", [left, visit(inner)]));
      return equalities.length === 1
        ? equalities[0]
        : { kind: "List", bullet: "Or", items: equalities };
    }
    case "SetSt": {
      const left = visit(element);
      const domain = visit(set.domain);
      const body = visit(set.body);
      return builtin("Conj", [
        mem(left, domain),
        substituteExpr(consSubstitution(left, shift(0)), body),
      ]);
    }
    case "SetOf": {
      const left = visit(element);
      const domains = set.bounds
        .map((bound) =>
          bound.domain.kind === "Domain" ? visit(bound.domain.expression) : undefined,
        )
        .reduce<Expr[]>((found, domain) => [...found, domain ?? found[found.length - 1]], []);
      const count = set.bounds.length;
      return {
        kind: "Quant",
        quantifier: "Exists",
        bounds: set.bounds.map((bound) => getUnbounded(bound.name)),
        body: {
          kind: "List",
          bullet: "And",
          items: [
            builtin("Eq", [shiftExpr(count, left), visit(set.element)]),
            // tlapm pairs the first domain with Ix 1, the last bound, so this pairs each with its own.
            ...domains.map((domain, index) =>
              mem(variable(count - index), shiftExpr(count, domain)),
            ),
          ],
        },
      };
    }
    case "Arrow": {
      const left = visit(element);
      const domain = visit(set.domain);
      const range = visit(set.range);
      return {
        kind: "List",
        bullet: "And",
        items: [
          { kind: "Apply", operator: { kind: "Opaque", name: "IsAFcn" }, args: [left] },
          builtin("Eq", [builtin("DOMAIN", [left]), domain]),
          {
            kind: "Quant",
            quantifier: "Forall",
            bounds: [getUnbounded("x")],
            body: builtin("Implies", [
              mem(variable(1), shiftExpr(1, domain)),
              mem(
                { kind: "FcnApp", function: shiftExpr(1, left), args: [variable(1)] },
                shiftExpr(1, range),
              ),
            ]),
          },
        ],
      };
    }
    case "Product": {
      const left = visit(element);
      const factors = set.factors.map(visit);
      const component = (index: number): Expr => ({
        kind: "FcnApp",
        function: left,
        args: [{ kind: "Num", integer: String(index + 1), fraction: "" }],
      });
      return {
        kind: "List",
        bullet: "And",
        items: [
          builtin("Eq", [
            left,
            { kind: "Tuple", elements: factors.map((_, index) => component(index)) },
          ]),
          ...factors.map((factor, index) => mem(component(index), factor)),
        ],
      };
    }
    case "Rect": {
      const left = visit(element);
      const fields = set.fields.map((field) => ({ name: field.name, value: visit(field.value) }));
      const dot = (field: string): Expr => ({ kind: "Dot", expression: left, field });
      return {
        kind: "List",
        bullet: "And",
        items: [
          builtin("Eq", [
            left,
            {
              kind: "Record",
              fields: fields.map((field) => ({ name: field.name, value: dot(field.name) })),
            },
          ]),
          ...fields.map((field) => mem(dot(field.name), field.value)),
        ],
      };
    }
    case "Internal":
      if (set.builtin !== "Nat") return undefined;
      return builtin("Conj", [
        mem(visit(element), { kind: "Internal", builtin: "Int" }),
        builtin("Lteq", [{ kind: "Num", integer: "0", fraction: "" }, visit(element)]),
      ]);
    case "Apply": {
      const args = set.args;
      const kind = getBuiltin(set);
      if (kind === "SUBSET" && args.length === 1)
        return {
          kind: "Quant",
          quantifier: "Forall",
          bounds: [getUnbounded("v")],
          body: builtin("Implies", [
            mem(variable(1), shiftExpr(1, visit(element))),
            mem(variable(1), shiftExpr(1, visit(args[0]))),
          ]),
        };
      if (kind === "UNION" && args.length === 1)
        return {
          kind: "Quant",
          quantifier: "Exists",
          bounds: [getUnbounded("v")],
          body: builtin("Conj", [
            mem(variable(1), shiftExpr(1, visit(args[0]))),
            mem(shiftExpr(1, visit(element)), variable(1)),
          ]),
        };
      if (args.length !== 2) return undefined;
      const left = visit(element);
      if (kind === "Cup")
        return builtin("Disj", [mem(left, visit(args[0])), mem(left, visit(args[1]))]);
      if (kind === "Cap")
        return builtin("Conj", [mem(left, visit(args[0])), mem(left, visit(args[1]))]);
      if (kind === "Setminus")
        return builtin("Conj", [
          mem(left, visit(args[0])),
          builtin("Neg", [mem(left, visit(args[1]))]),
        ]);
      if (kind === "Range")
        return {
          kind: "List",
          bullet: "And",
          items: [
            mem(left, { kind: "Internal", builtin: "Int" }),
            builtin("Lteq", [visit(args[0]), left]),
            builtin("Lteq", [left, visit(args[1])]),
          ],
        };
      return undefined;
    }
    default:
      return undefined;
  }
};

// Rewrite.simplify_sets_visitor, which rewrites a set equality where it must be proved by both
// inclusions. tlapm writes only the first one there, so its rewrite proves equalities that are
// false.
const simplifySet: Visit = (polarity, expression) => {
  if (expression.kind === "Apply" && expression.args.length === 2) {
    const left = expression.args[0];
    const right = expression.args[1];
    const kind = getBuiltin(expression);
    const membership = kind === "Mem" ? getMembership(polarity, left, right) : undefined;
    if (membership !== undefined) return at(membership, expression);
    const isSetEquality = isSet(left) || isSet(right);
    if (kind === "Eq" && polarity === "Positive" && isSetEquality)
      return at(
        getExtensional("Equiv", simplifySet(polarity, left), simplifySet(polarity, right)),
        expression,
      );
    if (kind === "Neq" && polarity === "Negative" && isSetEquality)
      return at(
        builtin("Neg", [
          getExtensional("Equiv", simplifySet(polarity, left), simplifySet(polarity, right)),
        ]),
        expression,
      );
    if (kind === "Subseteq" && polarity === "Positive")
      return at(
        getExtensional("Implies", simplifySet(polarity, left), simplifySet(polarity, right)),
        expression,
      );
  }
  return visitLogic(simplifySet, polarity, expression);
};

// Smtlib.preprocess runs elim_notmem and elim_bounds always, but they only change the encoding
// once a rewrite of sets can see the memberships they make.
export const simplifySets = (sequent: Sequent, rewriteLevel: number): Sequent => {
  if (rewriteLevel === 0) return sequent;
  const bounded = elimBoundsSequent({
    context: sequent.context.map((hyp) => mapHypExpressions(hyp, elimNotmem)),
    active: elimNotmem(sequent.active),
  });
  const root: Expr = { kind: "Sequent", sequent: bounded };
  const simplified =
    rewriteLevel === 1
      ? applyExt("Positive", root)
      : Array.from({ length: SET_LIMIT }).reduce<Expr>(
          (current) => simplifySet("Positive", current),
          root,
        );
  return simplified.kind === "Sequent" ? simplified.sequent : bounded;
};
