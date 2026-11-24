import { isRecursiveConstruction, type Bound, type Expression, type Module } from "./ast";
import {
  addArgumentParam,
  AND_LEVELS,
  APPLY_LEVELS,
  type ArgumentParams,
  BOUNDED_CHOOSE_LEVELS,
  CASE_LEVELS,
  EXCEPT_LEVELS,
  EXISTS_LEVELS,
  FCN_CONSTRUCTOR_LEVELS,
  FORALL_LEVELS,
  getArgumentKey,
  getMaxLevel,
  getWeight,
  IF_LEVELS,
  type OperatorLevels,
  OR_LEVELS,
  PAIR_LEVELS,
  parseArgumentKey,
  putArgConstraint,
  RCD_CONSTRUCTOR_LEVELS,
  SELECT_LEVELS,
  SEQ_LEVELS,
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
  data: PlainData;
}

// What the walk finds of an expression, as the full analysis does, each a set of bits: the
// parameters its level depends on, all the parameters it reads, those it reads where Leibniz's
// rule fails, and those it applies, or NO_APPLIED where it doesn't tell them apart from its
// parameters.
interface PlainData {
  params: number;
  all: number;
  nonLeibniz: number;
  applied: number;
}

const NO_APPLIED = -1;

const EMPTY_DATA: PlainData = { params: 0, all: 0, nonLeibniz: 0, applied: NO_APPLIED };

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
// error, and the pass finds the rest of each definition's levels as the full analysis does: its
// weights, the maximum level of each parameter, and the parameters it reads, applies and passes to
// the operators its callees apply. A module the pass doesn't take is checked in full,
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
  // The name of each bit.
  const names: string[] = [];
  const getBit = (name: string) => {
    const bit = bits.get(name) ?? bits.size;
    if (bit === bits.size) names[bit] = name;
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
  // The parameters that the definition being walked holds to a maximum level, if only the highest.
  let constrained = 0;
  // The levels that the definition being walked puts on the arguments of operators that its
  // callees apply, and the parameters of those arguments, which every callee's application, and
  // every LET definition, adds to the definition's, as the full analysis merges them up.
  let argConstraints = new Map<string, number>();
  let argParams: ArgumentParams = new Map();
  const isNameFree = (name: string) =>
    !own.has(name) && !context.imported.has(name) && locals.every((local) => local.name !== name);
  // Binds a name, or fails where it's bound already, as SANY reports.
  const bind = (name: string, data: PlainData) => {
    if (!isNameFree(name)) return false;
    locals.push({ name, data });
    return true;
  };
  // Holds each parameter of params to a maximum level.
  const constrain = (params: number, maximum: number) => {
    constrained |= params;
    for (let rest = params; rest !== 0; rest &= rest - 1) {
      const bit = 31 - Math.clz32(rest & -rest);
      maxima[bit] = Math.min(maxima[bit], maximum);
    }
  };
  // The bits of names, or undefined where they're too many.
  const getBits = (items: Iterable<string>) => {
    let found = 0;
    for (const item of items) {
      const bit = getBit(item);
      if (bit === undefined) return undefined;
      found |= 1 << bit;
    }
    return found;
  };
  // The params of a callee's own levels, with its constraints on them, as the walk's bits.
  const getCalleeParams = (callee: OperatorLevels) => {
    const params = getBits(callee.params);
    if (params === undefined) return undefined;
    for (const [name, level] of callee.constraints) {
      const bit = getBit(name);
      if (bit === undefined) return undefined;
      constrained |= 1 << bit;
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
    callee.conditions.size === 0;
  // Adds what an application of callee puts on the arguments of the operators it applies: its
  // own, and for each parameter of such an argument that's the callee's, the parameters that the
  // operand passed for it reads, each at the operand's level, which every constant has.
  const addArgumentLevels = (callee: OperatorLevels, operands: PlainData[]) => {
    callee.argConstraints.forEach((value, key) => putArgConstraint(argConstraints, key, value));
    callee.argParams.forEach((parameter, key) => {
      const index = callee.formals.findIndex((formal) => formal.name === parameter.param);
      if (index === -1) {
        if (!argParams.has(key)) argParams.set(key, parameter);
        return;
      }
      putArgConstraint(argConstraints, getArgumentKey(parameter.operator, parameter.index), 0);
      for (let rest = operands[index].params; rest !== 0; rest &= rest - 1) {
        const bit = 31 - Math.clz32(rest & -rest);
        addArgumentParam(argParams, parameter.operator, parameter.index, names[bit]);
      }
    });
  };
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
  // An application of callee to operands, whose ranges bind variables, as the full analysis
  // applies it: the params of each operand of weight 1, held to its maximum level, and the
  // callee's own; all that the operands, the ranges and the callee read; and the params that they
  // apply, where one of them tells them apart.
  const apply = (
    callee: OperatorLevels,
    operands: PlainData[],
    ranges: PlainData[],
  ): PlainData | undefined => {
    const calleeParams = getCalleeParams(callee);
    const all = getBits(callee.allParams);
    const nonLeibniz = getBits(callee.nonLeibnizParams);
    const calleeApplied =
      callee.appliedParams === undefined
        ? 0
        : getBits(
            [...callee.appliedParams].filter((param) =>
              callee.formals.every((formal) => formal.name !== param),
            ),
          );
    if (
      calleeParams === undefined ||
      all === undefined ||
      nonLeibniz === undefined ||
      calleeApplied === undefined
    ) {
      return undefined;
    }
    let params = calleeParams;
    const data = { params: 0, all, nonLeibniz, applied: NO_APPLIED };
    let applied = callee.appliedParams === undefined ? calleeParams : calleeApplied;
    let isApplied = callee.appliedParams !== undefined;
    operands.forEach((operand, index) => {
      if (getWeight(callee, index) === 1) params |= operand.params;
      constrain(operand.params, getMaxLevel(callee, index));
      data.all |= operand.all;
      data.nonLeibniz |= operand.nonLeibniz;
      const formal = callee.formals[index];
      const isAppliedAt =
        formal === undefined || callee.appliedParams === undefined
          ? getWeight(callee, index) === 1
          : callee.appliedParams.has(formal.name);
      if (!isAppliedAt) return;
      applied |= operand.applied === NO_APPLIED ? operand.params : operand.applied;
      if (operand.applied !== NO_APPLIED) isApplied = true;
    });
    ranges.forEach((range) => {
      params |= range.params;
      data.all |= range.all;
      data.nonLeibniz |= range.nonLeibniz;
      applied |= range.applied === NO_APPLIED ? range.params : range.applied;
      if (range.applied !== NO_APPLIED) isApplied = true;
    });
    data.params = params;
    data.applied = isApplied ? applied : NO_APPLIED;
    if (callee.argConstraints.size > 0 || callee.argParams.size > 0) {
      addArgumentLevels(callee, operands);
    }
    return data;
  };
  // The data of each expression, or undefined where one isn't plain.
  const walkEach = (expressions: Expression[], isInExcept: boolean) => {
    const operands: PlainData[] = [];
    for (const expression of expressions) {
      const operand = walk(expression, isInExcept);
      if (operand === undefined) return undefined;
      operands.push(operand);
    }
    return operands;
  };
  const walkAll = (expressions: Expression[], callee: OperatorLevels, isInExcept: boolean) => {
    const operands = walkEach(expressions, isInExcept);
    return operands && apply(callee, operands, []);
  };
  // An application of callee to expressions, each bound to the variables names, whose sets are its
  // ranges.
  const walkBound = (
    callee: OperatorLevels,
    expressions: Expression[],
    sets: Expression[],
    names: (string | undefined)[],
    isInExcept: boolean,
  ) => {
    const ranges = walkEach(sets, isInExcept);
    if (ranges === undefined) return undefined;
    const depth = locals.length;
    const isBound = names.every((name) => name !== undefined && bind(name, EMPTY_DATA));
    const operands = isBound ? walkEach(expressions, isInExcept) : undefined;
    locals.length = depth;
    return operands && apply(callee, operands, ranges);
  };
  const getNames = (bounds: Bound[]) =>
    bounds.map((bound) => (bound.pattern.kind === "Name" ? bound.pattern.name : undefined));
  // What @ reads in an update of an EXCEPT: what the parts before it read.
  let exceptAt = EMPTY_DATA;
  // The data of an expression, or undefined where the module isn't plain.
  const walk = (expression: Expression, isInExcept: boolean): PlainData | undefined => {
    switch (expression.kind) {
      case "Number":
        return EMPTY_DATA;
      case "String":
        if (isWideString(expression.value)) isWide = true;
        return EMPTY_DATA;
      case "ExceptAt":
        return isInExcept ? exceptAt : undefined;
      case "Identifier":
      case "Apply": {
        const name = expression.kind === "Identifier" ? expression.name : expression.operator;
        if (expression.kind === "Apply" && isDeserializer(name)) isWide = true;
        const args = expression.kind === "Identifier" ? [] : expression.args;
        const local = locals.findLast((candidate) => candidate.name === name);
        if (local) {
          if (args.length > 0) return undefined;
          expression.resolution = LOCAL_RESOLUTION;
          return local.data;
        }
        const resolved = resolveGlobal(name, args.length);
        if (resolved === undefined) return undefined;
        references.push([
          expression,
          own.has(name) ? context.getKey(name) : (context.imported.get(name)?.key ?? name),
        ]);
        if (!("bit" in resolved)) return walkAll(args, resolved, isInExcept);
        const bit = 1 << resolved.bit;
        return { params: bit, all: bit, nonLeibniz: 0, applied: NO_APPLIED };
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
          const data = walk(inner.body, isInExcept);
          return data !== undefined && bind(inner.name, data);
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
        // The function and each update, as the full analysis applies $Except to them, each update
        // a $Pair of its path's $Seq and its value, whose @ reads what the parts before it read.
        const fn = walk(expression.function, isInExcept);
        if (fn === undefined) return undefined;
        const parts = [fn];
        for (const update of expression.updates) {
          const steps: PlainData[] = [];
          for (const step of update.path) {
            const data =
              step.kind === "Field"
                ? EMPTY_DATA
                : step.args.length === 1
                  ? walk(step.args[0], isInExcept)
                  : walkAll(step.args, TUPLE_LEVELS, isInExcept);
            if (data === undefined) return undefined;
            steps.push(data);
          }
          const path = apply(SEQ_LEVELS, steps, []);
          const outer = exceptAt;
          exceptAt = parts.reduce(
            (union, part) => ({
              params: union.params | part.params,
              all: union.all | part.all,
              nonLeibniz: 0,
              applied: NO_APPLIED,
            }),
            EMPTY_DATA,
          );
          const value = walk(update.value, true);
          exceptAt = outer;
          if (path === undefined || value === undefined) return undefined;
          const pair = apply(PAIR_LEVELS, [path, value], []);
          if (pair === undefined) return undefined;
          parts.push(pair);
        }
        return apply(EXCEPT_LEVELS, parts, []);
      }
      case "FunctionApplication": {
        if (expression.args.length === 0) return undefined;
        const fn = walk(expression.function, isInExcept);
        const args =
          expression.args.length === 1
            ? walk(expression.args[0], isInExcept)
            : walkAll(expression.args, TUPLE_LEVELS, isInExcept);
        return fn && args && apply(APPLY_LEVELS, [fn, args], []);
      }
      case "FieldAccess": {
        const record = walk(expression.record, isInExcept);
        return record && apply(SELECT_LEVELS, [record, EMPTY_DATA], []);
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
    names.length = 0;
    maxima.fill(TEMPORAL_LEVEL);
    constrained = 0;
    argConstraints = new Map();
    argParams = new Map();
    for (const param of definition.params) {
      const bit = getBit(param.name);
      if (bit === undefined) return undefined;
      const data = { params: 1 << bit, all: 1 << bit, nonLeibniz: 0, applied: NO_APPLIED };
      if (!bind(param.name, data)) return undefined;
    }
    const body = walk(definition.body, false);
    if (body === undefined) return undefined;
    const formalBits = definition.params.map((param) => bits.get(param.name) ?? 0);
    const isFormal = (name: string) => definition.params.some((param) => param.name === name);
    // The names of the bits of a set, but the formals'.
    const getParamNames = (set: number) =>
      [...bits].flatMap((entry) =>
        (set & (1 << entry[1])) !== 0 && !formalBits.includes(entry[1]) ? [entry[0]] : [],
      );
    const params = getParamNames(body.params);
    const constraints = [...bits].flatMap((entry): [string, number][] =>
      (constrained & (1 << entry[1])) !== 0 && !formalBits.includes(entry[1])
        ? [[entry[0], maxima[entry[1]]]]
        : [],
    );
    const definitionLevels: OperatorLevels = {
      level: 0,
      isCorrect: true,
      params: new Set(params),
      constraints: new Map(constraints),
      argConstraints: new Map(
        [...argConstraints].filter((entry) => !isFormal(parseArgumentKey(entry[0]).operator)),
      ),
      argParams: new Map(
        [...argParams].filter((entry) => !isFormal(entry[1].operator) || !isFormal(entry[1].param)),
      ),
      allParams: new Set(getParamNames(body.all)),
      nonLeibnizParams: new Set(getParamNames(body.nonLeibniz)),
      appliedParams:
        body.applied === NO_APPLIED
          ? undefined
          : new Set(
              [...bits].flatMap((entry) =>
                (body.applied & (1 << entry[1])) !== 0 ? [entry[0]] : [],
              ),
            ),
      name: definition.name,
      formals: definition.params,
      maxLevels: formalBits.map((bit) => maxima[bit]),
      weights: formalBits.map((bit) => ((body.params & (1 << bit)) !== 0 ? 1 : 0)),
      minMaxLevels: definition.params.map(() => []),
      conditions: new Set(),
      nonLeibniz: new Set(
        formalBits.flatMap((bit, index) => ((body.nonLeibniz & (1 << bit)) !== 0 ? [index] : [])),
      ),
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
