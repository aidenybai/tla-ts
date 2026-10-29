import {
  shift,
  shiftExpr,
  substituteSequent,
  type Expr,
  type Hyp,
  type Sequent,
} from "../../obligation-expression";
import { expandLet } from "./elab";

interface Extracted {
  equalities: Expr[];
  rest: Expr | undefined;
}

const combineExtracted = (parts: Extracted[], rebuild: (rests: Expr[]) => Expr): Extracted => {
  const rests = parts.flatMap((part) => (part.rest ? [part.rest] : []));
  return {
    equalities: parts.flatMap((part) => part.equalities),
    rest: rests.length === 0 ? undefined : rests.length === 1 ? rests[0] : rebuild(rests),
  };
};

// Prep.extract_equalities: the equalities among a fact's conjuncts, and what remains.
const extractEqualities = (expression: Expr): Extracted => {
  if (
    expression.kind === "Let" &&
    expression.definitions.every((definition) => definition.kind === "Operator")
  )
    return extractEqualities(expandLet(expression));
  if (expression.kind === "List" && expression.bullet !== "Or")
    return combineExtracted(expression.items.map(extractEqualities), (items) => ({
      ...expression,
      bullet: "And",
      items,
    }));
  if (expression.kind === "Internal" && expression.builtin === "TRUE")
    return { equalities: [], rest: undefined };
  const isUnbounded =
    expression.kind === "Quant" &&
    expression.quantifier === "Forall" &&
    expression.bounds.every((bound) => bound.domain.kind === "NoDomain");
  if (isUnbounded) {
    const inner = extractEqualities(expression.body);
    return {
      equalities: inner.equalities.map((equality) => ({ ...expression, body: equality })),
      rest: inner.rest && { ...expression, body: inner.rest },
    };
  }
  if (expression.kind !== "Apply" || expression.operator.kind !== "Internal")
    return { equalities: [], rest: expression };
  if (expression.operator.builtin === "Eq") return { equalities: [expression], rest: undefined };
  if (expression.operator.builtin !== "Conj") return { equalities: [], rest: expression };
  return combineExtracted(expression.args.map(extractEqualities), (args) => ({
    ...expression,
    args,
  }));
};

// Prep.flatten: each visible fact becomes what remains of it, then each of its equalities.
export const splitFacts = (sequent: Sequent, start = 0): Sequent => {
  const index = sequent.context.findIndex(
    (hyp, position) => position >= start && hyp.kind === "Fact" && hyp.visibility === "Visible",
  );
  const hyp = sequent.context[index];
  if (index === -1 || hyp.kind !== "Fact") return sequent;
  const extracted = extractEqualities(hyp.expression);
  const pieces = [...(extracted.rest ? [extracted.rest] : []), ...extracted.equalities];
  const facts = pieces.map((piece, position): Hyp => ({
    ...hyp,
    expression: shiftExpr(position, piece),
  }));
  const after = { context: sequent.context.slice(index + 1), active: sequent.active };
  const rest = facts.length === 1 ? after : substituteSequent(shift(facts.length - 1), after);
  return splitFacts(
    {
      context: [...sequent.context.slice(0, index), ...facts, ...rest.context],
      active: rest.active,
    },
    index + facts.length,
  );
};
