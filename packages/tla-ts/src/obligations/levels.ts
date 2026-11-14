// A port of tlapm's Expr.Levels.

import { TlaProofError, TlapmBugError } from "../errors";
import {
  adjoin,
  adjoinAll,
  getBoundedFresh,
  getBoundFresh,
  getFresh,
  getLocalDefn,
  getParamFresh,
  getScopeAt,
  isBuiltinApply,
  mapAccumulate,
  type Bound,
  type Builtin,
  type Expr,
  type Hyp,
  type Level,
  type Scope,
} from "./expression";

interface LevelInfo {
  level: number;
  weights: boolean[];
  params: Set<string>;
}

const getInfo = (level: number, arity = 0): LevelInfo => ({
  level,
  weights: Array.from({ length: arity }, () => true),
  params: new Set(),
});

const BUILTIN_LEVELS: Partial<Record<Builtin, [number, number]>> = {
  TRUE: [0, 0],
  FALSE: [0, 0],
  Implies: [0, 2],
  Equiv: [0, 2],
  Conj: [0, 2],
  Disj: [0, 2],
  Neg: [0, 1],
  Eq: [0, 2],
  Neq: [0, 2],
  STRING: [0, 0],
  BOOLEAN: [0, 0],
  SUBSET: [0, 1],
  UNION: [0, 1],
  DOMAIN: [0, 1],
  Subseteq: [0, 2],
  Mem: [0, 2],
  Notmem: [0, 2],
  Setminus: [0, 2],
  Cap: [0, 2],
  Cup: [0, 2],
  Actplus: [3, 2],
  BoxTrue: [3, 1],
  BoxFalse: [3, 1],
  Diamond: [3, 1],
  Prime: [2, 1],
  StrongPrime: [2, 1],
  ENABLED: [1, 1],
  UNCHANGED: [2, 1],
  Leadsto: [3, 2],
  Cdot: [2, 2],
  Nat: [0, 0],
  Int: [0, 0],
  Real: [0, 0],
  Infinity: [0, 0],
  Plus: [0, 2],
  Minus: [0, 2],
  Times: [0, 2],
  Ratio: [0, 2],
  Quotient: [0, 2],
  Remainder: [0, 2],
  Exp: [0, 2],
  Divides: [0, 2],
  Lteq: [0, 2],
  Lt: [0, 2],
  Gteq: [0, 2],
  Gt: [0, 2],
  Range: [0, 2],
  Uminus: [0, 1],
  Seq: [0, 1],
  Len: [0, 1],
  BSeq: [0, 2],
  Cat: [0, 2],
  Append: [0, 2],
  Head: [0, 1],
  Tail: [0, 1],
  SubSeq: [0, 3],
  SelectSeq: [0, 2],
  OneArg: [0, 2],
  Extend: [0, 2],
  Print: [0, 2],
  PrintT: [0, 1],
  Assert: [0, 2],
  JavaTime: [0, 0],
  TLCGet: [0, 1],
  TLCSet: [0, 2],
  Permutations: [0, 1],
  SortSeq: [0, 2],
  RandomElement: [0, 1],
  Any: [0, 0],
  ToString: [0, 1],
  Unprimable: [0, 1],
};

export const LEVEL_NUMBERS: Record<Level, number> = {
  Constant: 0,
  State: 1,
  Action: 2,
  Temporal: 3,
  Unknown: 0,
};

const getUnion = (sets: Set<string>[]) => new Set(sets.flatMap((set) => [...set]));

const combineLevels = (infos: LevelInfo[]): LevelInfo => ({
  level: Math.max(0, ...infos.map((info) => info.level)),
  weights: [],
  params: getUnion(infos.map((info) => info.params)),
});

const hypLevels = new WeakMap<Scope, LevelInfo>();

const computeHypLevel = (scope: Scope): LevelInfo => {
  const hyp = scope.hyp;
  switch (hyp.kind) {
    case "Flex":
      return getInfo(1);
    case "Fresh":
      return { ...getInfo(LEVEL_NUMBERS[hyp.level], hyp.shape), params: new Set([hyp.name]) };
    case "Defn": {
      const definition = hyp.definition;
      if (definition.kind !== "Operator" && definition.kind !== "Bpragma") {
        throw new TlapmBugError();
      }
      return getLevelInfo(scope.rest, definition.body);
    }
    case "Fact":
      return getLevelInfo(scope.rest, hyp.expression);
  }
};

const getHypLevel = (scope: Scope): LevelInfo => {
  const cached = hypLevels.get(scope);
  if (cached) return cached;
  const info = computeHypLevel(scope);
  hypLevels.set(scope, info);
  return info;
};

const getBoundsLevel = (scope: Scope | undefined, bounds: Bound[], body: Expr) => {
  const domains = bounds.flatMap((bound) =>
    bound.domain.kind === "Domain" ? [getLevelInfo(scope, bound.domain.expression)] : [],
  );
  return combineLevels([
    getLevelInfo(adjoinAll(scope, bounds.map(getBoundFresh)), body),
    ...domains,
  ]);
};

const applyOperator = (operator: LevelInfo, args: LevelInfo[], from: Expr): LevelInfo => {
  if (operator.weights.length !== args.length) {
    throw new TlaProofError("Invalid number of arguments", {
      failure: "Expr.Levels: ARITY",
      locus: from.location,
    });
  }
  const weighted = args.filter((_arg, index) => operator.weights[index]);
  return {
    level: Math.max(operator.level, ...weighted.map((arg) => arg.level)),
    weights: [],
    params: getUnion([operator.params, ...weighted.map((arg) => arg.params)]),
  };
};

