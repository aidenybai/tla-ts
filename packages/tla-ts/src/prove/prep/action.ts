// Action.process_obligation, the action frontend that tlapm applies before a first-order
// backend.

import { applyBuiltin, mapChildren, type Expr, type Sequent } from "../../obligation-expression";

const getUnchanged = (expression: Expr): Expr =>
  applyBuiltin("Eq", [applyBuiltin("Prime", [expression], expression), expression], expression);

const flattenTuple = (expression: Expr): Expr[] =>
  expression.kind === "Tuple" ? expression.elements.flatMap(flattenTuple) : [expression];

// Tla_norm.expand_unchanged: UNCHANGED <<a, b>> is a' = a /\ b' = b.
const expandUnchanged = (expression: Expr): Expr => {
  const items = flattenTuple(expression);
  if (items.length === 0) return { kind: "Internal", builtin: "TRUE" };
  return items.length === 1
    ? getUnchanged(items[0])
    : { kind: "List", bullet: "And", items: items.map(getUnchanged) };
};

// Tla_norm.expand_action: [A]_v is A \/ UNCHANGED v, and <<A>>_v is A /\ ~UNCHANGED v.
const expandActions = (expression: Expr): Expr => {
  const inner = mapChildren(expression, expandActions);
  if (inner.kind === "Sub")
    return inner.modal === "Box"
      ? applyBuiltin("Disj", [inner.action, expandUnchanged(inner.subscript)], inner)
      : applyBuiltin(
          "Conj",
          [inner.action, applyBuiltin("Neg", [expandUnchanged(inner.subscript)], inner)],
          inner,
        );
  const isUnchanged =
    inner.kind === "Apply" &&
    inner.operator.kind === "Internal" &&
    inner.operator.builtin === "UNCHANGED";
  return isUnchanged ? expandUnchanged(inner.args[0]) : inner;
};

// expand_prime_defs on each fact and the goal.
export const processObligation = (sequent: Sequent): Sequent => ({
  context: sequent.context.map((hyp) =>
    hyp.kind === "Fact" ? { ...hyp, expression: expandActions(hyp.expression) } : hyp,
  ),
  active: expandActions(sequent.active),
});
