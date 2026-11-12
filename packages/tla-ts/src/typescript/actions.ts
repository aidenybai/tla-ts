import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import {
  checkElement,
  getCallbackReceiver,
  getArrayIteratorCall,
  getHeapArrayChange,
  getStoredCall,
  isArrayIteration,
  isStoredChange,
  isStoredStatement,
  isUntypedStoredCall,
  translateArrayChange,
  translateArrayIteratorPrototype,
  translateStoredCall,
  translateHoldsIteratorMethod,
  getHeapElements,
  getHeapSetOrMapChange,
  translateHeapElements,
  translateArrayIteration,
  holdsArrayIteration,
  ARRAY_ITERATOR_REPLACED,
  getHeapRegExpCall,
  translateRegExpText,
  getStringCall,
  translateRegExpReplacer,
  getUpdatedValue,
  EVERY_INDEX_METHODS,
  HOLE_SKIPPING_METHODS,
  translateMethodElements,
  MUTATING_METHODS,
  SEQUENCE_UPDATES,
  translateSpliced,
  checkArrayMethod,
  translatePrimitiveMethod,
  translateSizeGetter,
  translateSortOrder,
} from "./collections";
import {
  findNodes,
  getFunctionCandidates,
  getObjectGetter,
  type HeapClass,
  type ChangeSummary,
  type Context,
  type FunctionNode,
  getAccessKey,
  getAssignedSetter,
  getAccessorFunctions,
  getCalledMethod,
  getCallee,
  getElement,
  getAnyFunction,
  getFactoryCall,
  isAsyncFunction,
  isAsyncGenerator,
  isAnyGenerator,
  getLocalCaptures,
  isPlain,
  getConstruction,
  getHeapClass,
  getNewClass,
  isInertValue,
  isLiteral,
  isNameRead,
  skipCasts,
  isPrivateMember,
  isStatic,
  getPrivateMember,
  getPrivateKey,
  getParameters,
  getRunConstructor,
  getRunFields,
  getSetters,
  getPropertySetters,
  getWrittenProperties,
  changesState,
  getArgumentsOwner,
  isModuleFile,
  getSymbol,
  isAssigned,
  getTopLevelDeclaration,
  getUndefined,
  isHeapClass,
  isHeapFunction,
  isMethodCall,
  type MethodCall,
  isStatementNew,
  share,
  isInlined,
  getFunctionOfKind,
  getUnresolvedRead,
  isUnresolved,
  getBound,
  getBaseClass,
  getSuperCall,
  isNullBased,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  getConversion,
  getConversionFunctions,
  isCompoundAssignment,
  runConversion,
} from "./conversions";
import { getJsonText, parseJson, translateHoldsJson } from "./json";
import {
  closeIterator,
  getIteratedSpreads,
  getIteratorFunctions,
  isIteratedPattern,
  isIteratedValue,
  isTaken,
  isUntypedPattern,
  openAsyncIterator,
  openIterator,
  readValue,
  stepIterator,
  takeFromIterator,
  takeSpreads,
} from "./iterators";
import {
  translateCondition,
  translateExpression,
  translateKey,
  translateSetKey,
  translateBigInt,
  translateToString,
  getHoleChecks,
  isInertBefore,
  ARITHMETIC_OPERATORS,
  BIGINT_OPERATORS,
  BITWISE_OPERATORS,
} from "./expressions";
import { and, bindValue, DISABLED, type Formula, ifThenElse, letIn, leaf, render } from "./formula";
import { getCalledError, getErrorClass, translateEngineError, translateThrown } from "./exceptions";
import {
  drainTasks,
  EMPTY_TASKS,
  getIteration,
  isPromiseCall,
  isPromiseConstruction,
  makeRequest,
  settleRequest,
  awaitIn,
  type Tasks,
  translateAsyncCall,
  translatePromiseCall,
  translatePromiseConstruction,
} from "./promises";
import {
  getAccessorValue,
  getAllocated,
  isMade,
  isNewError,
  getCandidateValue,
  getHeap,
  getNewWrapper,
  isAllocation,
  isNewProxy,
  getNewBuffer,
  getViewCall,
  getGetterCall,
  translateNewBufferOf,
  isRevoke,
  getPrimitiveObjectCall,
  isObjectChange,
  isReflectDefinition,
  isUnreachableChange,
  getDateCall,
  getDateSetter,
  translateAllocated,
  translateAllocatedValue,
  translateHasPrivate,
  translateHoldsMethod,
  translateMemberKey,
  translateObjectChange,
  translateObjectValue,
  translatePropertyKey,
} from "./heap";
import {
  type Collection,
  getBuiltIn,
  isBuiltInObject,
  isInvalidRegExp,
  translateBuiltInValue,
} from "./intrinsics";
import { getTypeNames, getURICall, translateToNumber, useJavaScript } from "./javascript";
import {
  bindFactory,
  forceHeap,
  getReceiver,
  mayThrow,
  shareArguments,
  isLiftable,
  translateIf,
  translateLiftedCall,
  translateSwitch,
  translateThrow,
} from "./functions";
import {
  bind,
  callMethod,
  getDescriptorGetters,
  getElementGetters,
  getDefinedGetters,
  getReadFunctions,
  isDescriptorRead,
  isDescriptorsRead,
  isOwnValuesRead,
  getOwnValuesGetters,
  readOwnValues,
  isGetterPattern,
  isNullish,
  isProxyPattern,
  readProxyPattern,
  isGetterRead,
  getGetterKeys,
  getWrittenFunctions,
  getTrapFunctions,
  isProxyOperation,
  readDescriptor,
  readDescriptors,
  read,
  readPatternGetters,
  readWith,
  writeWith,
  withHeap,
  runGetterRead,
  runProxyOperation,
} from "./protocols";
import { addResource, type Disposal, isAwaitUsing, translateUsing } from "./disposal";
import {
  getStackCall,
  getStackFunctions,
  isStackConstruction,
  translateStackCall,
  translateStackConstruction,
} from "./stacks";
import {
  bindPattern,
  bindPatternInline,
  type Bound,
  bindValues,
  createStateScope,
  getArrowReceivers,
  getDefaulted,
  getOptionalField,
  initialize,
  rejectBeforeDeclaration,
  type Receiver,
  type Scope,
} from "./scope";
import {
  set,
  apply,
  boolean,
  bound,
  call,
  define,
  except,
  exceptAt,
  field,
  functionOf,
  getLocation,
  identifier,
  ifExpression,
  index,
  junction,
  locate,
  not,
  number,
  record,
  prime,
  string,
  tuple,
  unchanged,
} from "./tla";
import {
  getCollection,
  isBooleanLike,
  isEvery,
  rejectAnyReceiver,
  getField,
  getKind,
  getArrayLiteral,
  isHeapArray,
  isHeapSetOrMap,
  getPathStep,
  isHeapPattern,
  isHeapType,
  isBigIntLike,
  isNumberLike,
  isGeneratorType,
  mayBeGeneratorType,
  ITERATOR_CONSUMERS,
  ITERATOR_HELPERS,
  isSequenceType,
  rejectGeneratorUse,
  TYPED_ARRAYS,
} from "./types";

export interface Path {
  scope: Scope;
  // State variables and mutable locals, which assignments may change.
  mutable: Set<ts.Symbol>;
  isAssigned: boolean;
  isLast: boolean;
  isLooping: boolean;
  // The generator objects that the statements made, by name, with where each one's body suspended.
  generators: ReadonlyMap<string, Suspension>;
  // The jobs and promises that the statements queued and made, or undefined in a loop's body.
  tasks: Tasks | undefined;
  // The resources that the using declarations of the block that runs added.
  disposal?: Disposal;
}

interface KnownDefault {
  initializer: ts.Expression;
  isRun: boolean;
}

interface Suspension {
  ref: Expression;
  // The function whose body a next runs, which a helper of an object that isn't an iterator lacks.
  generator: FunctionNode | undefined;
  // Runs the rest of the body from the path of the call that resumes it, or undefined once the
  // generator completes.
  resume: ((path: Path) => Formula) | undefined;
  isStarted: boolean;
  // Whether it suspended inside a try or a yield*, which a return or a throw would have to run.
  isGuarded: boolean;
  // Runs the rest of the body from a yield as a return or a throw there would, through the finally
  // blocks and catch clauses around it, where a sync generator's plain yield suspended it.
  abort?: (path: Path, method: string, value: Expression | undefined) => Formula;
  isAsync: boolean;
  // The promises of the nexts that called an async generator while its body ran, which it settles
  // in order once it yields or completes.
  queue: readonly string[];
  // The call that resumed the body, while it runs, which takes what it yields or returns.
  caller?: Caller;
}

interface Caller {
  path: Path;
  // Takes what the body yields or returns, or the result object that a yield* passes on.
  step: (path: Path, value: Expression | undefined, isDone: boolean, isResult?: boolean) => Formula;
  throwTo: Frame["throwTo"];
  // For an async generator: the promise of the request that resumed the body, and what the code
  // that resumed it does once the body awaits.
  request?: string;
  suspend?: (path: Path) => Formula;
}

// The code that resumes an async generator for a request, which the request's promise settles with
// what the body yields, returns, or throws. The body then runs for the next that waits in its
// queue, or the code continues.
const getAsyncCaller = (
  node: ts.Node,
  name: string,
  path: Path,
  request: string,
  context: Context,
  continueWith: (path: Path) => Formula,
): Caller => {
  const drain = (current: Path): Formula => {
    const suspension = current.generators.get(name);
    const queued = suspension?.queue.at(0);
    if (suspension === undefined || queued === undefined) return continueWith(current);
    const waiting = { ...suspension, queue: suspension.queue.slice(1) };
    const resume = suspension.resume;
    return resume === undefined
      ? settleRequest(
          { ...current, generators: new Map([...current.generators, [name, waiting]]) },
          node,
          queued,
          getUndefined(context),
          true,
          false,
          context,
          drain,
        )
      : resume({
          ...current,
          generators: new Map([
            ...current.generators,
            [
              name,
              {
                ...waiting,
                caller: getAsyncCaller(node, name, current, queued, context, continueWith),
              },
            ],
          ]),
        });
  };
  return {
    path,
    step: (current, value, isDone) =>
      settleRequest(
        current,
        node,
        request,
        value ?? getUndefined(context),
        isDone,
        false,
        context,
        drain,
      ),
    throwTo: (current, thrown) =>
      settleRequest(current, node, request, thrown.value, true, true, context, drain),
    request,
    suspend: continueWith,
  };
};

interface Target {
  symbol: ts.Symbol;
  current: Expression;
  update: (getValue: (current: Expression) => Expression) => Expression;
}

interface Removed {
  value: Expression;
  path: Path;
}

export interface Thrown {
  value: Expression;
  uncaught: Expression;
}

interface YieldMode {
  // A yield* passes on what it yields, which an async generator doesn't await.
  isDelegated: boolean;
  // Whether a return or a throw at the yield would run code, such as a finally block or the close
  // of an iterator, which tla-ts doesn't follow.
  isGuarded: boolean;
  // A generator's yield* passes on the result object of the iterator it delegates to.
  isResult?: boolean;
  // What a return at a plain yield does: the exit of the yield's frame.
  returnRest?: (path: Path, value: Expression | undefined) => Formula;
}

// A frame whose yields a return or a throw can't complete.
export const guardYields = (frame: Frame): Frame => {
  const yieldTo = frame.yieldTo;
  return {
    ...frame,
    yieldTo:
      yieldTo &&
      ((path, value, rest, throwRest, mode) =>
        yieldTo(path, value, rest, throwRest, {
          ...mode,
          isDelegated: mode?.isDelegated ?? false,
          isGuarded: true,
        })),
  };
};

export interface Frame {
  // What follows the statements once they complete.
  next: (path: Path) => Formula;
  // What a return statement does: end the action, or leave an inlined helper with its value.
  exit: (path: Path, value?: Expression) => Formula;
  breakTo: ((path: Path) => Formula) | undefined;
  continueTo: ((path: Path) => Formula) | undefined;
  throwTo: ((path: Path, thrown: Thrown) => Formula) | undefined;
  // What a yield does in a generator's body, with the statements after it, and what an async
  // generator does where the promise it yields rejects.
  yieldTo:
    | ((
        path: Path,
        value: Expression | undefined,
        rest: (path: Path) => Formula,
        throwRest: (path: Path, thrown: Expression) => Formula,
        mode?: YieldMode,
      ) => Formula)
    | undefined;
  // What an await does in an async function's body, with what follows once the promise settles.
  awaitTo:
    | ((
        path: Path,
        value: Expression,
        operand: ts.Expression | undefined,
        onFulfilled: (path: Path, value: Expression) => Formula,
        onRejected: (path: Path, value: Expression) => Formula,
      ) => Formula)
    | undefined;
  // Functions being inlined, to reject recursion.
  inlining: Set<ts.Node>;
}

const COMPOUND_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
  [ts.SyntaxKind.PercentEqualsToken, "%"],
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken, "^"],
  [ts.SyntaxKind.SlashEqualsToken, "/"],
]);

// The arithmetic that compound assignments apply, as binary operators.
const ARITHMETIC_ASSIGNMENTS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, ts.SyntaxKind.PlusToken],
  [ts.SyntaxKind.MinusEqualsToken, ts.SyntaxKind.MinusToken],
  [ts.SyntaxKind.AsteriskEqualsToken, ts.SyntaxKind.AsteriskToken],
  [ts.SyntaxKind.PercentEqualsToken, ts.SyntaxKind.PercentToken],
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.AsteriskAsteriskToken],
  [ts.SyntaxKind.SlashEqualsToken, ts.SyntaxKind.SlashToken],
]);

// The operators on the bits of integers that compound assignments apply.
const BITWISE_ASSIGNMENTS = new Map([
  [ts.SyntaxKind.AmpersandEqualsToken, ts.SyntaxKind.AmpersandToken],
  [ts.SyntaxKind.BarEqualsToken, ts.SyntaxKind.BarToken],
  [ts.SyntaxKind.CaretEqualsToken, ts.SyntaxKind.CaretToken],
  [ts.SyntaxKind.LessThanLessThanEqualsToken, ts.SyntaxKind.LessThanLessThanToken],
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanToken],
  [
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  ],
]);

const LOGICAL_OPERATORS = new Set([
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

const INCREMENT_OPERATORS = new Map<ts.SyntaxKind, string>([
  [ts.SyntaxKind.PlusPlusToken, "+"],
  [ts.SyntaxKind.MinusMinusToken, "-"],
]);

const NUMBER_OPERATORS = new Map([
  ["+", "Add"],
  ["-", "Subtract"],
  ["*", "Multiply"],
  ["%", "Remainder"],
  ["^", "Power"],
  ["/", "Divide"],
]);

// An arithmetic operator, which the JavaScript module computes in a script that names NaN,
// Infinity, or -0. Otherwise % keeps the dividend's sign as Rem does.
const applyArithmetic = (operator: string, operands: Expression[], context: Context) => {
  const name = context.hasSpecialNumbers ? NUMBER_OPERATORS.get(operator) : undefined;
  if (name !== undefined) return useJavaScript(name, operands, context);
  if (operator === "%") context.prelude.add("Rem");
  return apply(operator === "%" ? "Rem" : operator, operands);
};

const getPart = (target: Target, step: ExceptPathStep): Target => ({
  ...target,
  update: (getValue) =>
    target.update((value) => except(value, [{ path: [step], value: getValue(exceptAt()) }])),
});

// A property of an object in the heap, or of a built-in object, that an assignment writes.
interface HeapWrite {
  symbol: ts.Symbol;
  heap: Expression;
  ref: Expression;
  key: Expression;
}

const getHeapWrite = (node: ts.Expression, path: Path, context: Context): HeapWrite | undefined => {
  if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return undefined;
  if (ts.isPropertyAccessExpression(node) && ts.isPrivateIdentifier(node.name)) return undefined;
  const receiver = node.expression;
  // tla-ts translates a collection's methods itself, so it can't call the ones a script puts there.
  if (
    ts.isPropertyAccessExpression(receiver) &&
    receiver.name.text === "prototype" &&
    COLLECTIONS.some((collection) => collection === getBuiltIn(receiver.expression, context))
  ) {
    throw new TlaTypeScriptError("tla-ts can't replace a collection's methods", node);
  }
  const isBuiltIn = context.heap !== undefined && isBuiltInObject(receiver, context);
  rejectAnyReceiver(receiver, context);
  if (!isBuiltIn && getKind(receiver, context) !== "object") return undefined;
  const symbol = context.heap;
  const heap = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
  if (symbol === undefined || heap === undefined || !path.mutable.has(symbol)) {
    throw new TlaTypeScriptError("Change objects only in statements", node);
  }
  return {
    symbol,
    heap,
    ref: translateObjectValue(receiver, path.scope, context),
    key: ts.isPropertyAccessExpression(node)
      ? string(node.name.text)
      : translatePropertyKey(node.argumentExpression, path.scope, context),
  };
};

// The current value of an assignment target, and how to replace it.
const getTarget = (node: ts.Expression, path: Path, context: Context): Target => {
  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return getTarget(node.expression, path, context);
  }
  if (ts.isIdentifier(node)) {
    rejectBeforeDeclaration(node, path.scope, context);
    const symbol = getSymbol(node, context.checker);
    const current = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
    const whole = ts.findAncestor(
      node,
      (ancestor) =>
        !ts.isParenthesizedExpression(ancestor.parent) &&
        !ts.isNonNullExpression(ancestor.parent) &&
        !ts.isAsExpression(ancestor.parent),
    );
    // A parameter's object may be the caller's too, which a change in place would miss.
    const isChangedInPlace =
      symbol?.valueDeclaration !== undefined &&
      ts.isParameter(symbol.valueDeclaration) &&
      whole !== undefined &&
      (ts.isPropertyAccessExpression(whole.parent) || ts.isElementAccessExpression(whole.parent)) &&
      whole.parent.expression === whole;
    if (
      symbol === undefined ||
      current === undefined ||
      !path.mutable.has(symbol) ||
      isChangedInPlace
    ) {
      throw new TlaTypeScriptError(
        `Only state variables and local lets can change: ${node.text}`,
        node,
      );
    }
    return { symbol, current, update: (getValue) => getValue(current) };
  }
  const privateMember =
    ts.isPropertyAccessExpression(node) && ts.isPrivateIdentifier(node.name)
      ? getPrivateMember(node.name, context)
      : undefined;
  if (privateMember !== undefined && ts.isPropertyAccessExpression(node)) {
    if (!ts.isPropertyDeclaration(privateMember)) {
      throw new TlaTypeScriptError("Write only to private fields and setters", node);
    }
    const symbol = context.heap;
    const heap = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
    if (symbol === undefined || heap === undefined || !path.mutable.has(symbol)) {
      throw new TlaTypeScriptError("Change objects only in statements", node);
    }
    const ref = translateObjectValue(node.expression, path.scope, context);
    const key = string(getPrivateKey(privateMember, context));
    const current = useJavaScript("PrivateGet", [heap, ref, key], context);
    return {
      symbol,
      current,
      update: (getValue) =>
        useJavaScript("PrivateSet", [heap, ref, key, getValue(current)], context),
    };
  }
  const write = getHeapWrite(node, path, context);
  if (write !== undefined) {
    const current = useJavaScript("Get", [write.heap, write.ref, write.key], context);
    return {
      symbol: write.symbol,
      current,
      update: (getValue) =>
        useJavaScript(
          "SetProperty",
          [write.heap, write.ref, write.key, getValue(current)],
          context,
        ),
    };
  }
  // An array's length that a script sets truncates the array, which can't hold the holes that a
  // longer length would leave.
  if (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === "length" &&
    getKind(node.expression, context) === "sequence"
  ) {
    const target = getTarget(node.expression, path, context);
    const assigned = node.parent;
    const isNumber = ts.isBinaryExpression(assigned) && isNumberLike(assigned.right, context);
    return {
      ...target,
      current: apply("Len", [target.current]),
      update: (getValue) =>
        target.update((sequence) =>
          share(
            isNumber
              ? getValue(apply("Len", [sequence]))
              : useJavaScript("ToNumber", [getValue(apply("Len", [sequence]))], context),
            "length",
            context,
            (length) =>
              ifExpression(
                apply("\\in", [length, apply("..", [number(0), apply("Len", [sequence])])]),
                apply("SubSeq", [sequence, number(1), length]),
                apply("Assert", [
                  boolean(false),
                  string("tla-ts can't lengthen an array that can't hold holes"),
                ]),
              ),
          ),
        ),
    };
  }
  if (ts.isPropertyAccessExpression(node)) {
    if (getKind(node.expression, context) !== "other") {
      throw new TlaTypeScriptError(`Can't assign to ${node.getText()}`, node);
    }
    return getPart(getTarget(node.expression, path, context), getPathStep(node.name.text));
  }
  if (ts.isElementAccessExpression(node)) {
    const target = getTarget(node.expression, path, context);
    const key = translateKey(node, path.scope, context);
    if (getKind(node.expression, context) !== "sequence") {
      return getPart(target, { kind: "Index", args: [key] });
    }
    return {
      ...target,
      update: (getValue) =>
        target.update((sequence) =>
          share(key, "position", context, (position) =>
            ifExpression(
              apply("\\in", [position, apply("DOMAIN", [sequence])]),
              except(sequence, [
                { path: [{ kind: "Index", args: [position] }], value: getValue(exceptAt()) },
              ]),
              ifExpression(
                apply("=", [position, apply("+", [apply("Len", [sequence]), number(1)])]),
                apply("Append", [sequence, getValue(getUndefined(context))]),
                apply("Assert", [
                  boolean(false),
                  string("TLA+ sequences can't have holes, so write at most one past the end"),
                ]),
              ),
            ),
          ),
        ),
    };
  }
  if (
    isMethodCall(node) &&
    node.expression.name.text === "get" &&
    node.arguments.length === 1 &&
    getKind(node.expression.expression, context) === "map"
  ) {
    const key = translateExpression(node.arguments[0], path.scope, context);
    return getPart(getTarget(node.expression.expression, path, context), {
      kind: "Index",
      args: [key],
    });
  }
  throw new TlaTypeScriptError(`Can't assign to ${node.getText()}`, node);
};

const assign = (
  node: ts.Expression,
  path: Path,
  context: Context,
  getValue: (current: Expression) => Expression,
): Path => {
  const target = getTarget(node, path, context);
  const value = target.update(getValue);
  return {
    ...path,
    scope: { ...path.scope, bindings: new Map([...path.scope.bindings, [target.symbol, value]]) },
    isAssigned: path.isAssigned || context.variables.has(target.symbol),
  };
};

// Writes one target of a pattern, then continues.
interface TargetAssigner<Result> {
  (
    target: ts.Expression,
    value: Expression,
    path: Path,
    continueWith: (path: Path) => Result,
  ): Result;
}

const PRIMITIVE_TYPES =
  ts.TypeFlags.StringLike |
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.ESSymbolLike |
  ts.TypeFlags.BigIntLike;

// Assigns a value to a target, or to each target in a destructuring pattern. Every value is read
// before any target changes, so [a, b] = [b, a] swaps.
const getDefaultedTarget = (node: ts.Expression) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ? { target: node.left, initializer: node.right }
    : { target: node, initializer: undefined };

const assignPattern = <Result>(
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: Expression,
  path: Path,
  context: Context,
  assignTarget: TargetAssigner<Result>,
  continueWith: (path: Path) => Result,
): Result => {
  if (ts.isArrayLiteralExpression(target)) {
    // A pattern destructures a list where it took values from an iterator, or where a rest element
    // made the array.
    const isList = ts.isSpreadElement(target.parent) || isTaken(value);
    if (!isList && isIteratedPattern(target, context)) {
      throw new TlaTypeScriptError(
        "tla-ts can't destructure this object through its iterator",
        target,
      );
    }
    if (!isList && isUntypedPattern(target, context)) {
      throw new TlaTypeScriptError("Give this pattern's value an array type", target);
    }
    // An array that the heap holds gives each element as the iterator reaches it, after the
    // pattern assigns the elements before it, and none once the iterator found no more.
    const isHeapSource = !isList && source !== undefined && isHeapArray(source, context);
    // Other arrays run the iterator that Array.prototype holds, which a script may replace.
    const heapSymbol = context.heap;
    const isIterated =
      heapSymbol !== undefined &&
      !isHeapSource &&
      !isTaken(value) &&
      !(context.checker.getTypeAtLocation(target).flags & ts.TypeFlags.StringLike);
    const heap = isIterated ? getHeap(path.scope, target, context) : undefined;
    const iterated =
      heap === undefined ? value : translateArrayIteration(value, heap, target, context);
    const assignFrom = (position: number, current: Path, wasDone: Expression): Result => {
      if (position === target.elements.length) return continueWith(current);
      const element = target.elements[position];
      const values = isHeapSource
        ? getHeapElements(getHeap(current.scope, target, context), value, target, context)
        : iterated;
      const done = isHeapSource
        ? junction("Or", [
            wasDone,
            not(apply("\\in", [number(position + 1), apply("DOMAIN", [values])])),
          ])
        : wasDone;
      const untilDone = (read: Expression, missing: Expression) =>
        isHeapSource ? ifExpression(wasDone, missing, read) : read;
      const next = (after: Path) => assignFrom(position + 1, after, done);
      if (ts.isOmittedExpression(element)) return next(current);
      if (ts.isSpreadElement(element)) {
        const restTarget = element.expression;
        const rest = untilDone(
          apply("SubSeq", [values, number(position + 1), apply("Len", [values])]),
          tuple([]),
        );
        const isProperty =
          (ts.isPropertyAccessExpression(restTarget) || ts.isElementAccessExpression(restTarget)) &&
          heapSymbol !== undefined;
        if (
          !(
            ts.isIdentifier(restTarget) ||
            ts.isArrayLiteralExpression(restTarget) ||
            ts.isObjectLiteralExpression(restTarget) ||
            isProperty
          ) ||
          position !== target.elements.length - 1 ||
          context.checker.getTypeOfAssignmentPattern(target).flags & ts.TypeFlags.StringLike
        ) {
          throw new TlaTypeScriptError("Rest elements can't be assigned", element);
        }
        if (ts.isArrayLiteralExpression(restTarget)) {
          return assignPattern(restTarget, undefined, rest, current, context, assignTarget, next);
        }
        // An object pattern reads the indices and the length of the array that the rest makes.
        if (ts.isObjectLiteralExpression(restTarget)) {
          const assignKeys = (at: number, inner: Path): Result => {
            if (at === restTarget.properties.length) return next(inner);
            const property = restTarget.properties[at];
            const defaulted = ts.isShorthandPropertyAssignment(property)
              ? { target: property.name, initializer: property.objectAssignmentInitializer }
              : ts.isPropertyAssignment(property)
                ? getDefaultedTarget(property.initializer)
                : undefined;
            const name = property.name;
            const key =
              name !== undefined &&
              (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
                ? name.text
                : undefined;
            const isIndex = key !== undefined && /^(0|[1-9][0-9]*)$/.test(key);
            if (defaulted === undefined || (key !== "length" && !isIndex)) {
              throw new TlaTypeScriptError(
                "tla-ts can't read this key of the array that a rest element makes",
                property,
              );
            }
            return assignPattern(
              defaulted.target,
              undefined,
              getDefaulted(
                isIndex ? getElement(rest, number(Number(key) + 1), context) : apply("Len", [rest]),
                defaulted.initializer,
                inner.scope,
                context,
              ),
              inner,
              context,
              assignTarget,
              (after) => assignKeys(at + 1, after),
            );
          };
          return assignKeys(0, current);
        }
        if (isProperty) return assignTarget(restTarget, rest, current, next);
        // An array that a rest element makes is new, which a script that reads it only through
        // its properties can't tell from a list.
        const symbol = getSymbol(restTarget, context.checker);
        const isSeen =
          context.heap !== undefined &&
          findNodes(
            target.getSourceFile(),
            (inner): inner is ts.Identifier =>
              ts.isIdentifier(inner) &&
              getSymbol(inner, context.checker) === symbol &&
              !(
                (ts.isPropertyAccessExpression(inner.parent) ||
                  ts.isElementAccessExpression(inner.parent)) &&
                inner.parent.expression === inner
              ) &&
              !(ts.isVariableDeclaration(inner.parent) && inner.parent.name === inner) &&
              !(
                ts.isSpreadElement(inner.parent) && ts.isArrayLiteralExpression(inner.parent.parent)
              ),
          ).length > 0;
        if (isSeen) {
          throw new TlaTypeScriptError(
            "tla-ts can't assign a rest element to an array that a script reads as an object",
            element,
          );
        }
        return assignTarget(restTarget, rest, current, next);
      }
      const defaulted = getDefaultedTarget(element);
      const sourceElement =
        source !== undefined && ts.isArrayLiteralExpression(source)
          ? source.elements[position]
          : undefined;
      const isFromSource = sourceElement !== undefined && !ts.isSpreadElement(sourceElement);
      return assignPattern(
        defaulted.target,
        isFromSource ? sourceElement : undefined,
        getDefaulted(
          isFromSource
            ? translateExpression(sourceElement, path.scope, context)
            : untilDone(getElement(values, number(position + 1), context), getUndefined(context)),
          defaulted.initializer,
          current.scope,
          context,
        ),
        current,
        context,
        assignTarget,
        next,
      );
    };
    return assignFrom(
      0,
      heapSymbol === undefined || heap === undefined
        ? path
        : {
            ...path,
            scope: {
              ...path.scope,
              bindings: new Map([
                ...path.scope.bindings,
                [heapSymbol, translateArrayIteration(heap, heap, target, context)],
              ]),
            },
          },
      boolean(false),
    );
  }
  if (ts.isObjectLiteralExpression(target)) {
    // A pattern that spreads into a name of type any has type any, unlike the value it reads.
    const patternType = context.checker.getTypeAtLocation(target);
    const type = context.checker.getNonNullableType(
      (patternType.flags & ts.TypeFlags.Any) === 0
        ? patternType
        : context.checker.getTypeOfAssignmentPattern(target),
    );
    const isHeapObject = isHeapPattern(type, target, context);
    // A rest alone of a primitive copies what the object that wraps it owns.
    const isPrimitiveRest =
      !isHeapObject &&
      target.properties.length === 1 &&
      (type.isUnion() ? type.types : [type]).every(
        (member) => (member.flags & PRIMITIVE_TYPES) !== 0,
      );
    // The heap after the pattern reads its properties, which the statement evaluates.
    const keys = target.properties.flatMap((property) =>
      property.name !== undefined && ts.isIdentifier(property.name)
        ? [string(property.name.text)]
        : [],
    );
    const heapSymbol = context.heap;
    const assignFrom = (position: number, current: Path): Result => {
      if (position === target.properties.length) {
        return heapSymbol === undefined || !isHeapObject
          ? continueWith(current)
          : continueWith({
              ...current,
              scope: {
                ...current.scope,
                bindings: new Map([
                  ...current.scope.bindings,
                  [
                    heapSymbol,
                    useJavaScript(
                      "ReadKeys",
                      [getHeap(current.scope, target, context), value, set(keys)],
                      context,
                    ),
                  ],
                ]),
              },
            });
      }
      const property = target.properties[position];
      const next = (after: Path) => assignFrom(position + 1, after);
      // A new object with the properties that the other properties don't name.
      if (
        ts.isSpreadAssignment(property) &&
        ts.isIdentifier(property.expression) &&
        position === target.properties.length - 1 &&
        (isHeapObject || isPrimitiveRest) &&
        heapSymbol !== undefined
      ) {
        const excluded = target.properties.flatMap((other) =>
          other !== property && other.name !== undefined && ts.isIdentifier(other.name)
            ? [string(other.name.text)]
            : [],
        );
        const heap = getHeap(current.scope, property, context);
        const allocated = useJavaScript(
          "Allocate",
          [
            heap,
            isHeapObject
              ? useJavaScript("RestObject", [heap, value, set(excluded), tuple([])], context)
              : useJavaScript("RestPrimitive", [value], context),
          ],
          context,
        );
        return assignTarget(
          property.expression,
          useJavaScript("Allocated", [allocated], context),
          {
            ...current,
            scope: {
              ...current.scope,
              bindings: new Map([...current.scope.bindings, [heapSymbol, allocated]]),
            },
          },
          next,
        );
      }
      if (
        !(ts.isShorthandPropertyAssignment(property) || ts.isPropertyAssignment(property)) ||
        !ts.isIdentifier(property.name)
      ) {
        throw new TlaTypeScriptError(`Can't assign to ${property.getText()}`, property);
      }
      const defaulted = ts.isShorthandPropertyAssignment(property)
        ? { target: property.name, initializer: property.objectAssignmentInitializer }
        : getDefaultedTarget(property.initializer);
      const key = property.name.text;
      const part = isHeapObject
        ? useJavaScript(
            "Get",
            [getHeap(current.scope, property, context), value, string(key)],
            context,
          )
        : defaulted.initializer === undefined
          ? getField(value, key)
          : getOptionalField(value, key, context);
      return assignPattern(
        defaulted.target,
        undefined,
        getDefaulted(part, defaulted.initializer, current.scope, context),
        current,
        context,
        assignTarget,
        next,
      );
    };
    return assignFrom(0, path);
  }
  return assignTarget(target, value, path, continueWith);
};

// Assigns a value to a target, or to each target in a pattern, where no setter runs.
const assignAll = (
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: Expression,
  path: Path,
  context: Context,
) =>
  assignPattern<Path>(
    target,
    source,
    value,
    path,
    context,
    (inner, innerValue, current, next) => next(assign(inner, current, context, () => innerValue)),
    (after) => after,
  );

// Assigns as assignAll does, and runs the setter that a property it writes holds.
const assignPatternWith = (
  site: ts.Node,
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) =>
  assignPattern(
    target,
    source,
    value,
    path,
    context,
    (inner, innerValue, current, next) => {
      const setters =
        ts.isPropertyAccessExpression(inner) || ts.isElementAccessExpression(inner)
          ? getPropertySetters(inner, context).filter((setter) => !frame.inlining.has(setter))
          : [];
      const write = setters.length === 0 ? undefined : getHeapWrite(inner, current, context);
      return write === undefined
        ? next(assign(inner, current, context, () => innerValue))
        : writeWith(
            site,
            write.ref,
            write.key,
            innerValue,
            setters,
            current,
            context,
            frame,
            (after) =>
              next({
                ...after,
                isAssigned: after.isAssigned || context.variables.has(write.symbol),
              }),
          );
    },
    continueWith,
  );

const REMOVING_METHODS = new Set(["push", "unshift", "splice", "shift", "pop"]);

// Whether a call changes an array, a set, or a map, and gives what it removed or how long the array
// became.
const isRemoving = (node: ts.Expression, context: Context): boolean => {
  if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
    return isRemoving(node.expression, context);
  }
  if (!isMethodCall(node)) return false;
  const method = node.expression.name.text;
  const kind = getKind(node.expression.expression, context);
  // A set or a map that the heap holds changes as a statement's call.
  return (
    (method === "delete" &&
      (kind === "set" || kind === "map") &&
      !isHeapSetOrMap(node.expression.expression, context) &&
      node.arguments.length === 1) ||
    (kind === "sequence" &&
      !node.arguments.some(ts.isSpreadElement) &&
      REMOVING_METHODS.has(method))
  );
};

// The value that a call like queue.shift() returns, before it changes the queue.
const getRemovedValue = (
  node: ts.Expression,
  path: Path,
  context: Context,
): Removed | undefined => {
  if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
    return getRemovedValue(node.expression, path, context);
  }
  if (!isMethodCall(node) || !isRemoving(node, context)) return undefined;
  const method = node.expression.name.text;
  const receiver = node.expression.expression;
  const kind = getKind(receiver, context);
  // A set's or a map's delete gives whether it held the key.
  if (method === "delete") {
    const collection = translateExpression(receiver, path.scope, context);
    const key = translateSetKey(node.arguments[0], path.scope, context);
    return {
      value: apply("\\in", [key, kind === "map" ? apply("DOMAIN", [collection]) : collection]),
      path: assign(
        receiver,
        path,
        context,
        (current) => getUpdatedValue(current, kind, node, path.scope, context) ?? current,
      ),
    };
  }
  const sequence = translateExpression(receiver, path.scope, context);
  // A push or an unshift gives the array's new length, and a splice the elements it removes.
  const value =
    method === "push" || method === "unshift"
      ? apply("+", [apply("Len", [sequence]), number(node.arguments.length)])
      : method === "splice"
        ? translateSpliced(sequence, node.arguments, true, path.scope, context)
        : ifExpression(
            apply("=", [sequence, tuple([])]),
            getUndefined(context),
            method === "shift"
              ? apply("Head", [sequence])
              : index(sequence, [apply("Len", [sequence])]),
          );
  // A splice whose result the heap holds gives the array that its statement made.
  const made = context.heapCollections.has(node) ? path.scope.allocated.get(node) : undefined;
  return {
    value: made ?? checkArrayMethod(value, node, path.scope, context),
    path: assign(
      receiver,
      path,
      context,
      (current) => getUpdatedValue(current, kind, node, path.scope, context) ?? current,
    ),
  };
};

// A declaration's array pattern reads an array that the heap holds through its iterator, which
// visits the elements that a copy of them holds while the pattern's defaults change no object.
const translatePatternSource = (
  pattern: ts.BindingName,
  source: ts.Expression,
  path: Path,
  context: Context,
) => {
  if (!ts.isArrayBindingPattern(pattern) || !isHeapArray(source, context)) {
    return translateExpression(source, path.scope, context);
  }
  if (getChanged(pattern, path, context).some((symbol) => symbol === context.heap)) {
    throw new TlaTypeScriptError(
      "tla-ts can't destructure an array that the heap holds while the pattern changes objects",
      pattern,
    );
  }
  return translateHeapElements(source, path.scope, context);
};

// The path after an assignment, such as x = 1, x += 1, or x++.
const getAssignedPath = (expression: ts.Expression, path: Path, context: Context) => {
  if (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression)) {
    const operator = INCREMENT_OPERATORS.get(expression.operator);
    if (operator !== undefined && isBigIntLike(expression.operand, context)) {
      return assign(expression.operand, path, context, (current) =>
        useJavaScript(
          operator === "+" ? "BigIntAdd" : "BigIntSubtract",
          [current, translateBigInt(1, context)],
          context,
        ),
      );
    }
    if (operator !== undefined && !isNumberLike(expression.operand, context)) {
      throw new TlaTypeScriptError(`${expression.getText()} needs a number`, expression);
    }
    return operator === undefined
      ? undefined
      : assign(expression.operand, path, context, (current) =>
          applyArithmetic(operator, [current, number(1)], context),
        );
  }
  if (!ts.isBinaryExpression(expression)) return undefined;
  const kind = expression.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    const assigned = getAnyFunction(expression.right);
    const symbol = ts.isIdentifier(expression.left)
      ? getSymbol(expression.left, context.checker)
      : undefined;
    const isLocal = symbol !== undefined && !context.variables.has(symbol);
    if (
      assigned !== undefined &&
      symbol !== undefined &&
      path.mutable.has(symbol) &&
      !path.isLooping &&
      (isLocal || path.isLast)
    ) {
      const functions = new Map([...path.scope.functions, [symbol, assigned]]);
      return { ...path, scope: { ...path.scope, functions } };
    }
    const value = translateExpression(expression.right, path.scope, context);
    const after = assignAll(expression.left, expression.right, value, path, context);
    if (symbol === undefined || !after.scope.functions.has(symbol)) return after;
    const functions = new Map(after.scope.functions);
    functions.delete(symbol);
    return { ...after, scope: { ...after.scope, functions } };
  }
  const update = getUpdate(expression, path, context);
  return update === undefined ? undefined : assign(expression.left, path, context, update);
};

// Whether a logical assignment writes its target, which holds a value.
const isLogicallyWritten = (
  expression: ts.BinaryExpression,
  current: Expression,
  context: Context,
) => {
  const kind = expression.operatorToken.kind;
  const isTruthy = isBooleanLike(expression.left, context)
    ? current
    : useJavaScript("ToBoolean", [current], context);
  context.prelude.add("Null");
  return kind === ts.SyntaxKind.QuestionQuestionEqualsToken
    ? apply("\\in", [current, set([getUndefined(context), identifier("Null")])])
    : kind === ts.SyntaxKind.BarBarEqualsToken
      ? not(isTruthy)
      : isTruthy;
};

// How a compound or logical assignment changes what its target holds.
const getUpdate = (expression: ts.BinaryExpression, path: Path, context: Context) => {
  const kind = expression.operatorToken.kind;
  if (LOGICAL_OPERATORS.has(kind)) {
    const assigned = translateExpression(expression.right, path.scope, context);
    return (current: Expression) =>
      ifExpression(isLogicallyWritten(expression, current, context), assigned, current);
  }
  const arithmetic = ARITHMETIC_ASSIGNMENTS.get(kind);
  const bigIntOperator = arithmetic === undefined ? undefined : BIGINT_OPERATORS.get(arithmetic);
  if (
    bigIntOperator !== undefined &&
    isBigIntLike(expression.left, context) &&
    isBigIntLike(expression.right, context)
  ) {
    const value = translateExpression(expression.right, path.scope, context);
    return (current: Expression) => useJavaScript(bigIntOperator, [current, value], context);
  }
  const isConcatenated =
    kind === ts.SyntaxKind.PlusEqualsToken && getKind(expression.left, context) === "string";
  const bitwiseKind = BITWISE_ASSIGNMENTS.get(kind);
  const bitwise = bitwiseKind === undefined ? undefined : BITWISE_OPERATORS.get(bitwiseKind);
  const operator = isConcatenated ? "\\o" : (bitwise ?? COMPOUND_OPERATORS.get(kind));
  if (operator === undefined) return undefined;
  if (
    !isConcatenated &&
    (!isNumberLike(expression.left, context) || !isNumberLike(expression.right, context))
  ) {
    throw new TlaTypeScriptError(`${expression.operatorToken.getText()} needs numbers`, expression);
  }
  if (operator === "/" && !context.hasSpecialNumbers) {
    throw new TlaTypeScriptError(
      "Write division as Math.floor(a / b) or Math.trunc(a / b)",
      expression,
    );
  }
  if (bitwise !== undefined) {
    const value = translateExpression(expression.right, path.scope, context);
    return (current: Expression) => useJavaScript(bitwise, [current, value], context);
  }
  const value = isConcatenated
    ? translateToString(expression.right, path.scope, context)
    : translateExpression(expression.right, path.scope, context);
  return (current: Expression) =>
    isConcatenated
      ? apply(operator, [current, value])
      : applyArithmetic(operator, [current, value], context);
};

// The call whose result a chain of property reads reads, as a first argument that reads properties
// of a call's result runs the call first.
const getRootCall = (node: ts.Expression | undefined): ts.Expression | undefined =>
  node !== undefined && ts.isPropertyAccessExpression(node) ? getRootCall(node.expression) : node;

export const translateCallStatement = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  if (expression.expression.kind === ts.SyntaxKind.SuperKeyword) {
    return translateSuperCall(expression, path, context, frame, continueWith);
  }
  const loop = getLoopCall(expression, path, context);
  if (loop !== undefined) {
    return translateLoopCall(expression, loop, path, context, frame, continueWith);
  }
  const first = getRootCall(expression.arguments.at(0));
  if (
    first !== undefined &&
    ts.isCallExpression(first) &&
    !path.scope.results.has(first) &&
    !isGeneratorType(first, context) &&
    isStatementCall(first, path, context)
  ) {
    return translateCallStatement(first, path, context, frame, (after, value) =>
      translateCallStatement(
        expression,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [first, value ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
        continueWith,
      ),
    );
  }
  // A later argument that only statements can run runs first too, where what evaluates before it
  // doesn't read what it changes.
  const leading = getLeadingCall(expression, (call) => call !== expression, path, context);
  if (leading !== undefined) {
    return translateCallStatement(leading.call, path, context, frame, (after, value) =>
      translateCallStatement(
        expression,
        withLeadingResults(leading, path, after, value, context),
        context,
        frame,
        continueWith,
      ),
    );
  }
  // A receiver that may be undefined or null gives undefined to an optional chain, and throws a
  // TypeError otherwise.
  const guardReceiver = (receiver: ts.Expression, changed: Formula) => {
    const held = getCast(ts.isNonNullExpression(receiver) ? receiver.expression : receiver);
    const heldType = context.checker.getTypeAtLocation(held);
    if (context.checker.getNonNullableType(heldType) === heldType) return changed;
    context.prelude.add("Null");
    return ifThenElse(
      apply("\\in", [
        translateExpression(held, path.scope, context),
        set([getUndefined(context), identifier("Null")]),
      ]),
      isMethodCall(expression) && expression.expression.questionDotToken !== undefined
        ? continueWith(path)
        : throwTypeError(path, expression, context, frame),
      changed,
    );
  };
  // A call like stack.pop() that an expression evaluates, which gives its value from before.
  const removed = getRemovedValue(expression, path, context);
  if (removed !== undefined && isMethodCall(expression)) {
    const name = context.names.getFresh("removed");
    return guardReceiver(
      expression.expression.expression,
      bindOnce(removed.path, name, removed.value, continueWith(removed.path, identifier(name))),
    );
  }
  if (isPromiseCall(expression, context)) {
    return translatePromiseCall(expression, path, context, frame, continueWith);
  }
  const consumer = getGeneratorMethod(expression, context);
  const stepped = isGeneratorStep(expression, context) ? expression : undefined;
  const translateStep =
    consumer !== undefined
      ? (current: Path) =>
          (ITERATOR_HELPERS.has(consumer.method)
            ? translateIteratorHelper
            : translateGeneratorConsumer)(
            expression,
            consumer,
            current,
            context,
            frame,
            continueWith,
          )
      : stepped &&
        ((current: Path) => translateGeneratorStep(stepped, current, context, frame, continueWith));
  const generator = consumer?.receiver ?? stepped?.expression.expression;
  if (translateStep !== undefined && generator !== undefined) {
    const receiver = getCast(generator);
    if (
      ts.isCallExpression(receiver) &&
      !path.scope.results.has(receiver) &&
      isStatementCall(receiver, path, context)
    ) {
      return translateCallStatement(receiver, path, context, frame, (after, value) =>
        translateStep({
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [receiver, value ?? getUndefined(context)]]),
          },
        }),
      );
    }
    return translateStep(path);
  }
  const created = getCreatedGenerator(expression, path, context);
  if (created !== undefined) {
    rejectGeneratorUse(expression, context);
    return translateGeneratorCall(expression, created, path, context, frame, continueWith);
  }
  const asyncCallee = getAsyncCallee(expression.expression, path, context);
  if (asyncCallee !== undefined) {
    return translateAsyncCall(
      expression,
      asyncCallee,
      undefined,
      path,
      context,
      frame,
      continueWith,
    );
  }
  const asyncMethod = getCalledMethod(expression.expression, context, isAsyncFunction);
  if (asyncMethod !== undefined) {
    return ifThenElse(
      translateHoldsMethod(asyncMethod, path.scope, context),
      translateAsyncCall(
        expression,
        asyncMethod.method,
        getReceiver(path.scope, context, asyncMethod),
        path,
        context,
        frame,
        continueWith,
      ),
      leaf(
        apply("Assert", [boolean(false), string("tla-ts can't tell which method this call runs")]),
      ),
    );
  }
  const translateArguments = (argumentNodes: readonly ts.Expression[]) =>
    argumentNodes.map((argument) => translateExpression(argument, path.scope, context));
  const heapSymbol = context.heap;
  const withHeap = (heap: Expression) =>
    heapSymbol === undefined
      ? path
      : {
          ...path,
          scope: {
            ...path.scope,
            bindings: new Map([...path.scope.bindings, [heapSymbol, heap]]),
          },
        };
  const dateCall = getDateCall(expression, context);
  if (dateCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const receiver = context.names.getFresh("date");
    const timeName = context.names.getFresh("time");
    const time = identifier(timeName);
    const isStatement = ts.isExpressionStatement(expression.parent);
    const setter = getDateSetter(dateCall.method, dateCall.values, context);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const run = dateCall.isSetter
      ? setter === undefined
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't convert the arguments of this Date setter"),
            ]),
          )
        : bindOnce(
            path,
            changeName,
            useJavaScript(
              "DateChange",
              [
                heap,
                identifier(receiver),
                time,
                string(dateCall.method),
                number(setter.position),
                tuple(
                  dateCall.values.map((argument) =>
                    translateToNumber(argument, expression, path.scope, context),
                  ),
                ),
              ],
              context,
            ),
            // A time value too far from 1970 for TLC's integers is only a number where something
            // reads it.
            continueWith(
              withHeap(field(change, "heap")),
              isStatement
                ? undefined
                : useJavaScript("TimeNumber", [field(change, "time")], context),
            ),
          )
      : dateCall.method === "toISOString"
        ? ifThenElse(
            apply("=", [time, identifier("NaN")]),
            throwError("RangeError", path, expression, context, frame),
            continueWith(path, useJavaScript("ISOString", [time], context)),
          )
        : continueWith(path);
    const callee = dateCall.callee;
    const withTime = (value: Expression) => bindOnce(path, timeName, value, run);
    return bindOnce(
      path,
      receiver,
      dateCall.receiver === undefined
        ? getUndefined(context)
        : translateExpression(dateCall.receiver, path.scope, context),
      callee === undefined
        ? withTime(
            useJavaScript(
              "DateTime",
              [heap, identifier(receiver), string(dateCall.method)],
              context,
            ),
          )
        : ifThenElse(
            useJavaScript(
              "IsDateMethod",
              [translateExpression(callee, path.scope, context), string(dateCall.method)],
              context,
            ),
            ifThenElse(
              useJavaScript("IsDate", [heap, identifier(receiver)], context),
              withTime(useJavaScript("TimeOfDate", [heap, identifier(receiver)], context)),
              throwTypeError(path, expression, context, frame),
            ),
            leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't tell which function this value holds"),
              ]),
            ),
          ),
    );
  }
  // decodeURI and decodeURIComponent throw a URIError where a % doesn't start an escape of UTF-8.
  const uriCall = getURICall(expression, context);
  if (uriCall?.isDecode === true) {
    const text = context.names.getFresh("text");
    return bindOnce(
      path,
      text,
      translateExpression(uriCall.text, path.scope, context),
      ifThenElse(
        useJavaScript("IsMalformedURI", [identifier(text)], context),
        throwError("URIError", path, expression, context, frame),
        continueWith(path, useJavaScript("DecodeURI", [identifier(text), uriCall.kept], context)),
      ),
    );
  }
  const regExpCall = getHeapRegExpCall(expression, context);
  if (regExpCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const regexp = context.names.getFresh("regexp");
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const method = regExpCall.method;
    const textName = context.names.getFresh("text");
    const text = identifier(textName);
    const replacer = regExpCall.values.find(
      (value) =>
        (method === "replace" || method === "replaceAll") &&
        !isEvery(context.checker.getTypeAtLocation(value), ts.TypeFlags.StringLike),
    );
    const changeable = set([string("RegExp.prototype"), string("String.prototype")]);
    const changed = withHeap(field(change, "heap"));
    // A replace function runs for each match once they're all found, with the heap after.
    const run =
      replacer === undefined
        ? bindOnce(
            path,
            changeName,
            useJavaScript(
              regExpCall.heapOperator,
              [
                heap,
                identifier(regexp),
                text,
                // exec and match make arrays, and split's limit is undefined where the call
                // passes none.
                ...(method === "exec" || method === "match"
                  ? [translateBuiltInValue("Array.prototype", expression, context)]
                  : method === "split" && regExpCall.values.length === 0
                    ? [getUndefined(context)]
                    : regExpCall.values.map((value) =>
                        translateExpression(value, path.scope, context),
                      )),
              ],
              context,
            ),
            continueWith(changed, field(change, "value")),
          )
        : bindOnce(
            path,
            changeName,
            useJavaScript("RegExpMatchesIn", [heap, identifier(regexp), text], context),
            continueWith(
              changed,
              translateRegExpReplacer(
                replacer,
                useJavaScript(
                  "RegExpOf",
                  [field(change, "heap"), identifier(regexp), changeable],
                  context,
                ),
                text,
                field(change, "value"),
                changed.scope,
                context,
              ),
            ),
          );
    // replaceAll throws a TypeError where the regexp isn't global, as its flags tell.
    return bindOnce(
      path,
      regexp,
      translateExpression(regExpCall.regexp, path.scope, context),
      bindOnce(
        path,
        textName,
        translateRegExpText(regExpCall, expression, path.scope, context),
        method === "replaceAll"
          ? ifThenElse(
              field(
                useJavaScript("RegExpOf", [heap, identifier(regexp), changeable], context),
                "global",
              ),
              run,
              throwTypeError(path, expression, context, frame),
            )
          : run,
      ),
    );
  }
  // A call of a key under which a script stores a built-in method that changes its receiver or
  // throws.
  const storedCall = isStoredStatement(expression, context)
    ? getStoredCall(expression, context)
    : undefined;
  if (storedCall !== undefined) {
    const objectName = context.names.getFresh("object");
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    return bindOnce(
      path,
      objectName,
      translateExpression(storedCall.receiver, path.scope, context),
      ifThenElse(
        apply("\\in", [identifier(objectName), set([getUndefined(context), identifier("Null")])]),
        throwTypeError(path, expression, context, frame),
        bindOnce(
          path,
          changeName,
          translateStoredCall(
            storedCall,
            translateExpression(expression.expression, path.scope, context),
            identifier(objectName),
            true,
            path.scope,
            context,
          ),
          ifThenElse(
            field(change, "isThrown"),
            throwTypeError(withHeap(field(change, "heap")), expression, context, frame),
            continueWith(withHeap(field(change, "heap")), field(change, "value")),
          ),
        ),
      ),
    );
  }
  const collectionChange = getHeapSetOrMapChange(expression, context);
  if (collectionChange !== undefined && isMethodCall(expression)) {
    const heap = getHeap(path.scope, expression, context);
    const collectionName = context.names.getFresh("collection");
    const ref = identifier(collectionName);
    const method = collectionChange.method;
    const data = useJavaScript("CollectionData", [heap, ref], context);
    const updated = getUpdatedValue(data, collectionChange.kind, expression, path.scope, context);
    const key = expression.arguments[0];
    const builtIn = `${collectionChange.kind === "set" ? "Set" : "Map"}.prototype.${method}`;
    const value =
      method === "delete" && key !== undefined
        ? apply("\\in", [
            translateSetKey(key, path.scope, context),
            collectionChange.kind === "set" ? data : apply("DOMAIN", [data]),
          ])
        : method === "clear"
          ? getUndefined(context)
          : ref;
    if (updated === undefined) {
      throw new TlaTypeScriptError(`Unsupported method: ${method}`, expression);
    }
    // A holder that may hold undefined gives undefined to an optional chain, and throws otherwise.
    return bindOnce(
      path,
      collectionName,
      translateExpression(collectionChange.receiver, path.scope, context),
      ifThenElse(
        apply("\\in", [ref, set([getUndefined(context), identifier("Null")])]),
        collectionChange.isOptional
          ? continueWith(path, getUndefined(context))
          : throwTypeError(path, expression, context, frame),
        ifThenElse(
          useJavaScript("HoldsBuiltIn", [heap, ref, string(method), string(builtIn)], context),
          continueWith(
            withHeap(useJavaScript("WithCollectionData", [heap, ref, updated], context)),
            value,
          ),
          leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't call ${builtIn} where a script replaced it`),
            ]),
          ),
        ),
      ),
    );
  }
  const arrayChange = getHeapArrayChange(expression, context);
  if (arrayChange !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const arrayName = context.names.getFresh("array");
    const ref = identifier(arrayName);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const method = arrayChange.method;
    const literal = getArrayLiteral(skipCasts(arrayChange.receiver), context);
    const sortsInPlace = (inPlace: Formula) =>
      method === "sort" && literal !== undefined
        ? ifThenElse(
            useJavaScript("SortsInPlace", [heap, ref], context),
            inPlace,
            translateIndexedSort(
              expression,
              ref,
              arrayChange.items.at(0),
              literal.elements.length,
              path,
              context,
              frame,
              continueWith,
            ),
          )
        : inPlace;
    const changeArray = ifThenElse(
      useJavaScript(
        "HoldsBuiltIn",
        [heap, ref, string(method), string(`Array.prototype.${method}`)],
        context,
      ),
      sortsInPlace(
        bindOnce(
          path,
          changeName,
          method === "splice"
            ? useJavaScript(
                "ArraySplice",
                [
                  heap,
                  ref,
                  translateExpression(arrayChange.items[0], path.scope, context),
                  boolean(arrayChange.items.length > 1),
                  arrayChange.items.length > 1
                    ? translateExpression(arrayChange.items[1], path.scope, context)
                    : getUndefined(context),
                  tuple(translateArguments(arrayChange.items.slice(2))),
                  translateBuiltInValue("Array", expression, context),
                ],
                context,
              )
            : translateArrayChange(method, heap, ref, arrayChange.items, path.scope, context),
          ifThenElse(
            field(change, "isThrown"),
            throwTypeError(withHeap(field(change, "heap")), expression, context, frame),
            continueWith(withHeap(field(change, "heap")), field(change, "value")),
          ),
        ),
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't call Array.prototype.${method} where a script replaced it`),
        ]),
      ),
    );
    // A holder that may hold undefined gives undefined to an optional chain, and throws otherwise.
    return bindOnce(
      path,
      arrayName,
      translateExpression(arrayChange.receiver, path.scope, context),
      ifThenElse(
        apply("\\in", [ref, set([getUndefined(context), identifier("Null")])]),
        arrayChange.isOptional
          ? continueWith(path, getUndefined(context))
          : throwTypeError(path, expression, context, frame),
        changeArray,
      ),
    );
  }
  const iteratorCall = getArrayIteratorCall(expression, context);
  if (iteratorCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const receiverName = context.names.getFresh("receiver");
    const receiver = identifier(receiverName);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const operation =
      iteratorCall.kind === undefined
        ? useJavaScript("ArrayIteratorNext", [heap, receiver], context)
        : useJavaScript(
            "ArrayIterator",
            [
              heap,
              receiver,
              string(iteratorCall.kind),
              translateArrayIteratorPrototype(expression, context),
            ],
            context,
          );
    return bindOnce(
      path,
      receiverName,
      translateExpression(iteratorCall.receiver, path.scope, context),
      ifThenElse(
        translateHoldsIteratorMethod(iteratorCall, heap, receiver, context),
        bindOnce(
          path,
          changeName,
          operation,
          continueWith(withHeap(field(change, "heap")), field(change, "value")),
        ),
        leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't call ${iteratorCall.path} where a script replaced it`),
          ]),
        ),
      ),
    );
  }
  const viewCall = getViewCall(expression, context);
  if (viewCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const receiver = context.names.getFresh("view");
    const ref = identifier(receiver);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const values = [0, 1, 2].map((position) => {
      const value = viewCall.values.at(position);
      return value === undefined
        ? getUndefined(context)
        : translateExpression(value, path.scope, context);
    });
    const method = viewCall.method;
    const type = string(method.slice(3));
    const isShared = boolean(viewCall.owner === "SharedArrayBuffer");
    const prototypePath =
      viewCall.owner === "TypedArray"
        ? "%Int8Array.prototype.[[Prototype]]%"
        : `${viewCall.owner}.prototype`;
    const operation =
      viewCall.owner === "TypedArray"
        ? useJavaScript(
            "TypedArrayMethod",
            [
              heap,
              ref,
              string(method),
              tuple(
                viewCall.values.map((value) => translateExpression(value, path.scope, context)),
              ),
              translateBuiltInValue("ArrayBuffer.prototype", expression, context),
              record(
                "Record",
                [...TYPED_ARRAYS.values()].map((type) => ({
                  name: type,
                  value: translateBuiltInValue(`${type}Array`, expression, context),
                })),
              ),
            ],
            context,
          )
        : viewCall.owner === "DataView"
          ? method.startsWith("get")
            ? useJavaScript("DataViewGet", [heap, ref, type, values[0], values[1]], context)
            : useJavaScript("DataViewSet", [heap, ref, type, ...values], context)
          : method === "slice"
            ? useJavaScript(
                "BufferSlice",
                [
                  heap,
                  ref,
                  values[0],
                  values[1],
                  isShared,
                  translateBuiltInValue(
                    viewCall.owner === "SharedArrayBuffer" ? "SharedArrayBuffer" : "ArrayBuffer",
                    expression,
                    context,
                  ),
                ],
                context,
              )
            : useJavaScript("Resize", [heap, ref, values[0], isShared], context);
    const run = bindOnce(
      path,
      changeName,
      operation,
      ifThenElse(
        apply("=", [field(change, "error"), string("")]),
        continueWith(withHeap(field(change, "heap")), field(change, "value")),
        ifThenElse(
          apply("=", [field(change, "error"), string("RangeError")]),
          throwError("RangeError", path, expression, context, frame),
          throwTypeError(path, expression, context, frame),
        ),
      ),
    );
    return bindOnce(
      path,
      receiver,
      translateExpression(viewCall.receiver, path.scope, context),
      ifThenElse(
        viewCall.callee === undefined
          ? useJavaScript(
              "HoldsBuiltIn",
              [heap, ref, string(method), string(`${prototypePath}.${method}`)],
              context,
            )
          : useJavaScript(
              "SameValue",
              [
                translateExpression(viewCall.callee, path.scope, context),
                useJavaScript(
                  ":>",
                  [identifier("Ref"), string(`${prototypePath}.${method}`)],
                  context,
                ),
              ],
              context,
            ),
        viewCall.owner === "DataView"
          ? ifThenElse(
              useJavaScript("IsDataView", [heap, ref], context),
              run,
              throwTypeError(path, expression, context, frame),
            )
          : run,
        leaf(
          apply("Assert", [
            boolean(false),
            string(
              viewCall.callee === undefined
                ? `tla-ts can't call ${prototypePath}.${method} where a script replaced it`
                : "tla-ts can't tell which function this call runs",
            ),
          ]),
        ),
      ),
    );
  }
  if (getStackCall(expression, context) !== undefined) {
    return translateStackCall(expression, path, context, frame, continueWith);
  }
  const getterCall = getGetterCall(expression, context);
  if (getterCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const resultName = context.names.getFresh("result");
    const result = identifier(resultName);
    const getter = translateExpression(getterCall.getter, path.scope, context);
    const receiver = getterCall.receiver;
    // A function that a literal makes is none of the objects that the getters other than flags,
    // __proto__ and @@species check for.
    const isFunctionReceiver =
      receiver !== undefined &&
      (ts.isArrowFunction(receiver) || ts.isFunctionExpression(receiver)) &&
      getterCall.path !== "get Object.prototype.__proto__" &&
      getterCall.path !== "get RegExp.prototype.flags" &&
      !getterCall.path.endsWith(".@@species");
    const sizeOwner =
      getterCall.path === "get Map.prototype.size"
        ? "Map"
        : getterCall.path === "get Set.prototype.size"
          ? "Set"
          : undefined;
    const size =
      sizeOwner === undefined
        ? undefined
        : translateSizeGetter(sizeOwner, receiver, path.scope, context);
    const run = isFunctionReceiver
      ? throwTypeError(path, expression, context, frame)
      : sizeOwner !== undefined
        ? size === undefined
          ? throwTypeError(path, expression, context, frame)
          : continueWith(path, size)
        : bindOnce(
            path,
            resultName,
            useJavaScript(
              "GetterCall",
              [
                heap,
                getter,
                receiver === undefined
                  ? getUndefined(context)
                  : translateExpression(receiver, path.scope, context),
              ],
              context,
            ),
            ifThenElse(
              apply("=", [field(result, "error"), string("")]),
              continueWith(path, field(result, "value")),
              throwTypeError(path, expression, context, frame),
            ),
          );
    const builtIn = translateBuiltInValue(getterCall.path, expression, context);
    return ifThenElse(
      apply("/\\", [
        useJavaScript("SameValue", [getter, builtIn], context),
        getterCall.isCall
          ? useJavaScript(
              "HoldsBuiltIn",
              [heap, builtIn, string("call"), string("Function.prototype.call")],
              context,
            )
          : boolean(true),
      ]),
      run,
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call a getter that a script replaced"),
        ]),
      ),
    );
  }
  const stringCall = getStringCall(expression, context);
  if (stringCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const builtIn = translateBuiltInValue(
      `String.prototype.${stringCall.method}`,
      expression,
      context,
    );
    const conversion = {
      operands: [stringCall.owner, ...stringCall.values],
      hint: "string" as const,
      combine: (primitives: readonly Expression[]) => tuple([...primitives]),
    };
    return ifThenElse(
      apply("/\\", [
        useJavaScript(
          "SameValue",
          [translateExpression(stringCall.callee, path.scope, context), builtIn],
          context,
        ),
        useJavaScript(
          "HoldsBuiltIn",
          [heap, builtIn, string("call"), string("Function.prototype.call")],
          context,
        ),
      ]),
      runConversion(expression, conversion, path, context, frame, (after, converted) => {
        const primitives = [...stringCall.values, undefined].map((_, position) =>
          index(converted, [number(position + 1)]),
        );
        const text = primitives[0];
        return ifThenElse(
          apply("\\/", [
            apply("\\in", [text, set([getUndefined(context), identifier("Null")])]),
            apply("=", [useJavaScript("TypeOf", [text], context), string("symbol")]),
          ]),
          throwTypeError(after, expression, context, frame),
          continueWith(
            after,
            translatePrimitiveMethod(
              stringCall.primitive,
              useJavaScript("StringOf", [text], context),
              primitives.slice(1),
              context,
            ),
          ),
        );
      }),
      leaf(
        apply("Assert", [
          boolean(false),
          string(
            `tla-ts can't call String.prototype.${stringCall.method} where a script replaced it`,
          ),
        ]),
      ),
    );
  }
  // The function that Proxy.revocable gives, which revokes the proxy the first time it runs.
  if (isRevoke(expression, context)) {
    const heap = getHeap(path.scope, expression, context);
    const revoker = context.names.getFresh("revoker");
    const revoked = context.names.getFresh("heap");
    return bindOnce(
      path,
      revoker,
      translateExpression(expression.expression, path.scope, context),
      ifThenElse(
        useJavaScript("IsRevoker", [heap, identifier(revoker)], context),
        bindOnce(
          path,
          revoked,
          useJavaScript("Revoke", [heap, identifier(revoker)], context),
          continueWith(withHeap(identifier(revoked)), getUndefined(context)),
        ),
        leaf(
          apply("Assert", [boolean(false), string("tla-ts can't tell which function this calls")]),
        ),
      ),
    );
  }
  if (isOwnValuesRead(expression, context)) {
    return readOwnValues(expression, path, context, frame, continueWith);
  }
  if (isObjectChange(expression, context) && heapSymbol !== undefined) {
    const translated = translateObjectChange(expression, path.scope, context);
    const name = context.names.getFresh(translated.isFallible ? "change" : "heap");
    // Each change gives the object it changes, but Reflect.construct, and Reflect.defineProperty,
    // which gives whether it defined the key.
    const target = expression.arguments.at(0);
    const value =
      expression.expression.name.text === "construct" || target === undefined
        ? undefined
        : isReflectDefinition(expression)
          ? field(identifier(name), "value")
          : translateObjectValue(target, path.scope, context);
    if (isDescriptorRead(expression, context) && "values" in translated) {
      return readDescriptor(expression, translated.values, path, context, frame, continueWith);
    }
    if (isDescriptorsRead(expression, context) && "values" in translated) {
      return readDescriptors(expression, translated.values, path, context, frame, continueWith);
    }
    if (!translated.isFallible) {
      return bindOnce(
        path,
        name,
        translated.change,
        continueWith(withHeap(identifier(name)), value),
      );
    }
    const after = withHeap(field(identifier(name), "heap"));
    return bindOnce(
      path,
      name,
      translated.change,
      ifThenElse(
        field(identifier(name), "isDone"),
        continueWith(after, value),
        ifThenElse(
          field(identifier(name), "isRangeError"),
          throwError("RangeError", after, expression, context, frame),
          throwTypeError(after, expression, context, frame),
        ),
      ),
    );
  }
  const called = getCalledMethod(expression.expression, context);
  if (isMethodCall(expression) && called === undefined) {
    const receiver = expression.expression.expression;
    const method = expression.expression.name.text;
    const isConsole = receiver.getText() === "console";
    if (isConsole && method === "log") {
      const values = translateArguments(expression.arguments);
      const value = values.length === 1 ? values[0] : tuple(values);
      return and([leaf(apply("PrintT", [value])), continueWith(path)]);
    }
    if (isConsole && method === "assert") {
      const values = translateArguments(expression.arguments);
      const message = values[1] ?? string("Assertion failed");
      return and([leaf(apply("Assert", [values[0], message])), continueWith(path)]);
    }
    const kind = getKind(receiver, context);
    if (
      MUTATING_METHODS.has(method) &&
      kind !== "other" &&
      (kind === "sequence" || !SEQUENCE_UPDATES.has(method))
    ) {
      const changed = continueWith(
        assign(receiver, path, context, (current) => {
          const value = getUpdatedValue(current, kind, expression, path.scope, context);
          if (value === undefined) {
            throw new TlaTypeScriptError(`Unsupported method: ${method}`, expression);
          }
          return value;
        }),
      );
      const updated = guardReceiver(receiver, changed);
      const key = expression.arguments.at(0);
      // A weak collection throws a TypeError on a symbol that Symbol.for registered.
      if (
        getCollection(receiver, context)?.startsWith("Weak") !== true ||
        (method !== "set" && method !== "add") ||
        key === undefined ||
        context.heap === undefined
      ) {
        return updated;
      }
      return ifThenElse(
        useJavaScript(
          "IsRegisteredSymbol",
          [getHeap(path.scope, expression, context), translateExpression(key, path.scope, context)],
          context,
        ),
        throwTypeError(path, expression, context, frame),
        updated,
      );
    }
  }
  const misreceived = getMisreceivedCall(expression, context);
  if (misreceived !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const prototype = `${misreceived.collection}.prototype` as const;
    const method = `${prototype}.${misreceived.method}` as const;
    return ifThenElse(
      apply("/\\", [
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue(prototype, expression, context),
            string(misreceived.method),
            string(method),
          ],
          context,
        ),
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue(method, expression, context),
            string("call"),
            string("Function.prototype.call"),
          ],
          context,
        ),
      ]),
      throwTypeError(path, expression, context, frame),
      leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't call ${method} where a script replaced it`),
        ]),
      ),
    );
  }
  const callee = called?.method ?? getCallback(expression.expression, path, context);
  const bound = callee === undefined ? getBound(expression.expression, context) : undefined;
  if (bound !== undefined && !bound.isSteady) {
    throw new TlaTypeScriptError(
      `Unsupported call: ${expression.expression.getText()}`,
      expression,
    );
  }
  if (bound !== undefined && !frame.inlining.has(bound.target)) {
    return inlineBody(
      expression,
      bound.target,
      [...bound.arguments, ...expression.arguments],
      ts.isArrowFunction(bound.target)
        ? undefined
        : {
            value:
              bound.receiver === undefined
                ? getUndefined(context)
                : translateExpression(bound.receiver, path.scope, context),
            method: bound.target,
          },
      path,
      context,
      frame,
      continueWith,
    );
  }
  const dispatched =
    callee === undefined ? getDispatched(expression, path.scope.functions, context) : undefined;
  if (dispatched !== undefined) {
    const target = getCast(expression.expression);
    const value = translateExpression(target, path.scope, context);
    const receiver =
      ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
        ? translateObjectValue(target.expression, path.scope, context)
        : getUndefined(context);
    if (dispatched.some(isAnyGenerator)) rejectGeneratorUse(expression, context);
    return dispatched.reduceRight(
      (otherwise, candidate) => {
        const candidateValue = getCandidateValue(candidate, context);
        if (candidateValue === undefined || frame.inlining.has(candidate)) return otherwise;
        const candidateReceiver = ts.isArrowFunction(candidate)
          ? undefined
          : { value: receiver, method: candidate };
        return ifThenElse(
          apply("=", [value, candidateValue]),
          !isAnyGenerator(candidate) && !isAsyncFunction(candidate)
            ? inlineBody(
                expression,
                candidate,
                expression.arguments,
                candidateReceiver,
                path,
                context,
                frame,
                continueWith,
              )
            : isAnyGenerator(candidate)
              ? makeGenerator(
                  expression,
                  candidate,
                  expression.arguments,
                  candidateReceiver,
                  path,
                  context,
                  frame,
                  continueWith,
                )
              : translateAsyncCall(
                  expression,
                  candidate,
                  candidateReceiver,
                  path,
                  context,
                  frame,
                  continueWith,
                ),
          otherwise,
        );
      },
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which function this call runs"),
        ]),
      ),
    );
  }
  if (callee?.body === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  const call = inlineBody(
    expression,
    callee,
    expression.arguments,
    getReceiver(path.scope, context, called),
    path,
    context,
    frame,
    continueWith,
  );
  return called === undefined
    ? call
    : ifThenElse(
        translateHoldsMethod(called, path.scope, context),
        call,
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't tell which method this call runs"),
          ]),
        ),
      );
};

export const getCallback = (node: ts.Expression, path: Path, context: Context) => {
  const symbol = getSymbol(skipCasts(node), context.checker);
  const assigned = symbol && path.scope.functions.get(symbol);
  if (assigned === undefined) return getCallee(node, context);
  return isPlain(assigned) ? assigned : undefined;
};

// The generator that a callee names: one that a variable holds, or one declared elsewhere.
const getGeneratorCallee = (node: ts.Expression, path: Path, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const assigned = symbol && path.scope.functions.get(symbol);
  return assigned !== undefined && isAnyGenerator(assigned)
    ? assigned
    : getFunctionOfKind(node, context, isAnyGenerator);
};

// An async function that a callee names, other than a method, which a call runs only where the
// object still holds it.
export const getAsyncCallee = (node: ts.Expression, path: Path, context: Context) => {
  // A namespace's function, which TypeScript doesn't let a script replace.
  const isNamespaced =
    ts.isPropertyAccessExpression(node) &&
    ((getSymbol(node.expression, context.checker)?.flags ?? 0) & ts.SymbolFlags.Namespace) !== 0;
  if (
    !isNamespaced &&
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
  ) {
    return undefined;
  }
  const symbol = getSymbol(node, context.checker);
  const assigned = symbol && path.scope.functions.get(symbol);
  return assigned !== undefined && isAsyncFunction(assigned)
    ? assigned
    : getFunctionOfKind(node, context, isAsyncFunction);
};

// Binds a call's arguments to its callee's parameters. A parameter's default makes its objects
// whether or not the call passes the parameter, as making an object that nothing reads can't be
// seen.
export const bindCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (bound: Bound, path: Path) => Formula,
): Formula => {
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", node);
  }
  const parameters = getParameters(callee);
  // A parameter's array pattern takes its values from a generator before the body runs.
  const destructured = parameters.flatMap((parameter, position) => {
    const argument = argumentNodes.at(position);
    const source =
      argument === undefined || isUndefinedLiteral(argument, context)
        ? parameter.initializer
        : argument;
    return ts.isArrayBindingPattern(parameter.name) &&
      source !== undefined &&
      !path.scope.results.has(source) &&
      isGeneratorType(source, context)
      ? [{ pattern: parameter.name, source }]
      : [];
  })[0];
  const taken =
    destructured &&
    takeFromGenerator(
      destructured.pattern,
      destructured.source,
      argumentNodes,
      path,
      context,
      frame,
      (after, values) =>
        bindCall(
          node,
          callee,
          argumentNodes,
          receiver,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, [destructured.source, values]]),
            },
          },
          context,
          frame,
          continueWith,
        ),
    );
  if (taken !== undefined) return taken;
  // A first parameter's array pattern that takes its default, an object, from the object's iterator,
  // which it does before the body runs and after the arguments, which are all undefined. A generator
  // binds its parameters as the call makes it, and an async function rejects rather than throws.
  const first = parameters.at(0);
  const initializer = first?.initializer;
  const iterated =
    first !== undefined &&
    initializer !== undefined &&
    ts.isArrayBindingPattern(first.name) &&
    isIteratedPattern(first.name, context) &&
    !path.scope.results.has(initializer) &&
    argumentNodes.every((argument) => isUndefinedLiteral(argument, context)) &&
    !isAsyncFunction(callee)
      ? takeFromIterator(
          first.name,
          translateExpression(initializer, path.scope, context),
          path,
          context,
          frame,
          (after, values) =>
            bindCall(
              node,
              callee,
              argumentNodes,
              receiver,
              {
                ...after,
                scope: {
                  ...after.scope,
                  results: new Map([...after.scope.results, [initializer, values]]),
                },
              },
              context,
              frame,
              continueWith,
            ),
        )
      : undefined;
  if (iterated !== undefined) return iterated;
  const defaulted = runCertainDefault(
    parameters.map((parameter) => parameter.name),
    parameters.flatMap((parameter, position) =>
      getKnownDefaults(parameter.name, argumentNodes.at(position), parameter.initializer, context),
    ),
    [...argumentNodes, ...parameters.flatMap((parameter) => parameter.initializer ?? [])],
    path,
    context,
    frame,
    (after) => bindCall(node, callee, argumentNodes, receiver, after, context, frame, continueWith),
  );
  if (defaulted !== undefined) return defaulted;
  const defaults = parameters
    .flatMap((parameter) => getAllocated(parameter, context))
    .filter((allocation) => !path.scope.allocated.has(allocation));
  if (defaults.length > 0) {
    return allocateAll(defaults, path, context, (allocated) =>
      bindCall(node, callee, argumentNodes, receiver, allocated, context, frame, continueWith),
    );
  }
  // A first parameter's pattern runs the getters of the properties it reads, after the call
  // evaluates its only argument, or the object literal that its default makes where the call
  // passes none.
  const only = argumentNodes.length === 1 ? argumentNodes[0] : undefined;
  const defaultObject =
    argumentNodes.length === 0 &&
    first?.initializer !== undefined &&
    ts.isObjectLiteralExpression(skipCasts(first.initializer))
      ? first.initializer
      : undefined;
  const source = only ?? defaultObject;
  if (
    first !== undefined &&
    source !== undefined &&
    !ts.isSpreadElement(source) &&
    isGetterPattern(first.name, path, context)
  ) {
    const name = context.names.getFresh("argument");
    return bindOnce(
      path,
      name,
      translateExpression(source, path.scope, context),
      readPatternGetters(first.name, identifier(name), path, context, frame, (after) =>
        bindCall(
          node,
          callee,
          argumentNodes,
          receiver,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, [source, identifier(name)]]),
            },
          },
          context,
          frame,
          continueWith,
        ),
      ),
    );
  }
  // A function that the heap holds passes as an object where the parameter takes one, not a
  // function.
  const callbacks = parameters.flatMap((parameter, position): [ts.Symbol, FunctionNode][] => {
    const argument = argumentNodes.at(position);
    const isObject =
      argument !== undefined &&
      getHeapClass(argument, context) !== undefined &&
      context.checker.getTypeAtLocation(parameter).getCallSignatures().length === 0;
    // A parameter that the call passes nothing takes the function that its default writes.
    const callback =
      argument === undefined
        ? argumentNodes.some(ts.isSpreadElement)
          ? undefined
          : getAnyFunction(parameter.initializer)
        : isObject
          ? undefined
          : (getCallback(argument, path, context) ?? getAsyncCallee(argument, path, context));
    const symbol = getSymbol(parameter.name, context.checker);
    return callback?.body !== undefined && symbol !== undefined ? [[symbol, callback]] : [];
  });
  // A function that no parameter takes evaluates to an object that nothing reads, unless the
  // callee reads its arguments.
  const isArgumentsRead =
    findNodes(
      callee,
      (inner): inner is ts.Identifier => ts.isIdentifier(inner) && inner.text === "arguments",
    ).length > 0;
  const isValue = (position: number) => {
    const parameter = parameters.at(position);
    const argument = argumentNodes.at(position);
    return parameter === undefined
      ? isArgumentsRead ||
          argument === undefined ||
          !(ts.isFunctionExpression(argument) || ts.isArrowFunction(argument))
      : !callbacks.some((entry) => entry[0] === getSymbol(parameter.name, context.checker));
  };
  const passed = argumentNodes.filter((_, position) => isValue(position));
  const translated = passed.map((argument) => translateExpression(argument, path.scope, context));
  const values = shareArguments(translated, context);
  const evaluateArguments = (rest: Formula) => values.evaluate(rest, leaf(boolean(false)));
  if (
    isArgumentsNamed(callee, context) &&
    context.heap !== undefined &&
    (callbacks.length > 0 || argumentNodes.some(ts.isSpreadElement))
  ) {
    throw new TlaTypeScriptError("Unsupported arguments object", node);
  }
  // Parameters' defaults may read the arguments object, which the call makes before it binds them.
  const made = allocateArguments(
    callee,
    values.shared,
    node,
    { definitions: [], scope: path.scope },
    context,
  );
  const valueParameters = parameters.filter((_, position) => isValue(position));
  const bound = bindValues(
    valueParameters,
    values.shared,
    ts.isCallExpression(node)
      ? bindFactory(
          getSymbol(node.expression, context.checker)?.valueDeclaration,
          made.scope,
          context,
        )
      : made.scope,
    context,
  );
  if (!passed.some(ts.isSpreadElement)) {
    valueParameters.forEach((parameter, position) => {
      const argument = passed.at(position);
      const symbol = ts.isIdentifier(parameter.name)
        ? getSymbol(parameter.name, context.checker)
        : undefined;
      const binding = symbol && bound.scope.bindings.get(symbol);
      if (
        argument !== undefined &&
        parameter.dotDotDotToken === undefined &&
        parameter.initializer === undefined &&
        binding?.kind === "Identifier"
      ) {
        context.passed.set(binding.name, { node: argument, value: translated[position] });
      }
    });
  }
  // What the getters of a parameter's pattern gave belongs to this call, not to a later one.
  const getUnread = (current: Scope) =>
    new Map(
      [...(current.read ?? [])].filter(
        (entry) => ts.findAncestor(entry[0], (ancestor) => ancestor === callee) === undefined,
      ),
    );
  const scope = {
    ...bound.scope,
    read: getUnread(bound.scope),
    functions: new Map([...bound.scope.functions, ...callbacks]),
    receiver,
    arrowReceivers: getArrowReceivers(callbacks, path.scope),
  };
  // A parameter is a local binding, which the body may assign as it does a let.
  const changeable = {
    ...path,
    scope: { ...path.scope, read: getUnread(path.scope) },
    mutable: new Set([
      ...path.mutable,
      ...parameters.flatMap((parameter, position) => {
        const symbol = ts.isIdentifier(parameter.name)
          ? getSymbol(parameter.name, context.checker)
          : undefined;
        return symbol !== undefined && isValue(position) ? [symbol] : [];
      }),
    ]),
  };
  return evaluateArguments(
    continueWith({ definitions: [...made.definitions, ...bound.definitions], scope }, changeable),
  );
};

// The references to a function's arguments object, in its parameters' defaults and its body.
export const getArgumentsReads = (callee: FunctionNode, context: Context) =>
  findNodes(
    callee,
    (inner): inner is ts.Identifier => getArgumentsOwner(inner, context.checker) === callee,
  );

const isArgumentsNamed = (callee: FunctionNode, context: Context) =>
  getArgumentsReads(callee, context).length > 0;

// The arguments object of a call to a function whose body names it, which the scope holds under
// the body.
// A read of an arguments object's length or of an element, which leaves the object where it is.
export const isArgumentsRead = (read: ts.Identifier, context: Context) => {
  const access = read.parent;
  const outer = access.parent;
  return (
    ((ts.isPropertyAccessExpression(access) && access.name.text === "length") ||
      (ts.isElementAccessExpression(access) &&
        access.expression === read &&
        isNumberLike(access.argumentExpression, context))) &&
    getWritten(outer) !== access &&
    !ts.isDeleteExpression(outer) &&
    !(ts.isCallExpression(outer) && outer.expression === access) &&
    !(
      (ts.isPrefixUnaryExpression(outer) || ts.isPostfixUnaryExpression(outer)) &&
      INCREMENT_OPERATORS.has(outer.operator)
    )
  );
};

const hasStrictDirective = (statements: readonly ts.Statement[]) =>
  statements.some(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.getText().slice(1, -1) === "use strict",
  );

// Code that runs in strict mode wherever it runs: in a class, under a "use strict" directive, or in
// a module.
const isStrictCode = (node: ts.Node): boolean =>
  ts.findAncestor(
    node,
    (ancestor) =>
      ts.isClassLike(ancestor) ||
      (ts.isFunctionLike(ancestor) &&
        "body" in ancestor &&
        ancestor.body !== undefined &&
        ts.isBlock(ancestor.body) &&
        hasStrictDirective(ancestor.body.statements)) ||
      (ts.isSourceFile(ancestor) &&
        (hasStrictDirective(ancestor.statements) || isModuleFile(ancestor))),
  ) !== undefined;

// Outside strict mode, a function with simple parameters has an arguments object that maps them,
// so that writing one changes the other, which tla-ts's arguments object doesn't follow. Only a
// parameter that changes where the object's elements are read, or a parameter read where the
// object changes or leaves the function, shows the difference.
const rejectMappedArguments = (callee: FunctionNode, context: Context) => {
  const parameters = callee.parameters.filter(
    (parameter) => !(ts.isIdentifier(parameter.name) && parameter.name.text === "this"),
  );
  if (
    isStrictCode(callee) ||
    parameters.length === 0 ||
    parameters.some(
      (parameter) =>
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer !== undefined ||
        parameter.dotDotDotToken !== undefined,
    )
  ) {
    return;
  }
  const names = new Set(parameters.map((parameter) => parameter.name));
  const symbols = new Set(
    parameters.map((parameter) => getSymbol(parameter.name, context.checker)),
  );
  const isParameter = (node: ts.Node) =>
    ts.isIdentifier(node) && !names.has(node) && symbols.has(getSymbol(node, context.checker));
  const isParameterWritten =
    findNodes(callee, (node): node is ts.Expression => {
      const written = getWritten(node);
      return written !== undefined && getWrittenRoots(written).some(isParameter);
    }).length > 0;
  const isParameterRead =
    findNodes(callee, (node): node is ts.Identifier => isParameter(node)).length > 0;
  const reads = getArgumentsReads(callee, context);
  const isLengthRead = (read: ts.Identifier) =>
    isArgumentsRead(read, context) && ts.isPropertyAccessExpression(read.parent);
  if (
    (isParameterWritten && !reads.every(isLengthRead)) ||
    (isParameterRead && !reads.every((read) => isArgumentsRead(read, context)))
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't follow an arguments object that maps its function's parameters outside strict mode",
      reads[0],
    );
  }
};

export const allocateArguments = (
  callee: FunctionNode,
  values: readonly Expression[],
  node: ts.Node,
  bound: Bound,
  context: Context,
): Bound => {
  const heapSymbol = context.heap;
  const body = callee.body;
  if (heapSymbol === undefined || body === undefined || !isArgumentsNamed(callee, context)) {
    return bound;
  }
  rejectMappedArguments(callee, context);
  const heap = context.names.getFresh("heap");
  const made = useJavaScript(
    "ArgumentsObject",
    [tuple([...values]), translateBuiltInValue("get Function.prototype.arguments", node, context)],
    context,
  );
  return {
    definitions: [
      ...bound.definitions,
      define(
        heap,
        [],
        useJavaScript("Allocate", [getHeap(bound.scope, node, context), made], context),
      ),
    ],
    scope: {
      ...bound.scope,
      bindings: new Map([...bound.scope.bindings, [heapSymbol, identifier(heap)]]),
      allocated: new Map([
        ...bound.scope.allocated,
        [body, useJavaScript("Allocated", [identifier(heap)], context)],
      ]),
    },
  };
};

// Runs a function's body with the values that a call passes it, for a call that JavaScript makes,
// such as a promise's reaction or a proxy's trap.
export const inlineValues = (
  callee: FunctionNode,
  values: Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", callee);
  }
  const bound = bindValues(getParameters(callee), values, path.scope, context);
  const back = (after: Path, result?: Expression) =>
    continueWith({ ...after, scope: { ...after.scope, previous: path.scope.previous } }, result);
  return letIn(
    bound.definitions,
    translateStatements(
      getBody(callee),
      { ...path, scope: { ...bound.scope, receiver } },
      context,
      {
        next: back,
        exit: back,
        breakTo: undefined,
        continueTo: undefined,
        throwTo: frame.throwTo,
        yieldTo: undefined,
        awaitTo: undefined,
        inlining: new Set([...frame.inlining, callee]),
      },
    ),
  );
};

export const getBody = (callee: FunctionNode) => {
  const calleeBody = callee.body;
  if (calleeBody === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  return ts.isBlock(calleeBody)
    ? calleeBody.statements
    : [ts.factory.createReturnStatement(calleeBody)];
};

// Runs a function's body as statements, for a call or a new that a statement makes.
// A call to a function that changes state from inside itself, as a call of a recursive operator.
// The operator takes the arguments, a method's this, and the values that the function changes
// outside itself, and,
// as a loop's does, gives how the body ended, its value or what it threw, the message of a throw
// that nothing catches, and the changed values. The first such call defines it, and the calls
// inside its body call it.
const translateSelfCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
  argumentValues?: Expression[],
): Formula => {
  const parameters = getParameters(callee);
  const body = callee.body;
  // A parameter that takes a function runs the one that the call passes, or that its default
  // writes, which the recursive operator holds rather than takes.
  const functions = parameters.map((parameter, position) => {
    if (context.checker.getTypeAtLocation(parameter.name).getCallSignatures().length === 0) {
      return undefined;
    }
    const argument = argumentNodes.at(position);
    return argument === undefined
      ? position < (argumentValues ?? []).length
        ? undefined
        : getAnyFunction(parameter.initializer)
      : getCallback(argument, path, context);
  });
  const defined = context.selfCalls.get(callee);
  if (
    body === undefined ||
    isAnyGenerator(callee) ||
    isAsyncFunction(callee) ||
    argumentNodes.length > parameters.length ||
    argumentNodes.some(ts.isSpreadElement) ||
    findNodes(
      callee,
      (inner): inner is ts.Identifier => getArgumentsOwner(inner, context.checker) === callee,
    ).length > 0 ||
    parameters.some(
      (parameter, position) =>
        !ts.isIdentifier(parameter.name) ||
        parameter.dotDotDotToken !== undefined ||
        (context.checker.getTypeAtLocation(parameter.name).getCallSignatures().length > 0
          ? functions[position]?.body === undefined ||
            (defined !== undefined && defined.functions[position] !== functions[position])
          : parameter.initializer !== undefined && !isLiteral(parameter.initializer)),
    )
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't run this call of a function from inside itself",
      node,
    );
  }
  const isOuter = (symbol: ts.Symbol) =>
    !(symbol.declarations ?? []).some(
      (declaration) =>
        ts.findAncestor(declaration, (ancestor) => ancestor === callee) !== undefined,
    );
  const isMethod = receiver !== undefined && !ts.isArrowFunction(callee);
  const selfCall = defined ?? {
    name: context.names.getFresh("Call"),
    changed: getChanged(callee, path, context).filter(isOuter),
    functions,
  };
  const valueParameters = parameters.filter((_, position) => functions[position] === undefined);
  const changed = selfCall.changed;
  const getValues = (current: Path) =>
    changed.map((symbol) => current.scope.bindings.get(symbol) ?? getUndefined(context));
  const bindChanged = (current: Path, values: Expression[]): Path => ({
    ...current,
    scope: {
      ...current.scope,
      bindings: new Map([
        ...current.scope.bindings,
        ...changed.map((symbol, position): [ts.Symbol, Expression] => [symbol, values[position]]),
      ]),
    },
  });
  const values = shareArguments(
    argumentValues?.filter((_, position) => functions[position] === undefined) ??
      argumentNodes
        .filter((_, position) => functions[position] === undefined)
        .map((argument) => translateExpression(argument, path.scope, context)),
    context,
  );
  const result = context.names.getFresh("result");
  const kind = index(identifier(result), [number(1)]);
  const value = index(identifier(result), [number(2)]);
  const after = {
    ...bindChanged(
      path,
      changed.map((_, position) => index(identifier(result), [number(position + 4)])),
    ),
    isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
  };
  const throwTo = frame.throwTo;
  const ended = ifThenElse(
    apply("=", [kind, string("throw")]),
    throwTo === undefined
      ? leaf(
          locate(
            apply("Assert", [boolean(false), index(identifier(result), [number(3)])]),
            getLocation(node),
          ),
        )
      : throwTo(after, {
          value,
          uncaught: apply("Assert", [boolean(false), index(identifier(result), [number(3)])]),
        }),
    continueWith(
      after,
      ifExpression(apply("=", [kind, string("returnValue")]), value, getUndefined(context)),
    ),
  );
  const called = values.evaluate(
    bindOnce(
      path,
      result,
      call(selfCall.name, [
        ...valueParameters.map(
          (_, position) => values.shared.at(position) ?? getUndefined(context),
        ),
        ...(isMethod ? [receiver.value] : []),
        ...getValues(path),
      ]),
      ended,
    ),
    leaf(boolean(false)),
  );
  if (defined !== undefined) return called;
  const parameterNames = [
    ...valueParameters.map((parameter) => context.names.getFresh(parameter.name.getText())),
    ...(isMethod ? [context.names.getFresh("this")] : []),
  ];
  const changedNames = changed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const isInside = (node: ts.Node) =>
    ts.findAncestor(node, (ancestor) => ancestor === callee) !== undefined;
  const outer = bindChanged(
    path,
    changedNames.map((name) => identifier(name)),
  );
  const bound = bindValues(
    valueParameters,
    parameterNames.map((name) => identifier(name)),
    {
      ...outer.scope,
      // What the call's own statements evaluated belongs to that call, not this one.
      results: new Map([...outer.scope.results].filter((entry) => !isInside(entry[0]))),
      allocated: new Map([...outer.scope.allocated].filter((entry) => !isInside(entry[0]))),
      functions: new Map([
        ...outer.scope.functions,
        ...parameters.flatMap((parameter, position): [ts.Symbol, FunctionNode][] => {
          const symbol = getSymbol(parameter.name, context.checker);
          const called = functions[position];
          return symbol === undefined || called === undefined ? [] : [[symbol, called]];
        }),
      ]),
      receiver: isMethod
        ? { ...receiver, value: identifier(parameterNames[valueParameters.length]) }
        : receiver,
    },
    context,
  );
  const inner: Path = {
    ...outer,
    scope: bound.scope,
    mutable: new Set([
      ...path.mutable,
      ...valueParameters.flatMap((parameter) => getSymbol(parameter.name, context.checker) ?? []),
    ]),
    isLooping: true,
    isLast: false,
    generators: new Map(),
    tasks: undefined,
  };
  const end = (current: Path, ending: string, ended: Expression, message: Expression) =>
    leaf(tuple([string(ending), ended, message, ...getValues(current)]));
  const carried = tuple([
    ...parameterNames.map((name) => identifier(name)),
    ...changedNames.map((name) => identifier(name)),
  ]);
  context.selfCalls.set(callee, selfCall);
  const translated = translateStatements(getBody(callee), inner, context, {
    next: (current) => end(current, "return", getUndefined(context), string("")),
    exit: (current, returned) =>
      returned === undefined
        ? end(current, "return", getUndefined(context), string(""))
        : end(current, "returnValue", returned, string("")),
    breakTo: undefined,
    continueTo: undefined,
    // Where nothing can catch what the body throws, it stops there, as a loop's body does.
    throwTo:
      frame.throwTo === undefined && ts.forEachChild(body, hasTry) !== true
        ? undefined
        : (current, thrown) =>
            end(
              current,
              "throw",
              thrown.value,
              thrown.uncaught.kind === "Apply" && thrown.uncaught.operator === "Assert"
                ? (thrown.uncaught.args[1] ?? string(""))
                : string(node.getText()),
            ),
    yieldTo: undefined,
    awaitTo: undefined,
    inlining: new Set([...frame.inlining, callee]),
  });
  context.selfCalls.delete(callee);
  const operator: OperatorDefinition = {
    ...define(
      selfCall.name,
      [...parameterNames, ...changedNames].map((name) => ({ name, arity: 0 })),
      // Each call evaluates what it's given, as a loop's iteration does.
      render(
        ifThenElse(
          apply("=", [carried, carried]),
          letIn(bound.definitions, translated),
          leaf(boolean(false)),
        ),
      ),
    ),
    isRecursive: true,
  };
  return letIn([operator], called);
};

// An exported function is a model's action, which no action calls. A script, which keeps its objects
// in a heap, has no actions.
const isAction = (callee: FunctionNode, context: Context) =>
  context.heap === undefined &&
  (ts.getCombinedModifierFlags(ts.isVariableDeclaration(callee.parent) ? callee.parent : callee) &
    ts.ModifierFlags.Export) !==
    0;

export const inlineBody = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  // A call that reaches a local function that it's already inside runs the function's definition.
  (frame.inlining.has(callee) || context.inProgress.has(callee)) &&
  ts.isCallExpression(node) &&
  argumentNodes === node.arguments &&
  isLiftable(callee, context)
    ? continueWith(path, translateLiftedCall(callee, node, path.scope, context))
    : frame.inlining.has(callee) && !isAction(callee, context)
      ? translateSelfCall(node, callee, argumentNodes, receiver, path, context, frame, continueWith)
      : bindCall(node, callee, argumentNodes, receiver, path, context, frame, (bound, inner) => {
          // What the call evaluated or made of the function's own code, such as a default that it
          // skipped or an object that a default made, belongs to that call, not to a later one.
          const isOwn = (entry: [ts.Node, Expression]) =>
            ts.findAncestor(entry[0], (ancestor) => ancestor === callee) !== undefined;
          const getCaller = (current: Path): Path => ({
            ...current,
            scope: {
              ...current.scope,
              previous: inner.scope.previous,
              results: new Map([...current.scope.results].filter((entry) => !isOwn(entry))),
              allocated: new Map([...current.scope.allocated].filter((entry) => !isOwn(entry))),
            },
          });
          return translateJoined(node, getCaller(inner), context, continueWith, (next) => {
            const afterCall = (after: Path, value?: Expression) => next(getCaller(after), value);
            const bodyFrame = {
              next: afterCall,
              exit: afterCall,
              breakTo: undefined,
              continueTo: undefined,
              throwTo: frame.throwTo,
              yieldTo: undefined,
              awaitTo: undefined,
              inlining: new Set([...frame.inlining, callee]),
            };
            return letIn(
              bound.definitions,
              throwOnDestructured(
                bound.scope,
                inner,
                context,
                bodyFrame,
                forceHeap(
                  inner.scope,
                  bound.scope,
                  translateStatements(
                    getBody(callee),
                    { ...inner, scope: { ...bound.scope, destructured: undefined } },
                    context,
                    bodyFrame,
                  ),
                  leaf(boolean(false)),
                  context,
                ),
              ),
            );
          });
        });

// The path of the code that resumed a function's body, with what the body changed outside itself.
export const leaveBody = (
  current: Path,
  caller: Path,
  changed: readonly ts.Symbol[],
  isOuter: (symbol: ts.Symbol) => boolean,
): Path => ({
  ...caller,
  isAssigned: current.isAssigned,
  tasks: current.tasks,
  generators: current.generators,
  scope: {
    ...caller.scope,
    bindings: new Map([
      ...caller.scope.bindings,
      ...changed.flatMap((symbol): [ts.Symbol, Expression][] => {
        const value = current.scope.bindings.get(symbol);
        return isOuter(symbol) && value !== undefined ? [[symbol, value]] : [];
      }),
    ]),
  },
});

// The path where a function's body resumes, with the state outside it as the resuming code sees.
export const enterBody = (
  resumer: Path,
  suspended: Path,
  isOuter: (symbol: ts.Symbol) => boolean,
): Path => ({
  ...suspended,
  isAssigned: resumer.isAssigned,
  isLast: resumer.isLast,
  mutable: new Set([...suspended.mutable, ...resumer.mutable]),
  generators: resumer.generators,
  tasks: resumer.tasks,
  scope: {
    ...suspended.scope,
    bindings: new Map([
      ...suspended.scope.bindings,
      ...[...resumer.scope.bindings].filter((entry) => isOuter(entry[0])),
    ]),
  },
});

// Makes the generator object that a call to a generator gives, whose body runs only as its
// next, return, and throw methods resume it. A path tracks where each generator's body suspended,
// as the rest of the body's statements, so a statement that resumes it runs them there.
export const makeGenerator = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  bindCall(node, callee, argumentNodes, receiver, path, context, frame, (bound, inner) => {
    const name = context.names.getFresh("generator");
    const heapSymbol = context.heap;
    const ref =
      heapSymbol === undefined
        ? record("Record", [{ name: "generator", value: string(name) }])
        : useJavaScript("Allocated", [identifier(name)], context);
    const isAsync = isAsyncGenerator(callee);
    // An async generator's body changes the heap as it awaits, which makes promises.
    const changed = isAsync
      ? [
          ...new Set([
            ...getChanged(callee, inner, context),
            ...(heapSymbol === undefined ? [] : [heapSymbol]),
          ]),
        ]
      : getChanged(callee, inner, context);
    const isOuter = (symbol: ts.Symbol) =>
      !(symbol.declarations ?? []).some(
        (declaration) =>
          ts.findAncestor(declaration, (ancestor) => ancestor === callee) !== undefined,
      );
    // A job that resumes an async generator's body runs once the calls around it return.
    const captured = isAsync ? getLocalCaptures(callee, context) : new Set<ts.Symbol>();
    const isResumedOuter = (symbol: ts.Symbol) => isOuter(symbol) && !captured.has(symbol);
    const getCaller = (current: Path) => {
      const caller = current.generators.get(name)?.caller;
      if (caller === undefined) throw new TlaTypeScriptError("Unsupported generator", node);
      return caller;
    };
    const leave = (
      current: Path,
      resume: Suspension["resume"],
      isGuarded = false,
      abort?: Suspension["abort"],
    ): Path => ({
      ...leaveBody(current, getCaller(current).path, changed, isOuter),
      generators: new Map([
        ...current.generators,
        [
          name,
          {
            ref,
            generator: callee,
            resume,
            isStarted: true,
            isGuarded,
            abort,
            isAsync,
            queue: current.generators.get(name)?.queue ?? [],
          },
        ],
      ]),
    });
    const enter = (resumer: Path, suspended: Path) => enterBody(resumer, suspended, isResumedOuter);
    const finish = (current: Path, value?: Expression) =>
      getCaller(current).step(leave(current, undefined), value, true);
    // An async generator's body suspends at an await, which leaves the generator running, and a
    // job resumes it, which the request's promise then leaves to.
    const suspend = (
      current: Path,
      value: Expression,
      operand: ts.Expression | undefined,
      resume: (resumed: Path, settled: Expression, isRejected: boolean) => Formula,
    ) => {
      const caller = getCaller(current);
      const request = caller.request;
      const suspendTo = caller.suspend;
      if (request === undefined || suspendTo === undefined) {
        throw new TlaTypeScriptError("Unsupported await", node);
      }
      return awaitIn(
        leaveBody(current, caller.path, changed, isOuter),
        node,
        value,
        operand,
        context,
        (resumer, settled, isRejected, onReturn) => {
          const entered = enter(resumer, current);
          const suspension = entered.generators.get(name);
          if (suspension === undefined) throw new TlaTypeScriptError("Unsupported await", node);
          return resume(
            {
              ...entered,
              generators: new Map([
                ...entered.generators,
                [
                  name,
                  {
                    ...suspension,
                    caller: getAsyncCaller(node, name, resumer, request, context, onReturn),
                  },
                ],
              ]),
            },
            settled,
            isRejected,
          );
        },
        suspendTo,
      );
    };
    const bodyFrame: Frame = {
      next: finish,
      // An async generator's return awaits its value.
      exit: (current, value) => {
        if (!isAsync || value === undefined) return finish(current, value);
        if (bound.scope.isCatching) {
          throw new TlaTypeScriptError(
            "tla-ts can't return a value inside try in an async generator",
            callee,
          );
        }
        return suspend(current, value, undefined, (resumed, settled, isRejected) => {
          if (!isRejected) return finish(resumed, settled);
          const caller = getCaller(resumed);
          const left = leave(resumed, undefined);
          const uncaught = apply("Assert", [boolean(false), string("An async generator threw")]);
          return caller.throwTo === undefined
            ? leaf(uncaught)
            : caller.throwTo(left, { value: settled, uncaught });
        });
      },
      breakTo: undefined,
      continueTo: undefined,
      throwTo: (current, thrown) => {
        const caller = getCaller(current);
        const left = leave(current, undefined);
        return caller.throwTo === undefined ? leaf(thrown.uncaught) : caller.throwTo(left, thrown);
      },
      // An async generator's yield awaits its value.
      yieldTo: (current, value, rest, throwRest, mode) => {
        const returnRest = isAsync ? undefined : mode?.returnRest;
        const step = (resumed: Path, settled: Expression | undefined) =>
          getCaller(resumed).step(
            leave(
              resumed,
              (resumer) => rest(enter(resumer, resumed)),
              mode?.isGuarded,
              returnRest &&
                ((resumer, method, abrupt) =>
                  method === "throw"
                    ? throwRest(enter(resumer, resumed), abrupt ?? getUndefined(context))
                    : returnRest(enter(resumer, resumed), abrupt)),
            ),
            settled,
            false,
            mode?.isResult,
          );
        return isAsync && mode?.isDelegated !== true
          ? suspend(
              current,
              value ?? getUndefined(context),
              undefined,
              (resumed, settled, isRejected) =>
                isRejected ? throwRest(resumed, settled) : step(resumed, settled),
            )
          : step(current, value);
      },
      awaitTo: isAsync
        ? (current, value, operand, onFulfilled, onRejected) =>
            suspend(current, value, operand, (resumed, settled, isRejected) =>
              (isRejected ? onRejected : onFulfilled)(resumed, settled),
            )
        : undefined,
      inlining: new Set([...frame.inlining, callee]),
    };
    // The body runs for whatever next resumes it, which may catch what it throws.
    const start = {
      ...inner,
      scope: { ...bound.scope, isCatching: true, destructured: undefined },
    };
    const suspension: Suspension = {
      ref,
      generator: callee,
      resume: (resumer) =>
        translateStatements(getBody(callee), enter(resumer, start), context, bodyFrame),
      isStarted: false,
      isGuarded: false,
      isAsync,
      queue: [],
    };
    const made = { ...inner, generators: new Map([...inner.generators, [name, suspension]]) };
    // A generator's call binds its parameters, which throws before the body first runs.
    if (heapSymbol === undefined) {
      return letIn(
        bound.definitions,
        throwOnDestructured(bound.scope, inner, context, frame, continueWith(made, ref)),
      );
    }
    return letIn(
      bound.definitions,
      throwOnDestructured(
        bound.scope,
        inner,
        context,
        frame,
        bindOnce(
          inner,
          name,
          useJavaScript(
            "Allocate",
            [getHeap(bound.scope, node, context), identifier("GeneratorObject")],
            context,
          ),
          continueWith(
            {
              ...made,
              scope: {
                ...made.scope,
                bindings: new Map([...made.scope.bindings, [heapSymbol, identifier(name)]]),
              },
            },
            ref,
          ),
        ),
      ),
    );
  });

// A call of a method of Iterator.prototype that steps a generator to its end, or until its
// callback decides, then closes the generator as the method's IteratorClose does.
const translateGeneratorConsumer = (
  node: ts.CallExpression,
  consumer: NonNullable<ReturnType<typeof getGeneratorMethod>>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const method = consumer.method;
  const argument = consumer.values.at(0);
  const callback = argument && getCallback(argument, path, context);
  const isGathering = method === "toArray" || method === "from";
  if (!(isGathering && argument === undefined) && callback?.body === undefined) {
    throw new TlaTypeScriptError(
      `Give ${method} a function that tla-ts can tell`,
      argument ?? node,
    );
  }
  // A receiver that isn't an iterator throws once the method checks it or steps it.
  if (consumer.invalid !== undefined) {
    return translateHoldsIteratorPrototype(
      method,
      node,
      path,
      context,
      throwTypeError(path, node, context, frame),
    );
  }
  const receiver = translateExpression(consumer.receiver, path.scope, context);
  const close = (current: Path, finish: (after: Path) => Formula) =>
    resumeGenerator(node, receiver, "return", undefined, current, context, frame, (after) =>
      finish(after),
    );
  // A callback that throws closes the generator before the error leaves the method.
  const callbackFrame = {
    ...frame,
    throwTo: (current: Path, thrown: Thrown) =>
      close(current, (after) =>
        frame.throwTo === undefined ? leaf(thrown.uncaught) : frame.throwTo(after, thrown),
      ),
  };
  const thisArgument = method === "from" ? consumer.values.at(1) : undefined;
  const callbackReceiver =
    callback !== undefined && !ts.isArrowFunction(callback)
      ? {
          value:
            thisArgument === undefined
              ? getUndefined(context)
              : translateExpression(thisArgument, path.scope, context),
          method: callback,
        }
      : path.scope.receiver;
  const run = (
    current: Path,
    values: Expression[],
    after: (path: Path, result: Expression) => Formula,
  ) =>
    callback === undefined
      ? after(current, getUndefined(context))
      : inlineValues(
          callback,
          values,
          callbackReceiver,
          current,
          context,
          callbackFrame,
          (done, result) => {
            const name = context.names.getFresh("result");
            return bindOnce(
              done,
              name,
              result ?? getUndefined(context),
              after(done, identifier(name)),
            );
          },
        );
  const getLoop = (finish: (path: Path, value?: Expression) => Formula) => {
    const loop = (current: Path, counter: number, kept: Expression[]): Formula =>
      resumeGenerator(
        node,
        receiver,
        "next",
        undefined,
        current,
        context,
        frame,
        (stepped, value, isDone, isResult) => {
          if (isResult) {
            throw new TlaTypeScriptError(
              `tla-ts can't run ${method} on a generator that delegates with yield*`,
              node,
            );
          }
          const isReduce = method === "reduce";
          if (isDone) {
            if (isReduce && kept.length === 0) return throwTypeError(stepped, node, context, frame);
            return finish(
              stepped,
              isGathering
                ? tuple(kept)
                : method === "some"
                  ? boolean(false)
                  : method === "every"
                    ? boolean(true)
                    : isReduce
                      ? kept[0]
                      : getUndefined(context),
            );
          }
          const element = value ?? getUndefined(context);
          if (isGathering && callback === undefined) {
            return loop(stepped, counter + 1, [...kept, element]);
          }
          // reduce without an initial value takes the first element as its accumulator.
          if (isReduce && kept.length === 0) return loop(stepped, counter + 1, [element]);
          const elementName = context.names.getFresh("element");
          const bound = identifier(elementName);
          const values = isReduce ? [kept[0], bound, number(counter)] : [bound, number(counter)];
          return bindOnce(
            stepped,
            elementName,
            element,
            run(stepped, values, (after, result) => {
              const isTruthy = useJavaScript("ToBoolean", [result], context);
              const rest = loop(
                after,
                counter + 1,
                isReduce ? [result] : isGathering ? [...kept, result] : kept,
              );
              if (method === "some") {
                return ifThenElse(
                  isTruthy,
                  close(after, (closed) => finish(closed, boolean(true))),
                  rest,
                );
              }
              if (method === "every") {
                return ifThenElse(
                  isTruthy,
                  rest,
                  close(after, (closed) => finish(closed, boolean(false))),
                );
              }
              if (method === "find") {
                return ifThenElse(
                  isTruthy,
                  close(after, (closed) => finish(closed, bound)),
                  rest,
                );
              }
              return rest;
            }),
          );
        },
      );
    return loop;
  };
  const initial = method === "reduce" ? consumer.values.at(1) : undefined;
  const kept = initial === undefined ? [] : [translateExpression(initial, path.scope, context)];
  // The exits of the method leave the generator completed, so the code after it joins them.
  const consume = translateJoined(node, path, context, continueWith, (next) => {
    const exits: Path["generators"][] = [];
    const finish = (current: Path, value?: Expression) => {
      const settled = exits.find(
        (generators) =>
          isCompletedFrom(current.generators, path.generators) &&
          isCompletedFrom(generators, path.generators) &&
          [...generators].every(
            (entry) =>
              entry[1] === current.generators.get(entry[0]) ||
              entry[1].resume === current.generators.get(entry[0])?.resume,
          ),
      );
      if (settled === undefined) exits.push(current.generators);
      return next({ ...current, generators: settled ?? current.generators }, value);
    };
    return getLoop(finish)(path, 0, kept);
  });
  return translateHoldsIteratorPrototype(method, node, path, context, consume);
};

// Runs what follows where Iterator.prototype still holds the built-in method that a call reads.
// Array.from reads the iterator that Iterator.prototype's Symbol.iterator gives.
const translateHoldsIteratorPrototype = (
  method: string,
  node: ts.Node,
  path: Path,
  context: Context,
  rest: Formula,
) => {
  const key = method === "from" ? "@@iterator" : method;
  return context.heap === undefined
    ? rest
    : ifThenElse(
        useJavaScript(
          "HoldsBuiltIn",
          [
            getHeap(path.scope, node, context),
            translateBuiltInValue("Iterator.prototype", node, context),
            key === "@@iterator"
              ? useJavaScript("WellKnownSymbol", [string("iterator")], context)
              : string(key),
            string(`Iterator.prototype.${key}`),
          ],
          context,
        ),
        rest,
        leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't call Iterator.prototype.${key} where a script replaced it`),
          ]),
        ),
      );
};

// The most steps of an iterator helper that tla-ts translates. Where flatMap's mapper returns arrays
// of different lengths, how many values a step gives depends on the path through the mapper, so
// the steps after it translate once for each path.
const HELPER_STEP_LIMIT = 512;

// The length of the array literals that a function returns, where it returns only array literals
// of one length.
const getReturnedLength = (callback: FunctionNode, context: Context) => {
  const getLengths = (returned: ts.Expression | undefined): (number | undefined)[] => {
    const inner = returned && getCast(returned);
    if (inner !== undefined && ts.isConditionalExpression(inner)) {
      return [...getLengths(inner.whenTrue), ...getLengths(inner.whenFalse)];
    }
    return inner !== undefined &&
      ts.isArrayLiteralExpression(inner) &&
      !inner.elements.some(ts.isSpreadElement) &&
      !context.heapCollections.has(inner)
      ? [inner.elements.length]
      : [undefined];
  };
  const body = callback.body;
  const returned =
    body === undefined
      ? []
      : ts.isBlock(body)
        ? findNodes(body, ts.isReturnStatement)
            .filter(
              (statement) => ts.findAncestor(statement.parent, ts.isFunctionLike) === callback,
            )
            .map((statement) => statement.expression)
        : [body];
  // A body whose end it may reach returns undefined there.
  const signature = context.checker.getSignatureFromDeclaration(callback);
  const type = signature && context.checker.getReturnTypeOfSignature(signature);
  const isFallible =
    type === undefined ||
    (type.isUnion() ? type.types : [type]).some(
      (member) => (member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) !== 0,
    );
  const lengths = new Set(returned.flatMap(getLengths));
  return lengths.size === 1 && !isFallible ? [...lengths][0] : undefined;
};

// Whether a function returns only primitives.
const isPrimitiveReturn = (callback: FunctionNode, context: Context) => {
  const signature = context.checker.getSignatureFromDeclaration(callback);
  const returned = signature && context.checker.getReturnTypeOfSignature(signature);
  return (
    returned !== undefined &&
    (returned.isUnion() ? returned.types : [returned]).every(
      (type) =>
        (type.flags &
          (ts.TypeFlags.StringLike |
            ts.TypeFlags.NumberLike |
            ts.TypeFlags.BooleanLike |
            ts.TypeFlags.BigIntLike |
            ts.TypeFlags.Undefined |
            ts.TypeFlags.Null |
            ts.TypeFlags.Void)) !==
        0,
    )
  );
};

// A call of Iterator.prototype's map, filter, flatMap, take, or drop on a generator object, which
// makes an iterator helper. tla-ts follows the helper as a generator: each next steps the generator it
// wraps, through the callback, until the limit.
const translateIteratorHelper = (
  node: ts.CallExpression,
  helper: NonNullable<ReturnType<typeof getGeneratorMethod>>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const method = helper.method;
  const argument = helper.values.at(0);
  const isCounted = method === "take" || method === "drop";
  const callback =
    !isCounted && argument !== undefined ? getCallback(argument, path, context) : undefined;
  const limit =
    isCounted && argument !== undefined && ts.isNumericLiteral(argument)
      ? Number(argument.text)
      : undefined;
  if (isCounted ? limit === undefined || !Number.isInteger(limit) : callback?.body === undefined) {
    throw new TlaTypeScriptError(
      isCounted
        ? `Give ${method} a whole number literal`
        : `Give ${method} a function that tla-ts can tell`,
      argument ?? node,
    );
  }
  const name = context.names.getFresh("helper");
  const heapSymbol = context.heap;
  const ref =
    heapSymbol === undefined
      ? record("Record", [{ name: "generator", value: string(name) }])
      : useJavaScript("Allocated", [identifier(name)], context);
  const underlyingName = context.names.getFresh("underlying");
  const callbackReceiver =
    callback !== undefined && !ts.isArrowFunction(callback)
      ? { value: getUndefined(context), method: callback }
      : path.scope.receiver;
  const getCaller = (current: Path) => {
    const caller = current.generators.get(name)?.caller;
    if (caller === undefined) throw new TlaTypeScriptError("Unsupported iterator helper", node);
    return caller;
  };
  // A helper's return closes the generator it wraps, which tla-ts doesn't follow, so a return
  // stops.
  if (helper.invalid === "primitive") {
    return translateHoldsIteratorPrototype(
      method,
      node,
      path,
      context,
      throwTypeError(path, node, context, frame),
    );
  }
  // An object whose next isn't callable makes a helper whose next throws.
  const translated =
    helper.invalid === "object"
      ? getUndefined(context)
      : translateExpression(helper.receiver, path.scope, context);
  // The generator that a next runs, which patterns check, where the receiver may hold only one.
  const suspensions = [...path.generators.values()];
  const exact = suspensions.filter((suspension) => isSameExpression(suspension.ref, translated));
  // A step resumes only the generator that the receiver holds, where it can only hold one.
  const underlying = exact.length === 1 ? exact[0].ref : identifier(underlyingName);
  const candidates = new Set(
    (exact.length > 0 ? exact : suspensions).map((suspension) => suspension.generator),
  );
  const generator =
    helper.invalid === "object" ? callback : candidates.size === 1 ? [...candidates][0] : undefined;
  if (generator === undefined && helper.invalid === undefined) {
    throw new TlaTypeScriptError("tla-ts can't tell which generator this helper wraps", node);
  }
  const getSuspension = (resume: Suspension["resume"]): Suspension => ({
    ref,
    generator,
    resume,
    isStarted: true,
    isGuarded: true,
    isAsync: false,
    queue: [],
  });
  const leave = (current: Path, resume: Suspension["resume"]): Path => ({
    ...current,
    generators: new Map([...current.generators, [name, getSuspension(resume)]]),
  });
  const getFrame = (caller: Caller): Frame => ({
    ...frame,
    // A callback that throws closes the generator before the error leaves next.
    throwTo: (current, thrown) =>
      resumeGenerator(node, underlying, "return", undefined, current, context, frame, (after) => {
        const left = leave(after, undefined);
        return caller.throwTo === undefined ? leaf(thrown.uncaught) : caller.throwTo(left, thrown);
      }),
  });
  const translatedSteps = { count: 0 };
  // flatMap gives each element of the array that the mapper returns, as the array's iterator steps
  // it, before it maps the next element.
  const flattenFrom =
    (counter: number, elements: Expression[], position: number) =>
    (resumer: Path): Formula => {
      const caller = getCaller(resumer);
      const stepped =
        position < elements.length
          ? caller.step(
              leave(resumer, flattenFrom(counter, elements, position + 1)),
              elements[position],
              false,
            )
          : stepFrom(counter + 1)(resumer);
      return context.heap === undefined
        ? stepped
        : ifThenElse(
            holdsArrayIteration(getHeap(resumer.scope, node, context), node, context),
            stepped,
            leaf(apply("Assert", [boolean(false), string(ARRAY_ITERATOR_REPLACED)])),
          );
    };
  const stepFrom =
    (counter: number) =>
    (resumer: Path): Formula => {
      translatedSteps.count += 1;
      if (translatedSteps.count > HELPER_STEP_LIMIT) {
        throw new TlaTypeScriptError(
          "tla-ts can't follow this many paths through an iterator helper's callback",
          node,
        );
      }
      const caller = getCaller(resumer);
      const give = (current: Path, value: Expression | undefined, isDone: boolean) =>
        caller.step(leave(current, isDone ? undefined : stepFrom(counter + 1)), value, isDone);
      if (method === "take" && counter >= (limit ?? 0) && helper.invalid === "object") {
        return give(resumer, undefined, true);
      }
      if (helper.invalid === "object") {
        return throwTypeError(leave(resumer, undefined), node, context, {
          ...frame,
          throwTo: caller.throwTo,
        });
      }
      if (method === "take" && counter >= (limit ?? 0)) {
        return resumeGenerator(
          node,
          underlying,
          "return",
          undefined,
          resumer,
          context,
          frame,
          (after) => give(after, undefined, true),
        );
      }
      return resumeGenerator(
        node,
        underlying,
        "next",
        undefined,
        resumer,
        context,
        getFrame(caller),
        (after, value, isDone, isResult) => {
          if (isResult) {
            throw new TlaTypeScriptError(
              `tla-ts can't run ${method} on a generator that delegates with yield*`,
              node,
            );
          }
          if (isDone) return give(after, undefined, true);
          const element = value ?? getUndefined(context);
          if (method === "take") return give(after, element, false);
          if (method === "drop") {
            return counter < (limit ?? 0)
              ? stepFrom(counter + 1)(after)
              : give(after, element, false);
          }
          if (callback === undefined) throw new TlaTypeScriptError("Give this a body", node);
          const elementName = context.names.getFresh("element");
          const bound = identifier(elementName);
          // The callback's paths join into one result and heap, so the steps after it translate
          // once, except where flatMap's arrays may have different lengths.
          const length = method === "flatMap" ? getReturnedLength(callback, context) : undefined;
          const finish = (done: Path, result: Expression | undefined): Formula => {
            if (method === "flatMap") {
              // A primitive isn't an iterator or an iterable that flatMap takes.
              if (isPrimitiveReturn(callback, context)) {
                return throwTypeError(done, node, context, getFrame(caller));
              }
              if (length !== undefined) {
                const returned = result ?? getUndefined(context);
                return flattenFrom(
                  counter,
                  Array.from({ length }, (_, position) => index(returned, [number(position + 1)])),
                  0,
                )(done);
              }
              const flatten = (returned: Expression | undefined): Formula => {
                if (returned?.kind === "Tuple") {
                  return flattenFrom(counter, returned.elements, 0)(done);
                }
                if (returned?.kind === "If") {
                  return ifThenElse(
                    returned.condition,
                    flatten(returned.consequent),
                    flatten(returned.alternative),
                  );
                }
                throw new TlaTypeScriptError(
                  "tla-ts can flatten only an array literal that the mapper returns",
                  callback,
                );
              };
              return flatten(result);
            }
            const resultName = context.names.getFresh("result");
            const mapped = identifier(resultName);
            return bindOnce(
              done,
              resultName,
              result ?? getUndefined(context),
              method === "map"
                ? give(done, mapped, false)
                : ifThenElse(
                    useJavaScript("ToBoolean", [mapped], context),
                    give(done, bound, false),
                    stepFrom(counter + 1)(done),
                  ),
            );
          };
          const translateCallback = (next: (done: Path, result?: Expression) => Formula) =>
            inlineValues(
              callback,
              [bound, number(counter)],
              callbackReceiver,
              after,
              context,
              getFrame(caller),
              next,
            );
          return bindOnce(
            after,
            elementName,
            element,
            method === "flatMap" && length === undefined
              ? translateCallback(finish)
              : translateJoined(callback, after, context, finish, translateCallback),
          );
        },
      );
    };

  const made = leave(path, stepFrom(0));
  const created =
    heapSymbol === undefined
      ? continueWith(made, ref)
      : bindOnce(
          path,
          name,
          useJavaScript(
            "Allocate",
            [getHeap(path.scope, node, context), identifier("GeneratorObject")],
            context,
          ),
          continueWith(
            {
              ...made,
              scope: {
                ...made.scope,
                bindings: new Map([...made.scope.bindings, [heapSymbol, identifier(name)]]),
              },
            },
            ref,
          ),
        );
  return translateHoldsIteratorPrototype(
    method,
    node,
    path,
    context,
    bindOnce(path, underlyingName, translated, created),
  );
};

// A call to a generator's next, return, or throw, which gives an object with what the generator
// yields or returns.
const translateGeneratorStep = (
  node: MethodCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const heapSymbol = context.heap;
  return resumeGenerator(
    node,
    translateExpression(node.expression.expression, path.scope, context),
    node.expression.name.text,
    node.arguments.at(0),
    path,
    context,
    frame,
    (current, value, isDone, isResult) => {
      if (isResult && value !== undefined) return continueWith(current, value);
      if (heapSymbol === undefined) {
        return continueWith(
          current,
          record("Record", [
            { name: "value", value: value ?? getUndefined(context) },
            { name: "done", value: boolean(isDone) },
          ]),
        );
      }
      const name = context.names.getFresh("heap");
      const result = useJavaScript(
        "IteratorResult",
        [value ?? getUndefined(context), boolean(isDone)],
        context,
      );
      return bindOnce(
        current,
        name,
        useJavaScript("Allocate", [getHeap(current.scope, node, context), result], context),
        continueWith(
          {
            ...current,
            scope: {
              ...current.scope,
              bindings: new Map([...current.scope.bindings, [heapSymbol, identifier(name)]]),
            },
          },
          useJavaScript("Allocated", [identifier(name)], context),
        ),
      );
    },
    continueWith,
  );
};

// Resumes the generator whose object a receiver holds, for its next, return, or throw. A return or
// a throw completes a generator that suspended outside try statements, and otherwise runs the body
// from the yield as a return or a throw there would, through its finally blocks and catch clauses.
export const resumeGenerator = (
  node: ts.Node,
  receiver: Expression,
  method: string,
  argument: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  step: Caller["step"],
  continueAsync?: (path: Path, request: Expression) => Formula,
): Formula => {
  // An async generator's next, return, or throw gives a promise of what the body does.
  const runAsync = (
    name: string,
    suspension: Suspension,
    continueWith: (path: Path, request: Expression) => Formula,
  ) =>
    makeRequest(path, node, context, (made, request, ref) => {
      const done = (after: Path) => continueWith(after, ref);
      const resume = suspension.resume;
      const completed = {
        ...made,
        generators: new Map([
          ...made.generators,
          [name, { ...suspension, resume: undefined, isStarted: true }],
        ]),
      };
      if (method === "next") {
        if (resume === undefined) {
          return settleRequest(
            made,
            node,
            request,
            getUndefined(context),
            true,
            false,
            context,
            done,
          );
        }
        if (argument !== undefined && suspension.isStarted) {
          throw new TlaTypeScriptError("tla-ts can't send a value to a generator", argument);
        }
        return resume({
          ...made,
          generators: new Map([
            ...made.generators,
            [
              name,
              { ...suspension, caller: getAsyncCaller(node, name, made, request, context, done) },
            ],
          ]),
        });
      }
      if (resume !== undefined && suspension.isStarted && suspension.isGuarded) {
        return leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't close a generator that suspended in try or yield*"),
          ]),
        );
      }
      if (method === "throw") {
        const thrown =
          argument === undefined
            ? getUndefined(context)
            : translateThrown(argument, path.scope, context);
        return settleRequest(completed, node, request, thrown, true, true, context, done);
      }
      // A return awaits its value before the request settles.
      return awaitIn(
        completed,
        node,
        argument === undefined
          ? getUndefined(context)
          : translateExpression(argument, path.scope, context),
        argument,
        context,
        (resumer, settled, isRejected, onReturn) =>
          settleRequest(resumer, node, request, settled, true, isRejected, context, onReturn),
        done,
      );
    });
  const run = (name: string, suspension: Suspension) => {
    // A next of an async generator whose body runs waits for the body to yield.
    if (
      suspension.caller !== undefined &&
      suspension.isAsync &&
      method === "next" &&
      argument === undefined &&
      continueAsync !== undefined
    ) {
      return makeRequest(path, node, context, (made, request, ref) =>
        continueAsync(
          {
            ...made,
            generators: new Map([
              ...made.generators,
              [name, { ...suspension, queue: [...suspension.queue, request] }],
            ]),
          },
          ref,
        ),
      );
    }
    // A receiver that tla-ts can't match to one generator branches over each, so a generator
    // that it can't resume fails only where the receiver holds it.
    if (suspension.caller !== undefined) {
      return leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't resume a generator that is running"),
        ]),
      );
    }
    if (suspension.isAsync) {
      return continueAsync === undefined
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't follow an async generator here"),
            ]),
          )
        : runAsync(name, suspension, continueAsync);
    }
    const completed = {
      ...path,
      generators: new Map([
        ...path.generators,
        [name, { ...suspension, resume: undefined, isStarted: true }],
      ]),
    };
    const resume = suspension.resume;
    if (method === "next") {
      if (resume === undefined) return step(path, undefined, true);
      if (argument !== undefined && suspension.isStarted) {
        throw new TlaTypeScriptError("tla-ts can't send a value to a generator", argument);
      }
      return resume({
        ...path,
        generators: new Map([
          ...path.generators,
          [name, { ...suspension, caller: { path, step, throwTo: frame.throwTo } }],
        ]),
      });
    }
    if (resume !== undefined && suspension.isStarted && suspension.isGuarded) {
      if (suspension.abort === undefined) {
        return leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't close a generator that suspended in yield* or a helper"),
          ]),
        );
      }
      return suspension.abort(
        {
          ...path,
          generators: new Map([
            ...path.generators,
            [name, { ...suspension, caller: { path, step, throwTo: frame.throwTo } }],
          ]),
        },
        method,
        argument &&
          (method === "throw"
            ? translateThrown(argument, path.scope, context)
            : translateExpression(argument, path.scope, context)),
      );
    }
    if (method === "return") {
      return step(completed, argument && translateExpression(argument, path.scope, context), true);
    }
    const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
    if (frame.throwTo === undefined) return leaf(uncaught);
    return frame.throwTo(completed, {
      value:
        argument === undefined
          ? getUndefined(context)
          : translateThrown(argument, path.scope, context),
      uncaught,
    });
  };
  const generators = [...path.generators];
  const held = generators.find((entry) => isSameExpression(entry[1].ref, receiver));
  if (held !== undefined) return run(held[0], held[1]);
  return generators.reduceRight(
    (rest, entry) =>
      ifThenElse(apply("=", [receiver, entry[1].ref]), run(entry[0], entry[1]), rest),
    leaf(
      apply("Assert", [boolean(false), string("tla-ts can't tell which generator this call runs")]),
    ),
  );
};

// A call that makes a generator object, through a method that the receiver must hold.
const translateGeneratorCall = (
  node: ts.CallExpression,
  created: NonNullable<ReturnType<typeof getCreatedGenerator>>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
) => {
  const make = makeGenerator(
    node,
    created.generator,
    node.arguments,
    getReceiver(path.scope, context, created.called),
    path,
    context,
    frame,
    continueWith,
  );
  return created.called === undefined
    ? make
    : ifThenElse(
        translateHoldsMethod(created.called, path.scope, context),
        make,
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't tell which method this call runs"),
          ]),
        ),
      );
};

// The values that an array pattern takes from a generator object that a receiver holds, which one
// of the generator functions made. The pattern binds the values once the generator has run, so the
// generator must not read what the pattern binds, and the pattern's defaults, like the evaluated
// expressions, must not read what the generator changes.
const takeFromHeld = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  receiver: Expression,
  generators: FunctionNode[],
  evaluated: readonly ts.Expression[],
  current: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, values: Expression) => Formula,
): Formula => {
  const elements: readonly ts.Node[] = pattern.elements;
  const restAt = elements.findIndex(
    (element) =>
      ts.isSpreadElement(element) ||
      (ts.isBindingElement(element) && element.dotDotDotToken !== undefined),
  );
  const count = restAt === -1 ? elements.length : Infinity;
  const targets = new Set(getSymbols(pattern, context));
  const defaults = findNodes(
    pattern,
    (inner): inner is ts.BinaryExpression =>
      ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.EqualsToken,
  ).map((assignment) => assignment.right);
  if (
    generators.some(
      (generator) =>
        generator.body !== undefined &&
        getSymbols(generator.body, context).some((symbol) => targets.has(symbol)),
    )
  ) {
    throw new TlaTypeScriptError("tla-ts can't interleave this pattern with a generator", pattern);
  }
  rejectEarlyRun(
    pattern,
    generators,
    [...getInitializers(pattern), ...defaults, ...evaluated],
    current,
    context,
  );
  const step = (inner: Path, values: Expression[]): Formula =>
    values.length === count
      ? resumeGenerator(pattern, receiver, "return", undefined, inner, context, frame, (after) =>
          continueWith(after, tuple(values)),
        )
      : resumeGenerator(
          pattern,
          receiver,
          "next",
          undefined,
          inner,
          context,
          frame,
          (after, value, isDone, isResult) =>
            isDone
              ? continueWith(after, tuple(values))
              : isResult && value !== undefined
                ? readValue(pattern, value, after, context, frame, (read, taken) =>
                    step(read, [...values, taken]),
                  )
                : step(after, [...values, value ?? getUndefined(context)]),
        );
  return step(current, []);
};

// The values that an array pattern takes from a generator object, through its next: one for each
// element, or every one for a rest element, after which a pattern without one closes a generator
// that isn't done. The source makes the generator object or names a variable that holds one, or
// else this gives undefined.
const takeFromGenerator = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  source: ts.Expression,
  others: readonly ts.Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, values: Expression) => Formula,
): Formula | undefined => {
  const take = (receiver: Expression, generators: FunctionNode[], current: Path) =>
    takeFromHeld(
      pattern,
      receiver,
      generators,
      others.filter((other) => other !== source),
      current,
      context,
      frame,
      continueWith,
    );
  const node = getCast(source);
  const created = ts.isCallExpression(node) ? getCreatedGenerator(node, path, context) : undefined;
  if (created !== undefined && ts.isCallExpression(node)) {
    return translateGeneratorCall(node, created, path, context, frame, (after, ref) =>
      take(ref ?? getUndefined(context), [created.generator], after),
    );
  }
  // A default that calls a function in place, which gives a generator object that the statements
  // made.
  if (ts.isCallExpression(node) && isGeneratorType(node, context)) {
    return translateCallStatement(node, path, context, frame, (after, ref) =>
      take(
        ref ?? getUndefined(context),
        [...after.generators.values()].flatMap((suspension) => suspension.generator ?? []),
        after,
      ),
    );
  }
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const held = symbol && path.scope.bindings.get(symbol);
  if (held === undefined) return undefined;
  const generators = [...path.generators.values()];
  const exact = generators.filter((suspension) => isSameExpression(suspension.ref, held));
  return take(
    held,
    (exact.length > 0 ? exact : generators).flatMap((suspension) => suspension.generator ?? []),
    path,
  );
};

// Rejects running nodes before expressions that JavaScript evaluates first, where those expressions
// read what the nodes change.
const getEarlyReads = (
  run: readonly ts.Node[],
  evaluated: readonly ts.Node[],
  path: Path,
  context: Context,
) => {
  const changed = new Set(run.flatMap((inner) => getChanged(inner, path, context)));
  const isHeapChanged = context.heap !== undefined && changed.has(context.heap);
  const readsHeap = (inner: ts.Node) =>
    findNodes(
      inner,
      (found): found is ts.Node =>
        ts.isPropertyAccessExpression(found) || ts.isElementAccessExpression(found),
    ).length > 0;
  // A call that evaluates before, and hasn't run yet, reads what its function's body reads.
  const readsChanged = (inner: ts.Node, visited: Set<ts.Node>): boolean =>
    getSymbols(inner, context).some((symbol) => changed.has(symbol)) ||
    (isHeapChanged && readsHeap(inner)) ||
    findNodes(inner, ts.isCallExpression).some((call) => {
      const callee = path.scope.results.has(call) ? undefined : getCallee(call.expression, context);
      if (callee?.body === undefined || visited.has(callee)) return false;
      visited.add(callee);
      return readsChanged(callee.body, visited);
    });
  return evaluated.filter((inner) => readsChanged(inner, new Set()));
};

const rejectEarlyRun = (
  node: ts.Node,
  run: readonly ts.Node[],
  evaluated: readonly ts.Node[],
  path: Path,
  context: Context,
) => {
  if (getEarlyReads(run, evaluated, path, context).length > 0) {
    throw new TlaTypeScriptError("tla-ts can't run this before what reads what it changes", node);
  }
};

const getSymbols = (node: ts.Node, context: Context) =>
  findNodes(node, ts.isIdentifier).flatMap((name) => getSymbol(name, context.checker) ?? []);

const getInitializers = (node: ts.Node) =>
  findNodes(node, ts.isBindingElement).flatMap((element) => element.initializer ?? []);

// Runs the first of the defaults that bindings certainly evaluate whose call only statements can
// run, as its own statement before the bindings, which take its value from the path's results.
// The call must not read what the bindings bind, and the other expressions that the bindings
// evaluate must not read what it changes. The defaults that the bindings certainly skip take
// undefined from the path's results, as nothing evaluates them.
const runCertainDefault = (
  names: readonly ts.BindingName[],
  known: readonly KnownDefault[],
  evaluated: readonly ts.Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) => {
  const skipped = known
    .filter((entry) => !entry.isRun && !path.scope.results.has(entry.initializer))
    .map((entry): [ts.Expression, Expression] => [entry.initializer, getUndefined(context)]);
  if (skipped.length > 0) {
    return continueWith({
      ...path,
      scope: { ...path.scope, results: new Map([...path.scope.results, ...skipped]) },
    });
  }
  const run = known
    .filter((entry) => entry.isRun)
    .map((entry) => getCast(entry.initializer))
    .filter((initializer) => !path.scope.results.has(initializer));
  const pending = run.filter(
    (initializer): initializer is ts.CallExpression =>
      ts.isCallExpression(initializer) &&
      (isStatementCall(initializer, path, context) ||
        (path.scope.isCatching && mayThrow(initializer, context))),
  );
  // A default that names nothing that a declaration binds throws a ReferenceError as it runs.
  const unresolved = run.findIndex((initializer) => isUnresolved(initializer, context));
  const first = pending.at(0);
  if (unresolved !== -1 && (first === undefined || unresolved < run.indexOf(first))) {
    return throwError("ReferenceError", path, run[unresolved], context, frame);
  }
  if (first === undefined) return undefined;
  const bound = new Set(
    names
      .flatMap((name) => [
        name,
        ...findNodes(name, ts.isBindingElement).map((element) => element.name),
      ])
      .flatMap((name) => (ts.isIdentifier(name) ? getSymbols(name, context) : [])),
  );
  if (getSymbols(first, context).some((symbol) => bound.has(symbol))) {
    throw new TlaTypeScriptError("tla-ts can't run this default before what it binds", first);
  }
  rejectEarlyRun(
    first,
    [first],
    [...evaluated, ...names.flatMap(getInitializers)].filter(
      (node) => !pending.some((call) => call === getCast(node)),
    ),
    path,
    context,
  );
  const withResult = (after: Path, value: Expression | undefined) =>
    continueWith({
      ...after,
      scope: {
        ...after.scope,
        results: new Map([...after.scope.results, [first, value ?? getUndefined(context)]]),
      },
    });
  const binding = ts.findAncestor(first.parent, (node) => !ts.isParenthesizedExpression(node));
  const pattern =
    binding !== undefined &&
    (ts.isBindingElement(binding) || ts.isParameter(binding)) &&
    ts.isArrayBindingPattern(binding.name)
      ? binding.name
      : undefined;
  const taken =
    pattern &&
    isGeneratorType(first, context) &&
    takeFromGenerator(pattern, first, evaluated, path, context, frame, withResult);
  return taken || translateCallStatement(first, path, context, frame, withResult);
};

// The defaults that binding a name to a value certainly evaluates or skips, in order: its own,
// where the value is undefined or a literal that isn't, and, where the value is a literal, those
// of the elements and properties of the literal.
const getKnownDefaults = (
  name: ts.BindingName,
  value: ts.Expression | undefined,
  initializer: ts.Expression | undefined,
  context: Context,
): KnownDefault[] => {
  if (value === undefined || isUndefinedLiteral(value, context)) {
    return initializer === undefined
      ? []
      : [{ initializer, isRun: true }, ...getKnownDefaults(name, initializer, undefined, context)];
  }
  const literal = getCast(value);
  const own =
    initializer !== undefined && isDefinedLiteral(literal) ? [{ initializer, isRun: false }] : [];
  return [...own, ...getLiteralDefaults(name, literal, context)];
};

// A literal that is never undefined.
const isDefinedLiteral = (node: ts.Expression) =>
  ts.isLiteralExpression(node) ||
  ts.isArrayLiteralExpression(node) ||
  ts.isObjectLiteralExpression(node) ||
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  ts.isClassExpression(node) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    node.kind,
  ) ||
  (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand));

// The defaults of the elements or the properties that a pattern takes from a literal.
const getLiteralDefaults = (
  name: ts.BindingName,
  literal: ts.Expression,
  context: Context,
): KnownDefault[] => {
  if (ts.isArrayBindingPattern(name) && ts.isArrayLiteralExpression(literal)) {
    const spreadAt = literal.elements.findIndex(ts.isSpreadElement);
    return name.elements
      .slice(0, spreadAt === -1 ? undefined : spreadAt)
      .flatMap((element, position) => {
        if (ts.isOmittedExpression(element) || element.dotDotDotToken !== undefined) return [];
        const source = literal.elements.at(position);
        return getKnownDefaults(
          element.name,
          source === undefined || ts.isOmittedExpression(source) ? undefined : source,
          element.initializer,
          context,
        );
      });
  }
  if (
    ts.isObjectBindingPattern(name) &&
    ts.isObjectLiteralExpression(literal) &&
    literal.properties.every(
      (property) =>
        (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) &&
        ts.isIdentifier(property.name) &&
        property.name.text !== "__proto__",
    )
  ) {
    const restAt = name.elements.findIndex((element) => element.dotDotDotToken !== undefined);
    return name.elements.slice(0, restAt === -1 ? undefined : restAt).flatMap((element) => {
      const key = element.propertyName ?? element.name;
      if (!ts.isIdentifier(key) || Object.hasOwn(Object.prototype, key.text)) return [];
      const property = literal.properties.findLast(
        (candidate) =>
          candidate.name !== undefined &&
          ts.isIdentifier(candidate.name) &&
          candidate.name.text === key.text,
      );
      if (property === undefined)
        return getKnownDefaults(element.name, undefined, element.initializer, context);
      if (ts.isPropertyAssignment(property)) {
        return getKnownDefaults(element.name, property.initializer, element.initializer, context);
      }
      return ts.isShorthandPropertyAssignment(property)
        ? getKnownDefaults(element.name, property.name, element.initializer, context)
        : [];
    });
  }
  return [];
};

// The global undefined, which a local variable could shadow.
const isUndefinedLiteral = (node: ts.Expression, context: Context) =>
  ts.isIdentifier(node) &&
  node.text === "undefined" &&
  (context.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Undefined) !== 0;

export const isSameExpression = (left: Expression, right: Expression) => {
  const withoutLocations = (key: string, value: unknown) =>
    key === "location" ? undefined : value;
  return JSON.stringify(left, withoutLocations) === JSON.stringify(right, withoutLocations);
};

// A call to the next, return, or throw of a generator object.
const isGeneratorStep = (node: ts.CallExpression, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  ["next", "return", "throw"].includes(node.expression.name.text) &&
  isGeneratorType(node.expression.expression, context);

// A call of a method of Iterator.prototype that consumes a generator object or wraps it in a
// helper, or of the method's call with the generator object.
const getGeneratorMethod = (node: ts.CallExpression, context: Context) => {
  if (!isMethodCall(node) || node.arguments.some(ts.isSpreadElement)) return undefined;
  const accessed = node.expression;
  const owner = accessed.expression;
  const isCall =
    accessed.name.text === "call" &&
    ts.isPropertyAccessExpression(owner) &&
    owner.expression.getText() === "Iterator.prototype";
  // Array.from(generator, mapFn) gathers what the generator gives, as toArray does.
  const isFrom = accessed.name.text === "from" && getBuiltIn(owner, context) === "Array";
  const method = isCall ? owner.name.text : accessed.name.text;
  const receiver = isCall || isFrom ? node.arguments.at(0) : owner;
  const invalid = isCall && receiver !== undefined ? getInvalidIterator(receiver) : undefined;
  return (ITERATOR_CONSUMERS.has(method) || ITERATOR_HELPERS.has(method) || isFrom) &&
    receiver !== undefined &&
    (isGeneratorType(receiver, context) || invalid !== undefined)
    ? {
        method,
        receiver,
        values: isCall || isFrom ? node.arguments.slice(1) : node.arguments,
        invalid,
      }
    : undefined;
};

// What a call of Iterator.prototype's method gives as its receiver, where the method throws a
// TypeError for it: a primitive, which isn't an object, or an object literal of literals whose next
// a step can't call. Evaluating either changes nothing.
const getInvalidIterator = (node: ts.Expression) => {
  const isLiteral = (value: ts.Expression) =>
    ts.isNumericLiteral(value) ||
    ts.isStringLiteral(value) ||
    [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
      value.kind,
    ) ||
    (ts.isIdentifier(value) && value.text === "undefined");
  if (isLiteral(node)) return "primitive";
  return ts.isObjectLiteralExpression(node) &&
    node.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        ts.isIdentifier(property.name) &&
        isLiteral(property.initializer),
    ) &&
    node.properties.some((property) => property.name?.getText() === "next")
    ? "object"
    : undefined;
};

// The generator that a call makes a generator object of, with the method it calls, if any.
const getCreatedGenerator = (node: ts.CallExpression, path: Path, context: Context) => {
  const called = getCalledMethod(node.expression, context, isAnyGenerator);
  const generator = called?.method ?? getGeneratorCallee(node.expression, path, context);
  return generator === undefined ? undefined : { generator, called };
};

const LOOP_METHODS = new Set([
  "forEach",
  "every",
  "some",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "filter",
  "map",
  "reduce",
  "reduceRight",
]);

// The array methods that read an array-like object's elements without a callback: those that search
// for a value and those that copy the elements. Each runs as a loop where a getter may answer the
// object's length or an element.
const UNCALLED_METHODS = new Set(["indexOf", "lastIndexOf", "includes", "toReversed", "with"]);

// The array methods that gather what they read into the array that they give.
const GATHERING_METHODS = new Set(["filter", "map", "toReversed", "with"]);

// The callback of an array method that changes what a statement can see, such as a count of its
// calls, or a search that may run getters, which the method runs as a loop of statements.
interface LoopCall {
  method: string;
  // The array, or the array-like object that Array.prototype's method calls back for.
  receiver: ts.Expression;
  callback: FunctionNode | undefined;
  // The callback's argument, or the value that a search looks for.
  argument: ts.Expression | undefined;
  // The initial value of reduce, or the index that a search starts from.
  initial: ts.Expression | undefined;
  isArrayLike: boolean;
  // Whether the receiver is a set, which the method visits in an order that TLC picks.
  isUnordered: boolean;
}

// An array method that calls back for each element, on an array or an array-like object.
// Whether a loop's body adds each element of a set to a set that the loop doesn't otherwise read,
// and does nothing else, so that it ends the same in any order, as a set that TLC holds keeps no
// insertion order.
const isOrderFree = (body: ts.Node | undefined, element: ts.Node | undefined, context: Context) => {
  const statement =
    body !== undefined && ts.isBlock(body) && body.statements.length === 1
      ? body.statements[0]
      : body;
  const added =
    statement !== undefined && ts.isExpressionStatement(statement)
      ? statement.expression
      : statement;
  // A receiver that reads only what adding to a set leaves alone.
  const isSteady = (node: ts.Expression): boolean => {
    if (ts.isIdentifier(node) || ts.isNumericLiteral(node)) return true;
    if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
      return isSteady(node.expression);
    }
    if (ts.isPropertyAccessExpression(node)) {
      return (
        node.name.text !== "size" &&
        getDefinedGetters(node.expression, node.name.text, context).length === 0 &&
        isSteady(node.expression)
      );
    }
    if (ts.isElementAccessExpression(node)) {
      return isSteady(node.expression) && isSteady(node.argumentExpression);
    }
    return (
      ts.isBinaryExpression(node) &&
      [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operatorToken.kind) &&
      isSteady(node.left) &&
      isSteady(node.right)
    );
  };
  const value = added !== undefined && ts.isCallExpression(added) ? added.arguments[0] : undefined;
  return (
    added !== undefined &&
    ts.isCallExpression(added) &&
    ts.isPropertyAccessExpression(added.expression) &&
    added.expression.name.text === "add" &&
    getKind(added.expression.expression, context) === "set" &&
    isSteady(added.expression.expression) &&
    added.arguments.length === 1 &&
    value !== undefined &&
    ts.isIdentifier(value) &&
    element !== undefined &&
    getSymbol(value, context.checker) === getSymbol(element, context.checker)
  );
};

// A set's forEach whose callback ends the same in any order.
const isOrderFreeForEach = (node: ts.CallExpression, receiver: ts.Expression, context: Context) => {
  const argument = node.arguments.length === 1 ? node.arguments[0] : undefined;
  const callback = argument === undefined ? undefined : getCallee(argument, context);
  return (
    getKind(receiver, context) === "set" &&
    callback !== undefined &&
    (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
    callback.parameters.length === 1 &&
    isOrderFree(callback.body, callback.parameters[0].name, context)
  );
};

// A for-of over a set whose body ends the same in any order.
const isOrderFreeForOf = (node: ts.ForOfStatement, context: Context) => {
  const initializer = node.initializer;
  const declaration =
    ts.isVariableDeclarationList(initializer) && initializer.declarations.length === 1
      ? initializer.declarations[0]
      : undefined;
  return (
    getKind(node.expression, context) === "set" &&
    isOrderFree(node.statement, declaration?.name, context)
  );
};

const getLoopTarget = (node: ts.Node, context: Context) => {
  if (!isMethodCall(node)) return undefined;
  const target = node.expression.expression;
  const isCall =
    node.expression.name.text === "call" &&
    ts.isPropertyAccessExpression(target) &&
    target.expression.getText() === "Array.prototype" &&
    node.arguments.length > 0 &&
    getKind(node.arguments[0], context) === "object";
  const isArrayLike = isCall || isHeapArray(target, context);
  const method =
    isCall && ts.isPropertyAccessExpression(target) ? target.name.text : node.expression.name.text;
  const receiver = isCall ? node.arguments[0] : target;
  const isUnordered = method === "forEach" && isOrderFreeForEach(node, receiver, context);
  return (LOOP_METHODS.has(method) || UNCALLED_METHODS.has(method)) &&
    (isArrayLike || isUnordered || getKind(receiver, context) === "sequence")
    ? {
        method,
        receiver,
        callbackArguments: isCall ? node.arguments.slice(1) : node.arguments,
        isArrayLike,
        isUnordered,
      }
    : undefined;
};

// The getters that an array-like object's method may run as it reads its length, the constructor
// that map and filter make their array through, and each element.
const getLoopGetters = (node: ts.Node, context: Context) => {
  const target = getLoopTarget(node, context);
  return target?.isArrayLike === true
    ? [
        ...new Set([
          ...(getElementGetters(target.receiver, context) ?? []),
          ...getDefinedGetters(target.receiver, "length", context),
          ...getSpeciesGetters(target.method, target.receiver, context),
        ]),
      ]
    : [];
};

const getSpeciesGetters = (method: string, receiver: ts.Node, context: Context) =>
  method === "map" || method === "filter"
    ? getDefinedGetters(receiver, "constructor", context)
    : [];

const getLoopCall = (node: ts.Expression, path: Path, context: Context): LoopCall | undefined => {
  const target = getLoopTarget(node, context);
  if (target === undefined) return undefined;
  const argument = target.callbackArguments.at(0);
  if (UNCALLED_METHODS.has(target.method)) {
    return getLoopGetters(node, context).length > 0 &&
      !target.callbackArguments.some(ts.isSpreadElement)
      ? {
          method: target.method,
          receiver: target.receiver,
          callback: undefined,
          argument,
          initial: target.callbackArguments.at(1),
          isArrayLike: target.isArrayLike,
          isUnordered: target.isUnordered,
        }
      : undefined;
  }
  const callback = argument && getCallback(argument, path, context);
  return argument !== undefined &&
    callback?.body !== undefined &&
    (ts.isArrowFunction(callback) ||
      ts.isFunctionExpression(callback) ||
      ts.isFunctionDeclaration(callback)) &&
    (getChanged(callback, path, context).length > 0 ||
      getLoopGetters(node, context).length > 0 ||
      context.heapCollections.has(node))
    ? {
        method: target.method,
        receiver: target.receiver,
        callback,
        argument,
        initial: target.callbackArguments.at(1),
        isArrayLike: target.isArrayLike,
        isUnordered: target.isUnordered,
      }
    : undefined;
};

// Runs an array method's callback on each element in turn, as statements. An array is a value
// that the callback can't change, so the method visits each of the elements it had.
const translateLoopCall = (
  expression: ts.CallExpression,
  loop: LoopCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const receiver = loop.receiver;
  const method = loop.method;
  const callback = loop.callback;
  const site = callback ?? expression;
  const isReversed =
    method === "reduceRight" ||
    method.startsWith("findLast") ||
    method === "lastIndexOf" ||
    method === "toReversed";
  const isReduce = method.startsWith("reduce");
  // Where a getter may answer an array-like object's length or element, or the callback may change
  // objects, the method reads its length and then each element as it visits it, as JavaScript
  // does. reduce without an initial value takes the first element that it finds as its
  // accumulator, and throws a TypeError where it finds none.
  const lengthGetters = loop.isArrayLike ? getDefinedGetters(receiver, "length", context) : [];
  const speciesGetters = loop.isArrayLike ? getSpeciesGetters(method, receiver, context) : [];
  const getters = loop.isArrayLike
    ? (getElementGetters(receiver, context) ??
      (lengthGetters.length + speciesGetters.length > 0 ||
      (callback !== undefined &&
        getChanged(callback, path, context).some((symbol) => symbol === context.heap))
        ? []
        : undefined))
    : undefined;
  const changed =
    getters === undefined && callback !== undefined
      ? getChanged(callback, path, context)
      : getChanged(expression, path, context);
  // Otherwise an array-like object's method reads its elements before it visits them, which a
  // callback that changes objects could change.
  if (
    getters === undefined &&
    loop.isArrayLike &&
    changed.some((symbol) => symbol === context.heap)
  ) {
    throw new TlaTypeScriptError("Don't change objects in this callback", site);
  }
  const isReceiverChanged = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) &&
      changed.some((symbol) => symbol === getSymbol(node, context.checker))) ||
    (ts.forEachChild(node, (child) => isReceiverChanged(child) || undefined) ?? false);
  // A callback that changes the array that it visits, which the method reads at each index as it
  // visits it, after it reads the length once.
  const isLive =
    !loop.isArrayLike &&
    ts.isIdentifier(receiver) &&
    changed.some((symbol) => symbol === getSymbol(receiver, context.checker));
  // An array-like object's method reads it through the reference that it took before the loop.
  if (!loop.isArrayLike && !isLive && isReceiverChanged(receiver)) {
    throw new TlaTypeScriptError("Don't change an array while its method calls back", receiver);
  }
  if (changed.some((symbol) => path.scope.functions.has(symbol))) {
    throw new TlaTypeScriptError("Don't reassign a function inside a callback", site);
  }
  // The array parameter holds a sequence, which only a parameter typed as an array can read.
  const callbackParameters = callback === undefined ? [] : getParameters(callback);
  const arrayName = callbackParameters.at(isReduce ? 3 : 2)?.name;
  if (
    arrayName !== undefined &&
    ts.isIdentifier(arrayName) &&
    getKind(arrayName, context) !== (loop.isArrayLike ? "object" : "sequence") &&
    (context.checker.getTypeAtLocation(arrayName).flags & ts.TypeFlags.Unknown) === 0 &&
    isNameRead(arrayName, site, context)
  ) {
    throw new TlaTypeScriptError("Type a callback's array parameter as an array", arrayName);
  }
  const initial = isReduce ? loop.initial : undefined;
  const name = context.names.getFresh("Loop");
  const ownerName = context.names.getFresh("owner");
  const owner = identifier(ownerName);
  const sequenceName = context.names.getFresh("sequence");
  const sequence = identifier(sequenceName);
  const presentName = context.names.getFresh("present");
  const lengthName = context.names.getFresh("length");
  const isSkippingHoles =
    getters === undefined && loop.isArrayLike && HOLE_SKIPPING_METHODS.has(method);
  const position = context.names.getFresh("position");
  const accumulator = context.names.getFresh("accumulator");
  const parameters = changed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const getValues = (current: Path) =>
    changed.flatMap((symbol) => current.scope.bindings.get(symbol) ?? []);
  const withValues = (current: Path, values: Expression[]): Path => ({
    ...current,
    scope: {
      ...current.scope,
      bindings: new Map([
        ...current.scope.bindings,
        ...changed.map((symbol, offset): [ts.Symbol, Expression] => [symbol, values[offset]]),
      ]),
    },
  });
  const step = apply(isReversed ? "-" : "+", [identifier(position), number(1)]);
  const isUnseeded = getters !== undefined && isReduce && initial === undefined;
  const seededName = context.names.getFresh("isSeeded");
  const seeded = isUnseeded ? [identifier(seededName)] : [];
  const repeat = (current: Path, next: Expression) =>
    leaf(call(name, [step, next, ...seeded, ...getValues(current)]));
  const done = (current: Path, result: Expression) =>
    leaf(tuple([result, ...getValues(current), ...seeded]));
  const kept = identifier(accumulator);
  // The array that map makes, where the heap holds it, gathers its elements and its holes.
  const isHeapMap = method === "map" && context.heapCollections.has(expression);
  const getMapped = (value: Expression, isHole: boolean) =>
    isHeapMap
      ? tuple([
          apply("Append", [index(kept, [number(1)]), value]),
          isHole
            ? apply("\\cup", [index(kept, [number(2)]), set([identifier(position)])])
            : index(kept, [number(2)]),
        ])
      : apply("Append", [kept, value]);
  const getAfterCallback = (element: Expression) => (current: Path, value?: Expression) => {
    const result = value ?? getUndefined(context);
    const isTruthy = useJavaScript("ToBoolean", [result], context);
    if (method === "forEach") return repeat(current, kept);
    if (method === "every")
      return ifThenElse(isTruthy, repeat(current, kept), done(current, boolean(false)));
    if (method === "some")
      return ifThenElse(isTruthy, done(current, boolean(true)), repeat(current, kept));
    if (method === "find" || method === "findLast") {
      return ifThenElse(isTruthy, done(current, element), repeat(current, kept));
    }
    if (method === "findIndex" || method === "findLastIndex") {
      return ifThenElse(
        isTruthy,
        done(current, apply("-", [identifier(position), number(1)])),
        repeat(current, kept),
      );
    }
    if (method === "filter") {
      return ifThenElse(
        isTruthy,
        repeat(current, apply("Append", [kept, element])),
        repeat(current, kept),
      );
    }
    return repeat(current, method === "map" ? getMapped(result, false) : result);
  };
  const finished =
    new Map([
      ["every", boolean(true)],
      ["some", boolean(false)],
      ["findIndex", number(-1)],
      ["findLastIndex", number(-1)],
      ["indexOf", number(-1)],
      ["lastIndexOf", number(-1)],
      ["includes", boolean(false)],
    ]).get(method) ?? (GATHERING_METHODS.has(method) || isReduce ? kept : getUndefined(context));
  const inner = {
    ...withValues(
      path,
      parameters.map((parameter) => identifier(parameter)),
    ),
    isLooping: true,
    // A generator from before the loop resumes only outside it, as each iteration's path ends.
    generators: new Map(),
    tasks: undefined,
  };
  const throwTo =
    frame.throwTo &&
    (() => {
      throw new TlaTypeScriptError("Catch inside the callback, or throw after the call", site);
    });
  const searchName = context.names.getFresh("searched");
  // Compares an element with the value that a search looks for.
  const compare = (current: Path, element: Expression) =>
    ifThenElse(
      useJavaScript(
        method === "includes" ? "SameValueZero" : "StrictEquals",
        [element, identifier(searchName)],
        context,
      ),
      done(
        current,
        method === "includes" ? boolean(true) : apply("-", [identifier(position), number(1)]),
      ),
      repeat(current, kept),
    );
  // Runs the callback on an element, from a path that may have run a getter to read it.
  const runCallback = (current: Path, element: Expression) => {
    if (callback?.body === undefined || loop.argument === undefined) {
      throw new TlaTypeScriptError("Give this a body", site);
    }
    const body = callback.body;
    const statements = ts.isBlock(body)
      ? body.statements
      : [ts.factory.createReturnStatement(body)];
    const getChecked = (value: Expression, at: number) =>
      loop.isArrayLike
        ? checkElement(
            value,
            callbackParameters[at],
            getHeap(current.scope, receiver, context),
            context,
          )
        : value;
    const passed = [
      ...(isReduce ? [getChecked(kept, 0)] : []),
      getChecked(element, isReduce ? 1 : 0),
      isSkippingHoles
        ? index(field(identifier(presentName), "indices"), [identifier(position)])
        : apply("-", [identifier(position), number(1)]),
      loop.isArrayLike
        ? owner
        : isLive
          ? translateExpression(receiver, current.scope, context)
          : sequence,
    ];
    const afterCallback = getAfterCallback(element);
    const callbackReceiver = getCallbackReceiver(loop.argument, callback, current.scope, context);
    // A callback that the method runs from inside itself calls itself, as a call in it would.
    if (frame.inlining.has(callback)) {
      return translateSelfCall(
        loop.argument,
        callback,
        [],
        callbackReceiver,
        current,
        context,
        { ...frame, throwTo },
        afterCallback,
        passed.slice(0, callbackParameters.length),
      );
    }
    const bound = allocateArguments(
      callback,
      passed,
      receiver,
      bindValues(callbackParameters, passed, current.scope, context),
      context,
    );
    return letIn(
      bound.definitions,
      translateStatements(
        statements,
        {
          ...current,
          scope: { ...bound.scope, receiver: callbackReceiver },
        },
        context,
        {
          next: afterCallback,
          exit: afterCallback,
          breakTo: undefined,
          continueTo: undefined,
          throwTo,
          yieldTo: undefined,
          awaitTo: undefined,
          inlining: new Set([...frame.inlining, callback]),
        },
      ),
    );
  };
  // Reads the element at a position, running a getter that answers it, where the object or a
  // prototype has the index. The find methods read each index, and map keeps a hole, which the
  // array it makes can't hold.
  const isCopy = method === "toReversed" || method === "with";
  const visit =
    callback !== undefined
      ? runCallback
      : isCopy
        ? (current: Path, element: Expression) => repeat(current, apply("Append", [kept, element]))
        : compare;
  const replacedName = context.names.getFresh("replaced");
  // map keeps a hole where the array that it visits lacks an element, which only an array that the
  // heap holds can.
  const keepHole = () =>
    isHeapMap
      ? repeat(inner, getMapped(getUndefined(context), true))
      : leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't keep a hole in the array that map makes"),
          ]),
        );
  const visitLazily = (elementGetters: readonly FunctionNode[]) => {
    const key = useJavaScript("ToString", [apply("-", [identifier(position), number(1)])], context);
    const read = readWith(
      expression,
      owner,
      key,
      elementGetters,
      inner,
      context,
      { ...frame, breakTo: undefined, continueTo: undefined, throwTo },
      isUnseeded
        ? (current, element) =>
            ifThenElse(
              identifier(seededName),
              visit(current, element),
              leaf(call(name, [step, element, boolean(true), ...getValues(current)])),
            )
        : visit,
    );
    // with gives its value at the index that it replaces, which it doesn't read.
    return method === "with"
      ? ifThenElse(
          apply("=", [identifier(position), apply("+", [identifier(replacedName), number(1)])]),
          repeat(inner, apply("Append", [kept, identifier(searchName)])),
          read,
        )
      : EVERY_INDEX_METHODS.has(method)
        ? read
        : ifThenElse(
            useJavaScript("Has", [getHeap(inner.scope, receiver, context), owner, key], context),
            read,
            method === "map" ? keepHole() : repeat(inner, kept),
          );
  };
  // Reads the element at a position of the array as the callback left it, where the array still
  // reaches the position, as for a hole.
  const visitLive = () => {
    const current = translateExpression(receiver, inner.scope, context);
    const isPresent = apply("<=", [identifier(position), apply("Len", [current])]);
    const missing = EVERY_INDEX_METHODS.has(method)
      ? runCallback(inner, getUndefined(context))
      : method === "map"
        ? keepHole()
        : repeat(inner, kept);
    return ifThenElse(
      isPresent,
      runCallback(inner, index(current, [identifier(position)])),
      missing,
    );
  };
  const length = getters === undefined ? apply("Len", [sequence]) : identifier(lengthName);
  const isInRange = isReversed
    ? apply(">=", [identifier(position), number(1)])
    : apply("<=", [identifier(position), length]);
  const operator: OperatorDefinition = {
    ...define(
      name,
      [position, accumulator, ...(isUnseeded ? [seededName] : []), ...parameters].map(
        (parameter) => ({ name: parameter, arity: 0 }),
      ),
      render(
        ifThenElse(
          isInRange,
          getters !== undefined
            ? visitLazily(getters)
            : isLive
              ? visitLive()
              : visit(inner, index(sequence, [identifier(position)])),
          done(inner, finished),
        ),
      ),
    ),
    isRecursive: true,
  };
  const from = callback === undefined && !isCopy ? loop.initial : undefined;
  if (from !== undefined && !isNumberLike(from, context)) {
    throw new TlaTypeScriptError("Pass a number as the index to search from", from);
  }
  // The value that a search looks for, or that with gives at the index that it replaces.
  const searched = callback !== undefined ? undefined : isCopy ? loop.initial : loop.argument;
  const replaced = method === "with" ? loop.argument : undefined;
  if (method === "with" && (replaced === undefined || !isNumberLike(replaced, context))) {
    throw new TlaTypeScriptError("Pass a number as the index that with replaces", expression);
  }
  // A search starts from the position after the index that fromIndex gives, from the end where
  // it's negative: lastIndexOf from no later than the last element, and the others from no earlier
  // than the first.
  const relative =
    from === undefined
      ? undefined
      : useJavaScript(
          "RelativeIndex",
          [translateExpression(from, path.scope, context), length],
          context,
        );
  const start =
    relative === undefined
      ? isReversed
        ? length
        : number(1)
      : apply("+", [
          isReversed
            ? ifExpression(
                apply("<", [relative, length]),
                relative,
                apply("-", [length, number(1)]),
              )
            : ifExpression(apply(">", [relative, number(0)]), relative, number(0)),
          number(1),
        ]);
  const result = context.names.getFresh("loop");
  const runLoop = (current: Path, first: Expression, seed: Expression) => {
    const after = {
      ...withValues(
        current,
        changed.map((_, offset) => index(identifier(result), [number(offset + 2)])),
      ),
      isAssigned: current.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
    };
    const value = index(identifier(result), [number(1)]);
    const heapName = context.names.getFresh("heap");
    const finish = (): Formula =>
      !isHeapMap || context.heap === undefined
        ? continueWith(after, value)
        : bindOnce(
            after,
            heapName,
            useJavaScript(
              "Allocate",
              [
                getHeap(after.scope, expression, context),
                useJavaScript(
                  "ArrayObjectWithHoles",
                  [
                    translateBuiltInValue("Array.prototype", expression, context),
                    index(value, [number(1)]),
                    index(value, [number(2)]),
                  ],
                  context,
                ),
              ],
              context,
            ),
            continueWith(
              {
                ...after,
                scope: {
                  ...after.scope,
                  bindings: new Map([
                    ...after.scope.bindings,
                    [context.heap, identifier(heapName)],
                  ]),
                },
              },
              useJavaScript("Allocated", [identifier(heapName)], context),
            ),
          );
    return letIn(
      [operator],
      bindOnce(
        current,
        result,
        call(name, [first, seed, ...(isUnseeded ? [boolean(false)] : []), ...getValues(current)]),
        isUnseeded
          ? ifThenElse(
              index(identifier(result), [number(changed.length + 2)]),
              finish(),
              throwTypeError(after, expression, context, frame),
            )
          : finish(),
      ),
    );
  };
  // A reduce without an initial value starts from the first element it visits, and throws a
  // TypeError for an empty array.
  const getSeeded = (current: Path) =>
    !isReduce
      ? runLoop(
          current,
          start,
          isHeapMap
            ? tuple([tuple([]), set([])])
            : GATHERING_METHODS.has(method)
              ? tuple([])
              : getUndefined(context),
        )
      : initial !== undefined
        ? runLoop(current, start, translateExpression(initial, current.scope, context))
        : isUnseeded
          ? runLoop(current, start, getUndefined(context))
          : ifThenElse(
              apply("=", [length, number(0)]),
              throwTypeError(current, expression, context, frame),
              runLoop(
                current,
                isReversed ? apply("-", [length, number(1)]) : number(2),
                index(sequence, [start]),
              ),
            );
  if (getters !== undefined) {
    // The length, which the method reads once, running its getter, after which map and filter
    // check the array's constructor, as ArraySpeciesCreate reads it.
    return letIn(
      [
        define(ownerName, [], translateExpression(receiver, path.scope, context)),
        define(
          searchName,
          [],
          searched === undefined
            ? getUndefined(context)
            : translateExpression(searched, path.scope, context),
        ),
      ],
      readWith(
        expression,
        owner,
        string("length"),
        lengthGetters,
        path,
        context,
        frame,
        (after, value) => {
          // with throws a RangeError where the index it replaces isn't below the length.
          const seeded = (current: Path) =>
            letIn(
              [
                define(lengthName, [], useJavaScript("ToLength", [value], context)),
                ...(replaced === undefined
                  ? []
                  : [
                      define(
                        replacedName,
                        [],
                        useJavaScript(
                          "RelativeIndex",
                          [translateExpression(replaced, path.scope, context), length],
                          context,
                        ),
                      ),
                    ]),
              ],
              replaced === undefined
                ? getSeeded(current)
                : ifThenElse(
                    junction("And", [
                      apply(">=", [identifier(replacedName), number(0)]),
                      apply("<", [identifier(replacedName), length]),
                    ]),
                    getSeeded(current),
                    throwError("RangeError", current, expression, context, frame),
                  ),
            );
          // ArraySpeciesCreate reads an array's constructor, running its getter, where tla-ts
          // follows only Array.
          return ["filter", "map"].includes(method)
            ? ifThenElse(
                useJavaScript("IsArray", [getHeap(after.scope, receiver, context), owner], context),
                readWith(
                  expression,
                  owner,
                  string("constructor"),
                  speciesGetters,
                  after,
                  context,
                  frame,
                  (read, constructor) =>
                    ifThenElse(
                      useJavaScript(
                        "SameValue",
                        [constructor, translateBuiltInValue("Array", receiver, context)],
                        context,
                      ),
                      seeded(read),
                      leaf(
                        apply("Assert", [
                          boolean(false),
                          string(
                            "tla-ts can't make an array through a constructor that a script gives",
                          ),
                        ]),
                      ),
                    ),
                ),
                seeded(after),
              )
            : seeded(after);
        },
      ),
    );
  }
  return letIn(
    [
      define(
        ownerName,
        [],
        loop.isUnordered
          ? useJavaScript(
              "SetToSequence",
              [translateExpression(receiver, path.scope, context)],
              context,
            )
          : translateExpression(receiver, path.scope, context),
      ),
      ...(isSkippingHoles
        ? [
            define(
              presentName,
              [],
              translateMethodElements(
                method,
                owner,
                "PresentElements",
                receiver,
                path.scope,
                context,
              ),
            ),
          ]
        : []),
      define(
        sequenceName,
        [],
        isSkippingHoles
          ? field(identifier(presentName), "values")
          : translateMethodElements(
              method,
              owner,
              loop.isArrayLike
                ? EVERY_INDEX_METHODS.has(method)
                  ? "ArrayLikeValues"
                  : "ArrayLike"
                : undefined,
              receiver,
              path.scope,
              context,
            ),
      ),
    ],
    getSeeded(path),
  );
};

// The constructor that a new of a heap class runs, where a statement runs it.
const getConstructorRun = (node: ts.Expression, context: Context) => {
  const created = getNewClass(node, context);
  return created !== undefined && isStatementNew(node)
    ? getRunConstructor(created, context)
    : undefined;
};

// A new of a heap class whose constructor runs statements, which runs them with the instance
// that the statement allocated as this, and gives the instance, or the object the constructor
// returns. A derived class's constructor throws a TypeError where it returns anything else.
const translateConstruction = (
  expression: ts.Expression,
  constructor: ts.ConstructorDeclaration | HeapClass,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const instance = translateObjectValue(expression, path.scope, context);
  const newTarget = getConstruction(expression, context)?.newTarget;
  const isNullBase = ts.isConstructorDeclaration(constructor) && isNullBased(constructor.parent);
  const isDerived =
    isNullBase ||
    (ts.isConstructorDeclaration(constructor) &&
      getBaseClass(constructor.parent, context) !== undefined);
  // A class that extends null never gets a this, so its constructor must return an object.
  const giveInstance = (after: Path) =>
    isNullBase
      ? throwError("ReferenceError", after, expression, context, frame)
      : continueWith(after, instance);
  const created = getNewClass(expression, context);
  const fields = created === undefined ? [] : getRunFields(created, context);
  return translateElements(fields, instance, path, context, frame, (defined) =>
    ts.isClassLike(constructor)
      ? giveInstance(defined)
      : inlineBody(
          expression,
          constructor,
          getConstruction(expression, context)?.arguments ?? [],
          {
            value: instance,
            method: constructor,
            newTarget:
              newTarget === undefined
                ? undefined
                : translateExpression(newTarget, defined.scope, context),
          },
          defined,
          context,
          frame,
          (after, value) => {
            if (value === undefined) return giveInstance(after);
            const name = context.names.getFresh("returned");
            const returned = identifier(name);
            context.prelude.add("Null");
            const type = useJavaScript("TypeOf", [returned], context);
            return letIn(
              [define(name, [], value)],
              ifThenElse(
                apply("=", [returned, getUndefined(context)]),
                giveInstance(after),
                ifThenElse(
                  apply("\\/", [
                    apply("/\\", [
                      apply("=", [type, string("object")]),
                      apply("#", [returned, identifier("Null")]),
                    ]),
                    apply("=", [type, string("function")]),
                  ]),
                  continueWith(after, returned),
                  isDerived
                    ? throwTypeError(after, expression, context, frame)
                    : continueWith(after, instance),
                ),
              ),
            );
          },
        ),
  );
};

// The constructor that a class's super(...) runs: the nearest base that declares one.
const getSuperConstructor = (
  node: ts.ClassLikeDeclaration,
  context: Context,
): ts.ConstructorDeclaration | undefined => {
  const base = getBaseClass(node, context);
  return base === undefined
    ? undefined
    : (base.members.find(ts.isConstructorDeclaration) ?? getSuperConstructor(base, context));
};

// A derived constructor's super(...), which runs the base's constructor on the instance that the
// new allocated, and gives it.
const translateSuperCall = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const constructor = ts.findAncestor(expression, ts.isConstructorDeclaration);
  const receiver = path.scope.receiver;
  if (
    constructor === undefined ||
    receiver?.method !== constructor ||
    getSuperCall(constructor) !== expression
  ) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  const called = getSuperConstructor(constructor.parent, context);
  const isReturning =
    called?.body !== undefined &&
    findNodes(called.body, ts.isReturnStatement).some(
      (statement) =>
        statement.expression !== undefined &&
        ts.findAncestor(statement.parent, ts.isFunctionLike) === called,
    );
  if (isReturning) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  if (called === undefined || called.body === undefined) {
    if (expression.arguments.length > 0) {
      throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
    }
    return continueWith(path, receiver.value);
  }
  return inlineBody(
    expression,
    called,
    expression.arguments,
    { value: receiver.value, method: called, newTarget: receiver.newTarget },
    path,
    context,
    frame,
    (after) => continueWith({ ...after, scope: { ...after.scope, receiver } }, receiver.value),
  );
};

// A class's static fields and blocks.
const getStaticElements = (node: ts.ClassLikeDeclaration) =>
  node.members.filter(
    (member): member is ts.ClassStaticBlockDeclaration | ts.PropertyDeclaration =>
      ts.isClassStaticBlockDeclaration(member) ||
      (ts.isPropertyDeclaration(member) && isStatic(member)),
  );

// Fields and static blocks, which run in order on the object that ref names, as this.
const translateElements = (
  elements: (ts.ClassStaticBlockDeclaration | ts.PropertyDeclaration)[],
  ref: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const heapSymbol = context.heap;
  if (heapSymbol === undefined) return continueWith(path);
  return elements.reduceRight<(path: Path) => Formula>(
    (rest, element) => (before) => {
      const receiver = { value: ref, method: element };
      const afterElement = (inner: Path) =>
        rest({
          ...inner,
          scope: {
            ...inner.scope,
            receiver: before.scope.receiver,
            previous: before.scope.previous,
          },
        });
      if (ts.isClassStaticBlockDeclaration(element)) {
        return translateJoined(element, before, context, afterElement, (next) =>
          translateStatements(
            element.body.statements,
            { ...before, scope: { ...before.scope, receiver } },
            context,
            {
              next,
              exit: next,
              breakTo: undefined,
              continueTo: undefined,
              throwTo: frame.throwTo,
              yieldTo: undefined,
              awaitTo: undefined,
              inlining: frame.inlining,
            },
          ),
        );
      }
      const initializer = element.initializer;
      return allocate(initializer, before, context, (allocated) => {
        const define = (inner: Path, initial: Expression) => {
          const value = context.names.getFresh("value");
          const heap = getHeap(inner.scope, element, context);
          const withHeap = (changed: Expression) => ({
            ...inner,
            scope: {
              ...inner.scope,
              bindings: new Map([...inner.scope.bindings, [heapSymbol, changed]]),
            },
          });
          const change = context.names.getFresh("change");
          const defined = ts.isPrivateIdentifier(element.name)
            ? bindOnce(
                inner,
                change,
                useJavaScript(
                  "Update",
                  [
                    heap,
                    ref,
                    useJavaScript(
                      "PrivateAdd",
                      [
                        useJavaScript("Lookup", [heap, ref], context),
                        string(getPrivateKey(element, context)),
                        identifier(value),
                      ],
                      context,
                    ),
                  ],
                  context,
                ),
                afterElement(withHeap(identifier(change))),
              )
            : bindOnce(
                inner,
                change,
                useJavaScript(
                  "DefineField",
                  [
                    heap,
                    ref,
                    translateMemberKey(element.name, inner.scope, context),
                    identifier(value),
                  ],
                  context,
                ),
                ifThenElse(
                  field(identifier(change), "isDone"),
                  afterElement(withHeap(field(identifier(change), "heap"))),
                  throwTypeError(withHeap(heap), element, context, frame),
                ),
              );
          return bindOnce(inner, value, initial, defined);
        };
        const withReceiver = { ...allocated, scope: { ...allocated.scope, receiver } };
        const constructor = initializer && getConstructorRun(initializer, context);
        if (
          constructor !== undefined &&
          initializer !== undefined &&
          ts.isNewExpression(initializer)
        ) {
          return translateConstruction(
            initializer,
            constructor,
            withReceiver,
            context,
            frame,
            (after, constructed) => define(after, constructed ?? getUndefined(context)),
          );
        }
        const called = initializer && skipCasts(initializer);
        if (
          called !== undefined &&
          ts.isCallExpression(called) &&
          isStatementResult(called, withReceiver, context)
        ) {
          return translateCallStatement(called, withReceiver, context, frame, (after, value) =>
            define(after, value ?? getUndefined(context)),
          );
        }
        // A field whose value is an assignment runs it as a statement.
        const assignment = initializer === undefined ? undefined : skipCasts(initializer);
        if (
          assignment !== undefined &&
          (isIncrement(assignment) ||
            (ts.isBinaryExpression(assignment) && getWritten(assignment) !== undefined))
        ) {
          return runAssignment(assignment, withReceiver, context, frame, define);
        }
        return define(
          allocated,
          initializer === undefined
            ? getUndefined(context)
            : translateExpression(initializer, withReceiver.scope, context),
        );
      });
    },
    continueWith,
  )(path);
};

// A yield* of an array written in place, which yields each element. In an async generator, each
// element takes two jobs, as the async-from-sync iterator awaits it and the yield* then awaits the
// iterator's result, and the last next takes two more.
const translateDelegatedYield = (
  node: ts.YieldExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const yieldTo = frame.yieldTo;
  const throwTo = frame.throwTo;
  const awaitTo = frame.awaitTo;
  const iterated = node.expression && getCast(node.expression);
  if (
    yieldTo !== undefined &&
    awaitTo === undefined &&
    iterated !== undefined &&
    getKind(iterated, context) !== "sequence" &&
    isIteratedValue(iterated, context) &&
    !hasCall(iterated, context)
  ) {
    return delegateToIterator(node, iterated, yieldTo, path, context, frame, continueWith);
  }
  if (
    yieldTo !== undefined &&
    awaitTo !== undefined &&
    iterated !== undefined &&
    getKind(iterated, context) !== "sequence" &&
    isIteratedValue(iterated, context) &&
    !hasCall(iterated, context)
  ) {
    return delegateToAsyncIterator(
      node,
      iterated,
      yieldTo,
      awaitTo,
      path,
      context,
      frame,
      continueWith,
    );
  }
  if (
    yieldTo === undefined ||
    iterated === undefined ||
    !ts.isArrayLiteralExpression(iterated) ||
    iterated.elements.some((element) => ts.isSpreadElement(element))
  ) {
    throw new TlaTypeScriptError("Unsupported yield", node);
  }
  const sequence = context.names.getFresh("sequence");
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const tick = (current: Path, next: (path: Path) => Formula) =>
    awaitTo === undefined
      ? next(current)
      : awaitTo(current, getUndefined(context), undefined, next, next);
  const delegate = (current: Path, position: number): Formula => {
    if (position === iterated.elements.length) {
      return tick(current, (resumed) => tick(resumed, continueWith));
    }
    const element = iterated.elements[position];
    const value = index(identifier(sequence), [number(position + 1)]);
    const next = (after: Path) => delegate(after, position + 1);
    const mode = { isDelegated: true, isGuarded: true };
    if (awaitTo === undefined) return yieldTo(current, value, next, throwWith, mode);
    return awaitTo(
      current,
      value,
      ts.isOmittedExpression(element) ? undefined : element,
      (fulfilled, settled) =>
        tick(fulfilled, (resumed) => yieldTo(resumed, settled, next, throwWith, mode)),
      (rejected, reason) => tick(rejected, (resumed) => throwWith(resumed, reason)),
    );
  };
  return allocate(iterated, path, context, (inner) =>
    letIn(
      [define(sequence, [], translateExpression(iterated, inner.scope, context))],
      delegate(inner, 0),
    ),
  );
};

const DELEGATION_LIMIT = 3;

// A generator's yield* over an object's iterator, which passes on each of the iterator's results
// until one is done. A return or a throw while it delegates would call the iterator's return or
// throw, which tla-ts doesn't follow.
const delegateToIterator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const failWith = (failed: Path) => throwTypeError(failed, node, context, frame);
  const delegate = (
    current: Path,
    iterator: Expression,
    next: Expression,
    count: number,
  ): Formula =>
    count > DELEGATION_LIMIT
      ? leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
          ]),
        )
      : stepIterator(
          node,
          iterator,
          next,
          current,
          context,
          frame,
          failWith,
          (done, result) =>
            readValue(node, result, done, context, frame, (read, value) =>
              ifThenElse(apply("=", [value, value]), continueWith(read), leaf(boolean(false))),
            ),
          (stepped, result) =>
            yieldTo(
              stepped,
              result,
              (resumed) => delegate(resumed, iterator, next, count + 1),
              throwWith,
              { isDelegated: true, isGuarded: true, isResult: true },
            ),
        );
  return allocate(iterated, path, context, (inner) =>
    openIterator(
      node,
      translateExpression(iterated, inner.scope, context),
      inner,
      context,
      frame,
      failWith,
      (opened, iterator, next) => delegate(opened, iterator, next, 0),
    ),
  );
};

// An async generator's yield* over an object's async iterator, which awaits each of the
// iterator's results and yields its value, without awaiting it again, until one is done. A return
// or a throw while it delegates would call the iterator's return or throw, which tla-ts doesn't
// follow.
const delegateToAsyncIterator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  awaitTo: NonNullable<Frame["awaitTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const failWith = (failed: Path) => throwTypeError(failed, node, context, frame);
  const delegate = (
    current: Path,
    iterator: Expression,
    next: Expression,
    count: number,
  ): Formula =>
    count > DELEGATION_LIMIT
      ? leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
          ]),
        )
      : callMethod(
          node,
          "next",
          next,
          iterator,
          current,
          context,
          frame,
          failWith,
          (called, result) =>
            awaitTo(
              called,
              result,
              undefined,
              (awaited, settled) =>
                bind(awaited, "result", settled, context, (bound, held) =>
                  ifThenElse(
                    useJavaScript(
                      "IsObjectIn",
                      [getHeap(bound.scope, node, context), held],
                      context,
                    ),
                    read(node, held, "done", bound, context, frame, (checked, done) =>
                      readValue(node, held, checked, context, frame, (taken, value) =>
                        ifThenElse(
                          useJavaScript("ToBoolean", [done], context),
                          ifThenElse(
                            apply("=", [value, value]),
                            continueWith(taken),
                            leaf(boolean(false)),
                          ),
                          yieldTo(
                            taken,
                            value,
                            (resumed) => delegate(resumed, iterator, next, count + 1),
                            throwWith,
                            { isDelegated: true, isGuarded: true },
                          ),
                        ),
                      ),
                    ),
                    failWith(bound),
                  ),
                ),
              throwWith,
            ),
        );
  return allocate(iterated, path, context, (inner) =>
    openAsyncIterator(
      node,
      translateExpression(iterated, inner.scope, context),
      inner,
      context,
      frame,
      failWith,
      (opened, iterator, next) => delegate(opened, iterator, next, 0),
    ),
  );
};

const COLLECTIONS: readonly Collection[] = ["Set", "Map", "WeakMap", "WeakSet"];

// A call of a collection's method through call, such as Set.prototype.add.call({}), on a receiver
// that isn't that kind of collection, which the method rejects with a TypeError.
const getMisreceivedCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const receiver = node.arguments.at(0);
  if (
    !ts.isPropertyAccessExpression(callee) ||
    callee.name.text !== "call" ||
    !ts.isPropertyAccessExpression(callee.expression) ||
    receiver === undefined ||
    !node.arguments.slice(1).every(isInertValue)
  ) {
    return undefined;
  }
  const method = callee.expression;
  const owner = method.expression;
  const ownerName =
    ts.isPropertyAccessExpression(owner) && owner.name.text === "prototype"
      ? getBuiltIn(owner.expression, context)
      : getCollection(owner, context);
  const collection = COLLECTIONS.find((candidate) => candidate === ownerName);
  const cast = getCast(receiver);
  const made =
    ts.isNewExpression(cast) && (cast.arguments ?? []).length === 0
      ? getBuiltIn(cast.expression, context)
      : undefined;
  const isSymbol =
    ts.isCallExpression(cast) &&
    getBuiltIn(cast.expression, context) === "Symbol" &&
    cast.arguments.every(ts.isStringLiteral);
  // A primitive, an object that a literal makes, a built-in prototype, or another collection.
  const isOther =
    (!ts.isIdentifier(cast) && isInertValue(cast)) ||
    isUndefinedLiteral(cast, context) ||
    isSymbol ||
    (made !== collection && COLLECTIONS.some((candidate) => candidate === made)) ||
    (ts.isPropertyAccessExpression(cast) &&
      cast.name.text === "prototype" &&
      getBuiltIn(cast.expression, context) !== undefined);
  return collection !== undefined && isOther ? { collection, method: method.name.text } : undefined;
};

// Whether an expression only reads values, once the awaits in it settled: it calls, makes, and
// changes nothing.
const isRead = (node: ts.Node, results: ReadonlyMap<ts.Expression, Expression>): boolean => {
  if (ts.isExpression(node) && results.has(node)) return true;
  const isEffect =
    ts.isCallExpression(node) ||
    ts.isNewExpression(node) ||
    ts.isTaggedTemplateExpression(node) ||
    ts.isDeleteExpression(node) ||
    ts.isYieldExpression(node) ||
    ts.isAwaitExpression(node) ||
    ts.isFunctionLike(node) ||
    ts.isClassLike(node) ||
    ts.isObjectLiteralExpression(node) ||
    ts.isArrayLiteralExpression(node) ||
    ts.isRegularExpressionLiteral(node) ||
    ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      INCREMENT_OPERATORS.has(node.operator)) ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment);
  return (
    !isEffect &&
    ts.forEachChild(node, (child) => !isRead(child, results) || undefined) === undefined
  );
};

const translateExpressionStatement = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  if (ts.isParenthesizedExpression(expression)) {
    return translateExpressionStatement(expression.expression, path, context, frame, continueWith);
  }
  // A comma runs its operands in order, as a for loop's incrementor may.
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.CommaToken
  ) {
    return translateExpressionStatement(expression.left, path, context, frame, (after) =>
      translateExpressionStatement(expression.right, after, context, frame, continueWith),
    );
  }
  // A name that no declaration binds throws a ReferenceError where a statement reads it.
  if (isUnresolved(expression, context)) {
    return throwError("ReferenceError", path, expression, context, frame);
  }
  // A logical assignment reads its value, here a name that no declaration binds, only where its
  // target's value doesn't decide it.
  if (
    ts.isBinaryExpression(expression) &&
    LOGICAL_OPERATORS.has(expression.operatorToken.kind) &&
    ts.isIdentifier(expression.left) &&
    !isUnresolved(expression.left, context) &&
    isUnresolved(expression.right, context)
  ) {
    const kind = expression.operatorToken.kind;
    const current = translateExpression(expression.left, path.scope, context);
    const isTruthy = isBooleanLike(expression.left, context)
      ? current
      : useJavaScript("ToBoolean", [current], context);
    context.prelude.add("Null");
    return ifThenElse(
      kind === ts.SyntaxKind.QuestionQuestionEqualsToken
        ? apply("\\in", [current, set([getUndefined(context), identifier("Null")])])
        : kind === ts.SyntaxKind.BarBarEqualsToken
          ? not(isTruthy)
          : isTruthy,
      throwError("ReferenceError", path, expression.right, context, frame),
      continueWith(path),
    );
  }
  // An assignment of what a call like stack.pop() removes, as a declaration takes it.
  const removed =
    ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? getRemovedValue(expression.right, path, context)
      : undefined;
  if (removed !== undefined && ts.isBinaryExpression(expression)) {
    return continueWith(assign(expression.left, removed.path, context, () => removed.value));
  }
  // JSON.parse of a literal that isn't JSON throws a SyntaxError, and of one that is makes objects
  // that nothing reads.
  const jsonText = getJsonText(expression, context);
  if (jsonText !== undefined) {
    return ifThenElse(
      translateHoldsJson(expression, "parse", path.scope, context),
      "error" in parseJson(jsonText)
        ? throwError("SyntaxError", path, expression, context, frame)
        : continueWith(path),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call JSON.parse where a script replaced it"),
        ]),
      ),
    );
  }
  // An array literal or a new whose spreads iterate objects runs them though the statement drops
  // what they take. A new would then construct with them, which tla-ts doesn't follow.
  const spreads = getIteratedSpreads(expression, context);
  if (spreads !== undefined) {
    return takeSpreads(
      expression,
      spreads.map((spread) => translateExpression(spread, path.scope, context)),
      path,
      context,
      frame,
      (after) =>
        ts.isNewExpression(expression)
          ? leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't construct with the values that a spread takes"),
              ]),
            )
          : continueWith(after),
    );
  }
  if (isUnreachableChange(expression, context)) return continueWith(path);
  // An Object function on a primitive changes nothing, and throws only where it converts null or
  // undefined to an object.
  const primitiveCall = getPrimitiveObjectCall(expression, context);
  if (primitiveCall !== undefined) {
    const value = translateExpression(primitiveCall.argument, path.scope, context);
    context.prelude.add("Null");
    const done = primitiveCall.isCoercing
      ? ifThenElse(
          apply("\\in", [value, set([getUndefined(context), identifier("Null")])]),
          throwTypeError(path, expression, context, frame),
          continueWith(path),
        )
      : continueWith(path);
    // TypeScript can't see a callback assign a variable without a type an object.
    return context.heap === undefined
      ? done
      : ifThenElse(
          useJavaScript("IsRef", [value], context),
          leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't tell what Object.${primitiveCall.method} reads`),
            ]),
          ),
          done,
        );
  }
  // A call's value runs though the statement drops it, so that a getter it reads, which tla-ts
  // can't call, stops the check: TLC would read only a value that something uses.
  const constructor = getConstructorRun(expression, context);
  if (constructor !== undefined) {
    return translateConstruction(expression, constructor, path, context, frame, continueWith);
  }
  if (ts.isCallExpression(expression)) {
    return translateCallStatement(expression, path, context, frame, (after, value) =>
      value === undefined || context.heap === undefined
        ? continueWith(after)
        : ifThenElse(apply("=", [value, value]), continueWith(after), leaf(boolean(false))),
    );
  }
  if (isPromiseConstruction(expression, context)) {
    return translatePromiseConstruction(expression, path, context, frame, continueWith);
  }
  if (isStackConstruction(expression, context)) {
    return translateStackConstruction(expression, path, context, continueWith);
  }
  if (ts.isYieldExpression(expression) && expression.asteriskToken !== undefined) {
    return translateDelegatedYield(expression, path, context, frame, continueWith);
  }
  if (ts.isYieldExpression(expression)) {
    const yielded = expression.expression;
    const called = yielded && getCast(yielded);
    const isCalled =
      called !== undefined &&
      ts.isCallExpression(called) &&
      called.arguments.every((argument) => !hasCall(argument, context));
    if (
      frame.yieldTo === undefined ||
      expression.asteriskToken !== undefined ||
      (yielded !== undefined && !isCalled && hasCall(yielded, context))
    ) {
      throw new TlaTypeScriptError("Unsupported yield", expression);
    }
    const yieldTo = frame.yieldTo;
    const throwTo = frame.throwTo;
    const uncaught = apply("Assert", [boolean(false), string(expression.getText())]);
    const yieldWith = (current: Path, value: Expression | undefined) =>
      yieldTo(
        current,
        value,
        continueWith,
        (rejected, thrown) =>
          throwTo === undefined ? leaf(uncaught) : throwTo(rejected, { value: thrown, uncaught }),
        { isDelegated: false, isGuarded: false, returnRest: frame.exit },
      );
    // A yield of a call yields what the call gives.
    if (isCalled && ts.isCallExpression(called)) {
      return translateCallStatement(called, path, context, frame, (after, value) =>
        yieldWith(after, value ?? getUndefined(context)),
      );
    }
    return allocate(yielded, path, context, (inner) =>
      yieldWith(
        inner,
        yielded === undefined ? undefined : translateExpression(yielded, inner.scope, context),
      ),
    );
  }
  const setter = getAssignedSetter(expression, context);
  const setterKey = ts.isBinaryExpression(expression) ? getAccessKey(expression.left) : undefined;
  if (
    setter !== undefined &&
    setterKey !== undefined &&
    ts.isBinaryExpression(expression) &&
    (ts.isPropertyAccessExpression(expression.left) ||
      ts.isElementAccessExpression(expression.left))
  ) {
    const target = expression.left;
    const object = translateObjectValue(target.expression, path.scope, context);
    // A compound or logical assignment passes the setter what it makes of what the getter gives.
    const current =
      expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ? undefined
        : translateExpression(target, path.scope, context);
    const update = current === undefined ? undefined : getUpdate(expression, path, context);
    if (current !== undefined && update === undefined) {
      throw new TlaTypeScriptError(
        `Unsupported operator: ${expression.operatorToken.getText()}`,
        expression.operatorToken,
      );
    }
    const called =
      current === undefined || update === undefined
        ? path
        : {
            ...path,
            scope: {
              ...path.scope,
              results: new Map([...path.scope.results, [expression.right, update(current)]]),
            },
          };
    const call = ifThenElse(
      isPrivateMember(setter)
        ? translateHasPrivate(setter, target.expression, path.scope, context)
        : apply("=", [
            useJavaScript(
              "SetterOf",
              [getHeap(path.scope, target, context), object, string(setterKey)],
              context,
            ),
            getAccessorValue(setter, context),
          ]),
      inlineBody(
        expression,
        setter,
        [expression.right],
        { value: object, method: setter },
        called,
        context,
        frame,
        (after) => continueWith(after),
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which setter this assignment runs"),
        ]),
      ),
    );
    return current !== undefined && LOGICAL_OPERATORS.has(expression.operatorToken.kind)
      ? ifThenElse(isLogicallyWritten(expression, current, context), call, continueWith(path))
      : call;
  }
  const newAssigned =
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isNewExpression(expression.right)
      ? expression.right
      : undefined;
  if (
    newAssigned !== undefined &&
    isPromiseConstruction(newAssigned, context) &&
    ts.isBinaryExpression(expression)
  ) {
    return translatePromiseConstruction(newAssigned, path, context, frame, (after, value) =>
      assignPatternWith(
        expression,
        expression.left,
        newAssigned,
        value ?? getUndefined(context),
        after,
        context,
        frame,
        continueWith,
      ),
    );
  }
  const constructed =
    ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? expression.right
      : undefined;
  const assignedConstructor = constructed && getConstructorRun(constructed, context);
  if (
    constructed !== undefined &&
    assignedConstructor !== undefined &&
    ts.isBinaryExpression(expression)
  ) {
    return translateConstruction(
      constructed,
      assignedConstructor,
      path,
      context,
      frame,
      (after, value) =>
        assignPatternWith(
          expression,
          expression.left,
          constructed,
          value ?? getUndefined(context),
          after,
          context,
          frame,
          continueWith,
        ),
    );
  }
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isArrayLiteralExpression(expression.left) &&
    isGeneratorType(expression.right, context)
  ) {
    const left = expression.left;
    const taken = takeFromGenerator(
      left,
      expression.right,
      [],
      path,
      context,
      frame,
      (after, values) =>
        assignPatternWith(expression, left, undefined, values, after, context, frame, continueWith),
    );
    if (taken !== undefined) return taken;
  }
  const assignedCall =
    ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? skipCasts(expression.right)
      : undefined;
  if (
    ts.isBinaryExpression(expression) &&
    assignedCall !== undefined &&
    ts.isCallExpression(assignedCall) &&
    isStatementResult(assignedCall, path, context)
  ) {
    const right = assignedCall;
    return translateCallStatement(right, path, context, frame, (after, value) =>
      assignPatternWith(
        expression,
        expression.left,
        right,
        value ?? getUndefined(context),
        after,
        context,
        frame,
        continueWith,
      ),
    );
  }
  // Deleting a property that can't change throws a TypeError, as scripts run in strict mode.
  if (ts.isDeleteExpression(expression)) {
    const deleted = getHeapWrite(expression.expression, path, context);
    if (deleted === undefined) {
      throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
    }
    const heap = useJavaScript("Delete", [deleted.heap, deleted.ref, deleted.key], context);
    return ifThenElse(
      useJavaScript("CanDelete", [deleted.heap, deleted.ref, deleted.key], context),
      shareHeap(
        {
          ...path,
          scope: {
            ...path.scope,
            bindings: new Map([...path.scope.bindings, [deleted.symbol, heap]]),
          },
        },
        context,
        continueWith,
      ),
      throwTypeError(path, expression, context, frame),
    );
  }
  if (isForeignNew(expression, context)) {
    return translateForeignNew(expression, path, context, frame);
  }
  // An object that a statement makes and drops, whose members evaluate nothing, changes nothing.
  if (
    ts.isObjectLiteralExpression(expression) &&
    expression.properties.every(
      (property) =>
        (ts.isMethodDeclaration(property) ||
          ts.isAccessor(property) ||
          (ts.isPropertyAssignment(property) && isLiteral(property.initializer))) &&
        !ts.isComputedPropertyName(property.name),
    )
  ) {
    return continueWith(path);
  }
  // A statement that only reads, such as void await x once x settles, evaluates its value and drops
  // it, so that a getter it reads, which tla-ts can't call, stops the check.
  if (isRead(expression, path.scope.results)) {
    const value = translateExpression(expression, path.scope, context);
    if (context.heap === undefined) return continueWith(path);
    const evaluated = ifThenElse(
      apply("=", [value, value]),
      continueWith(path),
      leaf(boolean(false)),
    );
    // A read that runs a buffer's or a view's getter on another kind of object throws a TypeError.
    const read = skipCasts(expression);
    const isObjectRead =
      (ts.isElementAccessExpression(read) ||
        (ts.isPropertyAccessExpression(read) && !ts.isPrivateIdentifier(read.name))) &&
      (isBuiltInObject(read.expression, context) || getKind(read.expression, context) === "object");
    return isObjectRead
      ? ifThenElse(
          apply("=", [
            useJavaScript(
              "ReadError",
              [
                getHeap(path.scope, read, context),
                translateObjectValue(read.expression, path.scope, context),
                ts.isPropertyAccessExpression(read)
                  ? string(read.name.text)
                  : translatePropertyKey(read.argumentExpression, path.scope, context),
              ],
              context,
            ),
            string("TypeError"),
          ]),
          throwTypeError(path, expression, context, frame),
          evaluated,
        )
      : evaluated;
  }
  // A pattern that writes a property runs the setter that the property holds.
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isArrayLiteralExpression(expression.left) ||
      ts.isObjectLiteralExpression(expression.left)) &&
    getWrittenProperties(expression.left).some(
      (property) => getPropertySetters(property, context).length > 0,
    )
  ) {
    return assignPatternWith(
      expression,
      expression.left,
      expression.right,
      translateExpression(expression.right, path.scope, context),
      path,
      context,
      frame,
      continueWith,
    );
  }
  // A logical assignment to a property writes it only where the property's value doesn't decide
  // the result, so that a property that can't change doesn't throw.
  if (
    ts.isBinaryExpression(expression) &&
    LOGICAL_OPERATORS.has(expression.operatorToken.kind) &&
    !ts.isIdentifier(expression.left)
  ) {
    return ifThenElse(
      isLogicallyWritten(
        expression,
        translateExpression(expression.left, path.scope, context),
        context,
      ),
      translateWriteStatement(expression, path, context, frame, continueWith),
      continueWith(path),
    );
  }
  return translateWriteStatement(expression, path, context, frame, continueWith);
};

// Runs an assignment or an increment, which writes a variable or a property.
const translateWriteStatement = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const assigned = getAssignedPath(expression, path, context);
  if (assigned === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  // A write to a property that can't change throws a TypeError, as scripts run in strict mode.
  const written = ts.isBinaryExpression(expression)
    ? expression.left
    : ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)
      ? expression.operand
      : undefined;
  const write = written === undefined ? undefined : getHeapWrite(written, path, context);
  // A write to a property of null or undefined throws a TypeError.
  const receiver =
    written !== undefined &&
    (ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written)) &&
    isMaybeNullish(context.checker.getTypeAtLocation(skipCasts(written.expression)))
      ? skipCasts(written.expression)
      : undefined;
  const throwOnNullish = (rest: Formula) => {
    if (receiver === undefined) return rest;
    context.prelude.add("Null");
    return ifThenElse(
      apply("\\in", [
        write?.ref ?? translateExpression(receiver, path.scope, context),
        set([getUndefined(context), identifier("Null")]),
      ]),
      throwTypeError(path, expression, context, frame),
      rest,
    );
  };
  if (write === undefined) {
    return throwOnNullish(
      forceHeap(path.scope, assigned.scope, continueWith(assigned), leaf(boolean(false)), context),
    );
  }
  const translateWrite = (next: (path: Path) => Formula) =>
    throwOnNullish(
      ifThenElse(
        useJavaScript("CanPut", [write.heap, write.ref, write.key], context),
        shareHeap(assigned, context, next),
        throwTypeError(path, expression, context, frame),
      ),
    );
  // A write of __proto__ runs Object.prototype's setter where the object inherits it.
  const heapSymbol = context.heap;
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    written !== undefined &&
    getAccessKey(written) === "__proto__" &&
    heapSymbol !== undefined
  ) {
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    return ifThenElse(
      useJavaScript("IsProtoWrite", [write.heap, write.ref, write.key], context),
      bindOnce(
        path,
        changeName,
        useJavaScript(
          "ProtoSet",
          [write.heap, write.ref, translateExpression(expression.right, path.scope, context)],
          context,
        ),
        ifThenElse(
          apply("=", [field(change, "error"), string("")]),
          shareHeap(
            {
              ...path,
              scope: {
                ...path.scope,
                bindings: new Map([...path.scope.bindings, [heapSymbol, field(change, "heap")]]),
              },
            },
            context,
            continueWith,
          ),
          throwTypeError(path, expression, context, frame),
        ),
      ),
      translateWrite(continueWith),
    );
  }
  // A write to a property whose setter tla-ts can't resolve runs the setter it finds there.
  const setters = getSetters(expression, context).filter((setter) => !frame.inlining.has(setter));
  if (
    !ts.isBinaryExpression(expression) ||
    expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
    setters.length === 0
  ) {
    return translateWrite(continueWith);
  }
  const right = expression.right;
  return translateJoined(expression, path, context, continueWith, (next) =>
    setters.reduceRight((rest, setter) => {
      const value = getCandidateValue(setter, context);
      return value === undefined
        ? rest
        : ifThenElse(
            apply("=", [
              useJavaScript(
                "CodeOf",
                [
                  write.heap,
                  useJavaScript("SetterOf", [write.heap, write.ref, write.key], context),
                ],
                context,
              ),
              value,
            ]),
            inlineBody(
              expression,
              setter,
              [right],
              { value: write.ref, method: setter },
              path,
              context,
              frame,
              next,
            ),
            rest,
          );
    }, translateWrite(next)),
  );
};

const isMaybeNullish = (type: ts.Type): boolean =>
  type.isUnion()
    ? type.types.some(isMaybeNullish)
    : (type.flags &
        (ts.TypeFlags.Null |
          ts.TypeFlags.Undefined |
          ts.TypeFlags.Void |
          ts.TypeFlags.Any |
          ts.TypeFlags.Unknown)) !==
      0;

// Throws the TypeError of a pattern that destructures null or undefined, which a statement throws
// though nothing reads what the pattern binds.
const throwOnDestructured = (
  scope: Scope,
  path: Path,
  context: Context,
  frame: Frame,
  rest: Formula,
): Formula => {
  const destructured = scope.destructured ?? [];
  if (destructured.length === 0) return rest;
  context.prelude.add("Null");
  return ifThenElse(
    junction(
      "Or",
      destructured.map((entry) => isNullish(entry.value, context)),
    ),
    throwTypeError(path, destructured[0].pattern, context, frame),
    rest,
  );
};

const isCatchParameter = (node: ts.Node, name: string): boolean => {
  if (ts.isSourceFile(node) || ts.isFunctionLike(node)) return false;
  const parameter = ts.isCatchClause(node) ? node.variableDeclaration?.name : undefined;
  return (
    (parameter !== undefined && ts.isIdentifier(parameter) && parameter.text === name) ||
    isCatchParameter(node.parent, name)
  );
};

const rejectCatchRedeclaration = (declaration: ts.VariableDeclaration) => {
  if (
    (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0 &&
    ts.isIdentifier(declaration.name) &&
    isCatchParameter(declaration.parent, declaration.name.text)
  ) {
    throw new TlaTypeScriptError("Name this var apart from the catch parameter", declaration);
  }
};

// Binds each declared local to a LET definition. A let can change later, and a const can't.
// Whether a function, or one it calls, makes or reads objects, which only statements can do.
const usesHeap = (node: ts.Node, context: Context, visited: Set<ts.Node>): boolean => {
  if (ts.isTypeNode(node)) return false;
  if (ts.isObjectLiteralExpression(node) || isAllocation(node, context)) return true;
  const isRead =
    (ts.isIdentifier(node) && getKind(node, context) === "object") ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      getKind(node.expression, context) === "object") ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      getKind(node.right, context) === "object") ||
    (ts.isObjectBindingPattern(node) &&
      isHeapPattern(context.checker.getTypeAtLocation(node), node, context));
  if (isRead) return true;
  if (ts.isCallExpression(node)) {
    const callee = getCallee(node.expression, context);
    if (callee !== undefined && !visited.has(callee)) {
      visited.add(callee);
      if (usesHeap(callee, context, visited)) return true;
    }
    // A call through a variable that holds one of several functions branches between them, which
    // only statements can do.
    const declaration = getSymbol(getCast(node.expression), context.checker)?.valueDeclaration;
    if (
      callee === undefined &&
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      !declaration.getSourceFile().isDeclarationFile &&
      getFunctionCandidates(getCast(node.expression), context).length > 0
    ) {
      return true;
    }
  }
  return ts.forEachChild(node, (child) => usesHeap(child, context, visited) || undefined) ?? false;
};

// A call to a function that uses objects, which inlines as statements that give its result.
const isHeapCall = (
  node: ts.Expression,
  path: Path,
  context: Context,
): node is ts.CallExpression => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return false;
  // A method runs as statements only where it, or what it calls, makes objects, as a statement
  // allocates them.
  const isMaking = (body: ts.Node, visited: Set<ts.Node>): boolean =>
    getAllocated(body, context).length > 0 ||
    findNodes(body, ts.isCallExpression).some((call) => {
      const callee = isMethodCall(call)
        ? getCalledMethod(call.expression, context)?.method
        : getCallee(call.expression, context);
      if (callee?.body === undefined || visited.has(callee)) return false;
      visited.add(callee);
      return isMaking(callee.body, visited);
    });
  if (isMethodCall(node)) {
    const method = getCalledMethod(node.expression, context)?.method;
    return method?.body !== undefined && isMaking(method.body, new Set([method]));
  }
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
  return callee?.body !== undefined && usesHeap(callee, context, new Set());
};

// The functions that a call through a value may run, where tla-ts can't tell which one it names:
// those that no other function encloses, whose type TypeScript lets the callee hold. The call
// branches on its callee's value between them.
const getDispatched = (
  node: ts.CallExpression,
  functions: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
) => {
  const callee = getCast(node.expression);
  const symbol = getSymbol(callee, context.checker);
  const declarations = symbol?.declarations ?? [];
  const assigned = symbol && functions.get(symbol);
  if (
    context.heap === undefined ||
    declarations.length === 0 ||
    declarations.some((declaration) => declaration.getSourceFile().isDeclarationFile) ||
    (assigned === undefined ? getCallee(callee, context) !== undefined : isPlain(assigned)) ||
    getCalledMethod(callee, context) !== undefined ||
    getFunctionOfKind(callee, context, isAnyGenerator) !== undefined ||
    getFunctionOfKind(callee, context, isAsyncFunction) !== undefined ||
    // A call of a key that may hold a built-in method matches its functions as an expression, or
    // runs the method that changes its receiver as a statement.
    isUntypedStoredCall(node, context)
  ) {
    return undefined;
  }
  const dispatched = getFunctionCandidates(callee, context);
  return dispatched.length > 0 ? dispatched : undefined;
};

// A call to a function or a method that changes state, which inlines as statements that give its
// result.
const isStateCall = (node: ts.CallExpression, path: Path, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ??
    getCallee(node.expression, context) ??
    getCalledMethod(node.expression, context)?.method;
  return (
    callee?.body !== undefined && changesState(callee, callee.body, context, new Set([callee]))
  );
};

// A call to a function whose body makes a promise or calls an async function, which only
// statements can run.
const isPromiseMaking = (node: ts.CallExpression, path: Path, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
  return (
    callee?.body !== undefined &&
    (findNodes(callee.body, ts.isCallExpression).some(
      (call) =>
        ts.findAncestor(call.parent, ts.isFunctionLike) === callee &&
        (isPromiseCall(call, context) ||
          getAsyncCallee(call.expression, path, context) !== undefined),
    ) ||
      findNodes(callee.body, ts.isNewExpression).some(
        (construction) =>
          ts.findAncestor(construction.parent, ts.isFunctionLike) === callee &&
          isPromiseConstruction(construction, context),
      ))
  );
};

// A call whose value only statements can compute, which an assignment or a declaration takes.
const isStatementResult = (node: ts.CallExpression, path: Path, context: Context) =>
  getCalledError(node, context) === undefined &&
  (isPromiseMaking(node, path, context) ||
    getBound(node.expression, context) !== undefined ||
    getDateCall(node, context) !== undefined ||
    getHeapRegExpCall(node, context) !== undefined ||
    getURICall(node, context)?.isDecode === true ||
    getViewCall(node, context) !== undefined ||
    getGetterCall(node, context) !== undefined ||
    getStackCall(node, context) !== undefined ||
    getHeapArrayChange(node, context) !== undefined ||
    isStoredStatement(node, context) ||
    getHeapSetOrMapChange(node, context) !== undefined ||
    getArrayIteratorCall(node, context) !== undefined ||
    getStringCall(node, context) !== undefined ||
    isDescriptorsRead(node, context) ||
    isOwnValuesRead(node, context) ||
    isRevoke(node, context) ||
    (isObjectChange(node, context) &&
      node.expression.name.text !== "construct" &&
      (isReflectDefinition(node) ||
        isHeapType(context.checker.getTypeAtLocation(node), context))) ||
    isGeneratorStep(node, context) ||
    getGeneratorMethod(node, context) !== undefined ||
    isPromiseCall(node, context) ||
    getCreatedGenerator(node, path, context) !== undefined ||
    getAsyncCallee(node.expression, path, context) !== undefined ||
    getCalledMethod(node.expression, context, isAsyncFunction) !== undefined ||
    isHeapCall(node, path, context) ||
    getLoopCall(node, path, context) !== undefined ||
    isStateCall(node, path, context) ||
    getDispatched(node, path.scope.functions, context) !== undefined);

// The expression that parentheses and casts wrap.
export const getCast = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) || ts.isAsExpression(node) ? getCast(node.expression) : node;

// Whether a function has a try statement of its own, which only statements can run.
const hasTry = (node: ts.Node): boolean =>
  ts.isTryStatement(node) || (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasTry) ?? false));

// A call that only statements can run, which a call that evaluates it first runs before itself.
const isStatementCall = (node: ts.CallExpression, path: Path, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
  return (
    isStatementResult(node, path, context) ||
    (callee?.body !== undefined && ts.forEachChild(callee.body, hasTry) === true)
  );
};

// The values that new of a typed array takes from an iterator that a script gives, before tla-ts
// stops following it.
const TYPED_ARRAY_TAKE_LIMIT = 8;

// new of a typed array of a value whose type doesn't tell whether it's an object that a script's
// iterator iterates, which only statements can run.
const isIteratedTypedArray = (node: ts.Expression, context: Context): node is ts.NewExpression => {
  const first = ts.isNewExpression(node) ? node.arguments?.at(0) : undefined;
  return (
    first !== undefined &&
    (getNewBuffer(node, context) ?? []).some((buffer) => TYPED_ARRAYS.has(buffer)) &&
    (context.checker.getTypeAtLocation(getCast(first)).flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0
  );
};

// Makes a typed array of an object's iterator's values, as the constructor takes them through the
// object's @@iterator method where a script gives it, or else of its first argument.
const translateIteratedTypedArray = (
  node: ts.NewExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula =>
  allocateAll(
    getAllocated(node, context).filter(
      (inner) => inner !== node && !path.scope.allocated.has(inner),
    ),
    path,
    context,
    (allocated) => {
      const values = (node.arguments ?? []).map((value) =>
        translateExpression(value, allocated.scope, context),
      );
      const make = (current: Path, first: Expression) => {
        const heapSymbol = context.heap;
        const madeName = context.names.getFresh("heap");
        const made = identifier(madeName);
        const after =
          heapSymbol === undefined
            ? current
            : {
                ...current,
                scope: {
                  ...current.scope,
                  bindings: new Map([...current.scope.bindings, [heapSymbol, made]]),
                },
              };
        return bindOnce(
          current,
          madeName,
          translateNewBufferOf(
            node,
            getHeap(current.scope, node, context),
            tuple([first, ...values.slice(1)]),
            current.scope,
            context,
          ),
          continueWith(after, useJavaScript("Allocated", [made], context)),
        );
      };
      const throwWith = (after: Path) => throwTypeError(after, node, context, frame);
      const step = (
        current: Path,
        iterator: Expression,
        next: Expression,
        taken: Expression[],
      ): Formula =>
        taken.length > TYPED_ARRAY_TAKE_LIMIT
          ? leaf(
              apply("Assert", [
                boolean(false),
                string(
                  `tla-ts can't take more than ${TYPED_ARRAY_TAKE_LIMIT} values into a typed array`,
                ),
              ]),
            )
          : stepIterator(
              node,
              iterator,
              next,
              current,
              context,
              frame,
              throwWith,
              (done) => make(done, tuple(taken)),
              (stepped, result) =>
                readValue(node, result, stepped, context, frame, (read, value) =>
                  step(read, iterator, next, [...taken, value]),
                ),
            );
      return ifThenElse(
        useJavaScript(
          "IteratesScriptMethod",
          [getHeap(allocated.scope, node, context), values[0]],
          context,
        ),
        openIterator(
          node,
          values[0],
          allocated,
          context,
          frame,
          throwWith,
          (opened, iterator, next) => step(opened, iterator, next, []),
        ),
        make(allocated, values[0]),
      );
    },
  );

// Makes the objects that a node's object literals create, before the statement that evaluates
// them runs, since an expression can't change the heap. A conversion or a call that ran already
// made those of its operands.
export const allocate = (
  node: ts.Node | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula =>
  allocateAll(
    node === undefined
      ? []
      : getAllocated(node, context).filter(
          (allocation) =>
            ts.findAncestor(allocation.parent, (ancestor) =>
              ts.isFunctionLike(ancestor)
                ? "quit"
                : ts.isExpression(ancestor) &&
                  path.scope.results.has(ancestor) &&
                  (getConversion(ancestor, context) !== undefined || ts.isCallExpression(ancestor)),
            ) === undefined,
        ),
    path,
    context,
    continueWith,
  );

const allocateAll = (
  allocations: ts.Node[],
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const symbol = context.heap;
  if (symbol === undefined || allocations.length === 0) return continueWith(path);
  const allocated = allocations.reduce<Bound>(
    (current, allocation) => {
      const name = context.names.getFresh("heap");
      const ref = translateAllocatedValue(allocation, identifier(name), current.scope, context);
      return {
        definitions: [
          ...current.definitions,
          define(name, [], translateAllocated(allocation, current.scope, context)),
        ],
        scope: {
          ...current.scope,
          bindings: new Map([...current.scope.bindings, [symbol, identifier(name)]]),
          allocated: new Map([...current.scope.allocated, [allocation, ref]]),
        },
      };
    },
    { definitions: [], scope: path.scope },
  );
  return allocated.definitions.reduceRight(
    (body, definition) => bindOnce(path, definition.name, definition.body, body),
    continueWith({ ...path, scope: allocated.scope }),
  );
};

// Evaluates a heap, or a change to one, where a statement makes it, as TLA+ evaluates definitions
// only where they're used, so that a change tla-ts can't make stops the run there rather than once
// the heap is read. An action binds it with \E, since it evaluates a LET definition that may call
// Assert again at each reference, and each heap refers to the one before it. A loop's body gives
// values rather than a formula, so it forces a LET definition in an IF instead.
export const bindOnce = (path: Path, name: string, value: Expression, rest: Formula) =>
  path.isLooping
    ? letIn(
        [define(name, [], value)],
        ifThenElse(apply("=", [identifier(name), identifier(name)]), rest, leaf(boolean(false))),
      )
    : bindValue(name, value, rest);

// Throws the TypeError that JavaScript throws where a change to an object fails.
export const throwError = (
  name: "TypeError" | "RangeError" | "ReferenceError" | "SyntaxError" | "URIError",
  path: Path,
  node: ts.Node,
  context: Context,
  frame: Frame,
) => {
  const uncaught = apply("Assert", [boolean(false), string(name)]);
  return frame.throwTo === undefined
    ? leaf(uncaught)
    : frame.throwTo(path, { value: translateEngineError(name, node, context), uncaught });
};

export const throwTypeError = (path: Path, node: ts.Node, context: Context, frame: Frame) =>
  throwError("TypeError", path, node, context, frame);

// Names the heap after a statement changes it, so that later statements share it.
const shareHeap = (path: Path, context: Context, continueWith: (path: Path) => Formula) => {
  const symbol = context.heap;
  const heap = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
  if (symbol === undefined || heap === undefined || heap.kind === "Identifier") {
    return continueWith(path);
  }
  const name = context.names.getFresh("heap");
  return bindOnce(
    path,
    name,
    heap,
    continueWith({
      ...path,
      scope: {
        ...path.scope,
        bindings: new Map([...path.scope.bindings, [symbol, identifier(name)]]),
      },
    }),
  );
};

// A new of a value that isn't a class that the script declares, such as a built-in method, which
// throws a TypeError if the value isn't a constructor. tla-ts can't call one that is. Its arguments
// run first, so they must be values that can't throw.
const isForeignNew = (node: ts.Node, context: Context): node is ts.NewExpression =>
  ts.isNewExpression(node) &&
  context.heap !== undefined &&
  getNewClass(node, context) === undefined &&
  getErrorClass(getSymbol(node.expression, context.checker), context.checker) === undefined &&
  !["Set", "Map"].includes(node.expression.getText()) &&
  (node.arguments ?? []).every(isInertValue) &&
  !isProxyOperation(node, context);

const translateForeignNew = (
  expression: ts.NewExpression,
  path: Path,
  context: Context,
  frame: Frame,
) =>
  ifThenElse(
    useJavaScript(
      "IsConstructor",
      [
        getHeap(path.scope, expression, context),
        translateExpression(getCast(expression.expression), path.scope, context),
      ],
      context,
    ),
    leaf(apply("Assert", [boolean(false), string("tla-ts can't call this constructor")])),
    throwTypeError(path, expression, context, frame),
  );

export const translateDeclarations = (
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  if (declarations.length === 0) return continueWith(path);
  const declaration = declarations[0];
  rejectCatchRedeclaration(declaration);
  const initializer = declaration.initializer;
  // A declaration that a new of a function that TypeScript gives no construct signature
  // initializes throws before it binds anything.
  if (initializer !== undefined && isForeignNew(initializer, context)) {
    const callee = context.checker.getTypeAtLocation(getCast(initializer.expression));
    if (
      (callee.flags & ts.TypeFlags.Any) === 0 &&
      callee.getCallSignatures().length > 0 &&
      callee.getConstructSignatures().length === 0
    ) {
      return translateForeignNew(initializer, path, context, frame);
    }
  }
  if (isInlined(initializer, context)) {
    // The variables that a factory call makes, which the function that it returns reads.
    const factoryScope = bindFactory(declaration, path.scope, context);
    return (getFactoryCall(initializer, context)?.variables ?? []).reduceRight(
      (next: (current: Path) => Formula, variable) => (current: Path) =>
        bindDeclaration(
          [variable],
          variable.initializer === undefined
            ? getUndefined(context)
            : translateExpression(variable.initializer, factoryScope, context),
          current,
          context,
          frame,
          next,
        ),
      (current: Path) =>
        translateDeclarations(
          declarations.slice(1),
          { ...current, scope: initialize(current.scope, declaration, context) },
          context,
          frame,
          continueWith,
        ),
    )(path);
  }
  if (
    initializer !== undefined &&
    ts.isClassExpression(initializer) &&
    isHeapClass(initializer, context)
  ) {
    return allocate(initializer, path, context, (allocated) => {
      const ref = allocated.scope.allocated.get(initializer);
      if (ref === undefined) throw new TlaTypeScriptError("Unsupported class", initializer);
      return translateElements(
        getStaticElements(initializer),
        ref,
        allocated,
        context,
        frame,
        (after) => bindDeclaration(declarations, ref, after, context, frame, continueWith),
      );
    });
  }
  if (
    initializer !== undefined &&
    ts.isArrayBindingPattern(declaration.name) &&
    isGeneratorType(initializer, context)
  ) {
    const taken = takeFromGenerator(
      declaration.name,
      initializer,
      [],
      path,
      context,
      frame,
      (after, values) => bindDeclaration(declarations, values, after, context, frame, continueWith),
    );
    if (taken !== undefined) return taken;
  }
  // A call that only statements can run, as the first argument of the call whose result the
  // declaration reads, runs first, where the callee runs no call of its own and, unless it's a
  // built-in's method, doesn't read what the argument changes.
  const getReadCall = (node: ts.Expression): ts.Expression => {
    const read = skipCasts(node);
    return ts.isPropertyAccessExpression(read) ? getReadCall(read.expression) : read;
  };
  const outer = initializer && getReadCall(initializer);
  const first =
    outer !== undefined && ts.isCallExpression(outer)
      ? getRootCall(outer.arguments.at(0))
      : undefined;
  if (
    outer !== undefined &&
    ts.isCallExpression(outer) &&
    first !== undefined &&
    ts.isCallExpression(first) &&
    !path.scope.results.has(first) &&
    !isGeneratorType(first, context) &&
    isStatementCall(first, path, context) &&
    findNodes(outer.expression, ts.isCallExpression).length === 0 &&
    ((ts.isPropertyAccessExpression(outer.expression) &&
      getBuiltIn(outer.expression.expression, context) !== undefined) ||
      getEarlyReads([first], [outer.expression], path, context).length === 0)
  ) {
    return translateCallStatement(first, path, context, frame, (after, value) =>
      translateDeclarations(
        declarations,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [first, value ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
        continueWith,
      ),
    );
  }
  const defaulted = runCertainDefault(
    [declaration.name],
    getKnownDefaults(declaration.name, initializer, undefined, context),
    initializer === undefined ? [] : [initializer],
    path,
    context,
    frame,
    (after) => translateDeclarations(declarations, after, context, frame, continueWith),
  );
  if (defaulted !== undefined) return defaulted;
  // A pattern's default makes its objects whether or not the pattern evaluates it, as making an
  // object that nothing reads can't be seen.
  const defaults = getAllocated(declaration.name, context).filter(
    (allocation) => !path.scope.allocated.has(allocation),
  );
  if (defaults.length > 0) {
    return allocateAll(defaults, path, context, (allocated) =>
      translateDeclarations(declarations, allocated, context, frame, continueWith),
    );
  }
  const iterated = initializer && skipCasts(initializer);
  if (iterated !== undefined && isIteratedTypedArray(iterated, context)) {
    return translateIteratedTypedArray(iterated, path, context, frame, (after, value) =>
      bindDeclaration(declarations, value, after, context, frame, continueWith),
    );
  }
  return allocate(initializer, path, context, (allocated) => {
    const constructed = initializer && skipCasts(initializer);
    if (constructed !== undefined && isStackConstruction(constructed, context)) {
      return translateStackConstruction(constructed, allocated, context, (after, value) =>
        bindDeclaration(
          declarations,
          value ?? getUndefined(context),
          after,
          context,
          frame,
          continueWith,
        ),
      );
    }
    if (constructed !== undefined && isPromiseConstruction(constructed, context)) {
      return translatePromiseConstruction(constructed, allocated, context, frame, (after, value) =>
        bindDeclaration(
          declarations,
          value ?? getUndefined(context),
          after,
          context,
          frame,
          continueWith,
        ),
      );
    }
    const constructor = initializer && getConstructorRun(initializer, context);
    if (constructor !== undefined && initializer !== undefined) {
      return translateConstruction(
        initializer,
        constructor,
        allocated,
        context,
        frame,
        (after, value) =>
          bindDeclaration(
            declarations,
            value ?? getUndefined(context),
            after,
            context,
            frame,
            continueWith,
          ),
      );
    }
    const called = initializer && skipCasts(initializer);
    if (
      called !== undefined &&
      ts.isCallExpression(called) &&
      isStatementResult(called, allocated, context)
    ) {
      return translateCallStatement(called, allocated, context, frame, (after, value) =>
        bindDeclaration(
          declarations,
          value ?? getUndefined(context),
          after,
          context,
          frame,
          continueWith,
        ),
      );
    }
    const removed = initializer && getRemovedValue(initializer, allocated, context);
    const value =
      removed?.value ??
      (initializer === undefined
        ? getUndefined(context)
        : translatePatternSource(declaration.name, initializer, allocated, context));
    // JavaScript evaluates a declaration where it runs, and TLA+ a LET definition only where it's
    // read, so a declaration whose value may throw or stop evaluates it here.
    if (initializer !== undefined && !isInertValue(initializer)) {
      const name = context.names.getFresh("value");
      const after = removed?.path ?? allocated;
      return bindOnce(
        after,
        name,
        value,
        bindDeclaration(declarations, identifier(name), after, context, frame, continueWith),
      );
    }
    return bindDeclaration(
      declarations,
      value,
      removed?.path ?? allocated,
      context,
      frame,
      continueWith,
    );
  });
};

const bindDeclaration = (
  declarations: readonly ts.VariableDeclaration[],
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const declaration = declarations[0];
  // A pattern on a proxy runs its traps for each key it reads before it binds them.
  if (
    ts.isObjectBindingPattern(declaration.name) &&
    isProxyPattern(declaration.name, path, context)
  ) {
    return readProxyPattern(declaration.name, path, context, frame, (after) =>
      bindDeclaration(declarations, value, after, context, frame, continueWith),
    );
  }
  // A pattern runs the getters of the properties it reads before it binds them.
  if (isGetterPattern(declaration.name, path, context)) {
    const name = context.names.getFresh("value");
    return bindOnce(
      path,
      name,
      value,
      readPatternGetters(declaration.name, identifier(name), path, context, frame, (after) =>
        bindDeclaration(declarations, identifier(name), after, context, frame, continueWith),
      ),
    );
  }
  const taken =
    ts.isArrayBindingPattern(declaration.name) &&
    takeFromIterator(declaration.name, value, path, context, frame, (after, values) =>
      bindDeclaration(declarations, values, after, context, frame, continueWith),
    );
  if (taken) return taken;
  // A reference to an object that the statement made binds without a definition, so that code
  // that follows the object by its reference, such as a promise's, finds it.
  const isReference =
    value.kind === "Apply" &&
    value.operator === "Allocated" &&
    value.args.every((argument) => argument.kind === "Identifier");
  const bound =
    isReference && ts.isIdentifier(declaration.name)
      ? { definitions: [], scope: bindPatternInline(declaration.name, value, path.scope, context) }
      : bindPattern(declaration.name, value, path.scope, context);
  const symbol = ts.isIdentifier(declaration.name)
    ? getSymbol(declaration.name, context.checker)
    : undefined;
  // A constant's object outside the heap is a value, which changing in place rebinds.
  const isChangeable =
    (declaration.parent.flags & ts.NodeFlags.Const) === 0 ||
    context.heap === undefined ||
    (ts.isIdentifier(declaration.name) &&
      ["sequence", "set", "map"].includes(getKind(declaration.name, context)));
  const mutable =
    isChangeable && symbol !== undefined ? new Set([...path.mutable, symbol]) : path.mutable;
  const rest = translateDeclarations(
    declarations.slice(1),
    {
      ...path,
      scope: initialize({ ...bound.scope, destructured: undefined }, declaration, context),
      mutable,
    },
    context,
    frame,
    continueWith,
  );
  // A declaration's value runs though nothing reads it, as do the properties that its pattern
  // reads, so that a getter it reads, which tla-ts can't call, stops the check.
  const named = (symbol && bound.scope.bindings.get(symbol)) ?? value;
  return letIn(
    bound.definitions,
    throwOnDestructured(
      bound.scope,
      path,
      context,
      frame,
      context.heap === undefined
        ? rest
        : ifThenElse(
            apply("=", [named, named]),
            forceHeap(path.scope, bound.scope, rest, leaf(boolean(false)), context),
            leaf(boolean(false)),
          ),
    ),
  );
};

// The variables, and the heap, that a node may change. An error's identity is a new empty object,
// which changes no object that exists before it, so isIdentityIgnored leaves it out.
const NO_FUNCTIONS = new Map<ts.Symbol, FunctionNode>();

// What running a node changes, apart from what the functions that it runs change.
interface Effects {
  // The names that it assigns, and the heap where it changes the heap other than by making an error.
  changed: ts.Symbol[];
  // Whether it makes an error, which changes the heap unless the caller ignores its identity.
  isErrorMade: boolean;
  // The functions that it runs.
  called: ts.Node[];
  // The parameters that it calls or passes, which a path may bind to functions.
  parameters: ts.Symbol[];
}

const getEffects = (
  node: ts.Node,
  functions: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
): Effects => {
  const getFunctionNode = (expression: ts.Expression) => {
    const symbol = getSymbol(expression, context.checker);
    return (
      (symbol && functions.get(symbol)) ??
      getCallee(expression, context) ??
      getFunctionOfKind(expression, context, isAnyGenerator) ??
      getFunctionOfKind(expression, context, isAsyncFunction) ??
      getCalledMethod(expression, context)?.method ??
      getCalledMethod(expression, context, isAnyGenerator)?.method ??
      getCalledMethod(expression, context, isAsyncFunction)?.method
    );
  };
  const written =
    ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer)
      ? node.initializer
      : getWritten(node);
  // A write to a property of an object in the heap changes the heap, not the name that holds it.
  const assigned =
    written === undefined
      ? []
      : getWrittenRoots(written).flatMap((root) => {
          const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
          const access = ts.findAncestor(
            root,
            (ancestor) =>
              ts.isPropertyAccessExpression(ancestor) ||
              ts.isElementAccessExpression(ancestor) ||
              ancestor === written,
          );
          const isProperty =
            access !== undefined &&
            (ts.isPropertyAccessExpression(access) || ts.isElementAccessExpression(access)) &&
            getKind(root, context) === "object";
          return symbol !== undefined && !isProperty ? [symbol] : [];
        });
  const isObjectMade = isMade(node, context);
  const isErrorMade = isObjectMade && isNewError(node, context);
  // An operation that converts an object runs its valueOf and toString methods.
  const conversions =
    ts.isExpression(node) && getConversion(node, context) !== undefined
      ? getConversionFunctions(node, context)
      : undefined;
  // A definition that reads its descriptor's fields, a read of a key with getters, or an
  // operation on a proxy, which runs its traps, runs them.
  const getters = [
    ...getTrapFunctions(node, context),
    ...getDescriptorGetters(node, context),
    ...getOwnValuesGetters(node, context),
    ...getReadFunctions(node, context),
    ...getLoopGetters(node, context),
  ];
  // A pattern that destructures an object, or a for-of, a spread, or a yield* that iterates one,
  // runs the functions of the object's iterator.
  const isIterated =
    (ts.isArrayBindingPattern(node) && isIteratedPattern(node, context)) ||
    ((ts.isSpreadElement(node) ||
      (ts.isYieldExpression(node) && node.asteriskToken !== undefined)) &&
      node.expression !== undefined &&
      getKind(node.expression, context) !== "sequence" &&
      isIteratedValue(node.expression, context)) ||
    (ts.isForOfStatement(node) &&
      getKind(node.expression, context) !== "sequence" &&
      isIteratedValue(node.expression, context));
  // A DisposableStack's method may run the functions that the stacks dispose with.
  const isStackCall = getStackCall(node, context) !== undefined;
  // A using declaration runs the dispose methods, and their getters, that the script writes.
  const isUsing = ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0;
  const isHeapChanged =
    getArgumentsOwner(node, context.checker) !== undefined ||
    (isObjectMade && !isErrorMade) ||
    (ts.isBindingElement(node) &&
      (context.heapCollections.has(node) ||
        (node.dotDotDotToken !== undefined && ts.isObjectBindingPattern(node.parent)))) ||
    ts.isObjectLiteralExpression(node) ||
    ts.isDeleteExpression(node) ||
    isObjectChange(node, context) ||
    isRevoke(node, context) ||
    isProxyOperation(node, context) ||
    getDateCall(node, context) !== undefined ||
    getHeapRegExpCall(node, context) !== undefined ||
    getViewCall(node, context) !== undefined ||
    getHeapArrayChange(node, context) !== undefined ||
    isStoredChange(node, context) ||
    getArrayIteratorCall(node, context) !== undefined ||
    getHeapSetOrMapChange(node, context) !== undefined ||
    isAllocation(node, context) ||
    (written !== undefined &&
      (ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written))) ||
    conversions !== undefined ||
    getters.length > 0 ||
    isIterated ||
    isStackCall ||
    isStackConstruction(node, context) ||
    isUsing;
  const callees = ts.isCallExpression(node) ? [node.expression, ...node.arguments] : [];
  return {
    changed: [...assigned, ...(context.heap !== undefined && isHeapChanged ? [context.heap] : [])],
    isErrorMade: context.heap !== undefined && isErrorMade,
    called: [
      ...(conversions ?? []),
      ...getters,
      ...(isIterated ? getIteratorFunctions(node, context) : []),
      ...(isStackCall ? getStackFunctions(node, context) : []),
      ...(isUsing
        ? [
            ...getWrittenFunctions(node, "@@dispose", context),
            ...getWrittenFunctions(node, "@@asyncDispose", context),
          ]
        : []),
      ...callees.flatMap((callee) => getFunctionNode(callee) ?? []),
      ...(ts.isCallExpression(node) && getFunctionNode(node.expression) === undefined
        ? (getDispatched(node, functions, context) ?? [])
        : []),
      ...(written === undefined
        ? []
        : getWrittenProperties(written).flatMap((property) =>
            getPropertySetters(property, context),
          )),
    ],
    parameters: [...callees, ...callees.slice(0, 1).map((callee) => getCast(callee))].flatMap(
      (callee) => {
        const symbol = getSymbol(callee, context.checker);
        const declaration = symbol?.valueDeclaration;
        return symbol !== undefined && declaration !== undefined && ts.isParameter(declaration)
          ? [symbol]
          : [];
      },
    ),
  };
};

// What a function changes, with what the functions that it runs change, where no path binds its
// parameters to functions. The functions that run one another, a strongly connected component of
// the call graph, change the same things, so they share one summary, which Tarjan's algorithm
// makes once the components that they run have theirs.
const getSummary = (root: ts.Node, context: Context) => {
  const indexes = new Map<ts.Node, number>();
  const lowLinks = new Map<ts.Node, number>();
  const stack: ts.Node[] = [];
  const onStack = new Set<ts.Node>();
  const effects = new Map<ts.Node, Effects[]>();
  const connect = (node: ts.Node): ChangeSummary | undefined => {
    const index = indexes.size;
    indexes.set(node, index);
    lowLinks.set(node, index);
    stack.push(node);
    onStack.add(node);
    const found: Effects[] = [];
    const visit = (inner: ts.Node) => {
      found.push(getEffects(inner, NO_FUNCTIONS, context));
      ts.forEachChild(inner, visit);
    };
    visit(node);
    effects.set(node, found);
    found.forEach((effect) =>
      effect.called.forEach((called) => {
        if (context.changeSummaries.has(called)) return;
        if (!indexes.has(called)) connect(called);
        const reached = onStack.has(called) ? (lowLinks.get(called) ?? index) : index;
        lowLinks.set(node, Math.min(lowLinks.get(node) ?? index, reached));
      }),
    );
    if (lowLinks.get(node) !== index) return undefined;
    const component = stack.splice(stack.indexOf(node));
    component.forEach((member) => onStack.delete(member));
    const own = component.flatMap((member) => effects.get(member) ?? []);
    const reached = own.flatMap((effect) =>
      effect.called.flatMap((called) => context.changeSummaries.get(called) ?? []),
    );
    const summary: ChangeSummary = {
      changed: new Set([
        ...own.flatMap((effect) => effect.changed),
        ...reached.flatMap((inner) => [...inner.changed]),
      ]),
      isErrorMade:
        own.some((effect) => effect.isErrorMade) || reached.some((inner) => inner.isErrorMade),
      parameters: new Set([
        ...own.flatMap((effect) => effect.parameters),
        ...reached.flatMap((inner) => [...inner.parameters]),
      ]),
    };
    component.forEach((member) => context.changeSummaries.set(member, summary));
    return summary;
  };
  return context.changeSummaries.get(root) ?? connect(root);
};

export const getChanged = (
  loop: ts.Node,
  path: Path,
  context: Context,
  isIdentityIgnored = false,
) => {
  const functions = path.scope.functions;
  const changed = new Set<ts.Symbol>();
  const visited = new Set<ts.Node>();
  const add = (inner: { changed: Iterable<ts.Symbol>; isErrorMade: boolean }) => {
    [...inner.changed].forEach((symbol) => changed.add(symbol));
    if (inner.isErrorMade && !isIdentityIgnored && context.heap !== undefined) {
      changed.add(context.heap);
    }
  };
  const visit = (node: ts.Node) => {
    const effects = getEffects(node, functions, context);
    add(effects);
    effects.called.forEach((called) => {
      if (visited.has(called)) return;
      visited.add(called);
      const summary = getSummary(called, context);
      // A function that calls a parameter which the path binds runs the function bound to it.
      if (
        summary === undefined ||
        [...functions.keys()].some((symbol) => summary.parameters.has(symbol))
      ) {
        visit(called);
        return;
      }
      add(summary);
    });
    ts.forEachChild(node, visit);
  };
  visit(loop);
  return [...path.mutable].filter((symbol) => changed.has(symbol));
};

// Whether a node may change an object that exists before it runs.
const changesObjects = (node: ts.Node, path: Path, context: Context) =>
  getChanged(node, path, context, true).some((symbol) => symbol === context.heap);

// Translates a statement whose paths may each continue with what follows it. A script translates
// what follows once, as an operator of what the statement changes and the value it gives, instead
// of once for each path. A path that changes what the operator can't take, such as a var it
// declares, falls back to translating what follows on each path.
// Whether generators are those from before, where each is the same or has since completed, so that
// code after a join, outside the branches, can still name each one.
const isCompletedFrom = (generators: Path["generators"], before: Path["generators"]) =>
  generators === before ||
  (generators.size === before.size &&
    [...generators].every((entry) => {
      const previous = before.get(entry[0]);
      return (
        previous !== undefined &&
        (entry[1] === previous ||
          (entry[1].ref === previous.ref &&
            entry[1].resume === undefined &&
            entry[1].caller === undefined &&
            entry[1].queue.length === 0))
      );
    }));

export const translateJoined = (
  node: ts.Node,
  path: Path,
  context: Context,
  continueWith: (path: Path, value?: Expression) => Formula,
  translateWith: (next: (inner: Path, value?: Expression) => Formula) => Formula,
  changed = getChanged(node, path, context),
): Formula => {
  if (context.heap === undefined) return translateWith(continueWith);
  const name = context.names.getFresh("Join");
  const parameters = changed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const result = context.names.getFresh("result");
  // A var that the statement declares outlives it, as does any binding it declares that a function
  // in it captures, such as a catch's error.
  const isVarInside = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    if (
      declaration === undefined ||
      !ts.isVariableDeclaration(declaration) ||
      ts.findAncestor(declaration, (ancestor) => ancestor === node) === undefined
    ) {
      return false;
    }
    const parent = declaration.parent;
    return (
      (ts.isVariableDeclarationList(parent) && (parent.flags & ts.NodeFlags.BlockScoped) === 0) ||
      findNodes(
        node,
        (inner): inner is ts.Identifier =>
          ts.isIdentifier(inner) &&
          getSymbol(inner, context.checker) === symbol &&
          ts.findAncestor(inner, (ancestor) =>
            ancestor === node
              ? "quit"
              : ts.isFunctionLike(ancestor) &&
                ts.findAncestor(declaration, (outer) => outer === ancestor) === undefined,
          ) !== undefined,
      ).length > 0
    );
  };
  const isKept = <T>(entries: Map<ts.Symbol, T>, before: Map<ts.Symbol, T>) =>
    [...entries].every((entry) =>
      before.has(entry[0])
        ? before.get(entry[0]) === entry[1] || changed.includes(entry[0])
        : !isVarInside(entry[0]),
    );
  const exits: { path: Path; value?: Expression }[] = [];
  const joined = translateWith((inner, value) => {
    exits.push({ path: inner, value });
    return leaf(
      call(name, [
        ...changed.flatMap((symbol) => inner.scope.bindings.get(symbol) ?? []),
        value ?? getUndefined(context),
      ]),
    );
  });
  const isJoinable = exits.every(
    (exit) =>
      changed.every((symbol) => exit.path.scope.bindings.has(symbol)) &&
      // Each exit leaves the generators as the first does, which may have completed them.
      exit.path.generators === exits[0].path.generators &&
      isCompletedFrom(exit.path.generators, path.generators) &&
      exit.path.tasks === path.tasks &&
      exit.path.disposal === path.disposal &&
      isKept(exit.path.scope.bindings, path.scope.bindings) &&
      isKept(exit.path.scope.functions, path.scope.functions),
  );
  if (!isJoinable) return translateWith(continueWith);
  if (exits.length === 0) return joined;
  const isValued = exits.some((exit) => exit.value !== undefined);
  const rest = continueWith(
    {
      ...path,
      generators: exits[0].path.generators,
      scope: {
        ...path.scope,
        bindings: new Map([
          ...path.scope.bindings,
          ...changed.map((symbol, position): [ts.Symbol, Expression] => [
            symbol,
            identifier(parameters[position]),
          ]),
        ]),
      },
    },
    isValued ? identifier(result) : undefined,
  );
  return letIn(
    [
      define(
        name,
        [...parameters, result].map((parameter) => ({ name: parameter, arity: 0 })),
        render(rest),
      ),
    ],
    joined,
  );
};

// sort() on an array that the heap holds, step by step as SortIndexedProperties does it: it reads
// each element that the array has, running its getter, sorts them, writes them back from the start,
// running each setter, and deletes the indices past them. The array's literal bounds its length.
const translateIndexedSort = (
  site: ts.CallExpression,
  ref: Expression,
  comparator: ts.Expression | undefined,
  bound: number,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const getters = getAccessorFunctions(site, "get", context);
  const setters = getAccessorFunctions(site, "set", context);
  const changed = [
    ...new Set([site, ...getters, ...setters].flatMap((node) => getChanged(node, path, context))),
  ].filter((symbol) => path.scope.bindings.has(symbol));
  const lengthName = context.names.getFresh("length");
  const length = identifier(lengthName);
  const sortedName = context.names.getFresh("sorted");
  const sorted = identifier(sortedName);
  const order = translateSortOrder(comparator, path.scope, context);
  const getHeapNow = (current: Path) => getHeap(current.scope, site, context);
  const join = (
    current: Path,
    after: (path: Path, value?: Expression) => Formula,
    step: (next: (inner: Path, value?: Expression) => Formula) => Formula,
  ) => translateJoined(site, current, context, after, step, changed);
  const deleteRest = (current: Path) =>
    bind(
      current,
      "change",
      useJavaScript(
        "ArrayDeleteFrom",
        [getHeapNow(current), ref, apply("Len", [sorted]), length],
        context,
      ),
      context,
      (deletedPath, deleted) =>
        ifThenElse(
          field(deleted, "isThrown"),
          throwTypeError(
            withHeap(deletedPath, field(deleted, "heap"), context),
            site,
            context,
            frame,
          ),
          continueWith(withHeap(deletedPath, field(deleted, "heap"), context), ref),
        ),
    );
  const write = (current: Path, position: number): Formula =>
    position === bound
      ? deleteRest(current)
      : join(
          current,
          (after) => write(after, position + 1),
          (next) =>
            ifThenElse(
              apply("<", [number(position), apply("Len", [sorted])]),
              writeWith(
                site,
                ref,
                string(String(position)),
                index(sorted, [number(position + 1)]),
                setters,
                current,
                context,
                frame,
                (after) => next(after),
              ),
              next(current),
            ),
        );
  const read = (current: Path, position: number, items: Expression): Formula =>
    position === bound
      ? bindOnce(
          current,
          sortedName,
          useJavaScript("SortSequence", [items, order], context),
          write(current, 0),
        )
      : join(
          current,
          (after, value) => read(after, position + 1, value ?? tuple([])),
          (next) =>
            ifThenElse(
              apply("/\\", [
                apply("<", [number(position), length]),
                useJavaScript("Has", [getHeapNow(current), ref, string(String(position))], context),
              ]),
              readWith(
                site,
                ref,
                string(String(position)),
                getters,
                current,
                context,
                frame,
                (after, value) => next(after, apply("Append", [items, value])),
              ),
              next(current, items),
            ),
        );
  return bindOnce(
    path,
    lengthName,
    useJavaScript("Get", [getHeapNow(path), ref, string("length")], context),
    ifThenElse(
      apply("<=", [length, number(bound)]),
      read(path, 0, tuple([])),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't sort an array that grew past its literal's length"),
        ]),
      ),
    ),
  );
};

// Binds what a for-of's head declares or assigns to an element, for an iteration's body.
// An element that the code writes in place, as a source, lets the defaults it certainly evaluates
// run as statements first.
const bindElement = (
  declared: ts.ForInitializer,
  element: Expression,
  source: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  // The heap after an assignment holds what its pattern read, which the body must not run before,
  // so that a getter that tla-ts can't call stops the check first.
  if (!ts.isVariableDeclarationList(declared)) {
    return assignPatternWith(
      declared.parent,
      declared,
      undefined,
      element,
      path,
      context,
      frame,
      (after) => {
        if (context.heap === undefined) return continueWith(after);
        const heap = getHeap(after.scope, declared, context);
        return ifThenElse(apply("=", [heap, heap]), continueWith(after), leaf(boolean(false)));
      },
    );
  }
  if (declared.declarations.length !== 1) {
    throw new TlaTypeScriptError("Declare one element of a for-of", declared);
  }
  rejectCatchRedeclaration(declared.declarations[0]);
  const name = declared.declarations[0].name;
  if (isGetterPattern(name, path, context)) {
    const value = context.names.getFresh("value");
    return bindOnce(
      path,
      value,
      element,
      readPatternGetters(name, identifier(value), path, context, frame, (after) =>
        bindElement(declared, identifier(value), source, after, context, frame, continueWith),
      ),
    );
  }
  const defaulted =
    source &&
    runCertainDefault(
      [name],
      getKnownDefaults(name, source, undefined, context),
      [],
      path,
      context,
      frame,
      (after) => bindElement(declared, element, source, after, context, frame, continueWith),
    );
  if (defaulted !== undefined) return defaulted;
  const taken =
    ts.isArrayBindingPattern(name) &&
    takeFromIterator(name, element, path, context, frame, (after, values) =>
      bindElement(declared, values, source, after, context, frame, continueWith),
    );
  if (taken) return taken;
  // A default that calls a function runs only where its element or property is undefined, before
  // the pattern binds. A call that changes objects would change the properties that the pattern
  // read before it.
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(name));
  const isHeapObject = ts.isObjectBindingPattern(name) && isHeapPattern(type, name, context);
  const getPart = (inner: ts.BindingElement, position: number) => {
    if (ts.isArrayBindingPattern(name)) {
      return getElement(element, number(position + 1), context);
    }
    const key = inner.propertyName ?? inner.name;
    if (!(ts.isIdentifier(key) || ts.isStringLiteral(key))) return undefined;
    return isHeapObject
      ? useJavaScript(
          "Get",
          [getHeap(path.scope, inner, context), element, string(key.text)],
          context,
        )
      : isSequenceType(type, context.checker)
        ? undefined
        : getOptionalField(element, key.text, context);
  };
  const pending = !ts.isIdentifier(name)
    ? name.elements.flatMap((inner: ts.ArrayBindingElement, position) => {
        const initializer = ts.isBindingElement(inner) ? inner.initializer : undefined;
        const call = initializer && getCast(initializer);
        // A nested array pattern takes its values from the generator that its default makes.
        const pattern =
          ts.isBindingElement(inner) &&
          ts.isArrayBindingPattern(inner.name) &&
          call !== undefined &&
          isGeneratorType(call, context)
            ? inner.name
            : undefined;
        const part =
          ts.isBindingElement(inner) &&
          (ts.isIdentifier(inner.name) || pattern !== undefined) &&
          inner.dotDotDotToken === undefined
            ? getPart(inner, position)
            : undefined;
        return call !== undefined &&
          part !== undefined &&
          ts.isCallExpression(call) &&
          !path.scope.results.has(call) &&
          (isStatementCall(call, path, context) ||
            (path.scope.isCatching && mayThrow(call, context))) &&
          !(ts.isObjectBindingPattern(name) && changesObjects(call, path, context))
          ? [{ call, part, pattern }]
          : [];
      })
    : [];
  const first = pending.at(0);
  if (first !== undefined) {
    const bound = new Set(
      findNodes(name, ts.isBindingElement).flatMap((inner) => getSymbols(inner.name, context)),
    );
    if (getSymbols(first.call, context).some((symbol) => bound.has(symbol))) {
      throw new TlaTypeScriptError(
        "tla-ts can't run this default before what it binds",
        first.call,
      );
    }
    return translateJoined(
      first.call,
      path,
      context,
      (after, value) =>
        bindElement(
          declared,
          element,
          source,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([
                ...after.scope.results,
                [first.call, value ?? getUndefined(context)],
              ]),
            },
          },
          context,
          frame,
          continueWith,
        ),
      (next) =>
        ifThenElse(
          apply("=", [first.part, getUndefined(context)]),
          (first.pattern &&
            takeFromGenerator(first.pattern, first.call, [], path, context, frame, next)) ||
            translateCallStatement(first.call, path, context, frame, next),
          next(path, getUndefined(context)),
        ),
    );
  }
  // Each iteration makes the objects that the pattern's defaults make.
  return allocateAll(getAllocated(name, context), path, context, (allocated) => {
    const bound = bindPattern(name, element, allocated.scope, context);
    return letIn(
      bound.definitions,
      throwOnDestructured(
        bound.scope,
        allocated,
        context,
        frame,
        forceHeap(
          allocated.scope,
          bound.scope,
          continueWith({ ...allocated, scope: { ...bound.scope, destructured: undefined } }),
          leaf(boolean(false)),
          context,
        ),
      ),
    );
  });
};

// Binds what a for-of's declaration takes from an element, where a using declaration adds it to
// the iteration's resources, which the body's frame disposes.
const bindIteration = (
  declared: ts.ForInitializer,
  element: Expression,
  source: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, frame: Frame) => Formula,
): Formula =>
  bindElement(declared, element, source, path, context, frame, (bound) => {
    const name = ts.isVariableDeclarationList(declared)
      ? declared.declarations[0]?.name
      : undefined;
    return ts.isVariableDeclarationList(declared) &&
      (declared.flags & ts.NodeFlags.Using) !== 0 &&
      name !== undefined &&
      ts.isIdentifier(name)
      ? addResource(
          declared,
          declared.declarations[0],
          translateExpression(name, bound.scope, context),
          isAwaitUsing(declared),
          bound,
          context,
          frame,
          continueWith,
        )
      : continueWith(bound, frame);
  });

// A for await over an array written in place. Each element reaches the body two jobs on, as the
// async-from-sync iterator awaits the element and the loop then awaits the iterator's result, and
// the last next takes two more. Leaving the body early awaits the iterator's return.
// A key that a for-of reads from a generator object, which a script could replace.
const GENERATOR_KEYS = new Set(["next", "return"]);

const writesGeneratorKey = (node: ts.Node): boolean => {
  const written = getWritten(node);
  const key =
    written === undefined
      ? undefined
      : ts.isPropertyAccessExpression(written)
        ? written.name.text
        : ts.isElementAccessExpression(written)
          ? (getAccessKey(written) ?? "")
          : undefined;
  const isDefinition =
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ["defineProperty", "defineProperties", "setPrototypeOf", "assign"].includes(
      node.expression.name.text,
    );
  return (
    (key !== undefined && (key === "" || GENERATOR_KEYS.has(key))) ||
    isDefinition ||
    (ts.forEachChild(node, writesGeneratorKey) ?? false)
  );
};

// A for-of over a generator, which calls its next for each value, and its return where the loop
// leaves early, as the generator object's own iterator does.
const translateForOfGenerator = (
  loop: ts.ForOfStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const iterated = getCast(loop.expression);
  if (writesGeneratorKey(loop.getSourceFile())) {
    throw new TlaTypeScriptError(
      "tla-ts can't iterate a generator where a script may change how it iterates",
      iterated,
    );
  }
  const iterate = (start: Path, receiver: Expression) => {
    const resume = (
      current: Path,
      method: string,
      resumeFrame: Frame,
      step: Caller["step"],
    ): Formula =>
      resumeGenerator(
        loop.expression,
        receiver,
        method,
        undefined,
        current,
        context,
        resumeFrame,
        step,
      );
    // Leaving the body early runs the generator's return, though a throw keeps what it threw.
    const close = (current: Path, exit: (path: Path) => Formula) =>
      resume(current, "return", frame, (after) => exit(after));
    const next = (current: Path): Formula =>
      resume(current, "next", frame, (after, value, isDone, isResult) => {
        if (isDone) return continueWith(after);
        const bodyFrame: Frame = {
          ...guardYields(frame),
          next,
          continueTo: next,
          breakTo: (left) => close(left, continueWith),
          exit: (left, returned) => close(left, (closed) => frame.exit(closed, returned)),
          // A throw closes the generator and keeps what it threw, even where the return throws.
          throwTo: (left, thrown) => {
            const rethrow = (closed: Path) =>
              frame.throwTo === undefined ? leaf(thrown.uncaught) : frame.throwTo(closed, thrown);
            return resume(left, "return", { ...frame, throwTo: rethrow }, rethrow);
          },
        };
        const runBody = (current: Path, element: Expression) =>
          bindIteration(
            loop.initializer,
            element,
            undefined,
            current,
            context,
            bodyFrame,
            (bound, innerFrame) =>
              translateStatements([loop.statement], bound, context, innerFrame),
          );
        return isResult && value !== undefined
          ? readValue(loop.expression, value, after, context, frame, runBody)
          : runBody(after, value ?? getUndefined(context));
      });
    return next(start);
  };
  const created = ts.isCallExpression(iterated)
    ? getCreatedGenerator(iterated, path, context)
    : undefined;
  if (created !== undefined && ts.isCallExpression(iterated)) {
    return translateGeneratorCall(iterated, created, path, context, frame, (after, ref) =>
      iterate(after, ref ?? getUndefined(context)),
    );
  }
  // A for-of over the helper that a call makes runs the call first.
  const helper = ts.isCallExpression(iterated) ? getGeneratorMethod(iterated, context) : undefined;
  if (
    helper !== undefined &&
    ITERATOR_HELPERS.has(helper.method) &&
    ts.isCallExpression(iterated)
  ) {
    return translateCallStatement(iterated, path, context, frame, (after, ref) =>
      iterate(after, ref ?? getUndefined(context)),
    );
  }
  if (hasCall(iterated, context)) {
    throw new TlaTypeScriptError("tla-ts can't iterate this generator", iterated);
  }
  return iterate(path, translateExpression(iterated, path.scope, context));
};

// The array pattern that a for-of's head declares or assigns.
const getArrayHead = (loop: ts.ForOfStatement) => {
  const head = loop.initializer;
  if (ts.isArrayLiteralExpression(head)) return head;
  return ts.isVariableDeclarationList(head) &&
    head.declarations.length === 1 &&
    ts.isArrayBindingPattern(head.declarations[0].name)
    ? head.declarations[0].name
    : undefined;
};

// Whether a for-of iterates an array that the code writes in place of names that the script never
// assigns again, some of which hold generators that an array pattern takes from, so that each
// iteration reads its element where the array would have held it.
const isTakingFromGenerators = (loop: ts.ForOfStatement, context: Context) => {
  const iterated = getCast(loop.expression);
  return (
    loop.awaitModifier === undefined &&
    getArrayHead(loop) !== undefined &&
    ts.isArrayLiteralExpression(iterated) &&
    iterated.elements.every((element) => {
      const symbol = ts.isIdentifier(element) ? getSymbol(element, context.checker) : undefined;
      return (
        symbol !== undefined &&
        symbol.valueDeclaration !== undefined &&
        !isAssigned(symbol, element.getSourceFile(), context)
      );
    }) &&
    iterated.elements.some((element) => isGeneratorType(element, context))
  );
};

// A for-of that isTakingFromGenerators allows, which runs its body for each element in turn, and
// binds a generator element's pattern to what the pattern takes through the generator's next.
const translateForOfTaken = (
  loop: ts.ForOfStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const pattern = getArrayHead(loop);
  const iterated = getCast(loop.expression);
  if (pattern === undefined || !ts.isArrayLiteralExpression(iterated)) {
    throw new TlaTypeScriptError("Unsupported for-of", loop);
  }
  const iterate = (current: Path, position: number): Formula => {
    if (position === iterated.elements.length) return continueWith(current);
    const element = iterated.elements[position];
    const bodyFrame: Frame = {
      ...guardYields(frame),
      next: (after) => iterate(after, position + 1),
      continueTo: (after) => iterate(after, position + 1),
      breakTo: continueWith,
    };
    const runBody = (after: Path, value: Expression, source: ts.Expression | undefined) =>
      bindIteration(loop.initializer, value, source, after, context, bodyFrame, (bound) =>
        translateStatements([loop.statement], bound, context, bodyFrame),
      );
    if (!isGeneratorType(element, context)) {
      return runBody(current, translateExpression(element, current.scope, context), element);
    }
    const taken = takeFromGenerator(
      pattern,
      element,
      [],
      current,
      context,
      bodyFrame,
      (after, values) => runBody(after, values, undefined),
    );
    if (taken === undefined) {
      throw new TlaTypeScriptError("tla-ts can't follow a generator here", element);
    }
    return taken;
  };
  return iterate(path, 0);
};

const translateForAwait = (
  loop: ts.ForOfStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const awaitTo = frame.awaitTo;
  const throwTo = frame.throwTo;
  if (awaitTo === undefined || throwTo === undefined) {
    throw new TlaTypeScriptError("Unsupported for await", loop);
  }
  const iterated = getCast(loop.expression);
  const uncaught = apply("Assert", [boolean(false), string(loop.expression.getText())]);
  const throwWith = (current: Path, value: Expression) => throwTo(current, { value, uncaught });
  const runBody = (
    current: Path,
    value: Expression,
    source: ts.Expression | undefined,
    bodyFrame: Frame,
  ) =>
    bindIteration(
      loop.initializer,
      value,
      source,
      current,
      context,
      bodyFrame,
      (bound, innerFrame) => translateStatements([loop.statement], bound, context, innerFrame),
    );
  const declared = loop.initializer;
  const pattern =
    ts.isVariableDeclarationList(declared) &&
    declared.declarations.length === 1 &&
    ts.isArrayBindingPattern(declared.declarations[0].name)
      ? declared.declarations[0].name
      : undefined;
  // A value that an async generator yields, which an array pattern takes from where the value is
  // a generator object.
  const runYielded = (current: Path, value: Expression, bodyFrame: Frame) => {
    if (pattern === undefined || !mayBeGeneratorType(pattern, context)) {
      return runBody(current, value, undefined, bodyFrame);
    }
    if (!isGeneratorType(pattern, context)) {
      throw new TlaTypeScriptError("tla-ts can't follow a generator here", pattern);
    }
    return takeFromHeld(
      pattern,
      value,
      [...current.generators.values()].flatMap((suspension) => suspension.generator ?? []),
      [],
      current,
      context,
      bodyFrame,
      (after, values) => runBody(after, values, undefined, bodyFrame),
    );
  };
  // A for await over a generator, which it makes where it calls a generator function.
  const iterateGenerator = (start: Path, receiver: Expression) => {
    // Calls the generator's next or return, and awaits the promise it gives.
    const request = (
      current: Path,
      method: string,
      onFulfilled: (path: Path, request: Expression) => Formula,
      onRejected: (path: Path, reason: Expression) => Formula,
    ) =>
      resumeGenerator(
        loop.expression,
        receiver,
        method,
        undefined,
        current,
        context,
        frame,
        () => {
          throw new TlaTypeScriptError(
            "for await iterates only arrays and async generators",
            iterated,
          );
        },
        (requested, promise) =>
          awaitTo(
            requested,
            promise,
            undefined,
            (fulfilled) => onFulfilled(fulfilled, promise),
            onRejected,
          ),
      );
    // Leaving the body early awaits the generator's return, though a throw keeps what it threw.
    const close = (current: Path, exit: (path: Path) => Formula) =>
      request(current, "return", exit, throwWith);
    const iterate = (current: Path): Formula =>
      request(
        current,
        "next",
        (fulfilled, promise) => {
          const iteration = getIteration(fulfilled, loop, promise);
          return iteration.isDone
            ? continueWith(fulfilled)
            : runYielded(fulfilled, iteration.value, {
                ...guardYields(frame),
                next: iterate,
                continueTo: iterate,
                breakTo: (after) => close(after, continueWith),
                exit: (after, value) => close(after, (closed) => frame.exit(closed, value)),
                throwTo: (after, thrown) =>
                  request(
                    after,
                    "return",
                    (closed) => throwTo(closed, thrown),
                    (closed) => throwTo(closed, thrown),
                  ),
              });
        },
        throwWith,
      );
    return iterate(start);
  };
  if (!ts.isArrayLiteralExpression(iterated)) {
    const created = ts.isCallExpression(iterated)
      ? getCreatedGenerator(iterated, path, context)
      : undefined;
    if (created !== undefined && ts.isCallExpression(iterated)) {
      return translateGeneratorCall(iterated, created, path, context, frame, (after, ref) =>
        iterateGenerator(after, ref ?? getUndefined(context)),
      );
    }
    if (hasCall(iterated, context)) {
      throw new TlaTypeScriptError("for await iterates only arrays and async generators", iterated);
    }
    return iterateGenerator(path, translateExpression(iterated, path.scope, context));
  }
  if (iterated.elements.some((element) => ts.isSpreadElement(element))) {
    throw new TlaTypeScriptError("for await iterates only arrays and async generators", iterated);
  }
  const sequence = context.names.getFresh("sequence");
  const tick = (current: Path, next: (path: Path) => Formula) =>
    awaitTo(current, getUndefined(context), undefined, next, next);
  // An array pattern takes its values from a generator element through the generator's next,
  // which the array then doesn't hold.
  const isTaken = (element: ts.Expression) =>
    pattern !== undefined && !ts.isOmittedExpression(element) && isGeneratorType(element, context);
  const iterate = (current: Path, position: number): Formula => {
    if (position === iterated.elements.length) {
      return tick(current, (resumed) => tick(resumed, continueWith));
    }
    const element = iterated.elements[position];
    const bodyFrame: Frame = {
      ...guardYields(frame),
      next: (after) => iterate(after, position + 1),
      continueTo: (after) => iterate(after, position + 1),
      breakTo: (after) => tick(after, continueWith),
      exit: (after, value) => tick(after, (closed) => frame.exit(closed, value)),
      throwTo: (after, thrown) => tick(after, (closed) => throwTo(closed, thrown)),
    };
    if (pattern !== undefined && isTaken(element)) {
      return tick(current, (fulfilled) =>
        tick(fulfilled, (resumed) => {
          const taken = takeFromGenerator(
            pattern,
            element,
            [],
            resumed,
            context,
            bodyFrame,
            (after, values) => runBody(after, values, undefined, bodyFrame),
          );
          if (taken === undefined) {
            throw new TlaTypeScriptError("tla-ts can't follow a generator here", element);
          }
          return taken;
        }),
      );
    }
    return awaitTo(
      current,
      index(identifier(sequence), [number(position + 1)]),
      ts.isOmittedExpression(element) ? undefined : element,
      (fulfilled, value) =>
        tick(fulfilled, (resumed) =>
          keepHoles(
            loop,
            value,
            position,
            resumed,
            context,
            runBody(
              resumed,
              value,
              ts.isOmittedExpression(element) ? undefined : element,
              bodyFrame,
            ),
          ),
        ),
      (rejected, reason) => tick(rejected, (resumed) => throwWith(resumed, reason)),
    );
  };
  return allocate(loop.expression, path, context, (inner) =>
    letIn(
      [
        define(
          sequence,
          [],
          iterated.elements.some(isTaken)
            ? tuple(
                iterated.elements.map((element) =>
                  isTaken(element) || ts.isOmittedExpression(element)
                    ? getUndefined(context)
                    : translateExpression(element, inner.scope, context),
                ),
              )
            : translateExpression(loop.expression, inner.scope, context),
        ),
      ],
      iterate(inner, 0),
    ),
  );
};

// Runs an iteration of a for-of over a literal with holes, which the literal read from
// Array.prototype when it was made, where Array.prototype still gives the same values, and stops
// otherwise. The pattern reads the holes of each element in order, so nothing it runs before the
// last of them may change Array.prototype either.
const keepHoles = (
  loop: ts.ForOfStatement,
  element: Expression,
  position: Expression | number,
  path: Path,
  context: Context,
  run: Formula,
): Formula => {
  const checks = getHoleChecks(loop.expression, () => getHeap(path.scope, loop, context), context);
  const kept = checks.flatMap((check) =>
    typeof position === "number"
      ? check.position === position
        ? [check.isKept(element)]
        : []
      : [
          junction("Or", [
            apply("#", [position, number(check.position + 1)]),
            check.isKept(element),
          ]),
        ],
  );
  if (kept.length === 0) return run;
  const initializer = loop.initializer;
  const pattern = ts.isVariableDeclarationList(initializer)
    ? initializer.declarations.at(0)?.name
    : initializer;
  if (!isInertBefore(pattern, Math.max(0, ...checks.flatMap((check) => check.holes)))) {
    throw new TlaTypeScriptError(
      "tla-ts can't read the holes of an element after a pattern runs code",
      loop.initializer,
    );
  }
  return ifThenElse(
    junction("And", kept),
    run,
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't read a hole from Array.prototype after a script changes it"),
      ]),
    ),
  );
};

// The most iterations of a generator's counted loop that tla-ts unrolls.
const UNROLL_LIMIT = 64;

// The values that a generator's for loop gives its counter, where a literal starts it, a comparison
// with a literal ends it, a step of a literal moves it, and nothing else writes it. tla-ts unrolls
// such a loop, whose iterations then suspend at each yield as straight code does.
const getCounts = (loop: ts.ForStatement, context: Context) => {
  const initializer = loop.initializer;
  const declaration =
    initializer !== undefined &&
    ts.isVariableDeclarationList(initializer) &&
    (initializer.flags & ts.NodeFlags.Let) !== 0 &&
    initializer.declarations.length === 1
      ? initializer.declarations[0]
      : undefined;
  const counter =
    declaration !== undefined && ts.isIdentifier(declaration.name) ? declaration.name : undefined;
  const symbol = counter && getSymbol(counter, context.checker);
  if (symbol === undefined || declaration?.initializer === undefined) return undefined;
  const isCounter = (node: ts.Node) =>
    ts.isIdentifier(node) && getSymbol(node, context.checker) === symbol;
  const getLiteral = (node: ts.Node): number | undefined =>
    ts.isNumericLiteral(node)
      ? Number(node.text)
      : ts.isPrefixUnaryExpression(node) &&
          node.operator === ts.SyntaxKind.MinusToken &&
          ts.isNumericLiteral(node.operand)
        ? -Number(node.operand.text)
        : undefined;
  const start = getLiteral(declaration.initializer);
  const condition = loop.condition;
  const end =
    condition !== undefined && ts.isBinaryExpression(condition) && isCounter(condition.left)
      ? getLiteral(condition.right)
      : undefined;
  const step = loop.incrementor;
  const delta =
    step === undefined
      ? undefined
      : (ts.isPostfixUnaryExpression(step) || ts.isPrefixUnaryExpression(step)) &&
          isCounter(step.operand)
        ? step.operator === ts.SyntaxKind.PlusPlusToken
          ? 1
          : step.operator === ts.SyntaxKind.MinusMinusToken
            ? -1
            : undefined
        : ts.isBinaryExpression(step) && isCounter(step.left)
          ? step.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken
            ? getLiteral(step.right)
            : step.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken
              ? -(getLiteral(step.right) ?? Number.NaN)
              : undefined
          : undefined;
  const isWritten = (node: ts.Node): boolean => {
    const written = getWritten(node);
    return (
      (written !== undefined && getWrittenSymbols(written, context).includes(symbol)) ||
      (ts.forEachChild(node, (child) => isWritten(child) || undefined) ?? false)
    );
  };
  const comparisons = new Map([
    [ts.SyntaxKind.LessThanToken, (value: number, limit: number) => value < limit],
    [ts.SyntaxKind.LessThanEqualsToken, (value: number, limit: number) => value <= limit],
    [ts.SyntaxKind.GreaterThanToken, (value: number, limit: number) => value > limit],
    [ts.SyntaxKind.GreaterThanEqualsToken, (value: number, limit: number) => value >= limit],
  ]);
  const compare =
    condition !== undefined && ts.isBinaryExpression(condition)
      ? comparisons.get(condition.operatorToken.kind)
      : undefined;
  if (
    start === undefined ||
    end === undefined ||
    delta === undefined ||
    !Number.isInteger(delta) ||
    delta === 0 ||
    compare === undefined ||
    isWritten(loop.statement)
  ) {
    return undefined;
  }
  const values = Array.from(
    { length: UNROLL_LIMIT + 1 },
    (_, position) => start + position * delta,
  );
  const length = values.findIndex((value) => !compare(value, end));
  return length === -1 ? undefined : { symbol, counts: values.slice(0, length) };
};

// Whether a node yields outside the functions it holds.
const hasYield = (node: ts.Node): boolean =>
  ts.isYieldExpression(node) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasYield) ?? false));

// Runs a generator's counted loop that yields as its iterations, one after another, with the
// counter each one reads.
const translateUnrolled = (
  loop: ts.ForStatement,
  unrolled: NonNullable<ReturnType<typeof getCounts>>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const iterate = (current: Path, position: number): Formula => {
    const count = unrolled.counts.at(position);
    if (count === undefined) return continueWith(current);
    const next = (after: Path) => iterate(after, position + 1);
    return translateStatements(
      [loop.statement],
      {
        ...current,
        scope: {
          ...current.scope,
          bindings: new Map([...current.scope.bindings, [unrolled.symbol, number(count)]]),
        },
      },
      context,
      { ...frame, next, continueTo: next, breakTo: continueWith },
    );
  };
  return iterate(path, 0);
};

const translateLoop = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const unrolled =
    frame.yieldTo !== undefined && ts.isForStatement(loop) && hasYield(loop.statement)
      ? getCounts(loop, context)
      : undefined;
  if (unrolled !== undefined && ts.isForStatement(loop)) {
    return translateUnrolled(loop, unrolled, path, context, frame, continueWith);
  }
  const runLoop = (inner: Path) => translateIterations(loop, inner, context, frame, continueWith);
  // A for-of or a for-in evaluates what it iterates once, before its first iteration.
  if (ts.isForOfStatement(loop) || ts.isForInStatement(loop)) {
    return allocate(loop.expression, path, context, runLoop);
  }
  const initializer = ts.isForStatement(loop) ? loop.initializer : undefined;
  if (initializer === undefined) return runLoop(path);
  // A for's using declaration disposes its resources once the loop completes.
  if (ts.isVariableDeclarationList(initializer) && (initializer.flags & ts.NodeFlags.Using) !== 0) {
    return translateUsing(
      loop,
      initializer,
      initializer.declarations,
      path,
      context,
      { ...frame, next: continueWith },
      (inner, innerFrame) => translateIterations(loop, inner, context, innerFrame, innerFrame.next),
    );
  }
  return ts.isVariableDeclarationList(initializer)
    ? translateDeclarations(initializer.declarations, path, context, frame, runLoop)
    : translateExpressionStatement(initializer, path, context, frame, runLoop);
};

interface OpenedIterator {
  iterator: Expression;
  next: Expression;
}

const translateIterations = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const iterated = ts.isForOfStatement(loop) || ts.isForInStatement(loop) ? loop : undefined;
  // A for-of over an array that the heap holds visits its elements, as its iterator reads them.
  const isHeapIteration =
    iterated !== undefined &&
    ts.isForOfStatement(iterated) &&
    isHeapArray(iterated.expression, context);
  // A for-of over an object that a script declares iterates through the object's iterator.
  const isUnordered =
    iterated !== undefined && ts.isForOfStatement(iterated) && isOrderFreeForOf(iterated, context);
  const isSequence =
    iterated !== undefined &&
    (getKind(iterated.expression, context) === "sequence" ||
      isUnordered ||
      isArrayIteration(iterated.expression, context));
  const isIterator =
    iterated !== undefined &&
    ts.isForOfStatement(iterated) &&
    !isHeapIteration &&
    !isSequence &&
    isIteratedValue(iterated.expression, context);
  const isForIn =
    iterated !== undefined &&
    ts.isForInStatement(iterated) &&
    (getKind(iterated.expression, context) === "object" ||
      (context.heap !== undefined && isBuiltInObject(iterated.expression, context)));
  // A for-in over a list visits its indices, as strings in order.
  const isListKeys =
    iterated !== undefined &&
    ts.isForInStatement(iterated) &&
    !isForIn &&
    getKind(iterated.expression, context) === "sequence";
  if (ts.isForInStatement(loop) && !isForIn && !isListKeys) {
    throw new TlaTypeScriptError("for-in iterates only objects", loop.expression);
  }
  // A for-of over a string visits its characters.
  const isStringIteration =
    iterated !== undefined &&
    ts.isForOfStatement(iterated) &&
    getKind(iterated.expression, context) === "string";
  if (
    iterated !== undefined &&
    !isForIn &&
    !isListKeys &&
    !isIterator &&
    !isStringIteration &&
    !isHeapIteration &&
    !isSequence
  ) {
    throw new TlaTypeScriptError("Only arrays have an order to iterate in", iterated.expression);
  }
  const changed = getChanged(loop, path, context);
  // The iterator reads each element as the loop reaches it, which a copy of the elements matches
  // only while the body changes no object.
  if (isHeapIteration && changesObjects(loop, path, context)) {
    throw new TlaTypeScriptError(
      "Unsupported loop: tla-ts can't iterate an array that the heap holds while the loop changes objects",
      iterated?.expression,
    );
  }
  // A for-in skips a key that its body deletes before visiting it, which a list of keys can't.
  if (isForIn && changesObjects(loop, path, context)) {
    throw new TlaTypeScriptError("Don't change objects while a for-in iterates one", loop);
  }
  if (changed.some((symbol) => path.scope.functions.has(symbol))) {
    throw new TlaTypeScriptError("Don't reassign a function inside a loop", loop);
  }
  // A method or an accessor of an object that the iterated expression makes runs only later.
  const isIteratedChanged = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) &&
      changed.some((symbol) => symbol === getSymbol(node, context.checker))) ||
    (!ts.isMethodDeclaration(node) &&
      !ts.isAccessor(node) &&
      (ts.forEachChild(node, (child) => isIteratedChanged(child) || undefined) ?? false));
  if (iterated !== undefined && !isIterator && isIteratedChanged(iterated.expression)) {
    throw new TlaTypeScriptError(
      "Don't change an array while a for-of iterates it",
      iterated.expression,
    );
  }
  // An iteration of a for-of over an iterator: it steps the iterator, and closes it where the body
  // leaves the loop by a break, a return, or a throw, whose value the close can't change.
  const translateStep = (
    iterating: ts.ForOfStatement | ts.ForInStatement,
    opened: OpenedIterator,
    path: Path,
    bodyFrame: Frame,
    done: (path: Path) => Formula,
  ) => {
    const site = iterating.expression;
    const close = (current: Path, closeFrame: Frame, closedWith: (path: Path) => Formula) =>
      closeIterator(
        site,
        opened.iterator,
        current,
        context,
        closeFrame,
        (failed) => throwTypeError(failed, site, context, closeFrame),
        closedWith,
      );
    const throwTo = bodyFrame.throwTo;
    const iterationFrame: Frame = {
      ...bodyFrame,
      breakTo: (current) => close(current, bodyFrame, done),
      exit: (current, value) =>
        close(current, bodyFrame, (closed) => bodyFrame.exit(closed, value)),
      throwTo:
        throwTo &&
        ((current, thrown) => {
          const rethrow = (failed: Path) => throwTo(failed, thrown);
          return close(current, { ...bodyFrame, throwTo: rethrow }, rethrow);
        }),
    };
    return stepIterator(
      site,
      opened.iterator,
      opened.next,
      path,
      context,
      bodyFrame,
      (failed) => throwTypeError(failed, site, context, bodyFrame),
      done,
      (stepped, result) =>
        readValue(site, result, stepped, context, bodyFrame, (taken, value) =>
          bindIteration(
            iterating.initializer,
            value,
            undefined,
            taken,
            context,
            iterationFrame,
            (bound, innerFrame) =>
              translateStatements([loop.statement], bound, context, innerFrame),
          ),
        ),
    );
  };
  const translateFrom = (path: Path, opened?: OpenedIterator): Formula => {
    const name = context.names.getFresh("Loop");
    // A loop over an array visits each of its positions, and one over an iterator steps it.
    const isSequence = iterated !== undefined && opened === undefined;
    const parameters = changed.map((symbol) => {
      const binding = path.scope.bindings.get(symbol);
      return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
    });
    const position = context.names.getFresh("position");
    const sequence = context.names.getFresh("sequence");
    const getValues = (current: Path) =>
      changed.flatMap((symbol) => current.scope.bindings.get(symbol) ?? []);
    const bindValues = (current: Path, values: Expression[]): Path => ({
      ...current,
      scope: {
        ...current.scope,
        bindings: new Map([
          ...current.scope.bindings,
          ...changed.map((symbol, index): [ts.Symbol, Expression] => [symbol, values[index]]),
        ]),
      },
    });
    // A loop that a catch or a function's return can leave gives how its body ended: "next", or
    // "throw" or "return" with a value, which the code after it then throws or returns.
    const hasReturn = (node: ts.Node): boolean =>
      ts.isReturnStatement(node) ||
      (!ts.isFunctionLike(node) &&
        !ts.isClassLike(node) &&
        (ts.forEachChild(node, (child) => hasReturn(child) || undefined) ?? false));
    const isEnded = frame.throwTo !== undefined || hasReturn(loop.statement);
    const end = (current: Path, kind: string, value: Expression = getUndefined(context)) =>
      leaf(tuple([...(isEnded ? [string(kind), value] : []), ...getValues(current)]));
    const done = (current: Path) => end(current, "next");
    const repeat = (current: Path) =>
      leaf(
        call(name, [
          ...(isSequence ? [apply("+", [identifier(position), number(1)])] : []),
          ...getValues(current),
        ]),
      );
    const test = (current: Path) => {
      if (iterated !== undefined) {
        return apply("<=", [identifier(position), apply("Len", [identifier(sequence)])]);
      }
      const condition =
        ts.isWhileStatement(loop) || ts.isDoStatement(loop)
          ? loop.expression
          : ts.isForStatement(loop)
            ? loop.condition
            : undefined;
      return condition === undefined
        ? boolean(true)
        : translateCondition(condition, current.scope, context);
    };
    const testAgain = (current: Path) => ifThenElse(test(current), repeat(current), done(current));
    const advance = (current: Path) =>
      ts.isForStatement(loop) && loop.incrementor !== undefined
        ? translateExpressionStatement(loop.incrementor, current, context, frame, repeat)
        : repeat(current);
    const bodyFrame: Frame = {
      ...frame,
      next: ts.isDoStatement(loop) ? testAgain : advance,
      exit: (current, value) =>
        value === undefined ? end(current, "return") : end(current, "returnValue", value),
      breakTo: done,
      continueTo: ts.isDoStatement(loop) ? testAgain : advance,
      throwTo: frame.throwTo && ((current, thrown) => end(current, "throw", thrown.value)),
      yieldTo:
        frame.yieldTo &&
        (() => {
          throw new TlaTypeScriptError("Yield outside loops", loop);
        }),
      awaitTo:
        frame.awaitTo &&
        (() => {
          throw new TlaTypeScriptError("Await outside loops", loop);
        }),
    };
    const translateBody = (current: Path) => {
      if (iterated === undefined) {
        return translateStatements([loop.statement], current, context, bodyFrame);
      }
      if (opened !== undefined) {
        return translateStep(iterated, opened, current, bodyFrame, done);
      }
      const element = index(identifier(sequence), [identifier(position)]);
      const run = bindIteration(
        iterated.initializer,
        element,
        undefined,
        current,
        context,
        bodyFrame,
        (bound, innerFrame) => translateStatements([loop.statement], bound, context, innerFrame),
      );
      return ts.isForOfStatement(iterated)
        ? keepHoles(iterated, element, identifier(position), current, context, run)
        : run;
    };
    const inner = {
      ...bindValues(
        path,
        parameters.map((parameter) => identifier(parameter)),
      ),
      isLooping: true,
      // A generator from before the loop resumes only outside it, as each iteration's path ends.
      generators: new Map(),
      tasks: undefined,
    };
    const carriedValues = tuple(parameters.map((parameter) => identifier(parameter)));
    const operator: OperatorDefinition = {
      ...define(
        name,
        [...(isSequence ? [position] : []), ...parameters].map((parameter) => ({
          name: parameter,
          arity: 0,
        })),
        // Each iteration evaluates the values it carries, which an operator's arguments otherwise
        // defer, so that a value that each iteration builds on, such as a string that grows,
        // doesn't nest thousands of deferred steps.
        render(
          ifThenElse(
            apply("=", [carriedValues, carriedValues]),
            ts.isDoStatement(loop) || opened !== undefined
              ? translateBody(inner)
              : ifThenElse(test(inner), translateBody(inner), done(inner)),
            leaf(boolean(false)),
          ),
        ),
      ),
      isRecursive: true,
    };
    const result = context.names.getFresh("loop");
    const offset = isEnded ? 2 : 0;
    const after = {
      ...bindValues(
        path,
        changed.map((_, position) => index(identifier(result), [number(position + offset + 1)])),
      ),
      isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
    };
    const kind = index(identifier(result), [number(1)]);
    const carried = index(identifier(result), [number(2)]);
    const throwTo = frame.throwTo;
    const ended = !isEnded
      ? continueWith(after)
      : ifThenElse(
          apply("=", [kind, string("next")]),
          continueWith(after),
          ifThenElse(
            apply("=", [kind, string("throw")]),
            throwTo === undefined
              ? leaf(boolean(false))
              : throwTo(after, {
                  value: carried,
                  uncaught: apply("Assert", [boolean(false), string("A loop threw")]),
                }),
            ifThenElse(
              apply("=", [kind, string("return")]),
              frame.exit(after),
              frame.exit(after, carried),
            ),
          ),
        );
    return letIn(
      [
        ...(iterated === undefined || opened !== undefined
          ? []
          : [
              define(
                sequence,
                [],
                isForIn
                  ? useJavaScript(
                      "ForInKeys",
                      [
                        getHeap(path.scope, iterated.expression, context),
                        translateObjectValue(iterated.expression, path.scope, context),
                      ],
                      context,
                    )
                  : isListKeys
                    ? share(
                        translateExpression(iterated.expression, path.scope, context),
                        "list",
                        context,
                        (list) =>
                          functionOf(
                            [bound("index", apply("DOMAIN", [list]))],
                            apply("ToString", [apply("-", [identifier("index"), number(1)])]),
                          ),
                      )
                    : isStringIteration
                      ? useJavaScript(
                          "StringCharacters",
                          [translateExpression(iterated.expression, path.scope, context)],
                          context,
                        )
                      : isHeapIteration
                        ? translateHeapElements(iterated.expression, path.scope, context)
                        : isUnordered
                          ? useJavaScript(
                              "SetToSequence",
                              [translateExpression(iterated.expression, path.scope, context)],
                              context,
                            )
                          : context.heap !== undefined &&
                              getKind(iterated.expression, context) === "sequence"
                            ? translateArrayIteration(
                                translateExpression(iterated.expression, path.scope, context),
                                getHeap(path.scope, iterated.expression, context),
                                iterated.expression,
                                context,
                              )
                            : translateExpression(iterated.expression, path.scope, context),
              ),
            ]),
        operator,
      ],
      // The loop runs even when nothing reads what it changes, as it may throw.
      bindOnce(
        path,
        result,
        call(name, [...(isSequence ? [number(1)] : []), ...getValues(path)]),
        ended,
      ),
    );
  };
  if (!isIterator || iterated === undefined) return translateFrom(path);
  const iteratedExpression = iterated.expression;
  return translateJoined(
    loop,
    path,
    context,
    (after) => throwTypeError(after, iteratedExpression, context, frame),
    (throwWith) =>
      openIterator(
        iteratedExpression,
        translateExpression(iteratedExpression, path.scope, context),
        path,
        context,
        frame,
        throwWith,
        (opened, iterator, next) => translateFrom(opened, { iterator, next }),
      ),
  );
};

// A call to a built-in function that changes nothing, which an expression can make.
const isLibraryCall = (node: ts.CallExpression, context: Context) =>
  getWritten(node) === undefined &&
  (context.checker.getResolvedSignature(node)?.getDeclaration()?.getSourceFile()
    .isDeclarationFile ??
    false);

// Whether evaluating a node calls a function, which a function's body doesn't, as it only runs
// where something calls it.
// Whether each call that a value makes is to a local function that an expression can run, as one
// that reads no state and changes nothing outside it.
const hasOnlyLiftableCalls = (node: ts.Node, path: Path, context: Context): boolean => {
  // A call that ran as its own statement first has its value.
  if (ts.isFunctionLike(node) || (ts.isExpression(node) && path.scope.results.has(node))) {
    return true;
  }
  if (ts.isNewExpression(node)) return false;
  if (ts.isCallExpression(node) && !isLibraryCall(node, context)) {
    const symbol = getSymbol(node.expression, context.checker);
    const callee =
      (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
    if (callee === undefined || !isLiftable(callee, context)) return false;
  }
  return !(
    ts.forEachChild(node, (child) =>
      hasOnlyLiftableCalls(child, path, context) ? undefined : true,
    ) ?? false
  );
};

// A call or a new that a node evaluates, besides the objects that statements made before it.
const hasCall = (
  node: ts.Node,
  context: Context,
  allocated: ReadonlyMap<ts.Node, Expression> = new Map(),
): boolean =>
  !ts.isFunctionLike(node) &&
  !allocated.has(node) &&
  ((ts.isCallExpression(node) && !isLibraryCall(node, context)) ||
    ts.isNewExpression(node) ||
    (ts.forEachChild(node, (child) => hasCall(child, context, allocated) || undefined) ?? false));

const translateTry = (
  statement: ts.TryStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const isCatching = path.scope.isCatching;
  const leave = (inner: Path, resume: (path: Path) => Formula) => {
    const left = { ...inner, scope: { ...inner.scope, isCatching } };
    const finallyBlock = statement.finallyBlock;
    return finallyBlock === undefined
      ? resume(left)
      : translateStatements(finallyBlock.statements, left, context, { ...frame, next: resume });
  };
  const resumeWith = (resume: ((path: Path) => Formula) | undefined) =>
    resume && ((inner: Path) => leave(inner, resume));
  const rethrow = (inner: Path, thrown: Thrown) =>
    leave(inner, (left) =>
      frame.throwTo === undefined ? leaf(thrown.uncaught) : frame.throwTo(left, thrown),
    );
  const outer: Frame = {
    ...frame,
    next: (inner) => leave(inner, continueWith),
    exit: (inner, value) => leave(inner, (left) => frame.exit(left, value)),
    breakTo: resumeWith(frame.breakTo),
    continueTo: resumeWith(frame.continueTo),
    throwTo: rethrow,
  };
  const catchClause = statement.catchClause;
  const handle = (inner: Path, thrown: Thrown) => {
    if (catchClause === undefined) return rethrow(inner, thrown);
    const caught = { ...inner, scope: { ...inner.scope, isCatching } };
    const declaration = catchClause.variableDeclaration;
    const bound =
      declaration === undefined
        ? { definitions: [], scope: caught.scope }
        : bindPattern(declaration.name, thrown.value, caught.scope, context);
    const bodyFrame = statement.finallyBlock === undefined ? outer : guardYields(outer);
    return letIn(
      bound.definitions,
      throwOnDestructured(
        bound.scope,
        caught,
        context,
        bodyFrame,
        forceHeap(
          caught.scope,
          bound.scope,
          translateStatements(
            catchClause.block.statements,
            { ...caught, scope: { ...bound.scope, destructured: undefined } },
            context,
            bodyFrame,
          ),
          leaf(boolean(false)),
          context,
        ),
      ),
    );
  };
  return translateStatements(
    statement.tryBlock.statements,
    { ...path, scope: { ...path.scope, isCatching: true } },
    context,
    guardYields({ ...outer, throwTo: handle }),
  );
};

// A callee like f or assert.sameValue, whose evaluation reads no getter, or a method of a call's
// result that ran first.
const isPlainCallee = (
  node: ts.Expression,
  context: Context,
  results?: Scope["results"],
): boolean =>
  ts.isIdentifier(node) ||
  node.kind === ts.SyntaxKind.ThisKeyword ||
  ts.isLiteralExpression(node) ||
  (results?.has(node) ?? false) ||
  (ts.isPropertyAccessExpression(node) &&
    !ts.isPrivateIdentifier(node.name) &&
    getObjectGetter(node, context) === undefined &&
    !(getSymbol(node.name, context.checker)?.declarations ?? []).some(
      ts.isGetAccessorDeclaration,
    ) &&
    isPlainCallee(getCast(node.expression), context, results));

type Increment = ts.PrefixUnaryExpression | ts.PostfixUnaryExpression;

const isIncrement = (node: ts.Node): node is Increment =>
  (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
  INCREMENT_OPERATORS.has(node.operator);

// A variable, or a property of an object that a name holds, whose key no getter has, which reads
// and writes a number without running code.
// The boolean type keeps TypeScript from narrowing the increment as a proxy's operation.
const isPlainIncrement = (node: Increment, context: Context): boolean => {
  const operand = node.operand;
  const names = getTypeNames(context.checker.getTypeAtLocation(operand), context.checker);
  const isNumeric =
    names !== undefined && names.every((name) => name === "number" || name === "bigint");
  const isPlainObject = (object: ts.Expression): boolean =>
    ts.isIdentifier(object) ||
    object.kind === ts.SyntaxKind.ThisKeyword ||
    (ts.isPropertyAccessExpression(object) &&
      !getGetterKeys(object).has(object.name.text) &&
      isPlainObject(object.expression));
  return (
    isNumeric &&
    !isProxyOperation(node, context) &&
    (ts.isIdentifier(operand) ||
      (ts.isPropertyAccessExpression(operand) &&
        operand.questionDotToken === undefined &&
        !getGetterKeys(operand).has(operand.name.text) &&
        isPlainObject(operand.expression)))
  );
};

// Whether evaluating a node reads only names and keys that an assignment or an increment doesn't
// write, so that it can run before it.
const isUnaffected = (node: ts.Expression, operand: ts.Expression, context: Context): boolean =>
  ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)
    ? isUnaffected(node.expression, operand, context)
    : ts.isIdentifier(node)
      ? !ts.isIdentifier(operand) ||
        getSymbol(node, context.checker) !== getSymbol(operand, context.checker)
      : ts.isPropertyAccessExpression(node)
        ? node.questionDotToken === undefined &&
          !getGetterKeys(node).has(node.name.text) &&
          (!ts.isPropertyAccessExpression(operand) || node.name.text !== operand.name.text) &&
          isUnaffected(node.expression, operand, context)
        : ts.isStringLiteral(node) ||
          ts.isNumericLiteral(node) ||
          node.kind === ts.SyntaxKind.ThisKeyword;

// Whether an assignment's target evaluates its object and key without what an earlier one writes.
const isUnwritten = (target: ts.Expression, operand: ts.Expression, context: Context) =>
  ts.isPropertyAccessExpression(target)
    ? target.questionDotToken === undefined && isUnaffected(target.expression, operand, context)
    : ts.isElementAccessExpression(target) &&
      target.questionDotToken === undefined &&
      isUnaffected(target.expression, operand, context) &&
      isUnaffected(target.argumentExpression, operand, context);

// What an increment, or an assignment to a name, writes, which runs no code that could write more.
const getWrittenOperand = (node: ts.BinaryExpression | Increment) =>
  isIncrement(node) ? node.operand : ts.isIdentifier(node.left) ? node.left : undefined;

// A compound or logical assignment to a property whose object, key, and value read only names and
// literals, so that it can run before the rest of its statement, which then reads its result.
const isMemberUpdate = (node: ts.BinaryExpression) => {
  const isPlain = (part: ts.Expression) =>
    ts.isIdentifier(part) ||
    ts.isLiteralExpression(part) ||
    [
      ts.SyntaxKind.ThisKeyword,
      ts.SyntaxKind.TrueKeyword,
      ts.SyntaxKind.FalseKeyword,
      ts.SyntaxKind.NullKeyword,
    ].includes(part.kind);
  const target = node.left;
  return (
    isPlain(node.right) &&
    ((ts.isPropertyAccessExpression(target) &&
      target.questionDotToken === undefined &&
      isPlain(target.expression)) ||
      (ts.isElementAccessExpression(target) &&
        target.questionDotToken === undefined &&
        isPlain(target.expression) &&
        isPlain(target.argumentExpression)))
  );
};

// Runs an assignment or an increment as a statement, which gives what it evaluates to.
const runAssignment = (
  node: ts.BinaryExpression | Increment,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  // An increment gives its operand's number from before, or after, as its prefix form does.
  if (isIncrement(node)) {
    const before = translateExpression(node.operand, path.scope, context);
    return translateExpressionStatement(node, path, context, frame, (after) =>
      continueWith(
        after,
        ts.isPostfixUnaryExpression(node)
          ? before
          : translateExpression(node.operand, after.scope, context),
      ),
    );
  }
  const target = ts.isIdentifier(node.left) ? getSymbol(node.left, context.checker) : undefined;
  // An update to a property gives what it writes, which a typed array, say, may not hold.
  const update = isMemberUpdate(node) ? getUpdate(node, path, context) : undefined;
  const value =
    update !== undefined
      ? update(translateExpression(node.left, path.scope, context))
      : target === undefined
        ? translateExpression(node.right, path.scope, context)
        : undefined;
  return translateExpressionStatement(node, path, context, frame, (after) => {
    const result = value ?? (target === undefined ? undefined : after.scope.bindings.get(target));
    if (result === undefined) throw new TlaTypeScriptError("Unsupported assignment", node);
    return continueWith(after, result);
  });
};

const SHORT_CIRCUITS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

// A name or a literal, or what a statement already evaluated, which reads no code, as does a comma
// of them.
const isPlainOperand = (node: ts.Expression, results: Scope["results"]): boolean =>
  results.has(node) ||
  ts.isIdentifier(node) ||
  ts.isLiteralExpression(node) ||
  [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
    node.kind,
  ) ||
  (ts.isParenthesizedExpression(node) && isPlainOperand(node.expression, results)) ||
  (ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    isPlainOperand(node.left, results) &&
    isPlainOperand(node.right, results));

// The reads of the name that a hoisted assignment writes, in the operands that its operators
// evaluate before it, as they are before it runs.
const getEarlierReads = (
  hoisted: ts.BinaryExpression | Increment,
  root: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  const written = getWrittenOperand(hoisted);
  const symbol =
    written !== undefined && ts.isIdentifier(written)
      ? getSymbol(written, context.checker)
      : undefined;
  const getEarlier = (node: ts.Node): ts.Expression[] => {
    const parent = node.parent;
    if (node === root || parent === undefined) return [];
    const isOperand =
      ts.isBinaryExpression(parent) &&
      parent.right === node &&
      !(
        parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      );
    return [...(isOperand ? [parent.left] : []), ...getEarlier(parent)];
  };
  // Each earlier operand is plain, so it reads only names.
  const getNames = (node: ts.Expression): ts.Identifier[] =>
    scope.results.has(node)
      ? []
      : ts.isIdentifier(node)
        ? [node]
        : ts.isParenthesizedExpression(node)
          ? getNames(node.expression)
          : [];
  return symbol === undefined
    ? []
    : getEarlier(hoisted)
        .flatMap(getNames)
        .filter((name) => getSymbol(name, context.checker) === symbol)
        .map((name): [ts.Expression, Expression] => [
          name,
          translateExpression(name, scope, context),
        ]);
};

// The assignment that a statement evaluates first, inside an expression, which can run as a
// statement before it, since nothing the statement evaluates before it sees the change.
const getLeadingAssignment = (
  node: ts.Expression,
  results: ReadonlyMap<ts.Expression, Expression>,
  context: Context,
): ts.BinaryExpression | Increment | undefined => {
  if (results.has(node)) return undefined;
  if (isIncrement(node)) return isPlainIncrement(node, context) ? node : undefined;
  // A unary operator evaluates its operand before it converts it.
  if (ts.isPrefixUnaryExpression(node)) return getLeadingAssignment(node.operand, results, context);
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    const leading = getLeadingAssignment(node.expression, results, context);
    if (leading !== undefined || !ts.isElementAccessExpression(node)) return leading;
    // An element access evaluates its object, and then its key.
    const inKey = getLeadingAssignment(node.argumentExpression, results, context);
    return inKey !== undefined &&
      isIncrement(inKey) &&
      node.questionDotToken === undefined &&
      isUnaffected(node.expression, inKey.operand, context)
      ? inKey
      : undefined;
  }
  if (ts.isConditionalExpression(node))
    return getLeadingAssignment(node.condition, results, context);
  // A call evaluates its callee first, which reading a getter could make see the change.
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const first = node.arguments?.at(0);
    return first !== undefined && isPlainCallee(node.expression, context)
      ? getLeadingAssignment(first, results, context)
      : undefined;
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  if (kind !== ts.SyntaxKind.EqualsToken) {
    const isAssignment =
      kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
    if (!isAssignment) {
      const inLeft = getLeadingAssignment(node.left, results, context);
      if (inLeft !== undefined || SHORT_CIRCUITS.has(kind) || !isPlainOperand(node.left, results)) {
        return inLeft;
      }
      // An operator reads a name or a literal before its right operand, which then assigns a name,
      // which getEarlierReads keeps as the operator read it.
      const inRight = getLeadingAssignment(node.right, results, context);
      const written = inRight === undefined ? undefined : getWrittenOperand(inRight);
      return written !== undefined && ts.isIdentifier(written) ? inRight : undefined;
    }
    if (!ts.isIdentifier(node.left)) return isMemberUpdate(node) ? node : undefined;
    // A compound assignment reads its name before its value, which a logical one may not evaluate.
    const inner = LOGICAL_OPERATORS.has(kind)
      ? undefined
      : getLeadingAssignment(node.right, results, context);
    const written = inner === undefined ? undefined : getWrittenOperand(inner);
    return written !== undefined && isUnaffected(node.left, written, context) ? inner : node;
  }
  const isPattern =
    ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left);
  if (ts.isIdentifier(node.left) || isPattern) {
    return getLeadingAssignment(node.right, results, context) ?? node;
  }
  // A property's assignment evaluates its object and key, then its value.
  const inner = getLeadingAssignment(node.right, results, context);
  const written = inner === undefined ? undefined : getWrittenOperand(inner);
  return written !== undefined && isUnwritten(node.left, written, context) ? inner : undefined;
};

// The await that a node evaluates before anything else.
const getLeadingAwait = (
  node: ts.Expression,
  results: ReadonlyMap<ts.Expression, Expression>,
): ts.AwaitExpression | undefined => {
  if (results.has(node)) return undefined;
  if (ts.isAwaitExpression(node)) return getLeadingAwait(node.expression, results) ?? node;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    return getLeadingAwait(node.expression, results);
  }
  if (ts.isPrefixUnaryExpression(node)) return getLeadingAwait(node.operand, results);
  if (ts.isConditionalExpression(node)) return getLeadingAwait(node.condition, results);
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    return ts.isIdentifier(node.left) ? getLeadingAwait(node.right, results) : undefined;
  }
  const isAssignment =
    kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
  return isAssignment ? undefined : getLeadingAwait(node.left, results);
};

const getStatementAwait = (statement: ts.Statement, path: Path) => {
  const evaluated = getEvaluated(statement);
  return evaluated === undefined ? undefined : getLeadingAwait(evaluated, path.scope.results);
};

// An await, which suspends the async function's body until the promise of its value settles.
const translateAwait = (
  node: ts.AwaitExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const awaitTo = frame.awaitTo;
  const throwTo = frame.throwTo;
  if (awaitTo === undefined) throw new TlaTypeScriptError("Unsupported await", node);
  const operand = getCast(node.expression);
  const settleWith = (current: Path, value: Expression) =>
    awaitTo(current, value, operand, continueWith, (rejected, thrown) => {
      const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
      return throwTo === undefined
        ? leaf(uncaught)
        : throwTo(rejected, { value: thrown, uncaught });
    });
  if (isPromiseConstruction(operand, context)) {
    return translatePromiseConstruction(operand, path, context, frame, (after, value) =>
      settleWith(after, value ?? getUndefined(context)),
    );
  }
  if (
    ts.isCallExpression(operand) &&
    !path.scope.results.has(operand) &&
    isStatementCall(operand, path, context)
  ) {
    return translateCallStatement(operand, path, context, frame, (after, value) =>
      settleWith(after, value ?? getUndefined(context)),
    );
  }
  if (hasCall(operand, context)) throw new TlaTypeScriptError("Unsupported await", node);
  return allocate(operand, path, context, (inner) =>
    settleWith(inner, translateExpression(operand, inner.scope, context)),
  );
};

const VALUE_KEYWORDS = new Set([
  ts.SyntaxKind.TrueKeyword,
  ts.SyntaxKind.FalseKeyword,
  ts.SyntaxKind.NullKeyword,
  ts.SyntaxKind.ThisKeyword,
]);

interface LeadingCall {
  call: ts.CallExpression | undefined;
  // Whether evaluation may stop or branch before what follows, which then can't run first.
  isBlocked: boolean;
  // The operation that converts an object to a primitive first, which runs code, so nothing after
  // it can run before it.
  conversion?: ts.Expression;
  // The read that a getter which changes something may answer first, or an operation on a proxy,
  // whose trap may change something, which runs as a statement.
  read?: ts.Expression;
  // A short-circuit or a conditional whose operand that runs only sometimes is a call that only
  // statements can run, so the statement branches on which operand gives the value.
  branch?: ts.BinaryExpression | ts.ConditionalExpression;
}

// The first call in a node's evaluation order that only statements can run, with the nodes that
// evaluate before it, which can run it first unless they read what it changes.
const findLeadingCall = (
  node: ts.Node,
  before: ts.Node[],
  path: Path,
  context: Context,
): LeadingCall => {
  const none = { call: undefined, isBlocked: false };
  const blocked = { call: undefined, isBlocked: true };
  const evaluate = (inner: ts.Node) => {
    before.push(inner);
    return none;
  };
  const inOrder = (nodes: readonly ts.Node[]): LeadingCall => {
    for (const inner of nodes) {
      const found = findLeadingCall(inner, before, path, context);
      if (found.call !== undefined || found.isBlocked) return found;
    }
    return none;
  };
  // An operation that converts its operands, which it evaluates first.
  const thenConverted = (found: LeadingCall): LeadingCall =>
    found.call !== undefined || found.isBlocked
      ? found
      : ts.isExpression(node) && getConversion(node, context) !== undefined
        ? { call: undefined, isBlocked: true, conversion: node }
        : none;
  if (ts.isExpression(node) && path.scope.results.has(node)) return none;
  // An object that spreads a proxy runs its traps.
  if (ts.isObjectLiteralExpression(node) && isProxyOperation(node, context)) {
    return { call: undefined, isBlocked: true, read: node };
  }
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isSpreadElement(node) ||
    ts.isSpreadAssignment(node)
  ) {
    return findLeadingCall(node.expression, before, path, context);
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    const found = ts.isPropertyAccessExpression(node)
      ? findLeadingCall(node.expression, before, path, context)
      : inOrder([node.expression, node.argumentExpression]);
    if (found.call !== undefined || found.isBlocked) return found;
    return isGetterRead(node, context) || isProxyOperation(node, context)
      ? { call: undefined, isBlocked: true, read: node }
      : evaluate(node);
  }
  if (ts.isPrefixUnaryExpression(node)) {
    return node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken
      ? blocked
      : thenConverted(findLeadingCall(node.operand, before, path, context));
  }
  if (
    isProxyOperation(node, context) &&
    (ts.isDeleteExpression(node) || ts.isCallExpression(node) || ts.isNewExpression(node))
  ) {
    const found = !ts.isDeleteExpression(node)
      ? inOrder(node.arguments ?? [])
      : findLeadingCall(getCast(node.expression), before, path, context);
    return found.call !== undefined || found.isBlocked
      ? found
      : { call: undefined, isBlocked: true, read: node };
  }
  if (ts.isArrayLiteralExpression(node)) return inOrder(node.elements);
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) ||
        ts.isShorthandPropertyAssignment(property) ||
        ts.isSpreadAssignment(property),
    )
      ? inOrder(
          node.properties.flatMap((property): ts.Node[] =>
            ts.isPropertyAssignment(property)
              ? ts.isComputedPropertyName(property.name)
                ? [property.name.expression, property.initializer]
                : [property.initializer]
              : ts.isShorthandPropertyAssignment(property)
                ? [property.name]
                : [property],
          ),
        )
      : blocked;
  }
  if (ts.isTemplateExpression(node)) {
    return thenConverted(inOrder(node.templateSpans.map((span) => span.expression)));
  }
  // An operand that runs a call that only statements can run, an increment, or a branch of these.
  const isBranchRun = (operand: ts.Expression) => {
    const run = skipCasts(operand);
    const found = findLeadingCall(run, [], path, context);
    return (
      found.call !== undefined ||
      (isIncrement(run) && isPlainIncrement(run, context)) ||
      found.branch === run
    );
  };
  // An operand that runs nothing, which the operation evaluates as a value.
  const isPlainOperand = (operand: ts.Expression) => {
    const found = findLeadingCall(operand, [], path, context);
    return (
      found.call === undefined &&
      found.read === undefined &&
      found.conversion === undefined &&
      !found.isBlocked
    );
  };
  // A condition or a short-circuit's left operand always runs first, so a read that it runs first
  // runs before the operand that runs only sometimes.
  if (ts.isConditionalExpression(node)) {
    const found = findLeadingCall(node.condition, before, path, context);
    return found.call !== undefined || found.read !== undefined || found.branch !== undefined
      ? found
      : found.isBlocked
        ? blocked
        : isBranchRun(node.whenTrue) || isBranchRun(node.whenFalse)
          ? { ...blocked, branch: node }
          : isPlainOperand(node.whenTrue) && isPlainOperand(node.whenFalse)
            ? evaluate(node)
            : blocked;
  }
  if (ts.isBinaryExpression(node)) {
    const kind = node.operatorToken.kind;
    if (
      kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      kind === ts.SyntaxKind.BarBarToken ||
      kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      const found = findLeadingCall(node.left, before, path, context);
      return found.call !== undefined || found.read !== undefined || found.branch !== undefined
        ? found
        : found.isBlocked
          ? blocked
          : isBranchRun(node.right)
            ? { ...blocked, branch: node }
            : isPlainOperand(node.right)
              ? evaluate(node)
              : blocked;
    }
    if (kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(node.left)) {
      return findLeadingCall(node.right, before, path, context);
    }
    // An assignment to a proxy's key evaluates the proxy and the value before its trap runs.
    if (
      kind === ts.SyntaxKind.EqualsToken &&
      isProxyOperation(node, context) &&
      (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
    ) {
      const found = inOrder([node.left.expression, node.right]);
      return found.call !== undefined || found.isBlocked
        ? found
        : { call: undefined, isBlocked: true, read: node };
    }
    const isAssignment =
      kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
    // A compound assignment reads its variable before it evaluates its right operand, so it
    // converts first only where that operand runs nothing.
    // An assignment to a property evaluates the object and the key, and then the value.
    if (
      kind === ts.SyntaxKind.EqualsToken &&
      (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
    ) {
      const found = inOrder(
        ts.isPropertyAccessExpression(node.left)
          ? [node.left.expression, node.right]
          : [node.left.expression, node.left.argumentExpression, node.right],
      );
      return found.call !== undefined || found.isBlocked ? found : blocked;
    }
    if (isAssignment) {
      const right = isCompoundAssignment(node)
        ? findLeadingCall(node.right, [], path, context)
        : none;
      return isCompoundAssignment(node) && right.call === undefined && !right.isBlocked
        ? thenConverted(right)
        : blocked;
    }
    const found = thenConverted(inOrder([node.left, node.right]));
    return found.call === undefined && !found.isBlocked && isProxyOperation(node, context)
      ? { call: undefined, isBlocked: true, read: node }
      : found;
  }
  // A Boolean, Number, or String object, or a proxy, runs no code where a statement makes it. Any
  // other new runs what its arguments need first, such as a call in an error's message.
  if (
    ts.isNewExpression(node) &&
    (getNewWrapper(node, context) !== undefined ||
      isNewProxy(node, context) ||
      getNewBuffer(node, context) !== undefined)
  ) {
    const found = inOrder(node.arguments ?? []);
    return found.call !== undefined || found.isBlocked ? found : evaluate(node);
  }
  if (ts.isNewExpression(node)) {
    const found = inOrder([node.expression, ...(node.arguments ?? [])]);
    return found.call !== undefined || found.isBlocked ? found : blocked;
  }
  if (ts.isCallExpression(node)) {
    // A method of a call's result runs the call first.
    const receiver = ts.isPropertyAccessExpression(node.expression)
      ? getCast(node.expression.expression)
      : undefined;
    // An array literal's method runs its elements first.
    const isListed =
      receiver !== undefined &&
      ts.isArrayLiteralExpression(receiver) &&
      !receiver.elements.some(ts.isSpreadElement);
    const fromReceiver =
      receiver !== undefined && (ts.isCallExpression(receiver) || isListed)
        ? findLeadingCall(receiver, before, path, context)
        : none;
    if (fromReceiver.call !== undefined || fromReceiver.isBlocked) return fromReceiver;
    if (!isListed && !isPlainCallee(node.expression, context, path.scope.results)) return blocked;
    const found = thenConverted(inOrder(node.arguments));
    if (found.call !== undefined || found.isBlocked) return found;
    if (isGeneratorType(node, context)) return blocked;
    return isStatementCall(node, path, context) || isRemoving(node, context)
      ? { call: node, isBlocked: false }
      : evaluate(node);
  }
  return ts.isIdentifier(node) ||
    ts.isLiteralExpression(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    VALUE_KEYWORDS.has(node.kind)
    ? evaluate(node)
    : blocked;
};

// The new RegExp of literals that make no valid regexp in an expression, which throws a SyntaxError
// where only names, literals, and the operands of arithmetic evaluate before it.
const getInvalidRegExp = (node: ts.Node, context: Context): ts.Node | undefined => {
  if (isInvalidRegExp(node, context)) return node;
  const operands = ts.isParenthesizedExpression(node)
    ? [node.expression]
    : ts.isBinaryExpression(node) && ARITHMETIC_OPERATORS.has(node.operatorToken.kind)
      ? [node.left, node.right]
      : (ts.isNewExpression(node) || ts.isCallExpression(node)) && ts.isIdentifier(node.expression)
        ? (node.arguments ?? [])
        : ts.isTemplateExpression(node)
          ? node.templateSpans.map((span) => span.expression)
          : [];
  const position = operands.findIndex(
    (operand) => !ts.isIdentifier(operand) && !ts.isLiteralExpression(operand),
  );
  return position === -1 ? undefined : getInvalidRegExp(operands[position], context);
};

// The expression that a statement evaluates first, where it runs what the expression needs as
// statements before it.
const getEvaluated = (statement: ts.Statement) =>
  ts.isExpressionStatement(statement)
    ? statement.expression
    : ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : ts.isIfStatement(statement)
        ? statement.expression
        : ts.isReturnStatement(statement) || ts.isThrowStatement(statement)
          ? statement.expression
          : undefined;

// The call inside a statement's expression that runs as its own statement first, other than one
// that the statement itself runs.
const getHoistedCall = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const outer = skipCasts(evaluated);
  return getLeadingCall(
    evaluated,
    (call) =>
      // An if statement evaluates its condition, and runs no call of it.
      (call !== outer || ts.isIfStatement(statement)) &&
      !(
        ts.isBinaryExpression(outer) &&
        outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        skipCasts(outer.right) === call
      ) &&
      // A call's first argument already runs first.
      !(ts.isCallExpression(outer) && outer.arguments.at(0) === call),
    path,
    context,
  );
};

const getLeadingCall = (
  node: ts.Expression,
  isHoisted: (call: ts.CallExpression) => boolean,
  path: Path,
  context: Context,
) => {
  const before: ts.Node[] = [];
  const call = findLeadingCall(node, before, path, context).call;
  // The statement makes the objects that the call's arguments make, but for regexps, which the call
  // makes as it runs first, and the object literals of a change such as a definition's descriptor,
  // which it makes as it runs first too.
  if (
    call === undefined ||
    !isHoisted(call) ||
    getAllocated(call, context).some(
      (made) =>
        !ts.isRegularExpressionLiteral(made) &&
        !(isObjectChange(call, context) && ts.isObjectLiteralExpression(made)),
    )
  ) {
    return undefined;
  }
  // A name or a property that the statement reads before the call keeps the value that it had then.
  const reads = getEarlyReads(
    [call],
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === call) === undefined),
    path,
    context,
  );
  const properties = reads.filter(
    (inner): inner is ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression =>
      ts.isIdentifier(inner) ||
      ts.isPropertyAccessExpression(inner) ||
      ts.isElementAccessExpression(inner),
  );
  if (properties.length < reads.length) {
    throw new TlaTypeScriptError("tla-ts can't run this before what reads what it changes", call);
  }
  return { call, reads: properties };
};

// The path after a call that runs first, whose results hold the call's value and what the statement
// read before it.
const withLeadingResults = (
  leading: { call: ts.CallExpression; reads: readonly ts.Expression[] },
  path: Path,
  after: Path,
  value: Expression | undefined,
  context: Context,
): Path => ({
  ...after,
  scope: {
    ...after.scope,
    results: new Map([
      ...after.scope.results,
      ...leading.reads.map((read): [ts.Expression, Expression] => [
        read,
        translateExpression(read, path.scope, context),
      ]),
      [leading.call, value ?? getUndefined(context)],
    ]),
  },
});

// The short-circuit or the conditional that a statement's expression evaluates first whose operand
// that runs only sometimes is a call that only statements can run. Nothing that the statement
// evaluates before it may read what the call changes.
const getHoistedBranch = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).branch;
  if (node === undefined) return undefined;
  const operands = ts.isConditionalExpression(node)
    ? [node.whenTrue, node.whenFalse]
    : [node.right];
  rejectEarlyRun(
    node,
    operands.map(skipCasts),
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  return node;
};

// The operation that a statement's expression evaluates first that converts an object to a
// primitive, which runs as its own statement. Nothing that the statement evaluates before it may
// read what the conversion's methods change.
const getHoistedConversion = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).conversion;
  const conversion = node === undefined ? undefined : getConversion(node, context);
  if (node === undefined || conversion === undefined) return undefined;
  // A compound assignment assigns where it's all that the statement evaluates.
  if (
    isCompoundAssignment(node) &&
    !(ts.isExpressionStatement(statement) && skipCasts(statement.expression) === node)
  ) {
    return undefined;
  }
  rejectEarlyRun(
    node,
    getConversionFunctions(node, context),
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  return { node, conversion };
};

// The read that a statement's expression evaluates first whose getter may change something, which
// runs as its own statement. Nothing that the statement evaluates before it may read what the
// getters change.
const getHoistedRead = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).read;
  if (node === undefined) return undefined;
  rejectEarlyRun(
    node,
    getReadFunctions(node, context),
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  return node;
};

// Runs the first call that a node evaluates that only statements can run, and then the rest with
// its value, or gives undefined where there's none.
export const runLeadingCall = (
  node: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  rest: (path: Path) => Formula,
) => {
  const leading = getLeadingCall(node, () => true, path, context);
  return (
    leading &&
    translateCallStatement(leading.call, path, context, frame, (after, value) =>
      rest(withLeadingResults(leading, path, after, value, context)),
    )
  );
};

const getHoistedAssignment = (statement: ts.Statement, path: Path, context: Context) => {
  const results = path.scope.results;
  if (ts.isExpressionStatement(statement)) {
    const hoisted = getLeadingAssignment(statement.expression, results, context);
    return hoisted === skipCasts(statement.expression) ? undefined : hoisted;
  }
  const evaluated = ts.isVariableStatement(statement)
    ? statement.declarationList.declarations[0]?.initializer
    : ts.isIfStatement(statement)
      ? statement.expression
      : ts.isReturnStatement(statement) || ts.isThrowStatement(statement)
        ? statement.expression
        : undefined;
  return evaluated === undefined ? undefined : getLeadingAssignment(evaluated, results, context);
};

export const translateStatements = (
  statements: readonly ts.Statement[],
  path: Path,
  context: Context,
  frame: Frame,
): Formula => {
  if ((path.scope.destructured ?? []).length > 0) {
    const checked = { ...path, scope: { ...path.scope, destructured: undefined } };
    return throwOnDestructured(
      path.scope,
      checked,
      context,
      frame,
      translateStatements(statements, checked, context, frame),
    );
  }
  if (statements.length === 0) return frame.next(path);
  const statement = statements[0];
  const continueWith = (inner: Path) =>
    translateStatements(statements.slice(1), inner, context, frame);
  if (ts.isBlock(statement)) {
    return translateStatements(statement.statements, path, context, {
      ...frame,
      next: continueWith,
    });
  }
  if (ts.isEmptyStatement(statement)) return continueWith(path);
  const evaluated = getEvaluated(statement);
  const invalidRegExp = evaluated === undefined ? undefined : getInvalidRegExp(evaluated, context);
  if (invalidRegExp !== undefined) {
    return throwError("SyntaxError", path, invalidRegExp, context, frame);
  }
  // A statement that reads a name that no declaration binds, before anything else it evaluates
  // runs, throws a ReferenceError there.
  const unresolved = evaluated === undefined ? undefined : getUnresolvedRead(evaluated, context);
  if (unresolved !== undefined)
    return throwError("ReferenceError", path, unresolved, context, frame);
  // An await statement whose promise fulfilled, or a conversion that ran, drops the value.
  if (
    ts.isExpressionStatement(statement) &&
    (ts.isAwaitExpression(skipCasts(statement.expression)) ||
      getConversion(skipCasts(statement.expression), context) !== undefined ||
      isGetterRead(skipCasts(statement.expression), context) ||
      isProxyOperation(skipCasts(statement.expression), context)) &&
    path.scope.results.has(skipCasts(statement.expression))
  ) {
    return continueWith(path);
  }
  const awaited = getStatementAwait(statement, path);
  if (awaited !== undefined) {
    return translateAwait(awaited, path, context, frame, (after, value) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: { ...after.scope, results: new Map([...after.scope.results, [awaited, value]]) },
        },
        context,
        frame,
      ),
    );
  }
  const hoistedCall = getHoistedCall(statement, path, context);
  if (hoistedCall !== undefined) {
    return allocate(hoistedCall.call, path, context, (allocated) =>
      translateCallStatement(hoistedCall.call, allocated, context, frame, (after, value) =>
        translateStatements(
          statements,
          withLeadingResults(hoistedCall, allocated, after, value, context),
          context,
          frame,
        ),
      ),
    );
  }
  const branch = getHoistedBranch(statement, path, context);
  if (branch !== undefined) {
    // A branch whose operand is a branch runs that one where it runs.
    const runBranch = (
      node: NonNullable<LeadingCall["branch"]>,
      current: Path,
      withValue: (after: Path, value: Expression) => Formula,
    ): Formula => {
      // An operand runs the calls in it that only statements can run, in order, before the rest.
      const evaluate = (operand: ts.Expression, next: Path): Formula => {
        const run = skipCasts(operand);
        const inner = findLeadingCall(run, [], next, context).branch;
        if (inner !== undefined && inner === run) return runBranch(inner, next, withValue);
        // An increment gives its operand's number from before, or after, as its prefix form does.
        if (isIncrement(run) && isPlainIncrement(run, context)) {
          const before = translateExpression(run.operand, next.scope, context);
          return translateExpressionStatement(run, next, context, frame, (after) =>
            withValue(
              after,
              ts.isPostfixUnaryExpression(run)
                ? before
                : translateExpression(run.operand, after.scope, context),
            ),
          );
        }
        if (ts.isCallExpression(run) && !next.scope.results.has(run)) {
          return allocate(run, next, context, (allocated) =>
            translateCallStatement(run, allocated, context, frame, (after, value) =>
              withValue(after, value ?? getUndefined(context)),
            ),
          );
        }
        const leading = getLeadingCall(operand, () => true, next, context);
        return leading === undefined
          ? withValue(next, translateExpression(operand, next.scope, context))
          : allocate(leading.call, next, context, (allocated) =>
              translateCallStatement(leading.call, allocated, context, frame, (after, value) =>
                evaluate(operand, withLeadingResults(leading, allocated, after, value, context)),
              ),
            );
      };
      if (ts.isConditionalExpression(node)) {
        return ifThenElse(
          translateCondition(node.condition, current.scope, context),
          evaluate(node.whenTrue, current),
          evaluate(node.whenFalse, current),
        );
      }
      const kind = node.operatorToken.kind;
      context.prelude.add("Null");
      context.prelude.add("Undefined");
      const isRight =
        kind === ts.SyntaxKind.QuestionQuestionToken
          ? apply("\\in", [
              translateExpression(node.left, current.scope, context),
              set([identifier("Null"), identifier("Undefined")]),
            ])
          : kind === ts.SyntaxKind.AmpersandAmpersandToken
            ? translateCondition(node.left, current.scope, context)
            : not(translateCondition(node.left, current.scope, context));
      return ifThenElse(isRight, evaluate(node.right, current), evaluate(node.left, current));
    };
    // What follows translates once, for each operand that gives the value.
    return translateJoined(
      branch,
      path,
      context,
      (after, value) =>
        translateStatements(
          statements,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, [branch, value ?? getUndefined(context)]]),
            },
          },
          context,
          frame,
        ),
      (next) => runBranch(branch, path, next),
    );
  }
  const hoisted = getHoistedAssignment(statement, path, context);
  const earlier =
    hoisted === undefined || evaluated === undefined
      ? []
      : getEarlierReads(hoisted, evaluated, path.scope, context);
  if (hoisted !== undefined) {
    return runAssignment(hoisted, path, context, frame, (after, value) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, ...earlier, [hoisted, value]]),
          },
        },
        context,
        frame,
      ),
    );
  }
  const hoistedRead = getHoistedRead(statement, path, context);
  if (hoistedRead !== undefined) {
    const withRead = (after: Path, value: Expression) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [hoistedRead, value]]),
          },
        },
        context,
        frame,
      );
    return isGetterRead(hoistedRead, context) && !isProxyOperation(hoistedRead, context)
      ? runGetterRead(hoistedRead, path, context, frame, withRead)
      : runProxyOperation(hoistedRead, path, context, frame, withRead);
  }
  const converted = getHoistedConversion(statement, path, context);
  if (converted !== undefined) {
    const node = converted.node;
    return runConversion(node, converted.conversion, path, context, frame, (after, value) => {
      const assigned = isCompoundAssignment(node)
        ? assign(node.left, after, context, () => value)
        : after;
      return translateStatements(
        statements,
        {
          ...assigned,
          scope: {
            ...assigned.scope,
            results: new Map([...assigned.scope.results, [node, value]]),
          },
        },
        context,
        frame,
      );
    });
  }

  if (
    (ts.isClassDeclaration(statement) && isHeapClass(statement, context)) ||
    (ts.isFunctionDeclaration(statement) && isHeapFunction(statement, context))
  ) {
    const symbol = statement.name && getSymbol(statement.name, context.checker);
    return allocate(statement, path, context, (inner) => {
      const ref = inner.scope.allocated.get(statement);
      if (symbol === undefined || ref === undefined) {
        throw new TlaTypeScriptError("Name this class", statement);
      }
      return translateElements(
        ts.isClassLike(statement) ? getStaticElements(statement) : [],
        ref,
        {
          ...inner,
          scope: { ...inner.scope, bindings: new Map([...inner.scope.bindings, [symbol, ref]]) },
        },
        context,
        frame,
        continueWith,
      );
    });
  }
  if (ts.isVariableStatement(statement)) {
    if ((statement.declarationList.flags & ts.NodeFlags.Using) !== 0) {
      return translateUsing(
        statement.parent,
        statement.declarationList,
        statement.declarationList.declarations,
        path,
        context,
        frame,
        (inner, innerFrame) => translateStatements(statements.slice(1), inner, context, innerFrame),
      );
    }
    return translateDeclarations(
      statement.declarationList.declarations,
      path,
      context,
      frame,
      continueWith,
    );
  }
  if (ts.isIfStatement(statement)) {
    return translateJoined(statement, path, context, continueWith, (next) =>
      translateIf(
        statement,
        path.scope,
        context,
        (branch) => translateStatements([branch], path, context, { ...frame, next }),
        () => next(path),
      ),
    );
  }
  if (ts.isReturnStatement(statement)) {
    const returned = statement.expression;
    if (returned === undefined) return frame.exit(path);
    if (frame.inlining.size === 0) {
      throw new TlaTypeScriptError("Actions can't return a value", statement);
    }
    return allocate(returned, path, context, (inner) => {
      const constructed = getCast(returned);
      if (isPromiseConstruction(constructed, context)) {
        return translatePromiseConstruction(constructed, inner, context, frame, frame.exit);
      }
      const constructor = getConstructorRun(returned, context);
      if (constructor !== undefined && ts.isNewExpression(returned)) {
        return translateConstruction(returned, constructor, inner, context, frame, frame.exit);
      }
      if (
        ts.isCallExpression(returned) &&
        (!isLibraryCall(returned, context) ||
          isPromiseCall(returned, context) ||
          getLoopCall(returned, inner, context) !== undefined ||
          isObjectChange(returned, context) ||
          isStatementResult(returned, inner, context) ||
          isRemoving(returned, context))
      ) {
        return translateCallStatement(returned, inner, context, frame, frame.exit);
      }
      if (
        hasCall(returned, context, inner.scope.allocated) &&
        !inner.scope.results.has(skipCasts(returned)) &&
        !hasOnlyLiftableCalls(returned, inner, context)
      ) {
        throw new TlaTypeScriptError("Unsupported return", statement);
      }
      return frame.exit(inner, translateExpression(returned, inner.scope, context));
    });
  }
  if (ts.isBreakStatement(statement)) {
    if (frame.breakTo === undefined || statement.label !== undefined) {
      throw new TlaTypeScriptError("Unsupported break", statement);
    }
    return frame.breakTo(path);
  }
  if (ts.isContinueStatement(statement)) {
    if (frame.continueTo === undefined || statement.label !== undefined) {
      throw new TlaTypeScriptError("Unsupported continue", statement);
    }
    return frame.continueTo(path);
  }
  if (ts.isThrowStatement(statement)) {
    const uncaught = translateThrow(statement, path.scope, context);
    if (frame.throwTo === undefined) return leaf(uncaught);
    return frame.throwTo(path, {
      value: translateThrown(statement.expression, path.scope, context),
      uncaught,
    });
  }
  if (ts.isTryStatement(statement)) {
    return translateJoined(statement, path, context, continueWith, (next) =>
      translateTry(statement, path, context, frame, next),
    );
  }
  if (ts.isSwitchStatement(statement)) {
    return translateJoined(statement, path, context, continueWith, (next) =>
      translateSwitch(
        statement,
        path.scope,
        context,
        (clause) => translateStatements(clause, path, context, { ...frame, next, breakTo: next }),
        () => next(path),
      ),
    );
  }
  const assignment =
    ts.isExpressionStatement(statement) &&
    ts.isBinaryExpression(statement.expression) &&
    statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(statement.expression.left)
      ? statement.expression
      : undefined;
  const assigned = assignment && skipCasts(assignment.right);
  if (
    assignment !== undefined &&
    assigned !== undefined &&
    isIteratedTypedArray(assigned, context)
  ) {
    return translateIteratedTypedArray(assigned, path, context, frame, (after, value) =>
      shareHeap(
        assign(assignment.left, after, context, () => value),
        context,
        continueWith,
      ),
    );
  }
  if (ts.isExpressionStatement(statement)) {
    return allocate(statement.expression, path, context, (inner) =>
      translateExpressionStatement(statement.expression, inner, context, frame, (after) =>
        shareHeap(after, context, continueWith),
      ),
    );
  }
  if (ts.isForOfStatement(statement) && statement.awaitModifier !== undefined) {
    return translateForAwait(statement, path, context, frame, continueWith);
  }
  if (ts.isForOfStatement(statement) && isTakingFromGenerators(statement, context)) {
    return translateForOfTaken(statement, path, context, frame, continueWith);
  }
  if (
    ts.isForOfStatement(statement) &&
    context.heap !== undefined &&
    isGeneratorType(statement.expression, context)
  ) {
    return translateForOfGenerator(statement, path, context, frame, continueWith);
  }
  if (ts.isIterationStatement(statement, false)) {
    return translateLoop(statement, path, context, frame, continueWith);
  }
  // A function declaration runs nothing where it stands: calls find the function it declares, and
  // one without a body, such as setTimeout, the host defines.
  if (ts.isFunctionDeclaration(statement)) return continueWith(path);
  throw new TlaTypeScriptError(`Unsupported statement: ${statement.getText()}`, statement);
};

// An action's body as a TLA+ action: each path that assigns a state variable becomes a step, and
// every other path disables the action.
export const translateAction = (
  statements: readonly ts.Statement[],
  scope: Scope,
  context: Context,
): Formula => {
  const finish = (path: Path): Formula => {
    if (!path.isAssigned) return DISABLED;
    const assignments = [...context.variables].map((entry) => ({
      name: entry[1],
      value: path.scope.bindings.get(entry[0]) ?? entry[1],
    }));
    const kept = assignments.filter((assignment) => assignment.value === assignment.name);
    return and([
      ...assignments
        .filter((assignment) => assignment.value !== assignment.name)
        .map((assignment) => leaf(apply("=", [prime(assignment.name), assignment.value]))),
      ...(kept.length > 0
        ? [leaf(unchanged(tuple(kept.map((assignment) => assignment.name))))]
        : []),
    ]);
  };
  return translateStatements(
    statements,
    {
      scope,
      mutable: new Set(context.variables.keys()),
      isAssigned: false,
      isLast: false,
      isLooping: false,
      generators: new Map(),
      tasks: EMPTY_TASKS,
    },
    context,
    {
      next: finish,
      exit: finish,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: undefined,
      yieldTo: undefined,
      awaitTo: undefined,
      inlining: new Set(),
    },
  );
};

// A function's body that an expression calls, where its statements change only its own locals,
// as the value it returns.
export const translateLocalStatements = (
  body: ts.Block,
  scope: Scope,
  context: Context,
): Formula => {
  const state = [
    ...context.variables.keys(),
    ...(context.heap === undefined ? [] : [context.heap]),
  ];
  const leave = (path: Path, value: Expression) => {
    if (state.some((symbol) => path.scope.bindings.get(symbol) !== scope.bindings.get(symbol))) {
      throw new TlaTypeScriptError(
        "A function that an expression calls can change only its locals",
        body,
      );
    }
    return leaf(value);
  };
  const owner = body.parent;
  return translateStatements(
    body.statements,
    {
      scope,
      // A parameter is a local binding, which the body may assign as it does a let.
      mutable: new Set(
        (ts.isFunctionLike(owner) ? owner.parameters : []).flatMap((parameter) => {
          const symbol = ts.isIdentifier(parameter.name)
            ? getSymbol(parameter.name, context.checker)
            : undefined;
          return symbol !== undefined && scope.bindings.has(symbol) ? [symbol] : [];
        }),
      ),
      isAssigned: false,
      isLast: false,
      // Its leaves are values, as a loop body's are.
      isLooping: true,
      generators: new Map(),
      tasks: undefined,
    },
    context,
    {
      next: (path) => leave(path, getUndefined(context)),
      exit: (path, value) => leave(path, value ?? getUndefined(context)),
      breakTo: undefined,
      continueTo: undefined,
      throwTo: undefined,
      yieldTo: undefined,
      awaitTo: undefined,
      inlining: new Set([body.parent]),
    },
  );
};

export const translateScript = (
  statements: readonly ts.Statement[],
  isLast: boolean,
  context: Context,
): Formula => {
  const finish = (path: Path) =>
    and(
      [...context.variables].map((entry) =>
        leaf(apply("=", [entry[1], path.scope.bindings.get(entry[0]) ?? entry[1]])),
      ),
    );
  const declared = statements.flatMap((statement) =>
    ts.isVariableStatement(statement) &&
    (statement.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0
      ? statement.declarationList.declarations.flatMap(
          (declaration) => getSymbol(declaration.name, context.checker) ?? [],
        )
      : [],
  );
  const scope = createStateScope(context);
  if (context.heap !== undefined) context.prelude.add("JavaScript");
  // A script's vars hold undefined until their declarations run.
  const hoisted = [...context.variables.keys()].filter((symbol) => {
    const declaration = symbol.valueDeclaration;
    return (
      isLast &&
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isVariableDeclarationList(declaration.parent) &&
      (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0
    );
  });
  const bindings = new Map([
    ...scope.bindings,
    ...hoisted.map((symbol): [ts.Symbol, Expression] => [symbol, getUndefined(context)]),
  ]);
  return translateStatements(
    statements,
    {
      scope: {
        ...scope,
        bindings:
          context.heap === undefined
            ? bindings
            : new Map([...bindings, [context.heap, identifier("EmptyHeap")]]),
        uninitialized: new Set(declared),
      },
      mutable: new Set(context.variables.keys()),
      isAssigned: false,
      isLast,
      isLooping: false,
      generators: new Map(),
      tasks: EMPTY_TASKS,
    },
    context,
    {
      next: (path) => drainTasks(path, finish),
      exit: (path) => drainTasks(path, finish),
      breakTo: undefined,
      continueTo: undefined,
      throwTo: undefined,
      yieldTo: undefined,
      // A module's body awaits as an async function's body does: the jobs run until the promise
      // settles, and then a job runs the rest of the body, with the state that the jobs left.
      awaitTo: (current, value, operand, onFulfilled, onRejected) =>
        awaitIn(
          current,
          operand ?? statements[0],
          value,
          operand,
          context,
          (resumer, settled, isRejected) =>
            (isRejected ? onRejected : onFulfilled)(
              enterBody(
                resumer,
                current,
                (symbol) => context.variables.has(symbol) || symbol === context.heap,
              ),
              settled,
            ),
          (suspended) => drainTasks(suspended, finish),
        ),
      inlining: new Set(),
    },
  );
};

const getRoot = (node: ts.Expression): ts.Expression => {
  if (isMethodCall(node) && node.expression.name.text === "get") {
    return getRoot(node.expression.expression);
  }
  return ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node)
    ? getRoot(node.expression)
    : node;
};

export const getWritten = (node: ts.Node) => {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
  ) {
    return node.left;
  }
  if (
    (ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) &&
    INCREMENT_OPERATORS.has(node.operator)
  ) {
    return node.operand;
  }
  return isMethodCall(node) && MUTATING_METHODS.has(node.expression.name.text)
    ? node.expression.expression
    : undefined;
};

// The variables or other root expressions that an assignment target writes, as a destructuring
// target writes each of its elements.
export const getWrittenRoots = (target: ts.Expression): ts.Expression[] => {
  if (ts.isArrayLiteralExpression(target)) return target.elements.flatMap(getWrittenRoots);
  if (ts.isObjectLiteralExpression(target)) {
    return target.properties.flatMap((property) =>
      ts.isPropertyAssignment(property)
        ? getWrittenRoots(property.initializer)
        : ts.isShorthandPropertyAssignment(property)
          ? [property.name]
          : ts.isSpreadAssignment(property)
            ? getWrittenRoots(property.expression)
            : [],
    );
  }
  if (ts.isSpreadElement(target)) return getWrittenRoots(target.expression);
  return [getRoot(target)];
};

const getWrittenSymbols = (target: ts.Expression, context: Context) =>
  getWrittenRoots(target).flatMap((root) => {
    const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
    return symbol === undefined ? [] : [symbol];
  });

// Whether a function assigns a state variable, directly or through a helper it calls.
export const writesState = (
  node: ts.Node,
  context: Context,
  visited = new Set<ts.Node>(),
): boolean => {
  const written = getWritten(node);
  if (
    written !== undefined &&
    getWrittenSymbols(written, context).some((symbol) => context.variables.has(symbol))
  ) {
    return true;
  }
  if (ts.isCallExpression(node)) {
    const helper = getTopLevelDeclaration(getSymbol(node.expression, context.checker));
    if (helper !== undefined && !visited.has(helper)) {
      visited.add(helper);
      if (writesState(helper, context, visited)) return true;
    }
  }
  return (
    ts.forEachChild(node, (child) => writesState(child, context, visited) || undefined) ?? false
  );
};
