import {
  bumpBy,
  consSubstitution,
  createContextMap,
  shift,
  substituteExpr,
  substituteHyp,
  type Sequent,
} from "../../obligations/expression";

const createExpander = (isPragmaExpanded: boolean) =>
  createContextMap(shift(0), (current, hyp) => {
    if (
      hyp.kind === "Defn" &&
      ((isPragmaExpanded && hyp.definition.kind === "Bpragma") ||
        (hyp.definition.kind === "Operator" && hyp.visibility === "Visible"))
    ) {
      return [consSubstitution(substituteExpr(current, hyp.definition.body), current), undefined];
    }
    return [bumpBy(1, current), substituteHyp(current, hyp)];
  });

const expandWithPragmas = createExpander(true);

const expandOperators = createExpander(false);

// expand_defs: each visible operator definition and each pragma, whatever its visibility,
// substitutes into the rest of the obligation and leaves the context. Toolbox.expand_defs, an older
// copy, leaves the pragmas.
export const expandDefs = (sequent: Sequent, isPragmaExpanded = true): Sequent => {
  const expanded = (isPragmaExpanded ? expandWithPragmas : expandOperators)(sequent.context);
  return { context: expanded.context, active: substituteExpr(expanded.state, sequent.active) };
};
