// Ported from Zenon's expr.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// Formulas and terms, hash-consed so that equal expressions are the same object. Like Zenon,
// equality treats bound variables up to renaming, and a hash ignores the names of bound variables.
// Each run builds its expressions in its own store, so that fresh names and hashes start over.

import { TlaZenonError } from "../../errors";
import { combine, createHasher, toInt63, type Int63 } from "./ocaml";

// What every expression caches about itself.
interface ExprData {
  id: number;
  hash: number;
  skeleton: Int63;
  freeVars: string[];
  size: number;
  taus: number;
  metas: Expr[];
}

export interface VarExpr extends ExprData {
  kind: "var";
  symbol: string;
  args: [];
}

// A metavariable stands for a term that instantiates its quantifier.
export interface MetaExpr extends ExprData {
  kind: "meta";
  symbol: "";
  args: [Expr];
}

export interface AppExpr extends ExprData {
  kind: "app";
  symbol: string;
  args: Expr[];
}

export interface NotExpr extends ExprData {
  kind: "not";
  symbol: "";
  args: [Expr];
}

export interface BinaryExpr extends ExprData {
  kind: "and" | "or" | "imply" | "equiv";
  symbol: "";
  args: [Expr, Expr];
}

export interface ConstantExpr extends ExprData {
  kind: "true" | "false";
  symbol: "";
  args: [];
}

// `symbol` is the type of the bound variable.
export interface BinderExpr extends ExprData {
  kind: "all" | "ex" | "tau" | "lam";
  symbol: string;
  args: [VarExpr, Expr];
}

export type Expr = VarExpr | MetaExpr | AppExpr | NotExpr | BinaryExpr | ConstantExpr | BinderExpr;

export type ExprKind = Expr["kind"];

// An application to two arguments, such as an equality or another relation between two terms.
export type RelationExpr = AppExpr & { args: [Expr, Expr] };

export type NegatedRelationExpr = NotExpr & { args: [RelationExpr] };

const VAR_PREFIX = "zenon_V";
export const UNIVERSE = "zenon_U";
export const GOAL_NAME = "zenon_G";

const SKELETONS = {
  true: toInt63(0xb063cd7),
  false: toInt63(0xd5ab9f0),
  meta: toInt63(0x33d092c),
  app: toInt63(0x33b9c25),
  not: toInt63(0x7c3e7d2),
  and: toInt63(0xccdc15b),
  or: toInt63(0x49b55b9),
  imply: toInt63(0x7ebfa6f),
  equiv: toInt63(0xb0f18f7),
  all: toInt63(0xfb437ff),
  ex: toInt63(0x0716b52),
  tau: toInt63(0x4ae7fad),
  lam: toInt63(0x24adcb3),
};

const ZERO = toInt63(0);

const makeConstant = (kind: "true" | "false", id: number, skeleton: Int63): ConstantExpr => ({
  id,
  kind,
  symbol: "",
  args: [],
  hash: createHasher().hashIntAndStrings(skeleton.high, skeleton.low, []),
  skeleton,
  freeVars: [],
  size: 1,
  taus: 0,
  metas: [],
});

export const TRUE = makeConstant("true", 0, SKELETONS.true);
export const FALSE = makeConstant("false", 1, SKELETONS.false);

const isBinary = (expression: Expr): expression is BinaryExpr =>
  expression.kind === "and" ||
  expression.kind === "or" ||
  expression.kind === "imply" ||
  expression.kind === "equiv";

export const isBinder = (expression: Expr): expression is BinderExpr =>
  expression.kind === "all" ||
  expression.kind === "ex" ||
  expression.kind === "tau" ||
  expression.kind === "lam";

// Zenon's str_union: the names of the first list missing from the second, in reverse, then the
// second. Hashes depend on this order.
const unionNames = (left: string[], right: string[]) => {
  if (left.length === 0) return right;
  if (right.length === 0) return left;
  const result = [...right];
  for (const name of left) if (!result.includes(name)) result.unshift(name);
  return result;
};

const removeName = (name: string, names: string[]) => {
  const index = names.indexOf(name);
  return index === -1 ? names : [...names.slice(0, index), ...names.slice(index + 1)];
};

export const difference = (left: Expr[], right: Expr[]) =>
  left.filter((inner) => !right.includes(inner));

// Zenon's union on small sets: the first list's new elements in reverse, then the second list.
export const union = (left: Expr[], right: Expr[]) => {
  const added = difference(left, right);
  return added.length === 0 ? right : [...added.reverse(), ...right];
};

export const isDisjoint = (left: Expr[], right: Expr[]) =>
  !left.some((inner) => right.includes(inner));

const intersects = (env: Expr[], names: string[]) =>
  names.some((name) => env.some((variable) => variable.symbol === name));

