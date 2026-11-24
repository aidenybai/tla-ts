import { isRecursiveConstruction, type Bound, type Expression, type Module } from "./ast";
import {
  AND_LEVELS,
  APPLY_LEVELS,
  BOUNDED_CHOOSE_LEVELS,
  CASE_LEVELS,
  EXCEPT_LEVELS,
  EXISTS_LEVELS,
  FCN_CONSTRUCTOR_LEVELS,
  FORALL_LEVELS,
  getMaxLevel,
  getWeight,
  IF_LEVELS,
  type OperatorLevels,
  OR_LEVELS,
  RCD_CONSTRUCTOR_LEVELS,
  SELECT_LEVELS,
  SET_ENUMERATE_LEVELS,
  SET_OF_ALL_LEVELS,
  SUBSET_OF_LEVELS,
  TEMPORAL_LEVEL,
  TUPLE_LEVELS,
  UNBOUNDED_CHOOSE_LEVELS,
} from "./levels";
import { isDeserializer, isWideString } from "./dependencies";
import { CORE_SYMBOLS, LOCAL_RESOLUTION, type Symbols } from "./resolve";

// What a plain module reads of the modules it extends: their symbols, and the levels of what a
// name resolves to there, as SANY's level checks resolve it: a definition's prepared levels, or
// undefined where a definition has none, a builtin's signature, or "declared" for another name.
export interface PlainContext {
  imported: Symbols;
  // The key of one of the module's own definitions, by its name.
  getKey: (name: string) => string;
  getLevels: (name: string) => OperatorLevels | "declared" | undefined;
}

// A name the walk binds: a formal parameter or a bound variable, whose bit stands for it in a set
// of parameters, or a LET definition, with the parameters its body reads.
interface Local {
  name: string;
  params: number;
}

// The parameters whose levels the walk tracks are at most this many, each a bit of a number.
const MAX_PARAMS = 30;

// The kinds of symbol that a plain module's names resolve to: none of a variable, whose level isn't
// constant.
const PLAIN_KINDS = new Set(["Definition", "Builtin", "Constant"]);