export const getContextLevel = (scope: Scope | undefined, hyps: Hyp[]) => {
  const [inner, levels] = mapAccumulate(scope, hyps, (current, hyp) => {
    const next = adjoin(current, hyp);
    return [next, getHypLevel(next).level];
  });
  return { scope: inner, level: Math.max(0, ...levels) };
};

export const getLevelInfo = (scope: Scope | undefined, expression: Expr): LevelInfo => {
  const recurse = (inner: Expr) => getLevelInfo(scope, inner);
  switch (expression.kind) {
    case "Ix": {
      const hypScope = getScopeAt(scope, expression.index - 1);
      if (!hypScope) throw new TlapmBugError();
      return getHypLevel(hypScope);
    }
    case "Internal": {
      const entry = BUILTIN_LEVELS[expression.builtin];
      if (!entry) throw new TlapmBugError();
      return getInfo(entry[0], entry[1]);
    }
    case "Opaque":
    case "String":
    case "Num":
      return getInfo(0);
    case "Lambda": {
      const body = getLevelInfo(
        adjoinAll(scope, expression.params.map(getParamFresh)),
        expression.body,
      );
      const names = new Set(expression.params.map((param) => param.name));
      return {
        level: body.level,
        weights: expression.params.map((param) => body.params.has(param.name)),
        params: new Set([...body.params].filter((name) => !names.has(name))),
      };
    }
    case "Apply": {
      const operator = expression.operator;
      if (isBuiltinApply(operator, "Prime") && operator.args.length === 1) {
        return recurse({ ...expression, operator: operator.args[0] });
      }
      if (operator.kind === "Opaque") {
        return applyOperator(
          getInfo(0, expression.args.length),
          expression.args.map(recurse),
          expression,
        );
      }
      if (operator.kind === "Internal" && expression.args.length === 1) {
        const arg = expression.args[0];
        switch (operator.builtin) {
          case "Prime":
          case "StrongPrime":
            if (recurse(arg).level > 1) throw new TlapmBugError();
            return getInfo(2, 1);
          case "ENABLED": {
            const info = recurse(arg);
            if (info.level > 2) throw new TlapmBugError();
            return { level: 1, weights: [], params: info.params };
          }
          case "UNCHANGED": {
            const info = recurse(arg);
            if (info.level > 1) throw new TlapmBugError();
            return { level: 2, weights: [], params: info.params };
          }
        }
      }
      if (operator.kind === "Internal" && operator.builtin === "Cdot") {
        expression.args.forEach(recurse);
        return getInfo(2);
      }
      if (operator.kind === "Internal" && operator.builtin === "Leadsto") {
        expression.args.forEach(recurse);
        return getInfo(3, 2);
      }
      return applyOperator(recurse(operator), expression.args.map(recurse), expression);
    }
    case "Sequent": {
      const context = getContextLevel(scope, expression.sequent.context);
      return getInfo(
        Math.max(context.level, getLevelInfo(context.scope, expression.sequent.active).level),
      );
    }
    case "With":
    case "Dot":
    case "Parens":
      return recurse(expression.expression);
    case "Let":
      return getLevelInfo(
        adjoinAll(scope, expression.definitions.map(getLocalDefn)),
        expression.body,
      );
    case "If":
      return combineLevels(
        [expression.condition, expression.consequent, expression.alternative].map(recurse),
      );
    case "List":
      return combineLevels(expression.items.map(recurse));
    case "Quant":
    case "Fcn":
      return getBoundsLevel(scope, expression.bounds, expression.body);
    case "SetOf":
      return getBoundsLevel(scope, expression.bounds, expression.element);
    case "Tquant":
      getLevelInfo(
        adjoinAll(
          scope,
          expression.names.map((name) => ({ kind: "Flex", name })),
        ),
        expression.body,
      );
      return getInfo(3);
    case "Choose":
    case "SetSt": {
      const domainLevel = expression.domain && recurse(expression.domain);
      const hyp = expression.domain
        ? getBoundedFresh(expression.name, expression.domain)
        : getFresh(expression.name, "Constant");
      return combineLevels([
        getLevelInfo(adjoin(scope, hyp), expression.body),
        ...(domainLevel ? [domainLevel] : []),
      ]);
    }
    case "SetEnum":
    case "Tuple":
      return combineLevels(expression.elements.map(recurse));
    case "Product":
      return combineLevels(expression.factors.map(recurse));
    case "FcnApp":
      return combineLevels([expression.function, ...expression.args].map(recurse));
    case "Arrow":
      return combineLevels([recurse(expression.domain), recurse(expression.range)]);
    case "Rect":
    case "Record":
      return combineLevels(expression.fields.map((field) => recurse(field.value)));
    case "Except":
      return combineLevels([
        recurse(expression.function),
        ...expression.specs.flatMap((spec) => [
          ...spec.trail.flatMap((point) =>
            point.kind === "Apply" ? [recurse(point.expression)] : [],
          ),
          recurse(spec.value),
        ]),
      ]);
    case "Sub":
      return {
        ...combineLevels([recurse(expression.action), recurse(expression.subscript)]),
        level: 2,
      };
    case "Tsub":
    case "Fair":
      recurse(expression.action);
      recurse(expression.subscript);
      return getInfo(3);
    case "Case":
      return combineLevels([
        ...expression.arms.flatMap((arm) => [recurse(arm.condition), recurse(arm.body)]),
        ...(expression.other ? [recurse(expression.other)] : []),
      ]);
    case "Bang":
    case "At":
      throw new TlapmBugError();
  }
};
