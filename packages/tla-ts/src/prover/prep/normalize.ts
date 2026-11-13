import { TlapmBugError, TlaProofError, TlaProverError } from "../../errors";
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
  type Locus,
  type Sequent,
  type Warn,
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

export const expandDefs = (sequent: Sequent, isPragmaExpanded = true): Sequent => {
  const expanded = (isPragmaExpanded ? expandDefinitionsAndPragmas : expandDefinitions)(
    sequent.context,
  );
  return { context: expanded.context, active: substituteExpr(expanded.state, sequent.active) };
};

type ExceptSpec = Extract<Expr, { kind: "Except" }>["specs"][number];

const TEMPORAL_BUILTINS = new Set(["BoxTrue", "BoxFalse", "Diamond", "Actplus", "Leadsto", "Cdot"]);

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

const normalizeLet = (expression: Expr): Expr => {
  if (expression.kind !== "Let") return mapChildren(expression, normalizeLet);
  const definition = expression.definitions[0];
  if (!definition) return normalizeLet(expression.body);
  if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
    throw new TlaProofError(
      definition.kind === "Instance"
        ? "Found INSTANCE in Expr.Elab.let_normalize, all INSTANCE statements have been replaced with definitions in Module.Elab "
        : "Expr.Elab.let_normalize",
    );
  }
  const operator = normalizeLet(definition.body);
  const rest: Expr = { ...expression, definitions: expression.definitions.slice(1) };
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
    const first = specs[0];
    if (!first) return base;
    if (first.trail.length === 0) return apply(first.value, specs.slice(1));
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

const normalizeLetContext = createContextMap(true, (isContextNonTemporal, hyp) => [
  isContextNonTemporal && getVisitedExprs(hyp).every(isNonTemporal),
  mapHyp(hyp, normalizeLet, "all"),
]);

const normalizeExceptContext = createContextMap(undefined, (_state, hyp) => [
  undefined,
  mapHyp(hyp, normalizeExcept, "all"),
]);

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

// Only the first frontend the methods cite, in tlapm's order, transforms the obligation.
const expandEnabledCdot = (
  sequent: Sequent,
  locus: Locus | undefined,
  isEnabledAxiomsSound: boolean | undefined,
  frontends: Set<string>,
  onWarning: Warn,
): Sequent => {
  const isEnabled = frontends.has("expandenabled");
  const isCdot = frontends.has("expandcdot");
  const isAutoUse = frontends.has("autouse");
  const isLambdify = frontends.has("lambdify");
  if (!isEnabled && !isCdot && !isLambdify) {
    if (frontends.has("levelcomparison")) return checkLevelChange(sequent);
    if (!frontends.has("enabledaxioms")) return sequent;
    if (isEnabledAxiomsSound !== undefined)
      onWarning({ text: "expr has ENABLEDaxioms property ===", channel: "stdout" });
    if (isEnabledAxiomsSound === false)
      throw new TlaProverError("ENABLEDaxioms depends on assumptions of level > 1 \n\n");
    return implicationToEnabled(sequent, locus, onWarning);
  }
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
      ? expandActionOperators(anonymizer, onWarning, undefined, expression, {
          isEnabled,
          isCdot,
          isAutoUse,
        })
      : lambdify(anonymizer, onWarning, undefined, expression, {
          isEnabled: true,
          isCdot: true,
          isAutoUse,
        });
  if (result.kind !== "Sequent") throw new TlapmBugError();
  return result.sequent;
};

export const normalizeExpand = (
  obligation: {
    sequent: Sequent;
    method?: OldMethod;
    locus?: Locus;
    isEnabledAxiomsSound?: boolean;
  },
  methods = findMethods(obligation),
  onWarning: Warn = () => {},
) =>
  expandEnabledCdot(
    normalizeSequent(expandDefs(obligation.sequent)),
    obligation.locus,
    obligation.isEnabledAxiomsSound,
    methods.frontends,
    onWarning,
  );

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
