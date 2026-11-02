// tlapm's expansions of temporal operators (Expr.Tla_norm), constant detection (Expr.Constness), and
// the time of a fact (Expr.Temporal_props): a fact holds always when it is closed under [].

import {
  adjoin,
  adjoinAll,
  applyBuiltin,
  at,
  getFresh,
  getLocalDefn,
  getScopeAt,
  mapChildren,
  type Builtin,
  type Expr,
  type Hyp,
  type Scope,
  type Time,
} from "./expression";

const isApplied = (expression: Expr, builtins: Builtin[]) =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  builtins.includes(expression.operator.builtin);

const unchanged = (expression: Expr) => applyBuiltin("UNCHANGED", [expression], expression);

const getEquality = (expression: Expr) =>
  applyBuiltin("Eq", [applyBuiltin("Prime", [expression], expression), expression], expression);

// E_tla_norm.rewrite_unch: UNCHANGED <<x, <<y>>>> as x' = x /\ y' = y.
export const rewriteUnchanged = (expression: Expr): Expr => {
  const flatten = (inner: Expr): Expr[] =>
    inner.kind === "Tuple" ? inner.elements.flatMap(flatten) : [inner];
  const items = flatten(expression);
  if (items.length === 0) return at({ kind: "Internal", builtin: "TRUE" }, expression);
  if (items.length === 1) return getEquality(items[0]);
  return at({ kind: "List", bullet: "And", items: items.map(getEquality) }, expression);
};

// Each visitor rewrites the outermost match and leaves the rest of the tree as it is.
const rewrite =
  (match: (expression: Expr, recurse: (inner: Expr) => Expr) => Expr | undefined) =>
  (expression: Expr): Expr => {
    const recurse = rewrite(match);
    return match(expression, recurse) ?? mapChildren(expression, recurse);
  };

export const expandLeadsto = rewrite((expression, recurse) =>
  expression.kind === "Apply" && isApplied(expression, ["Leadsto"])
    ? applyBuiltin(
        "BoxTrue",
        [
          applyBuiltin(
            "Implies",
            [
              recurse(expression.args[0]),
              applyBuiltin("Diamond", [recurse(expression.args[1])], expression),
            ],
            expression,
          ),
        ],
        expression,
      )
    : undefined,
);

export const expandFairness = rewrite((expression) => {
  if (expression.kind !== "Fair") return undefined;
  const action = expression.action;
  const subscript = expression.subscript;
  const enabled = applyBuiltin(
    "ENABLED",
    [at({ kind: "Sub", modal: "Dia", action, subscript }, action)],
    action,
  );
  const outer = expression.fairness === "Weak" ? "Diamond" : "BoxTrue";
  const inner = expression.fairness === "Weak" ? "BoxTrue" : "Diamond";
  return applyBuiltin(
    "Implies",
    [
      applyBuiltin(outer, [applyBuiltin(inner, [enabled], action)], action),
      applyBuiltin(
        "BoxTrue",
        [at({ kind: "Tsub", modal: "Dia", action, subscript }, action)],
        action,
      ),
    ],
    action,
  );
});

export const expandAction = rewrite((expression, recurse) => {
  if (expression.kind !== "Sub" && expression.kind !== "Tsub") return undefined;
  const action = recurse(expression.action);
  const subscript = recurse(expression.subscript);
  const step =
    expression.modal === "Box"
      ? applyBuiltin("Disj", [action, unchanged(subscript)], expression)
      : applyBuiltin(
          "Conj",
          [action, applyBuiltin("Neg", [unchanged(subscript)], expression)],
          expression,
        );
  if (expression.kind === "Sub") return step;
  return applyBuiltin(expression.modal === "Box" ? "BoxTrue" : "Diamond", [step], expression);
});

// Only getTime uses this, so the locations rewriteUnchanged gives do not matter.
const expandUnchanged = rewrite((expression) =>
  expression.kind === "Apply" && isApplied(expression, ["UNCHANGED"])
    ? rewriteUnchanged(expression.args[0])
    : undefined,
);

const TEMPORAL_BUILTINS: Builtin[] = [
  "Prime",
  "StrongPrime",
  "Leadsto",
  "ENABLED",
  "UNCHANGED",
  "Cdot",
  "Actplus",
  "BoxTrue",
  "BoxFalse",
  "Diamond",
];

const constantBodies = new WeakMap<Expr, boolean>();

const isConstantHyp = (scope: Scope | undefined, hyp: Hyp) => {
  switch (hyp.kind) {
    case "Fresh":
      return hyp.level === "Constant";
    case "Defn":
      return hyp.definition.kind === "Operator" && isConstant(scope, hyp.definition.body);
    case "Fact":
      return isConstant(scope, hyp.expression);
    case "Flex":
      return false;
  }
};

const bindConstants = (scope: Scope | undefined, names: string[]) =>
  adjoinAll(
    scope,
    names.map((name) => getFresh(name, "Constant")),
  );