const isSameBinding = (leftEnv: Expr[], left: Expr, rightEnv: Expr[], right: Expr) => {
  const leftIndex = leftEnv.indexOf(left);
  const rightIndex = rightEnv.indexOf(right);
  return leftIndex === -1 ? rightIndex === -1 && left === right : leftIndex === rightIndex;
};

const isEqualInEnv = (leftEnv: Expr[], rightEnv: Expr[], left: Expr, right: Expr): boolean => {
  const isLeftBound = intersects(leftEnv, left.freeVars);
  const isRightBound = intersects(rightEnv, right.freeVars);
  if (!isLeftBound && !isRightBound) return left === right;
  if (!isLeftBound || !isRightBound || left.kind !== right.kind) return false;
  switch (left.kind) {
    case "var":
      return isSameBinding(leftEnv, left, rightEnv, right);
    case "meta":
      return right.kind === "meta" && left.args[0] === right.args[0];
    case "app":
      return (
        right.kind === "app" &&
        left.symbol === right.symbol &&
        left.args.length === right.args.length &&
        left.args.every((inner, index) => isEqualInEnv(leftEnv, rightEnv, inner, right.args[index]))
      );
    case "not":
      return right.kind === "not" && isEqualInEnv(leftEnv, rightEnv, left.args[0], right.args[0]);
    case "and":
    case "or":
    case "imply":
    case "equiv":
      return (
        isBinary(right) &&
        isEqualInEnv(leftEnv, rightEnv, left.args[0], right.args[0]) &&
        isEqualInEnv(leftEnv, rightEnv, left.args[1], right.args[1])
      );
    case "true":
    case "false":
      return true;
    default:
      return (
        isBinder(right) &&
        left.args[1].freeVars.includes(left.args[0].symbol) ===
          right.args[1].freeVars.includes(right.args[0].symbol) &&
        isEqualInEnv(
          [left.args[0], ...leftEnv],
          [right.args[0], ...rightEnv],
          left.args[1],
          right.args[1],
        )
      );
  }
};

const isEqualBody = (leftVar: Expr, rightVar: Expr, left: Expr, right: Expr) => {
  const isLeftBound = left.freeVars.includes(leftVar.symbol);
  const isRightBound = right.freeVars.includes(rightVar.symbol);
  return (
    (!isLeftBound && !isRightBound && left === right) ||
    (isLeftBound && isRightBound && isEqualInEnv([leftVar], [rightVar], left, right))
  );
};

// Zenon's HashedExpr.equal on two binders whose children are already hash-consed.
const isSameBinder = (left: BinderExpr, right: BinderExpr) =>
  left.kind === right.kind &&
  left.symbol === right.symbol &&
  (left.args[0] === right.args[0]
    ? left.args[1] === right.args[1]
    : isEqualBody(left.args[0], right.args[0], left.args[1], right.args[1]));

// The symbol is part of the narrowed type, so a failed test for one symbol keeps the expression an
// application for the next test.
export const isApp = <Symbol extends string>(
  expression: Expr,
  symbol: Symbol,
  arity?: number,
): expression is AppExpr & { symbol: Symbol } =>
  expression.kind === "app" &&
  expression.symbol === symbol &&
  (arity === undefined || expression.args.length === arity);

export const isMeta = (expression: Expr): expression is MetaExpr => expression.kind === "meta";

export const isRelation = (expression: Expr): expression is RelationExpr =>
  expression.kind === "app" && expression.args.length === 2;

export const isNegatedRelation = (expression: Expr): expression is NegatedRelationExpr =>
  expression.kind === "not" && isRelation(expression.args[0]);

// Zenon orders by hash, and only breaks ties structurally.
export const compareExprs = (left: Expr, right: Expr): number => {
  if (left.hash !== right.hash) return left.hash < right.hash ? -1 : 1;
  if (left === right) return 0;
  if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
  if (left.symbol !== right.symbol) return left.symbol < right.symbol ? -1 : 1;
  if (left.args.length !== right.args.length) return left.args.length - right.args.length;
  for (let index = 0; index < left.args.length; index++) {
    const order = compareExprs(left.args[index], right.args[index]);
    if (order !== 0) return order;
  }
  return 0;
};

export type Substitution = [Expr, Expr][];

const lookup = (map: Substitution, variable: Expr) => map.find((pair) => pair[0] === variable)?.[1];

const isIrrelevant = (names: string[], map: Substitution) =>
  names.every((name) => map.every((pair) => pair[0].symbol !== name));

const hasConflict = (variable: Expr, map: Substitution) =>
  map.some((pair) => pair[1].freeVars.includes(variable.symbol));

