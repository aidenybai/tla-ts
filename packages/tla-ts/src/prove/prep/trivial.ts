import {
  applyBuiltin,
  isEqualExpr,
  shiftExpr,
  type Expr,
  type Sequent,
} from "../../obligations/expression";

// Prep.trivial: the goal is TRUE, or find_fact finds it as a hypothesis, visible or not: a fact
// alpha-equivalent to it, or the x \in S of a declaration NEW x \in S.
export const isTrivial = (sequent: Sequent) =>
  (sequent.active.kind === "Internal" && sequent.active.builtin === "TRUE") ||
  sequent.context.some((hyp, index) => {
    if (hyp.kind === "Fact")
      return isEqualExpr(hyp.expression, shiftExpr(index - sequent.context.length, sequent.active));
    if (hyp.kind !== "Fresh" || !hyp.domain) return false;
    const variable: Expr = { kind: "Ix", index: 1 };
    return isEqualExpr(
      applyBuiltin("Mem", [variable, shiftExpr(1, hyp.domain)], {}),
      shiftExpr(index + 1 - sequent.context.length, sequent.active),
    );
  });
