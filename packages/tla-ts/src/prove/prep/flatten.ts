import {
  at,
  bumpBy,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Bound,
  type Expr,
  type Hyp,
  type Sequent,
  type Substitution,
} from "../../obligations/expression";

const isUnbounded = (bound: Bound) => bound.domain.kind === "NoDomain";

// extract_equalities: the equalities in a conjunction, apart from the rest of it.
const extractEqualities = (expression: Expr): [Expr[], Expr | undefined] => {
  if (expression.kind === "List" && (expression.bullet === "And" || expression.bullet === "Refs")) {
    const parts = expression.items.map(extractEqualities);
    const equalities = parts.flatMap((part) => part[0]);
    const rest = parts.flatMap((part) => (part[1] ? [part[1]] : []));
    if (rest.length <= 1) return [equalities, rest[0]];
    return [equalities, { ...expression, bullet: "And", items: rest }];
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    if (builtin === "Conj" && expression.args.length === 2) {
      const left = extractEqualities(expression.args[0]);
      const right = extractEqualities(expression.args[1]);
      const equalities = [...left[0], ...right[0]];
      if (left[1] && right[1]) return [equalities, { ...expression, args: [left[1], right[1]] }];
      return [equalities, left[1] ?? right[1]];
    }
    if (builtin === "Eq") return [[expression], undefined];
  }
  if (expression.kind === "Internal" && expression.builtin === "TRUE") return [[], undefined];
  if (
    expression.kind === "Quant" &&
    expression.quantifier === "Forall" &&
    expression.bounds.every(isUnbounded)
  ) {
    const extracted = extractEqualities(expression.body);
    const quantify = (inner: Expr, from: Expr) =>
      at({ kind: "Quant", quantifier: "Forall", bounds: expression.bounds, body: inner }, from);
    return [
      extracted[0].map((equality) => quantify(equality, equality)),
      extracted[1] && quantify(extracted[1], expression),
    ];
  }
  return [[], expression];
};

// flatten: each visible fact becomes the rest of it, then its equalities.
export const flatten = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    if (hyp.kind !== "Fact" || hyp.visibility !== "Visible") {
      context.push(substituteHyp(current, hyp));
      return bumpBy(1, current);
    }
    const extracted = extractEqualities(hyp.expression);
    const facts = [...(extracted[1] ? [extracted[1]] : []), ...extracted[0]];
    facts.forEach((fact, index) =>
      context.push({ ...hyp, expression: shiftExpr(index, substituteExpr(current, fact)) }),
    );
    return { kind: "Compose", outer: shift(facts.length - 1), inner: bumpBy(1, current) };
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};
