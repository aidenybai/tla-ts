import {
  bumpBy,
  consSubstitution,
  shift,
  substituteExpr,
  substituteHyp,
  type Hyp,
  type Sequent,
  type Substitution,
} from "../../obligation-expression";

// expand_defs: each visible operator definition and each pragma, whatever its visibility,
// substitutes into the rest of the obligation and leaves the context.
export const expandDefs = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    if (hyp.kind === "Defn") {
      const definition = hyp.definition;
      if (
        definition.kind === "Bpragma" ||
        (definition.kind === "Operator" && hyp.visibility === "Visible")
      ) {
        return consSubstitution(substituteExpr(current, definition.body), current);
      }
    }
    context.push(substituteHyp(current, hyp));
    return bumpBy(1, current);
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};
