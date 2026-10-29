import { isEqualExpr, shiftExpr, type Sequent } from "../../obligation-expression";

// Prep.trivial: the goal is TRUE, or alpha-equivalent to a hypothesis, visible or not.
export const isTrivial = (sequent: Sequent) =>
  (sequent.active.kind === "Internal" && sequent.active.builtin === "TRUE") ||
  sequent.context.some(
    (hyp, index) =>
      hyp.kind === "Fact" &&
      isEqualExpr(hyp.expression, shiftExpr(index - sequent.context.length, sequent.active)),
  );
