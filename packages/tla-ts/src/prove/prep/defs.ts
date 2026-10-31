import {
  bumpBy,
  consSubstitution,
  createContextMap,
  shift,
  substituteExpr,
  substituteHyp,
  type Sequent,
} from "../../obligation-expression";

const expandContext = createContextMap(shift(0), (current, hyp) => {
  if (
    hyp.kind === "Defn" &&
    (hyp.definition.kind === "Bpragma" ||
      (hyp.definition.kind === "Operator" && hyp.visibility === "Visible"))
  ) {
    return [consSubstitution(substituteExpr(current, hyp.definition.body), current), undefined];
  }
  return [bumpBy(1, current), substituteHyp(current, hyp)];
});

// expand_defs: each visible operator definition and each pragma, whatever its visibility,
// substitutes into the rest of the obligation and leaves the context.
export const expandDefs = (sequent: Sequent): Sequent => {
  const expanded = expandContext(sequent.context);
  return { context: expanded.context, active: substituteExpr(expanded.state, sequent.active) };
};
