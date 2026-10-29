import {
  bumpBy,
  consSubstitution,
  mapAccumulate,
  shift,
  substituteExpr,
  substituteHyp,
  type Hyp,
  type Sequent,
  type Substitution,
} from "../../obligation-expression";
import { getPragmaProver } from "./pragma";

// Prep.expand_defs: substitutes each visible definition, and each pragma, into the hypotheses
// after it. tla-ts parses TLAPS's pragmas as definitions of TRUE.
export const expandDefinitions = (sequent: Sequent): Sequent => {
  const [substitution, context] = mapAccumulate(
    shift(0),
    sequent.context,
    (current, hyp): [Substitution, Hyp[]] => {
      const isExpanded =
        hyp.kind === "Defn" &&
        hyp.definition.kind === "Operator" &&
        (hyp.visibility === "Visible" || getPragmaProver(hyp) !== undefined);
      if (isExpanded && hyp.definition.kind === "Operator")
        return [consSubstitution(substituteExpr(current, hyp.definition.body), current), []];
      return [bumpBy(1, current), [substituteHyp(current, hyp)]];
    },
  );
  return { context: context.flat(), active: substituteExpr(substitution, sequent.active) };
};