export const isConstant = (scope: Scope | undefined, expression: Expr): boolean => {
  const recurse = (inner: Expr) => isConstant(scope, inner);
  switch (expression.kind) {
    case "Ix": {
      const found = getScopeAt(scope, expression.index - 1);
      const hyp = found?.hyp;
      if (hyp?.kind === "Fresh") return hyp.level === "Constant";
      if (hyp?.kind !== "Defn" || hyp.definition.kind !== "Operator" || hyp.isConstnessUnset)
        return false;
      const body = hyp.definition.body;
      const cached = constantBodies.get(body);
      if (cached !== undefined) return cached;
      const result = isConstant(found?.rest, body);
      constantBodies.set(body, result);
      return result;
    }
    case "Opaque":
    case "String":
    case "Num":
    case "At":
      return true;
    case "Internal":
      return !TEMPORAL_BUILTINS.includes(expression.builtin);
    case "Tquant":
    case "Sub":
    case "Tsub":
    case "Fair":
      return false;
    case "Lambda":
      return isConstant(
        bindConstants(
          scope,
          expression.params.map((param) => param.name),
        ),
        expression.body,
      );
    case "Sequent": {
      const inner = expression.sequent.context.reduce<{
        scope: Scope | undefined;
        isGood: boolean;
      }>(
        (state, hyp) => ({
          scope: adjoin(state.scope, hyp),
          isGood: state.isGood && isConstantHyp(state.scope, hyp),
        }),
        { scope, isGood: true },
      );
      return inner.isGood && isConstant(inner.scope, expression.sequent.active);
    }
    case "Bang":
    case "With":
    case "Dot":
    case "Parens":
      return recurse(expression.expression);
    case "Apply":
      return recurse(expression.operator) && expression.args.every(recurse);
    case "Let": {
      const inner = expression.definitions.reduce<{ scope: Scope | undefined; isGood: boolean }>(
        (state, definition) => ({
          scope: adjoin(state.scope, getLocalDefn(definition)),
          isGood:
            state.isGood &&
            definition.kind === "Operator" &&
            isConstant(state.scope, definition.body),
        }),
        { scope, isGood: true },
      );
      return inner.isGood && isConstant(inner.scope, expression.body);
    }
    case "Quant":
    case "Fcn":
    case "SetOf": {
      const body = expression.kind === "SetOf" ? expression.element : expression.body;
      return (
        expression.bounds.every(
          (bound) => bound.domain.kind !== "Domain" || recurse(bound.domain.expression),
        ) &&
        isConstant(
          bindConstants(
            scope,
            expression.bounds.map((bound) => bound.name),
          ),
          body,
        )
      );
    }
    case "Choose":
    case "SetSt":
      return (
        (expression.domain === undefined || recurse(expression.domain)) &&
        isConstant(bindConstants(scope, [expression.name]), expression.body)
      );
    case "If":
      return (
        recurse(expression.condition) &&
        recurse(expression.consequent) &&
        recurse(expression.alternative)
      );
    case "List":
      return expression.items.every(recurse);
    case "Tuple":
    case "SetEnum":
      return expression.elements.every(recurse);
    case "Product":
      return expression.factors.every(recurse);
    case "FcnApp":
      return recurse(expression.function) && expression.args.every(recurse);
    case "Rect":
    case "Record":
      return expression.fields.every((field) => recurse(field.value));
    case "Arrow":
      return recurse(expression.domain) && recurse(expression.range);
    case "Except":
      return (
        recurse(expression.function) &&
        expression.specs.every(
          (spec) =>
            spec.trail.every((point) => point.kind === "Dot" || recurse(point.expression)) &&
            recurse(spec.value),
        )
      );
    case "Case":
      return (
        expression.arms.every((arm) => recurse(arm.condition) && recurse(arm.body)) &&
        (expression.other === undefined || recurse(expression.other))
      );
  }
};

// Temporal_props.box_closure: whether the formula is equivalent to [] of itself, judged by its
// shape. Under a negation or on the left of =>, <> takes the place of [].
const isClosed = (scope: Scope | undefined, expression: Expr, isBox: boolean): boolean => {
  if (isConstant(scope, expression)) return true;
  if (expression.kind === "Internal")
    return ["Eq", "Neq", "UNCHANGED", "TRUE", "FALSE"].includes(expression.builtin);
  if (expression.kind === "List")
    return expression.items.every((item) => isClosed(scope, item, isBox));
  if (expression.kind === "Sequent") {
    return isClosed(adjoinAll(scope, expression.sequent.context), expression.sequent.active, isBox);
  }
  if (expression.kind !== "Apply") return false;
  const args = expression.args;
  if (isApplied(expression, ["BoxTrue", "BoxFalse"]) && isBox) return true;
  if (isApplied(expression, ["Diamond"]) && !isBox) return true;
  if (args.length === 1 && isApplied(expression, ["BoxTrue", "BoxFalse", "Diamond", "Prime"]))
    return isClosed(scope, args[0], isBox);
  if (args.length === 1 && isApplied(expression, ["Neg"])) return isClosed(scope, args[0], !isBox);
  if (args.length === 2 && isApplied(expression, ["Conj", "Disj"]))
    return isClosed(scope, args[0], isBox) && isClosed(scope, args[1], isBox);
  if (args.length === 2 && isApplied(expression, ["Implies"]))
    return isClosed(scope, args[0], !isBox) && isClosed(scope, args[1], isBox);
  if (args.length === 2 && isApplied(expression, ["Equiv"]))
    return [true, false].every(
      (isFlipped) =>
        isClosed(scope, args[0], isBox !== isFlipped) &&
        isClosed(scope, args[1], isBox === isFlipped),
    );
  return (
    isClosed(scope, expression.operator, isBox) && args.every((arg) => isClosed(scope, arg, isBox))
  );
};

export const getTime = (scope: Scope | undefined, expression: Expr): Time =>
  isClosed(scope, expandLeadsto(expandFairness(expandAction(expandUnchanged(expression)))), true)
    ? "Always"
    : "Now";

// Temporal_props.check_time_change: a proof stays in the always scope while no fact it assumes
// holds only now.
export const getScopeTime = (context: Hyp[], time: Time): Time =>
  time === "Always" && context.some((hyp) => hyp.kind === "Fact" && hyp.time === "Now")
    ? "Now"
    : time;