// The levels of the definitions of a module that SANY's name and level checks find in one pass
// over its definitions in order, or undefined where the module isn't plain: where it declares or
// assumes anything, instantiates a module, reads a definition before it comes or a variable, uses
// a construct other than the constant ones the pass knows, binds a name twice, or holds what SANY's
// checks report: a record with a field twice, a definition of a built-in operator, or a LET's
// RECURSIVE declaration. Every constant expression has level 0, so a plain module has no level
// error, and the pass finds only each definition's weights and the maximum level of each
// parameter. A module the pass doesn't take is checked in full,
// which finds the errors the pass leaves to it.
export const checkPlainModule = (
  module: Module,
  context: PlainContext,
): { levels: OperatorLevels[]; isWide: boolean } | undefined => {
  if (
    module.constants.length > 0 ||
    module.variables.length > 0 ||
    module.instances.length > 0 ||
    module.assumptions.length > 0 ||
    module.theorems.length > 0 ||
    module.uses.length > 0 ||
    module.modules.length > 0 ||
    module.units.some((unit) => unit.kind !== "Definition")
  ) {
    return undefined;
  }
  // An index for each parameter name of the definition being walked, as a bit of a set of them.
  const bits = new Map<string, number>();
  const getBit = (name: string) => {
    const bit = bits.get(name) ?? bits.size;
    bits.set(name, bit);
    return bit < MAX_PARAMS ? bit : undefined;
  };
  const own = new Map<string, OperatorLevels>();
  // Whether the module holds a wide string or reads a deserializer, as isWideDefinition tells.
  let isWide = false;
  // The levels of each definition so far, by its index in the module.
  const levels: OperatorLevels[] = [];
  // The references to global names, each with the key of what it names, which it takes once the
  // module proves plain, as a module that's resolved in full does. A reference by key reads its
  // definition wherever the module is instantiated, where the definition's name isn't visible.
  const references: [Expression & { kind: "Identifier" | "Apply" }, string][] = [];
  // The names that the definition being walked binds, innermost last.
  const locals: Local[] = [];
  // The lowest maximum level that the definition being walked puts on each parameter.
  const maxima = new Uint8Array(MAX_PARAMS);
  const isNameFree = (name: string) =>
    !own.has(name) && !context.imported.has(name) && locals.every((local) => local.name !== name);
  // Binds a name, or fails where it's bound already, as SANY reports.
  const bind = (name: string, params: number) => {
    if (!isNameFree(name)) return false;
    locals.push({ name, params });
    return true;
  };
  // Holds each parameter of params to a maximum level.
  const constrain = (params: number, maximum: number) => {
    for (let rest = params; rest !== 0; rest &= rest - 1) {
      const bit = 31 - Math.clz32(rest & -rest);
      maxima[bit] = Math.min(maxima[bit], maximum);
    }
  };
  // The params of a callee's own levels, with its constraints on them, as the walk's bits.
  const getCalleeParams = (callee: OperatorLevels) => {
    let params = 0;
    for (const param of callee.params) {
      const bit = getBit(param);
      if (bit === undefined) return undefined;
      params |= 1 << bit;
    }
    for (const [name, level] of callee.constraints) {
      const bit = getBit(name);
      if (bit === undefined) return undefined;
      maxima[bit] = Math.min(maxima[bit], level);
    }
    return params;
  };
  // A callee whose levels a plain module can apply: constant, of value parameters, with no
  // parameter whose level depends on another's.
  const isPlainCallee = (callee: OperatorLevels) =>
    callee.level === 0 &&
    callee.isCorrect &&
    callee.formals.every((formal) => formal.arity === 0) &&
    callee.nonLeibniz.size === 0 &&
    callee.conditions.size === 0 &&
    callee.argConstraints.size === 0 &&
    callee.argParams.size === 0;
  // The levels of a global name of the given arity, or the bit of a constant that it names.
  const resolveGlobal = (
    name: string,
    arity: number,
  ): OperatorLevels | { bit: number } | undefined => {
    const ownLevels = own.get(name);
    if (ownLevels) return ownLevels.formals.length === arity ? ownLevels : undefined;
    const symbol = context.imported.get(name);
    if (
      symbol === undefined ||
      symbol.arity !== arity ||
      name.includes("!") ||
      !PLAIN_KINDS.has(symbol.kind)
    ) {
      return undefined;
    }
    const resolved = context.getLevels(name);
    if (resolved === undefined) return undefined;
    if (resolved !== "declared") return isPlainCallee(resolved) ? resolved : undefined;
    if (arity > 0) return undefined;
    const bit = getBit(symbol.key);
    return bit === undefined ? undefined : { bit };
  };
  // The params of an application of callee to expressions: those of each expression of weight 1,
  // each held to the expression's maximum level, and the callee's own.
  const walkAll = (expressions: Expression[], callee: OperatorLevels, isInExcept: boolean) => {
    let params = getCalleeParams(callee);
    for (let index = 0; index < expressions.length && params !== undefined; index++) {
      const operand = walk(expressions[index], isInExcept);
      if (operand === undefined) return undefined;
      if (getWeight(callee, index) === 1) params |= operand;
      constrain(operand, getMaxLevel(callee, index));
    }
    return params;
  };
  // An application of callee to expressions, each bound to the variables names, whose sets add
  // their params unbound.
  const walkBound = (
    callee: OperatorLevels,
    expressions: Expression[],
    sets: Expression[],
    names: (string | undefined)[],
    isInExcept: boolean,
  ) => {
    let params = 0;
    for (const set of sets) {
      const setParams = walk(set, isInExcept);
      if (setParams === undefined) return undefined;
      params |= setParams;
    }
    const depth = locals.length;
    const isBound = names.every((name) => name !== undefined && bind(name, 0));
    const inner = isBound ? walkAll(expressions, callee, isInExcept) : undefined;
    locals.length = depth;
    return inner === undefined ? undefined : params | inner;
  };
  const getNames = (bounds: Bound[]) =>
    bounds.map((bound) => (bound.pattern.kind === "Name" ? bound.pattern.name : undefined));
  // The params that an expression reads, or undefined where the module isn't plain.
  const walk = (expression: Expression, isInExcept: boolean): number | undefined => {
    switch (expression.kind) {
      case "Number":
        return 0;
      case "String":
        if (isWideString(expression.value)) isWide = true;
        return 0;
      case "ExceptAt":
        return isInExcept ? 0 : undefined;
      case "Identifier":
      case "Apply": {
        const name = expression.kind === "Identifier" ? expression.name : expression.operator;
        if (expression.kind === "Apply" && isDeserializer(name)) isWide = true;
        const args = expression.kind === "Identifier" ? [] : expression.args;
        const local = locals.findLast((candidate) => candidate.name === name);
        if (local) {
          if (args.length > 0) return undefined;
          expression.resolution = LOCAL_RESOLUTION;
          return local.params;
        }
        const resolved = resolveGlobal(name, args.length);
        if (resolved === undefined) return undefined;
        references.push([
          expression,
          own.has(name) ? context.getKey(name) : (context.imported.get(name)?.key ?? name),
        ]);
        return "bit" in resolved ? 1 << resolved.bit : walkAll(args, resolved, isInExcept);
      }
      case "And":
      case "Or":
        return walkAll(
          expression.operands,
          expression.kind === "And" ? AND_LEVELS : OR_LEVELS,
          isInExcept,
        );
      case "If":
        return walkAll(
          [expression.condition, expression.consequent, expression.alternative],
          IF_LEVELS,
          isInExcept,
        );
      case "Case":
        return walkAll(
          [
            ...expression.arms.flatMap((arm) => [arm.condition, arm.body]),
            ...(expression.other ? [expression.other] : []),
          ],
          CASE_LEVELS,
          isInExcept,
        );
      case "Let": {
        if (expression.recursive !== undefined || expression.instances !== undefined) {
          return undefined;
        }
        const depth = locals.length;
        const isBound = expression.definitions.every((inner) => {
          if (inner.kind !== "Operator" || inner.params.length > 0) return false;
          const params = walk(inner.body, isInExcept);
          return params !== undefined && bind(inner.name, params);
        });
        const body = isBound ? walk(expression.body, isInExcept) : undefined;
        locals.length = depth;
        return body;
      }
      case "Forall":
      case "Exists":
        return walkBound(
          expression.kind === "Forall" ? FORALL_LEVELS : EXISTS_LEVELS,
          [expression.body],
          expression.bounds.map((bound) => bound.set),
          getNames(expression.bounds),
          isInExcept,
        );
      case "Choose":
        return walkBound(
          expression.set ? BOUNDED_CHOOSE_LEVELS : UNBOUNDED_CHOOSE_LEVELS,
          [expression.body],
          expression.set ? [expression.set] : [],
          getNames([{ pattern: expression.pattern, set: expression.body }]),
          isInExcept,
        );
      case "SetEnumeration":
        return walkAll(expression.elements, SET_ENUMERATE_LEVELS, isInExcept);
      case "Tuple":
        return walkAll(expression.elements, TUPLE_LEVELS, isInExcept);
      case "SetFilter":
        return walkBound(
          SUBSET_OF_LEVELS,
          [expression.predicate],
          [expression.bound.set],
          getNames([expression.bound]),
          isInExcept,
        );
      case "SetMap":
        return walkBound(
          SET_OF_ALL_LEVELS,
          [expression.expression],
          expression.bounds.map((bound) => bound.set),
          getNames(expression.bounds),
          isInExcept,
        );
      case "FunctionConstruction":
        return isRecursiveConstruction(expression)
          ? undefined
          : walkBound(
              FCN_CONSTRUCTOR_LEVELS,
              [expression.body],
              expression.bounds.map((bound) => bound.set),
              getNames(expression.bounds),
              isInExcept,
            );
      case "Record":
        if (
          expression.fields.some((field, index) =>
            expression.fields.slice(0, index).some((earlier) => earlier.name === field.name),
          )
        ) {
          return undefined;
        }
        return walkAll(
          expression.fields.map((field) => field.value),
          RCD_CONSTRUCTOR_LEVELS,
          isInExcept,
        );
      case "Except": {
        let params = walk(expression.function, isInExcept);
        if (params === undefined) return undefined;
        constrain(params, getMaxLevel(EXCEPT_LEVELS, 0));
        for (const update of expression.updates) {
          const operands = [
            ...update.path.flatMap((step) =>
              step.kind === "Index" ? step.args.map((arg) => walk(arg, isInExcept)) : [],
            ),
            walk(update.value, true),
          ];
          for (const operand of operands) {
            if (operand === undefined) return undefined;
            params |= operand;
            constrain(operand, getMaxLevel(EXCEPT_LEVELS, 0));
          }
        }
        return params;
      }
      case "FunctionApplication": {
        if (expression.args.length === 0) return undefined;
        const fn = walk(expression.function, isInExcept);
        const args =
          expression.args.length === 1
            ? walk(expression.args[0], isInExcept)
            : walkAll(expression.args, TUPLE_LEVELS, isInExcept);
        if (fn === undefined || args === undefined) return undefined;
        constrain(fn, getMaxLevel(APPLY_LEVELS, 0));
        constrain(args, getMaxLevel(APPLY_LEVELS, 1));
        return fn | args;
      }
      case "FieldAccess": {
        const record = walk(expression.record, isInExcept);
        if (record !== undefined) constrain(record, getMaxLevel(SELECT_LEVELS, 0));
        return record;
      }
      default:
        return undefined;
    }
  };
  for (const definition of module.definitions) {
    if (
      definition.kind !== "Operator" ||
      definition.isLocal ||
      CORE_SYMBOLS.has(definition.name) ||
      own.has(definition.name) ||
      context.imported.has(definition.name) ||
      definition.params.some((param) => param.arity !== 0)
    ) {
      return undefined;
    }
    locals.length = 0;
    bits.clear();
    maxima.fill(TEMPORAL_LEVEL);
    for (const param of definition.params) {
      const bit = getBit(param.name);
      if (bit === undefined || !bind(param.name, 1 << bit)) return undefined;
    }
    const body = walk(definition.body, false);
    if (body === undefined) return undefined;
    const formalBits = definition.params.map((param) => bits.get(param.name) ?? 0);
    const params = [...bits].flatMap((entry) =>
      (body & (1 << entry[1])) !== 0 && !formalBits.includes(entry[1]) ? [entry[0]] : [],
    );
    const constraints = [...bits].flatMap((entry): [string, number][] =>
      maxima[entry[1]] < TEMPORAL_LEVEL && !formalBits.includes(entry[1])
        ? [[entry[0], maxima[entry[1]]]]
        : [],
    );
    const definitionLevels: OperatorLevels = {
      level: 0,
      isCorrect: true,
      params: new Set(params),
      constraints: new Map(constraints),
      argConstraints: new Map(),
      argParams: new Map(),
      allParams: new Set(params),
      nonLeibnizParams: new Set(),
      appliedParams: undefined,
      name: definition.name,
      formals: definition.params,
      maxLevels: formalBits.map((bit) => maxima[bit]),
      weights: formalBits.map((bit) => ((body & (1 << bit)) !== 0 ? 1 : 0)),
      minMaxLevels: definition.params.map(() => []),
      conditions: new Set(),
      nonLeibniz: new Set(),
    };
    own.set(definition.name, definitionLevels);
    levels.push(definitionLevels);
  }
  for (const reference of references) {
    if (reference[0].kind === "Identifier") reference[0].name = reference[1];
    else reference[0].operator = reference[1];
  }
  return { levels, isWide };
};