// The store of one run's expressions, and the operations that build expressions in it.
export const createExpressions = () => {
  const hasher = createHasher();
  // Binders are hash-consed by hash, since they're equal up to the names of their variables. Other
  // expressions are equal exactly when their kind, symbol and children are, so they're found by
  // those before their hash is computed.
  const binders = new Map<number, BinderExpr[]>();
  const interned = new Map<number, Expr[]>();
  // Numbers for the symbols, so an expression hashes by its symbol and children without strings.
  const symbolIds = new Map<string, number>();
  let nextId = FALSE.id + 1;
  let createdCount = 0;
  let nameCounter = "";

  const create = <Shape extends Pick<Expr, "kind" | "symbol" | "args">>(
    shape: Shape,
    skeleton: Int63,
    freeVars: string[],
    size: number,
    taus: number,
    metas: Expr[],
  ) => ({
    ...shape,
    id: nextId++,
    hash: hasher.hashIntAndStrings(skeleton.high, skeleton.low, freeVars),
    skeleton,
    freeVars,
    size,
    taus,
    metas,
  });

  const mergeBinder = (candidate: BinderExpr) => {
    const bucket = binders.get(candidate.hash);
    const existing = bucket?.find((inner) => isSameBinder(inner, candidate));
    if (existing !== undefined) return existing;
    if (bucket === undefined) binders.set(candidate.hash, [candidate]);
    else bucket.push(candidate);
    createdCount++;
    return candidate;
  };

  const getSymbolId = (symbol: string) => {
    const cached = symbolIds.get(symbol);
    if (cached !== undefined) return cached;
    symbolIds.set(symbol, symbolIds.size);
    return symbolIds.size - 1;
  };

  const intern = <Result extends Expr>(
    kind: ExprKind,
    symbol: string,
    args: Expr[],
    build: () => Result,
  ): Result => {
    let key = getSymbolId(symbol);
    for (const arg of args) key = Math.imul(key, 0x01000193) ^ arg.id;
    const bucket = interned.get(key);
    const existing = bucket?.find(
      (inner): inner is Result =>
        inner.kind === kind &&
        inner.symbol === symbol &&
        inner.args.length === args.length &&
        inner.args.every((child, index) => child === args[index]),
    );
    if (existing !== undefined) return existing;
    const result = build();
    if (bucket === undefined) interned.set(key, [result]);
    else bucket.push(result);
    createdCount++;
    return result;
  };

  const evar = (name: string) =>
    intern("var", name, [], (): VarExpr =>
      create({ kind: "var", symbol: name, args: [] }, ZERO, [name], 1, 0, []),
    );

  const emeta = (quantified: Expr) =>
    intern("meta", "", [quantified], (): MetaExpr =>
      create(
        { kind: "meta", symbol: "", args: [quantified] },
        combine(SKELETONS.meta, quantified.skeleton),
        [],
        1,
        0,
        [quantified],
      ),
    );

  const eapp = (symbol: string, args: Expr[]) =>
    intern("app", symbol, args, (): AppExpr => {
      let skeleton = toInt63(hasher.hashString(symbol));
      let freeVars: string[] = [];
      let size = 1;
      let taus = 0;
      let metas: Expr[] = [];
      for (const arg of args) {
        skeleton = combine(arg.skeleton, skeleton);
        freeVars = unionNames(freeVars, arg.freeVars);
        size += arg.size;
        taus = Math.max(arg.taus, taus);
        metas = union(arg.metas, metas);
      }
      return create(
        { kind: "app", symbol, args },
        combine(SKELETONS.app, skeleton),
        freeVars,
        size,
        taus,
        metas,
      );
    });

  const enot = (operand: Expr) =>
    intern("not", "", [operand], (): NotExpr =>
      create(
        { kind: "not", symbol: "", args: [operand] },
        combine(SKELETONS.not, operand.skeleton),
        operand.freeVars,
        operand.size + 1,
        operand.taus,
        operand.metas,
      ),
    );

  const binary = (kind: "and" | "or" | "imply" | "equiv", left: Expr, right: Expr) =>
    intern(kind, "", [left, right], (): BinaryExpr =>
      create(
        { kind, symbol: "", args: [left, right] },
        combine(SKELETONS[kind], combine(left.skeleton, right.skeleton)),
        unionNames(left.freeVars, right.freeVars),
        left.size + right.size + 1,
        Math.max(left.taus, right.taus),
        union(left.metas, right.metas),
      ),
    );

  const binder = (
    kind: "all" | "ex" | "tau" | "lam",
    variable: VarExpr,
    type: string,
    body: Expr,
  ) =>
    mergeBinder(
      create(
        { kind, symbol: type, args: [variable, body] },
        combine(SKELETONS[kind], combine(toInt63(hasher.hashString(type)), body.skeleton)),
        removeName(variable.symbol, body.freeVars),
        kind === "tau" || kind === "lam" ? 1 : body.size + 1,
        kind === "tau" ? body.taus + 1 : body.taus,
        body.metas,
      ),
    );

  const rebuild = (expression: AppExpr | NotExpr | BinaryExpr, args: Expr[]): Expr =>
    expression.kind === "app"
      ? eapp(expression.symbol, args)
      : expression.kind === "not"
        ? enot(args[0])
        : binary(expression.kind, args[0], args[1]);

  const newVar = () => {
    const letters = [...nameCounter];
    let position = 0;
    while (position < letters.length && letters[position] === "z") letters[position++] = "a";
    if (position === letters.length) letters.push("a");
    else letters[position] = String.fromCharCode(letters[position].charCodeAt(0) + 1);
    nameCounter = letters.join("");
    return evar(VAR_PREFIX + nameCounter);
  };

  // A binder's variable for a substitution, renamed when the substituted values capture it, and
  // the substitution to apply to its body.
  const enterBinder = (expression: BinderExpr, map: Substitution): [VarExpr, Substitution] => {
    const variable = expression.args[0];
    const rest = map.filter((pair) => pair[0] !== variable);
    if (!hasConflict(variable, rest)) return [variable, rest];
    const fresh = newVar();
    return [fresh, [[variable, fresh], ...rest]];
  };

  const substitute = (map: Substitution, expression: Expr): Expr => {
    if (isIrrelevant(expression.freeVars, map)) return expression;
    switch (expression.kind) {
      case "var":
        return lookup(map, expression) ?? expression;
      case "meta":
      case "true":
      case "false":
        return expression;
      case "all":
      case "ex":
      case "tau":
      case "lam": {
        const entered = enterBinder(expression, map);
        return binder(
          expression.kind,
          entered[0],
          expression.symbol,
          substitute(entered[1], expression.args[1]),
        );
      }
      default:
        return rebuild(
          expression,
          expression.args.map((inner) => substitute(map, inner)),
        );
    }
  };

  const substituteAll = (map: Substitution, expressions: Expr[]) => {
    const results: Expr[] = [];
    for (const inner of expressions) {
      const result = substituteSecondOrder(map, inner);
      if (result === undefined) return undefined;
      results.push(result);
    }
    return results;
  };

  // Zenon's substitute_2nd: also replaces applied symbols bound in the map, for definitions with
  // operator parameters. Undefined stands for Zenon's Higher_order exception.
  const substituteSecondOrder = (map: Substitution, expression: Expr): Expr | undefined => {
    switch (expression.kind) {
      case "var":
        return lookup(map, expression) ?? expression;
      case "meta":
      case "true":
      case "false":
        return expression;
      case "app": {
        const actuals = substituteAll(map, expression.args);
        if (actuals === undefined) return undefined;
        const operator = lookup(map, evar(expression.symbol));
        if (operator === undefined) return eapp(expression.symbol, actuals);
        if (operator.kind === "lam" && actuals.length === 1)
          return substitute([[operator.args[0], actuals[0]]], operator.args[1]);
        if (operator.kind === "var") return eapp(operator.symbol, actuals);
        if (operator.kind === "app") return eapp(operator.symbol, [...operator.args, ...actuals]);
        return undefined;
      }
      case "all":
      case "ex":
      case "tau":
      case "lam": {
        const entered = enterBinder(expression, map);
        const body = substituteSecondOrder(entered[1], expression.args[1]);
        return body === undefined
          ? undefined
          : binder(expression.kind, entered[0], expression.symbol, body);
      }
      default: {
        const args = substituteAll(map, expression.args);
        return args === undefined ? undefined : rebuild(expression, args);
      }
    }
  };

  return {
    evar,
    emeta,
    eapp,
    enot,
    eand: (left: Expr, right: Expr) => binary("and", left, right),
    eor: (left: Expr, right: Expr) => binary("or", left, right),
    eimply: (left: Expr, right: Expr) => binary("imply", left, right),
    eequiv: (left: Expr, right: Expr) => binary("equiv", left, right),
    eall: (variable: VarExpr, type: string, body: Expr) => binder("all", variable, type, body),
    eex: (variable: VarExpr, type: string, body: Expr) => binder("ex", variable, type, body),
    etau: (variable: VarExpr, type: string, body: Expr) => binder("tau", variable, type, body),
    elam: (variable: VarExpr, type: string, body: Expr) => binder("lam", variable, type, body),
    newVar,
    substitute,
    substituteSecondOrder,
    apply: (lambda: Expr, argument: Expr) => {
      if (lambda.kind !== "lam") throw new TlaZenonError("Zenon: higher-order application");
      return substitute([[lambda.args[0], argument]], lambda.args[1]);
    },
    getCreatedCount: () => createdCount,
  };
};

export type Expressions = ReturnType<typeof createExpressions>;
