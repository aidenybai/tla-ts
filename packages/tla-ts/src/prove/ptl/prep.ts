// The steps of tlapm's Backend.Prep that every backend shares, as the PTL backend needs them. They
// stand in until src/prove/prep holds the shared ones, which also rewrite ENABLED and \cdot.

import { TlapmBugError, TlaUnsupportedError } from "../../errors";
import {
  at,
  bumpBy,
  consSubstitution,
  isEqualExpr,
  mapChildren,
  mapScoped,
  shift,
  substituteExpr,
  substituteHyp,
  type Builtin,
  type ExceptPoint,
  type Expr,
  type Hyp,
  type Sequent,
  type Substitution,
} from "../../obligation-expression";

// The pragmas that make tlapm rewrite ENABLED, \cdot or levels in Prep.normalize_expand.
const REWRITING_PRAGMAS = [
  "ExpandENABLED",
  "ExpandCdot",
  "AutoUSE",
  "Lambdify",
  "ENABLEDaxioms",
  "LevelComparison",
];

// The rewriting pragma a visible fact cites, as in BY PTL, ExpandENABLED. It keeps its name through
// an INSTANCE, as in T!ExpandENABLED, and when tla-ts renames a second copy, as in ExpandENABLED$2.
const getRewritingPragma = (context: Hyp[]) =>
  context
    .map((hyp, index) => {
      const fact = hyp.kind === "Fact" && hyp.visibility === "Visible" ? hyp.expression : undefined;
      const operator = fact?.kind === "Apply" ? fact.operator : fact;
      const cited = operator?.kind === "Ix" ? context[index - operator.index] : undefined;
      return cited?.kind === "Defn" && cited.definition.kind === "Bpragma"
        ? cited.definition.name.replace(/^.*!/, "").replace(/\$\d+$/, "")
        : undefined;
    })
    .find((name) => name !== undefined && REWRITING_PRAGMAS.includes(name));

// Backend.Prep.expand_defs: every visible operator definition and every pragma is substituted into
// what follows it.
const expandDefinitions = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    const definition = hyp.kind === "Defn" ? hyp.definition : undefined;
    if (
      definition?.kind === "Bpragma" ||
      (definition?.kind === "Operator" && hyp.kind === "Defn" && hyp.visibility === "Visible")
    )
      return consSubstitution(substituteExpr(current, definition.body), current);
    context.push(substituteHyp(current, hyp));
    return bumpBy(1, current);
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};

// Expr.Elab.let_normalize: each LET definition is substituted into its body.
const expandLets = (expression: Expr): Expr => {
  if (expression.kind !== "Let") return mapChildren(expression, expandLets);
  const [definition, ...definitions] = expression.definitions;
  if (!definition) return expandLets(expression.body);
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma")
    throw new TlapmBugError("Expr.Elab.let_normalize");
  const rest = at({ kind: "Let", definitions, body: expression.body }, expression);
  return expandLets(substituteExpr(consSubstitution(expandLets(definition.body), shift(0)), rest));
};

const TEMPORAL: Builtin[] = ["BoxTrue", "BoxFalse", "Diamond", "Actplus", "Leadsto", "Cdot"];

// The negation of Expr.Elab.non_temporal: some visible part uses a temporal operator.
const isTemporal = (expression: Expr): boolean => {
  if (expression.kind === "Tsub" || expression.kind === "Fair") return true;
  if (
    expression.kind === "Apply" &&
    expression.operator.kind === "Internal" &&
    TEMPORAL.includes(expression.operator.builtin)
  )
    return true;
  const children: Expr[] = [];
  mapScoped(
    undefined,
    expression,
    (_state, inner) => {
      children.push(inner);
      return inner;
    },
    () => undefined,
    "visible",
  );
  return children.some(isTemporal);
};

const getRecordField = (base: Expr, point: ExceptPoint) => {
  const name =
    point.kind === "Dot"
      ? point.field
      : point.expression.kind === "String"
        ? point.expression.value
        : undefined;
  return base.kind === "Record" ? base.fields.find((field) => field.name === name) : undefined;
};

// Expr.Elab.except_normalize: an EXCEPT folds its updates into the function one path at a time,
// updating a record constructor in place, and grouping adjacent updates under the same key.
const expandExcepts = (expression: Expr): Expr => {
  if (expression.kind !== "Except") return mapChildren(expression, expandExcepts);
  const isSamePoint = (left: ExceptPoint, right: ExceptPoint) =>
    left.kind === "Dot"
      ? right.kind === "Dot" && left.field === right.field
      : right.kind === "Apply" && isEqualExpr(left.expression, right.expression);
  const select = (base: Expr, point: ExceptPoint) =>
    getRecordField(base, point)?.value ??
    at(
      point.kind === "Dot"
        ? { kind: "Dot", expression: base, field: point.field }
        : { kind: "FcnApp", function: base, args: [point.expression] },
      base,
    );
  const update = (base: Expr, point: ExceptPoint, value: Expr): Expr => {
    const field = getRecordField(base, point);
    if (base.kind !== "Record" || !field) {
      return at({ kind: "Except", function: base, specs: [{ trail: [point], value }] }, expression);
    }
    return {
      ...base,
      fields: base.fields.map((inner) => (inner.name === field.name ? { ...inner, value } : inner)),
    };
  };
  const apply = (base: Expr, specs: typeof expression.specs): Expr => {
    const [first, ...rest] = specs;
    if (!first) return base;
    const [point] = first.trail;
    if (!point) return apply(first.value, rest);
    const end = specs.findIndex(
      (spec) => spec.trail.length === 0 || !isSamePoint(spec.trail[0], point),
    );
    const group = end === -1 ? specs : specs.slice(0, end);
    const value = apply(
      select(base, point),
      group.map((spec) => ({ trail: spec.trail.slice(1), value: spec.value })),
    );
    return apply(update(base, point, value), specs.slice(group.length));
  };
  const updated = mapChildren(expression, expandExcepts);
  return updated.kind === "Except" ? apply(updated.function, updated.specs) : updated;
};

// Prep.normalize_expand: definitions expand, then Expr.Elab.normalize expands LET, and EXCEPT
// only when nothing is temporal.
export const normalizeExpand = (sequent: Sequent): Expr => {
  const pragma = getRewritingPragma(sequent.context);
  if (pragma !== undefined)
    throw new TlaUnsupportedError(`The ${pragma} pragma, which rewrites the obligation`);
  const expanded: Expr = { kind: "Sequent", sequent: expandDefinitions(sequent) };
  return isTemporal(expanded) ? expandLets(expanded) : expandExcepts(expandLets(expanded));
};

// Prep.extract_equalities, which Prep.flatten applies to each visible fact of what a backend
// receives: TRUE drops out of the conjunctions, and a fact left with nothing disappears. The PTL
// backend has made every equality an atom by then, so none splits off.
export const removeTrue = (expression: Expr): Expr | undefined => {
  if (expression.kind === "Internal" && expression.builtin === "TRUE") return undefined;
  if (expression.kind === "List" && expression.bullet !== "Or") {
    const items = expression.items.flatMap((item) => removeTrue(item) ?? []);
    if (items.length <= 1) return items[0];
    return { ...expression, bullet: "And", items };
  }
  if (
    expression.kind !== "Apply" ||
    expression.operator.kind !== "Internal" ||
    expression.operator.builtin !== "Conj" ||
    expression.args.length !== 2
  )
    return expression;
  const left = removeTrue(expression.args[0]);
  const right = removeTrue(expression.args[1]);
  return left && right ? { ...expression, args: [left, right] } : (left ?? right);
};
