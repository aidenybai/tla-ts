import ts from "@typescript/typescript6";
import { BUILT_INS } from "./built-ins";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import {
  checkElement,
  getCallbackReceiver,
  getArrayIteratorCall,
  getHeapArrayChange,
  getStoredCall,
  getArrayLikeChange,
  translateCopyWithinArguments,
  isArrayIteration,
  isStoredChange,
  isStoredStatement,
  isUntypedStoredCall,
  translateArrayChange,
  translateArrayIteratorPrototype,
  translateStringIteratorPrototype,
  translateStoredCall,
  translateHoldsIteratorMethod,
  getHeapElements,
  getHeapSetOrMapChange,
  translateHeapElements,
  translateArrayIteration,
  translatePatternIteration,
  translateStringIteration,
  isMaybePrimitive,
  isUniterable,
  getPatternHeap,
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
  isFreshReorder,
  translateSpliced,
  translateClampedIndex,
  translateSkipped,
  checkArrayMethod,
  translatePrimitiveMethod,
  translateSizeGetter,
  translateSortArguments,
  flattenReturned,
  translateLongRead,
} from "./collections";
import {
  findNodes,
  getFunctionCandidates,
  getFunctionValue,
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
  isFunctionObject,
  getElement,
  getAnyFunction,
  getCaptures,
  getHolder,
  getCapturedArguments,
  getClosures,
  isClosure,
  getBuiltInBase,
  isNestedFunction,
  type Closure,
  getFactoryCall,
  isAsyncFunction,
  isAsyncGenerator,
  isAnyGenerator,
  getLocalCaptures,
  isPlain,
  getConstruction,
  type Construction,
  getHeapClass,
  getNewClass,
  isInertValue,
  isLiteral,
  isNameRead,
  skipCasts,
  translateString,
  isPrivateMember,
  isStatic,
  isComputedField,
  getPrivateMember,
  getPrivateKey,
  getParameters,
  getRunConstructor,
  getRunFields,
  getFieldsAfterSuper,
  getSetters,
  getPropertySetters,
  getWrittenProperties,
  changesState,
  getArgumentsOwner,
  isStrictCode,
  isOnce,
  isVarFunction,
  getVarFunctionTarget,
  getOwnSymbol,
  getSharedDeclaration,
  getSharedWrite,
  getStaticTruth,
  getSymbol,
  isAssigned,
  getTopLevelDeclaration,
  getUndefined,
  getUnresolvable,
  isImplicitGlobal,
  isPlainWrite,
  isUnresolvable,
  isHeapClass,
  isHeapFunction,
  isMethodCall,
  isSuperAccess,
  type MethodCall,
  isStatementNew,
  share,
  isInlined,
  getFunctionOfKind,
  getPatternRead,
  getUnresolvedRead,
  getLeadingPrivate,
  isUnresolved,
  getBound,
  getBaseClass,
  getExtended,
  getSettableSupers,
  getDeferredSuperCalls,
  getSuperCall,
  isNullBased,
  getWithStop,
  rejectDeclaredCall,
  getAssignedTarget,
  getClassStop,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { UNSETTLED_AWAIT_WARNING } from "../exit-codes";
import {
  getConversion,
  getConversionFunctions,
  isAnyOperand,
  isCompoundAssignment,
  isObjectOperand,
  runConversion,
  runToPrimitive,
} from "./conversions";
import {
  getBuiltJsonText,
  getJsonText,
  getReplacers,
  getStringifyGetters,
  getRevival,
  isBigIntStringify,
  parseJson,
  translateBuiltJsonParse,
  replaceJson,
  reviveJson,
  translateHoldsJson,
  translateStringify,
} from "./json";
import {
  closeIterator,
  getIteratedSpreads,
  getIteratorFunctions,
  getTaken,
  isCaughtIteration,
  isIterablePattern,
  isIteratedPattern,
  isSteppedPattern,
  isIterableValue,
  isIteratedValue,
  isTaken,
  isUntypedPattern,
  mayGivePromises,
  openAsyncIterator,
  openIterator,
  readValue,
  stepFromSync,
  stepIterator,
  takeFromIterable,
  takeFromIterator,
  openFromIterator,
  takeEntries,
  takeEvery,
  takeSpreads,
} from "./iterators";
import {
  readGlobal,
  translateCondition,
  translateExpression,
  translateIteratedSequence,
  translateNode,
  translateOrderedValues,
  translateKey,
  translateSetKey,
  translateBigInt,
  translateToString,
  getHoleChecks,
  isInertBefore,
  isRawTemplate,
  getRawString,
  ARITHMETIC_OPERATORS,
  BIGINT_OPERATORS,
  BITWISE_OPERATORS,
} from "./expressions";
import { and, bindValue, DISABLED, type Formula, ifThenElse, letIn, leaf, render } from "./formula";
import {
  getCalledError,
  getErrorClass,
  getNodeLocation,
  isNativeErrorName,
  translateEngineError,
  translateThrown,
} from "./exceptions";
import {
  dispatchFollowed,
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
  getPatternAllocated,
  isMade,
  isNewError,
  getCandidateValue,
  getHeldName,
  getHeap,
  hasPrototypeArray,
  getIntlError,
  getNewWrapper,
  translateIntlKept,
  isAllocation,
  isArrayFromLength,
  isNewProxy,
  getNewBuffer,
  getViewCall,
  getGetterCall,
  getIntlMethodCall,
  getThisSymbolCall,
  translateNewBufferOf,
  isRevoke,
  getPrimitiveObjectCall,
  isObjectChange,
  isReflectChange,
  isReflectSet,
  isUnreachableChange,
  getDateCall,
  getDateSetter,
  translateAllocated,
  translateAllocatedValue,
  translateHasPrivate,
  translateHoldsMethod,
  translateMemberKey,
  translateClassRef,
  translateComputedKey,
  translateObjectChange,
  translateObjectValue,
  getSuperLookup,
  isFunctionValue,
  getOwnFunctionKeys,
  translatePropertyKey,
  translateErrorFields,
  getFormatCall,
  translateFunctionValue,
  getAnyProperty,
} from "./heap";
import {
  COLLECTIONS,
  getBuiltIn,
  getMissingMethod,
  isBuiltInObject,
  translateMissingMethod,
  getMadeRegExp,
  getStoredBuiltIn,
  isInvalidBigIntText,
  isInvalidRegExp,
  translateBuiltInValue,
  translateHoldsCallee,
  getGeneratorPrototypeRef,
  stopUnknownCall,
} from "./intrinsics";
import { getTypeNames, getURICall, translateToNumber, useJavaScript } from "./javascript";
import { getNamespaceRef, isLiteralValue } from "./namespaces";
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
  getMethods,
  getReadFunctions,
  getWrittenFunctions,
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
  getRestCopyGetters,
  getRestGetterKeys,
  getTrapFunctions,
  isProxyOperation,
  readDescriptor,
  readDescriptors,
  read,
  getKeyGetters,
  readPatternGetters,
  readRestGetters,
  readWith,
  callValue,
  writeWith,
  withHeap,
  runGetterRead,
  runProxyOperation,
} from "./protocols";
import {
  addResource,
  type Disposal,
  getIteratorDisposeCall,
  isAwaitUsing,
  translateIteratorDisposeCall,
  translateUsing,
} from "./disposal";
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
  translateArgumentValues,
  createStateScope,
  type Destructured,
  getArrowReceivers,
  getBoundNames,
  getDefaulted,
  getOptionalField,
  getThisOwner,
  initialize,
  isOwnClassName,
  isTopLevelLexical,
  rejectBeforeDeclaration,
  type Receiver,
  type Scope,
} from "./scope";
import {
  getRegExpProtocolAccessors,
  getRegExpProtocolCall,
  readFlags,
  runRegExpProtocolCall,
} from "./regexp-protocol";
import { getThrownMessage, isSharedCall, translateSharedCall } from "./shared-calls";
import {
  set,
  lambda,
  apply,
  boolean,
  bound,
  call,
  define,
  except,
  exceptAt,
  field,
  functionFrom,
  functionOf,
  getLocation,
  identifier,
  ifExpression,
  index,
  quantify,
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
  isOrderedCollection,
  getOrderedIteration,
  getPathStep,
  isHeapPattern,
  isHeapType,
  isAddedToBuiltIn,
  isBigIntLike,
  isNumberLike,
  isPrimitiveIndex,
  isBuiltInIteratorType,
  isGeneratorType,
  isScriptIteratorType,
  isSyncGeneratorType,
  isThrownToArrayPattern,
  isPrototypeRead,
  mayBeGeneratorType,
  ITERATOR_CONSUMERS,
  getIteratorFrom,
  ITERATOR_HELPERS,
  isSequenceType,
  rejectGeneratorUse,
  TYPED_ARRAYS,
  isNullishArrayMethodCall,
  isSizelessSetLikeCall,
  isSymbolIndexCall,
  getArrayMethodCall,
  REORDER_METHODS,
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
  // The derived constructors running whose this is still uninitialized, until their super(...).
  unboundThis?: ReadonlySet<ts.ConstructorDeclaration>;
}

interface KnownDefault {
  expression: ts.Expression;
  isRun: boolean;
}

interface Suspension {
  ref: Expression;
  // The function whose body a next runs, which a helper of an object that isn't an iterator lacks.
  generator: FunctionNode | undefined;
  // Runs the rest of the body from the path of the call that resumes it, with the value that a next
  // sends, or undefined once the generator completes.
  resume: ((path: Path, sent?: Expression) => Formula) | undefined;
  isStarted: boolean;
  // Whether it suspended inside a try or a yield*, which a return or a throw would have to run.
  isGuarded: boolean;
  // Runs the rest of the body from a yield as a return or a throw there would, through the finally
  // blocks and catch clauses around it, where a plain yield suspended it. An async generator's
  // return awaits its value there first.
  abort?: (path: Path, method: string, value: Expression | undefined) => Formula;
  isAsync: boolean;
  // The promises of the nexts that called an async generator while its body ran, with the values
  // they send, which it settles in order once it yields or completes.
  queue: readonly { request: string; sent: Expression | undefined }[];
  // The call that resumed the body, while it runs, which takes what it yields or returns.
  caller?: Caller;
  // Whether a step may make the suspension again once it's gone, as an array's or a string's
  // iterator, whose next reads where it is from the heap.
  isRestartable?: boolean;
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
          queued.request,
          getUndefined(context),
          true,
          false,
          context,
          drain,
        )
      : resume(
          {
            ...current,
            generators: new Map([
              ...current.generators,
              [
                name,
                {
                  ...waiting,
                  caller: getAsyncCaller(
                    node,
                    name,
                    current,
                    queued.request,
                    context,
                    continueWith,
                  ),
                },
              ],
            ]),
          },
          queued.sent,
        );
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
  // The name whose value the call changes.
  symbol: ts.Symbol;
  // Where a call without ?. finds its receiver undefined or null, so throws a TypeError.
  missing?: Expression;
}

export interface Thrown {
  value: Expression;
  uncaught: Expression;
  // The message and the place of a throw that a shared helper's operator gave, which the operator
  // of a helper that called it gives on.
  shared?: { message: Expression; place: Expression };
  // Whether the value is a generator object that tla-ts follows, from which a catch's array pattern
  // takes its values through the generator's next.
  isGenerator?: boolean;
}

interface YieldMode {
  // A yield* passes on what it yields, which an async generator doesn't await.
  isDelegated: boolean;
  // Whether a return or a throw at the yield would run code, such as a finally block or the close
  // of an iterator, which tla-ts doesn't follow.
  isGuarded: boolean;
  // A generator's yield* passes on the result object of the iterator it delegates to.
  isResult?: boolean;
  // What a return or a throw does at the yield, from the path of the call that resumes it.
  abortRest?: Suspension["abort"];
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
        rest: (path: Path, sent?: Expression) => Formula,
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

// Whether anything that tla-ts translates may run a collection's method that a script replaces at
// the top level. Only the adder qualifies, as the methods of sets read has, keys, and size of the
// sets they take. The adder may run where a construction from an iterable runs after the write, or
// where the script reads the adder from a collection or a value of any type, or reaches the
// collection other than to construct one, to test instances, to write the adder, or to keep the
// original adder in a constant before the write.
const isCollectionMethodRun = (write: ts.PropertyAccessExpression, context: Context) => {
  const prototype = write.expression;
  const collection = ts.isPropertyAccessExpression(prototype)
    ? getBuiltIn(prototype.expression, context)
    : undefined;
  const key = write.name.text;
  if (key !== (collection === "Set" || collection === "WeakSet" ? "add" : "set")) return true;
  const isTopLevel = (node: ts.Node) =>
    ts.findAncestor(
      node.parent,
      (ancestor) =>
        ts.isFunctionLike(ancestor) ||
        ts.isClassLike(ancestor) ||
        ts.isIterationStatement(ancestor, false),
    ) === undefined;
  const isWritten = (node: ts.Node) =>
    ts.isBinaryExpression(node.parent) &&
    node.parent.left === node &&
    node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
  // A write of the adder, or a constant that keeps the original before the write.
  const isAdderKept = (node: ts.Node) =>
    isTopLevel(node) &&
    (isWritten(node) ||
      (ts.isVariableDeclaration(node.parent) &&
        node.parent.initializer === node &&
        ts.isIdentifier(node.parent.name) &&
        (ts.getCombinedNodeFlags(node.parent) & ts.NodeFlags.Const) !== 0 &&
        node.getStart() < write.getStart()));
  const isAdderUse = (node: ts.Node) =>
    ts.isPropertyAccessExpression(node.parent) &&
    node.parent.name.text === "prototype" &&
    ts.isPropertyAccessExpression(node.parent.parent) &&
    node.parent.parent.name.text === key &&
    isAdderKept(node.parent.parent);
  const isCollectionUse = (node: ts.Node) =>
    ts.isIdentifier(node) &&
    getBuiltIn(node, context) === collection &&
    !(ts.isNewExpression(node.parent) && node.parent.expression === node) &&
    !(
      ts.isBinaryExpression(node.parent) &&
      node.parent.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword &&
      node.parent.right === node
    ) &&
    !isAdderUse(node);
  // A read of a property that leads from a value to its prototype, other than a constructor that
  // only an equality compares, or of the adder, or of a key that may be the adder, from a
  // collection or a value of any type.
  const isAdderRead = (node: ts.Node) => {
    if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return false;
    const type = context.checker.getTypeAtLocation(node.expression);
    const name = ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isStringLiteralLike(node.argumentExpression) ||
          ts.isNumericLiteral(node.argumentExpression)
        ? node.argumentExpression.text
        : undefined;
    return (
      ["getPrototypeOf", "__proto__"].some((reach) => reach === name) ||
      (name === "constructor" &&
        !(
          ts.isBinaryExpression(node.parent) &&
          [
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ].includes(node.parent.operatorToken.kind)
        )) ||
      ((name === undefined || name === key) &&
        !isAdderKept(node) &&
        ((type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0 ||
          type.getSymbol()?.name === collection))
    );
  };
  const isRun = (node: ts.Node): boolean =>
    !ts.isTypeReferenceNode(node) &&
    !ts.isTypeQueryNode(node) &&
    (isCollectionUse(node) ||
      isAdderRead(node) ||
      (ts.isNewExpression(node) &&
        getBuiltIn(node.expression, context) === collection &&
        (node.arguments ?? []).length > 0 &&
        (!isTopLevel(node) || node.getStart() > write.getStart())) ||
      (ts.forEachChild(node, isRun) ?? false));
  return !isTopLevel(write) || isRun(write.getSourceFile());
};

const getHeapWrite = (node: ts.Expression, path: Path, context: Context): HeapWrite | undefined => {
  if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return undefined;
  if (ts.isPropertyAccessExpression(node) && ts.isPrivateIdentifier(node.name)) return undefined;
  const receiver = node.expression;
  // tla-ts translates a collection's methods itself, so it can't call the ones a script puts there.
  if (
    ts.isPropertyAccessExpression(receiver) &&
    receiver.name.text === "prototype" &&
    COLLECTIONS.some((collection) => collection === getBuiltIn(receiver.expression, context)) &&
    (!ts.isPropertyAccessExpression(node) || isCollectionMethodRun(node, context))
  ) {
    throw new TlaTypeScriptError("tla-ts can't replace a collection's methods", node);
  }
  const isBuiltIn = context.heap !== undefined && isBuiltInObject(receiver, context);
  // A value of type any or unknown writes as an object, and the write stops where it holds another
  // value.
  const isAny =
    context.heap !== undefined &&
    (context.checker.getTypeAtLocation(receiver).flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0;
  if (!isAny) rejectAnyReceiver(receiver, context);
  if (!isBuiltIn && !isAny && getKind(receiver, context) !== "object") return undefined;
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

// The error that a write to a name throws in strict mode: a ReferenceError where no binding has the
// name, and a TypeError where it names a global that can't change. Outside strict mode, the write
// makes a global or does nothing, which tla-ts doesn't follow.
const getNameError = (node: ts.Expression, context: Context) => {
  const name = skipCasts(node);
  if (!ts.isIdentifier(name)) return undefined;
  const symbol = getSymbol(name, context.checker);
  const error =
    symbol === undefined
      ? "ReferenceError"
      : ["NaN", "Infinity", "undefined"].includes(name.text) &&
          (symbol.declarations ?? []).every(
            (declaration) => declaration.getSourceFile().isDeclarationFile,
          )
        ? "TypeError"
        : undefined;
  if (error !== undefined && !isStrictCode(name)) {
    throw new TlaTypeScriptError("tla-ts can't write a global outside strict mode", name);
  }
  return error;
};

// How a binding that a write to a name can't change treats the write: a const's or a using
// declaration's binding throws a TypeError, and so does a function expression's own name in strict
// code, which outside it ignores the write.
const getImmutable = (name: ts.Identifier, context: Context) => {
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  if (declaration === undefined) return undefined;
  if (
    (ts.isVariableDeclaration(declaration) || ts.isBindingElement(declaration)) &&
    (ts.getCombinedNodeFlags(declaration) & (ts.NodeFlags.Const | ts.NodeFlags.Using)) !== 0
  ) {
    return "throws";
  }
  return ts.isFunctionExpression(declaration) && declaration.name !== undefined
    ? isStrictCode(name)
      ? "throws"
      : "ignores"
    : undefined;
};

// The current value of an assignment target, and how to replace it.
// A set's add or a map's set, which gives its receiver, so that a chain of them changes the first.
const isChainedChange = (node: ts.Expression, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  [
    ["add", "set"],
    ["set", "map"],
  ].some(
    (entry) =>
      node.expression.name.text === entry[0] &&
      getKind(node.expression.expression, context) === entry[1],
  );

const getTarget = (node: ts.Expression, path: Path, context: Context): Target => {
  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return getTarget(node.expression, path, context);
  }
  if (isChainedChange(node, context)) return getTarget(node.expression.expression, path, context);
  if (ts.isIdentifier(node)) {
    rejectBeforeDeclaration(node, path.scope, context);
    const mapped = getMappedTarget(node, path, context);
    if (mapped !== undefined) return mapped;
    const symbol = getSymbol(node, context.checker);
    const current = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
    const whole = ts.findAncestor(
      node,
      (ancestor) =>
        !ts.isParenthesizedExpression(ancestor.parent) &&
        !ts.isNonNullExpression(ancestor.parent) &&
        !ts.isAsExpression(ancestor.parent),
    );
    // A parameter's object may be the caller's too, which a change in place would miss, though a
    // rest parameter's array is the call's own.
    const isReceiver =
      whole !== undefined &&
      (ts.isPropertyAccessExpression(whole.parent) || ts.isElementAccessExpression(whole.parent)) &&
      whole.parent.expression === whole;
    if (!isReceiver && getImmutable(node, context) !== undefined) {
      throw new TlaTypeScriptError(`tla-ts can't follow this write to ${node.text}`, node);
    }
    const isChangedInPlace =
      symbol?.valueDeclaration !== undefined &&
      ts.isParameter(symbol.valueDeclaration) &&
      symbol.valueDeclaration.dotDotDotToken === undefined &&
      isReceiver;
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
    const read = isImplicitGlobal(node, context) ? readGlobal(node, current, context) : current;
    return { symbol, current: read, update: (getValue) => getValue(read) };
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
                context.hasSpecialNumbers
                  ? useJavaScript("IsIntegerWithin", [length, apply("Len", [sequence])], context)
                  : apply("\\in", [length, apply("..", [number(0), apply("Len", [sequence])])]),
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
    if (isAddedToBuiltIn(node, context)) {
      throw new TlaTypeScriptError("tla-ts can't write a key that a built-in object lacks", node);
    }
    return getPart(getTarget(node.expression, path, context), getPathStep(node.name.text));
  }
  if (ts.isElementAccessExpression(node)) {
    const target = getTarget(node.expression, path, context);
    const key = translateKey(node, path.scope, context);
    if (getKind(node.expression, context) !== "sequence") {
      if (isAddedToBuiltIn(node, context)) {
        throw new TlaTypeScriptError("tla-ts can't write a key that a built-in object lacks", node);
      }
      return getPart(target, { kind: "Index", args: [key] });
    }
    return {
      ...target,
      update: (getValue) =>
        target.update((value) =>
          share(value, "sequence", context, (sequence) =>
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

// What only statements can run as a pattern assigns: a default that assigns or yields, where the
// value that its target takes is undefined, and the TypeError of a pattern that destructures null,
// undefined, or a value that it can't iterate.
interface PatternStatements<Result> {
  runDefault: (
    assignment: ts.BinaryExpression | Increment | ts.YieldExpression,
    part: Expression,
    path: Path,
    continueWith: (path: Path, value: Expression) => Result,
  ) => Result;
  throwTypeErrorIf: (condition: Expression, path: Path, rest: () => Result) => Result;
  readRest: (
    site: ts.Node,
    keys: readonly string[],
    value: Expression,
    path: Path,
    continueWith: (path: Path, read: Expression) => Result,
  ) => Result;
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

// An array pattern that an assignment or a for-of writes, or one nested in it, whose elements
// the pattern writes rather than reads.
const isPatternTarget = (node: ts.Node): boolean =>
  ts.isArrayLiteralExpression(node) &&
  (getAssignedTarget(node.parent) === node ||
    (ts.isSpreadElement(node.parent)
      ? isPatternTarget(node.parent.parent)
      : isPatternTarget(node.parent)));

const assignPattern = <Result>(
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: Expression,
  path: Path,
  context: Context,
  assignTarget: TargetAssigner<Result>,
  continueWith: (path: Path) => Result,
  statements?: PatternStatements<Result>,
): Result => {
  // A part takes its default where it's undefined, which only a statement can run where it assigns.
  const assignDefaulted = (
    inner: ts.Expression,
    innerSource: ts.Expression | undefined,
    part: Expression,
    initializer: ts.Expression | undefined,
    current: Path,
    next: (path: Path) => Result,
  ) => {
    const assignment = initializer && skipCasts(initializer);
    const assignInner = (after: Path, innerValue: Expression) =>
      assignPattern(inner, innerSource, innerValue, after, context, assignTarget, next, statements);
    const assignWith = (after: Path, innerValue: Expression) =>
      statements !== undefined &&
      (ts.isArrayLiteralExpression(inner) || ts.isObjectLiteralExpression(inner))
        ? statements.throwTypeErrorIf(isNullish(innerValue, context), after, () =>
            assignInner(after, innerValue),
          )
        : assignInner(after, innerValue);
    return statements !== undefined &&
      assignment !== undefined &&
      (isAssignment(assignment) ||
        (ts.isYieldExpression(assignment) && assignment.asteriskToken === undefined)) &&
      !current.scope.results.has(assignment)
      ? statements.runDefault(assignment, part, current, assignWith)
      : assignWith(current, getDefaulted(part, initializer, current.scope, context));
  };
  if (ts.isArrayLiteralExpression(target)) {
    // A pattern destructures a list where it took values from an iterator, or where a rest element
    // made the array.
    const isList = ts.isSpreadElement(target.parent) || isTaken(value);
    if (!isList && (isIteratedPattern(target, context) || isSteppedPattern(target, context))) {
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
    // A list's pattern, as a spread's, has no type of its own.
    const type =
      heap === undefined || isList ? undefined : context.checker.getTypeOfAssignmentPattern(target);
    const iterated =
      heap === undefined
        ? isList || isHeapSource
          ? value
          : translateStringIteration(
              value,
              context.checker.getTypeOfAssignmentPattern(target),
              heapSymbol === undefined ? undefined : getHeap(path.scope, target, context),
              target,
              context,
            )
        : type === undefined
          ? translateArrayIteration(value, heap, target, context)
          : translatePatternIteration(value, heap, target, type, context);
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
          return assignPattern(
            restTarget,
            undefined,
            rest,
            current,
            context,
            assignTarget,
            next,
            statements,
          );
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
            return assignDefaulted(
              defaulted.target,
              undefined,
              isIndex ? getElement(rest, number(Number(key) + 1), context) : apply("Len", [rest]),
              defaulted.initializer,
              inner,
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
              ) &&
              !isPatternTarget(inner.parent),
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
      return assignDefaulted(
        defaulted.target,
        isFromSource ? sourceElement : undefined,
        isFromSource
          ? translateExpression(sourceElement, path.scope, context)
          : untilDone(getElement(values, number(position + 1), context), getUndefined(context)),
        defaulted.initializer,
        current,
        next,
      );
    };
    const start =
      heapSymbol === undefined || heap === undefined
        ? path
        : {
            ...path,
            scope: {
              ...path.scope,
              bindings: new Map([
                ...path.scope.bindings,
                [
                  heapSymbol,
                  type === undefined
                    ? translateArrayIteration(heap, heap, target, context)
                    : getPatternHeap(heap, iterated, target, type, context),
                ],
              ]),
            },
          };
    // GetIterator throws a TypeError before the pattern assigns anything, and the elements of a
    // pattern whose type isn't an array's stop at once where it takes an object.
    return statements !== undefined && !isList && !isHeapSource && !isTaken(value)
      ? statements.throwTypeErrorIf(
          isUniterable(
            value,
            heap ?? (heapSymbol === undefined ? undefined : getHeap(path.scope, target, context)),
            target,
            isMaybePrimitive(
              context.checker.getNonNullableType(
                source === undefined
                  ? (type ?? context.checker.getTypeOfAssignmentPattern(target))
                  : context.checker.getTypeAtLocation(source),
              ),
            ),
            context,
          ),
          path,
          () =>
            type !== undefined && !context.checker.isArrayLikeType(type)
              ? statements.throwTypeErrorIf(isNullish(iterated, context), path, () =>
                  assignFrom(0, start, boolean(false)),
                )
              : assignFrom(0, start, boolean(false)),
        )
      : assignFrom(0, start, boolean(false));
  }
  if (ts.isObjectLiteralExpression(target)) {
    // A pattern that spreads into a name of type any has type any, unlike the value it reads.
    const patternType = context.checker.getTypeAtLocation(target);
    const type = context.checker.getNonNullableType(
      (patternType.flags & ts.TypeFlags.Any) === 0
        ? patternType
        : context.checker.getTypeOfAssignmentPattern(target),
    );
    // A value of type any or unknown, whose properties the pattern reads as a member read does.
    const isAny =
      context.heap !== undefined &&
      (context.checker.getTypeOfAssignmentPattern(target).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
        0;
    const isHeapObject = isAny || isHeapPattern(type, target, context);
    // A rest alone of a primitive copies what the object that wraps it owns, and of null or
    // undefined, which leave no other type, throws the TypeError of its pattern first.
    const isPrimitiveRest =
      !isHeapObject &&
      target.properties.length === 1 &&
      (type.isUnion() ? type.types : [type]).every(
        (member) => (member.flags & (PRIMITIVE_TYPES | ts.TypeFlags.Never)) !== 0,
      );
    // A property's key: its name, or a computed key that reads only what the pattern doesn't
    // assign, so it gives the same key wherever the pattern evaluates it.
    const written = new Set(
      findNodes(
        target,
        (inner): inner is ts.Identifier =>
          ts.isIdentifier(inner) && ts.findAncestor(inner, ts.isComputedPropertyName) === undefined,
      ).flatMap((inner) => getSymbol(inner, context.checker) ?? []),
    );
    const getKey = (property: ts.ObjectLiteralElementLike) =>
      property.name === undefined ||
      ts.isPrivateIdentifier(property.name) ||
      (ts.isComputedPropertyName(property.name) &&
        !(
          isInertValue(property.name.expression) &&
          findNodes(property.name.expression, ts.isIdentifier).every((inner) => {
            const symbol = getSymbol(inner, context.checker);
            return symbol !== undefined && !written.has(symbol);
          })
        ))
        ? undefined
        : translateMemberKey(property.name, path.scope, context);
    // The heap after the pattern reads its properties, which the statement evaluates.
    const keys = target.properties.flatMap((property) => getKey(property) ?? []);
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
                      [
                        getHeap(current.scope, target, context),
                        value,
                        set(keys),
                        boolean(context.isEveryMapHeld),
                      ],
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
        const excluded = target.properties.flatMap((inner) =>
          inner === property ? [] : (getKey(inner) ?? []),
        );
        const copy = (after: Path, read: Expression) => {
          const heap = getHeap(after.scope, property, context);
          const allocated = useJavaScript(
            "Allocate",
            [
              heap,
              isHeapObject
                ? useJavaScript("RestObject", [heap, value, set(excluded), read], context)
                : useJavaScript("RestPrimitive", [value], context),
            ],
            context,
          );
          return assignTarget(
            property.expression,
            useJavaScript("Allocated", [allocated], context),
            {
              ...after,
              scope: {
                ...after.scope,
                bindings: new Map([...after.scope.bindings, [heapSymbol, allocated]]),
              },
            },
            next,
          );
        };
        const getterKeys = isHeapObject ? getRestGetterKeys(target) : [];
        return statements === undefined || getterKeys.length === 0
          ? copy(current, tuple([]))
          : statements.readRest(property, getterKeys, value, current, copy);
      }
      const key = getKey(property);
      if (
        !(ts.isShorthandPropertyAssignment(property) || ts.isPropertyAssignment(property)) ||
        key === undefined
      ) {
        throw new TlaTypeScriptError(`Can't assign to ${property.getText()}`, property);
      }
      const defaulted = ts.isShorthandPropertyAssignment(property)
        ? { target: property.name, initializer: property.objectAssignmentInitializer }
        : getDefaultedTarget(property.initializer);
      // A value that the heap doesn't hold is a record, whose fields only a name gives.
      const field =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : undefined;
      const part = isAny
        ? getAnyProperty(getHeap(current.scope, property, context), value, key, context)
        : isHeapObject
          ? useJavaScript("Get", [getHeap(current.scope, property, context), value, key], context)
          : field === undefined
            ? undefined
            : defaulted.initializer === undefined
              ? getField(value, field)
              : getOptionalField(value, field, context);
      if (part === undefined) {
        throw new TlaTypeScriptError(`Can't assign to ${property.getText()}`, property);
      }
      return assignDefaulted(
        defaulted.target,
        undefined,
        part,
        defaulted.initializer,
        current,
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
): Formula => {
  const taken =
    ts.isArrayLiteralExpression(target) &&
    takeFromIterator(target, value, path, context, frame, (after, values) =>
      assignPatternWith(site, target, source, values, after, context, frame, continueWith),
    );
  if (taken) return taken;
  const assigned = assignPattern(
    target,
    source,
    value,
    path,
    context,
    (inner, innerValue, current, next) => {
      const nameError = getNameError(inner, context);
      if (nameError !== undefined) return throwError(nameError, current, inner, context, frame);
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
    {
      // What follows translates once, for whether the default ran.
      runDefault: (assignment, part, current, assignWith) =>
        translateJoined(
          assignment,
          current,
          context,
          (after, value) => assignWith(after, value ?? part),
          (next) =>
            ifThenElse(
              apply("=", [part, getUndefined(context)]),
              ts.isYieldExpression(assignment)
                ? translateYield(assignment, current, context, frame, (after, sent) =>
                    next(after, sent ?? getUndefined(context)),
                  )
                : runAssignment(assignment, current, context, frame, next),
              next(current, part),
            ),
        ),
      throwTypeErrorIf: (condition, current, rest) => {
        context.prelude.add("Null");
        return ifThenElse(condition, throwTypeError(current, target, context, frame), rest());
      },
      readRest: (restSite, keys, innerValue, current, next) =>
        readRestGetters(restSite, keys, innerValue, current, context, frame, next),
    },
  );
  // An object pattern throws a TypeError where it destructures null or undefined.
  if (
    !ts.isObjectLiteralExpression(target) ||
    !isMaybeNullish(context.checker.getTypeOfAssignmentPattern(target))
  ) {
    return assigned;
  }
  context.prelude.add("Null");
  return ifThenElse(
    isNullish(value, context),
    throwTypeError(path, target, context, frame),
    assigned,
  );
};

// Reflect.set, which runs a setter that the script writes with the receiver as this, and gives
// true, or sets the key as OrdinarySet does and gives whether it did.
const translateReflectSet = (
  expression: MethodCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const [target, key, assigned, receiver] = expression.arguments;
  if (
    target === undefined ||
    key === undefined ||
    expression.arguments.length > 4 ||
    expression.arguments.some(ts.isSpreadElement) ||
    !(getKind(target, context) === "object" || isBuiltInObject(target, context))
  ) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  const object = translateObjectValue(target, path.scope, context);
  const property = translatePropertyKey(key, path.scope, context);
  const value =
    assigned === undefined
      ? getUndefined(context)
      : translateExpression(assigned, path.scope, context);
  const receiverValue =
    receiver === undefined
      ? object
      : getKind(receiver, context) === "object"
        ? translateObjectValue(receiver, path.scope, context)
        : translateExpression(receiver, path.scope, context);
  const set = (current: Path, next: (path: Path, value?: Expression) => Formula) => {
    const name = context.names.getFresh("change");
    const after = withHeap(current, field(identifier(name), "heap"), context);
    return bindOnce(
      current,
      name,
      useJavaScript(
        "ReflectSet",
        [getHeap(current.scope, expression, context), object, property, value, receiverValue],
        context,
      ),
      ifThenElse(
        field(identifier(name), "isDone"),
        next(after, field(identifier(name), "value")),
        ifThenElse(
          field(identifier(name), "isRangeError"),
          throwError("RangeError", after, expression, context, frame),
          throwTypeError(after, expression, context, frame),
        ),
      ),
    );
  };
  const setters = getSetters(expression, context).filter((setter) => !frame.inlining.has(setter));
  if (setters.length === 0) return set(path, continueWith);
  // A setter gives Reflect.set true whatever it returns.
  return bind(
    path,
    "setter",
    useJavaScript(
      "ReflectSetter",
      [getHeap(path.scope, expression, context), object, property],
      context,
    ),
    context,
    (bound, setter) =>
      ifThenElse(
        apply("=", [setter, getUndefined(context)]),
        set(bound, continueWith),
        callValue(
          expression,
          setters,
          setter,
          receiverValue,
          [value],
          bound,
          context,
          frame,
          (next) => set(bound, next),
          (after) => continueWith(after, boolean(true)),
        ),
      ),
  );
};

const REMOVING_METHODS = new Set(["push", "unshift", "splice", "shift", "pop"]);

// Whether a call changes an array, a set, or a map, and gives what it removed, how long the array
// became, or the collection.
const isRemoving = (node: ts.Expression, context: Context): boolean => {
  if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
    return isRemoving(node.expression, context);
  }
  if (!isMethodCall(node)) return false;
  const method = node.expression.name.text;
  const kind = getKind(node.expression.expression, context);
  const adder = kind === "set" ? "add" : "set";
  // A set or a map that the heap holds changes as a statement's call, as does a weak collection,
  // which checks the key that it takes.
  return (
    ((kind === "set" || kind === "map") &&
      !isHeapSetOrMap(node.expression.expression, context) &&
      ((method === "delete" && node.arguments.length === 1) ||
        (method === "clear" && node.arguments.length === 0) ||
        ((method === adder || (kind === "map" && method === "getOrInsert")) &&
          getCollection(node.expression.expression, context)?.startsWith("Weak") === false &&
          node.arguments.length === (kind === "set" ? 1 : 2)))) ||
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
  const removed = getRemoved(node, method, receiver, kind, path, context);
  // A receiver that may be undefined or null gives undefined to ?. and changes nothing. Without
  // ?., the caller throws a TypeError, and a chain that ?. cuts short earlier stops.
  const held = getCast(ts.isNonNullExpression(receiver) ? receiver.expression : receiver);
  const heldType = context.checker.getTypeAtLocation(held);
  if (context.checker.getNonNullableType(heldType) === heldType) return removed;
  context.prelude.add("Null");
  const isMissing = (value: Expression) =>
    apply("\\in", [value, set([getUndefined(context), identifier("Null")])]);
  const missing = isMissing(translateExpression(held, path.scope, context));
  const isOptional = node.expression.questionDotToken !== undefined;
  return {
    value: ifExpression(
      missing,
      isOptional
        ? getUndefined(context)
        : apply("Assert", [
            boolean(false),
            string("tla-ts can't call a method on undefined or null in this expression"),
          ]),
      removed.value,
    ),
    path: assign(receiver, path, context, (current) =>
      share(current, "current", context, (shared) =>
        ifExpression(
          isMissing(shared),
          shared,
          getUpdatedValue(shared, kind, node, path.scope, context) ?? shared,
        ),
      ),
    ),
    symbol: removed.symbol,
    missing: isOptional || ts.isOptionalChain(node) ? undefined : missing,
  };
};

// What a call like queue.shift() returns, and the path after it changes its receiver.
const getRemoved = (
  node: ts.CallExpression & { expression: ts.PropertyAccessExpression },
  method: string,
  receiver: ts.Expression,
  kind: ReturnType<typeof getKind>,
  path: Path,
  context: Context,
): Removed => {
  // A set's or a map's delete gives whether it held the key, clear gives undefined, add or set
  // gives the collection, and getOrInsert the value that the map holds at the key once it ran.
  if (kind === "set" || kind === "map") {
    const collection = translateExpression(receiver, path.scope, context);
    const value =
      method === "delete"
        ? apply("\\in", [
            translateSetKey(node.arguments[0], path.scope, context),
            kind === "map" ? apply("DOMAIN", [collection]) : collection,
          ])
        : method === "clear"
          ? getUndefined(context)
          : method === "getOrInsert"
            ? index(getUpdatedValue(collection, kind, node, path.scope, context) ?? collection, [
                translateSetKey(node.arguments[0], path.scope, context),
              ])
            : getUpdatedValue(collection, kind, node, path.scope, context);
    return {
      value: value ?? collection,
      path: assign(
        receiver,
        path,
        context,
        (current) => getUpdatedValue(current, kind, node, path.scope, context) ?? current,
      ),
      symbol: getTarget(receiver, path, context).symbol,
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
    symbol: getTarget(receiver, path, context).symbol,
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
          [current, translateBigInt(1n, context)],
          context,
        ),
      );
    }
    if (
      operator !== undefined &&
      !isNumberLike(skipCasts(expression.operand), context) &&
      !isConvertedOperand(expression.operand, context)
    ) {
      throw new TlaTypeScriptError(`${expression.getText()} needs a number`, expression);
    }
    return operator === undefined
      ? undefined
      : assign(expression.operand, path, context, (current) =>
          applyArithmetic(
            operator,
            [getIncremented(expression.operand, current, context), number(1)],
            context,
          ),
        );
  }
  if (!ts.isBinaryExpression(expression)) return undefined;
  const kind = expression.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    const assigned = isClosure(expression.right, context)
      ? undefined
      : getAnyFunction(expression.right);
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
  // A name that the statement read before a yield or an await in the value suspended it.
  const read = path.scope.results.get(expression.left);
  return update === undefined
    ? undefined
    : assign(expression.left, path, context, (current) => update(read ?? current));
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

// How a compound or logical assignment changes what its target holds. A logical assignment decides
// on what its target held before its value ran.
const getUpdate = (expression: ts.BinaryExpression, path: Path, context: Context) => {
  const kind = expression.operatorToken.kind;
  if (LOGICAL_OPERATORS.has(kind)) {
    const assigned = translateExpression(expression.right, path.scope, context);
    const read = path.scope.results.get(expression.left);
    return (current: Expression) =>
      ifExpression(isLogicallyWritten(expression, read ?? current, context), assigned, current);
  }
  const operatorKind = ARITHMETIC_ASSIGNMENTS.get(kind) ?? BITWISE_ASSIGNMENTS.get(kind);
  const bigIntOperator =
    operatorKind === undefined ? undefined : BIGINT_OPERATORS.get(operatorKind);
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

// The typed array constructors by their element types, through which a typed array's method makes a
// typed array.
const translateTypedConstructors = (site: ts.Node, context: Context) =>
  record(
    "Record",
    [...TYPED_ARRAYS.values()].map((type) => ({
      name: type,
      value: translateBuiltInValue(`${type}Array`, site, context),
    })),
  );

// The function that Array.of.call(F, ...items) constructs, where it reads neither this nor
// new.target, returns nothing, and the items convert nothing.
const getUnseenOfConstructor = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const constructed = node.arguments.at(0);
  const target =
    ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call" &&
    ts.isPropertyAccessExpression(callee.expression) &&
    callee.expression.name.text === "of" &&
    getBuiltIn(callee.expression.expression, context) === "Array" &&
    constructed !== undefined &&
    ts.isIdentifier(constructed) &&
    node.arguments.slice(1).every(isInertValue)
      ? getCallee(constructed, context)
      : undefined;
  return target !== undefined &&
    (ts.isFunctionDeclaration(target) || ts.isFunctionExpression(target)) &&
    target.asteriskToken === undefined &&
    (ts.getCombinedModifierFlags(target) & ts.ModifierFlags.Async) === 0 &&
    target.body !== undefined &&
    findNodes(
      target.body,
      (inner): inner is ts.Node =>
        inner.kind === ts.SyntaxKind.ThisKeyword ||
        ts.isMetaProperty(inner) ||
        (ts.isReturnStatement(inner) && inner.expression !== undefined) ||
        (ts.isFunctionLike(inner) && !ts.isArrowFunction(inner)),
    ).length === 0
    ? target
    : undefined;
};
// Whether Array.prototype.map.call on an object that isn't an array, with a callback, throws the
// RangeError of making an array of the object's length, from 2^32.
// Whether Array.prototype.map, toReversed, toSorted, or with, through call, throws the RangeError of
// making an array of an object's length, after map reads a callback and with an index, which
// convert nothing.
const getArrayCreateThrows = (expression: ts.Expression, path: Path, context: Context) => {
  if (!ts.isCallExpression(expression)) return undefined;
  const method = getArrayMethodCall(expression, context);
  const passed = expression.arguments.map(skipCasts);
  const object = passed.at(0);
  const rest = passed.slice(1);
  const isPassed =
    (method === "map" && rest.length === 1 && ts.isIdentifier(rest[0])) ||
    ((method === "toReversed" || method === "toSorted") && rest.length === 0) ||
    (method === "with" &&
      rest.length === 2 &&
      ts.isNumericLiteral(rest[0]) &&
      isLiteral(rest[1]) &&
      !ts.isRegularExpressionLiteral(rest[1]));
  if (context.heap === undefined || object === undefined || !ts.isIdentifier(object) || !isPassed) {
    return undefined;
  }
  const heap = getHeap(path.scope, expression, context);
  const isCreateThrowing = useJavaScript(
    "ArrayCreateThrows",
    [heap, translateExpression(object, path.scope, context)],
    context,
  );
  return method === "map"
    ? apply("/\\", [
        apply("=", [
          useJavaScript(
            "TypeOfIn",
            [heap, translateExpression(rest[0], path.scope, context)],
            context,
          ),
          string("function"),
        ]),
        isCreateThrowing,
      ])
    : isCreateThrowing;
};

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
  const withStop = getWithStop(expression, context);
  if (withStop !== undefined) return leaf(apply("Assert", [boolean(false), string(withStop)]));
  const formatCall = getFormatCall(expression, context);
  if (formatCall !== undefined) {
    return ifThenElse(
      useJavaScript(
        "NumberMethodThrows",
        [
          string(formatCall.method),
          translateExpression(formatCall.receiver, path.scope, context),
          formatCall.digits === undefined
            ? getUndefined(context)
            : translateExpression(formatCall.digits, path.scope, context),
        ],
        context,
      ),
      throwError("RangeError", path, expression, context, frame),
      continueWith(path, translateExpression(expression, path.scope, context)),
    );
  }
  // A built-in method that call runs reads a key of its receiver first, which a getter that only
  // throws throws from, where the method's owner still holds it.
  const firstRead = getFirstRead(expression, context);
  const readFrom = expression.arguments.at(0);
  if (
    firstRead !== undefined &&
    readFrom !== undefined &&
    ts.isIdentifier(readFrom) &&
    getKind(readFrom, context) === "object" &&
    getThrowingGetters(expression, context).length > 0
  ) {
    const heap = getHeap(path.scope, expression, context);
    const object = translateExpression(readFrom, path.scope, context);
    const code = useJavaScript("KeyGetter", [heap, object, firstRead.key], context);
    return throwFirstGetter(
      expression,
      apply("/\\", [
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue(firstRead.owner, expression, context),
            string(firstRead.method),
            string(`${firstRead.owner}.${firstRead.method}`),
          ],
          context,
        ),
        apply("#", [code, getUndefined(context)]),
      ]),
      code,
      object,
      path,
      context,
      frame,
      leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't run ${firstRead.owner}.${firstRead.method} as a statement`),
        ]),
      ),
    );
  }
  // Array.of through call constructs its receiver with how many items it takes, and then defines
  // them on what that gives, which a constructor that never reads its this nor returns an object
  // makes fresh, so that only the constructor's run is seen.
  const ofConstructor = getUnseenOfConstructor(expression, context);
  if (ofConstructor !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    return ifThenElse(
      apply("/\\", [
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue("Array", expression, context),
            string("of"),
            string("Array.of"),
          ],
          context,
        ),
        useJavaScript(
          "HoldsBuiltIn",
          [
            heap,
            translateBuiltInValue("Function.prototype", expression, context),
            string("call"),
            string("Function.prototype.call"),
          ],
          context,
        ),
      ]),
      inlineValues(
        ofConstructor,
        [number(expression.arguments.length - 1)],
        undefined,
        path,
        context,
        frame,
        (after) => continueWith(after),
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which function this call runs"),
        ]),
      ),
    );
  }

  const createThrows = getArrayCreateThrows(expression, path, context);
  if (createThrows !== undefined) {
    return ifThenElse(
      createThrows,
      throwError("RangeError", path, expression, context, frame),
      translateCallStatementBody(expression, path, context, frame, continueWith),
    );
  }
  return translateCallStatementBody(expression, path, context, frame, continueWith);
};

const translateCallStatementBody = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const loop = getLoopCall(expression, path, context);
  // A receiver or a later argument that only statements can run runs first, where what evaluates
  // before it doesn't read what it changes.
  const getLeading = () => getLeadingCall(expression, (call) => call !== expression, path, context);
  const runLeading = (leading: { call: ts.CallExpression; reads: readonly ts.Expression[] }) =>
    translateCallStatement(leading.call, path, context, frame, (after, value) =>
      translateCallStatement(
        expression,
        withLeadingResults(leading, path, after, value, context),
        context,
        frame,
        continueWith,
      ),
    );
  const leadingLoop = loop === undefined ? undefined : getLeading();
  if (leadingLoop !== undefined) return runLeading(leadingLoop);
  if (loop?.isInherited === true) {
    return ifThenElse(
      apply("=", [
        translateExpression(expression.expression, path.scope, context),
        translateBuiltInValue(`Array.prototype.${loop.method}`, expression, context),
      ]),
      translateLoopCall(expression, loop, path, context, frame, continueWith),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which function this call runs"),
        ]),
      ),
    );
  }
  if (loop !== undefined) {
    return translateLoopCall(expression, loop, path, context, frame, continueWith);
  }
  const missing = getMissingCall(expression, context);
  if (missing !== undefined) {
    const read = translateMissingMethod(
      missing.owner,
      missing.method.name.text,
      expression,
      path.scope,
      context,
    );
    return ifThenElse(
      useJavaScript("SameValue", [read, getUndefined(context)], context),
      throwTypeError(path, expression, context, frame),
      leaf(
        apply("Assert", [
          boolean(false),
          string(
            `tla-ts can't call ${missing.owner}.${missing.method.name.text} where a script defined it`,
          ),
        ]),
      ),
    );
  }
  // A ?. before the method that the call reads, as in frames.at(-1)?.heirs.push(node), ends the
  // whole call where its base is undefined or null, before any argument runs.
  const getLinks = (link: ts.Expression): ts.Expression[] =>
    ts.isOptionalChain(link) ? [link, ...getLinks(link.expression)] : [];
  const method = expression.expression;
  const optional = (
    ts.isPropertyAccessExpression(method) || ts.isElementAccessExpression(method)
      ? getLinks(method.expression)
      : []
  )
    .filter(
      (link): link is ts.PropertyAccessExpression | ts.ElementAccessExpression =>
        (ts.isPropertyAccessExpression(link) || ts.isElementAccessExpression(link)) &&
        link.questionDotToken !== undefined &&
        path.scope.checked?.has(link) !== true,
    )
    .at(-1);
  if (optional !== undefined) {
    const base = optional.expression;
    const name = context.names.getFresh("base");
    context.prelude.add("Null");
    return bindOnce(
      path,
      name,
      translateExpression(base, path.scope, context),
      translateJoined(expression, path, context, continueWith, (next) =>
        ifThenElse(
          apply("\\in", [identifier(name), set([getUndefined(context), identifier("Null")])]),
          next(path, getUndefined(context)),
          translateCallStatement(
            expression,
            {
              ...path,
              scope: {
                ...path.scope,
                results: new Map([...path.scope.results, [base, identifier(name)]]),
                checked: new Set([...(path.scope.checked ?? []), optional]),
              },
            },
            context,
            frame,
            next,
          ),
        ),
      ),
    );
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
  const leading = getLeading();
  if (leading !== undefined) return runLeading(leading);
  const builtIn = path.scope.heldCalls?.has(expression)
    ? undefined
    : translateHoldsCallee(expression, path.scope, context);
  if (builtIn !== undefined) {
    return ifThenElse(
      builtIn.holds,
      translateCallStatement(
        expression,
        {
          ...path,
          scope: {
            ...path.scope,
            heldCalls: new Set([...(path.scope.heldCalls ?? []), expression]),
          },
        },
        context,
        frame,
        continueWith,
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't call ${builtIn.path} where a script replaced it`),
        ]),
      ),
    );
  }
  if (
    isNullishArrayMethodCall(expression, context) ||
    isSizelessSetLikeCall(expression, context) ||
    isSymbolIndexCall(expression, context)
  ) {
    return throwTypeError(path, expression, context, frame);
  }
  if (isRawCall(expression, context)) {
    const heap = getHeap(path.scope, expression, context);
    const name = context.names.getFresh("raw");
    const raw = identifier(name);
    const translate = (argument: ts.Expression) =>
      translateExpression(argument, path.scope, context);
    const template = translate(expression.arguments[0]);
    const substitutions = tuple(expression.arguments.slice(1).map(translate));
    const run = bindOnce(
      path,
      name,
      useJavaScript("StringRaw", [heap, template, substitutions], context),
      ifThenElse(
        field(raw, "isThrown"),
        throwTypeError(path, expression, context, frame),
        continueWith(path, field(raw, "text")),
      ),
    );
    // String.raw reads its template's raw, raw's length, and then each segment in order, so the
    // first that a getter which only throws answers throws.
    const code = useJavaScript("StringRawFirstGetter", [heap, template, substitutions], context);
    return ifThenElse(
      useJavaScript(
        "HoldsBuiltIn",
        [
          heap,
          translateBuiltInValue("String", expression, context),
          string("raw"),
          string("String.raw"),
        ],
        context,
      ),
      getThrowingGetters(expression, context).length > 0
        ? throwFirstGetter(
            expression,
            apply("#", [code, getUndefined(context)]),
            code,
            useJavaScript("StringRawFirstReceiver", [heap, template], context),
            path,
            context,
            frame,
            run,
          )
        : run,
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call String.raw where a script replaced it"),
        ]),
      ),
    );
  }
  if (isUnseededReduce(expression, context)) {
    const name = context.names.getFresh("reduced");
    const reduced = identifier(name);
    return bindOnce(
      path,
      name,
      translateExpression(
        expression,
        {
          ...path.scope,
          checkedReductions: new Set([...(path.scope.checkedReductions ?? []), expression]),
        },
        context,
      ),
      ifThenElse(
        index(reduced, [number(1)]),
        throwTypeError(path, expression, context, frame),
        continueWith(path, index(reduced, [number(2)])),
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
      bindOnce(
        removed.path,
        name,
        removed.value,
        shareBinding(removed.path, removed.symbol, "changed", context, (shared) =>
          continueWith(shared, identifier(name)),
        ),
      ),
    );
  }
  if (isPromiseCall(expression, context)) {
    return translatePromiseCall(expression, path, context, frame, continueWith);
  }
  const from = getIteratorFrom(expression, context);
  if (from !== undefined) {
    const value = getCast(from);
    const give = (current: Path, generator: Expression) =>
      translateHoldsIteratorFrom(expression, current, context, continueWith(current, generator));
    return ts.isCallExpression(value) &&
      !path.scope.results.has(value) &&
      isStatementCall(value, path, context)
      ? translateCallStatement(value, path, context, frame, (after, generator) =>
          give(after, generator ?? getUndefined(context)),
        )
      : give(path, translateExpression(value, path.scope, context));
  }
  const iterable = getIterableFrom(expression, context);
  if (iterable !== undefined) {
    return translateHoldsArrayFrom(
      true,
      expression,
      path,
      context,
      takeEvery(
        expression,
        translateExpression(iterable, path.scope, context),
        path,
        context,
        frame,
        continueWith,
        openFromIterator,
      ),
    );
  }
  const entries = getIterableFrom(expression, context, "fromEntries");
  if (entries !== undefined) {
    return takeEntries(
      expression,
      translateExpression(entries, path.scope, context),
      path,
      context,
      frame,
      continueWith,
    );
  }
  const consumer = getGeneratorMethod(expression, context);
  const stepped = getGeneratorStep(expression, context);
  const consume =
    consumer &&
    ((current: Path) =>
      translateHoldsArrayFrom(
        consumer.method === "from",
        expression,
        current,
        context,
        (ITERATOR_HELPERS.has(consumer.method)
          ? translateIteratorHelper
          : translateGeneratorConsumer)(
          expression,
          consumer,
          consumer.receiver !== undefined && isBuiltInIteratorType(consumer.receiver, context)
            ? withBuiltInIterator(
                expression,
                current,
                translateExpression(consumer.receiver, current.scope, context),
                context,
              )
            : current,
          context,
          frame,
          continueWith,
        ),
      ));
  const translateStep =
    consume !== undefined
      ? (current: Path) =>
          consumer?.receiver !== undefined &&
          consumer.invalid === undefined &&
          isScriptIteratorType(consumer.receiver, context)
            ? withScriptIterator(
                expression,
                current,
                translateExpression(consumer.receiver, current.scope, context),
                context,
                frame,
                consume,
              )
            : consume(current)
      : stepped &&
        ((current: Path) =>
          translateGeneratorStep(expression, stepped, current, context, frame, continueWith));
  const generator = consumer?.receiver ?? stepped?.expression;
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
  // A bound async method runs with the receiver that bind gave it.
  const boundAsync = getBound(expression.expression, context);
  if (
    boundAsync !== undefined &&
    ts.isMethodDeclaration(boundAsync.target) &&
    isAsyncFunction(boundAsync.target)
  ) {
    if (!boundAsync.isSteady || boundAsync.arguments.length > 0) {
      throw new TlaTypeScriptError(
        `Unsupported call: ${expression.expression.getText()}`,
        expression,
      );
    }
    return translateAsyncCall(
      expression,
      boundAsync.target,
      {
        value:
          boundAsync.receiver === undefined
            ? getUndefined(context)
            : translateExpression(boundAsync.receiver, path.scope, context),
        method: boundAsync.target,
      },
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
  const withHeap = (heap: Expression, base = path) =>
    heapSymbol === undefined
      ? base
      : {
          ...base,
          scope: {
            ...base.scope,
            bindings: new Map([...base.scope.bindings, [heapSymbol, heap]]),
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
    const convertedTimeName = context.names.getFresh("time");
    const toNumber = (primitive: Expression) => {
      const converted = useJavaScript("ToNumber", [primitive], context);
      return context.hasSpecialNumbers
        ? converted
        : useJavaScript("PlainNumber", [converted], context);
    };
    const changeDate = (
      current: Path,
      read: Expression,
      position: number,
      numbers: readonly Expression[],
    ) =>
      bindOnce(
        current,
        changeName,
        useJavaScript(
          "DateChange",
          [
            getHeap(current.scope, expression, context),
            identifier(receiver),
            read,
            string(dateCall.method),
            number(position),
            tuple([...numbers]),
          ],
          context,
        ),
        // A time value too far from 1970 for TLC's integers is only a number where something
        // reads it.
        continueWith(
          withHeap(field(change, "heap"), current),
          isStatement ? undefined : useJavaScript("TimeNumber", [field(change, "time")], context),
        ),
      );
    const run = dateCall.isSetter
      ? setter === undefined
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't convert the arguments of this Date setter"),
            ]),
          )
        : dateCall.values.some((argument) => isObjectOperand(argument, context))
          ? // The setter converts its arguments in turn, which runs their valueOf and toString,
            // and changes the heap that they leave. It reads the time value before them, as the
            // spec does, but Node reads setFullYear's and setYear's once the first converts.
            runConversion(
              expression,
              {
                operands: dateCall.values,
                hints: dateCall.values.map(() => "number" as const),
                combine: (primitives) => tuple(primitives.map(toNumber)),
                afterFirst:
                  setter.position > 1
                    ? undefined
                    : (after, _, next) =>
                        bindOnce(
                          after,
                          convertedTimeName,
                          useJavaScript(
                            "TimeOfDate",
                            [getHeap(after.scope, expression, context), identifier(receiver)],
                            context,
                          ),
                          next(after),
                        ),
              },
              path,
              context,
              frame,
              (after, numbers) =>
                changeDate(
                  after,
                  setter.position > 1 ? time : identifier(convertedTimeName),
                  setter.position,
                  dateCall.values.map((_, position) => index(numbers, [number(position + 1)])),
                ),
            )
          : changeDate(
              path,
              time,
              setter.position,
              // A call without arguments converts undefined.
              dateCall.values.length === 0
                ? [toNumber(getUndefined(context))]
                : dateCall.values.map((argument) =>
                    translateToNumber(argument, expression, path.scope, context),
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
  const protocolCall = getRegExpProtocolCall(expression, context);
  if (protocolCall !== undefined) {
    return runRegExpProtocolCall(expression, protocolCall, path, context, frame, continueWith);
  }
  const regExpCall = getHeapRegExpCall(expression, context);
  if (regExpCall !== undefined) {
    // The paths where the regexp's string replaces as text, and where the regexp runs, join
    // before what follows, which translates once.
    return translateJoined(expression, path, context, continueWith, (next) => {
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
      // A Set of a lastIndex that isn't writable throws a TypeError.
      const continueUnlessThrown = (next: Formula) =>
        ifThenElse(
          field(change, "isThrown"),
          throwTypeError(changed, expression, context, frame),
          next,
        );
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
              continueUnlessThrown(next(changed, field(change, "value"))),
            )
          : bindOnce(
              path,
              changeName,
              useJavaScript("RegExpMatchesIn", [heap, identifier(regexp), text], context),
              continueUnlessThrown(
                next(
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
              ),
            );
      // replaceAll throws a TypeError where the regexp isn't global, as its flags tell, and exec
      // where the receiver is RegExp.prototype, which has no pattern.
      const checked =
        method === "replaceAll"
          ? ifThenElse(
              field(
                useJavaScript("RegExpOf", [heap, identifier(regexp), changeable], context),
                "global",
              ),
              run,
              throwTypeError(path, expression, context, frame),
            )
          : method === "exec" || method === "test"
            ? ifThenElse(
                useJavaScript("IsRegExpPrototypeExec", [heap, identifier(regexp)], context),
                throwTypeError(path, expression, context, frame),
                run,
              )
            : run;
      const replacedName = context.names.getFresh("replaced");
      const replaced = identifier(replacedName);
      // A string's replace or replaceAll replaces the regexp's string as text where the regexp's own
      // @@replace is undefined.
      const body =
        (method === "replace" || method === "replaceAll") &&
        regExpCall.isStringMethod &&
        replacer === undefined
          ? ifThenElse(
              useJavaScript("IsUnreplacing", [heap, identifier(regexp)], context),
              bindOnce(
                path,
                replacedName,
                useJavaScript(
                  "RegExpUnreplaced",
                  [
                    heap,
                    identifier(regexp),
                    text,
                    translateExpression(regExpCall.values[0], path.scope, context),
                    boolean(method === "replaceAll"),
                  ],
                  context,
                ),
                ifThenElse(
                  apply("=", [field(replaced, "error"), string("")]),
                  next(path, field(replaced, "value")),
                  throwTypeError(path, expression, context, frame),
                ),
              ),
              checked,
            )
          : checked;
      return bindOnce(
        path,
        regexp,
        translateExpression(regExpCall.regexp, path.scope, context),
        bindOnce(
          path,
          textName,
          translateRegExpText(regExpCall, expression, path.scope, context),
          body,
        ),
      );
    });
  }
  const arrayLikeChange = getArrayLikeChange(expression, context);
  if (arrayLikeChange !== undefined) {
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const heap = getHeap(path.scope, expression, context);
    const ref = translateExpression(arrayLikeChange.object, path.scope, context);
    const length = useJavaScript("Get", [heap, ref, string("length")], context);
    // copyWithin throws from a getter at the index it reads first, before it writes.
    const firstGetter =
      arrayLikeChange.method === "copyWithin"
        ? useJavaScript(
            "CopyWithinFirstGetter",
            [
              heap,
              ref,
              ...translateCopyWithinArguments(arrayLikeChange.items, path.scope, context),
            ],
            context,
          )
        : undefined;
    const run = bindOnce(
      path,
      changeName,
      arrayLikeChange.method === "reverse"
        ? useJavaScript("ArrayLikeReverse", [heap, ref], context)
        : arrayLikeChange.method === "copyWithin"
          ? useJavaScript(
              "ArrayLikeCopyWithin",
              [
                heap,
                ref,
                ...translateCopyWithinArguments(arrayLikeChange.items, path.scope, context),
              ],
              context,
            )
          : arrayLikeChange.method === "fill"
            ? useJavaScript(
                "ArrayLikeFill",
                [
                  heap,
                  ref,
                  ...[0, 1, 2].map((position) => {
                    const item = arrayLikeChange.items.at(position);
                    return item === undefined
                      ? getUndefined(context)
                      : translateExpression(item, path.scope, context);
                  }),
                ],
                context,
              )
            : useJavaScript(
                "ArrayChange",
                [
                  heap,
                  ref,
                  string(arrayLikeChange.method),
                  tuple(
                    arrayLikeChange.items.map((item) =>
                      translateExpression(item, path.scope, context),
                    ),
                  ),
                ],
                context,
              ),
      ifThenElse(
        field(change, "isThrown"),
        throwTypeError(withHeap(field(change, "heap")), expression, context, frame),
        continueWith(withHeap(field(change, "heap")), field(change, "value")),
      ),
    );
    // ToLength throws a TypeError where the length is a symbol or a BigInt, before copyWithin reads
    // an element.
    return ifThenElse(
      apply("\\/", [
        useJavaScript("IsSymbol", [length], context),
        useJavaScript("IsBigInt", [length], context),
      ]),
      throwTypeError(path, expression, context, frame),
      firstGetter === undefined
        ? run
        : throwFirstGetter(
            expression,
            apply("#", [firstGetter, getUndefined(context)]),
            firstGetter,
            ref,
            path,
            context,
            frame,
            run,
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
    const object = identifier(objectName);
    const calleeName = context.names.getFresh("callee");
    const callee = identifier(calleeName);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const changeWith = (
      current: Path,
      next: (path: Path, value: Expression) => Formula,
      length?: Expression,
    ) => {
      const after = (heap: Expression): Path =>
        heapSymbol === undefined
          ? current
          : {
              ...current,
              scope: {
                ...current.scope,
                bindings: new Map([...current.scope.bindings, [heapSymbol, heap]]),
              },
            };
      return bindOnce(
        current,
        changeName,
        translateStoredCall(storedCall, callee, object, true, current.scope, context, length),
        ifThenElse(
          field(change, "isThrown"),
          throwTypeError(after(field(change, "heap")), expression, context, frame),
          next(after(field(change, "heap")), field(change, "value")),
        ),
      );
    };
    // push, pop, shift, and unshift convert a length that's an object to a primitive, running its
    // valueOf and toString methods, before they read the elements.
    const converting = isObjectLength(storedCall.receiver, context)
      ? storedCall.builtIns.filter((builtIn) =>
          ["push", "pop", "shift", "unshift"].some(
            (method) => builtIn === `Array.prototype.${method}`,
          ),
        )
      : [];
    if (converting.length > 0) context.builtIns.add("Array.prototype");
    return bindOnce(
      path,
      objectName,
      translateExpression(storedCall.receiver, path.scope, context),
      ifThenElse(
        apply("\\in", [object, set([getUndefined(context), identifier("Null")])]),
        throwTypeError(path, expression, context, frame),
        bindOnce(
          path,
          calleeName,
          translateExpression(expression.expression, path.scope, context),
          converting.length === 0
            ? changeWith(path, continueWith)
            : translateJoined(
                expression,
                path,
                context,
                (joined, value) => continueWith(joined, value ?? getUndefined(context)),
                (next) =>
                  ifThenElse(
                    apply("\\in", [
                      callee,
                      set(
                        converting.map((builtIn) =>
                          translateBuiltInValue(builtIn, expression, context),
                        ),
                      ),
                    ]),
                    runToPrimitive(
                      expression,
                      useJavaScript(
                        "Get",
                        [getHeap(path.scope, expression, context), object, string("length")],
                        context,
                      ),
                      "number",
                      path,
                      context,
                      frame,
                      (converted, primitive) => changeWith(converted, next, primitive),
                    ),
                    changeWith(path, next),
                  ),
              ),
        ),
      ),
    );
  }
  // A chain of adds or sets runs the first before the next, which changes what the first gives.
  const chained = isMethodCall(expression) ? getCast(expression.expression.expression) : undefined;
  if (
    chained !== undefined &&
    isChainedChange(chained, context) &&
    !path.scope.results.has(chained)
  ) {
    return translateCallStatement(chained, path, context, frame, (after, value) =>
      translateCallStatement(
        expression,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [chained, value ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
        continueWith,
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
    const collection = getCollection(collectionChange.receiver, context);
    const builtIn = `${collection}.prototype.${method}`;
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
    const changed = continueWith(
      withHeap(
        isOrderedCollection(collectionChange.receiver, context)
          ? useJavaScript(
              "WithOrderedCollectionData",
              [heap, ref, updated, boolean(collection === "Map")],
              context,
            )
          : useJavaScript("WithCollectionData", [heap, ref, updated], context),
      ),
      value,
    );
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
          // A weak collection throws a TypeError on a symbol that Symbol.for registered.
          collection?.startsWith("Weak") === true &&
            (method === "add" || method === "set") &&
            key !== undefined
            ? ifThenElse(
                useJavaScript(
                  "IsRegisteredSymbol",
                  [heap, translateExpression(key, path.scope, context)],
                  context,
                ),
                throwTypeError(path, expression, context, frame),
                changed,
              )
            : changed,
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
    // pop and shift read the length and then the element that they remove, which a getter may
    // answer, before they change the array.
    const removedGetters = getRemovedGetters(expression, context);
    const lengthName = context.names.getFresh("length");
    const length = identifier(lengthName);
    const removeFrom = (current: Path, first: Expression) => {
      const after: Path =
        heapSymbol === undefined
          ? current
          : {
              ...current,
              scope: {
                ...current.scope,
                bindings: new Map([...current.scope.bindings, [heapSymbol, field(change, "heap")]]),
              },
            };
      return bindOnce(
        current,
        changeName,
        useJavaScript(
          "ArrayChangeFrom",
          [
            getHeap(current.scope, expression, context),
            ref,
            string(method),
            tuple([]),
            length,
            first,
          ],
          context,
        ),
        ifThenElse(
          field(change, "isThrown"),
          throwTypeError(after, expression, context, frame),
          continueWith(after, field(change, "value")),
        ),
      );
    };
    const changeArray = ifThenElse(
      useJavaScript(
        "HoldsBuiltIn",
        [heap, ref, string(method), string(`Array.prototype.${method}`)],
        context,
      ),
      removedGetters.length > 0
        ? bindOnce(
            path,
            lengthName,
            useJavaScript("LengthOf", [heap, ref], context),
            ifThenElse(
              apply("=", [length, number(0)]),
              removeFrom(path, getUndefined(context)),
              readWith(
                expression,
                ref,
                useJavaScript(
                  "ToString",
                  [method === "pop" ? apply("-", [length, number(1)]) : number(0)],
                  context,
                ),
                removedGetters,
                path,
                context,
                frame,
                removeFrom,
              ),
            ),
          )
        : sortsInPlace(
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
  // The objects that the receiver makes, such as new String(), come first.
  const receiverObjects =
    iteratorCall === undefined
      ? []
      : getAllocated(iteratorCall.receiver, context).filter(
          (inner) => !path.scope.allocated.has(inner),
        );
  if (receiverObjects.length > 0) {
    return allocateAll(receiverObjects, path, context, (allocated) =>
      translateCallStatement(expression, allocated, context, frame, continueWith),
    );
  }
  if (iteratorCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const receiverName = context.names.getFresh("receiver");
    const receiver = identifier(receiverName);
    const changeName = context.names.getFresh("change");
    const change = identifier(changeName);
    const operation =
      iteratorCall.kind === undefined
        ? useJavaScript(
            "BuiltInIteratorNext",
            [heap, receiver, boolean(iteratorCall.path.startsWith("%StringIterator"))],
            context,
          )
        : iteratorCall.kind === "string"
          ? useJavaScript(
              "StringIterator",
              [
                heap,
                useJavaScript("IteratedString", [heap, receiver], context),
                translateStringIteratorPrototype(expression, context),
              ],
              context,
            )
          : useJavaScript(
              iteratorCall.path.startsWith("%Int8Array") ? "TypedArrayIterator" : "ArrayIterator",
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
          iteratorCall.isFrom === true
            ? translateHoldsIteratorFrom(
                expression,
                path,
                context,
                // Iterator.from wraps an iterator that doesn't inherit from Iterator.prototype.
                ifThenElse(
                  useJavaScript(
                    "InheritsFrom",
                    [
                      field(change, "heap"),
                      translateBuiltInValue("Iterator.prototype", expression, context),
                      field(change, "value"),
                    ],
                    context,
                  ),
                  continueWith(
                    withBuiltInIterator(
                      expression,
                      withHeap(field(change, "heap")),
                      field(change, "value"),
                      context,
                    ),
                    field(change, "value"),
                  ),
                  leaf(
                    apply("Assert", [
                      boolean(false),
                      string(
                        "tla-ts can't wrap an iterator that doesn't inherit from Iterator.prototype",
                      ),
                    ]),
                  ),
                ),
              )
            : ifThenElse(
                field(change, "isThrown"),
                throwTypeError(path, expression, context, frame),
                continueWith(withHeap(field(change, "heap")), field(change, "value")),
              ),
        ),
        leaf(
          apply("Assert", [
            boolean(false),
            string(
              iteratorCall.kind === "string"
                ? "tla-ts can't make an iterator where a script replaced String.prototype's method"
                : `tla-ts can't call ${iteratorCall.path} where a script replaced it`,
            ),
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
        : viewCall.owner === "Atomics"
          ? "Atomics"
          : `${viewCall.owner}.prototype`;
    const typedValues = viewCall.values.map((value) =>
      translateExpression(value, path.scope, context),
    );
    const typedArguments = tuple(typedValues);
    const getOperation = (heap: Expression) =>
      viewCall.owner === "TypedArray"
        ? useJavaScript(
            "TypedArrayMethod",
            [
              heap,
              ref,
              string(method),
              typedArguments,
              translateBuiltInValue("ArrayBuffer.prototype", expression, context),
              translateTypedConstructors(expression, context),
            ],
            context,
          )
        : viewCall.owner === "WeakRef"
          ? useJavaScript("WeakRefDeref", [heap, ref], context)
          : viewCall.owner === "FinalizationRegistry"
            ? method === "register"
              ? useJavaScript("FinalizationRegistryRegister", [heap, ref, ...values], context)
              : useJavaScript("FinalizationRegistryUnregister", [heap, ref, values[0]], context)
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
                        viewCall.owner === "SharedArrayBuffer"
                          ? "SharedArrayBuffer"
                          : "ArrayBuffer",
                        expression,
                        context,
                      ),
                    ],
                    context,
                  )
                : method === "resize" || method === "grow"
                  ? useJavaScript("Resize", [heap, ref, values[0], isShared], context)
                  : viewCall.owner === "Atomics"
                    ? useJavaScript(
                        "AtomicsCall",
                        [
                          heap,
                          string(method),
                          tuple(
                            viewCall.values.map((value) =>
                              translateExpression(value, path.scope, context),
                            ),
                          ),
                          translateBuiltInValue("Object.prototype", expression, context),
                        ],
                        context,
                      )
                    : useJavaScript(
                        "Transfer",
                        [
                          heap,
                          ref,
                          values[0],
                          boolean(method === "transfer"),
                          translateBuiltInValue("ArrayBuffer.prototype", expression, context),
                        ],
                        context,
                      );
    const runChange = (
      current: Path,
      changed: Expression,
      finish: (path: Path, value: Expression) => Formula = continueWith,
    ) =>
      bindOnce(
        current,
        changeName,
        changed,
        ifThenElse(
          apply("=", [field(change, "error"), string("")]),
          finish(withHeap(field(change, "heap"), current), field(change, "value")),
          ifThenElse(
            apply("=", [field(change, "error"), string("RangeError")]),
            throwError("RangeError", current, expression, context, frame),
            throwTypeError(current, expression, context, frame),
          ),
        ),
      );
    const runOperationFrom = (current: Path, finish: (path: Path, value: Expression) => Formula) =>
      runChange(current, getOperation(getHeap(current.scope, expression, context)), finish);
    const speciesGetters = getViewSpeciesGetters(expression, context);
    const runOperation = () =>
      speciesGetters.length === 0
        ? runOperationFrom(path, continueWith)
        : translateJoined(
            expression,
            path,
            context,
            (after, value) => continueWith(after, value ?? getUndefined(context)),
            (next) =>
              ifThenElse(
                useJavaScript(
                  "ReadsTypedArraySpecies",
                  [heap, ref, string(method), typedArguments],
                  context,
                ),
                readWith(
                  expression,
                  ref,
                  string("constructor"),
                  speciesGetters,
                  path,
                  context,
                  frame,
                  (read) => runOperationFrom(read, next),
                ),
                runOperationFrom(path, next),
              ),
          );
    // ToIndex throws its RangeError before a setter converts its value.
    const convertedViewValues = getConvertedViewValues(expression, context);
    const runConvertedView = (converted: readonly ts.Expression[]) =>
      runConversion(
        expression,
        {
          operands: converted,
          hints: converted.map(() => "number" as const),
          combine: (primitives) => tuple([...primitives]),
          afterFirst: (after, primitive, next) =>
            ifThenElse(
              useJavaScript("IsBigInt", [primitive], context),
              throwTypeError(after, expression, context, frame),
              ifThenElse(
                apply("=", [useJavaScript("IndexOfArgument", [primitive], context), number(-1)]),
                throwError("RangeError", after, expression, context, frame),
                next(after),
              ),
            ),
        },
        path,
        context,
        frame,
        (after, primitives) => {
          const [request, value] = [1, 2].map((position) =>
            position <= converted.length
              ? index(primitives, [number(position)])
              : getUndefined(context),
          );
          const afterHeap = getHeap(after.scope, expression, context);
          const littleEndian = values[converted.length];
          return runChange(
            after,
            method.startsWith("get")
              ? useJavaScript("DataViewGet", [afterHeap, ref, type, request, littleEndian], context)
              : useJavaScript(
                  "DataViewSet",
                  [afterHeap, ref, type, request, value, littleEndian],
                  context,
                ),
          );
        },
      );
    // An Atomics function checks its typed array, converts its index, and checks the index against
    // the length from before, then converts its values, and checks both again, except notify.
    const convertedAtomicsValues = getConvertedAtomicsValues(expression, context);
    const runConvertedAtomics = (converted: readonly ts.Expression[]) => {
      const typedArrayName = context.names.getFresh("typedArray");
      const typedArray = identifier(typedArrayName);
      const lengthName = context.names.getFresh("length");
      const accessName = context.names.getFresh("accessIndex");
      return bindOnce(
        path,
        typedArrayName,
        values[0],
        ifThenElse(
          useJavaScript("AtomicsRejects", [heap, string(method), typedArray], context),
          throwTypeError(path, expression, context, frame),
          bindOnce(
            path,
            lengthName,
            useJavaScript("TypedArrayLength", [heap, typedArray], context),
            runConversion(
              expression,
              {
                operands: converted,
                hints: converted.map(() => "number" as const),
                combine: (primitives) => tuple([...primitives]),
                afterFirst: (after, primitive, next) =>
                  ifThenElse(
                    useJavaScript("IsBigInt", [primitive], context),
                    throwTypeError(after, expression, context, frame),
                    bindOnce(
                      after,
                      accessName,
                      useJavaScript("IndexOfArgument", [primitive], context),
                      ifThenElse(
                        junction("Or", [
                          apply("=", [identifier(accessName), number(-1)]),
                          apply(">=", [identifier(accessName), identifier(lengthName)]),
                        ]),
                        throwError("RangeError", after, expression, context, frame),
                        next(after),
                      ),
                    ),
                  ),
              },
              path,
              context,
              frame,
              (after, primitives) => {
                const afterHeap = getHeap(after.scope, expression, context);
                return runChange(
                  after,
                  method === "notify"
                    ? useJavaScript(
                        "AtomicsNotified",
                        [
                          afterHeap,
                          converted.length > 1
                            ? index(primitives, [number(2)])
                            : getUndefined(context),
                        ],
                        context,
                      )
                    : useJavaScript(
                        "AtomicsCall",
                        [
                          afterHeap,
                          string(method),
                          apply("\\o", [tuple([typedArray]), primitives]),
                          translateBuiltInValue("Object.prototype", expression, context),
                        ],
                        context,
                      ),
                );
              },
            ),
          ),
        ),
      );
    };
    // subarray reads the typed array's length before it converts its begin and end, and makes its
    // typed array after them, where a detached buffer throws its TypeError.
    const convertedSubarrayValues = getConvertedSubarrayValues(expression, context);
    const runConvertedSubarray = (converted: readonly ts.Expression[]) => {
      const lengthName = context.names.getFresh("length");
      return ifThenElse(
        useJavaScript("IsTypedArray", [heap, ref], context),
        bindOnce(
          path,
          lengthName,
          useJavaScript(
            "ViewLength",
            [heap, index(field(heap, "objects"), [index(ref, [identifier("Ref")])])],
            context,
          ),
          runConversion(
            expression,
            {
              operands: converted,
              hints: converted.map(() => "number" as const),
              combine: (primitives) => tuple([...primitives]),
            },
            path,
            context,
            frame,
            (after, primitives) => {
              const subarray = (current: Path) =>
                runChange(
                  current,
                  useJavaScript(
                    "TypedArraySubarray",
                    [
                      getHeap(current.scope, expression, context),
                      ref,
                      primitives,
                      identifier(lengthName),
                      translateBuiltInValue("ArrayBuffer.prototype", expression, context),
                      translateTypedConstructors(expression, context),
                    ],
                    context,
                  ),
                );
              // TypedArraySpeciesCreate reads the constructor once begin and end converted.
              return speciesGetters.length === 0
                ? subarray(after)
                : readWith(
                    expression,
                    ref,
                    string("constructor"),
                    speciesGetters,
                    after,
                    context,
                    frame,
                    subarray,
                  );
            },
          ),
        ),
        throwTypeError(path, expression, context, frame),
      );
    };
    // set of an array-like source writes each element in order, so the first that a getter which
    // only throws answers throws once set wrote those before it, where nothing before runs code.
    const setGetter = useJavaScript(
      "TypedArraySetFirstGetter",
      [heap, ref, typedArguments],
      context,
    );
    const run =
      convertedViewValues !== undefined
        ? runConvertedView(convertedViewValues)
        : convertedAtomicsValues !== undefined
          ? runConvertedAtomics(convertedAtomicsValues)
          : convertedSubarrayValues !== undefined
            ? runConvertedSubarray(convertedSubarrayValues)
            : viewCall.owner === "TypedArray" &&
                method === "set" &&
                getThrowingGetters(expression, context).length > 0
              ? throwFirstGetter(
                  expression,
                  apply("#", [setGetter, getUndefined(context)]),
                  setGetter,
                  typedValues[0] ?? getUndefined(context),
                  withHeap(
                    useJavaScript("TypedArraySetBefore", [heap, ref, typedArguments], context),
                  ),
                  context,
                  frame,
                  runOperation(),
                )
              : runOperation();
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
  if (getIteratorDisposeCall(expression, context) !== undefined) {
    return translateIteratorDisposeCall(expression, path, context, frame, continueWith);
  }
  const thisSymbol = getThisSymbolCall(expression, context);
  if (thisSymbol !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const value = translateExpression(thisSymbol, path.scope, context);
    return ifThenElse(
      useJavaScript("ThisSymbolThrows", [heap, value], context),
      throwTypeError(path, expression, context, frame),
      continueWith(path, translateExpression(expression, path.scope, context)),
    );
  }
  const intlMethodCall = getIntlMethodCall(expression, context);
  if (intlMethodCall !== undefined) {
    const heap = getHeap(path.scope, expression, context);
    const method = translateBuiltInValue(intlMethodCall.path, expression, context);
    return ifThenElse(
      apply("/\\", [
        useJavaScript(
          "SameValue",
          [translateExpression(intlMethodCall.method, path.scope, context), method],
          context,
        ),
        intlMethodCall.isCall
          ? useJavaScript(
              "HoldsBuiltIn",
              [heap, method, string("call"), string("Function.prototype.call")],
              context,
            )
          : boolean(true),
        useJavaScript(
          "IntlThrows",
          [
            heap,
            string(intlMethodCall.kind),
            boolean(intlMethodCall.unwraps),
            intlMethodCall.receiver === undefined
              ? getUndefined(context)
              : translateExpression(intlMethodCall.receiver, path.scope, context),
          ],
          context,
        ),
      ]),
      throwTypeError(path, expression, context, frame),
      leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't call ${intlMethodCall.path} where a script replaced it`),
        ]),
      ),
    );
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
    const getReceiverValue = () =>
      receiver === undefined
        ? getUndefined(context)
        : translateExpression(receiver, path.scope, context);
    const run = isFunctionReceiver
      ? throwTypeError(path, expression, context, frame)
      : sizeOwner !== undefined
        ? size === undefined
          ? throwTypeError(path, expression, context, frame)
          : continueWith(path, size)
        : bindOnce(
            path,
            resultName,
            useJavaScript("GetterCall", [heap, getter, getReceiverValue()], context),
            ifThenElse(
              apply("=", [field(result, "error"), string("")]),
              continueWith(path, field(result, "value")),
              throwTypeError(path, expression, context, frame),
            ),
          );
    // flags reads each flag of its receiver in order through Get, which runs the getters that the
    // script writes, and throws a TypeError on a receiver that isn't an object.
    const flagsGetter = () =>
      useJavaScript("FlagsFirstGetter", [heap, getReceiverValue()], context);
    const isFlagsRead =
      getterCall.path === "get RegExp.prototype.flags" &&
      getRegExpProtocolAccessors(expression, context).length > 0;
    const checked = isFlagsRead
      ? translateJoined(expression, path, context, continueWith, (next) =>
          ifThenElse(
            useJavaScript("IsObjectIn", [heap, getReceiverValue()], context),
            readFlags(expression, getReceiverValue(), path, context, frame, next),
            throwTypeError(path, expression, context, frame),
          ),
        )
      : getterCall.path === "get RegExp.prototype.flags"
        ? throwFirstGetter(
            expression,
            apply("#", [flagsGetter(), getUndefined(context)]),
            flagsGetter(),
            getReceiverValue(),
            path,
            context,
            frame,
            run,
            getterCall.receiver,
          )
        : run;
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
      checked,
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call a getter that a script replaced"),
        ]),
      ),
    );
  }
  // JSON.stringify of a value that may hold a BigInt throws a TypeError where it does.
  const revival = getRevival(expression, context);
  if (revival !== undefined) {
    return reviveJson(expression, revival, path, context, frame, continueWith);
  }
  const builtText = getBuiltJsonText(expression, context);
  if (builtText !== undefined) {
    return translateBuiltJsonParse(expression, builtText, path, context, frame, continueWith);
  }
  const replacers = getReplacers(expression, context);
  const stringifyGetters = getStringifyGetters(expression, context);
  if (replacers !== undefined || stringifyGetters.length > 0) {
    return replaceJson(
      expression,
      replacers ?? [],
      stringifyGetters,
      path,
      context,
      frame,
      continueWith,
    );
  }
  if (isBigIntStringify(expression, context)) {
    return allocateAll(
      getAllocated(expression, context).filter((inner) => !path.scope.allocated.has(inner)),
      path,
      context,
      (allocated) =>
        bind(
          allocated,
          "stringified",
          translateStringify(expression, allocated.scope, context),
          context,
          (after, value) =>
            ifThenElse(
              useJavaScript("IsError", [value], context),
              throwTypeError(after, expression, context, frame),
              continueWith(after, value),
            ),
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
      hints: [stringCall.owner, ...stringCall.values].map(() => "string" as const),
      combine: (primitives: readonly Expression[]) => tuple([...primitives]),
    };
    return ifThenElse(
      apply("/\\", [
        useJavaScript(
          "SameValue",
          [translateExpression(stringCall.callee, path.scope, context), builtIn],
          context,
        ),
        stringCall.isCall
          ? useJavaScript(
              "HoldsBuiltIn",
              [heap, builtIn, string("call"), string("Function.prototype.call")],
              context,
            )
          : boolean(true),
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
              primitives
                .slice(1)
                .map((primitive, position) =>
                  stringCall.kinds[position] === "kept"
                    ? primitive
                    : stringCall.primitive.parameters[position] === "string"
                      ? useJavaScript("StringOf", [primitive], context)
                      : context.hasSpecialNumbers
                        ? useJavaScript("ToNumber", [primitive], context)
                        : useJavaScript(
                            "PlainNumber",
                            [useJavaScript("ToNumber", [primitive], context)],
                            context,
                          ),
                ),
              context,
            ),
          ),
        );
      }),
      leaf(
        apply("Assert", [
          boolean(false),
          string(
            stringCall.isCall
              ? `tla-ts can't call String.prototype.${stringCall.method} where a script replaced it`
              : "tla-ts can't tell which function this call runs",
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
  if (isObjectChange(expression, context) && isReflectSet(expression) && heapSymbol !== undefined) {
    return translateReflectSet(expression, path, context, frame, continueWith);
  }
  if (isObjectChange(expression, context) && heapSymbol !== undefined) {
    const translated = translateObjectChange(expression, path.scope, context);
    const name = context.names.getFresh(translated.isFallible ? "change" : "heap");
    // Each change gives the object it changes, but Reflect.construct, and Reflect's changes, which give
    // whether they made the change.
    const target = expression.arguments.at(0);
    const value =
      expression.expression.name.text === "construct" || target === undefined
        ? undefined
        : isReflectChange(expression)
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
    const finish = (current: Path, change: Expression) => {
      const after = {
        ...current,
        scope: {
          ...current.scope,
          bindings: new Map([
            ...current.scope.bindings,
            [heapSymbol, field(identifier(name), "heap")],
          ]),
        },
      };
      return bindOnce(
        current,
        name,
        change,
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
    };
    if (!("values" in translated) || !mayDefineObjectLength(expression, context)) {
      return finish(path, translated.change);
    }
    // ArraySetLength converts an object to a number twice, running its valueOf and toString each
    // time, after the definition reads its descriptor.
    const values = translated.values;
    return translateJoined(
      expression,
      path,
      context,
      (joined, change) => finish(joined, change ?? translated.change),
      (next) =>
        bind(
          path,
          "descriptor",
          expression.expression.name.text === "defineProperties"
            ? useJavaScript(
                "PropertiesLengthDescriptor",
                [getHeap(path.scope, expression, context), values[0], values[1]],
                context,
              )
            : useJavaScript(
                "LengthDescriptor",
                [getHeap(path.scope, expression, context), ...values],
                context,
              ),
          context,
          (bound, descriptor) =>
            ifThenElse(
              apply("=", [descriptor, identifier("Null")]),
              next(bound, translated.change),
              runToPrimitive(
                expression,
                field(descriptor, "value"),
                "number",
                bound,
                context,
                frame,
                (converted, first) =>
                  runToPrimitive(
                    expression,
                    field(descriptor, "value"),
                    "number",
                    converted,
                    context,
                    frame,
                    (again, second) =>
                      next(
                        again,
                        useJavaScript(
                          isReflectChange(expression) ? "ReflectDefineLength" : "DefineLength",
                          [
                            getHeap(again.scope, expression, context),
                            values[0],
                            descriptor,
                            first,
                            second,
                          ],
                          context,
                        ),
                      ),
                  ),
              ),
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
    // A set or a map that the heap holds changes through getHeapSetOrMapChange, or not at all.
    if (
      MUTATING_METHODS.has(method) &&
      kind !== "other" &&
      (kind === "sequence" || !SEQUENCE_UPDATES.has(method)) &&
      !isHeapSetOrMap(receiver, context)
    ) {
      if (isFreshReorder(expression, context)) {
        return continueWith(path, translateExpression(expression, path.scope, context));
      }
      const assigned = assign(receiver, path, context, (current) => {
        const value = getUpdatedValue(current, kind, expression, path.scope, context);
        if (value === undefined) {
          throw new TlaTypeScriptError(`Unsupported method: ${method}`, expression);
        }
        return value;
      });
      // sort, reverse, fill, and copyWithin give the array that they change.
      const changed = continueWith(
        assigned,
        REORDER_METHODS.has(method)
          ? translateExpression(receiver, assigned.scope, context)
          : undefined,
      );
      const updated = guardReceiver(receiver, changed);
      const key = expression.arguments.at(0);
      // A weak collection throws a TypeError on a symbol that Symbol.for registered.
      if (
        getCollection(receiver, context)?.startsWith("Weak") !== true ||
        (method !== "set" && method !== "add" && method !== "getOrInsert") ||
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
  // A function's call through Function.prototype.call with an object as this, where the function
  // and Function.prototype still hold the built-in call.
  const throughCall = getCast(expression.expression);
  const calledFunction =
    ts.isPropertyAccessExpression(throughCall) &&
    throughCall.name.text === "call" &&
    ts.isIdentifier(skipCasts(throughCall.expression))
      ? getCallee(skipCasts(throughCall.expression), context)
      : undefined;
  const functionThis = expression.arguments.at(0);
  if (
    calledFunction !== undefined &&
    ts.isPropertyAccessExpression(throughCall) &&
    (ts.isFunctionDeclaration(calledFunction) || ts.isFunctionExpression(calledFunction)) &&
    calledFunction.asteriskToken === undefined &&
    functionThis !== undefined &&
    !expression.arguments.some(ts.isSpreadElement) &&
    getKind(functionThis, context) === "object"
  ) {
    return ifThenElse(
      useJavaScript(
        "CallsThroughBuiltIn",
        [
          getHeap(path.scope, expression, context),
          translateExpression(throughCall.expression, path.scope, context),
          translateBuiltInValue("Function.prototype", expression, context),
        ],
        context,
      ),
      inlineBody(
        expression,
        calledFunction,
        expression.arguments.slice(1),
        {
          value: translateObjectValue(functionThis, path.scope, context),
          method: calledFunction,
        },
        path,
        context,
        frame,
        continueWith,
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which function this call runs"),
        ]),
      ),
    );
  }
  const calledThrough = getCalledThrough(expression, context);
  const thisArgument = expression.arguments.at(0);
  if (calledThrough !== undefined && thisArgument !== undefined) {
    return ifThenElse(
      apply("/\\", [
        translateHoldsMethod(calledThrough, path.scope, context),
        useJavaScript(
          "HoldsBuiltIn",
          [
            getHeap(path.scope, expression, context),
            translateBuiltInValue("Function.prototype", expression, context),
            string("call"),
            string("Function.prototype.call"),
          ],
          context,
        ),
      ]),
      inlineBody(
        expression,
        calledThrough.method,
        expression.arguments.slice(1),
        {
          value: translateObjectValue(thisArgument, path.scope, context),
          method: calledThrough.method,
        },
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
  const applied = getAppliedCall(expression, path, context);
  if (applied !== undefined) {
    const appliedReceiver = ts.isArrowFunction(applied.callee)
      ? path.scope.receiver
      : {
          value:
            applied.thisArgument === undefined
              ? getUndefined(context)
              : translateExpression(applied.thisArgument, path.scope, context),
          method: applied.callee,
        };
    const appliedCall = isAsyncFunction(applied.callee)
      ? translateAsyncCall(
          expression,
          applied.callee,
          appliedReceiver,
          path,
          context,
          frame,
          continueWith,
          applied.argumentNodes,
        )
      : inlineBody(
          expression,
          applied.callee,
          applied.argumentNodes,
          appliedReceiver,
          path,
          context,
          frame,
          continueWith,
        );
    const method = applied.isApply ? "apply" : "call";
    return context.heap === undefined
      ? appliedCall
      : ifThenElse(
          useJavaScript(
            "HoldsBuiltIn",
            [
              getHeap(path.scope, expression, context),
              isHeapFunction(applied.callee, context)
                ? translateExpression(applied.target, path.scope, context)
                : translateBuiltInValue("Function.prototype", expression, context),
              string(method),
              string(`Function.prototype.${method}`),
            ],
            context,
          ),
          appliedCall,
          leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't tell which function this call runs"),
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
    // Each function that the value may be continues to one copy of what follows the call.
    return translateJoined(expression, path, context, continueWith, (continueCall) => {
      const target = getCast(expression.expression);
      const value = translateExpression(target, path.scope, context);
      const receiver = isSuperAccess(target)
        ? getSuperLookup(target.expression, path.scope, context).receiver
        : ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
          ? translateObjectValue(target.expression, path.scope, context)
          : getUndefined(context);
      if (dispatched.some(isAnyGenerator)) rejectGeneratorUse(expression, context);
      context.prelude.add("Null");
      const accessor = ts.isPropertyAccessExpression(target)
        ? /^__(define|lookup)([GS])etter__$/.exec(target.name.text)
        : null;
      const keyNode = expression.arguments.at(0);
      // Object.prototype's legacy accessor methods, where a script calls one through a key that it
      // may hold.
      const translateAccessor = (method: string, half: string, key: ts.Expression) => {
        const isKey =
          getTypeNames(context.checker.getTypeAtLocation(key), context.checker)?.every((name) =>
            ["string", "number", "symbol"].includes(name),
          ) ?? false;
        // ToPropertyKey, which runs an object's toString or valueOf.
        const withKey = (then: (after: Path, converted: Expression) => Formula) =>
          isKey
            ? then(path, translatePropertyKey(key, path.scope, context))
            : runToPrimitive(
                expression,
                translateExpression(key, path.scope, context),
                "string",
                path,
                context,
                frame,
                (after, primitive) =>
                  then(after, useJavaScript("PropertyKey", [primitive], context)),
              );
        if (method === "lookup") {
          return withKey((after, converted) =>
            continueCall(
              after,
              useJavaScript(
                "AccessorFieldOf",
                [getHeap(after.scope, expression, context), receiver, converted, string(half)],
                context,
              ),
            ),
          );
        }
        const functionNode = expression.arguments.at(1);
        const translatedFunction =
          functionNode === undefined
            ? getUndefined(context)
            : translateExpression(functionNode, path.scope, context);
        const change = context.names.getFresh("change");
        // The definition throws where the function isn't callable before it converts the key.
        return ifThenElse(
          apply("=", [
            useJavaScript(
              "TypeOfIn",
              [getHeap(path.scope, expression, context), translatedFunction],
              context,
            ),
            string("function"),
          ]),
          withKey((after, converted) =>
            bindOnce(
              after,
              change,
              useJavaScript(
                "DefineLegacyAccessor",
                [
                  getHeap(after.scope, expression, context),
                  receiver,
                  converted,
                  string(half),
                  translatedFunction,
                ],
                context,
              ),
              ifThenElse(
                field(identifier(change), "isDone"),
                continueCall(
                  withHeap(field(identifier(change), "heap"), after),
                  getUndefined(context),
                ),
                throwTypeError(after, expression, context, frame),
              ),
            ),
          ),
          throwTypeError(path, expression, context, frame),
        );
      };
      // %ArrayIteratorPrototype%.next or %StringIteratorPrototype%.next, which throws a TypeError for
      // a receiver that isn't an iterator of its kind.
      const translateBuiltInNext = (current: Path, next: Expression, receiverValue: Expression) => {
        const changeName = context.names.getFresh("change");
        const change = identifier(changeName);
        return bindOnce(
          current,
          changeName,
          useJavaScript(
            "BuiltInIteratorStepOf",
            [getHeap(current.scope, expression, context), receiverValue, next],
            context,
          ),
          ifThenElse(
            field(change, "isThrown"),
            throwTypeError(current, expression, context, frame),
            continueCall(withHeap(field(change, "heap")), field(change, "value")),
          ),
        );
      };
      // An Iterator.prototype method of an object that tla-ts doesn't follow as an iterator, which
      // closes the object and throws a TypeError where its callback isn't callable. A throw while it
      // closes gives way to the TypeError.
      const rejectCallback = (name: string) => {
        const callback = expression.arguments.at(0);
        const closing = {
          ...frame,
          throwTo: (after: Path) => throwTypeError(after, expression, context, frame),
        };
        return ifThenElse(
          apply("=", [
            useJavaScript(
              "TypeOfIn",
              [
                getHeap(path.scope, expression, context),
                callback === undefined
                  ? getUndefined(context)
                  : translateExpression(callback, path.scope, context),
              ],
              context,
            ),
            string("function"),
          ]),
          leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't run Iterator.prototype.${name} on an object it doesn't follow`),
            ]),
          ),
          read(expression, receiver, "return", path, context, closing, (found, method) =>
            ifThenElse(
              isNullish(method, context),
              throwTypeError(found, expression, context, frame),
              callMethod(
                expression,
                "return",
                method,
                receiver,
                [],
                found,
                context,
                closing,
                (after) => throwTypeError(after, expression, context, frame),
                (after) => throwTypeError(after, expression, context, frame),
              ),
            ),
          ),
        );
      };
      const unknown = translateStoredRegExpCall(
        expression,
        value,
        receiver,
        path,
        context,
        frame,
        leaf(stopUnknownCall(value, context)),
      );
      return dispatched.reduceRight(
        (otherwise, candidate) => {
          const candidateValue = getCandidateValue(candidate, context);
          if (candidateValue === undefined || frame.inlining.has(candidate)) return otherwise;
          const candidateReceiver = ts.isArrowFunction(candidate)
            ? undefined
            : { value: receiver, method: candidate };
          return ifThenElse(
            apply("=", [
              isClosure(candidate, context) ||
              isNestedFunction(candidate, context) ||
              isHeapFunction(candidate, context)
                ? useJavaScript(
                    "CodeOf",
                    [getHeap(path.scope, expression, context), value],
                    context,
                  )
                : value,
              candidateValue,
            ]),
            !isAnyGenerator(candidate) && !isAsyncFunction(candidate)
              ? isClosure(candidate, context)
                ? enterClosure(candidate, value, path, context, frame, (inner, innerFrame, leave) =>
                    inlineBody(
                      expression,
                      candidate,
                      expression.arguments,
                      candidateReceiver,
                      inner,
                      context,
                      innerFrame,
                      (after, result) => continueCall(leave(after), result),
                    ),
                  )
                : inlineBody(
                    expression,
                    candidate,
                    expression.arguments,
                    candidateReceiver,
                    path,
                    context,
                    frame,
                    continueCall,
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
                    continueCall,
                  )
                : isClosure(candidate, context)
                  ? enterClosure(
                      candidate,
                      value,
                      path,
                      context,
                      frame,
                      (inner, innerFrame, leave) =>
                        translateAsyncCall(
                          expression,
                          candidate,
                          candidateReceiver,
                          inner,
                          context,
                          innerFrame,
                          (after, result) => continueCall(leave(after), result),
                        ),
                    )
                  : translateAsyncCall(
                      expression,
                      candidate,
                      candidateReceiver,
                      path,
                      context,
                      frame,
                      continueCall,
                    ),
            otherwise,
          );
        },
        // Calling a value that isn't a function throws a TypeError, as does calling a built-in method
        // that needs a receiver without one, or RegExp.prototype.exec or test on one that isn't a
        // RegExp.
        ifThenElse(
          apply("\\/", [
            apply("\\in", [value, set([getUndefined(context), identifier("Null")])]),
            ...(context.modelValues.size === 0
              ? [
                  apply("/\\", [
                    apply("\\/", [
                      useJavaScript("IsHeap", [value], context),
                      apply("~", [useJavaScript("IsRef", [value], context)]),
                    ]),
                    apply("#", [
                      useJavaScript(
                        "TypeOfIn",
                        [getHeap(path.scope, expression, context), value],
                        context,
                      ),
                      string("function"),
                    ]),
                  ]),
                ]
              : []),
          ]),
          throwTypeError(path, expression, context, frame),
          !ts.isPropertyAccessExpression(target) || expression.arguments.some(ts.isSpreadElement)
            ? ts.isIdentifier(skipCasts(target)) && expression.arguments.every(isInertValue)
              ? ifThenElse(
                  useJavaScript("ThrowsWithoutReceiver", [value], context),
                  throwTypeError(path, expression, context, frame),
                  ifThenElse(
                    useJavaScript("HasReceiverlessValue", [value], context),
                    continueCall(path, useJavaScript("ReceiverlessValue", [value], context)),
                    unknown,
                  ),
                )
              : unknown
            : target.name.text === "next" && expression.arguments.length === 0
              ? ifThenElse(
                  useJavaScript("IsBuiltInIteratorNext", [value], context),
                  translateBuiltInNext(path, value, receiver),
                  unknown,
                )
              : ITERATOR_CALLBACK_METHODS.has(target.name.text)
                ? ifThenElse(
                    apply("=", [
                      value,
                      translateBuiltInValue(
                        `Iterator.prototype.${target.name.text}`,
                        expression,
                        context,
                      ),
                    ]),
                    rejectCallback(target.name.text),
                    unknown,
                  )
                : OWN_CHECKS.has(target.name.text) &&
                    expression.arguments.length === 1 &&
                    keyNode !== undefined &&
                    isInertValue(keyNode) &&
                    isEvery(context.checker.getTypeAtLocation(keyNode), ts.TypeFlags.StringLike)
                  ? ifThenElse(
                      apply("=", [
                        value,
                        translateBuiltInValue(
                          `Object.prototype.${target.name.text}`,
                          expression,
                          context,
                        ),
                      ]),
                      continueCall(
                        path,
                        useJavaScript(
                          target.name.text === "hasOwnProperty" ? "HasOwn" : "IsEnumerableOwn",
                          [
                            getHeap(path.scope, expression, context),
                            receiver,
                            translateExpression(keyNode, path.scope, context),
                          ],
                          context,
                        ),
                      ),
                      unknown,
                    )
                  : accessor === null || keyNode === undefined
                    ? unknown
                    : ifThenElse(
                        apply("=", [
                          value,
                          translateBuiltInValue(
                            `Object.prototype.${target.name.text}`,
                            expression,
                            context,
                          ),
                        ]),
                        translateAccessor(
                          accessor[1],
                          accessor[2] === "G" ? "get" : "set",
                          keyNode,
                        ),
                        unknown,
                      ),
        ),
      );
    });
  }
  // An array method whose callback changes nothing, or one that only reads the array, evaluates as
  // an expression, though the statement drops its value.
  if (
    callee === undefined &&
    (getLoopTarget(expression, context) !== undefined ||
      (isMethodCall(expression) &&
        READING_METHODS.has(expression.expression.name.text) &&
        (expression.expression.name.text !== "toSorted" || expression.arguments.length === 0) &&
        (getKind(expression.expression.expression, context) === "sequence" ||
          isHeapArray(expression.expression.expression, context))))
  ) {
    const value = translateExpression(expression, path.scope, context);
    return ifThenElse(apply("=", [value, value]), continueWith(path, value), leaf(boolean(false)));
  }
  // A call of a value that tla-ts can't name throws the TypeError where the value isn't callable
  // or is %ThrowTypeError%, and stops where it's another function.
  const target = getCast(expression.expression);
  if (
    callee === undefined &&
    expression.questionDotToken === undefined &&
    ts.isIdentifier(skipCasts(target)) &&
    (isFunctionValue(target, context) ||
      (context.heap !== undefined &&
        context.modelValues.size === 0 &&
        (context.checker.getTypeAtLocation(target).flags &
          (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
          0)) &&
    expression.arguments.every(isInertValue)
  ) {
    const value = translateExpression(target, path.scope, context);
    return ifThenElse(
      apply("\\/", [
        apply("#", [
          useJavaScript("TypeOfIn", [getHeap(path.scope, expression, context), value], context),
          string("function"),
        ]),
        apply("=", [
          value,
          translateBuiltInValue("get Function.prototype.arguments", expression, context),
        ]),
        useJavaScript("ThrowsWithoutReceiver", [value], context),
      ]),
      throwTypeError(path, expression, context, frame),
      translateStoredRegExpCall(
        expression,
        value,
        getUndefined(context),
        path,
        context,
        frame,
        ifThenElse(
          useJavaScript("HasReceiverlessValue", [value], context),
          continueWith(path, useJavaScript("ReceiverlessValue", [value], context)),
          leaf(stopUnknownCall(value, context)),
        ),
      ),
    );
  }
  // A built-in method that a value holds, which call runs on a receiver it can't run on, throws a
  // TypeError before it reads its arguments.
  const calledMethod = getCast(expression.expression);
  if (
    callee === undefined &&
    context.heap !== undefined &&
    ts.isPropertyAccessExpression(calledMethod) &&
    calledMethod.name.text === "call" &&
    isNamePath(skipCasts(calledMethod.expression)) &&
    expression.arguments.length > 0 &&
    (isInertValue(expression.arguments[0]) ||
      (ts.isCallExpression(expression.arguments[0]) &&
        getBuiltIn(expression.arguments[0].expression, context) === "Symbol" &&
        expression.arguments[0].arguments.every(ts.isStringLiteral))) &&
    expression.arguments
      .slice(1)
      .every(
        (argument) =>
          isLiteral(argument) ||
          (ts.isObjectLiteralExpression(argument) && argument.properties.length === 0),
      )
  ) {
    return allocate(expression, path, context, (inner) => {
      const heap = getHeap(inner.scope, expression, context);
      const method = translateExpression(calledMethod.expression, inner.scope, context);
      const receiver = translateExpression(expression.arguments[0], inner.scope, context);
      const stop = leaf(stopUnknownCall(method, context));
      // Promise.prototype.catch invokes the receiver's then with undefined and its argument, which
      // runs a then that the script writes.
      const caught =
        expression.arguments.length <= 2
          ? getThenMethods(expression.getSourceFile()).reduceRight<Formula>(
              (rest, then) =>
                ifThenElse(
                  apply("/\\", [
                    useJavaScript(
                      "SameValue",
                      [
                        method,
                        translateBuiltInValue("Promise.prototype.catch", expression, context),
                      ],
                      context,
                    ),
                    useJavaScript("IsHeap", [receiver], context),
                    apply("~", [useJavaScript("IsProxy", [heap, receiver], context)]),
                    apply("=", [
                      useJavaScript("GetterOf", [heap, receiver, string("then")], context),
                      getUndefined(context),
                    ]),
                    apply("=", [
                      useJavaScript("Get", [heap, receiver, string("then")], context),
                      getCandidateValue(then, context) ?? getUndefined(context),
                    ]),
                  ]),
                  inlineValues(
                    then,
                    [
                      getUndefined(context),
                      expression.arguments[1] === undefined
                        ? getUndefined(context)
                        : translateExpression(expression.arguments[1], inner.scope, context),
                    ],
                    { value: receiver, method: then },
                    inner,
                    context,
                    frame,
                    continueWith,
                  ),
                  rest,
                ),
              stop,
            )
          : stop;
      return ifThenElse(
        useJavaScript("ThrowsOnReceiver", [heap, method, receiver], context),
        throwTypeError(inner, expression, context, frame),
        caught,
      );
    });
  }
  if (callee?.body === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  const call = inlineBody(
    expression,
    callee,
    expression.arguments,
    getReceiver(path.scope, context, called, { node: expression, callee }),
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

// A method's call through Function.prototype.call, which runs it with an object as this.
const getCalledThrough = (node: ts.CallExpression, context: Context) => {
  const thisArgument = node.arguments.at(0);
  const called =
    isMethodCall(node) && node.expression.name.text === "call"
      ? getCalledMethod(node.expression.expression, context)
      : undefined;
  return called !== undefined &&
    called.receiver.kind !== ts.SyntaxKind.SuperKeyword &&
    thisArgument !== undefined &&
    !node.arguments.some(ts.isSpreadElement) &&
    getKind(thisArgument, context) === "object"
    ? called
    : undefined;
};

// A call of a script's function or async function through Function.prototype.call or apply,
// with the this and the arguments that it passes. apply's CreateListFromArrayLike takes no
// arguments from undefined or null, and an array literal's elements, with undefined at its holes.
const getAppliedCall = (node: ts.CallExpression, path: Path, context: Context) => {
  if (!isMethodCall(node) || !["call", "apply"].includes(node.expression.name.text)) {
    return undefined;
  }
  const isApply = node.expression.name.text === "apply";
  const target = getCast(node.expression.expression);
  const callee =
    ts.isIdentifier(target) || ts.isFunctionExpression(target) || ts.isArrowFunction(target)
      ? (getCallback(target, path, context) ?? getAsyncCallee(target, path, context))
      : undefined;
  const listed = isApply ? node.arguments.at(1) : undefined;
  const list = listed === undefined ? undefined : getCast(listed);
  const argumentNodes = !isApply
    ? node.arguments.slice(1)
    : list === undefined ||
        list.kind === ts.SyntaxKind.NullKeyword ||
        isUndefinedLiteral(list, context)
      ? []
      : ts.isArrayLiteralExpression(list)
        ? list.elements
        : undefined;
  return callee?.body !== undefined &&
    (ts.isFunctionDeclaration(callee) ||
      ts.isFunctionExpression(callee) ||
      ts.isArrowFunction(callee)) &&
    argumentNodes !== undefined &&
    (!isApply || node.arguments.length <= 2) &&
    !node.arguments.slice(0, isApply ? 2 : 1).some(ts.isSpreadElement)
    ? { callee, target, argumentNodes, thisArgument: node.arguments.at(0), isApply }
    : undefined;
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

// A parameter and the elements of its pattern, in the order that binding it evaluates their defaults.
const getBindings = (
  binding: ts.ParameterDeclaration | ts.BindingElement,
): (ts.ParameterDeclaration | ts.BindingElement)[] => [
  binding,
  ...(ts.isIdentifier(binding.name)
    ? []
    : binding.name.elements.flatMap((element) =>
        ts.isOmittedExpression(element) ? [] : getBindings(element),
      )),
];

// A default that assigns runs as its own statement, after what the bindings up to its own evaluate,
// which must not read what it changes, as they take what they read as the call binds the
// parameters. It writes a variable, not a property that a binding before it may have read, and
// no getter that a pattern reads after it runs before it, as getters do here.
const rejectDefaultRun = (
  assigning: ts.ParameterDeclaration | ts.BindingElement,
  assignment: ts.BinaryExpression | Increment,
  parameters: readonly ts.ParameterDeclaration[],
  argumentNodes: readonly ts.Expression[],
  path: Path,
  context: Context,
) => {
  const bindings = parameters.flatMap(getBindings);
  const earlier = bindings.slice(0, bindings.indexOf(assigning) + 1);
  if (!ts.isIdentifier(skipCasts(getWritten(assignment) ?? assignment))) {
    throw new TlaTypeScriptError("tla-ts can't run a default that writes a property", assignment);
  }
  if (!ts.isIdentifier(assigning.name)) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a default that assigns where a nested pattern takes its value",
      assignment,
    );
  }
  const later = bindings.slice(earlier.length);
  if (later.some((binding) => ts.isBindingElement(binding) && path.scope.read?.has(binding))) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a default that assigns before the getters that follow it",
      assignment,
    );
  }
  const bound = new Set(
    bindings.flatMap((binding) =>
      ts.isIdentifier(binding.name) ? (getSymbol(binding.name, context.checker) ?? []) : [],
    ),
  );
  if (getSymbols(assignment, context).some((symbol) => bound.has(symbol))) {
    throw new TlaTypeScriptError("tla-ts can't run this default before what it binds", assignment);
  }
  rejectEarlyRun(
    assignment,
    [assignment],
    [
      ...argumentNodes,
      ...earlier.flatMap((binding) =>
        binding === assigning ||
        binding.initializer === undefined ||
        path.scope.results.has(skipCasts(binding.initializer))
          ? []
          : [binding.initializer],
      ),
    ],
    path,
    context,
  );
};

// Binds a call's arguments to its callee's parameters. A parameter's default makes its objects
// whether or not the call passes the parameter, as making an object that nothing reads can't be
// seen.
// The function that each parameter takes from a call, which the body calls where it calls the
// parameter. A function that the heap holds passes as an object where the parameter takes one, not
// a function.
export const getPassedCallbacks = (
  parameters: readonly ts.ParameterDeclaration[],
  argumentNodes: readonly ts.Expression[],
  path: Path,
  context: Context,
) =>
  parameters.flatMap((parameter, position): [ts.Symbol, FunctionNode][] => {
    const argument = argumentNodes.at(position);
    const held = argument === undefined ? undefined : getCallee(argument, context);
    const isObject =
      argument !== undefined &&
      (getHeapClass(argument, context) !== undefined ||
        (held !== undefined && isFunctionObject(held, context))) &&
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

// The defaults of a helper's parameters that its operator evaluates, once, rather than each call
// that binds its arguments: a name's default that makes no object, assigns nothing, and isn't a
// call, which a call may run as its own statement.
export const getDeferredDefaults = (callee: FunctionNode, context: Context) =>
  new Set(
    getParameters(callee).filter((parameter) => {
      const initializer = parameter.initializer && getCast(parameter.initializer);
      return (
        initializer !== undefined &&
        ts.isIdentifier(parameter.name) &&
        parameter.dotDotDotToken === undefined &&
        !ts.isCallExpression(initializer) &&
        !isUnresolved(initializer, context) &&
        findNodes(initializer, isAssignment).length === 0 &&
        getAllocated(parameter, context).length === 0 &&
        context.checker.getTypeAtLocation(parameter).getCallSignatures().length === 0
      );
    }),
  );

export const bindCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (bound: Bound, path: Path) => Formula,
  // The parameters whose defaults the operator that the call runs evaluates instead.
  deferred: ReadonlySet<ts.ParameterDeclaration> = new Set(),
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
      (isGeneratorType(source, context) || isBuiltInIteratorType(source, context))
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
          deferred,
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
    (isIteratedPattern(first.name, context) || isIterablePattern(first.name, context)) &&
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
              deferred,
            ),
        )
      : undefined;
  if (iterated !== undefined) return iterated;
  // A parameter's array pattern that a script types as iterable takes its values from the argument,
  // which the call passes as a name, through the argument's iterator before the body runs. Every
  // argument is inert, so taking the values first runs nothing out of order.
  const iterable = parameters.flatMap((parameter, position) => {
    const argument = argumentNodes.at(position);
    return ts.isArrayBindingPattern(parameter.name) &&
      argument !== undefined &&
      ts.isIdentifier(argument) &&
      !path.scope.results.has(argument) &&
      argumentNodes.every(isInertValue) &&
      !isAsyncFunction(callee)
      ? [{ pattern: parameter.name, argument }]
      : [];
  })[0];
  const iterableTaken =
    iterable &&
    takeFromIterator(
      iterable.pattern,
      translateExpression(iterable.argument, path.scope, context),
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
              results: new Map([...after.scope.results, [iterable.argument, values]]),
            },
          },
          context,
          frame,
          continueWith,
        ),
    );
  if (iterableTaken !== undefined) return iterableTaken;
  const defaulted = runCertainDefault(
    parameters.map((parameter) => parameter.name),
    parameters.flatMap((parameter, position) =>
      getKnownDefaults(
        parameter.name,
        argumentNodes.at(position),
        deferred.has(parameter) ? undefined : parameter.initializer,
        context,
      ),
    ),
    [
      ...argumentNodes,
      ...parameters.flatMap((parameter) =>
        deferred.has(parameter) ? [] : (parameter.initializer ?? []),
      ),
    ],
    path,
    context,
    // A default that may call the function again runs a call that can't end.
    { ...frame, inlining: new Set([...frame.inlining, callee]) },
    (after) =>
      bindCall(
        node,
        callee,
        argumentNodes,
        receiver,
        after,
        context,
        frame,
        continueWith,
        deferred,
      ),
  );
  if (defaulted !== undefined) return defaulted;
  const defaults = parameters
    .flatMap((parameter) => getAllocated(parameter, context))
    .filter((allocation) => !path.scope.allocated.has(allocation));
  if (defaults.length > 0) {
    return allocateAll(defaults, path, context, (allocated) =>
      bindCall(
        node,
        callee,
        argumentNodes,
        receiver,
        allocated,
        context,
        frame,
        continueWith,
        deferred,
      ),
    );
  }
  // A first parameter's pattern runs the getters of the properties it reads, after the call
  // evaluates its only argument, or where the call passes none, the object literal that its
  // default makes or the script's variable that its default names, which the caller reads alike.
  const only = argumentNodes.length === 1 ? argumentNodes[0] : undefined;
  const firstDefault = first?.initializer === undefined ? undefined : skipCasts(first.initializer);
  const named =
    firstDefault !== undefined && ts.isIdentifier(firstDefault)
      ? getSymbol(firstDefault, context.checker)?.valueDeclaration
      : undefined;
  const defaultObject =
    argumentNodes.length === 0 &&
    firstDefault !== undefined &&
    (ts.isObjectLiteralExpression(firstDefault) ||
      (named !== undefined &&
        ts.isVariableDeclaration(named) &&
        ts.isSourceFile(named.parent.parent.parent)))
      ? first?.initializer
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
          deferred,
        ),
      ),
    );
  }
  const callbacks = getPassedCallbacks(parameters, argumentNodes, path, context);
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
  const argumentValues = translateArgumentValues(
    parameters,
    argumentNodes,
    isValue,
    path.scope,
    context,
  );
  const translated = argumentValues.values;
  const values = shareArguments(translated, context);
  const plainValues = argumentValues.isSpread ? values.shared.slice(0, -1) : values.shared;
  const restValue = argumentValues.isSpread ? values.shared.at(-1) : undefined;
  const evaluateArguments = (rest: Formula) => values.evaluate(rest, leaf(boolean(false)));
  if (isArgumentsNamed(callee, context) && context.heap !== undefined && callbacks.length > 0) {
    throw new TlaTypeScriptError("Unsupported arguments object", node);
  }
  // Parameters' defaults may read the arguments object, which the call makes before it binds them.
  const made = allocateArguments(
    callee,
    argumentValues.list ?? tuple(values.shared),
    node,
    { definitions: [], scope: path.scope },
    context,
  );
  const valueParameters = parameters.filter((_, position) => isValue(position));
  const parameterScope = ts.isCallExpression(node)
    ? bindFactory(
        getSymbol(node.expression, context.checker)?.valueDeclaration,
        made.scope,
        context,
      )
    : made.scope;
  // A default that assigns runs as a statement where the value that its binding takes is undefined,
  // which binding the parameters with the default skipped gives.
  const pending = valueParameters.flatMap((parameter) =>
    getBindings(parameter).flatMap((binding) => {
      const assignment = binding.initializer && skipCasts(binding.initializer);
      return assignment !== undefined &&
        isAssignment(assignment) &&
        !path.scope.results.has(assignment)
        ? [{ binding, assignment }]
        : [];
    }),
  );
  const assigning = pending.at(0);
  if (assigning !== undefined) {
    const assignment = assigning.assignment;
    rejectDefaultRun(assigning.binding, assignment, valueParameters, argumentNodes, path, context);
    const symbol = getSymbol(assigning.binding.name, context.checker);
    const skipped = bindValues(
      valueParameters,
      plainValues,
      {
        ...parameterScope,
        results: new Map([
          ...parameterScope.results,
          ...pending.map((entry): [ts.Expression, Expression] => [
            entry.assignment,
            getUndefined(context),
          ]),
        ]),
      },
      context,
      restValue,
      deferred,
    );
    const part = symbol && skipped.scope.bindings.get(symbol);
    if (part === undefined) throw new TlaTypeScriptError("Unsupported default", assignment);
    const withDefault = (after: Path, value: Expression) =>
      bindCall(
        node,
        callee,
        argumentNodes,
        receiver,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [assignment, value]]),
          },
        },
        context,
        frame,
        continueWith,
        deferred,
      );
    // A parameter's default certainly runs where the call passes it nothing or undefined, and
    // certainly doesn't where the call passes a literal, so only the branch that runs translates.
    const position = parameters.findIndex((parameter) => parameter === assigning.binding);
    const argument = argumentNodes.at(position);
    const passedValue = argument === undefined ? undefined : skipCasts(argument);
    const isKnown = position >= 0 && !argumentNodes.slice(0, position + 1).some(ts.isSpreadElement);
    const isRun =
      isKnown && (passedValue === undefined || isUndefinedLiteral(passedValue, context));
    const isSkipped =
      isKnown &&
      passedValue !== undefined &&
      (isLiteral(passedValue) ||
        ts.isObjectLiteralExpression(passedValue) ||
        ts.isArrayLiteralExpression(passedValue) ||
        ts.isFunctionExpression(passedValue) ||
        ts.isArrowFunction(passedValue));
    return evaluateArguments(
      letIn(
        [...made.definitions, ...skipped.definitions],
        throwOnDestructured(
          skipped.scope,
          path,
          context,
          frame,
          isRun
            ? runAssignment(assignment, path, context, frame, (after, value) =>
                withDefault(after, value ?? getUndefined(context)),
              )
            : isSkipped
              ? withDefault(path, getUndefined(context))
              : // What follows translates once, for whether the default ran.
                translateJoined(
                  assignment,
                  path,
                  context,
                  (after, value) => withDefault(after, value ?? getUndefined(context)),
                  (next) =>
                    ifThenElse(
                      apply("=", [part, getUndefined(context)]),
                      runAssignment(assignment, path, context, frame, next),
                      next(path, getUndefined(context)),
                    ),
                ),
        ),
      ),
    );
  }
  const bound = bindValues(
    valueParameters,
    plainValues,
    parameterScope,
    context,
    restValue,
    deferred,
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

// Outside strict mode, a function with simple parameters has an arguments object that maps them,
// so that writing one changes the other, and whose callee is the function. Only a read of the object
// other than of its length or its elements, or a parameter that changes where the object's elements
// are read, shows the difference from the arguments object of strict mode.
export const isMappedArguments = (callee: FunctionNode, context: Context) => {
  const parameters = getParameters(callee);
  if (
    isStrictCode(callee) ||
    !isArgumentsNamed(callee, context) ||
    parameters.some(
      (parameter) =>
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer !== undefined ||
        parameter.dotDotDotToken !== undefined,
    )
  ) {
    return false;
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
  const reads = getArgumentsReads(callee, context);
  const isLengthRead = (read: ts.Identifier) =>
    isArgumentsRead(read, context) && ts.isPropertyAccessExpression(read.parent);
  return (
    !reads.every((read) => isArgumentsRead(read, context)) ||
    (isParameterWritten && !reads.every(isLengthRead))
  );
};

// The function that declares a parameter, which has its own arguments object.
const getParameterOwner = (symbol: ts.Symbol | undefined) => {
  const declaration = symbol?.valueDeclaration;
  const owner =
    declaration !== undefined && ts.isParameter(declaration) ? declaration.parent : undefined;
  return owner !== undefined &&
    (ts.isFunctionDeclaration(owner) ||
      ts.isFunctionExpression(owner) ||
      ts.isMethodDeclaration(owner) ||
      ts.isConstructorDeclaration(owner) ||
      ts.isAccessor(owner))
    ? owner
    : undefined;
};

// A read of a parameter that an arguments object maps, from the object, which holds the parameter's
// value. A write through the object may give it a value of another type than the parameter's, which
// tla-ts stops at.
export const getMappedParameter = (node: ts.Identifier, scope: Scope, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const owner = getParameterOwner(symbol);
  const ref = owner?.body === undefined ? undefined : scope.allocated.get(owner.body);
  if (
    owner === undefined ||
    ref === undefined ||
    context.heap === undefined ||
    !isMappedArguments(owner, context)
  ) {
    return undefined;
  }
  const position = getParameters(owner).findIndex(
    (parameter) => getSymbol(parameter.name, context.checker) === symbol,
  );
  const heap = getHeap(scope, node, context);
  const value = useJavaScript("MappedParameter", [heap, ref, number(position + 1)], context);
  const type = context.checker.getTypeAtLocation(node);
  const members = type.isUnion() ? type.types : [type];
  const types = getTypeNames(type, context.checker);
  if ((type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) {
    return { heap, ref, position, raw: value, value };
  }
  if (
    types === undefined ||
    members.some(
      (member) => member.isLiteral() || (member.flags & ts.TypeFlags.EnumLiteral) !== 0,
    ) ||
    members.filter((member) => (member.flags & ts.TypeFlags.BooleanLiteral) !== 0).length === 1
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't follow a parameter of this type that an arguments object outside strict mode maps",
      node,
    );
  }
  context.prelude.add("Null");
  return {
    heap,
    ref,
    position,
    raw: value,
    value: share(value, "parameter", context, (shared) =>
      ifExpression(
        useJavaScript("HasTypeIn", [heap, shared, set(types.map((name) => string(name)))], context),
        shared,
        apply("Assert", [
          boolean(false),
          string(
            `tla-ts can't read ${node.text}, which its arguments object gave a value of another type`,
          ),
        ]),
      ),
    ),
  };
};

// Writes a parameter that an arguments object maps, through the object.
const getMappedTarget = (node: ts.Identifier, path: Path, context: Context) => {
  const mapped = getMappedParameter(node, path.scope, context);
  const symbol = context.heap;
  if (mapped === undefined || symbol === undefined) return undefined;
  if (!path.mutable.has(symbol)) {
    throw new TlaTypeScriptError("Change objects only in statements", node);
  }
  return {
    symbol,
    current: mapped.value,
    update: (getValue: (current: Expression) => Expression) =>
      useJavaScript(
        "SetMappedParameter",
        [mapped.heap, mapped.ref, number(mapped.position + 1), getValue(mapped.value)],
        context,
      ),
  };
};

// What tla-ts doesn't follow of an arguments object that maps its function's parameters: that of a
// generator or an async function, a parameter that a function inside reads or that holds a function
// that the call inlines, and a callee that no model value stands for.
// It gives the function that the callee holds.
const rejectMappedArguments = (callee: FunctionNode, scope: Scope, context: Context) => {
  const stop = (message: string, node: ts.Node): never => {
    throw new TlaTypeScriptError(`tla-ts can't follow ${message} outside strict mode`, node);
  };
  if (isAnyGenerator(callee) || isAsyncFunction(callee)) {
    stop("the arguments object of a generator or an async function", callee);
  }
  const parameters = getParameters(callee);
  const symbols = parameters.map((parameter) => getSymbol(parameter.name, context.checker));
  const inner = findNodes(
    callee.body ?? callee,
    (node): node is ts.Identifier =>
      ts.isIdentifier(node) &&
      symbols.includes(getSymbol(node, context.checker)) &&
      ts.findAncestor(node.parent, ts.isFunctionLike) !== callee,
  ).at(0);
  if (inner !== undefined) {
    stop("an arguments object that maps a parameter that a function inside reads", inner);
  }
  const held = parameters.find((parameter) => {
    const symbol = getSymbol(parameter.name, context.checker);
    return symbol !== undefined && scope.functions.has(symbol);
  });
  if (held !== undefined)
    stop("an arguments object that maps a parameter that holds a function", held);
  const value = getFunctionValue(callee, context);
  return value === callee
    ? value
    : stop("an arguments object whose callee no model value stands for", callee);
};

export const allocateArguments = (
  callee: FunctionNode,
  list: Expression,
  node: ts.Node,
  bound: Bound,
  context: Context,
): Bound => {
  const heapSymbol = context.heap;
  const body = callee.body;
  if (heapSymbol === undefined || body === undefined || !isArgumentsNamed(callee, context)) {
    return bound;
  }
  const mapped = isMappedArguments(callee, context)
    ? rejectMappedArguments(callee, bound.scope, context)
    : undefined;
  const heap = context.names.getFresh("heap");
  const made =
    mapped !== undefined
      ? useJavaScript(
          "MappedArgumentsObject",
          [
            list,
            translateFunctionValue(mapped, context),
            number(getParameters(callee).length),
            translateBuiltInValue("Array.prototype.values", node, context),
          ],
          context,
        )
      : useJavaScript(
          "ArgumentsObject",
          [
            list,
            translateBuiltInValue("get Function.prototype.arguments", node, context),
            translateBuiltInValue("Array.prototype.values", node, context),
          ],
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
// such as a promise's reaction or a proxy's trap, or with a sequence of them, whose length the model
// may only know as it runs.
export const inlineValues = (
  callee: FunctionNode,
  values: Expression[] | Expression,
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", callee);
  }
  const parameters = getParameters(callee);
  const bound = allocateArguments(
    callee,
    Array.isArray(values) ? tuple(values) : values,
    callee,
    Array.isArray(values)
      ? bindValues(parameters, values, path.scope, context)
      : bindValues(
          parameters,
          parameters.map((_, position) =>
            useJavaScript("ArgumentAt", [values, number(position + 1)], context),
          ),
          path.scope,
          context,
          apply("SubSeq", [values, number(parameters.length), apply("Len", [values])]),
        ),
    context,
  );
  const back = (after: Path, result?: Expression) =>
    continueWith({ ...after, scope: { ...after.scope, previous: path.scope.previous } }, result);
  return letIn(
    bound.definitions,
    translateStatements(
      getBody(callee, bound.scope, context),
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

// A closure reads its locals from its environment, which only a call that enters it binds.
export const throwOnUnentered = (callee: ts.Node, scope: Scope, context: Context) => {
  if (isClosure(callee, context) && scope.entered !== callee) {
    throw new TlaTypeScriptError("tla-ts can't tell which call made this function", callee);
  }
};

// A function's body, which a closure runs only where a call entered it, as its environment binds
// the locals it reads.
export const getBody = (callee: FunctionNode, scope: Scope, context: Context) => {
  throwOnUnentered(callee, scope, context);
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
// The functions that a call's parameters run, which the call passes or a default writes, and which
// the recursive operator holds rather than takes.
const getSelfCallFunctions = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  argumentValues: Expression[] | undefined,
  path: Path,
  context: Context,
) =>
  getParameters(callee).map((parameter, position) => {
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

// Whether a recursive operator can run a call, which takes its arguments by name.
const isSelfCallable = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  functions: readonly (FunctionNode | undefined)[],
  context: Context,
) => {
  const parameters = getParameters(callee);
  return !(
    callee.body === undefined ||
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
          ? functions[position]?.body === undefined
          : parameter.initializer !== undefined && !isLiteral(parameter.initializer)),
    )
  );
};

// The declarations that a function's body names, and those that the functions it may call name. It
// enters only a declaration that may hold a function, as a call runs no other's initializer.
const getCalledReach = (body: ts.Node, context: Context) => {
  const reached: ts.Node[] = [];
  const seen = new Set<ts.Node>();
  const isHoldingFunction = (declaration: ts.Node) =>
    ts.isFunctionLike(declaration) ||
    ts.isClassLike(declaration) ||
    ((ts.isVariableDeclaration(declaration) ||
      ts.isParameter(declaration) ||
      ts.isBindingElement(declaration) ||
      ts.isPropertyAssignment(declaration) ||
      ts.isPropertyDeclaration(declaration)) &&
      context.checker.getTypeAtLocation(declaration).getCallSignatures().length > 0);
  const visit = (node: ts.Node): void => {
    if (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) return;
    const declarations = ts.isIdentifier(node)
      ? (getSymbol(node, context.checker)?.declarations ?? [])
      : [];
    for (const declaration of declarations) {
      if (seen.has(declaration) || declaration.getSourceFile().isDeclarationFile) continue;
      seen.add(declaration);
      reached.push(declaration);
      if (isHoldingFunction(declaration)) visit(declaration);
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return reached;
};

// Whether a function may call itself, through the functions that it names. A local one may read the
// locals of a function around it, which a call runs it with only where it binds them all.
const isCallingItself = (callee: FunctionNode, path: Path, context: Context) => {
  const declaration = ts.isVariableDeclaration(callee.parent) ? callee.parent : callee;
  if (callee.body === undefined) return false;
  const reached = getCalledReach(callee.body, context);
  // A function declaration, or a const that holds a function, is the same function at each call.
  const getFixedFunction = (node: ts.Node) =>
    ts.isFunctionDeclaration(node)
      ? node
      : ts.isVariableDeclaration(node) && (ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const) !== 0
        ? getAnyFunction(node.initializer)
        : undefined;
  const functions = new Set<ts.Node>([
    callee,
    ...reached.flatMap((node) => getFixedFunction(node) ?? []),
  ]);
  const isBound = (node: ts.Node) => {
    if (
      !(ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) ||
      getFixedFunction(node) !== undefined ||
      ts.findAncestor(node.parent, ts.isFunctionLike) === undefined ||
      ts.findAncestor(node, (ancestor) => functions.has(ancestor)) !== undefined
    ) {
      return true;
    }
    const symbol = ts.isIdentifier(node.name) ? getSymbol(node.name, context.checker) : undefined;
    return symbol !== undefined && path.scope.bindings.has(symbol);
  };
  // A local function that no name holds, such as one that a factory returns, may be a value that
  // another call of its factory made.
  return (
    reached.includes(declaration) &&
    (ts.findAncestor(callee.parent, ts.isFunctionLike) === undefined ||
      getFixedFunction(declaration) !== undefined) &&
    reached.every(isBound)
  );
};

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
  const functions = getSelfCallFunctions(callee, argumentNodes, argumentValues, path, context);
  // Each set of functions that the parameters run has its own recursive operator.
  const defined = context.selfCalls
    .get(callee)
    ?.find((selfCall) =>
      selfCall.functions.every((called, position) => called === functions[position]),
    );
  if (body === undefined || !isSelfCallable(callee, argumentNodes, functions, context)) {
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
  const enclosing = context.selfCalls.get(callee) ?? [];
  context.selfCalls.set(callee, [...enclosing, selfCall]);
  const translated = translateStatements(getBody(callee, inner.scope, context), inner, context, {
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
        : (current, thrown) => end(current, "throw", thrown.value, getThrownMessage(thrown, node)),
    yieldTo: undefined,
    awaitTo: undefined,
    inlining: new Set([...frame.inlining, callee]),
  });
  context.selfCalls.set(callee, enclosing);
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

// Binds the locals that a closure reads to those its environment holds, for a call of the closure
// that a value holds. Once the call returns or throws, the environment holds the locals that the
// closure changed, and the caller's bindings are as they were.
export const enterClosure = (
  closure: Closure,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  run: (inner: Path, innerFrame: Frame, leave: (after: Path) => Path) => Formula,
) => {
  // The locals that closures share stay in their own environments, which the closure's holds, and
  // which its body reads and writes.
  const read = getCaptures(closure, context);
  const shared = read.flatMap((symbol) => {
    const declaration = getSharedDeclaration(symbol, context);
    return declaration === undefined ? [] : [{ symbol, declaration }];
  });
  const isShared = (symbol: ts.Symbol) => shared.some((entry) => entry.symbol === symbol);
  const isSharedKey = (key: ts.Node) => shared.some((entry) => entry.declaration === key);
  const captures = read.filter((symbol) => !isShared(symbol));
  const argumentsBody = getCapturedArguments(closure, context)?.body;
  const written = captures.filter((symbol) => isAssigned(symbol, closure, context));
  const heapSymbol = context.heap;
  const leave = (after: Path): Path => ({
    ...after,
    mutable: new Set(
      [...after.mutable].filter((symbol) => !written.includes(symbol) || path.mutable.has(symbol)),
    ),
    scope: {
      ...after.scope,
      entered: path.scope.entered,
      activations: new Map([
        ...[...(after.scope.activations ?? [])].filter((entry) => !isSharedKey(entry[0])),
        ...[...(path.scope.activations ?? [])].filter((entry) => isSharedKey(entry[0])),
      ]),
      uninitialized: new Set([
        ...[...after.scope.uninitialized].filter((symbol) => !isShared(symbol)),
        ...[...path.scope.uninitialized].filter(isShared),
      ]),
      allocated: new Map([
        ...[...after.scope.allocated].filter((entry) => entry[0] !== argumentsBody),
        ...[...path.scope.allocated].filter((entry) => entry[0] === argumentsBody),
      ]),
      bindings: new Map([
        ...[...after.scope.bindings].filter((entry) => !captures.includes(entry[0])),
        ...captures.flatMap((symbol): [ts.Symbol, Expression][] => {
          const kept = path.scope.bindings.get(symbol);
          return kept === undefined ? [] : [[symbol, kept]];
        }),
        ...(heapSymbol === undefined || written.length === 0
          ? []
          : [
              [
                heapSymbol,
                written
                  .flatMap((symbol) => {
                    const changed = after.scope.bindings.get(symbol);
                    return changed === undefined ? [] : [{ symbol, changed }];
                  })
                  .reduce(
                    (heap, entry) =>
                      useJavaScript(
                        "SetCaptured",
                        [heap, value, string(entry.symbol.name), entry.changed],
                        context,
                      ),
                    getHeap(after.scope, closure, context),
                  ),
              ] satisfies [ts.Symbol, Expression],
            ]),
      ]),
    },
  });
  const heap = getHeap(path.scope, closure, context);
  const throwTo = frame.throwTo;
  return run(
    {
      ...path,
      mutable: new Set([...path.mutable, ...written]),
      scope: {
        ...path.scope,
        allocated:
          argumentsBody === undefined
            ? path.scope.allocated
            : new Map([
                ...path.scope.allocated,
                [
                  argumentsBody,
                  useJavaScript("Captured", [heap, value, string("arguments")], context),
                ],
              ]),
        entered: closure,
        bindings: new Map([
          ...path.scope.bindings,
          ...captures.map((symbol): [ts.Symbol, Expression] => [
            symbol,
            useJavaScript("Captured", [heap, value, string(symbol.name)], context),
          ]),
        ]),
        activations: new Map([
          ...(path.scope.activations ?? []),
          ...shared.map((entry): [ts.Node, Expression] => [
            entry.declaration,
            useJavaScript("Captured", [heap, value, string(entry.symbol.name)], context),
          ]),
        ]),
        uninitialized: new Set([...path.scope.uninitialized].filter((symbol) => !isShared(symbol))),
      },
    },
    {
      ...frame,
      throwTo: throwTo && ((after, thrown) => throwTo(leave(after), thrown)),
    },
    leave,
  );
};

export const inlineBody = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  // A function that calls itself runs as one recursive operator, which each call inside it calls,
  // rather than as a copy of its body at each call.
  const isSelfCall = () =>
    !isAction(callee, context) &&
    (frame.inlining.has(callee) ||
      (isCallingItself(callee, path, context) &&
        isSelfCallable(
          callee,
          argumentNodes,
          getSelfCallFunctions(callee, argumentNodes, undefined, path, context),
          context,
        )));
  const translateSelf = () =>
    translateSelfCall(node, callee, argumentNodes, receiver, path, context, frame, continueWith);
  const inlineCall = (bound: Bound, inner: Path) => {
    // What the call evaluated or made of the function's own code, such as a default that it
    // skipped or an object that a default made, belongs to that call, not to a later one.
    const isOwn = (entry: [ts.Node, Expression]) =>
      ts.findAncestor(entry[0], (ancestor) => ancestor === callee) !== undefined;
    const getCaller = (current: Path): Path => ({
      ...current,
      scope: {
        ...current.scope,
        previous: inner.scope.previous,
        entered: inner.scope.entered,
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
              getBody(callee, bound.scope, context),
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
  };
  // A call that reaches a local function that it's already inside runs the function's definition.
  return (frame.inlining.has(callee) || context.inProgress.has(callee)) &&
    ts.isCallExpression(node) &&
    argumentNodes === node.arguments &&
    isLiftable(callee, context)
    ? continueWith(path, translateLiftedCall(callee, node, path.scope, context))
    : isSharedCall(node, callee, argumentNodes, receiver, context)
      ? translateSharedCall(
          node,
          callee,
          argumentNodes,
          receiver,
          path,
          context,
          frame,
          continueWith,
          (bound, inner) => (isSelfCall() ? translateSelf() : inlineCall(bound, inner)),
        )
      : isSelfCall()
        ? translateSelf()
        : bindCall(node, callee, argumentNodes, receiver, path, context, frame, inlineCall);
};

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
    // A local of a function around the body that the script assigns has one value, which the body
    // shares with the call that made it, so code that doesn't hold that call's locals, such as a
    // job, can't resume the body.
    const shared = new Set(
      findNodes(callee, ts.isIdentifier).flatMap((identifier) => {
        const symbol = getSymbol(identifier, context.checker);
        const declaration = symbol?.valueDeclaration;
        return symbol !== undefined &&
          declaration !== undefined &&
          isOuter(symbol) &&
          ts.findAncestor(declaration.parent, ts.isFunctionLike) !== undefined &&
          isAssigned(symbol, declaration.getSourceFile(), context)
          ? [symbol]
          : [];
      }),
    );
    const enter = (resumer: Path, suspended: Path) => {
      if (
        [...shared].some(
          (symbol) => suspended.scope.bindings.has(symbol) && !resumer.scope.bindings.has(symbol),
        )
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't resume a generator away from the call whose locals it shares",
          node,
        );
      }
      return enterBody(resumer, suspended, isResumedOuter);
    };
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
      exit: finish,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: (current, thrown) => {
        const caller = getCaller(current);
        const left = leave(current, undefined);
        return caller.throwTo === undefined ? leaf(thrown.uncaught) : caller.throwTo(left, thrown);
      },
      // An async generator's yield awaits its value.
      yieldTo: (current, value, rest, throwRest, mode) => {
        const abortRest = mode?.abortRest;
        const step = (resumed: Path, settled: Expression | undefined) =>
          getCaller(resumed).step(
            leave(
              resumed,
              (resumer, sent) => rest(enter(resumer, resumed), sent),
              mode?.isGuarded,
              abortRest &&
                ((resumer, method, abrupt) => abortRest(enter(resumer, resumed), method, abrupt)),
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
        translateStatements(
          getBody(callee, start.scope, context),
          enter(resumer, start),
          context,
          bodyFrame,
        ),
      isStarted: false,
      isGuarded: false,
      isAsync,
      queue: [],
    };
    const made = { ...inner, generators: new Map([...inner.generators, [name, suspension]]) };
    const prototype = getGeneratorPrototypeRef(callee, context);
    const held =
      getHeldName(callee, context) === undefined ? undefined : getCandidateValue(callee, context);
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
            [
              getHeap(bound.scope, node, context),
              // A generator object inherits from its function's prototype object, where the heap
              // holds it, or from what the prototype property of the function's object holds.
              prototype !== undefined
                ? useJavaScript("GeneratorObjectOf", [prototype], context)
                : held === undefined
                  ? identifier("GeneratorObject")
                  : useJavaScript(
                      "GeneratorObjectFrom",
                      [
                        getHeap(bound.scope, node, context),
                        held,
                        translateBuiltInValue(
                          isAsync
                            ? "%AsyncGeneratorFunction%.prototype.prototype"
                            : "%GeneratorFunction%.prototype.prototype",
                          node,
                          context,
                        ),
                      ],
                      context,
                    ),
            ],
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
  node: ts.Node,
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
  // A callback that throws closes the generator before the error leaves the method, which wins over
  // what the close throws.
  const callbackFrame = {
    ...frame,
    throwTo: (current: Path, thrown: Thrown) => {
      const rethrow = (after: Path) =>
        frame.throwTo === undefined ? leaf(thrown.uncaught) : frame.throwTo(after, thrown);
      return resumeGenerator(
        node,
        receiver,
        "return",
        undefined,
        current,
        context,
        { ...frame, throwTo: rethrow },
        rethrow,
      );
    },
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

// The most steps of an array's or a string's iterator that the code that steps generators follows,
// as whether the iterator is done depends on the array's length as it steps.
const BUILT_IN_ITERATOR_STEP_LIMIT = 16;

// Steps an array's or a string's iterator for the code that steps generators, by its suspension: a
// next steps the iterator on the heap, and a return leaves the iterator as it is, as neither
// iterator has a return method.
const withBuiltInIterator = (
  node: ts.Node,
  path: Path,
  ref: Expression,
  context: Context,
): Path => {
  if ([...path.generators.values()].some((suspension) => isSameExpression(suspension.ref, ref))) {
    return path;
  }
  const name = context.names.getFresh("iterator");
  const getCaller = (current: Path) => {
    const caller = current.generators.get(name)?.caller;
    if (caller === undefined) throw new TlaTypeScriptError("Unsupported iterator", node);
    return caller;
  };
  const leave = (current: Path, resume: Suspension["resume"]): Path => ({
    ...current,
    generators: new Map([...current.generators, [name, getSuspension(resume)]]),
  });
  // A throw leaves the iterator where it was, without its suspension, so that a later step makes it
  // again from where the heap says it is, and the code after it holds the generators it held before.
  const drop = (current: Path): Path => {
    const generators = new Map([...current.generators].filter((entry) => entry[0] !== name));
    const isAsBefore =
      generators.size === path.generators.size &&
      [...generators].every((entry) => path.generators.get(entry[0]) === entry[1]);
    return { ...current, generators: isAsBefore ? path.generators : generators };
  };
  const getSuspension = (resume: Suspension["resume"]): Suspension => ({
    ref,
    generator: undefined,
    resume,
    isStarted: true,
    isGuarded: true,
    isRestartable: true,
    abort: (current, method) =>
      method === "return"
        ? ifThenElse(
            apply("=", [
              useJavaScript(
                "Get",
                [getHeap(current.scope, node, context), ref, string("return")],
                context,
              ),
              getUndefined(context),
            ]),
            getCaller(current).step(leave(current, resume), undefined, true),
            leaf(
              apply("Assert", [
                boolean(false),
                string(
                  "tla-ts can't close an array's or a string's iterator through a return that a script gives",
                ),
              ]),
            ),
          )
        : leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't ${method} an array's or a string's iterator`),
            ]),
          ),
    isAsync: false,
    queue: [],
  });
  // A step throws the TypeError of a typed array out of bounds where the step before it didn't, so
  // only where something besides the step before it changed the heap.
  const stepFrom =
    (count: number, stepped?: Expression) =>
    (resumer: Path): Formula => {
      if (count >= BUILT_IN_ITERATOR_STEP_LIMIT) {
        return leaf(
          apply("Assert", [
            boolean(false),
            string(
              `tla-ts can't step an array's or a string's iterator more than ${BUILT_IN_ITERATOR_STEP_LIMIT} times`,
            ),
          ]),
        );
      }
      const caller = getCaller(resumer);
      const heap = getHeap(resumer.scope, node, context);
      const stepName = context.names.getFresh("step");
      const step = identifier(stepName);
      const heapSymbol = context.heap;
      const after =
        heapSymbol === undefined
          ? resumer
          : {
              ...resumer,
              scope: {
                ...resumer.scope,
                bindings: new Map([...resumer.scope.bindings, [heapSymbol, field(step, "heap")]]),
              },
            };
      const continued = ifThenElse(
        field(step, "isDone"),
        caller.step(leave(after, undefined), undefined, true),
        caller.step(
          leave(after, stepFrom(count + 1, field(step, "heap"))),
          field(step, "value"),
          false,
        ),
      );
      return ifThenElse(
        useJavaScript("HoldsIteratorNext", [heap, ref], context),
        bindOnce(
          resumer,
          stepName,
          useJavaScript("BuiltInIteratorStep", [heap, ref], context),
          stepped !== undefined && isSameExpression(heap, stepped)
            ? continued
            : ifThenElse(
                field(step, "isThrown"),
                throwTypeError(drop(resumer), node, context, caller),
                continued,
              ),
        ),
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't step an iterator whose next a script replaced"),
          ]),
        ),
      );
    };
  return leave(path, stepFrom(0));
};

// The most steps of a script's iterator that the code that steps generators follows, as each step
// calls the iterator's next.
const SCRIPT_ITERATOR_STEP_LIMIT = 16;

// Steps an iterator that a script's class makes for the code that steps generators, by its
// suspension. It reads the iterator's next once, as GetIteratorDirect does. Each next calls it and
// reads the result's done and value, as IteratorStepValue does, where a throw, or the TypeError
// for a result that isn't an object, leaves the iterator done. A return closes the iterator, as
// IteratorClose does, which throws for the code that closes it.
const withScriptIterator = (
  node: ts.Node,
  path: Path,
  ref: Expression,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  if ([...path.generators.values()].some((suspension) => isSameExpression(suspension.ref, ref))) {
    return continueWith(path);
  }
  const name = context.names.getFresh("iterator");
  const getCaller = (current: Path) => {
    const caller = current.generators.get(name)?.caller;
    if (caller === undefined) throw new TlaTypeScriptError("Unsupported iterator", node);
    return caller;
  };
  const leave = (current: Path, resume: Suspension["resume"]): Path => ({
    ...current,
    generators: new Map([
      ...current.generators,
      [
        name,
        {
          ref,
          generator: undefined,
          resume,
          isStarted: true,
          isGuarded: true,
          abort: (closing, method) => {
            if (method !== "return") {
              return leaf(
                apply("Assert", [boolean(false), string(`tla-ts can't ${method} this iterator`)]),
              );
            }
            const caller = getCaller(closing);
            const closeFrame = { ...frame, throwTo: caller.throwTo };
            return closeIterator(
              node,
              ref,
              closing,
              context,
              closeFrame,
              (failed) => throwTypeError(failed, node, context, closeFrame),
              (closed) => caller.step(leave(closed, undefined), undefined, true),
            );
          },
          isAsync: false,
          queue: [],
        },
      ],
    ]),
  });
  const stepFrom =
    (next: Expression, count: number) =>
    (resumer: Path): Formula => {
      if (count >= SCRIPT_ITERATOR_STEP_LIMIT) {
        return leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't step an iterator more than ${SCRIPT_ITERATOR_STEP_LIMIT} times`),
          ]),
        );
      }
      const caller = getCaller(resumer);
      const throwTo = caller.throwTo;
      const stepFrame: Frame = {
        ...frame,
        throwTo: throwTo && ((current, thrown) => throwTo(leave(current, undefined), thrown)),
      };
      return stepIterator(
        node,
        ref,
        "next",
        next,
        [],
        resumer,
        context,
        stepFrame,
        (failed) => throwTypeError(failed, node, context, stepFrame),
        (done) => caller.step(leave(done, undefined), undefined, true),
        (stepped, result) =>
          readValue(node, result, stepped, context, stepFrame, (taken, value) =>
            caller.step(leave(taken, stepFrom(next, count + 1)), value, false),
          ),
      );
    };
  return read(node, ref, "next", path, context, frame, (found, next) =>
    bind(found, "next", next, context, (bound, held) =>
      continueWith(leave(bound, stepFrom(held, 0))),
    ),
  );
};

// Runs the rest where Iterator still holds the built-in from, and Iterator.prototype the built-in
// @@iterator that gives a generator object itself.
const translateHoldsIteratorFrom = (node: ts.Node, path: Path, context: Context, rest: Formula) =>
  context.heap === undefined
    ? rest
    : ifThenElse(
        useJavaScript(
          "HoldsBuiltIn",
          [
            getHeap(path.scope, node, context),
            translateBuiltInValue("Iterator", node, context),
            string("from"),
            string("Iterator.from"),
          ],
          context,
        ),
        translateHoldsIteratorPrototype("from", node, path, context, rest),
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't call Iterator.from where a script replaced it"),
          ]),
        ),
      );

// Runs the rest where Array still holds the built-in from that a call of it reads.
const translateHoldsArrayFrom = (
  isFrom: boolean,
  node: ts.Node,
  path: Path,
  context: Context,
  rest: Formula,
) =>
  !isFrom || context.heap === undefined
    ? rest
    : ifThenElse(
        useJavaScript(
          "HoldsBuiltIn",
          [
            getHeap(path.scope, node, context),
            translateBuiltInValue("Array", node, context),
            string("from"),
            string("Array.from"),
          ],
          context,
        ),
        rest,
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't call Array.from where a script replaced it"),
          ]),
        ),
      );

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

const getReturnType = (callback: ts.SignatureDeclaration, context: Context) => {
  const signature = context.checker.getSignatureFromDeclaration(callback);
  return signature && context.checker.getReturnTypeOfSignature(signature);
};

const isPrimitiveType = (type: ts.Type) =>
  (type.isUnion() ? type.types : [type]).every(
    (member) =>
      (member.flags &
        (ts.TypeFlags.StringLike |
          ts.TypeFlags.NumberLike |
          ts.TypeFlags.BooleanLike |
          ts.TypeFlags.BigIntLike |
          ts.TypeFlags.Undefined |
          ts.TypeFlags.Null |
          ts.TypeFlags.Void)) !==
      0,
  );

// Whether a function returns only primitives.
const isPrimitiveReturn = (callback: ts.SignatureDeclaration, context: Context) => {
  const returned = getReturnType(callback, context);
  return returned !== undefined && isPrimitiveType(returned);
};

// Whether a type holds only primitives, in arrays that the heap doesn't hold.
const isValueType = (type: ts.Type, context: Context): boolean =>
  (type.isUnion() ? type.types : [type]).every((member) => {
    const element = context.checker.getIndexTypeOfType(member, ts.IndexKind.Number);
    return (
      isPrimitiveType(member) ||
      (context.heapCollections.size === 0 &&
        (context.checker.isArrayType(member) || context.checker.isTupleType(member)) &&
        element !== undefined &&
        isValueType(element, context))
    );
  });

// Whether a function returns values that hold no objects, so that no one reaches the objects it
// makes once it returns.
export const isValueReturn = (callback: ts.SignatureDeclaration, context: Context) => {
  const returned = getReturnType(callback, context);
  return returned !== undefined && isValueType(returned, context);
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
  // A limit that a literal, Infinity, or Number.MAX_SAFE_INTEGER gives, which ToIntegerOrInfinity
  // truncates. Neither global can change.
  const limit =
    !isCounted || argument === undefined
      ? undefined
      : ts.isNumericLiteral(argument)
        ? Math.trunc(Number(argument.text))
        : ts.isIdentifier(argument) &&
            argument.text === "Infinity" &&
            (getSymbol(argument, context.checker)?.declarations ?? []).every(
              (declaration) => declaration.getSourceFile().isDeclarationFile,
            )
          ? Infinity
          : ts.isPropertyAccessExpression(argument) &&
              getBuiltIn(argument.expression, context) === "Number" &&
              argument.name.text === "MAX_SAFE_INTEGER"
            ? Number.MAX_SAFE_INTEGER
            : undefined;
  if (isCounted ? limit === undefined : callback?.body === undefined) {
    throw new TlaTypeScriptError(
      isCounted
        ? `Give ${method} a number literal, Infinity, or Number.MAX_SAFE_INTEGER`
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
  if (candidates.size !== 1 && helper.invalid === undefined) {
    throw new TlaTypeScriptError("tla-ts can't tell which generator this helper wraps", node);
  }
  // A helper's return closes what it wraps, as its next closes it once take reaches its limit,
  // where what the close throws leaves the helper done.
  const getSuspension = (resume: Suspension["resume"]): Suspension => ({
    ref,
    generator,
    resume,
    isStarted: true,
    isGuarded: true,
    abort:
      helper.invalid === "object"
        ? undefined
        : (closing, method) =>
            method === "return"
              ? close(closing, getCaller(closing))
              : leaf(
                  apply("Assert", [
                    boolean(false),
                    string(`tla-ts can't ${method} an iterator helper`),
                  ]),
                ),
    isAsync: false,
    queue: [],
  });
  const leave = (current: Path, resume: Suspension["resume"]): Path => ({
    ...current,
    generators: new Map([...current.generators, [name, getSuspension(resume)]]),
  });
  const close = (current: Path, caller: Caller) =>
    resumeGenerator(
      node,
      underlying,
      "return",
      undefined,
      current,
      context,
      {
        ...frame,
        throwTo: (after, thrown) =>
          caller.throwTo === undefined
            ? leaf(thrown.uncaught)
            : caller.throwTo(leave(after, undefined), thrown),
      },
      (after) => caller.step(leave(after, undefined), undefined, true),
    );
  const getFrame = (caller: Caller): Frame => ({
    ...frame,
    // A callback that throws closes the generator before the error leaves next, which wins over
    // what the close throws.
    throwTo: (current, thrown) => {
      const rethrow = (after: Path) => {
        const left = leave(after, undefined);
        return caller.throwTo === undefined ? leaf(thrown.uncaught) : caller.throwTo(left, thrown);
      };
      return resumeGenerator(
        node,
        underlying,
        "return",
        undefined,
        current,
        context,
        { ...frame, throwTo: rethrow },
        rethrow,
      );
    },
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
      if (method === "take" && counter >= (limit ?? 0)) return close(resumer, caller);
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
            [getHeap(path.scope, node, context), identifier("IteratorHelperObject")],
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
  node: ts.CallExpression,
  step: ts.PropertyAccessExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const heapSymbol = context.heap;
  const method = step.name.text;
  const argument = node.arguments.at(0);
  return resumeGenerator(
    node,
    translateExpression(step.expression, path.scope, context),
    method,
    argument && {
      value:
        method === "throw"
          ? translateThrown(argument, path.scope, context)
          : translateExpression(argument, path.scope, context),
      node: argument,
    },
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

// Resumes the generator whose object a receiver holds, for its next, return, or throw, with the
// value that the call passes and the expression that gives it. A return or a throw completes a
// generator that suspended outside try statements, and otherwise runs the body from the yield as a
// return or a throw there would, through its finally blocks and catch clauses.
export const resumeGenerator = (
  node: ts.Node,
  receiver: Expression,
  method: string,
  argument: { value: Expression; node?: ts.Expression } | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  step: Caller["step"],
  continueAsync?: (path: Path, request: Expression) => Formula,
): Formula => {
  // The value that a next sends, which a yield gives where the body resumes.
  const sent = method === "next" ? argument?.value : undefined;
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
        return resume(
          {
            ...made,
            generators: new Map([
              ...made.generators,
              [
                name,
                { ...suspension, caller: getAsyncCaller(node, name, made, request, context, done) },
              ],
            ]),
          },
          sent,
        );
      }
      // A return or a throw resumes the body at its yield, which returns or throws there.
      if (resume !== undefined && suspension.isStarted && suspension.isGuarded) {
        return suspension.abort !== undefined
          ? suspension.abort(
              {
                ...made,
                generators: new Map([
                  ...made.generators,
                  [
                    name,
                    {
                      ...suspension,
                      caller: getAsyncCaller(node, name, made, request, context, done),
                    },
                  ],
                ]),
              },
              method,
              argument?.value,
            )
          : leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't close a generator that suspended in try or yield*"),
              ]),
            );
      }
      if (method === "throw") {
        return settleRequest(
          completed,
          node,
          request,
          argument?.value ?? getUndefined(context),
          true,
          true,
          context,
          done,
        );
      }
      // A return awaits its value before the request settles.
      return awaitIn(
        completed,
        node,
        argument?.value ?? getUndefined(context),
        argument?.node,
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
      continueAsync !== undefined
    ) {
      return makeRequest(path, node, context, (made, request, ref) =>
        continueAsync(
          {
            ...made,
            generators: new Map([
              ...made.generators,
              [name, { ...suspension, queue: [...suspension.queue, { request, sent }] }],
            ]),
          },
          ref,
        ),
      );
    }
    // GeneratorValidate throws a TypeError where the body runs. A receiver that tla-ts can't match
    // to one generator branches over each, so an async generator that it can't resume fails only
    // where the receiver holds it.
    if (suspension.caller !== undefined && !suspension.isAsync) {
      return throwTypeError(path, node, context, frame);
    }
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
      return resume(
        {
          ...path,
          generators: new Map([
            ...path.generators,
            [name, { ...suspension, caller: { path, step, throwTo: frame.throwTo } }],
          ]),
        },
        sent,
      );
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
        argument?.value,
      );
    }
    if (method === "return") return step(completed, argument?.value, true);
    const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
    if (frame.throwTo === undefined) return leaf(uncaught);
    return frame.throwTo(completed, { value: argument?.value ?? getUndefined(context), uncaught });
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
          continueWith(after, getTaken(values)),
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
              ? continueWith(after, getTaken(values))
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
  const isBuiltIn = isBuiltInIteratorType(source, context);
  const take = (receiver: Expression, generators: FunctionNode[], current: Path) =>
    takeFromHeld(
      pattern,
      receiver,
      generators,
      others.filter((other) => other !== source),
      isBuiltIn ? withBuiltInIterator(pattern, current, receiver, context) : current,
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
  if (ts.isCallExpression(node) && (isGeneratorType(node, context) || isBuiltIn)) {
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
  // A function that evaluates before makes a closure, which reads nothing until a call runs it.
  return evaluated.filter((inner) => !ts.isFunctionLike(inner) && readsChanged(inner, new Set()));
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

// What binding a name evaluates, in order: each element's computed key, its default, and its
// nested pattern, which may throw or run an iterator.
const getPatternSteps = (name: ts.BindingName): ts.Node[] =>
  ts.isIdentifier(name)
    ? []
    : name.elements.flatMap((element) =>
        ts.isOmittedExpression(element)
          ? []
          : [
              ...(element.propertyName !== undefined &&
              ts.isComputedPropertyName(element.propertyName)
                ? [element.propertyName.expression]
                : []),
              ...(element.initializer === undefined ? [] : [element.initializer]),
              ...(ts.isIdentifier(element.name)
                ? []
                : [element.name, ...getPatternSteps(element.name)]),
            ],
      );

// Whether binding the names evaluates nothing before a default's or a computed key's call that
// may throw or run code: what evaluates before it ran already, or is a value such as a literal, or
// is a pattern around the call whose getters ran.
const isFirstRun = (
  names: readonly ts.BindingName[],
  call: ts.Expression,
  path: Path,
  context: Context,
) => {
  const steps = names.flatMap((name) => [
    ...(ts.isParameter(name.parent) && name.parent.initializer !== undefined
      ? [name.parent.initializer]
      : []),
    ...(ts.isIdentifier(name) ? [] : [name, ...getPatternSteps(name)]),
  ]);
  const at = steps.findIndex((step) => ts.isExpression(step) && getCast(step) === call);
  return (
    at === -1 ||
    steps
      .slice(0, at)
      .every((step) =>
        ts.isBindingName(step)
          ? step.pos <= call.pos && call.end <= step.end && !isGetterPattern(step, path, context)
          : ts.isExpression(step) &&
            (path.scope.results.has(getCast(step)) || isInertValue(getCast(step))),
      )
  );
};

// Runs the computed key of an object pattern's first property as its own statement, where only
// statements can run its call, before the pattern reads the value. A value that is null or
// undefined throws its TypeError as the pattern binds, before the key.
const runFirstKey = (
  name: ts.BindingName,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) => {
  const key = ts.isObjectBindingPattern(name) ? name.elements.at(0)?.propertyName : undefined;
  const call =
    key !== undefined && ts.isComputedPropertyName(key) ? getCast(key.expression) : undefined;
  if (
    call === undefined ||
    !ts.isCallExpression(call) ||
    path.scope.results.has(call) ||
    !(isStatementCall(call, path, context) || (path.scope.isCatching && mayThrow(call, context)))
  ) {
    return undefined;
  }
  const bound = new Set(
    findNodes(name, ts.isBindingElement).flatMap((element) =>
      ts.isIdentifier(element.name) ? getSymbols(element.name, context) : [],
    ),
  );
  if (getSymbols(call, context).some((symbol) => bound.has(symbol))) {
    throw new TlaTypeScriptError("tla-ts can't run this key before what it binds", call);
  }
  return translateJoined(
    call,
    path,
    context,
    (after, result) =>
      continueWith({
        ...after,
        scope: {
          ...after.scope,
          results: new Map([...after.scope.results, [call, result ?? getUndefined(context)]]),
        },
      }),
    (next) =>
      ifThenElse(
        isNullish(value, context),
        next(path, getUndefined(context)),
        translateCallStatement(call, path, context, frame, next),
      ),
  );
};

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
    .filter((entry) => !entry.isRun && !path.scope.results.has(entry.expression))
    .map((entry): [ts.Expression, Expression] => [entry.expression, getUndefined(context)]);
  if (skipped.length > 0) {
    return continueWith({
      ...path,
      scope: { ...path.scope, results: new Map([...path.scope.results, ...skipped]) },
    });
  }
  const run = known
    .filter((entry) => entry.isRun)
    .map((entry) => getCast(entry.expression))
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
  if (!isFirstRun(names, first, path, context)) {
    throw new TlaTypeScriptError(
      "tla-ts can't run this call before what its pattern evaluates first",
      first,
    );
  }
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
// of the elements and properties of the literal, with the computed keys of the properties.
const getKnownDefaults = (
  name: ts.BindingName,
  value: ts.Expression | undefined,
  initializer: ts.Expression | undefined,
  context: Context,
): KnownDefault[] => {
  if (value === undefined || isUndefinedLiteral(value, context)) {
    return initializer === undefined
      ? []
      : [
          { expression: initializer, isRun: true },
          ...getKnownDefaults(name, initializer, undefined, context),
        ];
  }
  const literal = getCast(value);
  const own =
    initializer !== undefined && isDefinedLiteral(literal)
      ? [{ expression: initializer, isRun: false }]
      : [];
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
      if (ts.isComputedPropertyName(key)) return [{ expression: key.expression, isRun: true }];
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

// A value that the code that steps generators steps: a generator object or an iterator helper, or
// an array's or a string's iterator.
const isSteppedValue = (node: ts.Expression, context: Context) =>
  isGeneratorType(node, context) || isBuiltInIteratorType(node, context);

// The next, return, or throw of a generator object that a call calls. An iterator helper's type
// may lack a return, which it has, so the call may assert that it's there.
const getGeneratorStep = (node: ts.CallExpression, context: Context) => {
  const callee =
    ts.isNonNullExpression(node.expression) &&
    ts.isPropertyAccessExpression(node.expression.expression) &&
    node.expression.expression.name.text === "return"
      ? node.expression.expression
      : node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    ["next", "return", "throw"].includes(callee.name.text) &&
    isGeneratorType(callee.expression, context)
    ? callee
    : undefined;
};

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
  // A script's iterator runs Iterator.prototype's method where its class doesn't write one.
  const isScriptIterator =
    !isCall &&
    !isFrom &&
    receiver !== undefined &&
    isScriptIteratorType(receiver, context) &&
    (getSymbol(accessed.name, context.checker)?.declarations ?? []).every(
      (declaration) => declaration.getSourceFile().isDeclarationFile,
    );
  return (ITERATOR_CONSUMERS.has(method) || ITERATOR_HELPERS.has(method) || isFrom) &&
    receiver !== undefined &&
    (isGeneratorType(receiver, context) ||
      isBuiltInIteratorType(receiver, context) ||
      isScriptIterator ||
      invalid !== undefined)
    ? {
        method,
        receiver,
        values: isCall || isFrom ? node.arguments.slice(1) : node.arguments,
        invalid,
      }
    : undefined;
};

// The value that Array.from(value), or Object.fromEntries(value) where the method is "fromEntries",
// iterates through the iterator of an object whose type has one, which only statements can run.
// Evaluating the value can't throw or change anything.
const getIterableFrom = (node: ts.Node, context: Context, method = "from") => {
  if (!ts.isCallExpression(node) || !isMethodCall(node) || node.arguments.length !== 1) {
    return undefined;
  }
  const argument = node.arguments[0];
  return node.expression.name.text === method &&
    getBuiltIn(node.expression.expression, context) === (method === "from" ? "Array" : "Object") &&
    !ts.isSpreadElement(argument) &&
    isInertValue(argument) &&
    getKind(argument, context) !== "sequence" &&
    isIterableValue(argument, context) &&
    context.checker
      .getTypeAtLocation(argument)
      .getProperties()
      .some((property) => property.name.startsWith("__@iterator"))
    ? argument
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

// The array methods that sort an array value with a comparator, which V8 calls on the pairs that it
// compares, in its order.
const SORT_METHODS = new Set(["sort", "toSorted"]);

// The array methods that read an array-like object's elements without a callback: those that search
// for a value and those that copy the elements. Each runs as a loop where a getter may answer the
// object's length or an element.
const UNCALLED_METHODS = new Set([
  "indexOf",
  "lastIndexOf",
  "includes",
  "toReversed",
  "toSpliced",
  "with",
]);

// The array methods that read an array without calling back and give a value.
const READING_METHODS = new Set(["at", "join", "slice", "toSorted"]);

// The methods of %TypedArray%.prototype that run as loops, which read each index below the length
// that they validate first.
const TYPED_LOOP_METHODS = new Set([
  "forEach",
  "every",
  "some",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "reduce",
  "reduceRight",
  "filter",
  "map",
]);

// The array methods that gather what they read into the array that they give.
const GATHERING_METHODS = new Set(["filter", "map", "flatMap", "toReversed", "toSpliced", "with"]);

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
  // Whether the receiver inherits the method, which the call checks is Array.prototype's.
  isInherited: boolean;
  // Whether the receiver is a typed array, whose method the call checks is %TypedArray%.prototype's.
  isTyped: boolean;
  // Whether the receiver is a set or a map that keeps its order, whose forEach visits its entries.
  isOrdered: boolean;
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

// Whether a script deletes a key from a set or a map, which leaves a gap in its entries that an
// iterator that has passed it skips, where a list of its keys closes the gap.
const isKeyDeleted = (node: ts.Node, context: Context) =>
  findNodes(
    node.getSourceFile(),
    (inner): inner is ts.PropertyAccessExpression =>
      ts.isPropertyAccessExpression(inner) &&
      ["delete", "clear"].includes(inner.name.text) &&
      (["Set", "Map"].includes(getCollection(inner.expression, context) ?? "") ||
        /^(Set|Map)\.prototype$/.test(inner.expression.getText())),
  ).length > 0;

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

// An object whose prototype is an array that the script makes may inherit an array method that
// calls back, which the call checks as it runs.
const getLoopTarget = (node: ts.Node, context: Context) => {
  const callee = ts.isCallExpression(node) ? skipCasts(node.expression) : undefined;
  if (
    callee !== undefined &&
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(callee) &&
    LOOP_METHODS.has(callee.name.text) &&
    (context.checker.getTypeAtLocation(callee).flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0 &&
    getKind(callee.expression, context) === "object" &&
    hasPrototypeArray(context)
  ) {
    return {
      method: callee.name.text,
      receiver: callee.expression,
      callbackArguments: node.arguments,
      isArrayLike: true,
      isUnordered: false,
      isInherited: true,
      isTyped: false,
      isOrdered: false,
    };
  }
  if (!isMethodCall(node)) return undefined;
  const target = node.expression.expression;
  const called = getArrayMethodCall(node, context);
  const isCall =
    called !== undefined &&
    node.arguments.length > 0 &&
    (getKind(node.arguments[0], context) === "object" ||
      isBuiltInObject(node.arguments[0], context));
  const isArrayLike = isCall || isHeapArray(target, context);
  const method = isCall ? called : node.expression.name.text;
  const receiver = isCall ? node.arguments[0] : target;
  const type = context.checker.getTypeAtLocation(target);
  if (
    !isCall &&
    (type.isUnion() ? type.types : [type]).every((member) =>
      TYPED_ARRAYS.has(member.getSymbol()?.name ?? ""),
    )
  ) {
    return TYPED_LOOP_METHODS.has(method)
      ? {
          method,
          receiver,
          callbackArguments: node.arguments,
          isArrayLike: true,
          isUnordered: false,
          isInherited: false,
          isTyped: true,
          isOrdered: false,
        }
      : undefined;
  }
  const isUnordered = method === "forEach" && isOrderFreeForEach(node, receiver, context);
  const isOrdered =
    method === "forEach" &&
    !isCall &&
    !isUnordered &&
    isOrderedCollection(receiver, context) &&
    isHeapSetOrMap(receiver, context);
  const callbackArguments = isCall ? node.arguments.slice(1) : node.arguments;
  // toSorted without a comparator reads an array-like object's elements as a loop where a getter
  // may answer its length or an element, or its length may be an object that it converts.
  const isSortedCopy =
    method === "toSorted" &&
    isArrayLike &&
    callbackArguments.length === 0 &&
    (getElementGetters(receiver, context) !== undefined ||
      getDefinedGetters(receiver, "length", context).length > 0 ||
      isObjectLength(receiver, context));
  return (LOOP_METHODS.has(method) ||
    UNCALLED_METHODS.has(method) ||
    isSortedCopy ||
    ((SORT_METHODS.has(method) || method === "flatMap") && !isArrayLike)) &&
    (isArrayLike || isUnordered || isOrdered || getKind(receiver, context) === "sequence")
    ? {
        method,
        receiver,
        callbackArguments,
        isArrayLike,
        isUnordered,
        isInherited: false,
        isTyped: false,
        isOrdered,
      }
    : undefined;
};

// The getters that pop or shift may run as it reads the element that it removes from an array that
// the heap holds, where a script defines them under an index.
const getRemovedGetters = (node: ts.Node, context: Context) => {
  const arrayChange = getHeapArrayChange(node, context);
  return arrayChange !== undefined && ["pop", "shift"].includes(arrayChange.method)
    ? (getElementGetters(arrayChange.receiver, context) ?? [])
    : [];
};

// The getters that an array-like object's method may run as it reads its length, the constructor
// that map and filter make their array through, and each element.
const getLoopGetters = (node: ts.Node, context: Context) => {
  const target = getLoopTarget(node, context);
  if (target === undefined) return [];
  const conversions =
    (target.isArrayLike && isObjectLength(target.receiver, context)) ||
    isObjectIndex(target.method, target.callbackArguments.at(1), context)
      ? getConversionFunctions(target.receiver, context)
      : [];
  return target.isArrayLike
    ? [
        ...new Set([
          ...(getElementGetters(target.receiver, context) ?? []),
          ...getDefinedGetters(target.receiver, "length", context),
          ...getSpeciesGetters(target.method, target.receiver, context),
          ...conversions,
        ]),
      ]
    : conversions;
};

// The valueOf and toString methods that push, pop, shift, or unshift may run as it converts a
// length that's an object, where a key holds it.
const getStoredLengthConversions = (node: ts.Node, context: Context) => {
  const call = isStoredStatement(node, context) ? getStoredCall(node, context) : undefined;
  return call !== undefined && isObjectLength(call.receiver, context)
    ? getConversionFunctions(call.receiver, context)
    : [];
};

// Whether a search's fromIndex may be an object, which it converts to a primitive after it reads
// the length, running the object's valueOf and toString methods.
const isObjectIndex = (method: string, from: ts.Expression | undefined, context: Context) =>
  ["includes", "indexOf", "lastIndexOf"].includes(method) &&
  from !== undefined &&
  !isPrimitiveIndex(from, context);

// Whether an array-like object's length may be an object, which the method converts to a primitive
// before it reads the elements, running the object's valueOf and toString methods.
const isObjectLength = (receiver: ts.Node, context: Context) => {
  const receiverType = context.checker.getTypeAtLocation(receiver);
  const length = receiverType.getProperty("length");
  const type =
    length === undefined
      ? receiverType.getStringIndexType()
      : context.checker.getTypeOfSymbol(length);
  return (
    type !== undefined &&
    (type.isUnion() ? type.types : [type]).some(
      (member) =>
        (member.flags &
          (ts.TypeFlags.Object |
            ts.TypeFlags.NonPrimitive |
            ts.TypeFlags.Unknown |
            ts.TypeFlags.Any)) !==
        0,
    )
  );
};

// Whether Object.defineProperty, Reflect.defineProperty, or Object.defineProperties may define an
// array's length with an object as its value.
const mayDefineObjectLength = (node: MethodCall, context: Context) => {
  const checker = context.checker;
  const isOpen = (type: ts.Type) => (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;
  const getMember = (type: ts.Type | undefined, key: string) => {
    if (type === undefined || isOpen(type)) return type;
    const property = type.getProperty(key);
    return property === undefined ? type.getStringIndexType() : checker.getTypeOfSymbol(property);
  };
  const mayBeObject = (type: ts.Type | undefined) =>
    type !== undefined &&
    (type.isUnion() ? type.types : [type]).some(
      (member) =>
        (member.flags &
          (ts.TypeFlags.Object |
            ts.TypeFlags.NonPrimitive |
            ts.TypeFlags.Any |
            ts.TypeFlags.Unknown |
            ts.TypeFlags.TypeParameter)) !==
        0,
    );
  const key = node.arguments.at(1);
  const descriptor = node.arguments.at(2);
  if (node.expression.name.text === "defineProperties") {
    return (
      key !== undefined &&
      mayBeObject(getMember(getMember(checker.getTypeAtLocation(key), "length"), "value"))
    );
  }
  return (
    node.expression.name.text === "defineProperty" &&
    key !== undefined &&
    ts.isStringLiteralLike(key) &&
    key.text === "length" &&
    descriptor !== undefined &&
    mayBeObject(getMember(checker.getTypeAtLocation(descriptor), "value"))
  );
};

const getSpeciesGetters = (method: string, receiver: ts.Node, context: Context) =>
  method === "map" || method === "filter"
    ? getDefinedGetters(receiver, "constructor", context)
    : [];

const getLoopCall = (node: ts.Expression, path: Path, context: Context): LoopCall | undefined => {
  const target = getLoopTarget(node, context);
  if (target === undefined) return undefined;
  const argument = target.callbackArguments.at(0);
  // A length that may be an object or a symbol converts in statements, which may throw.
  const isLengthConverted =
    target.isArrayLike && !target.isTyped && isObjectLength(target.receiver, context);
  if (UNCALLED_METHODS.has(target.method) || (target.method === "toSorted" && target.isArrayLike)) {
    return (getLoopGetters(node, context).length > 0 ||
      isLengthConverted ||
      isObjectIndex(target.method, target.callbackArguments.at(1), context)) &&
      !target.callbackArguments.some(ts.isSpreadElement)
      ? {
          method: target.method,
          receiver: target.receiver,
          callback: undefined,
          argument,
          initial: target.callbackArguments.at(1),
          isArrayLike: target.isArrayLike,
          isUnordered: target.isUnordered,
          isInherited: target.isInherited,
          isTyped: target.isTyped,
          isOrdered: target.isOrdered,
        }
      : undefined;
  }
  const callback = argument && getCallback(argument, path, context);
  // A flatMap whose array the heap holds runs as an expression.
  return argument !== undefined &&
    callback?.body !== undefined &&
    !(target.method === "flatMap" && context.heapCollections.has(node)) &&
    (ts.isArrowFunction(callback) ||
      ts.isFunctionExpression(callback) ||
      ts.isFunctionDeclaration(callback)) &&
    (target.isTyped ||
      getChanged(callback, path, context).length > 0 ||
      (path.scope.isCatching && mayThrow(callback, context)) ||
      getLoopGetters(node, context).length > 0 ||
      isLengthConverted ||
      context.heapCollections.has(node) ||
      target.isOrdered ||
      (target.isArrayLike && target.method === "forEach"))
    ? {
        method: target.method,
        receiver: target.receiver,
        callback,
        argument,
        initial: target.callbackArguments.at(1),
        isArrayLike: target.isArrayLike,
        isUnordered: target.isUnordered,
        isInherited: target.isInherited,
        isTyped: target.isTyped,
        isOrdered: target.isOrdered,
      }
    : undefined;
};

// Runs an array method's callback on each element in turn, as statements. An array is a value
// that the callback can't change, so the method visits each of the elements it had.
// An array-like object whose length is past 2^31 reads only the keys that it holds, where slice,
// toSpliced, indexOf, or lastIndexOf reads it.
const translateLoopCall = (
  expression: ts.CallExpression,
  loop: LoopCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const isCalledThrough = expression.arguments.at(0) === loop.receiver;
  const owner = translateExpression(loop.receiver, path.scope, context);
  const long =
    loop.isArrayLike && !loop.isTyped
      ? translateLongRead(
          loop.method,
          owner,
          isCalledThrough ? expression.arguments.slice(1) : expression.arguments,
          expression,
          path.scope,
          context,
        )
      : undefined;
  return long === undefined
    ? translateShortLoopCall(expression, loop, path, context, frame, continueWith)
    : ifThenElse(
        useJavaScript("HasLongLength", [getHeap(path.scope, expression, context), owner], context),
        continueWith(path, long),
        translateShortLoopCall(expression, loop, path, context, frame, continueWith),
      );
};

// The array methods that skip holes, whose callbacks and results never read the length.
const BOUNDED_METHODS = new Set([
  "every",
  "some",
  "filter",
  "forEach",
  "reduce",
  "reduceRight",
  "flatMap",
]);

const translateShortLoopCall = (
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
  // toSorted copies an array-like object's elements, reading each index, and then sorts the copy.
  const isSortedCopy = method === "toSorted" && loop.isArrayLike;
  const isSort = SORT_METHODS.has(method) && !isSortedCopy;
  // toSpliced copies the elements before where it starts and after those it skips, which it doesn't
  // read, and inserts its items between them.
  const isSpliced = method === "toSpliced";
  // Where a getter may answer an array-like object's length or element, or the callback may change
  // objects, the method reads its length and then each element as it visits it, as JavaScript
  // does. reduce without an initial value takes the first element that it finds as its
  // accumulator, and throws a TypeError where it finds none.
  // A typed array's method reads its length from the view, and each element from its buffer, which
  // no getter answers.
  const isObject = loop.isArrayLike && !loop.isTyped;
  const lengthGetters = isObject ? getDefinedGetters(receiver, "length", context) : [];
  const speciesGetters =
    isObject || loop.isTyped ? getSpeciesGetters(method, receiver, context) : [];
  const isLengthConverted = isObject && isObjectLength(receiver, context);
  // A search's fromIndex converts after the method reads the length, running an object's valueOf
  // and toString, so an array-like object's method reads each element as it visits it.
  const isObjectFrom = isObjectIndex(method, loop.initial, context);
  // A length that's an array reads its valueOf and toString from Array.prototype.
  if (isLengthConverted) context.builtIns.add("Array.prototype");
  // The array that map makes, where the heap holds it, gathers its elements and its holes.
  const isHeapMap = method === "map" && !loop.isTyped && context.heapCollections.has(expression);
  const getters = loop.isTyped
    ? []
    : loop.isArrayLike
      ? (getElementGetters(receiver, context) ??
        (lengthGetters.length + speciesGetters.length > 0 ||
        isLengthConverted ||
        isObjectFrom ||
        isHeapMap ||
        (callback !== undefined &&
          getChanged(callback, path, context).some((symbol) => symbol === context.heap))
          ? []
          : undefined))
      : undefined;
  // A let or a const whose declaration hasn't run yet has no value to pass to the loop: only a
  // getter that the loop stops at instead of calling can change it.
  const changed = (
    getters === undefined && callback !== undefined
      ? getChanged(callback, path, context)
      : getChanged(expression, path, context)
  ).filter((symbol) => !path.scope.uninitialized.has(symbol));
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
    !loop.isOrdered &&
    ts.isIdentifier(receiver) &&
    changed.some((symbol) => symbol === getSymbol(receiver, context.checker));
  // An array-like object's method reads it through the reference that it took before the loop, and
  // sort writes back the elements that it read.
  if (
    loop.isOrdered &&
    changed.some((symbol) => symbol === context.heap) &&
    isKeyDeleted(expression, context)
  ) {
    throw new TlaTypeScriptError(
      "Unsupported call: tla-ts can't call forEach on a set or a map while its callback changes objects and the script deletes keys",
      site,
    );
  }
  // A search reads the array that it took before it converts fromIndex, which can't tell an element
  // that the conversion writes from a new array that it assigns.
  if (isObjectFrom && !loop.isArrayLike && isReceiverChanged(receiver)) {
    throw new TlaTypeScriptError(
      "tla-ts can't search an array that converting its fromIndex changes",
      receiver,
    );
  }
  if (!loop.isArrayLike && !loop.isOrdered && (isSort || !isLive) && isReceiverChanged(receiver)) {
    throw new TlaTypeScriptError("Don't change an array while its method calls back", receiver);
  }
  if (changed.some((symbol) => path.scope.functions.has(symbol))) {
    throw new TlaTypeScriptError("Don't reassign a function inside a callback", site);
  }
  // The array parameter holds a sequence, which only a parameter typed as an array can read, where
  // a set's or a map's holds the collection.
  const callbackParameters = callback === undefined ? [] : getParameters(callback);
  const arrayName = callbackParameters.at(isReduce ? 3 : 2)?.name;
  if (
    !loop.isOrdered &&
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
  // A typed array's map and filter read the receiver's constructor, which a getter may answer.
  const readSpecies = (current: Path, next: (path: Path) => Formula) =>
    loop.isTyped && speciesGetters.length > 0
      ? readWith(
          expression,
          owner,
          string("constructor"),
          speciesGetters,
          current,
          context,
          frame,
          next,
        )
      : next(current);
  const sequenceName = context.names.getFresh("sequence");
  const sequence = identifier(sequenceName);
  // A set's or a map's forEach reads its entries again at each step, as its iterator does.
  const getEntries = (current: Path) =>
    translateOrderedValues(
      { receiver, method: "forEach" },
      getHeap(current.scope, receiver, context),
      owner,
      context,
    );
  const presentName = context.names.getFresh("present");
  const lengthName = context.names.getFresh("length");
  const isSkippingHoles =
    getters === undefined && loop.isArrayLike && HOLE_SKIPPING_METHODS.has(method);
  const position = context.names.getFresh("position");
  const accumulator = context.names.getFresh("accumulator");
  const startName = context.names.getFresh("start");
  const skippedName = context.names.getFresh("skipped");
  const itemsName = context.names.getFresh("items");
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
  // Inside a try, the loop's result also tells whether the callback, or a getter that it ran, threw
  // what it gives.
  const caught = frame.throwTo === undefined ? [] : [boolean(false)];
  const done = (current: Path, result: Expression) =>
    leaf(tuple([result, ...getValues(current), ...seeded, ...caught]));
  const kept = identifier(accumulator);
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
    if (isSort) {
      return repeat(
        current,
        useJavaScript(
          "SortNext",
          [
            kept,
            useJavaScript(
              "LessThan",
              [useJavaScript("ToNumber", [result], context), number(0)],
              context,
            ),
          ],
          context,
        ),
      );
    }
    if (method === "forEach") return repeat(current, kept);
    // A typed array's map writes each value to the typed array that it made, converting it first.
    if (loop.isTyped && method === "map") {
      return bind(
        current,
        "mapped",
        useJavaScript(
          "ToElementOf",
          [getHeap(current.scope, expression, context), owner, result],
          context,
        ),
        context,
        (bound, mapped) =>
          ifThenElse(
            apply("=", [mapped, mapped]),
            repeat(bound, apply("Append", [kept, mapped])),
            leaf(boolean(false)),
          ),
      );
    }
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
    return repeat(
      current,
      method === "map" || method === "flatMap" ? getMapped(result, false) : result,
    );
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
    ]).get(method) ??
    (isSort
      ? useJavaScript("SortResult", [kept], context)
      : method === "flatMap"
        ? flattenReturned(kept, callback, expression, context)
        : isSpliced
          ? apply("\\o", [
              apply("\\o", [
                apply("SubSeq", [kept, number(1), identifier(startName)]),
                identifier(itemsName),
              ]),
              apply("SubSeq", [
                kept,
                apply("+", [identifier(startName), number(1)]),
                apply("Len", [kept]),
              ]),
            ])
          : isSortedCopy
            ? useJavaScript(
                "SortSequence",
                [kept, ...translateSortArguments(undefined, path.scope, context)],
                context,
              )
            : GATHERING_METHODS.has(method) || isReduce
              ? kept
              : getUndefined(context));
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
    ((current: Path, thrown: Thrown) =>
      leaf(tuple([thrown.value, ...getValues(current), ...seeded, boolean(true)])));
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
    const passed = isSort
      ? [index(element, [number(1)]), index(element, [number(2)])]
      : loop.isOrdered
        ? [index(element, [number(2)]), index(element, [number(1)]), owner]
        : [
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
      tuple(passed),
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
  const isCopy = method === "toReversed" || method === "with" || isSpliced || isSortedCopy;
  const visit =
    callback !== undefined
      ? runCallback
      : isCopy
        ? (current: Path, element: Expression) => repeat(current, apply("Append", [kept, element]))
        : compare;
  const replacedName = context.names.getFresh("replaced");
  // map keeps a hole where the array that it visits lacks an element, which only an array that the
  // heap holds can, unless nothing reads the array.
  const keepHole = () =>
    isHeapMap || ts.isExpressionStatement(expression.parent)
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
    return isSpliced
      ? ifThenElse(
          junction("And", [
            apply(">", [identifier(position), identifier(startName)]),
            apply("<=", [
              identifier(position),
              apply("+", [identifier(startName), identifier(skippedName)]),
            ]),
          ]),
          repeat(inner, kept),
          read,
        )
      : method === "with"
        ? ifThenElse(
            apply("=", [identifier(position), apply("+", [identifier(replacedName), number(1)])]),
            repeat(inner, apply("Append", [kept, identifier(searchName)])),
            read,
          )
        : EVERY_INDEX_METHODS.has(method) || loop.isTyped
          ? read
          : ifThenElse(
              useJavaScript("Has", [getHeap(inner.scope, receiver, context), owner, key], context),
              read,
              method === "map"
                ? keepHole()
                : leaf(
                    call(name, [
                      useJavaScript(
                        "NextElementPosition",
                        [
                          getHeap(inner.scope, receiver, context),
                          owner,
                          identifier(position),
                          identifier(lengthName),
                          boolean(isReversed),
                        ],
                        context,
                      ),
                      kept,
                      ...seeded,
                      ...getValues(inner),
                    ]),
                  ),
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
  const length =
    getters !== undefined
      ? identifier(lengthName)
      : apply("Len", [loop.isOrdered ? getEntries(inner) : sequence]);
  const isInRange = isSort
    ? apply("#", [field(kept, "stage"), string("done")])
    : isReversed
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
              : visit(
                  inner,
                  isSort
                    ? useJavaScript("SortPair", [kept], context)
                    : index(loop.isOrdered ? getEntries(inner) : sequence, [identifier(position)]),
                ),
          done(inner, finished),
        ),
      ),
    ),
    isRecursive: true,
  };
  const from = callback === undefined && !isCopy ? loop.initial : undefined;
  if (isObjectFrom && context.heap === undefined) {
    throw new TlaTypeScriptError("Pass a primitive as the index to search from", from);
  }
  const fromName = context.names.getFresh("from");
  // The value that a search looks for, or that with gives at the index that it replaces.
  const searched =
    callback !== undefined || isSpliced ? undefined : isCopy ? loop.initial : loop.argument;
  const replaced = method === "with" ? loop.argument : undefined;
  if (method === "with" && (replaced === undefined || !isNumberLike(replaced, context))) {
    throw new TlaTypeScriptError("Pass a number as the index that with replaces", expression);
  }
  // A search starts from the position after the index that fromIndex gives, from the end where
  // it's negative: lastIndexOf from no later than the last element, and the others from no earlier
  // than the first.
  const getStart = (index: Expression | undefined) => {
    const relative =
      index === undefined ? undefined : useJavaScript("RelativeIndex", [index, length], context);
    return relative === undefined
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
  };
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
    // sort writes the sorted elements back to the array that a name or a property holds.
    const sorted = skipCasts(receiver);
    const isWrittenBack =
      method === "sort" &&
      (ts.isIdentifier(sorted) ||
        ts.isPropertyAccessExpression(sorted) ||
        ts.isElementAccessExpression(sorted));
    // map's array where the heap holds it, and a typed array's filter's typed array, which it
    // makes through the receiver's constructor after it visits the elements.
    const getMade = (current: Path) =>
      isHeapMap
        ? useJavaScript(
            "Allocate",
            [
              getHeap(current.scope, expression, context),
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
          )
        : loop.isTyped && GATHERING_METHODS.has(method)
          ? useJavaScript(
              "TypedArrayHolding",
              [
                getHeap(current.scope, expression, context),
                owner,
                value,
                translateBuiltInValue("ArrayBuffer.prototype", expression, context),
                translateTypedConstructors(expression, context),
              ],
              context,
            )
          : undefined;
    const finishFrom = (current: Path): Formula => {
      const made = getMade(current);
      return made === undefined || context.heap === undefined
        ? continueWith(
            isWrittenBack ? assign(receiver, current, context, () => value) : current,
            value,
          )
        : bindOnce(
            current,
            heapName,
            made,
            continueWith(
              {
                ...current,
                scope: {
                  ...current.scope,
                  bindings: new Map([
                    ...current.scope.bindings,
                    [context.heap, identifier(heapName)],
                  ]),
                },
              },
              useJavaScript("Allocated", [identifier(heapName)], context),
            ),
          );
    };
    // A typed array's filter makes its typed array through the receiver's constructor once it
    // visited the elements, reading it through a getter that the script may write.
    const finish = (): Formula =>
      loop.isTyped && method === "filter" ? readSpecies(after, finishFrom) : finishFrom(after);
    const completed = isUnseeded
      ? ifThenElse(
          index(identifier(result), [number(changed.length + 2)]),
          finish(),
          throwTypeError(after, expression, context, frame),
        )
      : finish();
    return letIn(
      [operator],
      bindOnce(
        current,
        result,
        call(name, [first, seed, ...(isUnseeded ? [boolean(false)] : []), ...getValues(current)]),
        frame.throwTo === undefined
          ? completed
          : ifThenElse(
              index(identifier(result), [number(changed.length + seeded.length + 2)]),
              frame.throwTo(after, {
                value,
                uncaught: apply("Assert", [boolean(false), string(expression.getText())]),
              }),
              completed,
            ),
      ),
    );
  };
  // A reduce without an initial value starts from the first element it visits, and throws a
  // TypeError for an empty array.
  const getSeeded = (current: Path, start: Expression) =>
    !isReduce
      ? runLoop(
          current,
          start,
          isSort
            ? useJavaScript("SortStart", [sequence], context)
            : isHeapMap
              ? tuple([tuple([]), set([])])
              : GATHERING_METHODS.has(method) || isSortedCopy
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
  // A search of an empty array finds nothing before it converts fromIndex, and otherwise converts an
  // object to a primitive, which throws a TypeError for a symbol or a BigInt, as ToNumber does.
  const getConverted = (current: Path) =>
    from === undefined
      ? getSeeded(current, getStart(undefined))
      : !isObjectFrom
        ? getSeeded(
            current,
            getStart(
              isNumberLike(from, context)
                ? translateExpression(from, path.scope, context)
                : useJavaScript(
                    "ToNumber",
                    [translateExpression(from, path.scope, context)],
                    context,
                  ),
            ),
          )
        : // The search runs once, from the start that each way to it gives.
          translateJoined(
            expression,
            current,
            context,
            (after, start) => getSeeded(after, start ?? getStart(undefined)),
            (next) =>
              ifThenElse(
                apply("=", [length, number(0)]),
                next(current, getStart(undefined)),
                runToPrimitive(
                  expression,
                  identifier(fromName),
                  "number",
                  current,
                  context,
                  frame,
                  (after, primitive) =>
                    ifThenElse(
                      junction("Or", [
                        useJavaScript("IsSymbol", [primitive], context),
                        useJavaScript("IsBigInt", [primitive], context),
                      ]),
                      throwTypeError(after, expression, context, frame),
                      next(after, getStart(useJavaScript("ToNumber", [primitive], context))),
                    ),
                ),
              ),
          );
  // The value that a search looks for and its fromIndex, which evaluate before the method runs.
  const searchedDefinition = define(
    searchName,
    [],
    searched === undefined
      ? getUndefined(context)
      : translateExpression(searched, path.scope, context),
  );
  const fromDefinitions =
    from !== undefined && isObjectFrom
      ? [define(fromName, [], translateExpression(from, path.scope, context))]
      : [];
  if (getters !== undefined) {
    // A typed array's method, where the receiver holds the built-in one, throws a TypeError for a
    // receiver that isn't a typed array or is out of bounds.
    const readLength = (next: (path: Path, value: Expression) => Formula) => {
      const heap = getHeap(path.scope, expression, context);
      return loop.isTyped
        ? ifThenElse(
            useJavaScript(
              "HoldsBuiltIn",
              [
                heap,
                owner,
                string(method),
                string(`%Int8Array.prototype.[[Prototype]]%.${method}`),
              ],
              context,
            ),
            bind(
              path,
              "length",
              useJavaScript("TypedArrayLength", [heap, owner], context),
              context,
              (found, length) =>
                ifThenElse(
                  apply("=", [length, number(-1)]),
                  throwTypeError(found, expression, context, frame),
                  next(found, length),
                ),
            ),
            leaf(
              apply("Assert", [
                boolean(false),
                string(
                  `tla-ts can't call %Int8Array.prototype.[[Prototype]]%.${method} where a script replaced it`,
                ),
              ]),
            ),
          )
        : readWith(expression, owner, string("length"), lengthGetters, path, context, frame, next);
    };
    // The length, which the method reads once, running its getter, after which map and filter
    // check the array's constructor, as ArraySpeciesCreate reads it.
    return letIn(
      [
        define(ownerName, [], translateExpression(receiver, path.scope, context)),
        searchedDefinition,
        ...fromDefinitions,
        ...(isSpliced
          ? [
              define(
                itemsName,
                [],
                tuple(
                  (getLoopTarget(expression, context)?.callbackArguments.slice(2) ?? []).map(
                    (item) => translateExpression(item, path.scope, context),
                  ),
                ),
              ),
            ]
          : []),
      ],
      readLength((found, held) => {
        const visitWith = (after: Path, value: Expression) => {
          // with throws a RangeError where the index it replaces isn't below the length.
          const seeded = (current: Path) =>
            letIn(
              [
                define(
                  lengthName,
                  [],
                  // A length past 2^31 holds only holes past the greatest index that the object
                  // or its prototypes hold, which these methods skip and don't give.
                  BOUNDED_METHODS.has(method)
                    ? useJavaScript(
                        "HeldLength",
                        [getHeap(current.scope, expression, context), owner, value],
                        context,
                      )
                    : useJavaScript("ToLength", [value], context),
                ),
                ...(isSpliced
                  ? [
                      define(
                        startName,
                        [],
                        translateClampedIndex(
                          loop.argument,
                          number(0),
                          length,
                          path.scope,
                          context,
                        ),
                      ),
                      define(
                        skippedName,
                        [],
                        translateSkipped(
                          loop.argument,
                          loop.initial,
                          apply("-", [length, identifier(startName)]),
                          path.scope,
                          context,
                        ),
                      ),
                    ]
                  : []),
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
                ? getConverted(current)
                : ifThenElse(
                    junction("And", [
                      apply(">=", [identifier(replacedName), number(0)]),
                      apply("<", [identifier(replacedName), length]),
                    ]),
                    getConverted(current),
                    throwError("RangeError", current, expression, context, frame),
                  ),
            );
          // ArraySpeciesCreate reads an array's constructor, running its getter, where tla-ts
          // follows only Array.
          // A typed array's map makes its typed array before it visits the elements.
          const getSpecies = (current: Path) =>
            useJavaScript(
              "TypedArraySpecies",
              [
                getHeap(current.scope, receiver, context),
                owner,
                translateTypedConstructors(expression, context),
              ],
              context,
            );
          if (loop.isTyped) {
            return method === "map"
              ? readSpecies(after, (read) =>
                  ifThenElse(
                    apply("=", [getSpecies(read), getSpecies(read)]),
                    seeded(read),
                    leaf(boolean(false)),
                  ),
                )
              : seeded(after);
          }
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
        };
        // ToLength converts a length that's an object to a primitive first, and throws a TypeError
        // where ToNumber does, for a symbol or a BigInt.
        return isLengthConverted
          ? runToPrimitive(expression, held, "number", found, context, frame, (after, primitive) =>
              ifThenElse(
                junction("Or", [
                  useJavaScript("IsSymbol", [primitive], context),
                  useJavaScript("IsBigInt", [primitive], context),
                ]),
                throwTypeError(after, expression, context, frame),
                visitWith(after, primitive),
              ),
            )
          : visitWith(found, held);
      }),
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
          : loop.isOrdered
            ? translateNode(receiver, path.scope, context, false)
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
          : loop.isOrdered
            ? getEntries(path)
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
      ...(isObjectFrom ? [searchedDefinition, ...fromDefinitions] : []),
    ],
    getConverted(path),
  );
};

// The constructor that a new of a heap class runs, where a statement runs it.
const getConstructorRun = (node: ts.Expression, context: Context) => {
  const created = getNewClass(node, context);
  if (created === undefined || !isStatementNew(node)) return undefined;
  return (
    getRunConstructor(created, context) ??
    (getSettableSupers(created, context).length > 0 ? created : undefined)
  );
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
  // A constructor whose this stays uninitialized until a later super(...), or for good where its
  // class extends null, ends where this is still uninitialized only by returning an object.
  const deferred =
    ts.isConstructorDeclaration(constructor) &&
    constructor.body !== undefined &&
    (isNullBase || getDeferredSuperCalls(constructor, context) !== undefined)
      ? constructor
      : undefined;
  // An arrow that reads this outlives a constructor that ends without one, where it would throw.
  const isEscaping =
    deferred?.body !== undefined &&
    findNodes(deferred.body, ts.isArrowFunction).some(
      (arrow) =>
        isMade(arrow, context) &&
        findNodes(
          arrow,
          (inner): inner is ts.Node =>
            inner.kind === ts.SyntaxKind.ThisKeyword && getThisOwner(inner) === deferred,
        ).length > 0,
    );
  const isUnbound = (after: Path) =>
    isNullBase || (deferred !== undefined && (after.unboundThis?.has(deferred) ?? false));
  const leave = (after: Path) => ({ ...after, unboundThis: path.unboundThis });
  const stopEscaping = () =>
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't run an arrow that reads this once its constructor ends without one"),
      ]),
    );
  const giveInstance = (after: Path) =>
    !isUnbound(after)
      ? continueWith(leave(after), instance)
      : isEscaping
        ? stopEscaping()
        : throwError("ReferenceError", leave(after), expression, context, frame);
  const bodyFrame: Frame =
    deferred === undefined
      ? frame
      : {
          ...frame,
          throwTo: (inner, thrown) =>
            isEscaping && isUnbound(inner)
              ? stopEscaping()
              : frame.throwTo === undefined
                ? leaf(thrown.uncaught)
                : frame.throwTo(leave(inner), thrown),
        };
  const created = getNewClass(expression, context);
  const fields = created === undefined ? [] : getRunFields(created, context);
  const run = () =>
    translateElements(fields, instance, path, context, frame, (defined) =>
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
            deferred === undefined
              ? defined
              : { ...defined, unboundThis: new Set([...(defined.unboundThis ?? []), deferred]) },
            context,
            bodyFrame,
            (after, value) => {
              if (value === undefined || (isEscaping && isUnbound(after))) {
                return giveInstance(after);
              }
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
                    continueWith(leave(after), returned),
                    isDerived
                      ? throwTypeError(leave(after), expression, context, frame)
                      : continueWith(after, instance),
                  ),
                ),
              );
            },
          ),
    );
  // A derived class without a constructor calls super with its arguments, as each such class that
  // it extends does.
  return guardSupers(getSettableSupers(created, context), expression, path, context, frame, run);
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
    (getSuperCall(constructor) !== expression &&
      !(getDeferredSuperCalls(constructor, context) ?? []).includes(expression))
  ) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  // The base's constructor runs past the bases without one, each of which calls super too.
  const run = () =>
    guardSupers(
      getSettableSupers(getBaseClass(constructor.parent, context), context),
      expression,
      path,
      context,
      frame,
      () => runSuperCall(expression, constructor, receiver, path, context, frame, continueWith),
    );
  return guardBase(constructor.parent, expression, path, context, frame, run);
};

// Checks the prototypes of classes in order before what runs after them.
const guardSupers = (
  classes: ts.ClassLikeDeclaration[],
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  run: () => Formula,
) =>
  classes.reduceRight<() => Formula>(
    (rest, node) => () => guardBase(node, expression, path, context, frame, rest),
    run,
  )();

// A class's constructor calls the one that the class's prototype is, which a script can change.
// tla-ts runs the base's where the prototype is the base, and one that can't construct throws a
// TypeError.
const guardBase = (
  node: ts.ClassLikeDeclaration,
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  run: () => Formula,
): Formula => {
  const base = getExtended(node);
  if (
    base === undefined ||
    !ts.isIdentifier(base) ||
    node.name === undefined ||
    !isHeapClass(node, context)
  ) {
    return run();
  }
  const heap = getHeap(path.scope, expression, context);
  const prototype = field(
    useJavaScript("Lookup", [heap, translateExpression(node.name, path.scope, context)], context),
    "prototype",
  );
  return ifThenElse(
    useJavaScript(
      "SameValue",
      [prototype, translateExpression(base, path.scope, context)],
      context,
    ),
    run(),
    ifThenElse(
      useJavaScript("IsConstructor", [heap, prototype], context),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call the constructor that a class's prototype changed to"),
        ]),
      ),
      throwTypeError(path, expression, context, frame),
    ),
  );
};

// A super call to the constructor that the class extends.
const runSuperCall = (
  expression: ts.CallExpression,
  constructor: ts.ConstructorDeclaration,
  receiver: Receiver,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
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
  const builtInBase = getBuiltInBase(constructor.parent, context);
  const heapSymbol = context.heap;
  // A super(...) initializes this, which one that runs after it can't, once the base's constructor
  // makes another object. tla-ts follows that only where the base makes it without running code.
  const isDeferred = getDeferredSuperCalls(constructor, context) !== undefined;
  if (isDeferred && !(path.unboundThis?.has(constructor) ?? false)) {
    return called === undefined && builtInBase === undefined
      ? throwError("ReferenceError", path, expression, context, frame)
      : leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't run a base's constructor for a second super(...)"),
          ]),
        );
  }
  const bind = (after: Path) =>
    isDeferred
      ? {
          ...after,
          unboundThis: new Set(
            [...(after.unboundThis ?? [])].filter((running) => running !== constructor),
          ),
        }
      : after;
  // The Error constructor gives the error that the new made its message and cause.
  if (
    called === undefined &&
    builtInBase !== undefined &&
    isNativeErrorName(builtInBase) &&
    heapSymbol !== undefined
  ) {
    const heap = getHeap(path.scope, expression, context);
    const name = context.names.getFresh("heap");
    return bindOnce(
      path,
      name,
      useJavaScript(
        "Update",
        [
          heap,
          receiver.value,
          translateErrorFields(
            useJavaScript("Lookup", [heap, receiver.value], context),
            expression.arguments,
            heap,
            path.scope,
            context,
          ),
        ],
        context,
      ),
      continueWith(
        bind({
          ...path,
          scope: {
            ...path.scope,
            bindings: new Map([...path.scope.bindings, [heapSymbol, identifier(name)]]),
          },
        }),
        receiver.value,
      ),
    );
  }
  if (called === undefined || called.body === undefined) {
    if (expression.arguments.length > 0) {
      throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
    }
    return continueWith(bind(path), receiver.value);
  }
  return inlineBody(
    expression,
    called,
    expression.arguments,
    { value: receiver.value, method: called, newTarget: receiver.newTarget },
    path,
    context,
    frame,
    (after) =>
      translateElements(
        getFieldsAfterSuper(constructor.parent, context),
        receiver.value,
        { ...bind(after), scope: { ...after.scope, receiver } },
        context,
        frame,
        (defined) => continueWith(defined, receiver.value),
      ),
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
                    isComputedField(element)
                      ? translateComputedKey(
                          element,
                          isStatic(element)
                            ? ref
                            : translateClassRef(element.parent, inner.scope, context),
                          heap,
                          context,
                        )
                      : translateMemberKey(element.name, inner.scope, context),
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

// A yield* of an array, which yields each element. In an async generator, each element takes two
// jobs, as the async-from-sync iterator awaits it and the yield* then awaits the iterator's result,
// and the last next takes two more. An array that a variable holds yields up to
// DELEGATION_LIMIT elements.
const translateDelegatedYield = (
  node: ts.YieldExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
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
    yieldTo !== undefined &&
    awaitTo === undefined &&
    iterated !== undefined &&
    isGeneratorType(iterated, context)
  ) {
    return delegateToGenerator(node, iterated, yieldTo, path, context, frame, continueWith);
  }
  if (
    yieldTo !== undefined &&
    awaitTo !== undefined &&
    iterated !== undefined &&
    isSyncGeneratorType(iterated, context)
  ) {
    return delegateToSyncGenerator(
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
    yieldTo !== undefined &&
    awaitTo !== undefined &&
    iterated !== undefined &&
    isGeneratorType(iterated, context)
  ) {
    return delegateToAsyncGenerator(
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
  const elements =
    iterated !== undefined && ts.isArrayLiteralExpression(iterated) ? iterated.elements : undefined;
  if (
    yieldTo === undefined ||
    iterated === undefined ||
    (elements === undefined
      ? !ts.isStringLiteralLike(iterated) &&
        (getKind(iterated, context) !== "sequence" || hasCall(iterated, context))
      : elements.some((element) => ts.isSpreadElement(element)))
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
  const finish = (current: Path) => tick(current, (resumed) => tick(resumed, continueWith));
  // values holds the elements of a sequence that the path knows, such as one that a literal gave.
  const step = (current: Path, position: number, values?: readonly Expression[]): Formula => {
    const element = elements?.[position];
    const value = values?.[position] ?? index(identifier(sequence), [number(position + 1)]);
    const next = (after: Path) => delegate(after, position + 1, values);
    const mode = { isDelegated: true, isGuarded: true };
    if (awaitTo === undefined) return yieldTo(current, value, next, throwWith, mode);
    const awaitWith = (awaited: Expression) =>
      awaitTo(
        current,
        awaited,
        element === undefined || ts.isOmittedExpression(element) ? undefined : element,
        (fulfilled, settled) =>
          tick(fulfilled, (resumed) => yieldTo(resumed, settled, next, throwWith, mode)),
        (rejected, reason) => tick(rejected, (resumed) => throwWith(resumed, reason)),
      );
    // An element that no expression types may be any promise that the path follows.
    return element === undefined
      ? dispatchFollowed(
          current,
          node,
          value,
          context,
          (_name, ref) => awaitWith(ref),
          awaitWith(value),
        )
      : awaitWith(value);
  };
  const delegate = (current: Path, position: number, values?: readonly Expression[]): Formula => {
    const length = elements?.length ?? values?.length;
    if (length !== undefined) {
      return position === length ? finish(current) : step(current, position, values);
    }
    return ifThenElse(
      apply("=", [apply("Len", [identifier(sequence)]), number(position)]),
      finish(current),
      position === DELEGATION_LIMIT
        ? leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
            ]),
          )
        : step(current, position),
    );
  };
  // The array makes the generator objects that its elements call for, in order, before yield*
  // iterates it.
  const makeGenerators = (current: Path, position: number): Formula => {
    if (elements === undefined || position === elements.length) {
      return allocate(iterated, current, context, (inner) => {
        // A string yields its code points.
        const translated = ts.isStringLiteralLike(iterated)
          ? tuple([...iterated.text].map((character) => translateString(character, context)))
          : translateExpression(iterated, inner.scope, context);
        return letIn(
          [define(sequence, [], translated)],
          delegate(inner, 0, translated.kind === "Tuple" ? translated.elements : undefined),
        );
      });
    }
    const call = getCast(elements[position]);
    const created =
      ts.isCallExpression(call) && !current.scope.results.has(call)
        ? getCreatedGenerator(call, current, context)
        : undefined;
    return created === undefined || !ts.isCallExpression(call)
      ? makeGenerators(current, position + 1)
      : translateGeneratorCall(call, created, current, context, frame, (after, ref) =>
          makeGenerators(
            {
              ...after,
              scope: {
                ...after.scope,
                results: new Map([...after.scope.results, [call, ref ?? getUndefined(context)]]),
              },
            },
            position + 1,
          ),
        );
  };
  return makeGenerators(path, 0);
};

const DELEGATION_LIMIT = 3;

// A next's value that a yield* would pass on to a generator or an async iterator, which tla-ts
// doesn't follow.
const stopSending = () =>
  leaf(apply("Assert", [boolean(false), string("tla-ts can't send a value through this yield*")]));

// A generator's yield* over another generator, which resumes it with next and passes on what it
// yields until it returns. A next, a return, or a throw while it delegates resumes the generator
// with the same method and value. Where the generator completes, a return returns its value, and a
// next or a throw continues after the yield*.
const delegateToGenerator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const delegate = (
    current: Path,
    generator: Expression,
    method: string,
    value: Expression | undefined,
    count: number,
  ): Formula =>
    count > DELEGATION_LIMIT
      ? leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
          ]),
        )
      : resumeGenerator(
          node,
          generator,
          method,
          value && { value },
          current,
          context,
          frame,
          (stepped, result, isDone, isResult) =>
            isDone
              ? method === "return"
                ? frame.exit(stepped, result)
                : continueWith(stepped, result)
              : yieldTo(
                  stepped,
                  result,
                  (resumed, sent) => delegate(resumed, generator, "next", sent, count + 1),
                  throwWith,
                  {
                    isDelegated: true,
                    isGuarded: true,
                    isResult,
                    abortRest: (aborted, abrupt, abruptValue) =>
                      delegate(aborted, generator, abrupt, abruptValue, count + 1),
                  },
                ),
        );
  return ts.isCallExpression(iterated)
    ? translateCallStatement(iterated, path, context, frame, (after, generator) =>
        delegate(after, generator ?? getUndefined(context), "next", undefined, 0),
      )
    : delegate(path, translateExpression(iterated, path.scope, context), "next", undefined, 0);
};

// An async generator's yield* over a generator, which the async-from-sync iterator resumes with the
// method and the value that resumed the async generator. It awaits each value that the generator
// yields, and the value it returns, a job before the yield* awaits the iterator's result, as for
// an array, and what the generator throws rejects that result. A return that completes the
// generator awaits its value again. A value that rejects would close the generator, which tla-ts
// doesn't follow.
const delegateToSyncGenerator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  awaitTo: NonNullable<Frame["awaitTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const tick = (current: Path, next: (path: Path) => Formula) =>
    awaitTo(current, getUndefined(context), undefined, next, next);
  const rejected = () =>
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't close a generator that yield* awaits a rejected value of"),
      ]),
    );
  // The iterator's result rejects with what the generator throws, which the yield* awaits.
  const stepFrame: Frame = {
    ...frame,
    throwTo: throwTo && ((current, thrown) => tick(current, (after) => throwTo(after, thrown))),
  };
  const delegate = (
    current: Path,
    generator: Expression,
    method: string,
    value: Expression | undefined,
    count: number,
  ): Formula =>
    count > DELEGATION_LIMIT
      ? leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
          ]),
        )
      : resumeGenerator(
          node,
          generator,
          method,
          value && { value },
          current,
          context,
          stepFrame,
          (stepped, result, isDone, isResult) => {
            if (isResult) {
              throw new TlaTypeScriptError(
                "tla-ts can't await what a generator passes on through its own yield*",
                node,
              );
            }
            return awaitTo(
              stepped,
              result ?? getUndefined(context),
              undefined,
              (fulfilled, settled) =>
                tick(fulfilled, (resumed) =>
                  isDone
                    ? method === "return"
                      ? awaitTo(resumed, settled, undefined, frame.exit, throwWith)
                      : continueWith(resumed, settled)
                    : yieldTo(
                        resumed,
                        settled,
                        (after, sent) => delegate(after, generator, "next", sent, count + 1),
                        throwWith,
                        {
                          isDelegated: true,
                          isGuarded: true,
                          abortRest: (aborted, abrupt, abruptValue) =>
                            delegate(aborted, generator, abrupt, abruptValue, count + 1),
                        },
                      ),
                ),
              rejected,
            );
          },
        );
  return ts.isCallExpression(iterated)
    ? translateCallStatement(iterated, path, context, frame, (after, generator) =>
        delegate(after, generator ?? getUndefined(context), "next", undefined, 0),
      )
    : delegate(path, translateExpression(iterated, path.scope, context), "next", undefined, 0);
};

// An async generator's yield* over another async generator, which awaits the promise of each next
// and yields its value without awaiting it again, until one is done. A return or a throw while it
// delegates would call the generator's return or throw, which tla-ts doesn't follow.
const delegateToAsyncGenerator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  awaitTo: NonNullable<Frame["awaitTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const delegate = (current: Path, generator: Expression, count: number): Formula =>
    count > DELEGATION_LIMIT
      ? leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
          ]),
        )
      : resumeGenerator(
          node,
          generator,
          "next",
          undefined,
          current,
          context,
          frame,
          () => {
            throw new TlaTypeScriptError("tla-ts can't follow this async generator", node);
          },
          (requested, promise) =>
            awaitTo(
              requested,
              promise,
              undefined,
              (fulfilled) => {
                const iteration = getIteration(fulfilled, node, promise);
                return iteration.isDone
                  ? continueWith(fulfilled, iteration.value)
                  : yieldTo(
                      fulfilled,
                      iteration.value,
                      (after, sent) =>
                        sent === undefined ? delegate(after, generator, count + 1) : stopSending(),
                      throwWith,
                      { isDelegated: true, isGuarded: true },
                    );
              },
              throwWith,
            ),
        );
  return ts.isCallExpression(iterated)
    ? translateCallStatement(iterated, path, context, frame, (after, generator) =>
        delegate(after, generator ?? getUndefined(context), 0),
      )
    : delegate(path, translateExpression(iterated, path.scope, context), 0);
};

// A generator's yield* over an object's iterator, which passes on each of the iterator's results
// until one is done. A return or a throw while it delegates calls the iterator's return or throw,
// and the generator returns or throws where the iterator lacks it.
const delegateToIterator = (
  node: ts.YieldExpression,
  iterated: ts.Expression,
  yieldTo: NonNullable<Frame["yieldTo"]>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwTo = frame.throwTo;
  const throwWith = (current: Path, value: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value, uncaught });
  const failWith = (failed: Path) => throwTypeError(failed, node, context, frame);
  // Calls the iterator's next, or the return or throw that resumed the generator, and yields the
  // result until it's done.
  const delegate = (iterator: Expression, next: Expression) => {
    const step = (
      current: Path,
      key: string,
      method: Expression,
      values: Expression[],
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
            key,
            method,
            values,
            current,
            context,
            frame,
            failWith,
            (done, result) =>
              readValue(node, result, done, context, frame, (read, value) =>
                key === "return"
                  ? frame.exit(read, value)
                  : ifThenElse(
                      apply("=", [value, value]),
                      continueWith(read, value),
                      leaf(boolean(false)),
                    ),
              ),
            (stepped, result) =>
              yieldTo(
                stepped,
                result,
                (resumed, sent) =>
                  step(resumed, "next", next, [sent ?? getUndefined(context)], count + 1),
                throwWith,
                {
                  isDelegated: true,
                  isGuarded: true,
                  isResult: true,
                  abortRest: (aborted, abrupt, value) =>
                    read(node, iterator, abrupt, aborted, context, frame, (found, called) =>
                      ifThenElse(
                        isNullish(called, context),
                        abrupt === "return"
                          ? frame.exit(found, value)
                          : closeIterator(
                              node,
                              iterator,
                              found,
                              context,
                              frame,
                              failWith,
                              failWith,
                            ),
                        step(found, abrupt, called, [value ?? getUndefined(context)], count + 1),
                      ),
                    ),
                },
              ),
          );
    return step;
  };
  return allocate(iterated, path, context, (inner) =>
    openIterator(
      node,
      translateExpression(iterated, inner.scope, context),
      inner,
      context,
      frame,
      failWith,
      (opened, iterator, next) =>
        delegate(iterator, next)(opened, "next", next, [getUndefined(context)], 0),
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
  continueWith: (path: Path, value?: Expression) => Formula,
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
          [],
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
                            continueWith(taken, value),
                            leaf(boolean(false)),
                          ),
                          yieldTo(
                            taken,
                            value,
                            (resumed, sent) =>
                              sent === undefined
                                ? delegate(resumed, iterator, next, count + 1)
                                : stopSending(),
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
  // An object without Symbol.asyncIterator iterates through an async-from-sync iterator, whose
  // next, return, or throw a yield* calls with the value that resumes it. A return awaits that
  // value first, and calls the throw where it rejects.
  const delegateFromSync =
    (iterator: Expression, next: Expression) =>
    (
      current: Path,
      key: "next" | "return" | "throw",
      value: Expression,
      count: number,
    ): Formula => {
      const step = delegateFromSync(iterator, next);
      return count > DELEGATION_LIMIT
        ? leaf(
            apply("Assert", [
              boolean(false),
              string(`tla-ts can't follow more than ${DELEGATION_LIMIT} values of a yield*`),
            ]),
          )
        : stepFromSync(
            node,
            iterator,
            next,
            key,
            value,
            mayGivePromises(iterated, context),
            current,
            context,
            frame,
            awaitTo,
            throwWith,
            (stepped, result, isDone) => {
              if (isDone) {
                return key === "return"
                  ? frame.exit(stepped, result)
                  : continueWith(stepped, result);
              }
              return yieldTo(
                stepped,
                result,
                (resumed, sent) => step(resumed, "next", sent ?? getUndefined(context), count + 1),
                throwWith,
                {
                  isDelegated: true,
                  isGuarded: true,
                  abortRest: (aborted, abrupt, abruptValue) =>
                    abrupt === "return"
                      ? awaitTo(
                          aborted,
                          abruptValue ?? getUndefined(context),
                          undefined,
                          (fulfilled, settled) => step(fulfilled, "return", settled, count + 1),
                          (rejected, reason) => step(rejected, "throw", reason, count + 1),
                        )
                      : step(aborted, "throw", abruptValue ?? getUndefined(context), count + 1),
                },
              );
            },
          );
    };
  return allocate(iterated, path, context, (inner) =>
    openAsyncIterator(
      node,
      translateExpression(iterated, inner.scope, context),
      inner,
      context,
      frame,
      failWith,
      (opened, iterator, next, isSync) =>
        isSync
          ? delegateFromSync(iterator, next)(opened, "next", getUndefined(context), 0)
          : delegate(opened, iterator, next, 0),
    ),
  );
};

// A call of a collection's method through call, such as Set.prototype.add.call({}), on a receiver
// that isn't that kind of collection, which the method rejects with a TypeError.
// A call of a library method that the engine lacks, directly or through call or apply, whose
// receiver and arguments run nothing that a script sees, which throws a TypeError where the method
// is undefined. The
// built-in object that should hold it holds it for its instances too, as tla-ts stops where a
// script gives a collection its own method.
const getMissingCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const method =
    ts.isPropertyAccessExpression(callee) &&
    ["call", "apply"].includes(callee.name.text) &&
    ts.isPropertyAccessExpression(callee.expression) &&
    getMissingMethod(callee.expression, context) !== undefined
      ? callee.expression
      : callee;
  const owner = getMissingMethod(method, context);
  return context.heap !== undefined &&
    owner !== undefined &&
    ts.isPropertyAccessExpression(method) &&
    (ts.isIdentifier(method.expression) || isBuiltInObject(method.expression, context)) &&
    node.arguments.every(
      (argument) =>
        isInertValue(argument) ||
        isBuiltInObject(argument, context) ||
        (ts.isNewExpression(argument) &&
          (argument.arguments ?? []).length === 0 &&
          COLLECTIONS.some(
            (collection) => collection === getBuiltIn(argument.expression, context),
          )) ||
        (ts.isCallExpression(argument) &&
          getBuiltIn(argument.expression, context) === "Symbol" &&
          argument.arguments.every(ts.isStringLiteral)),
    )
    ? { method, owner }
    : undefined;
};

const getMisreceivedCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const receiver = node.arguments.at(0);
  // A const may hold the method, as const union = Set.prototype.union does.
  const held =
    ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)
      ? getSymbol(callee.expression, context.checker)?.valueDeclaration
      : undefined;
  const method =
    held !== undefined &&
    ts.isVariableDeclaration(held) &&
    (held.parent.flags & ts.NodeFlags.Const) !== 0 &&
    held.initializer !== undefined
      ? skipCasts(held.initializer)
      : ts.isPropertyAccessExpression(callee)
        ? callee.expression
        : undefined;
  if (
    !ts.isPropertyAccessExpression(callee) ||
    callee.name.text !== "call" ||
    method === undefined ||
    !ts.isPropertyAccessExpression(method) ||
    receiver === undefined ||
    !node.arguments.slice(1).every(isInertValue)
  ) {
    return undefined;
  }
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
  // A method that the engine lacks, which the script reads as undefined.
  return collection !== undefined &&
    isOther &&
    BUILT_INS[`${collection}.prototype.${method.name.text}`] !== undefined
    ? { collection, method: method.name.text }
    : undefined;
};

// The Number.prototype methods whose digits argument throws a RangeError outside its range.
const RANGED_NUMBER_METHODS = new Set(["toFixed", "toExponential", "toPrecision"]);

// A call of toFixed, toExponential, or toPrecision on a number throws the RangeError of a digits
// argument outside its range, and otherwise goes on as read.
const throwRangeError = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  read: Formula,
) => {
  const call = skipCasts(expression);
  if (
    !ts.isCallExpression(call) ||
    !ts.isPropertyAccessExpression(call.expression) ||
    !RANGED_NUMBER_METHODS.has(call.expression.name.text) ||
    !isNumberLike(call.expression.expression, context) ||
    call.arguments.length > 1 ||
    !call.arguments.every((argument) => isNumberLike(argument, context))
  ) {
    return read;
  }
  const argument = call.arguments.at(0);
  return ifThenElse(
    useJavaScript(
      "NumberMethodThrows",
      [
        string(call.expression.name.text),
        translateExpression(call.expression.expression, path.scope, context),
        argument === undefined
          ? getUndefined(context)
          : translateExpression(argument, path.scope, context),
      ],
      context,
    ),
    throwError("RangeError", path, expression, context, frame),
    read,
  );
};

// A call of String.raw, rather than a tag, which reads the raw strings of any object.
const isRawCall = (node: ts.CallExpression, context: Context) =>
  context.heap !== undefined &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "raw" &&
  getBuiltIn(node.expression.expression, context) === "String" &&
  node.arguments.length > 0 &&
  !node.arguments.some(ts.isSpreadElement);

// A read of an object's property throws a TypeError where it runs %ThrowTypeError%, or a buffer's or
// a view's getter on another kind of object, and otherwise goes on as read.
const throwReadError = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  read: Formula,
) => {
  const accessed = skipCasts(expression);
  return context.heap !== undefined &&
    (ts.isElementAccessExpression(accessed) ||
      (ts.isPropertyAccessExpression(accessed) && !ts.isPrivateIdentifier(accessed.name))) &&
    accessed.expression.kind !== ts.SyntaxKind.SuperKeyword &&
    (isBuiltInObject(accessed.expression, context) ||
      getKind(accessed.expression, context) === "object" ||
      context.checker.getTypeAtLocation(accessed.expression).getCallSignatures().length > 0)
    ? ifThenElse(
        apply("=", [
          useJavaScript(
            "ReadError",
            [
              getHeap(path.scope, accessed, context),
              translateObjectValue(accessed.expression, path.scope, context),
              ts.isPropertyAccessExpression(accessed)
                ? string(accessed.name.text)
                : translatePropertyKey(accessed.argumentExpression, path.scope, context),
            ],
            context,
          ),
          string("TypeError"),
        ]),
        throwTypeError(path, expression, context, frame),
        read,
      )
    : read;
};

// Throws the TypeError of a read of a function's caller or arguments, which runs %ThrowTypeError%
// where the function is strict, though nothing reads the value.
const throwCallerError = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  read: Formula,
) => {
  const accessed = skipCasts(expression);
  return ts.isPropertyAccessExpression(accessed) &&
    ["caller", "arguments"].includes(accessed.name.text) &&
    context.checker.getTypeAtLocation(accessed.expression).getCallSignatures().length > 0
    ? throwReadError(expression, path, context, frame, read)
    : read;
};

// The constructors that, without arguments, only make an object that nothing but the new sees.
const EMPTY_CONSTRUCTORS = new Set([
  "Array",
  "Object",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "String",
  "Boolean",
  "Number",
  "Date",
  "RegExp",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
  "SuppressedError",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DisposableStack",
  "AsyncDisposableStack",
  ...TYPED_ARRAYS.keys(),
]);

// The constructors that throw a TypeError where a new passes them no arguments.
const ARGUMENT_CONSTRUCTORS = new Set([
  "AggregateError",
  "DataView",
  "FinalizationRegistry",
  "Promise",
  "Proxy",
  "WeakRef",
]);

// The constructors whose new throws a TypeError whatever it passes them.
const UNCONSTRUCTED = new Set(["BigInt", "Iterator", "Symbol"]);

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

const getSubstitutions = (node: ts.TaggedTemplateExpression) =>
  ts.isTemplateExpression(node.template)
    ? node.template.templateSpans.map((span) => span.expression)
    : [];

// A tagged template's call of its tag, once the statement ran its substitutions' calls and
// increments, with the site's template object and the substitutions' values, as the tag's this the
// object of a method that a property names.
const translateTaggedTemplate = (
  node: ts.TaggedTemplateExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const tag = skipCasts(node.tag);
  const called = getCalledMethod(tag, context);
  const callee = called?.method ?? getCallback(tag, path, context);
  const substitutions = getSubstitutions(node);
  if (
    !context.templateSites.includes(node) ||
    callee?.body === undefined ||
    isAnyGenerator(callee) ||
    isAsyncFunction(callee) ||
    isClosure(callee, context) ||
    path.scope.results.has(node.tag) ||
    !substitutions.every(
      (substitution) =>
        isSettled(substitution, path.scope.results) ||
        isReadName(substitution, context) ||
        substitution.kind === ts.SyntaxKind.ThisKeyword,
    )
  ) {
    throw new TlaTypeScriptError("tla-ts can't run this tagged template's call", node);
  }
  const receiver =
    called !== undefined
      ? getReceiver(path.scope, context, called)
      : ts.isArrowFunction(callee)
        ? path.scope.receiver
        : { value: getUndefined(context), method: callee };
  const call = translateJoined(node, path, context, continueWith, (next) =>
    inlineValues(
      callee,
      [
        getTemplateRef(node, context),
        ...substitutions.map((substitution) =>
          translateExpression(substitution, path.scope, context),
        ),
      ],
      receiver,
      path,
      context,
      frame,
      // What the call evaluated or made of the tag's own code belongs to this call, not a later one.
      (after) => {
        const isOutside = (entry: [ts.Node, Expression]) =>
          ts.findAncestor(entry[0], (ancestor) => ancestor === callee) === undefined;
        return next({
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results].filter(isOutside)),
            allocated: new Map([...after.scope.allocated].filter(isOutside)),
          },
        });
      },
    ),
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
  // A guard of a global that nothing declares does nothing, and skips what it guards.
  if (getStaticTruth(expression, context) !== undefined) return continueWith(path);
  // A comma runs its operands in order, as a for loop's incrementor may.
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.CommaToken
  ) {
    return translateExpressionStatement(expression.left, path, context, frame, (after) =>
      translateExpressionStatement(expression.right, after, context, frame, continueWith),
    );
  }
  if (ts.isTaggedTemplateExpression(expression) && !isRawTemplate(expression, context)) {
    return translateTaggedTemplate(expression, path, context, frame, continueWith);
  }
  // A name that no declaration binds throws a ReferenceError where a statement reads it.
  if (isUnresolved(expression, context)) {
    return throwError("ReferenceError", path, expression, context, frame);
  }
  const immutable = getImmutableWrite(expression, context);
  if (immutable !== undefined) {
    return translateImmutableWrite(immutable, path, context, frame, continueWith);
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
    const assigned = shareBinding(removed.path, removed.symbol, "changed", context, (shared) =>
      continueWith(assign(expression.left, shared, context, () => removed.value)),
    );
    return removed.missing === undefined
      ? assigned
      : ifThenElse(
          removed.missing,
          throwTypeError(path, expression.right, context, frame),
          assigned,
        );
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
    const name = `Object.${primitiveCall.method}`;
    context.prelude.add("Null");
    const done = primitiveCall.isCoercing
      ? ifThenElse(
          apply("\\in", [value, set([getUndefined(context), identifier("Null")])]),
          throwTypeError(path, expression, context, frame),
          continueWith(path),
        )
      : continueWith(path);
    const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));
    // TypeScript can't see a callback assign a variable without a type an object.
    return context.heap === undefined
      ? done
      : ifThenElse(
          useJavaScript("IsRef", [value], context),
          stop(`tla-ts can't tell what ${name} reads`),
          primitiveCall.method.startsWith("prototype.")
            ? ifThenElse(
                useJavaScript(
                  "HoldsBuiltIn",
                  [
                    getHeap(path.scope, expression, context),
                    translateBuiltInValue("Object.prototype", expression, context),
                    string(primitiveCall.method.slice("prototype.".length)),
                    string(name),
                  ],
                  context,
                ),
                done,
                stop(`tla-ts can't call an ${name} that a script replaced`),
              )
            : done,
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
      value === undefined
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
    return translateYield(expression, path, context, frame, (after) => continueWith(after));
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
    (isGeneratorType(expression.right, context) || isBuiltInIteratorType(expression.right, context))
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
  // An array pattern destructures an object that a script declares through its iterator, or throws
  // where it can't iterate a value that may be a primitive, and a pattern whose default yields runs
  // it as a statement.
  const assignedType = ts.isBinaryExpression(expression)
    ? context.checker.getTypeAtLocation(expression.right)
    : undefined;
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ((ts.isArrayLiteralExpression(expression.left) &&
      (isIteratedPattern(expression.left, context) ||
        isIterablePattern(expression.left, context) ||
        (assignedType !== undefined &&
          !(assignedType.flags & ts.TypeFlags.StringLike) &&
          (isMaybeNullish(assignedType) ||
            isMaybePrimitive(context.checker.getNonNullableType(assignedType)))))) ||
      ((ts.isArrayLiteralExpression(expression.left) ||
        ts.isObjectLiteralExpression(expression.left)) &&
        hasYield(expression.left)))
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
  // Deleting a property that can't change throws a TypeError in strict mode, and outside it
  // changes nothing.
  if (ts.isDeleteExpression(expression)) {
    const deleted = getHeapWrite(expression.expression, path, context);
    if (deleted === undefined) {
      throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
    }
    const canDelete = useJavaScript("CanDelete", [deleted.heap, deleted.ref, deleted.key], context);
    const heap = useJavaScript("Delete", [deleted.heap, deleted.ref, deleted.key], context);
    const target = skipCasts(expression.expression);
    // ToObject of the base throws on undefined or null, where a literal key converts nothing,
    // inside strict mode or out.
    const isBaseChecked =
      ts.isPropertyAccessExpression(target) ||
      (ts.isElementAccessExpression(target) && isLiteral(target.argumentExpression));
    const continueWithHeap = (after: Expression) =>
      shareHeap(
        path,
        {
          ...path,
          scope: {
            ...path.scope,
            bindings: new Map([...path.scope.bindings, [deleted.symbol, after]]),
          },
        },
        context,
        continueWith,
      );
    // Outside strict mode, the heap stays as it was, so the statements after it translate once.
    const deletion = isStrictCode(expression)
      ? ifThenElse(
          canDelete,
          continueWithHeap(heap),
          throwTypeError(path, expression, context, frame),
        )
      : continueWithHeap(ifExpression(canDelete, heap, deleted.heap));
    return isBaseChecked
      ? ifThenElse(
          apply("\\in", [deleted.ref, set([getUndefined(context), identifier("Null")])]),
          throwTypeError(path, expression, context, frame),
          deletion,
        )
      : deletion;
  }
  // A regexp that a statement makes of literals and drops, a function, or an object whose members
  // evaluate nothing, changes nothing.
  if (
    ts.isRegularExpressionLiteral(expression) ||
    ts.isArrowFunction(expression) ||
    ts.isFunctionExpression(expression) ||
    ((ts.isNewExpression(expression) || ts.isCallExpression(expression)) &&
      (expression.arguments ?? []).every(
        (argument) => ts.isStringLiteralLike(argument) || ts.isRegularExpressionLiteral(argument),
      ) &&
      getMadeRegExp(expression, context) !== undefined) ||
    (ts.isObjectLiteralExpression(expression) &&
      expression.properties.every(
        (property) =>
          (ts.isMethodDeclaration(property) ||
            ts.isAccessor(property) ||
            (ts.isPropertyAssignment(property) && isLiteral(property.initializer))) &&
          !ts.isComputedPropertyName(property.name),
      ))
  ) {
    return continueWith(path);
  }
  // A new that a statement makes and drops is done once it's made, where it isn't an error, whose
  // constructor runs later, and it passes only literals, which no conversion runs code for, as is a
  // new that only makes an object that nothing else sees, and one that throws, of a built-in
  // constructor that the script doesn't replace.
  const created = ts.isNewExpression(expression) ? skipCasts(expression.expression) : undefined;
  const createdSymbol = created === undefined ? undefined : getSymbol(created, context.checker);
  const builtIn =
    created === undefined ||
    createdSymbol === undefined ||
    isAssigned(createdSymbol, expression.getSourceFile(), context)
      ? ""
      : (getBuiltIn(created, context) ?? "");
  const passed = ts.isNewExpression(expression) ? (expression.arguments ?? []) : [];
  if (
    (UNCONSTRUCTED.has(builtIn) && passed.every(isInertValue)) ||
    (ARGUMENT_CONSTRUCTORS.has(builtIn) && passed.length === 0)
  ) {
    return throwTypeError(path, expression, context, frame);
  }
  if (
    ts.isNewExpression(expression) &&
    ((path.scope.allocated.has(expression) &&
      !isNewError(expression, context) &&
      passed.every(
        (argument) => isLiteral(argument) && !ts.isRegularExpressionLiteral(argument),
      )) ||
      (EMPTY_CONSTRUCTORS.has(builtIn) && passed.length === 0))
  ) {
    return continueWith(path);
  }
  if (isForeignNew(expression, context)) {
    return translateForeignNew(expression, path, context, frame);
  }
  // A statement that only reads, such as void await x once x settles, evaluates its value and drops
  // it, so that a getter it reads, which tla-ts can't call, stops the check.
  if (isRead(expression, path.scope.results)) {
    const value = translateExpression(expression, path.scope, context);
    if (context.heap === undefined) return continueWith(path);
    return throwReadError(
      expression,
      path,
      context,
      frame,
      ifThenElse(apply("=", [value, value]), continueWith(path), leaf(boolean(false))),
    );
  }
  // A pattern that writes a property runs the setter that the property holds, and one whose rest
  // copies a property runs its getter.
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isArrayLiteralExpression(expression.left) ||
      ts.isObjectLiteralExpression(expression.left)) &&
    (getWrittenProperties(expression.left).some(
      (property) => getPropertySetters(property, context).length > 0,
    ) ||
      (ts.isObjectLiteralExpression(expression.left) &&
        getRestGetterKeys(expression.left).length > 0))
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
  // A pattern whose default assigns, or which nests a pattern that may destructure null or
  // undefined, runs what only statements can as it assigns its targets.
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isArrayLiteralExpression(expression.left) ||
      ts.isObjectLiteralExpression(expression.left)) &&
    findNodes(expression.left, (node): node is ts.Node => {
      const initializer = ts.isShorthandPropertyAssignment(node)
        ? node.objectAssignmentInitializer
        : ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
          ? node.right
          : undefined;
      return (
        (initializer !== undefined && isAssignment(skipCasts(initializer))) ||
        (node !== expression.left &&
          (ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)))
      );
    }).length > 0
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
  // A logical assignment to a name makes the objects of its value only where it writes the name.
  if (
    ts.isBinaryExpression(expression) &&
    LOGICAL_OPERATORS.has(expression.operatorToken.kind) &&
    getAllocated(expression.right, context).length > 0
  ) {
    const right = expression.right;
    return ifThenElse(
      isLogicallyWritten(
        expression,
        translateExpression(expression.left, path.scope, context),
        context,
      ),
      allocate(right, path, context, (allocated) =>
        translateWriteStatement(expression, allocated, context, frame, continueWith),
      ),
      continueWith(path),
    );
  }
  // A foreign new may also pass the objects that it makes, which exist before it throws.
  if (
    isForeignConstruction(expression, context) &&
    (expression.arguments ?? []).every(
      (argument) => isInertValue(argument) || path.scope.allocated.has(skipCasts(argument)),
    )
  ) {
    return translateForeignNew(expression, path, context, frame);
  }
  // An assignment reads its right side before it writes, though nothing may read the value it
  // writes.
  const written = translateWriteStatement(expression, path, context, frame, continueWith);
  return ts.isBinaryExpression(expression) && !LOGICAL_OPERATORS.has(expression.operatorToken.kind)
    ? throwCallerError(expression.right, path, context, frame, written)
    : written;
};

interface ImmutableWrite {
  expression: ts.BinaryExpression | Increment;
  // The declaration of the name, whose type is what the name holds, which the checker doesn't give
  // where the script writes the name.
  declaration: ts.Declaration;
  isIgnored: boolean;
}

// An assignment or an increment that writes a name whose binding can't change.
export const getImmutableWrite = (
  expression: ts.Node,
  context: Context,
): ImmutableWrite | undefined => {
  const target =
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    expression.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ? expression.left
      : isIncrement(expression) && INCREMENT_OPERATORS.has(expression.operator)
        ? expression.operand
        : undefined;
  const name = target === undefined ? undefined : skipCasts(target);
  if (name === undefined || !ts.isIdentifier(name)) return undefined;
  const immutable = getImmutable(name, context);
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  return immutable === undefined ||
    declaration === undefined ||
    !(ts.isBinaryExpression(expression) || isIncrement(expression))
    ? undefined
    : { expression, declaration, isIgnored: immutable === "ignores" };
};

// Runs a write to a name whose binding can't change, which reads and computes what it writes, then
// throws a TypeError, as SetMutableBinding does, or leaves the binding as it is. tla-ts follows
// only primitive operands, whose conversions run no code and throw nothing but a TypeError, and a
// written value that can't throw.
const translateImmutableWrite = (
  write: ImmutableWrite,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const expression = write.expression;
  const getFlags = (node: ts.Node) => context.checker.getTypeAtLocation(node).flags;
  const flags = getFlags(write.declaration);
  // BigInt division and exponentiation throw a RangeError, which comes first.
  const isPrimitive = (flags & PRIMITIVE_TYPES) !== 0 && (flags & ts.TypeFlags.BigIntLike) === 0;
  const written = write.isIgnored
    ? continueWith(path)
    : throwTypeError(path, expression, context, frame);
  if (!ts.isBinaryExpression(expression)) {
    if (write.isIgnored || !isPrimitive) {
      throw new TlaTypeScriptError(`tla-ts can't follow ${expression.getText()}`, expression);
    }
    return written;
  }
  const kind = expression.operatorToken.kind;
  const isLogical = LOGICAL_OPERATORS.has(kind);
  if (
    !isInertValue(skipCasts(expression.right)) ||
    (kind !== ts.SyntaxKind.EqualsToken &&
      !isLogical &&
      (write.isIgnored || !isPrimitive || (getFlags(expression.right) & PRIMITIVE_TYPES) === 0))
  ) {
    throw new TlaTypeScriptError(`tla-ts can't follow ${expression.getText()}`, expression);
  }
  translateExpression(expression.right, path.scope, context);
  return isLogical
    ? ifThenElse(
        isLogicallyWritten(
          expression,
          translateExpression(expression.left, path.scope, context),
          context,
        ),
        written,
        continueWith(path),
      )
    : written;
};

// A yield, which suspends the generator's body with the value of its operand, and goes on with
// the value that the next that resumes the body sends.
const translateYield = (
  expression: ts.YieldExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, sent?: Expression) => Formula,
): Formula => {
  const yielded = expression.expression;
  const called = yielded && getCast(yielded);
  const isCalled =
    called !== undefined &&
    ts.isCallExpression(called) &&
    called.arguments.every((argument) => !hasCall(argument, context));
  // A yield of an await that the statement ran first yields what the await gave.
  if (
    frame.yieldTo === undefined ||
    (yielded !== undefined &&
      !isCalled &&
      !path.scope.results.has(skipCasts(yielded)) &&
      hasCall(yielded, context))
  ) {
    throw new TlaTypeScriptError("Unsupported yield", expression);
  }
  const yieldTo = frame.yieldTo;
  const throwTo = frame.throwTo;
  const uncaught = apply("Assert", [boolean(false), string(expression.getText())]);
  const throwWith = (current: Path, thrown: Expression) =>
    throwTo === undefined ? leaf(uncaught) : throwTo(current, { value: thrown, uncaught });
  const yieldWith = (current: Path, value: Expression | undefined) =>
    yieldTo(current, value, continueWith, throwWith, {
      isDelegated: false,
      isGuarded: false,
      // An async generator's yield awaits what a return gives, and throws where it rejects.
      abortRest: (aborted, method, abrupt) =>
        method === "throw"
          ? throwWith(aborted, abrupt ?? getUndefined(context))
          : frame.awaitTo === undefined
            ? frame.exit(aborted, abrupt)
            : frame.awaitTo(
                aborted,
                abrupt ?? getUndefined(context),
                undefined,
                frame.exit,
                throwWith,
              ),
    });
  // A yield of an increment yields what it gives.
  if (
    called !== undefined &&
    isIncrement(called) &&
    isPlainIncrement(called, context) &&
    !path.scope.results.has(called)
  ) {
    return runAssignment(called, path, context, frame, yieldWith);
  }
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
};

// Runs an assignment or an increment, which writes a variable or a property.
const translateWriteStatement = (
  expression: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const written = ts.isBinaryExpression(expression)
    ? expression.left
    : ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)
      ? expression.operand
      : undefined;
  const nameError =
    written === undefined || !isAssignment(expression) ? undefined : getNameError(written, context);
  if (nameError !== undefined) return throwError(nameError, path, expression, context, frame);
  const assigned = getAssignedPath(expression, path, context);
  if (assigned === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  // A write to a property that can't change throws a TypeError in strict mode.
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
  // A write to a property of another primitive throws a TypeError in strict mode, and outside it
  // does nothing, which tla-ts follows for a value that runs no code, unless a setter that its
  // prototypes may hold runs.
  const accessed =
    written !== undefined &&
    (ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written)) &&
    isMaybePrimitive(context.checker.getTypeAtLocation(skipCasts(written.expression)))
      ? written
      : undefined;
  const skipPrimitive = (rest: Formula) => {
    if (accessed === undefined) return rest;
    const isIgnored =
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      isInertValue(skipCasts(expression.right));
    const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));
    const outcome = isStrictCode(expression)
      ? throwTypeError(path, expression, context, frame)
      : isIgnored
        ? continueWith(path)
        : stop("tla-ts can't follow a write to a primitive's property outside strict mode");
    const type = useJavaScript(
      "TypeOf",
      [translateExpression(skipCasts(accessed.expression), path.scope, context)],
      context,
    );
    const heap = context.heap === undefined ? undefined : getHeap(path.scope, accessed, context);
    const key = ts.isPropertyAccessExpression(accessed)
      ? string(accessed.name.text)
      : translatePropertyKey(accessed.argumentExpression, path.scope, context);
    const isHeld =
      heap === undefined
        ? undefined
        : junction(
            "Or",
            (
              [
                ["string", "String.prototype"],
                ["number", "Number.prototype"],
                ["boolean", "Boolean.prototype"],
                ["symbol", "Symbol.prototype"],
                ["bigint", "BigInt.prototype"],
              ] as const
            ).map(([name, prototype]) =>
              junction("And", [
                apply("=", [type, string(name)]),
                useJavaScript(
                  "Has",
                  [heap, translateBuiltInValue(prototype, accessed, context), key],
                  context,
                ),
              ]),
            ),
          );
    return ifThenElse(
      apply("\\notin", [type, set([string("object"), string("function")])]),
      isHeld === undefined
        ? outcome
        : ifThenElse(
            isHeld,
            stop("tla-ts can't write a property that a primitive's prototypes hold"),
            outcome,
          ),
      rest,
    );
  };

  if (write === undefined) {
    return throwOnNullish(
      skipPrimitive(
        forceHeap(
          path.scope,
          assigned.scope,
          continueWith(assigned),
          leaf(boolean(false)),
          context,
        ),
      ),
    );
  }
  // Outside strict mode, a write that fails changes nothing, which tla-ts follows where what it
  // writes changes nothing else either. It keeps the heap as it was, rather than going on from
  // each outcome, which would translate the rest of the statements twice for each such write.
  const isWritingRight =
    ts.isBinaryExpression(expression) &&
    findNodes(expression.right, (node): node is ts.Expression => isAssignment(node)).length > 0;
  const canPut = useJavaScript("CanPut", [write.heap, write.ref, write.key], context);
  const translateWrite = (next: (path: Path) => Formula) =>
    throwOnNullish(
      isStrictCode(expression) || isWritingRight
        ? ifThenElse(
            canPut,
            shareHeap(path, assigned, context, next),
            isStrictCode(expression)
              ? throwTypeError(path, expression, context, frame)
              : leaf(
                  apply("Assert", [
                    boolean(false),
                    string("tla-ts can't ignore a failed write outside strict mode"),
                  ]),
                ),
          )
        : ifThenElse(
            useJavaScript("IsThrowingSet", [write.heap, write.ref, write.key], context),
            throwTypeError(path, expression, context, frame),
            shareHeap(
              path,
              {
                ...assigned,
                scope: {
                  ...assigned.scope,
                  bindings: new Map([
                    ...assigned.scope.bindings,
                    [
                      write.symbol,
                      ifExpression(
                        canPut,
                        getHeap(assigned.scope, expression, context),
                        write.heap,
                      ),
                    ],
                  ]),
                },
              },
              context,
              next,
            ),
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
            path,
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

export const isMaybeNullish = (type: ts.Type): boolean =>
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
export const throwOnDestructured = (
  scope: Scope,
  path: Path,
  context: Context,
  frame: Frame,
  rest: Formula,
): Formula => {
  const destructured = scope.destructured ?? [];
  return destructured.length === 0
    ? rest
    : checkDestructured(
        destructured,
        throwTypeError(path, destructured[0].pattern, context, frame),
        rest,
        context,
      );
};

// Runs what is thrown where a pattern destructures null or undefined, or a value it can't iterate,
// and the rest otherwise, once the elements that its patterns iterate are found.
export const checkDestructured = (
  destructured: readonly Destructured[],
  thrown: Formula,
  rest: Formula,
  context: Context,
): Formula => {
  context.prelude.add("Null");
  const iterated = destructured.flatMap((entry) => entry.iterated ?? []);
  return ifThenElse(
    junction(
      "Or",
      destructured.flatMap((entry) => [
        isNullish(entry.value, context),
        ...(entry.isUniterable === undefined ? [] : [entry.isUniterable]),
      ]),
    ),
    thrown,
    iterated.length === 0
      ? rest
      : ifThenElse(
          junction(
            "And",
            iterated.map((elements) => apply("=", [elements, elements])),
          ),
          rest,
          leaf(boolean(false)),
        ),
  );
};

// Binds each declared local to a LET definition. A let can change later, and a const can't.
// Whether a function, or one it calls, makes or reads objects, which only statements can do.
const usesHeap = (node: ts.Node, context: Context, visited: Set<ts.Node>): boolean => {
  if (ts.isTypeNode(node)) return false;
  if (
    (ts.isObjectLiteralExpression(node) && !isArrayFromLength(node, context)) ||
    ts.isRegularExpressionLiteral(node) ||
    isAllocation(node, context) ||
    isClosure(node, context) ||
    (ts.isExpression(node) && getConversion(node, context) !== undefined)
  ) {
    return true;
  }
  const isRead =
    (ts.isIdentifier(node) && getKind(node, context) === "object") ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      getKind(node.expression, context) === "object") ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      getKind(node.right, context) === "object") ||
    (ts.isObjectBindingPattern(node) &&
      isHeapPattern(
        context.checker.getNonNullableType(context.checker.getTypeAtLocation(node)),
        node,
        context,
      ));
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

// The functions that a call of what a call gives may run, where each return of the function it
// calls gives a function that it makes, as isNextKind("BY")(state) runs the one that isNextKind
// makes rather than any that its type allows.
const getMadeFunctions = (callee: ts.Expression, context: Context) => {
  const maker = ts.isCallExpression(callee) ? getCallee(callee.expression, context) : undefined;
  if (maker?.body === undefined || isAnyGenerator(maker) || isAsyncFunction(maker))
    return undefined;
  const body = maker.body;
  const returned = ts.isBlock(body)
    ? findNodes(body, ts.isReturnStatement)
        .filter((statement) => ts.findAncestor(statement.parent, ts.isFunctionLike) === maker)
        .map((statement) => statement.expression)
    : [body];
  const made = returned.flatMap((expression) => {
    const inner = expression && skipCasts(expression);
    return inner !== undefined && (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner))
      ? [inner]
      : [];
  });
  return made.length > 0 && made.length === returned.length ? made : undefined;
};

// The functions that a call through a value may run, where tla-ts can't tell which one it names:
// those that no other function encloses, whose type TypeScript lets the callee hold. The call
// branches on its callee's value between them.
const getDispatched = (
  node: ts.CallExpression,
  functions: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
) => {
  const callee = skipCasts(node.expression);
  const symbol = getSymbol(callee, context.checker);
  const declarations = symbol?.declarations ?? [];
  const assigned = symbol && functions.get(symbol);
  if (
    context.heap === undefined ||
    // The function that a call gives may be any of them, as may the method that super reads where
    // TypeScript can't tell which, as in an object literal, or one that a literal key reads.
    (declarations.length === 0 &&
      !ts.isCallExpression(callee) &&
      !isSuperAccess(callee) &&
      !(ts.isElementAccessExpression(callee) && ts.isStringLiteral(callee.argumentExpression))) ||
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
  const dispatched = getMadeFunctions(callee, context) ?? [
    ...getFunctionCandidates(callee, context),
    ...getClosures(callee, context),
  ];
  return dispatched.length > 0 ? dispatched : undefined;
};

// RegExp.prototype.exec and test, where a script stores them as values, which throw a TypeError
// where the receiver can't be a regexp: exec requires one, and test calls the receiver's exec where
// that's a function, which RegExp.prototype.exec is, and requires a regexp otherwise.
const translateStoredRegExpCall = (
  expression: ts.CallExpression,
  value: Expression,
  receiver: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  otherwise: Formula,
) => {
  const rejectRegExp = (method: string) => {
    const unfollowed = leaf(
      apply("Assert", [
        boolean(false),
        string(`tla-ts can't run RegExp.prototype.${method} on this receiver`),
      ]),
    );
    const reject = (current: Path) =>
      ifThenElse(
        useJavaScript(
          "LacksRegExpMatcher",
          [getHeap(current.scope, expression, context), receiver],
          context,
        ),
        throwTypeError(current, expression, context, frame),
        unfollowed,
      );
    if (method === "exec") return reject(path);
    const argument = expression.arguments.at(0);
    // test converts its argument to a string before it reads exec, which only a primitive other
    // than a symbol does without running anything.
    const isPrimitive =
      argument === undefined ||
      (getTypeNames(context.checker.getTypeAtLocation(argument), context.checker)?.every((name) =>
        ["string", "number", "boolean", "undefined", "null", "bigint"].includes(name),
      ) ??
        false);
    return ifThenElse(
      apply("\\/", [
        apply("=", [receiver, identifier("Null")]),
        not(
          apply("\\in", [
            useJavaScript(
              "TypeOfIn",
              [getHeap(path.scope, expression, context), receiver],
              context,
            ),
            set([string("object"), string("function")]),
          ]),
        ),
      ]),
      throwTypeError(path, expression, context, frame),
      isPrimitive
        ? read(expression, receiver, "exec", path, context, frame, (found, exec) =>
            ifThenElse(
              apply("/\\", [
                apply("=", [
                  useJavaScript(
                    "TypeOfIn",
                    [getHeap(found.scope, expression, context), exec],
                    context,
                  ),
                  string("function"),
                ]),
                not(
                  apply("=", [
                    exec,
                    translateBuiltInValue("RegExp.prototype.exec", expression, context),
                  ]),
                ),
              ]),
              unfollowed,
              reject(found),
            ),
          )
        : unfollowed,
    );
  };
  const stored = new Set(
    findNodes(expression.getSourceFile(), ts.isPropertyAccessExpression).map((inner) =>
      getStoredBuiltIn(inner, context),
    ),
  );
  return ["exec", "test"]
    .filter((method) => stored.has(`RegExp.prototype.${method}`))
    .reduceRight<Formula>(
      (rest, method) =>
        ifThenElse(
          apply("=", [
            value,
            translateBuiltInValue(`RegExp.prototype.${method}`, expression, context),
          ]),
          rejectRegExp(method),
          rest,
        ),
      otherwise,
    );
};

// The methods of Object.prototype that tell whether an object has an own key, which a key that may
// hold one runs on its receiver.
const OWN_CHECKS = new Set(["hasOwnProperty", "propertyIsEnumerable"]);

// The Iterator.prototype methods that take a callback first, which they check before they read the
// iterator's next.
const ITERATOR_CALLBACK_METHODS = new Set([
  "map",
  "filter",
  "flatMap",
  "forEach",
  "some",
  "every",
  "find",
  "reduce",
]);

// A call to a function or a method whose body or parameters' defaults change state, which inlines
// as statements that give its result.
const isStateCall = (node: ts.CallExpression, path: Path, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ??
    getCallee(node.expression, context) ??
    getCalledMethod(node.expression, context)?.method;
  return (
    callee?.body !== undefined &&
    [callee.body, ...callee.parameters].some((part) =>
      changesState(callee, part, context, new Set([callee])),
    )
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
  (getFormatCall(node, context) !== undefined ||
    isPromiseMaking(node, path, context) ||
    getBound(node.expression, context) !== undefined ||
    getDateCall(node, context) !== undefined ||
    getHeapRegExpCall(node, context) !== undefined ||
    getRegExpProtocolCall(node, context) !== undefined ||
    getURICall(node, context)?.isDecode === true ||
    getViewCall(node, context) !== undefined ||
    getGetterCall(node, context) !== undefined ||
    getIntlMethodCall(node, context) !== undefined ||
    getThisSymbolCall(node, context) !== undefined ||
    getCalledThrough(node, context) !== undefined ||
    getAppliedCall(node, path, context) !== undefined ||
    getMisreceivedCall(node, context) !== undefined ||
    getStackCall(node, context) !== undefined ||
    getIteratorDisposeCall(node, context) !== undefined ||
    getHeapArrayChange(node, context) !== undefined ||
    isStoredStatement(node, context) ||
    getArrayLikeChange(node, context) !== undefined ||
    getHeapSetOrMapChange(node, context) !== undefined ||
    getArrayIteratorCall(node, context) !== undefined ||
    isNullishArrayMethodCall(node, context) ||
    isSizelessSetLikeCall(node, context) ||
    isSymbolIndexCall(node, context) ||
    isRawCall(node, context) ||
    getStringCall(node, context) !== undefined ||
    isBigIntStringify(node, context) ||
    getRevival(node, context) !== undefined ||
    getBuiltJsonText(node, context) !== undefined ||
    getReplacers(node, context) !== undefined ||
    getStringifyGetters(node, context).length > 0 ||
    isDescriptorsRead(node, context) ||
    isOwnValuesRead(node, context) ||
    isRevoke(node, context) ||
    (isObjectChange(node, context) &&
      node.expression.name.text !== "construct" &&
      (isReflectChange(node) ||
        isReflectSet(node) ||
        isHeapType(context.checker.getTypeAtLocation(node), context) ||
        // An array that the heap holds, which a variable that it holds takes.
        context.heapCollections.has(node.parent) ||
        // A change of an object gives the object, though TypeScript types what it gives as any.
        (node.arguments.length > 0 &&
          isHeapType(context.checker.getTypeAtLocation(node.arguments[0]), context)))) ||
    getGeneratorStep(node, context) !== undefined ||
    getGeneratorMethod(node, context) !== undefined ||
    getIterableFrom(node, context) !== undefined ||
    getIterableFrom(node, context, "fromEntries") !== undefined ||
    getIteratorFrom(node, context) !== undefined ||
    isPromiseCall(node, context) ||
    getCreatedGenerator(node, path, context) !== undefined ||
    getAsyncCallee(node.expression, path, context) !== undefined ||
    getCalledMethod(node.expression, context, isAsyncFunction) !== undefined ||
    isHeapCall(node, path, context) ||
    getLoopCall(node, path, context) !== undefined ||
    isStateCall(node, path, context) ||
    getDispatched(node, path.scope.functions, context) !== undefined ||
    // A call inside try of a function that may throw runs its body, so that catch takes what it
    // throws.
    (path.scope.isCatching &&
      (isThrowingCall(node, path, context) || isUnseededReduce(node, context))));

// A call of an array's reduce or reduceRight without an initial value, which throws a TypeError
// where the array has no element to start from.
const isUnseededReduce = (node: ts.CallExpression, context: Context) => {
  const arrayMethod = getArrayMethodCall(node, context);
  const method = arrayMethod ?? (isMethodCall(node) ? node.expression.name.text : undefined);
  return (
    (method === "reduce" || method === "reduceRight") &&
    !node.arguments.some(ts.isSpreadElement) &&
    node.arguments.length === (arrayMethod === undefined ? 1 : 2) &&
    (arrayMethod !== undefined ||
      (isMethodCall(node) &&
        context.checker.isArrayType(context.checker.getTypeAtLocation(node.expression.expression))))
  );
};

// A call of a function that may throw, which a parameter or a variable may hold.
const isThrowingCall = (node: ts.CallExpression, path: Path, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
  return callee !== undefined && mayThrow(callee, context);
};

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
const isIteratedTypedArray = (node: ts.Expression, context: Context) => {
  const first = getConstruction(node, context)?.arguments.at(0);
  return (
    first !== undefined &&
    (getNewBuffer(node, context) ?? []).some((buffer) => TYPED_ARRAYS.has(buffer)) &&
    (context.checker.getTypeAtLocation(getCast(first)).flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0
  );
};

// new of an Intl constructor, or a call of a function that reads locales, whose literals it
// rejects, which a statement runs, and which throws where it reads what tla-ts records.
const translateIntlError = (node: ts.Expression, path: Path, context: Context, frame: Frame) => {
  const error = getIntlError(node, context);
  if (error === undefined) throw new TlaTypeScriptError("Unsupported Intl constructor", node);
  return ifThenElse(
    translateIntlKept(node, getHeap(path.scope, node, context), path.scope, context),
    throwError(error, path, node, context, frame),
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't run an Intl function where a script changed what it reads"),
      ]),
    ),
  );
};

// new, or Reflect.construct, of a buffer, a DataView, or a typed array, which a statement runs, as
// it may throw.
const getBufferConstruction = (node: ts.Expression, context: Context) =>
  getNewBuffer(node, context) && getConstruction(node, context);

// new of a typed array, or of a DataView without another newTarget, whose byteOffset or length may
// be an object, which it converts to a primitive where it views a buffer, running the object's
// valueOf and toString.
const isIndexConvertingNew = (node: ts.Node, context: Context) => {
  if (!ts.isExpression(node)) return false;
  const buffers = getNewBuffer(node, context) ?? [];
  const construction = getBufferConstruction(node, context);
  return (
    (buffers.every((buffer) => TYPED_ARRAYS.has(buffer)) ||
      (buffers.length === 1 &&
        buffers[0] === "DataView" &&
        construction?.newTarget === construction?.callee)) &&
    (construction?.arguments ?? [])
      .slice(1, 3)
      .some((value) => !isPrimitiveIndex(getCast(value), context))
  );
};

// A call of a Date's setter with an object, which it converts to a number, running the object's
// valueOf and toString.
const isObjectDateCall = (node: ts.Node, context: Context) =>
  getDateCall(node, context)?.values.some((value) => isObjectOperand(value, context)) === true;

// The index, and a setter's value, of a call of a DataView's getter or setter where one is an
// object, which the call converts in turn, running the object's valueOf and toString. Its
// littleEndian, which it converts with ToBoolean after them, is a literal, so nothing that they
// run changes it.
const getConvertedViewValues = (node: ts.Node, context: Context) => {
  const call = getViewCall(node, context);
  if (call?.owner !== "DataView") return undefined;
  const count = call.method.startsWith("get") ? 1 : 2;
  const converted = call.values.slice(0, count);
  return converted.some((value) => isObjectOperand(value, context)) &&
    call.values.slice(count).every(isLiteralValue)
    ? converted
    : undefined;
};

// The getters of a typed array's constructor that its slice and subarray may run, as they make their
// typed array through it once their receiver's and arguments' checks pass.
const getViewSpeciesGetters = (node: ts.Node, context: Context) => {
  const viewCall = getViewCall(node, context);
  return viewCall?.owner === "TypedArray" &&
    (viewCall.method === "slice" || viewCall.method === "subarray")
    ? getDefinedGetters(node, "constructor", context)
    : [];
};

// The getters of newTarget's prototype that new of a buffer, a DataView, a typed array, or a weak
// holder may run, where Reflect.construct gives it another newTarget.
const getNewTargetGetters = (node: ts.Node, context: Context) => {
  const construction = ts.isExpression(node) ? getBufferConstruction(node, context) : undefined;
  return construction === undefined || construction.newTarget === construction.callee
    ? []
    : getKeyGetters(node, "prototype", context);
};

// The index and values of a call of an Atomics function where one is an object, or of type any as
// a test's index generator gives, which the call converts in turn after it checks its typed array.
const getConvertedAtomicsValues = (node: ts.Node, context: Context) => {
  const call = getViewCall(node, context);
  if (call?.owner !== "Atomics" || call.method === "isLockFree" || call.method === "pause") {
    return undefined;
  }
  const converted = call.values.slice(1);
  return converted.some((value) => isObjectOperand(value, context) || isAnyOperand(value, context))
    ? converted
    : undefined;
};

// The begin and end of a call of a typed array's subarray where one is an object, or of type any,
// which the call converts in turn after it reads the typed array's length.
const getConvertedSubarrayValues = (node: ts.Node, context: Context) => {
  const call = getViewCall(node, context);
  return call?.owner === "TypedArray" &&
    call.method === "subarray" &&
    call.values.length <= 2 &&
    call.values.some((value) => isObjectOperand(value, context) || isAnyOperand(value, context))
    ? call.values
    : undefined;
};

// Runs new of a buffer, a DataView, or a typed array, which throws the error its constructor does,
// and makes a typed array of an object's iterator's values where a script's @@iterator method
// gives them.
const translateNewBufferStatement = (
  node: ts.Expression,
  construction: Construction,
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
      const values = construction.arguments.map((value) =>
        translateExpression(value, allocated.scope, context),
      );
      const buffers = getNewBuffer(node, context) ?? [];
      // Runs next where a construction's error is "", and throws it otherwise.
      const throwUnless = (current: Path, error: Expression, next: Formula) =>
        ifThenElse(
          apply("=", [error, string("")]),
          next,
          ifThenElse(
            apply("=", [error, string("RangeError")]),
            throwError("RangeError", current, node, context, frame),
            throwTypeError(current, node, context, frame),
          ),
        );
      const makeWith = (
        current: Path,
        madeArguments: Expression[],
        prototypeValue: Expression | undefined,
        finish: (path: Path, value: Expression) => Formula,
      ) => {
        const heapSymbol = context.heap;
        const heap = getHeap(current.scope, node, context);
        const errorName = context.names.getFresh("error");
        const error = identifier(errorName);
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
          errorName,
          translateNewBufferOf(
            node,
            construction,
            heap,
            tuple(madeArguments),
            current.scope,
            context,
            "error",
            prototypeValue,
          ),
          throwUnless(
            current,
            error,
            bindOnce(
              current,
              madeName,
              translateNewBufferOf(
                node,
                construction,
                heap,
                tuple(madeArguments),
                current.scope,
                context,
                "heap",
                prototypeValue,
              ),
              finish(after, useJavaScript("Allocated", [made], context)),
            ),
          ),
        );
      };
      // Reflect.construct with another newTarget reads its prototype, which a getter that the script
      // writes may answer: a typed array of an object first, and anything else once its arguments'
      // checks pass, which run again on what the getter leaves.
      const prototypeGetters = getNewTargetGetters(node, context);
      const typedBuffers = buffers.filter((buffer) => TYPED_ARRAYS.has(buffer));
      if (
        prototypeGetters.length > 0 &&
        typedBuffers.length > 0 &&
        typedBuffers.length < buffers.length
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't tell when this construction reads its newTarget's prototype",
          node,
        );
      }
      const newTarget = translateExpression(construction.newTarget, allocated.scope, context);
      const make = (
        current: Path,
        madeArguments: Expression[],
        finish: (path: Path, value: Expression) => Formula,
      ) => {
        if (prototypeGetters.length === 0)
          return makeWith(current, madeArguments, undefined, finish);
        const heap = getHeap(current.scope, node, context);
        const errorName = context.names.getFresh("error");
        const first = madeArguments.at(0);
        return bindOnce(
          current,
          errorName,
          translateNewBufferOf(
            node,
            construction,
            heap,
            tuple(madeArguments),
            current.scope,
            context,
            "error",
            getUndefined(context),
          ),
          ifThenElse(
            apply("\\/", [
              apply("=", [identifier(errorName), string("")]),
              typedBuffers.length === 0
                ? boolean(false)
                : first === undefined
                  ? boolean(true)
                  : useJavaScript("IsObjectIn", [heap, first], context),
            ]),
            read(node, newTarget, "prototype", current, context, frame, (got, prototypeValue) =>
              makeWith(got, madeArguments, prototypeValue, finish),
            ),
            makeWith(current, madeArguments, getUndefined(context), finish),
          ),
        );
      };
      // A typed array that views a buffer throws its byteOffset's RangeError before it converts
      // its length, and a DataView its buffer's TypeError where it's detached, and the RangeError
      // of a byteOffset past its end.
      const isConverted = isIndexConvertingNew(node, context);
      const toIndex = (
        current: Path,
        value: Expression,
        next: (path: Path, primitive: Expression) => Formula,
      ) =>
        runToPrimitive(node, value, "number", current, context, frame, (after, primitive) =>
          ifThenElse(
            junction("Or", [
              useJavaScript("IsSymbol", [primitive], context),
              useJavaScript("IsBigInt", [primitive], context),
            ]),
            throwTypeError(after, node, context, frame),
            next(after, primitive),
          ),
        );
      // A typed array reads newTarget's prototype before it converts its offset and length or
      // iterates its argument, which a getter there would have to run before.
      const readsPrototypeAfter = (current: Path, formula: Formula) =>
        prototypeGetters.length === 0 || typedBuffers.length === 0
          ? formula
          : ifThenElse(
              apply("=", [
                useJavaScript(
                  "GetterOf",
                  [getHeap(current.scope, node, context), newTarget, string("prototype")],
                  context,
                ),
                getUndefined(context),
              ]),
              formula,
              leaf(
                apply("Assert", [
                  boolean(false),
                  string(
                    "tla-ts can't run a getter of newTarget's prototype before a typed array runs its argument's code",
                  ),
                ]),
              ),
            );
      const makeViewing = (
        current: Path,
        madeArguments: Expression[],
        finish: (path: Path, value: Expression) => Formula,
      ) =>
        !isConverted
          ? make(current, madeArguments, finish)
          : ifThenElse(
              useJavaScript(
                "IsBuffer",
                [getHeap(current.scope, node, context), madeArguments[0]],
                context,
              ),
              readsPrototypeAfter(
                current,
                toIndex(current, madeArguments[1] ?? getUndefined(context), (offsetPath, offset) =>
                  bind(
                    offsetPath,
                    "error",
                    translateNewBufferOf(
                      node,
                      construction,
                      getHeap(offsetPath.scope, node, context),
                      tuple([madeArguments[0], offset]),
                      offsetPath.scope,
                      context,
                      "offset error",
                    ),
                    context,
                    (errorPath, error) =>
                      throwUnless(
                        errorPath,
                        error,
                        madeArguments[2] === undefined
                          ? make(errorPath, [madeArguments[0], offset], finish)
                          : toIndex(errorPath, madeArguments[2], (lengthPath, length) => {
                              const viewed = [madeArguments[0], offset, length];
                              // A DataView throws the RangeError of a length past its buffer's
                              // end, as the buffer was before it converted the length.
                              return buffers.includes("DataView")
                                ? bind(
                                    lengthPath,
                                    "error",
                                    translateNewBufferOf(
                                      node,
                                      construction,
                                      getHeap(errorPath.scope, node, context),
                                      tuple(viewed),
                                      errorPath.scope,
                                      context,
                                      "error",
                                      prototypeGetters.length === 0
                                        ? undefined
                                        : getUndefined(context),
                                    ),
                                    context,
                                    (checkedPath, lengthError) =>
                                      throwUnless(
                                        checkedPath,
                                        lengthError,
                                        make(checkedPath, viewed, finish),
                                      ),
                                  )
                                : make(lengthPath, viewed, finish);
                            }),
                      ),
                  ),
                ),
              ),
              make(current, madeArguments, finish),
            );
      const throwWith = (after: Path) => throwTypeError(after, node, context, frame);
      const step = (
        current: Path,
        iterator: Expression,
        next: Expression,
        taken: Expression[],
        finish: (path: Path, value: Expression) => Formula,
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
              "next",
              next,
              [],
              current,
              context,
              frame,
              throwWith,
              (done) => make(done, [tuple(taken), ...values.slice(1)], finish),
              (stepped, result) =>
                readValue(node, result, stepped, context, frame, (read, value) =>
                  step(read, iterator, next, [...taken, value], finish),
                ),
            );
      // new of a typed array reads an object's @@iterator, and else its length and its elements in
      // order, so the first that a getter which only throws answers throws, where nothing before
      // runs code. The typed arrays of numbers and those of BigInts convert the elements apart.
      const isBig = buffers.every((buffer) => buffer.startsWith("Big"));
      const code = useJavaScript(
        "TypedArrayFirstGetter",
        [
          getHeap(allocated.scope, node, context),
          values[0] ?? getUndefined(context),
          boolean(isBig),
        ],
        context,
      );
      const callee = translateExpression(construction.callee, allocated.scope, context);
      const madeFrom = (finish: (path: Path, value: Expression) => Formula) =>
        values.length > 0 &&
        construction.newTarget === construction.callee &&
        buffers.length > 0 &&
        buffers.every((buffer) => TYPED_ARRAYS.has(buffer) && buffer.startsWith("Big") === isBig) &&
        getThrowingGetters(node, context).length > 0
          ? throwFirstGetter(
              node,
              apply("/\\", [
                getBuiltIn(construction.callee, context) === undefined
                  ? junction(
                      "Or",
                      buffers.map((buffer) =>
                        useJavaScript(
                          "SameValue",
                          [callee, translateBuiltInValue(buffer, node, context)],
                          context,
                        ),
                      ),
                    )
                  : boolean(true),
                apply("#", [code, getUndefined(context)]),
              ]),
              code,
              values[0],
              allocated,
              context,
              frame,
              makeViewing(allocated, values, finish),
            )
          : makeViewing(allocated, values, finish);

      // Each step of the iterator may make the typed array, and what follows goes on from a join.
      return isIteratedTypedArray(node, context)
        ? translateJoined(
            node,
            allocated,
            context,
            (after, value) => continueWith(after, value ?? getUndefined(context)),
            (finish) =>
              ifThenElse(
                useJavaScript(
                  "IteratesScriptMethod",
                  [getHeap(allocated.scope, node, context), values[0]],
                  context,
                ),
                readsPrototypeAfter(
                  allocated,
                  openIterator(
                    node,
                    values[0],
                    allocated,
                    context,
                    frame,
                    throwWith,
                    (opened, iterator, next) => step(opened, iterator, next, [], finish),
                  ),
                ),
                madeFrom(finish),
              ),
          )
        : madeFrom(continueWith);
    },
  );

// Makes the objects that a node's object literals create, before the statement that evaluates
// them runs, since an expression can't change the heap. An expression that ran already, such as
// a conversion, a call, a typed array's new, or a branch that a statement runs first, made itself
// and those in it.
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
            ts.findAncestor(allocation, (ancestor) =>
              ts.isFunctionLike(ancestor)
                ? "quit"
                : ts.isExpression(ancestor) && path.scope.results.has(ancestor),
            ) === undefined,
        ),
    path,
    context,
    continueWith,
  );

export const allocateAll = (
  allocations: ts.Node[],
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const symbol = context.heap;
  if (symbol === undefined || allocations.length === 0) return continueWith(path);
  // A closure that reads the const whose object literal holds it is made after the object, which
  // holds undefined there until the closure is made.
  const deferred = allocations.filter((allocation) => {
    const holder = getHolder(allocation);
    const held = holder && getSymbol(holder.declaration.name, context.checker);
    return (
      holder !== undefined &&
      held !== undefined &&
      allocations.includes(holder.literal) &&
      isClosure(allocation, context) &&
      getCaptures(allocation, context).includes(held)
    );
  });
  const allocateOne = (current: Bound, allocation: ts.Node, scope: Scope) => {
    const name = context.names.getFresh("heap");
    return {
      name,
      ref: translateAllocatedValue(allocation, identifier(name), current.scope, context),
      definition: define(name, [], translateAllocated(allocation, scope, context)),
    };
  };
  const made = allocations
    .filter((allocation) => !deferred.includes(allocation))
    .reduce<Bound>(
      (current, allocation) => {
        const one = allocateOne(current, allocation, current.scope);
        return {
          definitions: [...current.definitions, one.definition],
          scope: {
            ...current.scope,
            bindings: new Map([...current.scope.bindings, [symbol, identifier(one.name)]]),
            allocated: new Map([...current.scope.allocated, [allocation, one.ref]]),
          },
        };
      },
      {
        definitions: [],
        scope: {
          ...path.scope,
          allocated: new Map([
            ...path.scope.allocated,
            ...deferred.map((closure): [ts.Node, Expression] => [closure, getUndefined(context)]),
          ]),
        },
      },
    );
  const allocated = deferred.reduce<Bound>((current, closure) => {
    const holder = getHolder(closure);
    const held = holder && getSymbol(holder.declaration.name, context.checker);
    const object = holder && current.scope.allocated.get(holder.literal);
    if (holder === undefined || held === undefined || object === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", closure);
    }
    const one = allocateOne(current, closure, {
      ...current.scope,
      bindings: new Map([...current.scope.bindings, [held, object]]),
    });
    const written = context.names.getFresh("heap");
    const heap = identifier(one.name);
    return {
      definitions: [
        ...current.definitions,
        one.definition,
        define(
          written,
          [],
          useJavaScript(
            "Update",
            [
              heap,
              object,
              useJavaScript(
                "Put",
                [useJavaScript("Lookup", [heap, object], context), string(holder.key), one.ref],
                context,
              ),
            ],
            context,
          ),
        ),
      ],
      scope: {
        ...current.scope,
        bindings: new Map([...current.scope.bindings, [symbol, identifier(written)]]),
        allocated: new Map([...current.scope.allocated, [closure, one.ref]]),
      },
    };
  }, made);
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
  frame: Pick<Frame, "throwTo">,
) => {
  const uncaught = apply("Assert", [boolean(false), string(name)]);
  return frame.throwTo === undefined
    ? leaf(uncaught)
    : frame.throwTo(path, { value: translateEngineError(name, node, context), uncaught });
};

export const throwTypeError = (
  path: Path,
  node: ts.Node,
  context: Context,
  frame: Pick<Frame, "throwTo">,
) => throwError("TypeError", path, node, context, frame);

// Names a value after a statement changes it, so that later statements read the name rather than
// repeat what made the value.
const shareBinding = (
  path: Path,
  symbol: ts.Symbol | undefined,
  base: string,
  context: Context,
  continueWith: (path: Path) => Formula,
) => {
  const value = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
  if (symbol === undefined || value === undefined || value.kind === "Identifier") {
    return continueWith(path);
  }
  const name = context.names.getFresh(base);
  return bindOnce(
    path,
    name,
    value,
    continueWith({
      ...path,
      scope: {
        ...path.scope,
        bindings: new Map([...path.scope.bindings, [symbol, identifier(name)]]),
      },
    }),
  );
};

// Names the heap after a statement changes it, so that later statements share it. A statement that
// leaves it as it was keeps its binding, so that a join after the statement finds it unchanged.
const shareHeap = (
  before: Path,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
) =>
  context.heap !== undefined &&
  path.scope.bindings.get(context.heap) === before.scope.bindings.get(context.heap)
    ? continueWith(path)
    : shareBinding(path, context.heap, "heap", context, continueWith);

// A new of a value that isn't a class that the script declares, such as a built-in method, which
// throws a TypeError if the value isn't a constructor. tla-ts can't call one that is.
const isForeignConstruction = (node: ts.Node, context: Context): node is ts.NewExpression =>
  ts.isNewExpression(node) &&
  context.heap !== undefined &&
  getNewClass(node, context) === undefined &&
  getErrorClass(getSymbol(node.expression, context.checker), context.checker) === undefined &&
  !["Set", "Map"].includes(node.expression.getText()) &&
  !isProxyOperation(node, context);

// A foreign new whose arguments are values that can't throw.
const isForeignNew = (node: ts.Node, context: Context): node is ts.NewExpression =>
  isForeignConstruction(node, context) && (node.arguments ?? []).every(isInertValue);

const translateForeignNew = (
  expression: ts.NewExpression,
  path: Path,
  context: Context,
  frame: Frame,
) => {
  const callee = translateExpression(getCast(expression.expression), path.scope, context);
  const constructed = ifThenElse(
    useJavaScript("IsConstructor", [getHeap(path.scope, expression, context), callee], context),
    leaf(apply("Assert", [boolean(false), string("tla-ts can't call this constructor")])),
    throwTypeError(path, expression, context, frame),
  );
  const argument =
    expression.arguments?.length === 1 ? skipCasts(expression.arguments[0]) : undefined;
  const length =
    argument === undefined
      ? undefined
      : ts.isNumericLiteral(argument)
        ? Number(argument.text)
        : ts.isPrefixUnaryExpression(argument) &&
            argument.operator === ts.SyntaxKind.MinusToken &&
            ts.isNumericLiteral(argument.operand)
          ? -Number(argument.operand.text)
          : undefined;
  // Array's constructor throws a RangeError where its one argument is a number but not a length.
  return length === undefined || (Number.isInteger(length) && length >= 0 && length < 2 ** 32)
    ? constructed
    : ifThenElse(
        useJavaScript(
          "SameValue",
          [callee, translateBuiltInValue("Array", expression, context)],
          context,
        ),
        throwError("RangeError", path, expression, context, frame),
        constructed,
      );
};

// A var holds undefined, or what its parameter binds, from where its function or its script
// starts, so its declaration without a value runs nothing, unless it's a state variable whose value
// the script hasn't yet given.
const isUnrun = (declaration: ts.VariableDeclaration, path: Path, context: Context) => {
  const symbol =
    declaration.initializer === undefined &&
    ts.isIdentifier(declaration.name) &&
    ts.isVariableDeclarationList(declaration.parent) &&
    (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0
      ? getSymbol(declaration.name, context.checker)
      : undefined;
  return (
    symbol !== undefined &&
    (path.scope.bindings.get(symbol) !== context.variables.get(symbol) ||
      (symbol.declarations ?? []).some(ts.isParameter))
  );
};

export const translateDeclarations = (
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  if (declarations.length === 0) return continueWith(path);
  const declaration = declarations[0];
  const initializer = declaration.initializer;
  if (isUnrun(declaration, path, context)) {
    return translateDeclarations(declarations.slice(1), path, context, frame, continueWith);
  }

  const createThrows =
    initializer === undefined ? undefined : getArrayCreateThrows(initializer, path, context);
  if (initializer !== undefined && createThrows !== undefined) {
    return ifThenElse(
      createThrows,
      throwError("RangeError", path, initializer, context, frame),
      translateCheckedDeclarations(declarations, path, context, frame, continueWith),
    );
  }
  // An initializer that reads a property of a name throws where the read runs %ThrowTypeError%, as
  // a strict function's caller does, or a getter of a buffer or a view on another kind of object.
  const checked = translateCheckedDeclarations(declarations, path, context, frame, continueWith);
  const read = initializer === undefined ? undefined : skipCasts(initializer);
  return initializer !== undefined &&
    read !== undefined &&
    !path.scope.results.has(initializer) &&
    ts.isPropertyAccessExpression(read) &&
    ts.isIdentifier(skipCasts(read.expression))
    ? throwReadError(initializer, path, context, frame, checked)
    : checked;
};

const translateCheckedDeclarations = (
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const declaration = declarations[0];
  const initializer = declaration.initializer;
  // An assignment that a later declaration's initializer evaluates first runs after the
  // declarations before it.
  const hoisted =
    initializer === undefined
      ? undefined
      : getLeadingAssignment(initializer, path.scope.results, context);
  if (initializer !== undefined && hoisted !== undefined) {
    const earlier = getEarlierReads(hoisted, initializer, path.scope, context);
    return runAssignment(hoisted, path, context, frame, (after, value) =>
      translateDeclarations(
        declarations,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, ...earlier, [hoisted, value]]),
          },
        },
        context,
        frame,
        continueWith,
      ),
    );
  }
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
    (isGeneratorType(initializer, context) || isBuiltInIteratorType(initializer, context))
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
  const made = initializer && skipCasts(initializer);
  if (made !== undefined && getIntlError(made, context) !== undefined) {
    return translateIntlError(made, path, context, frame);
  }
  const madeBuffer = made && getBufferConstruction(made, context);
  if (made !== undefined && madeBuffer !== undefined) {
    return translateNewBufferStatement(made, madeBuffer, path, context, frame, (after, value) =>
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
      const bound = bindOnce(
        after,
        name,
        value,
        shareBinding(after, removed?.symbol, "changed", context, (shared) =>
          bindDeclaration(declarations, identifier(name), shared, context, frame, continueWith),
        ),
      );
      return removed?.missing === undefined
        ? throwCallerError(initializer, allocated, context, frame, bound)
        : ifThenElse(
            removed.missing,
            throwTypeError(allocated, initializer, context, frame),
            bound,
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

// Runs the first default in a pattern that assigns, as a statement where the value that its
// binding takes is undefined, which binding the pattern with the defaults skipped gives, and then
// binds the pattern again with its value.
const runAssigningDefault = (
  name: ts.BindingName,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula | undefined => {
  const elements = findNodes(name, ts.isBindingElement);
  const pending = elements.flatMap((element) => {
    const assignment = element.initializer && skipCasts(element.initializer);
    return assignment !== undefined &&
      isAssignment(assignment) &&
      !path.scope.results.has(assignment)
      ? [{ element, assignment }]
      : [];
  });
  const assigning = pending.at(0)?.element;
  const assignment = pending.at(0)?.assignment;
  if (assigning === undefined || assignment === undefined) return undefined;
  if (!ts.isIdentifier(skipCasts(getWritten(assignment) ?? assignment))) {
    throw new TlaTypeScriptError("tla-ts can't run a default that writes a property", assignment);
  }
  const symbol = ts.isIdentifier(assigning.name)
    ? getSymbol(assigning.name, context.checker)
    : undefined;
  const bound = new Set(
    elements.flatMap((element) =>
      ts.isIdentifier(element.name) ? (getSymbol(element.name, context.checker) ?? []) : [],
    ),
  );
  if (getSymbols(assignment, context).some((inner) => bound.has(inner))) {
    throw new TlaTypeScriptError("tla-ts can't run this default before what it binds", assignment);
  }
  // The defaults before it take what they read as the pattern binds, after it runs.
  rejectEarlyRun(
    assignment,
    [assignment],
    elements
      .slice(0, elements.indexOf(assigning))
      .flatMap((element) => element.initializer ?? [])
      .filter((initializer) => !path.scope.results.has(skipCasts(initializer))),
    path,
    context,
  );
  // The getters that the pattern reads run before it binds, so none may follow the default.
  if (
    elements.slice(elements.indexOf(assigning) + 1).some((element) => path.scope.read?.has(element))
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a default that assigns before the getters that follow it",
      assignment,
    );
  }
  const skipped = bindPattern(
    name,
    value,
    {
      ...path.scope,
      results: new Map([
        ...path.scope.results,
        ...pending.map((entry): [ts.Expression, Expression] => [
          entry.assignment,
          getUndefined(context),
        ]),
      ]),
    },
    context,
  );
  const part = symbol && skipped.scope.bindings.get(symbol);
  if (part === undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't run a default that assigns where a nested pattern takes its value",
      assignment,
    );
  }
  const withDefault = (after: Path, result: Expression) =>
    continueWith({
      ...after,
      scope: { ...after.scope, results: new Map([...after.scope.results, [assignment, result]]) },
    });
  return letIn(
    skipped.definitions,
    ifThenElse(
      apply("=", [part, getUndefined(context)]),
      runAssignment(assignment, path, context, frame, withDefault),
      withDefault(path, getUndefined(context)),
    ),
  );
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
  const defaulted = runAssigningDefault(declaration.name, value, path, context, frame, (after) =>
    bindDeclaration(declarations, value, after, context, frame, continueWith),
  );
  if (defaulted !== undefined) return defaulted;
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
    (ts.isForOfStatement(node) || ts.isForInStatement(node)) &&
    !ts.isVariableDeclarationList(node.initializer)
      ? node.initializer
      : getWritten(node);
  // A write to a property of an object in the heap changes the heap, not the name that holds it.
  const assigned =
    written === undefined
      ? []
      : getWrittenRoots(written).flatMap((root) => {
          const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
          // A parameter that an arguments object maps holds its value on the heap.
          const owner = getParameterOwner(symbol);
          if (
            context.heap !== undefined &&
            owner !== undefined &&
            isMappedArguments(owner, context)
          ) {
            return [symbol, context.heap].flatMap((changed) => changed ?? []);
          }
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
  // A var's declaration that gives it a value, or that a for-in or a for-of binds, writes it.
  const declared =
    ts.isVariableDeclaration(node) &&
    ts.isVariableDeclarationList(node.parent) &&
    (node.parent.flags & ts.NodeFlags.BlockScoped) === 0 &&
    (node.initializer !== undefined ||
      ts.isForInStatement(node.parent.parent) ||
      ts.isForOfStatement(node.parent.parent))
      ? getBoundNames(node.name).flatMap((name) => getSymbol(name, context.checker) ?? [])
      : [];
  const isObjectMade = isMade(node, context);
  const isErrorMade = isObjectMade && isNewError(node, context);
  // An operation that converts an object runs its valueOf and toString methods, as does a definition
  // of an array's length.
  const conversions =
    (ts.isExpression(node) && getConversion(node, context) !== undefined) ||
    (isObjectChange(node, context) && mayDefineObjectLength(node, context)) ||
    isIndexConvertingNew(node, context) ||
    isObjectDateCall(node, context) ||
    getConvertedViewValues(node, context) !== undefined ||
    getConvertedAtomicsValues(node, context) !== undefined ||
    getConvertedSubarrayValues(node, context) !== undefined
      ? getConversionFunctions(node, context)
      : undefined;
  // A definition that reads its descriptor's fields, a read of a key with getters, or an
  // operation on a proxy, which runs its traps, runs them.
  const getters = [
    ...getTrapFunctions(node, context),
    ...getDescriptorGetters(node, context),
    ...getOwnValuesGetters(node, context),
    ...getStringifyGetters(node, context),
    ...getReadFunctions(node, context),
    ...getLoopGetters(node, context),
    ...getRemovedGetters(node, context),
    ...getStoredLengthConversions(node, context),
    ...getRegExpProtocolAccessors(node, context),
    ...getNewTargetGetters(node, context),
    ...getViewSpeciesGetters(node, context),
    ...(written === undefined ? [] : getRestCopyGetters(written, context)),
  ];
  // A pattern that destructures an object, or a for-of, a spread, a yield*, or new of a typed array
  // that iterates one, runs the functions of the object's iterator.
  const isIterated =
    (ts.isArrayBindingPattern(node) &&
      (isIteratedPattern(node, context) || isIterablePattern(node, context))) ||
    isCaughtIteration(node, context) ||
    (written !== undefined &&
      ts.isArrayLiteralExpression(written) &&
      (isIteratedPattern(written, context) || isIterablePattern(written, context))) ||
    (ts.isSpreadElement(node) &&
      getKind(node.expression, context) !== "sequence" &&
      isIterableValue(node.expression, context)) ||
    // A yield* iterates what it casts as the value itself.
    (ts.isYieldExpression(node) &&
      node.asteriskToken !== undefined &&
      node.expression !== undefined &&
      getKind(getCast(node.expression), context) !== "sequence" &&
      isIterableValue(getCast(node.expression), context)) ||
    (ts.isForOfStatement(node) &&
      getKind(node.expression, context) !== "sequence" &&
      isIterableValue(node.expression, context)) ||
    getIterableFrom(node, context) !== undefined ||
    getIterableFrom(node, context, "fromEntries") !== undefined ||
    (ts.isExpression(node) && isIteratedTypedArray(node, context));
  // A method call on a generator object, a call it's passed to, or a pattern, a for-of, a spread,
  // or a yield* that iterates one resumes the body of a generator that may have made it.
  const isResumed =
    (ts.isCallExpression(node) &&
      ((ts.isPropertyAccessExpression(node.expression) &&
        mayBeGeneratorType(node.expression.expression, context)) ||
        node.arguments.some((argument) => mayBeGeneratorType(argument, context)))) ||
    (ts.isArrayBindingPattern(node) && mayBeGeneratorType(node, context)) ||
    (ts.isBinaryExpression(node) &&
      ts.isArrayLiteralExpression(node.left) &&
      mayBeGeneratorType(node.right, context)) ||
    ((ts.isSpreadElement(node) || ts.isYieldExpression(node) || ts.isForOfStatement(node)) &&
      node.expression !== undefined &&
      mayBeGeneratorType(node.expression, context));
  // A DisposableStack's method may run the functions that the stacks dispose with.
  const isStackCall = getStackCall(node, context) !== undefined;
  // An iterator's dispose method runs the return method that the script may write, or its getter.
  const isIteratorDispose = getIteratorDisposeCall(node, context) !== undefined;
  // A using declaration runs the dispose methods, and their getters, that the script writes, and
  // what the DisposableStacks it may hold dispose.
  const list = ts.isVariableDeclaration(node) ? node.parent : node;
  const isUsing = ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Using) !== 0;
  const isHeapChanged =
    getArgumentsOwner(node, context.checker) !== undefined ||
    (isObjectMade && !isErrorMade) ||
    (ts.isBindingElement(node) &&
      (context.heapCollections.has(node) ||
        (node.dotDotDotToken !== undefined && ts.isObjectBindingPattern(node.parent)))) ||
    (ts.isObjectLiteralExpression(node) && !isArrayFromLength(node, context)) ||
    ts.isDeleteExpression(node) ||
    isObjectChange(node, context) ||
    isRevoke(node, context) ||
    isProxyOperation(node, context) ||
    getDateCall(node, context) !== undefined ||
    getHeapRegExpCall(node, context) !== undefined ||
    getRegExpProtocolCall(node, context) !== undefined ||
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
    isIteratorDispose ||
    isStackConstruction(node, context) ||
    isUsing;
  const callees = ts.isCallExpression(node)
    ? [node.expression, ...node.arguments]
    : ts.isTaggedTemplateExpression(node)
      ? [node.tag, ...getSubstitutions(node)]
      : [];
  return {
    changed: [
      ...assigned,
      ...declared,
      ...(context.heap !== undefined && isHeapChanged ? [context.heap] : []),
    ],
    isErrorMade: context.heap !== undefined && isErrorMade,
    called: [
      ...(conversions ?? []),
      ...getters,
      ...(isIterated ? getIteratorFunctions(node, context) : []),
      // Object.fromEntries reads each entry's key and value, and converts the key.
      ...(getIterableFrom(node, context, "fromEntries") === undefined
        ? []
        : [
            ...getWrittenFunctions(node, "0", context),
            ...getWrittenFunctions(node, "1", context),
            ...getConversionFunctions(node, context),
          ]),
      // A yield* passes a throw that resumes its generator to the iterator's throw.
      ...(isIterated && ts.isYieldExpression(node)
        ? getWrittenFunctions(node, "throw", context)
        : []),
      ...(isResumed
        ? findNodes(
            node.getSourceFile(),
            (inner): inner is FunctionNode =>
              (ts.isFunctionDeclaration(inner) ||
                ts.isFunctionExpression(inner) ||
                ts.isMethodDeclaration(inner)) &&
              inner.asteriskToken !== undefined,
          )
        : []),
      ...(isStackCall || isUsing ? getStackFunctions(node, context) : []),
      ...(isObjectChange(node, context) && isReflectSet(node) ? getSetters(node, context) : []),
      ...(isIteratorDispose ? getWrittenFunctions(node, "return", context) : []),
      ...(isIteratorDispose ? getMethods(node, "return", context, true) : []),
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

// A node's place in its file, which tells it apart from every other node.
const getNodeKey = (node: ts.Node) =>
  `${node.getSourceFile().fileName}:${node.pos}:${node.end}:${node.kind}`;

// What a function changes, with what the functions that it runs change, where the bindings give
// the functions that its parameters hold. The functions that run one another, a strongly connected
// component of the call graph, change the same things, so they share one summary, which Tarjan's
// algorithm makes once the components that they run have theirs.
const summarize = (
  root: ts.Node,
  bindings: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
) => {
  const key = [...bindings]
    .map((entry) => {
      const declaration = entry[0].valueDeclaration;
      return `${declaration === undefined ? entry[0].name : getNodeKey(declaration)}=${getNodeKey(entry[1])}`;
    })
    .sort()
    .join(",");
  const summaries = context.changeSummaries.get(key) ?? new Map<ts.Node, ChangeSummary>();
  context.changeSummaries.set(key, summaries);
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
      found.push(getEffects(inner, bindings, context));
      ts.forEachChild(inner, visit);
    };
    visit(node);
    effects.set(node, found);
    found.forEach((effect) =>
      effect.called.forEach((called) => {
        if (summaries.has(called)) return;
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
      effect.called.flatMap((called) => summaries.get(called) ?? []),
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
    component.forEach((member) => summaries.set(member, summary));
    return summary;
  };
  return summaries.get(root) ?? connect(root);
};

// What a function changes where a path binds functions to parameters. Its summary takes the
// bindings of the parameters that it, or a function bound to one of them, calls or passes, and no
// others, so that paths that bind other parameters share it.
const getSummary = (
  root: ts.Node,
  functions: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
) => {
  const bindings = new Map<ts.Symbol, FunctionNode>();
  const pending = [root];
  const seen = new Set<ts.Node>();
  while (pending.length > 0) {
    const current = pending.pop() ?? root;
    if (seen.has(current)) continue;
    seen.add(current);
    summarize(current, NO_FUNCTIONS, context)?.parameters.forEach((parameter) => {
      const bound = functions.get(parameter);
      if (bound === undefined) return;
      bindings.set(parameter, bound);
      pending.push(bound);
    });
  }
  return summarize(root, bindings, context);
};

// What a node may change, with the functions that it runs, where functions binds the parameters
// that hold them.
export const findChanged = (
  loop: ts.Node,
  functions: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
  isIdentityIgnored = false,
) => {
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
      const summary = getSummary(called, functions, context);
      if (summary === undefined) visit(called);
      else add(summary);
    });
    ts.forEachChild(node, visit);
  };
  visit(loop);
  return changed;
};

export const getChanged = (
  loop: ts.Node,
  path: Path,
  context: Context,
  isIdentityIgnored = false,
) => {
  const changed = findChanged(loop, path.scope.functions, context, isIdentityIgnored);
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
  ([...generators].every((entry) => {
    const previous = before.get(entry[0]);
    return (
      previous !== undefined &&
      (entry[1] === previous ||
        (entry[1].ref === previous.ref &&
          entry[1].resume === undefined &&
          entry[1].caller === undefined &&
          entry[1].queue.length === 0))
    );
  }) &&
    [...before].every((entry) => generators.has(entry[0]) || entry[1].isRestartable === true));

export const translateJoined = (
  node: ts.Node,
  path: Path,
  context: Context,
  continueWith: (path: Path, value?: Expression) => Formula,
  translateWith: (next: (inner: Path, value?: Expression) => Formula) => Formula,
  changed = getChanged(node, path, context),
): Formula => {
  if (context.heap === undefined) return translateWith(continueWith);
  const isVar = (declaration: ts.VariableDeclaration) =>
    ts.isVariableDeclarationList(declaration.parent) &&
    (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0;
  // The functions in the statement that read a binding that it declares from outside them.
  const getClosures = (symbol: ts.Symbol, declaration: ts.VariableDeclaration) =>
    findNodes(
      node,
      (inner): inner is ts.Identifier =>
        ts.isIdentifier(inner) && getSymbol(inner, context.checker) === symbol,
    ).flatMap(
      (inner) =>
        ts.findAncestor(inner, (ancestor) =>
          ancestor === node
            ? "quit"
            : ts.isFunctionLike(ancestor) &&
              ts.findAncestor(declaration, (outer) => outer === ancestor) === undefined,
        ) ?? [],
    );
  // A var that the statement declares outlives it, as does any binding it declares that a function
  // in it captures, such as a catch's error.
  const isVarInside = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    return (
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.findAncestor(declaration, (ancestor) => ancestor === node) !== undefined &&
      (isVar(declaration) || getClosures(symbol, declaration).length > 0)
    );
  };
  // A binding that the statement itself declares, which a function made after the declaration
  // captures, goes on as a parameter of the operator. A path that doesn't declare it passes
  // undefined, as it made none of the functions that read it.
  const captured = findNodes(node, ts.isVariableDeclaration).flatMap((declaration) => {
    const symbol = ts.isIdentifier(declaration.name)
      ? getSymbol(declaration.name, context.checker)
      : undefined;
    if (
      symbol === undefined ||
      isVar(declaration) ||
      ts.findAncestor(declaration, (ancestor) =>
        ancestor === node ? "quit" : ts.isFunctionLike(ancestor),
      ) !== undefined
    ) {
      return [];
    }
    const closures = getClosures(symbol, declaration);
    return closures.length > 0 &&
      closures.every(
        (closure) => !ts.isFunctionDeclaration(closure) && closure.pos >= declaration.end,
      )
      ? [symbol]
      : [];
  });
  const passed = [...changed, ...captured];
  const name = context.names.getFresh("Join");
  const parameters = passed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const result = context.names.getFresh("result");
  const isKept = (bindings: Map<ts.Symbol, Expression>) =>
    [...bindings].every((entry) =>
      path.scope.bindings.has(entry[0])
        ? path.scope.bindings.get(entry[0]) === entry[1] || changed.includes(entry[0])
        : !isVarInside(entry[0]) || captured.includes(entry[0]),
    );
  // What follows holds the functions held before, so each exit holds the same ones for each name
  // that code after the statement can read. That leaves out the names that the statement declares
  // and that don't outlive it, and those of the functions it called.
  const isReadAfter = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    if (declaration === undefined) return true;
    if (ts.findAncestor(declaration, (ancestor) => ancestor === node) !== undefined) {
      return isVarInside(symbol);
    }
    const owner = ts.findAncestor(declaration.parent, ts.isFunctionLike);
    return (
      owner === undefined || ts.findAncestor(node, (ancestor) => ancestor === owner) !== undefined
    );
  };
  // A name that the operator takes may hold other functions on its exits than before, where each
  // that it holds has a value, which it passes. Code after the statement calls the function as it
  // calls any that a value holds.
  const getHeldValue = (functions: Map<ts.Symbol, FunctionNode>, symbol: ts.Symbol) => {
    const held = functions.get(symbol);
    return held && getFunctionValue(held, context);
  };
  const isHeldAsBefore = (functions: Map<ts.Symbol, FunctionNode>) =>
    [...new Set([...path.scope.functions.keys(), ...functions.keys()])].every(
      (symbol) =>
        !isReadAfter(symbol) ||
        functions.get(symbol) === path.scope.functions.get(symbol) ||
        passed.includes(symbol),
    );
  const getPassed = (inner: Path, symbol: ts.Symbol) => {
    const value = getHeldValue(inner.scope.functions, symbol);
    return value === undefined
      ? inner.scope.bindings.get(symbol)
      : translateFunctionValue(value, context);
  };
  const exits: { path: Path; value?: Expression }[] = [];
  const joined = translateWith((inner, value) => {
    exits.push({ path: inner, value });
    const values = [
      ...changed.flatMap((symbol) => getPassed(inner, symbol) ?? []),
      ...captured.map((symbol) => getPassed(inner, symbol) ?? getUndefined(context)),
      value ?? getUndefined(context),
    ];
    // Each value binds before the call, as an argument that the operator reads again after the
    // state changes evaluates again, and so does each argument that it was made of, once per read.
    const names = values.map((passedValue) =>
      inner.isLooping || ["Identifier", "Number", "String"].includes(passedValue.kind)
        ? undefined
        : context.names.getFresh("joined"),
    );
    return names.reduceRight<Formula>(
      (rest, bound, position) =>
        bound === undefined ? rest : bindValue(bound, values[position], rest),
      leaf(
        call(
          name,
          values.map((passedValue, position) => {
            const bound = names[position];
            return bound === undefined ? passedValue : identifier(bound);
          }),
        ),
      ),
    );
  });
  // Each exit leaves the generators as the first does, which may have completed them. Where they
  // differ only in the done array's or string's iterators that the statement made, the code after
  // it holds none of those, as a later step makes their suspensions again.
  const getSettled = (generators: Path["generators"]) =>
    new Map(
      [...generators].filter(
        (entry) =>
          path.generators.has(entry[0]) ||
          entry[1].isRestartable !== true ||
          entry[1].resume !== undefined,
      ),
    );
  const isSameEntries = (left: Path["generators"], right: Path["generators"]) =>
    left.size === right.size && [...left].every((entry) => right.get(entry[0]) === entry[1]);
  const pruned = exits.every((exit) => exit.path.generators === exits[0].path.generators)
    ? undefined
    : getSettled(exits[0].path.generators);
  const settled =
    pruned === undefined
      ? exits[0]?.path.generators
      : isSameEntries(pruned, path.generators)
        ? path.generators
        : pruned;
  const isJoinable = exits.every(
    (exit) =>
      changed.every((symbol) => exit.path.scope.bindings.has(symbol)) &&
      settled !== undefined &&
      (exit.path.generators === settled ||
        isSameEntries(getSettled(exit.path.generators), settled)) &&
      isCompletedFrom(settled, path.generators) &&
      exit.path.tasks === path.tasks &&
      exit.path.disposal === path.disposal &&
      // Each exit initialized the this of the same constructors.
      (exit.path.unboundThis?.size ?? 0) === (exits[0].path.unboundThis?.size ?? 0) &&
      [...(exit.path.unboundThis ?? [])].every((constructor) =>
        exits[0].path.unboundThis?.has(constructor),
      ) &&
      isKept(exit.path.scope.bindings) &&
      isHeldAsBefore(exit.path.scope.functions),
  );
  const unheld = passed.filter((symbol) =>
    exits.some(
      (exit) => exit.path.scope.functions.get(symbol) !== path.scope.functions.get(symbol),
    ),
  );
  if (
    !isJoinable ||
    !unheld.every((symbol) =>
      exits.every(
        (exit) =>
          !exit.path.scope.functions.has(symbol) ||
          getHeldValue(exit.path.scope.functions, symbol) !== undefined,
      ),
    )
  ) {
    return translateWith(continueWith);
  }
  if (exits.length === 0) return joined;
  const isValued = exits.some((exit) => exit.value !== undefined);
  const rest = continueWith(
    {
      ...path,
      generators: settled ?? exits[0].path.generators,
      unboundThis: exits[0].path.unboundThis,
      scope: {
        ...path.scope,
        functions: new Map([...path.scope.functions].filter((entry) => !unheld.includes(entry[0]))),
        bindings: new Map([
          ...path.scope.bindings,
          ...passed.map((symbol, position): [ts.Symbol, Expression] => [
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
  const sortArguments = translateSortArguments(comparator, path.scope, context);
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
          useJavaScript("SortSequence", [items, ...sortArguments], context),
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
    return allocateAll(getPatternAllocated(declared, context), path, context, (allocated) =>
      assignPatternWith(
        declared.parent,
        declared,
        undefined,
        element,
        allocated,
        context,
        frame,
        (after) => {
          if (context.heap === undefined) return continueWith(after);
          const heap = getHeap(after.scope, declared, context);
          return ifThenElse(apply("=", [heap, heap]), continueWith(after), leaf(boolean(false)));
        },
      ),
    );
  }
  if (declared.declarations.length !== 1) {
    throw new TlaTypeScriptError("Declare one element of a for-of", declared);
  }
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
  const keyed = runFirstKey(name, element, path, context, frame, (after) =>
    bindElement(declared, element, source, after, context, frame, continueWith),
  );
  if (keyed !== undefined) return keyed;
  const taken =
    ts.isArrayBindingPattern(name) &&
    takeFromIterator(name, element, path, context, frame, (after, values) =>
      bindElement(declared, values, source, after, context, frame, continueWith),
    );
  if (taken) return taken;
  const assigned = runAssigningDefault(name, element, path, context, frame, (after) =>
    bindElement(declared, element, source, after, context, frame, continueWith),
  );
  if (assigned !== undefined) return assigned;
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
    if (
      context.heap !== undefined &&
      (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0
    ) {
      return getAnyProperty(
        getHeap(path.scope, inner, context),
        element,
        string(key.text),
        context,
      );
    }
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
    if (!isFirstRun([name], first.call, path, context)) {
      throw new TlaTypeScriptError(
        "tla-ts can't run this call before what its pattern evaluates first",
        first.call,
      );
    }
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
            startIteration(loop, current),
            context,
            bodyFrame,
            (bound, innerFrame) =>
              translateStatements([loop.statement], bound, context, innerFrame),
          );
        return isResult && value !== undefined
          ? readValue(loop.expression, value, after, context, frame, runBody)
          : runBody(after, value ?? getUndefined(context));
      });
    return next(
      isBuiltInIteratorType(iterated, context)
        ? withBuiltInIterator(loop.expression, start, receiver, context)
        : start,
    );
  };
  const created = ts.isCallExpression(iterated)
    ? getCreatedGenerator(iterated, path, context)
    : undefined;
  if (created !== undefined && ts.isCallExpression(iterated)) {
    return translateGeneratorCall(iterated, created, path, context, frame, (after, ref) =>
      iterate(after, ref ?? getUndefined(context)),
    );
  }
  // A for-of over the helper or the iterator that a call makes, such as Iterator.from's, runs the
  // call first.
  if (
    ts.isCallExpression(iterated) &&
    !path.scope.results.has(iterated) &&
    isStatementCall(iterated, path, context)
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
// iteration reads its element where the array would have held it. An element may also call such a
// name with literals, which makes a generator object and runs none of its code, so that making it
// where the iteration reads it does the same, or be a literal or an array of them, where a default
// of the pattern may give a generator or the body resumes one instead.
const isTakingFromGenerators = (loop: ts.ForOfStatement, context: Context) => {
  const iterated = getCast(loop.expression);
  const pattern = getArrayHead(loop);
  const isLiteral = (node: ts.Expression): boolean =>
    ts.isLiteralExpression(node) ||
    (ts.isArrayLiteralExpression(node) && node.elements.every(isLiteral));
  const isFixed = (node: ts.Expression) => {
    const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
    return (
      symbol !== undefined &&
      symbol.valueDeclaration !== undefined &&
      !isAssigned(symbol, node.getSourceFile(), context)
    );
  };
  return (
    loop.awaitModifier === undefined &&
    ts.isArrayLiteralExpression(iterated) &&
    iterated.elements.every(
      (element) =>
        isFixed(element) ||
        isLiteral(element) ||
        (ts.isCallExpression(element) &&
          isGeneratorType(element, context) &&
          isFixed(element.expression) &&
          element.arguments.every(ts.isLiteralExpression)),
    ) &&
    ((pattern !== undefined &&
      (iterated.elements.some((element) => isGeneratorType(element, context)) ||
        findNodes(pattern, ts.isBindingElement).some(
          (element) =>
            element.initializer !== undefined && mayBeGeneratorType(element.initializer, context),
        ))) ||
      findNodes(
        loop.statement,
        (node): node is ts.CallExpression =>
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          isGeneratorType(node.expression.expression, context),
      ).length > 0)
  );
};

// The path where an unrolled iteration of a loop starts. What an iteration before it evaluated or
// made of the loop's own code belongs to that iteration, not to this one, which calls anew.
const startIteration = (loop: ts.IterationStatement, path: Path): Path => {
  const isOwn = (entry: [ts.Node, Expression]) =>
    ts.findAncestor(
      entry[0],
      (ancestor) =>
        ancestor === loop.statement || (ts.isForOfStatement(loop) && ancestor === loop.initializer),
    ) !== undefined;
  return {
    ...path,
    scope: {
      ...path.scope,
      results: new Map([...path.scope.results].filter((entry) => !isOwn(entry))),
      allocated: new Map([...path.scope.allocated].filter((entry) => !isOwn(entry))),
    },
  };
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
  if (!ts.isArrayLiteralExpression(iterated)) {
    throw new TlaTypeScriptError("Unsupported for-of", loop);
  }
  const iterate = (previous: Path, position: number): Formula => {
    if (position === iterated.elements.length) return continueWith(previous);
    const current = startIteration(loop, previous);
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
    if (pattern === undefined) {
      throw new TlaTypeScriptError("tla-ts can't follow a generator here", element);
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
            : runYielded(startIteration(loop, fulfilled), iteration.value, {
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
  // An array that a variable holds, which the script never changes, holds the elements that its
  // declaration wrote, other than generators, which taking from would make again.
  const declaration = ts.isIdentifier(iterated)
    ? getSymbol(iterated, context.checker)?.valueDeclaration
    : undefined;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration) && declaration.initializer
      ? getCast(declaration.initializer)
      : undefined;
  const written =
    initializer !== undefined &&
    ts.isArrayLiteralExpression(initializer) &&
    !isHeapArray(iterated, context) &&
    initializer.elements.every((element) => !isGeneratorType(element, context))
      ? initializer
      : undefined;
  if (written !== undefined) {
    const symbol = getSymbol(iterated, context.checker);
    if (
      symbol !== undefined &&
      getChanged(iterated.getSourceFile(), path, context).includes(symbol)
    ) {
      throw new TlaTypeScriptError("Don't change an array while a for-of iterates it", iterated);
    }
  }
  const literal = ts.isArrayLiteralExpression(iterated) ? iterated : written;
  if (literal === undefined) {
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
  if (literal.elements.some((element) => ts.isSpreadElement(element))) {
    throw new TlaTypeScriptError("for await iterates only arrays and async generators", literal);
  }
  const sequence = context.names.getFresh("sequence");
  const tick = (current: Path, next: (path: Path) => Formula) =>
    awaitTo(current, getUndefined(context), undefined, next, next);
  // An array pattern takes its values from a generator element through the generator's next,
  // which the array then doesn't hold.
  const isTaken = (element: ts.Expression) =>
    pattern !== undefined && !ts.isOmittedExpression(element) && isGeneratorType(element, context);
  const iterate = (previous: Path, position: number): Formula => {
    if (position === literal.elements.length) {
      return tick(previous, (resumed) => tick(resumed, continueWith));
    }
    const current = startIteration(loop, previous);
    const element = literal.elements[position];
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
          literal.elements.some(isTaken)
            ? tuple(
                literal.elements.map((element) =>
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

// A generator's for-of over an array written in place whose head or body yields, which runs its
// iterations one after another, as a yield suspends the body between them. Nothing else holds the
// array, so its elements stay as the loop starts, and its iterator has no return to close.
const translateYieldingForOf = (
  loop: ts.ForOfStatement,
  literal: ts.ArrayLiteralExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const sequence = context.names.getFresh("sequence");
  const iterate = (previous: Path, position: number): Formula => {
    if (position === literal.elements.length) return continueWith(previous);
    const element = literal.elements[position];
    const next = (after: Path) => iterate(after, position + 1);
    const value = index(identifier(sequence), [number(position + 1)]);
    const current = startIteration(loop, previous);
    return keepHoles(
      loop,
      value,
      position,
      current,
      context,
      bindIteration(
        loop.initializer,
        value,
        ts.isOmittedExpression(element) ? undefined : element,
        current,
        context,
        { ...frame, next, continueTo: next, breakTo: continueWith },
        (bound, innerFrame) => translateStatements([loop.statement], bound, context, innerFrame),
      ),
    );
  };
  return allocate(loop.expression, path, context, (inner) =>
    letIn(
      [define(sequence, [], translateExpression(loop.expression, inner.scope, context))],
      iterate(inner, 0),
    ),
  );
};

// The most iterations of a generator's counted loop that tla-ts unrolls.
const UNROLL_LIMIT = 64;

// The values that a generator's for loop gives its counter, where a literal starts it, a comparison
// with a literal ends it, a step of a literal moves it, and nothing else writes it, with the value
// that a var keeps once the loop ends. tla-ts unrolls such a loop, whose iterations then suspend at
// each yield as straight code does.
const getCounts = (loop: ts.ForStatement, context: Context) => {
  const initializer = loop.initializer;
  const isVar =
    initializer !== undefined &&
    ts.isVariableDeclarationList(initializer) &&
    (initializer.flags & ts.NodeFlags.BlockScoped) === 0;
  const declaration =
    initializer !== undefined &&
    ts.isVariableDeclarationList(initializer) &&
    (isVar || (initializer.flags & ts.NodeFlags.Let) !== 0) &&
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
  // A var outlives each iteration, so a function that reads it would read a later value.
  const owner = ts.findAncestor(loop.parent, ts.isFunctionLike);
  const isCaptured =
    isVar &&
    owner !== undefined &&
    findNodes(owner, ts.isIdentifier).some(
      (node) => isCounter(node) && ts.findAncestor(node.parent, ts.isFunctionLike) !== owner,
    );
  if (
    isCaptured ||
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
  return length === -1
    ? undefined
    : { symbol, counts: values.slice(0, length), after: isVar ? values[length] : undefined };
};

// Whether a node yields outside the functions it holds.
const hasYield = (node: ts.Node): boolean =>
  ts.isYieldExpression(node) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasYield) ?? false));

// Whether a loop runs until something in it leaves, as while (true) or for (;;).
const isForever = (loop: ts.IterationStatement) =>
  (ts.isWhileStatement(loop) && loop.expression.kind === ts.SyntaxKind.TrueKeyword) ||
  (ts.isForStatement(loop) &&
    loop.initializer === undefined &&
    loop.condition === undefined &&
    loop.incrementor === undefined);

// Runs a generator's loop that yields as its iterations, one after another: a counted loop's with
// the counter each one reads, or a loop that runs until something leaves it, which tla-ts follows
// as far as the generator's caller steps it.
const translateUnrolled = (
  loop: ts.IterationStatement,
  unrolled: ReturnType<typeof getCounts>,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const iterate = (current: Path, position: number): Formula => {
    if (unrolled === undefined && position >= UNROLL_LIMIT) {
      throw new TlaTypeScriptError(
        `tla-ts can't run more than ${UNROLL_LIMIT} iterations of a generator's loop`,
        loop,
      );
    }
    const count = unrolled?.counts.at(position);
    if (unrolled !== undefined && count === undefined) {
      return continueWith(
        unrolled.after === undefined
          ? current
          : {
              ...current,
              scope: {
                ...current.scope,
                bindings: new Map([
                  ...current.scope.bindings,
                  [unrolled.symbol, number(unrolled.after)],
                ]),
              },
            },
      );
    }
    const next = (after: Path) => iterate(after, position + 1);
    // Each iteration evaluates the body's expressions again, such as a yield it hoists.
    const started = startIteration(loop, current);
    return translateStatements(
      [loop.statement],
      unrolled === undefined || count === undefined
        ? started
        : {
            ...started,
            scope: {
              ...started.scope,
              bindings: new Map([...started.scope.bindings, [unrolled.symbol, number(count)]]),
            },
          },
      context,
      { ...frame, next, continueTo: next, breakTo: continueWith },
    );
  };
  return iterate(path, 0);
};

// The key that a built-in method reads of its receiver before anything else, where call runs it:
// concat its @@isConcatSpreadable, and Promise.prototype.catch the then that it invokes.
const getFirstRead = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  if (
    getArrayMethodCall(node, context) === "concat" &&
    ts.isPropertyAccessExpression(callee) &&
    ts.isPropertyAccessExpression(callee.expression)
  ) {
    return {
      owner: "Array.prototype" as const,
      method: "concat",
      key: useJavaScript("WellKnownSymbol", [string("isConcatSpreadable")], context),
    };
  }
  return ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call" &&
    ts.isPropertyAccessExpression(callee.expression) &&
    callee.expression.name.text === "catch" &&
    ts.isPropertyAccessExpression(callee.expression.expression) &&
    callee.expression.expression.name.text === "prototype" &&
    getBuiltIn(callee.expression.expression.expression, context) === "Promise"
    ? { owner: "Promise.prototype" as const, method: "catch", key: string("then") }
    : undefined;
};

// The getters that a script's descriptors give whose body only throws, which a built-in that reads
// one before it changes anything throws from where it reads it.
// Whether a getter may answer a read of an object that a literal makes: its own getters, and those
// that a descriptor defines, as on Object.prototype, but not another literal's.
const isReachedGetter = (getter: ts.Node, held: ts.Expression | undefined) => {
  const literal = held === undefined ? undefined : skipCasts(held);
  return (
    literal === undefined ||
    !ts.isObjectLiteralExpression(literal) ||
    literal.properties.some((property) => property.name?.getText() === "__proto__") ||
    !ts.isObjectLiteralExpression(getter.parent) ||
    getter.parent === literal
  );
};

const getThrowingGetters = (node: ts.Node, context: Context) =>
  [
    ...getAccessorFunctions(node, "get", context),
    ...findNodes(
      node.getSourceFile(),
      (inner): inner is ts.GetAccessorDeclaration =>
        ts.isGetAccessorDeclaration(inner) && ts.isObjectLiteralExpression(inner.parent),
    ),
  ].filter(
    (getter) =>
      getter.body !== undefined &&
      ts.isBlock(getter.body) &&
      getter.body.statements.length === 1 &&
      ts.isThrowStatement(getter.body.statements[0]) &&
      getParameters(getter).length === 0 &&
      getCandidateValue(getter, context) !== undefined,
  );

// Runs the getter whose code a built-in reads first, where it reads one and it only throws, which
// throws from there; otherwise runs the built-in.
export const throwFirstGetter = (
  node: ts.Node,
  isRead: Expression,
  code: Expression,
  receiver: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  otherwise: Formula,
  held?: ts.Expression,
) =>
  getThrowingGetters(node, context)
    .filter((getter) => isReachedGetter(getter, held))
    .reduceRight<Formula>(
      (rest, getter) =>
        ifThenElse(
          apply("/\\", [
            isRead,
            apply("=", [code, getCandidateValue(getter, context) ?? getUndefined(context)]),
          ]),
          inlineBody(
            node,
            getter,
            [],
            { value: receiver, method: getter },
            path,
            context,
            frame,
            () => otherwise,
          ),
          rest,
        ),
      otherwise,
    );

const translateLoop = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const isYielding = frame.yieldTo !== undefined && hasYield(loop.statement);
  const unrolled = isYielding && ts.isForStatement(loop) ? getCounts(loop, context) : undefined;
  if (unrolled !== undefined || (isYielding && isForever(loop))) {
    return translateUnrolled(loop, unrolled, path, context, frame, continueWith);
  }
  const literal = ts.isForOfStatement(loop) ? getCast(loop.expression) : undefined;
  if (
    ts.isForOfStatement(loop) &&
    frame.yieldTo !== undefined &&
    (isYielding || hasYield(loop.initializer)) &&
    literal !== undefined &&
    ts.isArrayLiteralExpression(literal) &&
    literal.elements.every(
      (element) => !ts.isSpreadElement(element) && !mayBeGeneratorType(element, context),
    )
  ) {
    return translateYieldingForOf(loop, literal, path, context, frame, continueWith);
  }
  const runLoop = (inner: Path) => translateIterations(loop, inner, context, frame, continueWith);
  // A for-of of an array whose first element a getter that only throws gives throws before its
  // first iteration, as the iterator's first next reads the element.
  if (
    ts.isForOfStatement(loop) &&
    loop.awaitModifier === undefined &&
    isHeapArray(loop.expression, context) &&
    getThrowingGetters(loop, context).length > 0
  ) {
    return allocate(loop.expression, path, context, (inner) => {
      const heap = getHeap(inner.scope, loop.expression, context);
      const array = translateExpression(loop.expression, inner.scope, context);
      return throwFirstGetter(
        loop.expression,
        apply("/\\", [
          holdsArrayIteration(heap, loop.expression, context, array),
          apply("#", [
            useJavaScript("FirstElementGetter", [heap, array], context),
            getUndefined(context),
          ]),
        ]),
        useJavaScript("FirstElementGetter", [heap, array], context),
        array,
        inner,
        context,
        frame,
        runLoop(inner),
      );
    });
  }
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
  if (!ts.isVariableDeclarationList(initializer)) {
    return allocate(initializer, path, context, (inner) =>
      translateExpressionStatement(initializer, inner, context, frame, runLoop),
    );
  }
  // A function that a let's initializer makes reads the bindings from before the first iteration,
  // which each iteration copies, so it reads the values that they had then.
  const heads =
    (initializer.flags & ts.NodeFlags.Let) === 0
      ? []
      : initializer.declarations.flatMap((declaration) =>
          getBoundNames(declaration.name).flatMap((name) => getSymbol(name, context.checker) ?? []),
        );
  const reads = initializer.declarations
    .flatMap((declaration) => findNodes(declaration, ts.isFunctionLike))
    .flatMap((made) => {
      const written = heads.find((head) => isAssigned(head, made, context));
      if (written !== undefined) {
        throw new TlaTypeScriptError(
          "tla-ts can't write a for's binding in a function that its initializer makes",
          made,
        );
      }
      return findNodes(made, ts.isIdentifier).filter((name) => {
        const symbol = getSymbol(name, context.checker);
        return symbol !== undefined && heads.includes(symbol);
      });
    });
  return translateDeclarations(initializer.declarations, path, context, frame, (inner) =>
    runLoop({
      ...inner,
      scope: {
        ...inner.scope,
        initialReads: new Map([
          ...(inner.scope.initialReads ?? []),
          ...reads.map((read): [ts.Expression, Expression] => [
            read,
            translateExpression(read, inner.scope, context),
          ]),
        ]),
      },
    }),
  );
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
  // A for-of over an array, or a set or a map that keeps its order, that the heap holds visits its
  // elements, as its iterator reads them.
  const ordered =
    iterated !== undefined && ts.isForOfStatement(iterated)
      ? getOrderedIteration(iterated.expression, context)
      : undefined;
  const isHeapIteration =
    iterated !== undefined &&
    ts.isForOfStatement(iterated) &&
    (isHeapArray(iterated.expression, context) || ordered !== undefined);
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
  // A for-in over a function that a script makes and the heap doesn't hold visits the enumerable
  // keys that it inherits from Function.prototype, but not its own length, name, and prototype.
  const ownFunctionKeys =
    iterated !== undefined && ts.isForInStatement(iterated)
      ? getOwnFunctionKeys(iterated.expression, context)
      : undefined;
  // A variable that only ever holds a built-in object, such as JSON.
  const heldSymbol =
    iterated !== undefined && ts.isIdentifier(iterated.expression)
      ? getSymbol(iterated.expression, context.checker)
      : undefined;
  const heldDeclaration = heldSymbol?.valueDeclaration;
  const isHeldBuiltIn =
    heldSymbol !== undefined &&
    heldDeclaration !== undefined &&
    ts.isVariableDeclaration(heldDeclaration) &&
    heldDeclaration.initializer !== undefined &&
    isBuiltInObject(heldDeclaration.initializer, context) &&
    !isAssigned(heldSymbol, heldDeclaration.getSourceFile(), context);
  const isForIn =
    iterated !== undefined &&
    ts.isForInStatement(iterated) &&
    (getKind(iterated.expression, context) === "object" ||
      (context.heap !== undefined &&
        (isBuiltInObject(iterated.expression, context) || isHeldBuiltIn)) ||
      ownFunctionKeys !== undefined);
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
  // only while the body changes no object. Where it may, each step reads the array's length and
  // elements again, as an array iterator does. A set's or a map's iterator steps through its
  // entries, where an entry that the loop adds comes last, which reading its entries again at each
  // step matches while no key leaves it.
  const isLive = isHeapIteration && changesObjects(loop, path, context);
  if (isLive && isKeyDeleted(loop, context)) {
    throw new TlaTypeScriptError(
      "Unsupported loop: tla-ts can't iterate a set or a map while the loop changes objects and the script deletes keys",
      iterated?.expression,
    );
  }
  // A for-in visits the keys that the object and its prototypes have as it starts, and skips one
  // that the body deletes before the loop reaches it, as Node does.
  const isKeyChecked = isForIn && changesObjects(loop, path, context);
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
  // A for-in over a list that the body changes visits the indices that the list had as it started,
  // and skips one that the list no longer has as the loop reaches it.
  const isListChanged =
    iterated !== undefined && isListKeys && isIteratedChanged(iterated.expression);
  // A for-in that checks its keys reads the object that a variable holds, where the loop changes
  // the object but doesn't assign the variable.
  const isObjectChanged =
    isKeyChecked && heldSymbol !== undefined && !isAssigned(heldSymbol, loop, context);
  if (
    iterated !== undefined &&
    !isIterator &&
    !isLive &&
    !isListChanged &&
    !isObjectChanged &&
    isIteratedChanged(iterated.expression)
  ) {
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
      "next",
      opened.next,
      [],
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
    const getSequence = (current: Path) =>
      !isLive || iterated === undefined
        ? identifier(sequence)
        : ordered !== undefined
          ? translateOrderedValues(
              ordered,
              getHeap(current.scope, ordered.receiver, context),
              identifier(sequence),
              context,
            )
          : useJavaScript(
              "ArrayLikeValues",
              [getHeap(current.scope, iterated.expression, context), identifier(sequence)],
              context,
            );
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
    const condition =
      ts.isWhileStatement(loop) || ts.isDoStatement(loop)
        ? loop.expression
        : ts.isForStatement(loop)
          ? loop.condition
          : undefined;
    // The condition runs the calls in it that only statements can run, in order, before it tests,
    // and each test runs them again.
    const test = (
      current: Path,
      whenTrue: (path: Path) => Formula,
      whenFalse: (path: Path) => Formula,
      tested = current,
    ): Formula => {
      const leading =
        condition === undefined
          ? undefined
          : getLeadingCall(condition, () => true, current, context);
      if (leading !== undefined) {
        return allocate(leading.call, current, context, (allocated) =>
          translateCallStatement(leading.call, allocated, context, bodyFrame, (after, value) =>
            test(
              withLeadingResults(leading, allocated, after, value, context),
              whenTrue,
              whenFalse,
              tested,
            ),
          ),
        );
      }
      // A short-circuit whose operand runs such a call runs it only where the operand runs.
      const branch = getBranch(condition, current, context);
      if (branch !== undefined) {
        const kept = branch.reads.map((read): [ts.Expression, Expression] => [
          read,
          translateExpression(read, current.scope, context),
        ]);
        return translateJoined(
          branch.node,
          current,
          context,
          (after, value) =>
            test(
              {
                ...after,
                scope: {
                  ...after.scope,
                  results: new Map([
                    ...after.scope.results,
                    ...kept,
                    [branch.node, value ?? getUndefined(context)],
                  ]),
                },
              },
              whenTrue,
              whenFalse,
              tested,
            ),
          (next) => runBranch(branch.node, current, context, bodyFrame, next),
        );
      }
      const untested = { ...current, scope: { ...current.scope, results: tested.scope.results } };
      return ifThenElse(
        iterated !== undefined
          ? apply("<=", [identifier(position), apply("Len", [getSequence(current)])])
          : condition === undefined
            ? boolean(true)
            : translateCondition(condition, current.scope, context),
        whenTrue(untested),
        whenFalse(untested),
      );
    };
    const testAgain = (current: Path) => test(current, repeat, done);
    // The incrementor makes its objects as a statement does.
    const incrementor = ts.isForStatement(loop) ? loop.incrementor : undefined;
    const advance = (current: Path) =>
      incrementor === undefined
        ? repeat(current)
        : allocate(incrementor, current, context, (inner) =>
            translateExpressionStatement(incrementor, inner, context, bodyFrame, repeat),
          );
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
      const element = index(getSequence(current), [identifier(position)]);
      const run = bindIteration(
        iterated.initializer,
        element,
        undefined,
        current,
        context,
        bodyFrame,
        (bound, innerFrame) => translateStatements([loop.statement], bound, context, innerFrame),
      );
      if (isListChanged) {
        return ifThenElse(
          apply("<=", [
            identifier(position),
            apply("Len", [translateExpression(iterated.expression, current.scope, context)]),
          ]),
          run,
          advance(current),
        );
      }
      if (!isKeyChecked) {
        return ts.isForOfStatement(iterated)
          ? keepHoles(iterated, element, identifier(position), current, context, run)
          : run;
      }
      const object = translateObjectValue(iterated.expression, current.scope, context);
      return ifThenElse(
        apply("\\/", [
          not(useJavaScript("IsRef", [object], context)),
          useJavaScript(
            "Has",
            [getHeap(current.scope, iterated.expression, context), object, element],
            context,
          ),
        ]),
        run,
        advance(current),
      );
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
              : test(inner, translateBody, done),
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
                isForIn && ownFunctionKeys !== undefined
                  ? share(
                      translateExpression(iterated.expression, path.scope, context),
                      "function",
                      context,
                      (value) =>
                        ifExpression(
                          useJavaScript("IsRef", [value], context),
                          useJavaScript(
                            "ForInKeys",
                            [getHeap(path.scope, iterated.expression, context), value],
                            context,
                          ),
                          share(
                            apply("SelectSeq", [
                              useJavaScript(
                                "ForInKeys",
                                [
                                  getHeap(path.scope, iterated.expression, context),
                                  translateBuiltInValue(
                                    "Function.prototype",
                                    iterated.expression,
                                    context,
                                  ),
                                ],
                                context,
                              ),
                              lambda(
                                ["key"],
                                apply("\\notin", [
                                  identifier("key"),
                                  set(ownFunctionKeys.map(string)),
                                ]),
                              ),
                            ]),
                            "keys",
                            context,
                            (keys) =>
                              ifExpression(
                                quantify(
                                  "Exists",
                                  [bound("position", apply("DOMAIN", [keys]))],
                                  apply("\\in", [
                                    index(keys, [identifier("position")]),
                                    set([string("arguments"), string("caller")]),
                                  ]),
                                ),
                                apply("Assert", [
                                  boolean(false),
                                  string(
                                    "tla-ts can't tell whether this function has its own arguments and caller",
                                  ),
                                ]),
                                keys,
                              ),
                          ),
                        ),
                    )
                  : isForIn
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
                        : isLive && ordered !== undefined
                          ? translateNode(ordered.receiver, path.scope, context, false)
                          : isLive
                            ? share(
                                translateExpression(iterated.expression, path.scope, context),
                                "array",
                                context,
                                (array) =>
                                  translateArrayIteration(
                                    array,
                                    getHeap(path.scope, iterated.expression, context),
                                    iterated.expression,
                                    context,
                                    array,
                                  ),
                              )
                            : isHeapIteration
                              ? translateIteratedSequence(
                                  iterated.expression,
                                  iterated,
                                  path.scope,
                                  context,
                                )
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
const hasCall = (node: ts.Node, context: Context): boolean =>
  !ts.isFunctionLike(node) &&
  ((ts.isCallExpression(node) && !isLibraryCall(node, context)) ||
    ts.isNewExpression(node) ||
    (ts.forEachChild(node, (child) => hasCall(child, context) || undefined) ?? false));

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
  const bodyFrame = statement.finallyBlock === undefined ? outer : guardYields(outer);
  const bindCatch = (clause: ts.CatchClause, caught: Path, value: Expression): Formula => {
    const declaration = clause.variableDeclaration;
    const keyed =
      declaration &&
      runFirstKey(declaration.name, value, caught, context, bodyFrame, (after) =>
        bindCatch(clause, after, value),
      );
    if (keyed !== undefined) return keyed;
    // A default of a catch's pattern whose call only statements can run, such as one that throws
    // inside another try, runs as its own statement where the pattern takes undefined for it.
    const defaulted =
      declaration === undefined
        ? undefined
        : findNodes(declaration.name, ts.isBindingElement).find((element) => {
            const initializer = element.initializer && getCast(element.initializer);
            return (
              ts.isIdentifier(element.name) &&
              initializer !== undefined &&
              ts.isCallExpression(initializer) &&
              !caught.scope.results.has(initializer) &&
              isStatementCall(initializer, caught, context)
            );
          });
    const call = defaulted?.initializer && getCast(defaulted.initializer);
    const symbol = defaulted && getSymbol(defaulted.name, context.checker);
    if (declaration !== undefined && call !== undefined && ts.isCallExpression(call) && symbol) {
      const withResult = (current: Path, result: Expression) => ({
        ...current,
        scope: { ...current.scope, results: new Map([...current.scope.results, [call, result]]) },
      });
      const skipped = bindPattern(
        declaration.name,
        value,
        withResult(caught, getUndefined(context)).scope,
        context,
      );
      const part = skipped.scope.bindings.get(symbol);
      if (part === undefined) throw new TlaTypeScriptError("Unsupported default", call);
      return letIn(
        skipped.definitions,
        throwOnDestructured(
          skipped.scope,
          caught,
          context,
          bodyFrame,
          translateJoined(
            call,
            caught,
            context,
            (after, result) =>
              bindCatch(clause, withResult(after, result ?? getUndefined(context)), value),
            (next) =>
              ifThenElse(
                apply("=", [part, getUndefined(context)]),
                translateCallStatement(call, caught, context, bodyFrame, next),
                next(caught, getUndefined(context)),
              ),
          ),
        ),
      );
    }
    const bound =
      declaration === undefined
        ? { definitions: [], scope: caught.scope }
        : bindPattern(declaration.name, value, caught.scope, context);
    // A catch's parameter is a local binding, which the block may assign as it does a let.
    const parameter =
      declaration !== undefined && ts.isIdentifier(declaration.name)
        ? getSymbol(declaration.name, context.checker)
        : undefined;
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
            clause.block.statements,
            {
              ...caught,
              scope: { ...bound.scope, destructured: undefined },
              mutable:
                parameter === undefined ? caught.mutable : new Set([...caught.mutable, parameter]),
            },
            context,
            bodyFrame,
          ),
          leaf(boolean(false)),
          context,
        ),
      ),
    );
  };
  // A catch's pattern makes the objects of its defaults first, as a declaration's does.
  const runCatch = (clause: ts.CatchClause, catching: Path, value: Expression) =>
    allocateAll(
      clause.variableDeclaration === undefined
        ? []
        : getAllocated(clause.variableDeclaration, context),
      catching,
      context,
      (caught) => bindCatch(clause, caught, value),
    );
  const handle = (inner: Path, thrown: Thrown) => {
    if (catchClause === undefined) return rethrow(inner, thrown);
    const caught = { ...inner, scope: { ...inner.scope, isCatching } };
    const pattern = catchClause.variableDeclaration?.name;
    // A catch's array pattern takes its values from a generator object that the try threw, through
    // its next, before the block runs, so that what the generator throws leaves the try.
    if (thrown.isGenerator === true && pattern !== undefined && ts.isArrayBindingPattern(pattern)) {
      const suspensions = [...caught.generators.values()];
      const exact = suspensions.filter((suspension) =>
        isSameExpression(suspension.ref, thrown.value),
      );
      return takeFromHeld(
        pattern,
        thrown.value,
        (exact.length > 0 ? exact : suspensions).flatMap(
          (suspension) => suspension.generator ?? [],
        ),
        [],
        caught,
        context,
        bodyFrame,
        (after, values) => runCatch(catchClause, after, values),
      );
    }
    return pattern !== undefined && isCaughtIteration(pattern, context)
      ? takeFromIterable(pattern, thrown.value, caught, context, bodyFrame, (after, values) =>
          runCatch(catchClause, after, values),
        )
      : runCatch(catchClause, caught, thrown.value);
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
  ts.isFunctionExpression(getCast(node)) ||
  ts.isArrowFunction(getCast(node)) ||
  (results?.has(node) ?? false) ||
  ((ts.isNonNullExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node)) &&
    isPlainCallee(node.expression, context, results)) ||
  (ts.isPropertyAccessExpression(node) &&
    !ts.isPrivateIdentifier(node.name) &&
    getObjectGetter(node, context) === undefined &&
    !(getSymbol(node.name, context.checker)?.declarations ?? []).some(
      ts.isGetAccessorDeclaration,
    ) &&
    isPlainCallee(getCast(node.expression), context, results)) ||
  // A key that a string literal writes reads as a name does.
  (ts.isElementAccessExpression(node) &&
    ts.isStringLiteral(node.argumentExpression) &&
    getObjectGetter(node, context) === undefined &&
    !(getSymbol(node.argumentExpression, context.checker)?.declarations ?? []).some(
      ts.isGetAccessorDeclaration,
    ) &&
    isPlainCallee(getCast(node.expression), context, results));

type Increment = ts.PrefixUnaryExpression | ts.PostfixUnaryExpression;

const isIncrement = (node: ts.Node): node is Increment =>
  (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
  INCREMENT_OPERATORS.has(node.operator);

// An increment's operand that holds a primitive other than a number, or a value of type any, which
// the increment converts to a number as it reads it, as other conversions do, where a script makes
// objects.
const isConvertedOperand = (operand: ts.Expression, context: Context) =>
  context.heap !== undefined &&
  !isNumberLike(skipCasts(operand), context) &&
  isEvery(
    context.checker.getTypeAtLocation(skipCasts(operand)),
    ts.TypeFlags.NumberLike |
      ts.TypeFlags.StringLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Null |
      ts.TypeFlags.Any,
  );

// The number that an increment reads from its operand's value.
const getIncremented = (operand: ts.Expression, value: Expression, context: Context) => {
  if (!isConvertedOperand(operand, context)) return value;
  const converted = useJavaScript("ToNumber", [value], context);
  return context.hasSpecialNumbers ? converted : useJavaScript("PlainNumber", [converted], context);
};

// An assignment or an increment, which only a statement can run.
const isAssignment = (node: ts.Node): node is ts.BinaryExpression | Increment =>
  isIncrement(node) || (ts.isBinaryExpression(node) && getWritten(node) !== undefined);

// A variable, or a property or an element of an object that a name holds, whose key no getter has
// and is a name or a literal, which reads and writes a number without running code.
// The boolean type keeps TypeScript from narrowing the increment as a proxy's operation.
const isPlainIncrement = (node: Increment, context: Context): boolean => {
  const operand = skipCasts(node.operand);
  const names = getTypeNames(context.checker.getTypeAtLocation(operand), context.checker);
  const isNumeric =
    (names !== undefined && names.every((name) => name === "number" || name === "bigint")) ||
    isConvertedOperand(operand, context);
  // A literal key that no getter has, or a name's key where the script defines no getter.
  const isPlainKey = (element: ts.ElementAccessExpression) => {
    const key = getAccessKey(element);
    return ts.isIdentifier(element.argumentExpression)
      ? getGetterKeys(element).size === 0
      : key !== undefined && !getGetterKeys(element).has(key);
  };
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
        isPlainObject(operand.expression)) ||
      (ts.isElementAccessExpression(operand) &&
        operand.questionDotToken === undefined &&
        isPlainKey(operand) &&
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
    const before = getIncremented(
      node.operand,
      translateExpression(node.operand, path.scope, context),
      context,
    );
    return translateExpressionStatement(node, path, context, frame, (after) =>
      continueWith(
        after,
        ts.isPostfixUnaryExpression(node)
          ? before
          : translateExpression(node.operand, after.scope, context),
      ),
    );
  }
  // A parameter that an arguments object maps holds its value on the heap.
  const target =
    ts.isIdentifier(node.left) && getMappedParameter(node.left, path.scope, context) === undefined
      ? getSymbol(node.left, context.checker)
      : undefined;
  // An assignment that runs before the rest of its statement makes its objects first, which the
  // statement, reading its result, doesn't make, unless a call made its parameters' defaults.
  return allocateAll(
    getAllocated(node, context).filter((allocation) => !path.scope.allocated.has(allocation)),
    path,
    context,
    (allocated) => {
      // An update to a property gives what it writes, which a typed array, say, may not hold.
      const update = isMemberUpdate(node) ? getUpdate(node, allocated, context) : undefined;
      const value =
        update !== undefined
          ? update(translateExpression(node.left, allocated.scope, context))
          : target === undefined
            ? translateExpression(node.right, allocated.scope, context)
            : undefined;
      return translateExpressionStatement(node, allocated, context, frame, (after) => {
        const result =
          value ?? (target === undefined ? undefined : after.scope.bindings.get(target));
        if (result === undefined) throw new TlaTypeScriptError("Unsupported assignment", node);
        return continueWith(after, result);
      });
    },
  );
};

const SHORT_CIRCUITS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
]);

// A name, or a property or a key of a name or this, whose key is a name or a literal.
const isPlainTarget = (node: ts.Expression, results: Scope["results"]) =>
  ts.isIdentifier(node) ||
  ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
    node.questionDotToken === undefined &&
    (ts.isIdentifier(node.expression) ||
      node.expression.kind === ts.SyntaxKind.ThisKeyword ||
      results.has(node.expression)) &&
    (ts.isPropertyAccessExpression(node) ||
      ts.isIdentifier(node.argumentExpression) ||
      ts.isLiteralExpression(node.argumentExpression)));

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
    const written = inKey === undefined ? undefined : getWrittenOperand(inKey);
    return written !== undefined &&
      node.questionDotToken === undefined &&
      isUnaffected(node.expression, written, context)
      ? inKey
      : undefined;
  }
  // An object literal evaluates its first property's computed key before anything else.
  if (ts.isObjectLiteralExpression(node)) {
    const name = node.properties.at(0)?.name;
    return name !== undefined && ts.isComputedPropertyName(name)
      ? getLeadingAssignment(name.expression, results, context)
      : undefined;
  }
  if (ts.isConditionalExpression(node))
    return getLeadingAssignment(node.condition, results, context);
  // A call evaluates its callee first, which reading a getter could make see the change.
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const inCallee = ts.isElementAccessExpression(node.expression)
      ? getLeadingAssignment(node.expression, results, context)
      : undefined;
    if (inCallee !== undefined) return inCallee;
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
  // A value that assigns a property, as in a = b.x = v, runs first, since the setter it may run
  // can't change which binding a name or a pattern writes.
  if (ts.isIdentifier(node.left) || isPattern) {
    return getLeadingAssignment(node.right, results, context) ?? node;
  }
  // A property's assignment evaluates its object and key, then its value.
  const inner = getLeadingAssignment(node.right, results, context);
  const written = inner === undefined ? undefined : getWrittenOperand(inner);
  if (written !== undefined) return isUnwritten(node.left, written, context) ? inner : undefined;
  // An assignment of a property that its value, which makes no call, nests runs first, as in
  // a.x = b.y = v, where the target evaluates to the same object and key after it.
  if (inner !== undefined) return isUnmoved(node.left, inner, results, context) ? inner : undefined;
  return (isPlainTarget(node.left, results) || isMadeTarget(node.left, results)) &&
    (results.has(node.right) || !hasCall(node.right, context))
    ? node
    : undefined;
};

// A property of what new makes of names and literals, whose constructor runs where it runs first.
const isMadeTarget = (target: ts.Expression, results: Scope["results"]) => {
  const made = ts.isPropertyAccessExpression(target) ? skipCasts(target.expression) : undefined;
  return (
    made !== undefined &&
    ts.isNewExpression(made) &&
    ts.isIdentifier(made.expression) &&
    (made.arguments ?? []).every((argument) => isPlainOperand(argument, results))
  );
};

// Whether a property's target evaluates to the same object and key after an assignment of another
// property, which reads only names and literals where a setter it runs could write a name.
const isUnmoved = (
  target: ts.Expression,
  assignment: ts.BinaryExpression | Increment,
  results: ReadonlyMap<ts.Expression, Expression>,
  context: Context,
) => {
  if (!isPlainTarget(target, results) || isIncrement(assignment)) return false;
  const parts = ts.isElementAccessExpression(target)
    ? [target.expression, target.argumentExpression]
    : ts.isPropertyAccessExpression(target)
      ? [target.expression]
      : [target];
  return (
    parts.every((part) => !ts.isIdentifier(part) || getImmutable(part, context) !== undefined) ||
    (getPropertySetters(assignment.left, context).length === 0 &&
      !isMadeTarget(assignment.left, results) &&
      isPlainOperand(assignment.right, results))
  );
};

// An operand that evaluates without running code or reading what may change, as a literal or
// what the statement ran first gave, so that what follows it can run first.
const isSettled = (node: ts.Expression, results: Scope["results"]): boolean =>
  results.has(node) ||
  ts.isLiteralExpression(node) ||
  [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
    node.kind,
  ) ||
  ((ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isTypeOfExpression(node)) &&
    isSettled(node.expression, results)) ||
  (ts.isArrayLiteralExpression(node) &&
    node.elements.every(
      (element) => !ts.isSpreadElement(element) && isSettled(element, results),
    )) ||
  (ts.isTemplateExpression(node) &&
    node.templateSpans.every((span) => isSettled(span.expression, results))) ||
  (ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    isSettled(node.left, results) &&
    isSettled(node.right, results));

// A name that a node reads before an await or a yield, whose value the statement keeps from then.
const isReadName = (node: ts.Expression, context: Context): node is ts.Identifier =>
  ts.isIdentifier(node) && !isUnresolved(node, context);

// A name, or a property that no getter or proxy gives of a name that can't be null or undefined,
// that a node reads before an await or a yield, whose value the statement keeps from then, as a
// callee keeps the function it names.
const isKeptName = (node: ts.Expression, context: Context) => {
  if (isReadName(node, context)) return true;
  if (
    !ts.isPropertyAccessExpression(node) ||
    ts.isOptionalChain(node) ||
    !isReadName(node.expression, context)
  ) {
    return false;
  }
  const type = context.checker.getTypeAtLocation(node.expression);
  return (
    (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) === 0 &&
    context.checker.getNonNullableType(type) === type &&
    !isGetterRead(node, context) &&
    !isProxyOperation(node, context)
  );
};

// The first of a list of operands that a node evaluates in order to hold an await or a yield,
// after operands that are settled or names that it reads.
const getFirstLeading = (
  operands: readonly ts.Expression[],
  results: Scope["results"],
  context: Context,
): ts.AwaitExpression | ts.YieldExpression | undefined => {
  const [first, ...rest] = operands;
  if (first === undefined) return undefined;
  return (
    getLeadingAwaitOrYield(first, results, context) ??
    // The private name that the left of an in names evaluates nothing.
    (isSettled(first, results) || isKeptName(first, context) || ts.isPrivateIdentifier(first)
      ? getFirstLeading(rest, results, context)
      : undefined)
  );
};

// A property that a name's object holds under a name, whose reference an assignment evaluates by
// reading the name, before its value.
const isNamedPropertyOfName = (
  node: ts.Expression,
  context: Context,
): node is ts.PropertyAccessExpression =>
  ts.isPropertyAccessExpression(node) &&
  ts.isIdentifier(node.name) &&
  isReadName(node.expression, context);

// The computed key and the value that an object literal's property evaluates.
const getPropertyOperands = (property: ts.ObjectLiteralElementLike): ts.Expression[] => [
  ...(property.name !== undefined && ts.isComputedPropertyName(property.name)
    ? [property.name.expression]
    : []),
  ...(ts.isPropertyAssignment(property)
    ? [property.initializer]
    : ts.isShorthandPropertyAssignment(property)
      ? [property.name]
      : []),
];

const getClassOperands = (node: ts.ClassLikeDeclaration): ts.Expression[] => [
  ...(node.heritageClauses ?? []).flatMap((clause) =>
    clause.token === ts.SyntaxKind.ExtendsKeyword
      ? clause.types.map((type) => type.expression)
      : [],
  ),
  ...node.members.flatMap((member) =>
    member.name !== undefined && ts.isComputedPropertyName(member.name)
      ? [member.name.expression]
      : [],
  ),
];

const isFunctionExpressionCall = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) && ts.isFunctionExpression(skipCasts(node.expression));

// The await or the yield that a node evaluates before anything else.
const getLeadingAwaitOrYield = (
  node: ts.Expression,
  results: Scope["results"],
  context: Context,
): ts.AwaitExpression | ts.YieldExpression | undefined => {
  if (results.has(node)) return undefined;
  if (ts.isAwaitExpression(node)) {
    return getLeadingAwaitOrYield(node.expression, results, context) ?? node;
  }
  // A yield evaluates its operand before it yields.
  if (ts.isYieldExpression(node)) {
    const operand = node.expression && getLeadingAwaitOrYield(node.expression, results, context);
    return operand ?? node;
  }
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    (ts.isElementAccessExpression(node) && ts.isOptionalChain(node))
  ) {
    return getLeadingAwaitOrYield(node.expression, results, context);
  }
  if (ts.isElementAccessExpression(node)) {
    return getFirstLeading([node.expression, node.argumentExpression], results, context);
  }
  if (ts.isPrefixUnaryExpression(node)) {
    return getLeadingAwaitOrYield(node.operand, results, context);
  }
  // A class evaluates what it extends, then its computed keys, in order.
  if (ts.isClassExpression(node)) {
    return getFirstLeading(getClassOperands(node), results, context);
  }
  if (ts.isConditionalExpression(node)) {
    return getLeadingAwaitOrYield(node.condition, results, context);
  }
  if (ts.isArrayLiteralExpression(node)) {
    const index = node.elements.findIndex(ts.isSpreadElement);
    return getFirstLeading(
      index === -1 ? node.elements : node.elements.slice(0, index),
      results,
      context,
    );
  }
  if (ts.isTemplateExpression(node)) {
    return getFirstLeading(
      node.templateSpans.map((span) => span.expression),
      results,
      context,
    );
  }
  // An object literal evaluates the keys and the values of its properties in order, up to a spread.
  if (ts.isObjectLiteralExpression(node)) {
    const index = node.properties.findIndex(ts.isSpreadAssignment);
    return getFirstLeading(
      (index === -1 ? node.properties : node.properties.slice(0, index)).flatMap(
        getPropertyOperands,
      ),
      results,
      context,
    );
  }
  // A call of a function expression evaluates the function, which runs nothing, then its arguments.
  if (isFunctionExpressionCall(node)) {
    const index = node.arguments.findIndex(ts.isSpreadElement);
    return getFirstLeading(
      index === -1 ? node.arguments : node.arguments.slice(0, index),
      results,
      context,
    );
  }
  // A call evaluates its callee, then its arguments, up to a spread.
  if (ts.isCallExpression(node)) {
    const index = node.arguments.findIndex(ts.isSpreadElement);
    return ts.isOptionalChain(node)
      ? getLeadingAwaitOrYield(node.expression, results, context)
      : getFirstLeading(
          [node.expression, ...(index === -1 ? node.arguments : node.arguments.slice(0, index))],
          results,
          context,
        );
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    return ts.isIdentifier(node.left) || isNamedPropertyOfName(node.left, context)
      ? getLeadingAwaitOrYield(node.right, results, context)
      : undefined;
  }
  // A compound assignment reads its name before its value.
  const isAssignment =
    kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
  if (isAssignment && !ts.isIdentifier(node.left)) return undefined;
  // A logical operator evaluates its right operand only for some values of its left.
  const isLogical =
    kind === ts.SyntaxKind.AmpersandAmpersandToken ||
    kind === ts.SyntaxKind.BarBarToken ||
    kind === ts.SyntaxKind.QuestionQuestionToken ||
    LOGICAL_OPERATORS.has(kind);
  return isLogical
    ? getLeadingAwaitOrYield(node.left, results, context)
    : getFirstLeading([node.left, node.right], results, context);
};

// The names that the operands before a node read, up to the expression of its statement.
const getEarlierNames = (
  node: ts.Node,
  root: ts.Node,
  results: Scope["results"],
  context: Context,
): ts.Expression[] => {
  if (node === root) return [];
  const parent = ts.isTemplateSpan(node.parent) ? node.parent.parent : node.parent;
  const operands =
    ts.isBinaryExpression(parent) && parent.operatorToken.kind !== ts.SyntaxKind.EqualsToken
      ? [parent.left, parent.right]
      : ts.isBinaryExpression(parent) && isNamedPropertyOfName(parent.left, context)
        ? [parent.left.expression, parent.right]
        : ts.isArrayLiteralExpression(parent)
          ? [...parent.elements]
          : ts.isElementAccessExpression(parent)
            ? [parent.expression, parent.argumentExpression]
            : ts.isCallExpression(parent)
              ? [
                  ...(ts.isPropertyAccessExpression(parent.expression)
                    ? [parent.expression.expression]
                    : []),
                  parent.expression,
                  ...parent.arguments,
                ]
              : ts.isClassLike(parent)
                ? getClassOperands(parent)
                : ts.isObjectLiteralExpression(parent)
                  ? parent.properties.flatMap(getPropertyOperands)
                  : ts.isObjectLiteralElementLike(parent) &&
                      ts.isObjectLiteralExpression(parent.parent)
                    ? getPropertyOperands(parent)
                    : isFunctionExpressionCall(parent)
                      ? [...parent.arguments]
                      : ts.isTemplateExpression(parent)
                        ? parent.templateSpans.map((span) => span.expression)
                        : [];
  // The operand that holds the node, as a property holds its key and its value.
  const position = operands.findIndex(
    (operand) => operand === node || (node.pos <= operand.pos && operand.end <= node.end),
  );
  return [
    ...getEarlierNames(parent, root, results, context),
    ...(position === -1 ? [] : operands.slice(0, position)).filter(
      (operand) => !results.has(operand) && isKeptName(operand, context),
    ),
  ];
};

const getStatementAwaitOrYield = (statement: ts.Statement, path: Path, context: Context) => {
  // A class declaration evaluates what it extends and its computed keys.
  if (ts.isClassDeclaration(statement)) {
    const paused = getFirstLeading(getClassOperands(statement), path.scope.results, context);
    return paused === undefined
      ? undefined
      : { paused, reads: getEarlierNames(paused, statement, path.scope.results, context) };
  }
  const evaluated = getEvaluated(statement);
  const paused =
    evaluated === undefined
      ? undefined
      : getLeadingAwaitOrYield(evaluated, path.scope.results, context);
  return paused === undefined || evaluated === undefined
    ? undefined
    : { paused, reads: getEarlierNames(paused, evaluated, path.scope.results, context) };
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
  if (isIncrement(operand) && isPlainIncrement(operand, context)) {
    return runAssignment(operand, path, context, frame, settleWith);
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
  // A short-circuit, a logical assignment, or a conditional whose operand that runs only sometimes
  // is a call that only statements can run, so the statement branches on which operand gives the
  // value.
  branch?: ts.BinaryExpression | ts.ConditionalExpression;
  // A spread of a generator object or an iterator, which the statement steps to its end first.
  spread?: ts.SpreadElement;
  // An increment, which only a statement can run, so nothing after it can run before it.
  increment?: Increment;
  // A new Promise, whose executor runs as a statement, so nothing after it can run before it.
  construction?: ts.NewExpression;
  // A new of a typed array of a value that may be an iterable, whose iterator runs as a
  // statement, so nothing after it can run before it.
  typedArray?: ts.NewExpression;
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
  if ((ts.isExpression(node) || ts.isSpreadElement(node)) && path.scope.results.has(node)) {
    return none;
  }
  // An object that spreads a proxy runs its traps.
  if (ts.isObjectLiteralExpression(node) && isProxyOperation(node, context)) {
    return { call: undefined, isBlocked: true, read: node };
  }
  if (
    ts.isSpreadElement(node) &&
    (ts.isArrayLiteralExpression(node.parent)
      ? isSteppedValue(node.expression, context) || isIterableValue(node.expression, context)
      : (ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent)) &&
        isIterableValue(node.expression, context)) &&
    !isArrayIteration(getCast(node.expression), context)
  ) {
    // The spread runs a call that makes what it steps as it steps it.
    const made = getCast(node.expression);
    const found =
      ts.isCallExpression(made) && !path.scope.results.has(made)
        ? inOrder([made.expression, ...made.arguments])
        : findLeadingCall(node.expression, before, path, context);
    return found.call !== undefined || found.isBlocked
      ? found
      : { call: undefined, isBlocked: true, spread: node };
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
  if (isIncrement(node)) {
    return isPlainIncrement(node, context) ? { ...blocked, increment: node } : blocked;
  }
  if (ts.isPrefixUnaryExpression(node)) {
    return thenConverted(findLeadingCall(node.operand, before, path, context));
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
  if (ts.isOmittedExpression(node)) return none;
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
  // An operand that runs a call that only statements can run, an increment, an assignment to a
  // name of a value that runs nothing, a yield, or a branch of these, which it may evaluate first.
  const isBranchRun = (operand: ts.Expression) => {
    const run = skipCasts(operand);
    const found = findLeadingCall(run, [], path, context);
    return (
      found.call !== undefined ||
      (ts.isYieldExpression(run) && run.asteriskToken === undefined) ||
      (isIncrement(run) && isPlainIncrement(run, context)) ||
      (ts.isBinaryExpression(run) &&
        isAssignment(run) &&
        ts.isIdentifier(run.left) &&
        isPlainOperand(run.right)) ||
      found.branch !== undefined
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
    // A logical assignment to a name, or to a name's key, reads its target before its value, which
    // runs only sometimes.
    if (
      LOGICAL_OPERATORS.has(kind) &&
      isPlainTarget(node.left, path.scope.results) &&
      isPlainOperand(node.left) &&
      isBranchRun(node.right)
    ) {
      return { ...blocked, branch: node };
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
    return found.call !== undefined || found.isBlocked
      ? found
      : isIteratedTypedArray(node, context)
        ? { ...blocked, typedArray: node }
        : evaluate(node);
  }
  if (ts.isNewExpression(node)) {
    const found = inOrder([node.expression, ...(node.arguments ?? [])]);
    return found.call !== undefined || found.isBlocked
      ? found
      : isPromiseConstruction(node, context)
        ? { ...blocked, construction: node }
        : blocked;
  }
  if (ts.isCallExpression(node)) {
    // A call that makes a generator runs first, with what makes its receiver, where instanceof
    // or getPrototypeOf reads what it makes.
    const outer = ts.findAncestor(
      node.parent,
      (ancestor) => !ts.isParenthesizedExpression(ancestor),
    );
    if (
      outer !== undefined &&
      isPrototypeRead(outer, node) &&
      isGeneratorType(node, context) &&
      isStatementCall(node, path, context)
    ) {
      return { call: node, isBlocked: false };
    }
    // A method of a call's result or of its property, or the function that a call gives, runs the
    // call first.
    const receiver = ts.isPropertyAccessExpression(node.expression)
      ? getCast(node.expression.expression)
      : ts.isCallExpression(getCast(node.expression))
        ? getCast(node.expression)
        : undefined;
    // An array literal's method runs its elements first.
    const isListed = receiver !== undefined && ts.isArrayLiteralExpression(receiver);
    // A collection that new makes without arguments runs no code.
    const isMadeCollection =
      receiver !== undefined &&
      ts.isNewExpression(receiver) &&
      (receiver.arguments ?? []).length === 0 &&
      COLLECTIONS.some((collection) => collection === getBuiltIn(receiver.expression, context));
    const fromReceiver =
      receiver !== undefined &&
      (ts.isCallExpression(receiver) ||
        ts.isPropertyAccessExpression(receiver) ||
        ts.isElementAccessExpression(receiver) ||
        isListed)
        ? findLeadingCall(receiver, before, path, context)
        : none;
    if (fromReceiver.call !== undefined || fromReceiver.isBlocked) return fromReceiver;
    // A call whose callee a getter that may change something answers runs the getter before it
    // evaluates its arguments.
    const callee = skipCasts(node.expression);
    if (!path.scope.results.has(callee) && isGetterRead(callee, context)) {
      return { call: undefined, isBlocked: true, read: callee };
    }
    // A method of what new makes runs the calls in new's arguments first, and a typed array's
    // iterator.
    if (receiver !== undefined && ts.isNewExpression(receiver)) {
      const evaluated: ts.Node[] = [];
      const fromNew = findLeadingCall(receiver, evaluated, path, context);
      if (fromNew.call !== undefined || fromNew.typedArray !== undefined) {
        before.push(...evaluated);
        return fromNew;
      }
    }
    // A regexp's method under a well-known symbol reads no getter.
    const isRegExpMethod =
      getRegExpProtocolCall(node, context) !== undefined ||
      (ts.isElementAccessExpression(node.expression) &&
        getHeapRegExpCall(node, context) !== undefined &&
        isPlainCallee(getCast(node.expression.expression), context, path.scope.results));
    if (
      !isListed &&
      !isMadeCollection &&
      !isRegExpMethod &&
      !isPlainCallee(node.expression, context, path.scope.results)
    ) {
      return blocked;
    }
    const found = thenConverted(inOrder(node.arguments));
    if (found.call !== undefined || found.isBlocked) return found;
    if (isGeneratorType(node, context)) return blocked;
    return isStatementCall(node, path, context) || isRemoving(node, context)
      ? { call: node, isBlocked: false }
      : evaluate(node);
  }
  // A tagged template evaluates its tag, then its substitutions, and runs its call as a statement.
  if (ts.isTaggedTemplateExpression(node) && !isRawTemplate(node, context)) {
    if (!isPlainCallee(node.tag, context, path.scope.results)) return blocked;
    before.push(node.tag);
    const found = inOrder(getSubstitutions(node));
    return found.call !== undefined || found.isBlocked ? found : blocked;
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

// The new RegExp of literals that make no valid regexp in an expression, or a BigInt of a string
// literal that makes no integer, which throws a SyntaxError where only names, literals, and the
// operands of arithmetic evaluate before it.
const getInvalidRegExp = (node: ts.Node, context: Context): ts.Node | undefined => {
  if (isInvalidRegExp(node, context) || isInvalidBigIntText(node, context)) return node;
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
      : ts.isIfStatement(statement) || ts.isSwitchStatement(statement)
        ? statement.expression
        : ts.isReturnStatement(statement) || ts.isThrowStatement(statement)
          ? statement.expression
          : ts.isForOfStatement(statement)
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
      // An if, a switch, or a throw statement evaluates its expression, and a for-of what it
      // iterates, and runs no call of it.
      (call !== outer ||
        ts.isIfStatement(statement) ||
        ts.isSwitchStatement(statement) ||
        ts.isThrowStatement(statement) ||
        ts.isForOfStatement(statement)) &&
      !(
        ts.isBinaryExpression(outer) &&
        outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        skipCasts(outer.right) === call
      ),
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
  if (call === undefined || !isHoisted(call)) return undefined;
  // A name or a property that the statement reads before the call keeps the value that it had then.
  const reads = getEarlyReads(
    [call],
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === call) === undefined),
    path,
    context,
  );
  // A call that the statement evaluates before, rather than runs, reads where JavaScript reads it,
  // and one that may throw runs first, as it changes nothing.
  const throwing = reads
    .filter(ts.isCallExpression)
    .find((inner) => mayThrow(inner, context, new Set(path.scope.results.keys())));
  if (throwing !== undefined) return { call: throwing, reads: [] };
  const kept = reads.filter(isKeptRead);
  if (kept.length < reads.length) {
    throw new TlaTypeScriptError("tla-ts can't run this before what reads what it changes", call);
  }
  return { call, reads: kept };
};

// A read that a statement evaluates before what runs first, which keeps the value it had then, as
// what the statement evaluates first runs no code that a later read could.
const isKeptRead = (inner: ts.Node): inner is ts.Expression => ts.isExpression(inner);

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

// Runs a short-circuit or a conditional whose operand runs a call that only statements can run, so
// that each operand runs only where it gives the value. A branch whose operand is a branch runs that
// one where it runs.
const runBranch = (
  node: NonNullable<LeadingCall["branch"]>,
  current: Path,
  context: Context,
  frame: Frame,
  withValue: (after: Path, value: Expression) => Formula,
): Formula => {
  // An operand runs the calls in it that only statements can run, in order, before the rest.
  const evaluate = (operand: ts.Expression, next: Path, withOperand = withValue): Formula => {
    const run = skipCasts(operand);
    const inner = findLeadingCall(run, [], next, context).branch;
    if (inner !== undefined && inner === run)
      return runBranch(inner, next, context, frame, withOperand);
    // A branch that the operand evaluates first, as (a && f()) && g() does, runs before the rest of
    // the operand, which reads its value.
    const first = inner === undefined ? undefined : getBranch(run, next, context);
    if (first !== undefined) {
      const kept = first.reads.map((read): [ts.Expression, Expression] => [
        read,
        translateExpression(read, next.scope, context),
      ]);
      return translateJoined(
        first.node,
        next,
        context,
        (after, value) =>
          evaluate(
            operand,
            {
              ...after,
              scope: {
                ...after.scope,
                results: new Map([
                  ...after.scope.results,
                  ...kept,
                  [first.node, value ?? getUndefined(context)],
                ]),
              },
            },
            withOperand,
          ),
        (join) => runBranch(first.node, next, context, frame, join),
      );
    }
    if (isAssignment(run) && (!isIncrement(run) || isPlainIncrement(run, context))) {
      return runAssignment(run, next, context, frame, withOperand);
    }
    if (ts.isYieldExpression(run) && run.asteriskToken === undefined) {
      return translateYield(run, next, context, frame, (after, sent) =>
        withOperand(after, sent ?? getUndefined(context)),
      );
    }
    // A call that only a statement can run runs as one, where one that an expression can run, such
    // as a set's has, gives its value as the rest of the operand does.
    if (
      ts.isCallExpression(run) &&
      !next.scope.results.has(run) &&
      getLeadingCall(run, () => true, next, context)?.call === run
    ) {
      return allocate(run, next, context, (allocated) =>
        translateCallStatement(run, allocated, context, frame, (after, value) =>
          withOperand(after, value ?? getUndefined(context)),
        ),
      );
    }
    const leading = getLeadingCall(operand, () => true, next, context);
    // An operand makes the objects in it only where its branch runs.
    return leading === undefined
      ? allocate(operand, next, context, (allocated) =>
          withOperand(allocated, translateExpression(operand, allocated.scope, context)),
        )
      : allocate(leading.call, next, context, (allocated) =>
          translateCallStatement(leading.call, allocated, context, frame, (after, value) =>
            evaluate(
              operand,
              withLeadingResults(leading, allocated, after, value, context),
              withOperand,
            ),
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
  // A logical assignment reads its target and its key before its value runs, and then writes
  // the value.
  if (LOGICAL_OPERATORS.has(node.operatorToken.kind)) {
    const target = node.left;
    const held = translateExpression(target, current.scope, context);
    const key = ts.isElementAccessExpression(target) ? target.argumentExpression : undefined;
    const reads: [ts.Expression, Expression][] = [
      [target, held],
      ...(key === undefined
        ? []
        : [[key, translateExpression(key, current.scope, context)] as [ts.Expression, Expression]]),
    ];
    return ifThenElse(
      isLogicallyWritten(node, held, context),
      evaluate(node.right, current, (after, assigned) =>
        runAssignment(
          node,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, ...reads, [node.right, assigned]]),
            },
          },
          context,
          frame,
          withValue,
        ),
      ),
      withValue(current, held),
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

// The short-circuit or the conditional that an expression evaluates first whose operand that runs
// only sometimes is a call that only statements can run, and the names, properties, and calls that
// can't throw that the expression evaluates before it and that read what the call changes, which
// keep the values that they had then.
const getBranch = (evaluated: ts.Expression | undefined, path: Path, context: Context) => {
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).branch;
  if (node === undefined) return undefined;
  const operands = ts.isConditionalExpression(node)
    ? [node.whenTrue, node.whenFalse]
    : [node.right];
  const reads = getEarlyReads(
    operands.map(skipCasts),
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  const kept = reads.filter(isKeptRead);
  if (kept.length < reads.length || kept.some((inner) => mayThrow(inner, context))) {
    throw new TlaTypeScriptError("tla-ts can't run this before what reads what it changes", node);
  }
  return { node, reads: kept };
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
  if (
    node === undefined ||
    conversion === undefined ||
    getImmutableWrite(node, context) !== undefined
  ) {
    return undefined;
  }
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

// The increment that a statement's expression evaluates first, which runs as its own statement,
// and the names and properties that the statement reads before it that it changes.
const getHoistedIncrement = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).increment;
  if (node === undefined) return undefined;
  const reads = getEarlyReads([node], before, path, context);
  const kept = reads.filter(isKeptRead);
  if (kept.length < reads.length || kept.some((inner) => mayThrow(inner, context))) {
    throw new TlaTypeScriptError("tla-ts can't run this before what reads what it changes", node);
  }
  return { node, reads: kept };
};

// The new Promise inside a statement's expression that it evaluates first, other than one that the
// statement itself runs, which runs as its own statement. Nothing that the statement evaluates
// before it may read what its executor changes.
const getHoistedConstruction = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).construction;
  const outer = skipCasts(evaluated);
  if (
    node === undefined ||
    node === outer ||
    (ts.isBinaryExpression(outer) &&
      outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      skipCasts(outer.right) === node)
  ) {
    return undefined;
  }
  rejectEarlyRun(
    node,
    [node],
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  return node;
};

// The new of a typed array of a value that may be an iterable inside a statement's expression, which
// it evaluates first, other than one that the statement itself runs, which runs as its own
// statement. Nothing that the statement evaluates before it may read what its iterator changes.
const getHoistedTypedArray = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  if (evaluated === undefined) return undefined;
  const before: ts.Node[] = [];
  const node = findLeadingCall(evaluated, before, path, context).typedArray;
  const outer = skipCasts(evaluated);
  if (
    node === undefined ||
    node === outer ||
    (ts.isBinaryExpression(outer) &&
      outer.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      skipCasts(outer.right) === node)
  ) {
    return undefined;
  }
  rejectEarlyRun(
    node,
    [node],
    before.filter((inner) => ts.findAncestor(inner, (ancestor) => ancestor === node) === undefined),
    path,
    context,
  );
  return node;
};

// The spread that a statement's expression evaluates first of a generator object or an iterator,
// which the statement steps to its end as its own statement. Nothing that the statement evaluates
// before it may read what stepping it changes.
const getHoistedSpread = (statement: ts.Statement, path: Path, context: Context) => {
  const evaluated = getEvaluated(statement);
  // A statement that drops the array of its spreads runs them as it translates.
  if (
    evaluated === undefined ||
    (ts.isExpressionStatement(statement) && getIteratedSpreads(evaluated, context) !== undefined)
  ) {
    return undefined;
  }
  const before: ts.Node[] = [];
  const spread = findLeadingCall(evaluated, before, path, context).spread;
  if (spread === undefined) return undefined;
  rejectEarlyRun(
    spread,
    [spread, ...[...path.generators.values()].flatMap((suspension) => suspension.generator ?? [])],
    before.filter(
      (inner) => ts.findAncestor(inner, (ancestor) => ancestor === spread) === undefined,
    ),
    path,
    context,
  );
  return spread;
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

// A class that a block or a script declares, whose name, as a let's, it binds only where its
// declaration runs.
const getClassSymbols = (statement: ts.Statement, context: Context) =>
  ts.isClassDeclaration(statement) &&
  statement.name !== undefined &&
  isHeapClass(statement, context)
    ? (getSymbol(statement.name, context.checker) ?? [])
    : [];

const getHoistedAssignment = (statement: ts.Statement, path: Path, context: Context) => {
  const results = path.scope.results;
  if (ts.isExpressionStatement(statement)) {
    const hoisted = getLeadingAssignment(statement.expression, results, context);
    return hoisted === skipCasts(statement.expression) ? undefined : hoisted;
  }
  const evaluated = getEvaluated(statement);
  const held = evaluated === undefined ? undefined : skipCasts(evaluated);
  const defined = ts.isClassDeclaration(statement)
    ? statement
    : held !== undefined && ts.isClassExpression(held)
      ? held
      : undefined;
  // A class evaluates its computed keys in order as the script defines it, before it makes its
  // objects, so a key that assigns runs first where each key before it is a literal or ran.
  const key = defined?.members
    .map((member) => member.name)
    .find(
      (name): name is ts.ComputedPropertyName =>
        name !== undefined &&
        ts.isComputedPropertyName(name) &&
        !isLiteral(name.expression) &&
        !results.has(name.expression),
    );
  if (key !== undefined) return getLeadingAssignment(key.expression, results, context);
  return evaluated === undefined ? undefined : getLeadingAssignment(evaluated, results, context);
};

// The var declarations and function declarations of a function's body or a script, outside the
// functions and classes that it makes.
const getVarScoped = (node: ts.Node): (ts.VariableDeclarationList | ts.FunctionDeclaration)[] => {
  if (ts.isFunctionDeclaration(node)) return [node];
  if (ts.isFunctionLike(node) || ts.isClassLike(node)) return [];
  // A declare's variable is the host's, which nothing here binds.
  if (
    ts.isVariableDeclarationList(node) &&
    (node.flags & ts.NodeFlags.BlockScoped) === 0 &&
    !(
      ts.isVariableStatement(node.parent) &&
      node.parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword)
    )
  ) {
    return [node];
  }
  const found: (ts.VariableDeclarationList | ts.FunctionDeclaration)[] = [];
  ts.forEachChild(node, (child) => {
    found.push(...getVarScoped(child));
  });
  return found;
};

// The vars that a function's body or a script binds to undefined as it starts, wherever in it they
// are declared, apart from those that a parameter also declares, which hold what it binds, and
// those that name a function that calls inline, which no binding holds.
const getHoistedVars = (statements: readonly ts.Statement[], context: Context) => {
  const scoped = statements.flatMap(getVarScoped);
  const names = scoped.flatMap((declared) =>
    ts.isVariableDeclarationList(declared)
      ? declared.declarations.flatMap((declaration) => getBoundNames(declaration.name))
      : [],
  );
  scoped.forEach((declared) => {
    if (!ts.isFunctionDeclaration(declared) || declared.name === undefined) return;
    const name = declared.name.text;
    const parent = declared.parent;
    const isBlockLevel =
      ts.isCaseClause(parent) ||
      ts.isDefaultClause(parent) ||
      (ts.isBlock(parent) &&
        !ts.isFunctionLike(parent.parent) &&
        !ts.isClassStaticBlockDeclaration(parent.parent));
    const shared = names.find((other) => other.text === name);
    if (!isBlockLevel && shared !== undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't declare a var that a function declaration also declares",
        shared,
      );
    }
  });
  const symbols = [...new Set(names.flatMap((name) => getOwnSymbol(name, context.checker) ?? []))];
  const inlined = symbols.filter((symbol) =>
    (symbol.declarations ?? []).some(
      (declaration) =>
        ts.isVariableDeclaration(declaration) && isInlined(declaration.initializer, context),
    ),
  );
  // Such a var holds undefined until its declaration runs, which a read before it can't give. A
  // read runs before it where code before the declaration runs it: in no function, or in one that
  // such code may call. Code may call a function where it reads a name of it, or of the object or
  // class whose method it is, or where it makes one that nothing names.
  const getNames = (node: ts.Node): ts.Identifier[] | undefined => {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
      return [node.name];
    }
    const held = ts.findAncestor(
      node.parent,
      (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
    );
    if (held !== undefined && ts.isVariableDeclaration(held) && ts.isIdentifier(held.name)) {
      return [held.name];
    }
    return held !== undefined &&
      (ts.isClassLike(held) || ts.isObjectLiteralExpression(held) || ts.isPropertyAssignment(held))
      ? getNames(ts.isPropertyAssignment(held) ? held.parent : held)
      : undefined;
  };
  const isRunEarly = (
    node: ts.Node,
    declaration: ts.Declaration,
    seen: ReadonlySet<ts.Node>,
  ): boolean => {
    const owner = ts.findAncestor(
      node.parent,
      (ancestor) =>
        ts.isFunctionLike(ancestor) &&
        statements.some((statement) => ts.findAncestor(ancestor, (inner) => inner === statement)),
    );
    if (owner === undefined) return node.getStart() < declaration.getStart();
    if (seen.has(owner)) return false;
    const reached = new Set([...seen, owner]);
    const names = getNames(owner);
    if (names === undefined) return isRunEarly(owner, declaration, reached);
    const symbols = names.flatMap((name) => getSymbol(name, context.checker) ?? []);
    return statements.some((statement) =>
      findNodes(
        statement,
        (inner): inner is ts.Identifier =>
          ts.isIdentifier(inner) &&
          !names.includes(inner) &&
          symbols.some((symbol) => symbol === getSymbol(inner, context.checker)),
      ).some((reference) => isRunEarly(reference, declaration, reached)),
    );
  };
  const getEarlyRead = (node: ts.Node): ts.Identifier | undefined => {
    const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
    const declaration = symbol?.valueDeclaration;
    return ts.isIdentifier(node) &&
      symbol !== undefined &&
      declaration !== undefined &&
      inlined.includes(symbol) &&
      isRunEarly(node, declaration, new Set())
      ? node
      : ts.forEachChild(node, getEarlyRead);
  };
  const early = inlined.length === 0 ? undefined : statements.map(getEarlyRead).find(Boolean);
  if (early !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a var that names a function before its declaration runs",
      early,
    );
  }
  return symbols.filter(
    (symbol) => !inlined.includes(symbol) && !(symbol.declarations ?? []).some(ts.isParameter),
  );
};

// Outside strict mode, a function that a block declares assigns the var of its name, where its
// declaration runs, what the block's binding of the name holds, as Annex B.3.2 adds. Code that runs
// more than once makes a new function each time, which no model value stands for.
const translateVarFunction = (
  statement: ts.Statement,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
) => {
  if (!isVarFunction(statement)) return continueWith(path);
  const target = getVarFunctionTarget(statement);
  if (target === undefined || ts.isFunctionDeclaration(target.parent)) {
    throw new TlaTypeScriptError(
      `tla-ts can't assign ${statement.name.text} where a function declaration or an arguments object binds it, as a function that a block declares outside strict mode does`,
      statement,
    );
  }
  if (!isOnce(statement.parent)) {
    return leaf(
      apply("Assert", [
        boolean(false),
        string(
          "tla-ts can't assign a var a function that a block that runs more than once declares",
        ),
      ]),
    );
  }
  const value = translateExpression(statement.name, path.scope, context);
  return continueWith(assign(target, path, context, () => value));
};

// A function's body starts with its vars bound to undefined, unless a statement that ran in part
// runs again from where it left off.
const hoistVars = (statements: readonly ts.Statement[], path: Path, context: Context): Path => {
  const first = statements.at(0);
  const body = first?.parent;
  if (
    first === undefined ||
    body === undefined ||
    !ts.isBlock(body) ||
    body.statements !== statements ||
    !(ts.isFunctionLike(body.parent) || ts.isClassStaticBlockDeclaration(body.parent)) ||
    [...path.scope.results.keys()].some(
      (node) => ts.findAncestor(node, (ancestor) => ancestor === first) !== undefined,
    )
  ) {
    return path;
  }
  // A var that closures share has no binding, as its environment holds it once it's declared.
  const hoisted = getHoistedVars(statements, context).filter(
    (symbol) => getSharedDeclaration(symbol, context) === undefined,
  );
  return hoisted.length === 0
    ? path
    : {
        ...path,
        scope: {
          ...path.scope,
          bindings: new Map([
            ...path.scope.bindings,
            ...hoisted.map((symbol): [ts.Symbol, Expression] => [symbol, getUndefined(context)]),
          ]),
        },
        mutable: new Set([...path.mutable, ...hoisted]),
      };
};

// A statement that writes a local that closures share, which writes the environment that holds the
// local, or makes it where the statement declares the local.
const translateSharedWrite = (
  statement: ts.Statement,
  shared: { symbol: ts.Symbol; declaration: ts.VariableDeclaration },
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const symbol = shared.symbol;
  const key = string(symbol.name);
  const environment = path.scope.activations?.get(shared.declaration);
  const isInitialized = !path.scope.uninitialized.has(symbol);
  const isDeclaration = ts.isVariableStatement(statement);
  if (!isDeclaration && (environment === undefined || !isInitialized)) {
    return leaf(
      apply("Assert", [
        boolean(false),
        string(
          `tla-ts can't write ${symbol.name}, which closures share, outside its declaration's run`,
        ),
      ]),
    );
  }
  const bound =
    environment === undefined || isDeclaration
      ? path
      : {
          ...path,
          mutable: new Set([...path.mutable, symbol]),
          scope: {
            ...path.scope,
            bindings: new Map([
              ...path.scope.bindings,
              [
                symbol,
                useJavaScript(
                  "EnvironmentValue",
                  [getHeap(path.scope, statement, context), environment, key],
                  context,
                ),
              ],
            ]),
          },
        };
  const store = (after: Path) => {
    const value = after.scope.bindings.get(symbol);
    if (value === undefined) throw new TlaTypeScriptError("Unsupported write", statement);
    const heap = getHeap(after.scope, statement, context);
    const stored: Path = {
      ...after,
      mutable: new Set([...after.mutable].filter((other) => other !== symbol)),
      scope: {
        ...after.scope,
        bindings: new Map([...after.scope.bindings].filter((entry) => entry[0] !== symbol)),
        uninitialized: new Set([...after.scope.uninitialized].filter((other) => other !== symbol)),
      },
    };
    if (environment !== undefined && !isDeclaration) {
      return continueWith(
        withHeap(
          stored,
          useJavaScript(
            "SetEnvironment",
            [heap, environment, functionFrom([[key, value]])],
            context,
          ),
          context,
        ),
      );
    }
    const name = context.names.getFresh("environment");
    const made = withHeap(stored, identifier(name), context);
    return bindOnce(
      stored,
      name,
      useJavaScript(
        "Allocate",
        [heap, useJavaScript("EnvironmentObject", [functionFrom([[key, value]])], context)],
        context,
      ),
      continueWith({
        ...made,
        scope: {
          ...made.scope,
          activations: new Map([
            ...(made.scope.activations ?? []),
            [shared.declaration, useJavaScript("Allocated", [identifier(name)], context)],
          ]),
        },
      }),
    );
  };
  return ts.isVariableStatement(statement)
    ? translateDeclarations(statement.declarationList.declarations, bound, context, frame, store)
    : ts.isExpressionStatement(statement)
      ? allocate(statement.expression, bound, context, (inner) =>
          translateExpressionStatement(statement.expression, inner, context, frame, store),
        )
      : store(bound);
};

// The labels that name a statement, from the nearest out.
const getLabels = (statement: ts.Statement): string[] =>
  ts.isLabeledStatement(statement.parent)
    ? [statement.parent.label.text, ...getLabels(statement.parent)]
    : [];

// Whether a statement gives the frame of what it encloses the target of a break, or of a continue: a
// loop, a switch for a break, or for a break a labeled statement of another kind that a break names.
const isJumpOwner = (node: ts.Node, isContinue: boolean): boolean => {
  if (ts.isIterationStatement(node, false)) return true;
  if (isContinue) return false;
  if (ts.isSwitchStatement(node)) return true;
  if (
    !ts.isLabeledStatement(node) ||
    ts.isLabeledStatement(node.statement) ||
    ts.isIterationStatement(node.statement, false) ||
    ts.isSwitchStatement(node.statement)
  ) {
    return false;
  }
  const labels = [node.label.text, ...getLabels(node)];
  const isNamed = (inner: ts.Node): boolean =>
    !ts.isFunctionLike(inner) &&
    !ts.isClassLike(inner) &&
    ((ts.isBreakStatement(inner) &&
      inner.label !== undefined &&
      labels.includes(inner.label.text)) ||
      (ts.forEachChild(inner, isNamed) ?? false));
  return isNamed(node.statement);
};

// Whether a break or a continue goes to the target that the frame holds: that of the nearest
// statement that sets one, which a label must name.
const isOwnJump = (jump: ts.BreakOrContinueStatement) => {
  const isContinue = ts.isContinueStatement(jump);
  const owner = ts.findAncestor(jump.parent, (ancestor) => isJumpOwner(ancestor, isContinue));
  if (owner === undefined || !ts.isStatement(owner)) return false;
  const label = jump.label;
  if (label === undefined) return !ts.isLabeledStatement(owner);
  return ts.isLabeledStatement(owner)
    ? [owner.label.text, ...getLabels(owner)].includes(label.text)
    : getLabels(owner).includes(label.text);
};

export const translateStatements = (
  statements: readonly ts.Statement[],
  entered: Path,
  context: Context,
  frame: Frame,
): Formula => {
  const path = hoistVars(statements, entered, context);
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
  // A statement after the one whose private name ran checked checks its own.
  if (path.scope.brandChecked !== undefined && path.scope.brandChecked !== statements[0]) {
    return translateStatements(
      statements,
      { ...path, scope: { ...path.scope, brandChecked: undefined } },
      context,
      frame,
    );
  }
  if (path.scope.globalsChecked !== undefined && path.scope.globalsChecked !== statements[0]) {
    return translateStatements(
      statements,
      { ...path, scope: { ...path.scope, globalsChecked: undefined } },
      context,
      frame,
    );
  }
  if (path.scope.globalChecked !== undefined && path.scope.globalChecked !== statements[0]) {
    return translateStatements(
      statements,
      { ...path, scope: { ...path.scope, globalChecked: undefined } },
      context,
      frame,
    );
  }
  if (statements.length === 0) return frame.next(path);
  const statement = statements[0];
  // What an assignment or an increment in the statement gave belongs to this run of it, so no path
  // that leaves it keeps that for a later run. A call's result stays, as the objects it made, such
  // as an array whose iterator reads its elements later, still hold it. A statement that tla-ts
  // makes around a function's expression body has no parent, so the body stands for it.
  const root =
    statement.parent === undefined
      ? (ts.forEachChild(statement, (child) => child) ?? statement)
      : statement;
  const isOwn = (node: ts.Node) =>
    isAssignment(node) && ts.findAncestor(node, (ancestor) => ancestor === root) !== undefined;
  const leave = (inner: Path): Path =>
    [...inner.scope.results.keys()].some(isOwn)
      ? {
          ...inner,
          scope: {
            ...inner.scope,
            results: new Map([...inner.scope.results].filter((entry) => !isOwn(entry[0]))),
          },
        }
      : inner;
  const breakTo = frame.breakTo;
  const continueTo = frame.continueTo;
  const throwTo = frame.throwTo;
  const statementFrame: Frame = {
    ...frame,
    next: (inner) => frame.next(leave(inner)),
    exit: (inner, value) => frame.exit(leave(inner), value),
    breakTo: breakTo && ((inner) => breakTo(leave(inner))),
    continueTo: continueTo && ((inner) => continueTo(leave(inner))),
    throwTo: throwTo && ((inner, thrown) => throwTo(leave(inner), thrown)),
  };
  // A statement that reads a built-in that the script may change on the global object runs only
  // where the global object still holds it.
  const globals = new Set<string>();
  const findGlobals = (node: ts.Node) => {
    if (node !== statement && (ts.isStatement(node) || ts.isFunctionLike(node))) return;
    if (ts.isIdentifier(node) && context.checkedGlobals.has(node)) globals.add(node.text);
    ts.forEachChild(node, findGlobals);
  };
  if (context.checkedGlobals.size > 0 && path.scope.globalsChecked !== statement) {
    findGlobals(statement);
  }
  if (globals.size > 0) {
    return ifThenElse(
      useJavaScript(
        "GlobalHolds",
        [getHeap(path.scope, statement, context), set([...globals].map((name) => string(name)))],
        context,
      ),
      translateStatements(
        statements,
        { ...path, scope: { ...path.scope, globalsChecked: statement } },
        context,
        frame,
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't read a built-in that the script changed on the global object"),
        ]),
      ),
    );
  }
  // A block or a function body starts with its lets and consts uninitialized. A synthesized
  // statement, such as an arrow's returned expression, has no parent.
  const block = statement.parent;
  const lexical =
    block !== undefined && ts.isBlock(block) && block.statements === statements
      ? statements.flatMap((inner) =>
          ts.isVariableStatement(inner) &&
          (inner.declarationList.flags & ts.NodeFlags.BlockScoped) !== 0
            ? inner.declarationList.declarations.flatMap((declaration) =>
                ts.isIdentifier(declaration.name)
                  ? (getSymbol(declaration.name, context.checker) ?? [])
                  : [],
              )
            : getClassSymbols(inner, context),
        )
      : [];
  if (lexical.some((symbol) => !path.scope.uninitialized.has(symbol))) {
    return translateStatements(
      statements,
      {
        ...path,
        scope: {
          ...path.scope,
          uninitialized: new Set([...path.scope.uninitialized, ...lexical]),
        },
      },
      context,
      frame,
    );
  }
  // A function's body starts with no environment for the vars that closures share, which their
  // declarations make, so that it reads none of an earlier call's.
  const sharedVars =
    block !== undefined &&
    ts.isBlock(block) &&
    block.statements === statements &&
    ts.isFunctionLike(block.parent)
      ? statements.flatMap((inner) =>
          ts.isVariableStatement(inner)
            ? inner.declarationList.declarations.filter(
                (declaration) => path.scope.activations?.has(declaration) ?? false,
              )
            : [],
        )
      : [];
  if (sharedVars.length > 0) {
    return translateStatements(
      statements,
      {
        ...path,
        scope: {
          ...path.scope,
          activations: new Map(
            [...(path.scope.activations ?? [])].filter(
              (entry) => !sharedVars.some((declaration) => declaration === entry[0]),
            ),
          ),
        },
      },
      context,
      frame,
    );
  }
  // A run of statements that run nothing, such as thousands of vars, passes in one step rather
  // than one statement inside another.
  const unrun = statements.findIndex(
    (inner) =>
      !ts.isEmptyStatement(inner) &&
      !(
        ts.isVariableStatement(inner) &&
        inner.declarationList.declarations.every((declaration) =>
          isUnrun(declaration, path, context),
        )
      ),
  );
  if (unrun !== 0) {
    return translateStatements(unrun === -1 ? [] : statements.slice(unrun), path, context, frame);
  }
  // A derived constructor's this is uninitialized until its super(...), so a statement that reads it
  // first throws a ReferenceError. The functions in the statement read it only as they run.
  const unbound = path.unboundThis ?? new Set();
  const getUnboundReads = (node: ts.Node): ts.Node[] => {
    if (ts.isFunctionLike(node)) return [];
    const isRead =
      (node.kind === ts.SyntaxKind.ThisKeyword ||
        (node.kind === ts.SyntaxKind.SuperKeyword && !ts.isCallExpression(node.parent))) &&
      [...unbound].some((constructor) => constructor === getThisOwner(node));
    const nested: ts.Node[] = [];
    ts.forEachChild(node, (child) => {
      nested.push(...getUnboundReads(child));
    });
    return isRead ? [node, ...nested] : nested;
  };
  const unboundReads =
    unbound.size === 0 || ts.isBlock(statement) || ts.isTryStatement(statement)
      ? []
      : getUnboundReads(ts.isIfStatement(statement) ? statement.expression : statement);
  if (unboundReads.length > 0) {
    const getFirst = (node: ts.Node): ts.Node =>
      ts.isExpressionStatement(node) ||
      ts.isReturnStatement(node) ||
      ts.isThrowStatement(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isPropertyAccessExpression(node) ||
      ts.isElementAccessExpression(node) ||
      ts.isCallExpression(node)
        ? node.expression === undefined
          ? node
          : getFirst(node.expression)
        : ts.isVariableStatement(node) &&
            node.declarationList.declarations[0]?.initializer !== undefined
          ? getFirst(node.declarationList.declarations[0].initializer)
          : ts.isBinaryExpression(node)
            ? getFirst(node.left)
            : node;
    const first = getFirst(statement);
    if (first.kind !== ts.SyntaxKind.ThisKeyword || !unboundReads.includes(first)) {
      throw new TlaTypeScriptError(
        "tla-ts can't read this here before super(...) runs",
        unboundReads[0],
      );
    }
    return throwError("ReferenceError", path, first, context, statementFrame);
  }
  const continueWith = (inner: Path) =>
    translateStatements(statements.slice(1), leave(inner), context, frame);
  const shared = getSharedWrite(statement, context);
  if (shared !== undefined) {
    return translateSharedWrite(statement, shared, path, context, statementFrame, continueWith);
  }
  if (ts.isBlock(statement)) {
    return translateStatements(statement.statements, path, context, {
      ...statementFrame,
      next: continueWith,
    });
  }
  if (ts.isLabeledStatement(statement)) {
    return translateStatements([statement.statement], path, context, {
      ...statementFrame,
      next: continueWith,
      breakTo: isJumpOwner(statement, false) ? continueWith : statementFrame.breakTo,
    });
  }
  if (ts.isEmptyStatement(statement)) return continueWith(path);
  const evaluated = getEvaluated(statement);
  // The calls that the statement runs, apart from those of the statements and functions in it.
  const getCalls = (node: ts.Node): ts.CallExpression[] => {
    if (ts.isFunctionLike(node) || (node !== statement && ts.isStatement(node))) return [];
    const calls = ts.isCallExpression(node) ? [node] : [];
    ts.forEachChild(node, (child) => {
      calls.push(...getCalls(child));
    });
    return calls;
  };
  getCalls(statement).forEach((call) => rejectDeclaredCall(call, context));
  const invalidRegExp = evaluated === undefined ? undefined : getInvalidRegExp(evaluated, context);
  if (invalidRegExp !== undefined) {
    return throwError("SyntaxError", path, invalidRegExp, context, statementFrame);
  }
  // A statement that reads a name that no declaration binds, or a let before its declaration runs,
  // before anything else it evaluates runs, throws a ReferenceError there, as does one that first
  // writes such a let. A script's lets are state variables, which the scope binds before their
  // declarations run.
  // A global that a write outside strict mode makes throws until the write runs, which the
  // statement checks, once, where it reads the global first.
  // A global that a write gave a function holds it in the scope, not in its state variable, so the
  // write ran.
  const isGlobalRead = (name: ts.Identifier) => {
    const symbol = getSymbol(name, context.checker);
    return (
      path.scope.globalChecked !== statement &&
      isImplicitGlobal(name, context) &&
      (symbol === undefined || !path.scope.functions.has(symbol)) &&
      !isPlainWrite(name) &&
      !ts.isTypeOfExpression(
        ts.findAncestor(name.parent, (ancestor) => !ts.isParenthesizedExpression(ancestor)) ??
          name.parent,
      )
    );
  };
  const isThrowing = (name: ts.Identifier) => {
    const symbol = getSymbol(name, context.checker);
    const declaration = symbol?.valueDeclaration;
    return (
      isGlobalRead(name) ||
      isUnresolved(name, context) ||
      (symbol !== undefined &&
        path.scope.uninitialized.has(symbol) &&
        (declaration === undefined || !isOwnClassName(name, declaration)) &&
        ((declaration !== undefined && isTopLevelLexical(declaration)) ||
          !path.scope.bindings.has(symbol)))
    );
  };
  const written =
    evaluated !== undefined &&
    ts.isBinaryExpression(evaluated) &&
    evaluated.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isIdentifier(evaluated.left) &&
    !isUnresolved(evaluated.left, context) &&
    isThrowing(evaluated.left) &&
    isInertValue(evaluated.right)
      ? evaluated.left
      : undefined;
  // A for-of over an array written in place assigns its first element first.
  const loopTarget =
    ts.isForOfStatement(statement) && !ts.isVariableDeclarationList(statement.initializer)
      ? statement.initializer
      : undefined;
  const iterated =
    loopTarget !== undefined && ts.isForOfStatement(statement)
      ? skipCasts(statement.expression)
      : undefined;
  const loopElement =
    iterated !== undefined && ts.isArrayLiteralExpression(iterated)
      ? iterated.elements.at(0)
      : undefined;
  const loopRead =
    loopTarget !== undefined && loopElement !== undefined
      ? getPatternRead(loopTarget, loopElement, context, isThrowing)
      : undefined;
  const unresolved = ts.isClassDeclaration(statement)
    ? getUnresolvedRead(statement, context)
    : evaluated === undefined
      ? undefined
      : (getUnresolvedRead(evaluated, context, isThrowing) ?? written ?? loopRead);
  const throwRead = (read: ts.Identifier) => {
    const thrown = throwError("ReferenceError", path, read, context, statementFrame);
    // A pattern gets its first element through the array's iterator, or its first property
    // through the object's prototypes, and a throw in a for-of looks up its iterator's return.
    const getPatterns = (node: ts.Node): ts.Expression[] =>
      node === statement || node.parent === undefined
        ? []
        : [
            ...(ts.isBinaryExpression(node.parent) &&
            node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            node === node.parent.left &&
            (ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node))
              ? [node]
              : []),
            ...getPatterns(node.parent),
          ];
    const patterns = [
      ...getPatterns(read),
      ...(read === loopRead && loopTarget !== undefined ? [loopTarget] : []),
    ];
    const isIterating =
      read === loopRead || patterns.some((inner) => ts.isArrayLiteralExpression(inner));
    const isReading = patterns.some((inner) => ts.isObjectLiteralExpression(inner));
    // A script that makes no objects can't change what a pattern reads.
    const heap = context.heap === undefined ? undefined : path.scope.bindings.get(context.heap);
    if ((!isIterating && !isReading) || heap === undefined) return thrown;
    const isKept = (key: string) => useJavaScript("IsKept", [heap, string(key)], context);
    return ifThenElse(
      junction("And", [
        ...(isIterating ? [holdsArrayIteration(heap, statement, context)] : []),
        ...(isReading || read === loopRead ? [isKept("Object.prototype")] : []),
        ...(read === loopRead
          ? [isKept("Iterator.prototype"), isKept("%ArrayIteratorPrototype%")]
          : []),
      ]),
      thrown,
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't destructure a value where a script changed what it reads"),
        ]),
      ),
    );
  };
  if (unresolved !== undefined) {
    const symbol = getSymbol(unresolved, context.checker);
    const global =
      symbol !== undefined && isGlobalRead(unresolved)
        ? path.scope.bindings.get(symbol)
        : undefined;
    return global === undefined
      ? throwRead(unresolved)
      : ifThenElse(
          isUnresolvable(global, context),
          throwRead(unresolved),
          translateStatements(
            statements,
            { ...path, scope: { ...path.scope, globalChecked: statement } },
            context,
            frame,
          ),
        );
  }
  // A statement that first uses a private name of an object that lacks it throws a TypeError.
  const leadingPrivate =
    loopTarget !== undefined && iterated !== undefined
      ? ts.isArrayLiteralExpression(iterated) &&
        iterated.elements.length > 0 &&
        isInertValue(iterated)
        ? getLeadingPrivate(loopTarget)
        : undefined
      : evaluated === undefined
        ? undefined
        : getLeadingPrivate(evaluated);
  const privateMember =
    leadingPrivate !== undefined && ts.isPrivateIdentifier(leadingPrivate.name)
      ? getPrivateMember(leadingPrivate.name, context)
      : undefined;
  if (
    leadingPrivate !== undefined &&
    privateMember !== undefined &&
    path.scope.brandChecked !== statement
  ) {
    const checked = translateStatements(
      statements,
      { ...path, scope: { ...path.scope, brandChecked: statement } },
      context,
      frame,
    );
    // An array pattern or a for-of iterates the array before it writes the private name.
    const assigned = evaluated && skipCasts(evaluated);
    const isIterating =
      iterated !== undefined ||
      (assigned !== undefined &&
        ts.isBinaryExpression(assigned) &&
        ts.isArrayLiteralExpression(assigned.left));
    const thrown = throwTypeError(path, leadingPrivate, context, statementFrame);
    return ifThenElse(
      translateHasPrivate(privateMember, leadingPrivate.expression, path.scope, context),
      checked,
      isIterating
        ? ifThenElse(
            translateArrayIteration(
              boolean(true),
              getHeap(path.scope, statement, context),
              statement,
              context,
            ),
            thrown,
            leaf(boolean(false)),
          )
        : thrown,
    );
  }
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
  // A statement whose operands the statement ran first, such as the yields of an array literal,
  // drops what they gave.
  if (
    ts.isExpressionStatement(statement) &&
    !ts.isLiteralExpression(skipCasts(statement.expression)) &&
    isSettled(statement.expression, path.scope.results)
  ) {
    return continueWith(path);
  }
  const leading = getStatementAwaitOrYield(statement, path, context);
  const paused = leading?.paused;
  // The names that the statement read before it suspends keep the values they had then.
  const reads = (leading?.reads ?? []).map((read): [ts.Expression, Expression] => [
    read,
    translateExpression(read, path.scope, context),
  ]);
  const withResult = (after: Path, node: ts.Expression, value: Expression) =>
    translateStatements(
      statements,
      {
        ...after,
        scope: {
          ...after.scope,
          results: new Map([...after.scope.results, ...reads, [node, value]]),
        },
      },
      context,
      frame,
    );
  if (paused !== undefined && ts.isAwaitExpression(paused)) {
    return translateAwait(paused, path, context, statementFrame, (after, value) =>
      withResult(after, paused, value),
    );
  }
  // A yield inside a statement gives the value that the next that resumes the body sends, and a
  // yield* the value that the iterator returns.
  if (
    paused !== undefined &&
    !(ts.isExpressionStatement(statement) && skipCasts(statement.expression) === paused)
  ) {
    if (paused.asteriskToken !== undefined) {
      return translateDelegatedYield(paused, path, context, statementFrame, (after, value) =>
        withResult(after, paused, value ?? getUndefined(context)),
      );
    }
    return translateYield(paused, path, context, statementFrame, (after, sent) =>
      withResult(after, paused, sent ?? getUndefined(context)),
    );
  }
  const hoistedCall = getHoistedCall(statement, path, context);
  if (hoistedCall !== undefined) {
    return allocate(hoistedCall.call, path, context, (allocated) =>
      translateCallStatement(hoistedCall.call, allocated, context, statementFrame, (after, value) =>
        translateStatements(
          statements,
          withLeadingResults(hoistedCall, allocated, after, value, context),
          context,
          frame,
        ),
      ),
    );
  }
  const branch = getBranch(getEvaluated(statement), path, context);
  if (branch !== undefined) {
    // What follows translates once, for each operand that gives the value.
    const kept = branch.reads.map((read): [ts.Expression, Expression] => [
      read,
      translateExpression(read, path.scope, context),
    ]);
    return translateJoined(
      branch.node,
      path,
      context,
      (after, value) =>
        translateStatements(
          statements,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([
                ...after.scope.results,
                ...kept,
                [branch.node, value ?? getUndefined(context)],
              ]),
            },
          },
          context,
          frame,
        ),
      (next) => runBranch(branch.node, path, context, statementFrame, next),
    );
  }
  const hoisted = getHoistedAssignment(statement, path, context);
  const earlier =
    hoisted === undefined || evaluated === undefined
      ? []
      : getEarlierReads(hoisted, evaluated, path.scope, context);
  if (hoisted !== undefined) {
    return runAssignment(hoisted, path, context, statementFrame, (after, value) =>
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
  // An increment runs first, where what the statement reads before it keeps its value from then.
  const increment = getHoistedIncrement(statement, path, context);
  if (increment !== undefined) {
    const kept = increment.reads.map((read): [ts.Expression, Expression] => [
      read,
      translateExpression(read, path.scope, context),
    ]);
    return runAssignment(increment.node, path, context, statementFrame, (after, value) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, ...kept, [increment.node, value]]),
          },
        },
        context,
        frame,
      ),
    );
  }
  const construction = getHoistedConstruction(statement, path, context);
  if (construction !== undefined) {
    return translatePromiseConstruction(construction, path, context, frame, (after, value) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([
              ...after.scope.results,
              [construction, value ?? getUndefined(context)],
            ]),
          },
        },
        context,
        frame,
      ),
    );
  }
  const typedArray = getHoistedTypedArray(statement, path, context);
  const typedConstruction = typedArray && getBufferConstruction(typedArray, context);
  if (typedArray !== undefined && typedConstruction !== undefined) {
    return translateNewBufferStatement(
      typedArray,
      typedConstruction,
      path,
      context,
      statementFrame,
      (after, value) =>
        translateStatements(
          statements,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, [typedArray, value]]),
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
      ? runGetterRead(hoistedRead, path, context, statementFrame, withRead)
      : runProxyOperation(hoistedRead, path, context, statementFrame, withRead);
  }
  // A spread gathers what the iterator gives, as Array.from does.
  const spread = getHoistedSpread(statement, path, context);
  if (spread !== undefined) {
    const made = getCast(spread.expression);
    const rest = (after: Path, values?: Expression) =>
      translateStatements(
        statements,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [spread, values ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
      );
    const gather = (current: Path) =>
      isIterableValue(spread.expression, context)
        ? takeEvery(
            spread,
            translateExpression(spread.expression, current.scope, context),
            current,
            context,
            statementFrame,
            rest,
          )
        : translateGeneratorConsumer(
            spread,
            { method: "from", receiver: spread.expression, values: [], invalid: undefined },
            isBuiltInIteratorType(spread.expression, context)
              ? withBuiltInIterator(
                  spread,
                  current,
                  translateExpression(spread.expression, current.scope, context),
                  context,
                )
              : current,
            context,
            statementFrame,
            rest,
          );
    return ts.isCallExpression(made) && !path.scope.results.has(made)
      ? translateCallStatement(made, path, context, statementFrame, (after, value) =>
          gather({
            ...after,
            scope: {
              ...after.scope,
              results: new Map([...after.scope.results, [made, value ?? getUndefined(context)]]),
            },
          }),
        )
      : gather(path);
  }
  const converted = getHoistedConversion(statement, path, context);
  if (converted !== undefined) {
    const node = converted.node;
    return runConversion(
      node,
      converted.conversion,
      path,
      context,
      statementFrame,
      (after, value) => {
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
      },
    );
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
        statementFrame,
        (defined) =>
          translateVarFunction(
            statement,
            {
              ...defined,
              scope: {
                ...defined.scope,
                uninitialized: new Set(
                  [...defined.scope.uninitialized].filter((other) => other !== symbol),
                ),
              },
            },
            context,
            continueWith,
          ),
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
        statementFrame,
        (inner, innerFrame) =>
          translateStatements(statements.slice(1), leave(inner), context, innerFrame),
      );
    }
    return translateDeclarations(
      statement.declarationList.declarations,
      path,
      context,
      statementFrame,
      continueWith,
    );
  }
  // An if or a switch makes the objects of what it tests first, as it always evaluates that.
  if (ts.isIfStatement(statement)) {
    return allocate(statement.expression, path, context, (allocated) =>
      translateJoined(statement, allocated, context, continueWith, (next) =>
        translateIf(
          statement,
          allocated.scope,
          context,
          (branch) =>
            translateStatements([branch], allocated, context, { ...statementFrame, next }),
          () => next(allocated),
        ),
      ),
    );
  }
  if (ts.isReturnStatement(statement)) {
    const returned = statement.expression;
    if (returned === undefined) return statementFrame.exit(path);
    // An async generator's return awaits its value where it returns, before the finally blocks
    // around it run, and throws there where the value rejects.
    const owner = ts.findAncestor(statement.parent, ts.isFunctionLike);
    const awaitTo = statementFrame.awaitTo;
    const exit =
      owner !== undefined &&
      (ts.isFunctionDeclaration(owner) ||
        ts.isFunctionExpression(owner) ||
        ts.isMethodDeclaration(owner)) &&
      isAsyncGenerator(owner) &&
      awaitTo !== undefined
        ? (current: Path, value?: Expression) =>
            awaitTo(
              current,
              value ?? getUndefined(context),
              returned,
              statementFrame.exit,
              (rejected, reason) => {
                const uncaught = apply("Assert", [boolean(false), string(statement.getText())]);
                return statementFrame.throwTo === undefined
                  ? leaf(uncaught)
                  : statementFrame.throwTo(rejected, { value: reason, uncaught });
              },
            )
        : statementFrame.exit;
    if (statementFrame.inlining.size === 0) {
      throw new TlaTypeScriptError("Actions can't return a value", statement);
    }
    if (getIntlError(skipCasts(returned), context) !== undefined) {
      return translateIntlError(skipCasts(returned), path, context, statementFrame);
    }
    return allocate(returned, path, context, (inner) => {
      const constructed = getCast(returned);
      if (isPromiseConstruction(constructed, context)) {
        return translatePromiseConstruction(constructed, inner, context, statementFrame, exit);
      }
      const constructor = getConstructorRun(returned, context);
      if (constructor !== undefined && ts.isNewExpression(returned)) {
        return translateConstruction(returned, constructor, inner, context, statementFrame, exit);
      }
      // A call that makes an object, such as Object(1), made it as the return allocated it.
      if (
        ts.isCallExpression(returned) &&
        !inner.scope.allocated.has(returned) &&
        (!isLibraryCall(returned, context) ||
          isPromiseCall(returned, context) ||
          getLoopCall(returned, inner, context) !== undefined ||
          isObjectChange(returned, context) ||
          isStatementResult(returned, inner, context) ||
          isRemoving(returned, context))
      ) {
        return translateCallStatement(returned, inner, context, statementFrame, exit);
      }
      return throwReadError(
        returned,
        inner,
        context,
        statementFrame,
        throwRangeError(
          returned,
          inner,
          context,
          statementFrame,
          exit(inner, translateExpression(returned, inner.scope, context)),
        ),
      );
    });
  }
  if (ts.isBreakStatement(statement)) {
    if (statementFrame.breakTo === undefined || !isOwnJump(statement)) {
      throw new TlaTypeScriptError("Unsupported break", statement);
    }
    return statementFrame.breakTo(path);
  }
  if (ts.isContinueStatement(statement)) {
    if (statementFrame.continueTo === undefined || !isOwnJump(statement)) {
      throw new TlaTypeScriptError("Unsupported continue", statement);
    }
    return statementFrame.continueTo(path);
  }
  // A throw makes the objects of what it throws first, but an error outside the heap, which
  // makes none. A new whose constructor runs code runs it as a statement, and throws what it makes.
  if (ts.isThrowStatement(statement)) {
    const thrown = skipCasts(statement.expression);
    const run = getConstructorRun(thrown, context);
    return allocateAll(
      getAllocated(thrown, context).filter(
        (allocation) =>
          !path.scope.allocated.has(allocation) &&
          !(allocation === thrown && isNewError(thrown, context)),
      ),
      path,
      context,
      (allocated) => {
        const throwValue = (after: Path, value: Expression, isGenerator = false) => {
          const uncaught = translateThrow(statement, after.scope, context);
          return statementFrame.throwTo === undefined
            ? leaf(uncaught)
            : statementFrame.throwTo(after, { value, uncaught, isGenerator });
        };
        // A generator object that a call makes or a name holds, which tla-ts follows as it compiles,
        // to a catch's array pattern.
        const created =
          ts.isCallExpression(thrown) && isThrownToArrayPattern(statement)
            ? getCreatedGenerator(thrown, allocated, context)
            : undefined;
        if (created !== undefined && ts.isCallExpression(thrown)) {
          return translateGeneratorCall(
            thrown,
            created,
            allocated,
            context,
            statementFrame,
            (after, ref) => throwValue(after, ref ?? getUndefined(context), true),
          );
        }
        if (
          ts.isIdentifier(thrown) &&
          isGeneratorType(thrown, context) &&
          isThrownToArrayPattern(statement)
        ) {
          return throwValue(allocated, translateExpression(thrown, allocated.scope, context), true);
        }
        return run === undefined
          ? throwValue(allocated, translateThrown(statement.expression, allocated.scope, context))
          : translateConstruction(thrown, run, allocated, context, statementFrame, (after, value) =>
              throwValue(after, value ?? getUndefined(context)),
            );
      },
    );
  }
  if (ts.isTryStatement(statement)) {
    // A TypeError that the try throws without a new, such as of a pattern that destructures
    // undefined, is a new object on the heap that the catch continues with.
    const changed = getChanged(statement, path, context);
    const heap = context.heap;
    return translateJoined(
      statement,
      path,
      context,
      continueWith,
      (next) => translateTry(statement, path, context, statementFrame, next),
      statement.catchClause !== undefined &&
        heap !== undefined &&
        path.mutable.has(heap) &&
        !changed.includes(heap)
        ? [...changed, heap]
        : changed,
    );
  }
  if (ts.isSwitchStatement(statement)) {
    return allocate(statement.expression, path, context, (allocated) =>
      translateJoined(statement, allocated, context, continueWith, (next) =>
        translateSwitch(
          statement,
          allocated.scope,
          context,
          (clause) =>
            translateStatements(clause, allocated, context, {
              ...statementFrame,
              next,
              breakTo: next,
            }),
          () => next(allocated),
        ),
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
  if (assigned !== undefined && getIntlError(assigned, context) !== undefined) {
    return translateIntlError(assigned, path, context, statementFrame);
  }
  const assignedBuffer = assigned && getBufferConstruction(assigned, context);
  if (assignment !== undefined && assigned !== undefined && assignedBuffer !== undefined) {
    return translateNewBufferStatement(
      assigned,
      assignedBuffer,
      path,
      context,
      statementFrame,
      (after, value) =>
        shareHeap(
          path,
          assign(assignment.left, after, context, () => value),
          context,
          continueWith,
        ),
    );
  }
  const dropped = ts.isExpressionStatement(statement) ? skipCasts(statement.expression) : undefined;
  if (dropped !== undefined && getIntlError(dropped, context) !== undefined) {
    return translateIntlError(dropped, path, context, statementFrame);
  }
  const droppedBuffer = dropped && getBufferConstruction(dropped, context);
  if (dropped !== undefined && droppedBuffer !== undefined) {
    return translateNewBufferStatement(
      dropped,
      droppedBuffer,
      path,
      context,
      statementFrame,
      (after) => shareHeap(path, after, context, continueWith),
    );
  }
  // A read of super throws a TypeError where the object that holds the method has no prototype.
  const superLookup =
    dropped !== undefined &&
    (ts.isPropertyAccessExpression(dropped) ||
      (ts.isElementAccessExpression(dropped) && isLiteral(dropped.argumentExpression))) &&
    dropped.expression.kind === ts.SyntaxKind.SuperKeyword
      ? getSuperLookup(dropped, path.scope, context)
      : undefined;
  if (ts.isExpressionStatement(statement) && superLookup?.prototype !== undefined) {
    return ifThenElse(
      apply("=", [superLookup.prototype, identifier("Null")]),
      throwTypeError(path, statement.expression, context, statementFrame),
      allocate(statement.expression, path, context, (inner) =>
        translateExpressionStatement(
          statement.expression,
          inner,
          context,
          statementFrame,
          (after) => shareHeap(path, after, context, continueWith),
        ),
      ),
    );
  }
  if (ts.isExpressionStatement(statement)) {
    return allocate(statement.expression, path, context, (inner) =>
      translateExpressionStatement(statement.expression, inner, context, statementFrame, (after) =>
        shareHeap(path, after, context, continueWith),
      ),
    );
  }
  if (ts.isForOfStatement(statement) && statement.awaitModifier !== undefined) {
    return translateForAwait(statement, path, context, statementFrame, continueWith);
  }
  if (ts.isForOfStatement(statement) && isTakingFromGenerators(statement, context)) {
    return translateForOfTaken(statement, path, context, statementFrame, continueWith);
  }
  if (
    ts.isForOfStatement(statement) &&
    context.heap !== undefined &&
    (isGeneratorType(statement.expression, context) ||
      (isBuiltInIteratorType(statement.expression, context) &&
        !ts.isCallExpression(getCast(statement.expression))))
  ) {
    return translateForOfGenerator(statement, path, context, statementFrame, continueWith);
  }
  if (ts.isIterationStatement(statement, false)) {
    return translateLoop(statement, path, context, statementFrame, continueWith);
  }
  // A function declaration runs nothing where it stands: calls find the function it declares, and
  // one without a body, such as setTimeout, the host defines.
  if (ts.isFunctionDeclaration(statement)) {
    return translateVarFunction(statement, path, context, continueWith);
  }
  // A default export of a literal runs nothing, as a read of the export takes the literal.
  if (ts.isExportAssignment(statement) && isLiteralValue(statement.expression)) {
    return continueWith(path);
  }
  const stop = ts.isClassDeclaration(statement) ? getClassStop(statement, context) : undefined;
  throw new TlaTypeScriptError(stop ?? `Unsupported statement: ${statement.getText()}`, statement);
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
  const owner = body.parent;
  // A function that returns only values may make objects and change them, as no one else can
  // reach them after it returns, where it changed no object that was there before.
  const heapSymbol =
    ts.isFunctionLike(owner) && isValueReturn(owner, context) ? context.heap : undefined;
  const state = [
    ...context.variables.keys(),
    ...(context.heap === undefined ? [] : [context.heap]),
  ].filter((symbol) => symbol !== heapSymbol);
  const leave = (path: Path, value: Expression) => {
    if (state.some((symbol) => path.scope.bindings.get(symbol) !== scope.bindings.get(symbol))) {
      throw new TlaTypeScriptError(
        "A function that an expression calls can change only its locals",
        body,
      );
    }
    const before = heapSymbol === undefined ? undefined : scope.bindings.get(heapSymbol);
    const after = heapSymbol === undefined ? undefined : path.scope.bindings.get(heapSymbol);
    return leaf(
      before === undefined || after === undefined || after === before
        ? value
        : ifExpression(
            useJavaScript("IsExtendedHeap", [after, before], context),
            value,
            apply("Assert", [
              boolean(false),
              string("tla-ts can't change an object that was there before an expression's call"),
            ]),
          ),
    );
  };
  return translateStatements(
    body.statements,
    {
      scope,
      // A parameter is a local binding, which the body may assign as it does a let.
      mutable: new Set([
        ...(heapSymbol === undefined ? [] : [heapSymbol]),
        ...(ts.isFunctionLike(owner) ? owner.parameters : []).flatMap((parameter) => {
          const symbol = ts.isIdentifier(parameter.name)
            ? getSymbol(parameter.name, context.checker)
            : undefined;
          return symbol !== undefined && scope.bindings.has(symbol) ? [symbol] : [];
        }),
      ]),
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

// The heap where the namespace objects of modules hold what their exports hold, after a statement of
// the script ran, before which a let, a const, a class, or a default export that it declares holds
// nothing that a read can see.
const fillNamespaces = (
  files: readonly ts.SourceFile[],
  ran: ts.Statement | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
) => {
  const heapSymbol = context.heap;
  const heap = heapSymbol === undefined ? undefined : path.scope.bindings.get(heapSymbol);
  if (heapSymbol === undefined || heap === undefined) {
    throw new TlaTypeScriptError("tla-ts can't make a module's namespace object here");
  }
  const getExports = (file: ts.SourceFile) => context.namespaces.get(file)?.exports ?? [];
  const name = context.names.getFresh("heap");
  return bindOnce(
    path,
    name,
    files.reduce(
      (current, file) =>
        useJavaScript(
          "Update",
          [
            current,
            getNamespaceRef(file, context),
            useJavaScript(
              "NamespaceObject",
              [
                tuple(getExports(file).map((exported) => string(exported.name))),
                tuple(
                  getExports(file).map((exported) =>
                    ts.isSourceFile(exported.value)
                      ? getNamespaceRef(exported.value, context)
                      : exported.declared !== undefined &&
                          (ran === undefined || exported.declared.pos > ran.pos)
                        ? getUndefined(context)
                        : translateExpression(exported.value, path.scope, context),
                  ),
                ),
              ],
              context,
            ),
          ],
          context,
        ),
      heap,
    ),
    continueWith({
      ...path,
      scope: {
        ...path.scope,
        bindings: new Map([...path.scope.bindings, [heapSymbol, identifier(name)]]),
      },
    }),
  );
};

// The ref of a tagged template's template object, which the heap holds from the start, after the
// namespace objects, with the array of its raw strings after it.
const getTemplateRef = (site: ts.TaggedTemplateExpression, context: Context, offset = 0) =>
  useJavaScript(
    ":>",
    [
      identifier("Ref"),
      number(
        context.generatorPrototypes.size +
          context.namespaces.size +
          2 * context.templateSites.indexOf(site) +
          offset +
          1,
      ),
    ],
    context,
  );

// A template's strings, where one with an escape that a template can't cook, which TypeScript
// gives its raw text, is undefined.
const getTemplateObjects = (site: ts.TaggedTemplateExpression, context: Context) => {
  const template = site.template;
  const literals = ts.isNoSubstitutionTemplateLiteral(template)
    ? [template]
    : [template.head, ...template.templateSpans.map((span) => span.literal)];
  const prototype = translateBuiltInValue("Array.prototype", site, context);
  return [
    useJavaScript(
      "TemplateObject",
      [
        prototype,
        tuple(
          literals.map((literal) =>
            literal.rawText?.includes("\\") === true && literal.text === literal.rawText
              ? getUndefined(context)
              : translateString(literal.text, context),
          ),
        ),
        getTemplateRef(site, context, 1),
      ],
      context,
    ),
    useJavaScript(
      "TemplateRawObject",
      [
        prototype,
        tuple(literals.map((literal) => translateString(getRawString(literal), context))),
      ],
      context,
    ),
  ];
};

export const translateScript = (
  statements: readonly ts.Statement[],
  sourceFile: ts.SourceFile,
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
      : getClassSymbols(statement, context),
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
  // So do the vars that its blocks and loops declare, which aren't state variables.
  const locals = getHoistedVars(statements, context).filter(
    (symbol) => !context.variables.has(symbol),
  );
  const bindings = new Map([
    ...scope.bindings,
    ...[...hoisted, ...locals].map((symbol): [ts.Symbol, Expression] => [
      symbol,
      context.implicitGlobals.has(symbol) ? getUnresolvable(context) : getUndefined(context),
    ]),
  ]);
  // The prototype objects of the generator functions that the script declares.
  const prototypes = [...context.generatorPrototypes.keys()].reduce<Expression>(
    (heap, declaration) =>
      useJavaScript(
        "Allocate",
        [
          heap,
          useJavaScript(
            "GeneratorPrototypeObject",
            [
              translateBuiltInValue(
                "%GeneratorFunction%.prototype.prototype",
                declaration,
                context,
              ),
            ],
            context,
          ),
        ],
        context,
      ),
    identifier("EmptyHeap"),
  );
  const path: Path = {
    scope: {
      ...scope,
      bindings:
        context.heap === undefined
          ? bindings
          : new Map([
              ...bindings,
              [
                context.heap,
                // The namespace objects that the script reads, which take their exports once their
                // modules run, and the template objects of its tagged templates.
                context.namespaces.size === 0 && context.templateSites.length === 0
                  ? prototypes
                  : useJavaScript(
                      "AllocateEach",
                      [
                        prototypes,
                        tuple([
                          ...[...context.namespaces.keys()].map(() => identifier("EmptyObject")),
                          ...context.templateSites.flatMap((site) =>
                            getTemplateObjects(site, context),
                          ),
                        ]),
                      ],
                      context,
                    ),
              ],
            ]),
      uninitialized: new Set(declared),
    },
    mutable: new Set([...context.variables.keys(), ...locals]),
    isAssigned: false,
    isLast,
    isLooping: false,
    generators: new Map(),
    tasks: EMPTY_TASKS,
  };
  const frame: Frame = {
    next: (ended) => drainTasks(ended, context, finish),
    exit: (ended) => drainTasks(ended, context, finish),
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
        // The jobs ran out before a job resumed the body, which Node reports for a script.
        (suspended) =>
          drainTasks(suspended, context, (unsettled) =>
            isLast
              ? leaf(
                  apply("Assert", [
                    boolean(false),
                    string(
                      `${UNSETTLED_AWAIT_WARNING}${getNodeLocation(
                        ts.findAncestor(operand, ts.isAwaitExpression) ?? operand ?? statements[0],
                        true,
                      )}`,
                    ),
                  ]),
                )
              : finish(unsettled),
          ),
      ),
    inlining: new Set(),
  };
  // The modules that the script imports run first, and then the namespace objects that the script
  // reads take what their modules' exports hold. The script's own namespace object takes them again
  // before a statement that follows a statement that declared or wrote one, and as the script ends.
  const changes = context.namespaces.get(sourceFile)?.changes ?? [];
  const getChange = (before: number, refreshed: ts.Statement | undefined) =>
    changes
      .filter(
        (change) => change.end <= before && (refreshed === undefined || change.pos > refreshed.pos),
      )
      .at(-1);
  const translateOwn = (
    own: readonly ts.Statement[],
    refreshed: ts.Statement | undefined,
    current: Path,
  ): Formula => {
    const at = own.findIndex((statement) => getChange(statement.pos, refreshed) !== undefined);
    const change = getChange(at === -1 ? Number.POSITIVE_INFINITY : own[at].pos, refreshed);
    return change === undefined
      ? translateStatements(own, current, context, frame)
      : translateStatements(at === -1 ? own : own.slice(0, at), current, context, {
          ...frame,
          next: (ran) =>
            fillNamespaces([sourceFile], change, ran, context, (filled) =>
              at === -1 ? frame.next(filled) : translateOwn(own.slice(at), change, filled),
            ),
        });
  };
  const boundary = statements.findIndex((statement) => statement.getSourceFile() === sourceFile);
  return context.namespaces.size === 0
    ? translateStatements(statements, path, context, frame)
    : translateStatements(
        boundary === -1 ? statements : statements.slice(0, boundary),
        path,
        context,
        {
          ...frame,
          next: (imported) =>
            fillNamespaces([...context.namespaces.keys()], undefined, imported, context, (filled) =>
              translateOwn(boundary === -1 ? [] : statements.slice(boundary), undefined, filled),
            ),
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
  // A method that changes an array literal changes only the array that the literal makes.
  return isMethodCall(node) &&
    MUTATING_METHODS.has(node.expression.name.text) &&
    !ts.isArrayLiteralExpression(skipCasts(node.expression.expression))
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

// Whether an expression only names a value through identifiers and dots, as Map.prototype.get does.
// The functions that a script writes as an object's then, other than arrows, which take no
// receiver, generators, and async ones.
const getThenMethods = (sourceFile: ts.SourceFile) =>
  findNodes(
    sourceFile,
    (node): node is ts.PropertyAssignment | ts.MethodDeclaration =>
      (ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node)) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "then",
  ).flatMap((node) => {
    const then = ts.isPropertyAssignment(node) ? node.initializer : node;
    return (ts.isFunctionExpression(then) || ts.isMethodDeclaration(then)) &&
      then.asteriskToken === undefined &&
      (ts.getCombinedModifierFlags(then) & ts.ModifierFlags.Async) === 0
      ? [then]
      : [];
  });

const isNamePath = (node: ts.Expression): boolean =>
  ts.isIdentifier(node) ||
  (ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.name) &&
    node.questionDotToken === undefined &&
    isNamePath(node.expression));
