// A port of tlapm's Expr.Elab.normalize, which the backends run on each obligation after expanding
// its definitions: LET definitions are inlined, and the updates of an EXCEPT fold into the
// function they update.

import { TlaProofError } from "../../errors";
import {
  at,
  consSubstitution,
  createContextMap,
  getChildren,
  isEqualExpr,
  mapChildren,
  mapExceptSpecs,
  mapHyp,
  shift,
  substituteExpr,
  type Expr,
  type ExceptPoint,
  type Hyp,
  type Sequent,
} from "../../obligation-expression";

type ExceptExpr = Extract<Expr, { kind: "Except" }>;

type ExceptSpec = ExceptExpr["specs"][number];

const TEMPORAL_BUILTINS = new Set(["BoxTrue", "BoxFalse", "Diamond", "Actplus", "Leadsto", "Cdot"]);

// The expressions of a hypothesis that Visit.iter visits, none for a hidden one.
const getVisitedExprs = (hyp: Hyp): Expr[] => {
  switch (hyp.kind) {
    case "Fresh":
      return hyp.domain ? [hyp.domain] : [];
    case "Flex":
      return [];
    case "Defn":
      return hyp.visibility === "Hidden" ||
        (hyp.definition.kind !== "Operator" && hyp.definition.kind !== "Bpragma")
        ? []
        : [hyp.definition.body];
    case "Fact":
      return hyp.visibility === "Hidden" ? [] : [hyp.expression];
  }
};

// non_temporal: no temporal operator, but in hidden hypotheses.
export const isNonTemporal = (expression: Expr): boolean => {
  if (expression.kind === "Tsub" || expression.kind === "Fair") return false;
  if (
    expression.kind === "Apply" &&
    expression.operator.kind === "Internal" &&
    TEMPORAL_BUILTINS.has(expression.operator.builtin)
  )
    return false;
  if (expression.kind === "Sequent") {
    const sequent = expression.sequent;
    return [...sequent.context.flatMap(getVisitedExprs), sequent.active].every(isNonTemporal);
  }
  return getChildren(expression).every(isNonTemporal);
};

// let_normalize: each LET definition is substituted into the rest of the LET.
const normalizeLet = (expression: Expr): Expr => {
  if (expression.kind !== "Let") return mapChildren(expression, normalizeLet);
  const [definition, ...definitions] = expression.definitions;
  if (!definition) return normalizeLet(expression.body);
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
    throw new TlaProofError(
      definition.kind === "Instance"
        ? "Found INSTANCE in Expr.Elab.let_normalize, all INSTANCE statements have been replaced with definitions in Module.Elab "
        : "Expr.Elab.let_normalize",
    );
  }
  const operator = normalizeLet(definition.body);
  const rest: Expr = { ...expression, definitions };
  return normalizeLet(substituteExpr(consSubstitution(operator, shift(0)), rest));
};

const getAccess = (base: Expr, point: ExceptPoint): Expr =>
  point.kind === "Dot"
    ? at({ kind: "Dot", expression: base, field: point.field }, base)
    : at({ kind: "FcnApp", function: base, args: [point.expression] }, base);

const isSameHead = (left: ExceptPoint, right: ExceptPoint) =>
  left.kind === "Dot"
    ? right.kind === "Dot" && left.field === right.field
    : right.kind === "Apply" && isEqualExpr(left.expression, right.expression);

// The field of a record constructor that a point names, as a field or as a string argument.
const getRecordField = (record: Expr, point: ExceptPoint) => {
  const name =
    point.kind === "Dot"
      ? point.field
      : point.expression.kind === "String"
        ? point.expression.value
        : undefined;
  return record.kind === "Record" && name !== undefined
    ? record.fields.find((field) => field.name === name)
    : undefined;
};

// except_normalize: [f EXCEPT p1 = b1, ...] folds left to right into f, sharing each prefix of
// adjacent updates and updating a record constructor in place on a field it has.
const normalizeExcept = (expression: Expr): Expr => {
  if (expression.kind !== "Except") return mapChildren(expression, normalizeExcept);
  const except = expression;
  const select = (base: Expr, point: ExceptPoint) =>
    getRecordField(base, point)?.value ?? getAccess(base, point);
  const update = (base: Expr, point: ExceptPoint, value: Expr): Expr => {
    const field = getRecordField(base, point);
    if (base.kind !== "Record" || !field)
      return at({ kind: "Except", function: base, specs: [{ trail: [point], value }] }, except);
    const fields = base.fields.map((entry) =>
      entry.name === field.name ? { name: entry.name, value } : entry,
    );
    return at({ kind: "Record", fields }, base);
  };
  const apply = (base: Expr, specs: ExceptSpec[]): Expr => {
    const [first, ...others] = specs;
    if (!first) return base;
    if (first.trail.length === 0) return apply(first.value, others);
    const head = first.trail[0];
    const end = specs.findIndex(
      (spec) => spec.trail.length === 0 || !isSameHead(spec.trail[0], head),
    );
    const count = end === -1 ? specs.length : end;
    const tails = specs
      .slice(0, count)
      .map((spec) => ({ trail: spec.trail.slice(1), value: spec.value }));
    return apply(update(base, head, apply(select(base, head), tails)), specs.slice(count));
  };
  return apply(normalizeExcept(except.function), mapExceptSpecs(except.specs, normalizeExcept));
};

// let_normalize on each hypothesis, and whether the context so far is non_temporal.
const normalizeLetContext = createContextMap(true, (isContextNonTemporal, hyp) => [
  isContextNonTemporal && getVisitedExprs(hyp).every(isNonTemporal),
  mapHyp(hyp, normalizeLet, "all"),
]);

const normalizeExceptContext = createContextMap(undefined, (_state, hyp) => [
  undefined,
  mapHyp(hyp, normalizeExcept, "all"),
]);

// normalize, on an obligation as a sequent expression, as Backend.Prep.normalize_expr calls it.
export const normalizeSequent = (sequent: Sequent): Sequent => {
  const inlined = normalizeLetContext(sequent.context);
  const active = normalizeLet(sequent.active);
  return inlined.state && isNonTemporal(sequent.active)
    ? {
        context: normalizeExceptContext(sequent.context, inlined.context).context,
        active: normalizeExcept(active),
      }
    : { context: inlined.context, active };
};
