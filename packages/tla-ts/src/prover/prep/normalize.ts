// What Backend.Prep does to an obligation before a backend's frontend: normalize_expand, which
// expands definitions, runs Expr.Elab.normalize and the frontend methods the obligation cites, then
// trivial and flatten.

import { TlapmBugError, TlaProofError } from "../../errors";
import { expandActionOperators, lambdify } from "../../obligations/action";
import { createAnonymizer } from "../../obligations/anonymize";
import { isEqualExpr } from "../../obligations/equality";
import {
  applyBuiltin,
  at,
  createContextMap,
  getChildren,
  mapChildren,
  mapExceptSpecs,
  mapHyp,
  type Bound,
  type ExceptPoint,
  type Expr,
  type Hyp,
  type Sequent,
} from "../../obligations/expression";
import {
  bumpBy,
  consSubstitution,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Substitution,
} from "../../obligations/substitution";
import type { OldMethod } from "../../obligations/pragma";
import { implicationToEnabled } from "./enabled-axioms";
import { checkLevelChange } from "./level-comparison";
import { findMethods } from "./methods";

const createDefinitionExpander = (isPragmaExpanded: boolean) =>
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

const expandDefinitionsAndPragmas = createDefinitionExpander(true);

const expandDefinitions = createDefinitionExpander(false);

// expand_defs: each visible operator definition and each pragma, whatever its visibility,
// substitutes into the rest of the obligation and leaves the context. Toolbox.expand_defs leaves
// the pragmas.
export const expandDefs = (sequent: Sequent, isPragmaExpanded = true): Sequent => {
  const expanded = (isPragmaExpanded ? expandDefinitionsAndPragmas : expandDefinitions)(
    sequent.context,
  );
  return { context: expanded.context, active: substituteExpr(expanded.state, sequent.active) };
};

type ExceptSpec = Extract<Expr, { kind: "Except" }>["specs"][number];

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

// Elab.non_temporal: no temporal operator, but in hidden hypotheses.
const isNonTemporal = (expression: Expr): boolean => {
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

// Elab.let_normalize: each LET definition is substituted into the rest of the LET.
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

// Elab.except_normalize: [f EXCEPT p1 = b1, ...] folds left to right into f, sharing each prefix of
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

// Elab.normalize, on an obligation as a sequent expression, as Prep.normalize_expr calls it: LET
// definitions inline, and the updates of an EXCEPT fold into the function they update.
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

// expand_enabled_cdot: the first frontend the methods cite, in tlapm's order, transforms the
// obligation. Its soundness checks throw a TlaProverError, as tlapm then runs no backend.
const expandEnabledCdot = (sequent: Sequent, frontends: Set<string>): Sequent => {
  const isEnabled = frontends.has("expandenabled");
  const isCdot = frontends.has("expandcdot");
  const isAutoUse = frontends.has("autouse");
  const isLambdify = frontends.has("lambdify");
  if (!isEnabled && !isCdot && !isLambdify) {
    if (frontends.has("levelcomparison")) return checkLevelChange(sequent);
    if (frontends.has("enabledaxioms")) return implicationToEnabled(sequent);
    return sequent;
  }
  // Expr.Anon's anon, which only meets the names that lambdification binds.
  const anonymizer = createAnonymizer(
    { value: 0 },
    () => {
      throw new TlapmBugError();
    },
    () => {},
  );
  const expression: Expr = { kind: "Sequent", sequent };
  const result =
    isEnabled || isCdot
      ? expandActionOperators(anonymizer, () => {}, undefined, expression, {
          isEnabled,
          isCdot,
          isAutoUse,
        })
      : lambdify(anonymizer, () => {}, undefined, expression, {
          isEnabled: true,
          isCdot: true,
          isAutoUse,
        });
  if (result.kind !== "Sequent") throw new TlapmBugError();
  return result.sequent;
};

// normalize_expand: expand_defs, Elab.normalize, then the frontends the obligation cites.
export const normalizeExpand = (
  obligation: { sequent: Sequent; method?: OldMethod },
  methods = findMethods(obligation),
) => expandEnabledCdot(normalizeSequent(expandDefs(obligation.sequent)), methods.frontends);

// trivial: the goal is TRUE, or find_fact finds it as a hypothesis, visible or not: a fact
// alpha-equivalent to it, or the x \in S of a declaration NEW x \in S.
export const isTrivial = (sequent: Sequent) =>
  (sequent.active.kind === "Internal" && sequent.active.builtin === "TRUE") ||
  sequent.context.some((hyp, index) => {
    if (hyp.kind === "Fact")
      return isEqualExpr(hyp.expression, shiftExpr(index - sequent.context.length, sequent.active));
    if (hyp.kind !== "Fresh" || !hyp.domain) return false;
    return isEqualExpr(
      applyBuiltin("Mem", [{ kind: "Ix", index: 1 }, shiftExpr(1, hyp.domain)], {}),
      shiftExpr(index + 1 - sequent.context.length, sequent.active),
    );
  });

const isUnbounded = (bound: Bound) => bound.domain.kind === "NoDomain";

// extract_equalities: the equalities in a conjunction, apart from the rest of it.
const extractEqualities = (expression: Expr): [Expr[], Expr | undefined] => {
  if (expression.kind === "List" && (expression.bullet === "And" || expression.bullet === "Refs")) {
    const parts = expression.items.map(extractEqualities);
    const equalities = parts.flatMap((part) => part[0]);
    const rest = parts.flatMap((part) => (part[1] ? [part[1]] : []));
    if (rest.length <= 1) return [equalities, rest[0]];
    return [equalities, { ...expression, bullet: "And", items: rest }];
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    if (builtin === "Conj" && expression.args.length === 2) {
      const left = extractEqualities(expression.args[0]);
      const right = extractEqualities(expression.args[1]);
      const equalities = [...left[0], ...right[0]];
      if (left[1] && right[1]) return [equalities, { ...expression, args: [left[1], right[1]] }];
      return [equalities, left[1] ?? right[1]];
    }
    if (builtin === "Eq") return [[expression], undefined];
  }
  if (expression.kind === "Internal" && expression.builtin === "TRUE") return [[], undefined];
  if (
    expression.kind === "Quant" &&
    expression.quantifier === "Forall" &&
    expression.bounds.every(isUnbounded)
  ) {
    const extracted = extractEqualities(expression.body);
    const quantify = (inner: Expr, from: Expr) =>
      at({ kind: "Quant", quantifier: "Forall", bounds: expression.bounds, body: inner }, from);
    return [
      extracted[0].map((equality) => quantify(equality, equality)),
      extracted[1] && quantify(extracted[1], expression),
    ];
  }
  return [[], expression];
};

// flatten: each visible fact becomes the rest of it, then its equalities.
export const flatten = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    if (hyp.kind !== "Fact" || hyp.visibility !== "Visible") {
      context.push(substituteHyp(current, hyp));
      return bumpBy(1, current);
    }
    const extracted = extractEqualities(hyp.expression);
    const facts = [...(extracted[1] ? [extracted[1]] : []), ...extracted[0]];
    facts.forEach((fact, index) =>
      context.push({ ...hyp, expression: shiftExpr(index, substituteExpr(current, fact)) }),
    );
    return { kind: "Compose", outer: shift(facts.length - 1), inner: bumpBy(1, current) };
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};
