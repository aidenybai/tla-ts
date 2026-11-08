import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import { getUpdatedValue, MUTATING_METHODS, removeLast } from "./collections";
import {
  type Context,
  type FunctionNode,
  getAccessKey,
  getAssignedSetter,
  getCalledMethod,
  getCallee,
  getElement,
  getFunction,
  getNewClass,
  getRunConstructor,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  isHeapClass,
  isMethodCall,
  type MethodCall,
  isStatementNew,
  share,
  isInlined,
  getGenerator,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  translateCondition,
  translateExpression,
  translateKey,
  translateToString,
} from "./expressions";
import { and, bindValue, DISABLED, type Formula, ifThenElse, letIn, leaf, render } from "./formula";
import { getErrorClass, translateEngineError, translateThrown } from "./exceptions";
import {
  getAccessorValue,
  getAllocated,
  getHeap,
  isAllocation,
  isObjectChange,
  translateAllocated,
  translateHoldsMethod,
  translateObjectChange,
  translateObjectValue,
  translatePropertyKey,
} from "./heap";
import { isBuiltInObject } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { getReceiver, translateIf, translateSwitch, translateThrow } from "./functions";
import {
  bindPattern,
  type Bound,
  bindValues,
  createStateScope,
  getDefaulted,
  getOptionalField,
  initialize,
  rejectBeforeDeclaration,
  rejectNestedPattern,
  type Receiver,
  type Scope,
} from "./scope";
import {
  apply,
  boolean,
  call,
  define,
  except,
  exceptAt,
  field,
  identifier,
  ifExpression,
  index,
  number,
  prime,
  string,
  tuple,
  unchanged,
} from "./tla";
import { getField, getKind, getPathStep, isHeapType, isNumberLike } from "./types";

interface Path {
  scope: Scope;
  // State variables and mutable locals, which assignments may change.
  mutable: Set<ts.Symbol>;
  isAssigned: boolean;
  isLast: boolean;
  isLooping: boolean;
}

interface Target {
  symbol: ts.Symbol;
  current: Expression;
  update: (getValue: (current: Expression) => Expression) => Expression;
}

interface Removed {
  value: Expression;
  path: Path;
}

interface Thrown {
  value: Expression;
  uncaught: Expression;
}

interface Frame {
  // What follows the statements once they complete.
  next: (path: Path) => Formula;
  // What a return statement does: end the action, or leave an inlined helper with its value.
  exit: (path: Path, value?: Expression) => Formula;
  breakTo: ((path: Path) => Formula) | undefined;
  continueTo: ((path: Path) => Formula) | undefined;
  throwTo: ((path: Path, thrown: Thrown) => Formula) | undefined;
  // What a yield does in an inlined generator: the generator suspends there for good.
  yieldTo: ((path: Path) => Formula) | undefined;
  // Functions being inlined, to reject recursion.
  inlining: Set<ts.Node>;
}

const COMPOUND_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
]);

const INCREMENT_OPERATORS = new Map<ts.SyntaxKind, string>([
  [ts.SyntaxKind.PlusPlusToken, "+"],
  [ts.SyntaxKind.MinusMinusToken, "-"],
]);

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
  const receiver = node.expression;
  const isBuiltIn = context.heap !== undefined && isBuiltInObject(receiver, context);
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
    if (symbol === undefined || current === undefined || !path.mutable.has(symbol)) {
      throw new TlaTypeScriptError(
        `Only state variables and local lets can change: ${node.text}`,
        node,
      );
    }
    return { symbol, current, update: (getValue) => getValue(current) };
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

// Assigns a value to a target, or to each target in a destructuring pattern. Every value is read
// before any target changes, so [a, b] = [b, a] swaps.
const getDefaultedTarget = (node: ts.Expression) =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ? { target: node.left, initializer: node.right }
    : { target: node, initializer: undefined };

const isPattern = (node: ts.Expression) =>
  ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node);

const assignPattern = (
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: Expression,
  path: Path,
  context: Context,
): Path => {
  if (ts.isArrayLiteralExpression(target)) {
    return target.elements.reduce((current, element, position) => {
      if (ts.isOmittedExpression(element)) return current;
      if (ts.isSpreadElement(element)) {
        throw new TlaTypeScriptError("Rest elements can't be assigned", element);
      }
      const defaulted = getDefaultedTarget(element);
      if (isPattern(defaulted.target)) rejectNestedPattern(element, current.scope);
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
            : getElement(value, number(position + 1), context),
          defaulted.initializer,
          current.scope,
          context,
        ),
        current,
        context,
      );
    }, path);
  }
  if (ts.isObjectLiteralExpression(target)) {
    return target.properties.reduce((current, property) => {
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
      if (isPattern(defaulted.target)) rejectNestedPattern(property, current.scope);
      return assignPattern(
        defaulted.target,
        undefined,
        defaulted.initializer === undefined
          ? getField(value, key)
          : getDefaulted(
              getOptionalField(value, key, context),
              defaulted.initializer,
              current.scope,
              context,
            ),
        current,
        context,
      );
    }, path);
  }
  return assign(target, path, context, () => value);
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
  if (!isMethodCall(node)) return undefined;
  const method = node.expression.name.text;
  if (method !== "shift" && method !== "pop") return undefined;
  const receiver = node.expression.expression;
  if (getKind(receiver, context) !== "sequence") return undefined;
  const sequence = translateExpression(receiver, path.scope, context);
  return {
    value:
      method === "shift" ? apply("Head", [sequence]) : index(sequence, [apply("Len", [sequence])]),
    path: assign(receiver, path, context, (current) =>
      method === "shift" ? apply("Tail", [current]) : removeLast(current),
    ),
  };
};

// The path after an assignment, such as x = 1, x += 1, or x++.
const getAssignedPath = (expression: ts.Expression, path: Path, context: Context) => {
  if (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression)) {
    const operator = INCREMENT_OPERATORS.get(expression.operator);
    if (operator !== undefined && !isNumberLike(expression.operand, context)) {
      throw new TlaTypeScriptError(`${expression.getText()} needs a number`, expression);
    }
    return operator === undefined
      ? undefined
      : assign(expression.operand, path, context, (current) =>
          apply(operator, [current, number(1)]),
        );
  }
  if (!ts.isBinaryExpression(expression)) return undefined;
  const kind = expression.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    const assigned = getFunction(expression.right);
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
    const after = assignPattern(expression.left, expression.right, value, path, context);
    if (symbol === undefined || !after.scope.functions.has(symbol)) return after;
    const functions = new Map(after.scope.functions);
    functions.delete(symbol);
    return { ...after, scope: { ...after.scope, functions } };
  }
  const isConcatenated =
    kind === ts.SyntaxKind.PlusEqualsToken && getKind(expression.left, context) === "string";
  const operator = isConcatenated ? "\\o" : COMPOUND_OPERATORS.get(kind);
  if (operator === undefined) return undefined;
  if (
    !isConcatenated &&
    (!isNumberLike(expression.left, context) || !isNumberLike(expression.right, context))
  ) {
    throw new TlaTypeScriptError(`${expression.operatorToken.getText()} needs numbers`, expression);
  }
  const value = isConcatenated
    ? translateToString(expression.right, path.scope, context)
    : translateExpression(expression.right, path.scope, context);
  return assign(expression.left, path, context, (current) => apply(operator, [current, value]));
};

const translateCallStatement = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
  isGenerator = false,
): Formula => {
  const loopCallback = getLoopCallback(expression, path, context);
  if (loopCallback !== undefined && isMethodCall(expression)) {
    return translateLoopCall(expression, loopCallback, path, context, frame, continueWith);
  }
  const first = expression.arguments.at(0);
  if (
    first !== undefined &&
    ts.isCallExpression(first) &&
    !path.scope.results.has(first) &&
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
        isGenerator,
      ),
    );
  }
  const translateArguments = (argumentNodes: readonly ts.Expression[]) =>
    argumentNodes.map((argument) => translateExpression(argument, path.scope, context));
  const heapSymbol = context.heap;
  if (isObjectChange(expression) && heapSymbol !== undefined) {
    const translated = translateObjectChange(expression, path.scope, context);
    const name = context.names.getFresh(translated.isFallible ? "change" : "heap");
    const withHeap = (heap: Expression) => ({
      ...path,
      scope: {
        ...path.scope,
        bindings: new Map([...path.scope.bindings, [heapSymbol, heap]]),
      },
    });
    if (!translated.isFallible) {
      return bindOnce(path, name, translated.change, continueWith(withHeap(identifier(name))));
    }
    const after = withHeap(field(identifier(name), "heap"));
    return bindOnce(
      path,
      name,
      translated.change,
      ifThenElse(
        field(identifier(name), "isDone"),
        continueWith(after),
        throwTypeError(after, expression, context, frame),
      ),
    );
  }
  const called = isGenerator ? undefined : getCalledMethod(expression.expression, context);
  if (isMethodCall(expression) && called === undefined) {
    const receiver = expression.expression.expression;
    const method = expression.expression.name.text;
    if (
      method === "next" &&
      expression.arguments.length === 0 &&
      ts.isCallExpression(receiver) &&
      getGenerator(receiver.expression, context) !== undefined
    ) {
      return translateCallStatement(receiver, path, context, frame, continueWith, true);
    }
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
    if (MUTATING_METHODS.has(method) && kind !== "other") {
      return continueWith(
        assign(receiver, path, context, (current) => {
          const value = getUpdatedValue(current, kind, expression, path.scope, context);
          if (value === undefined) {
            throw new TlaTypeScriptError(`Unsupported method: ${method}`, expression);
          }
          return value;
        }),
      );
    }
  }
  const callee = isGenerator
    ? getGenerator(expression.expression, context)
    : (called?.method ?? getCallback(expression.expression, path, context));
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
    isGenerator,
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

const getCallback = (node: ts.Expression, path: Path, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  return (symbol && path.scope.functions.get(symbol)) ?? getCallee(node, context);
};

// Runs a function's body as statements, for a call or a new that a statement makes.
const inlineBody = (
  node: ts.Expression,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
  isGenerator: boolean,
): Formula => {
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", node);
  }
  // A parameter's default makes its objects whether or not the call passes the parameter, as
  // making an object that nothing reads can't be seen.
  const defaults = callee.parameters
    .flatMap((parameter) => getAllocated(parameter, context))
    .filter((allocation) => !path.scope.allocated.has(allocation));
  if (defaults.length > 0) {
    return allocateAll(defaults, path, context, (allocated) =>
      inlineBody(
        node,
        callee,
        argumentNodes,
        receiver,
        allocated,
        context,
        frame,
        continueWith,
        isGenerator,
      ),
    );
  }
  const callbacks = callee.parameters.flatMap(
    (parameter, position): [ts.Symbol, FunctionNode][] => {
      const argument = argumentNodes.at(position);
      const callback = argument && getCallback(argument, path, context);
      const symbol = getSymbol(parameter.name, context.checker);
      return callback?.body !== undefined && symbol !== undefined ? [[symbol, callback]] : [];
    },
  );
  const isValue = (position: number) => {
    const parameter = callee.parameters.at(position);
    return (
      parameter === undefined ||
      !callbacks.some((entry) => entry[0] === getSymbol(parameter.name, context.checker))
    );
  };
  const bound = bindValues(
    callee.parameters.filter((_, position) => isValue(position)),
    argumentNodes
      .filter((_, position) => isValue(position))
      .map((argument) => translateExpression(argument, path.scope, context)),
    path.scope,
    context,
  );
  const calleeBody = callee.body;
  if (calleeBody === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const body = ts.isBlock(calleeBody)
    ? calleeBody.statements
    : [
        getWritten(calleeBody) === undefined
          ? ts.factory.createReturnStatement(calleeBody)
          : ts.factory.createExpressionStatement(calleeBody),
      ];
  const scope = {
    ...bound.scope,
    functions: new Map([...bound.scope.functions, ...callbacks]),
    receiver,
  };
  return translateJoined(node, path, context, continueWith, (next) => {
    const afterCall = (inner: Path, value?: Expression) =>
      next({ ...inner, scope: { ...inner.scope, previous: path.scope.previous } }, value);
    return letIn(
      bound.definitions,
      translateStatements(body, { ...path, scope }, context, {
        next: afterCall,
        exit: afterCall,
        breakTo: undefined,
        continueTo: undefined,
        throwTo: frame.throwTo,
        yieldTo: isGenerator ? afterCall : undefined,
        inlining: new Set([...frame.inlining, callee]),
      }),
    );
  });
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

// The callback of an array method that changes what a statement can see, such as a count of its
// calls, which the method runs as a loop of statements.
const getLoopCallback = (node: ts.Expression, path: Path, context: Context) => {
  if (!isMethodCall(node) || !LOOP_METHODS.has(node.expression.name.text)) return undefined;
  if (getKind(node.expression.expression, context) !== "sequence") return undefined;
  const argument = node.arguments.at(0);
  const callback = argument && getCallback(argument, path, context);
  return callback?.body !== undefined &&
    (ts.isArrowFunction(callback) ||
      ts.isFunctionExpression(callback) ||
      ts.isFunctionDeclaration(callback)) &&
    getChanged(callback, path, context).length > 0
    ? callback
    : undefined;
};

// Runs an array method's callback on each element in turn, as statements. An array is a value
// that the callback can't change, so the method visits each of the elements it had.
const translateLoopCall = (
  expression: MethodCall,
  callback: FunctionNode,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const receiver = expression.expression.expression;
  const method = expression.expression.name.text;
  const changed = getChanged(callback, path, context);
  const isReceiverChanged = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) &&
      changed.some((symbol) => symbol === getSymbol(node, context.checker))) ||
    (ts.forEachChild(node, (child) => isReceiverChanged(child) || undefined) ?? false);
  if (isReceiverChanged(receiver)) {
    throw new TlaTypeScriptError("Don't change an array while its method calls back", receiver);
  }
  if (changed.some((symbol) => path.scope.functions.has(symbol))) {
    throw new TlaTypeScriptError("Don't reassign a function inside a callback", callback);
  }
  const isReversed = method === "reduceRight" || method.startsWith("findLast");
  const isReduce = method.startsWith("reduce");
  const initial = isReduce ? expression.arguments.at(1) : undefined;
  const name = context.names.getFresh("Loop");
  const sequenceName = context.names.getFresh("sequence");
  const sequence = identifier(sequenceName);
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
  const repeat = (current: Path, next: Expression) =>
    leaf(call(name, [step, next, ...getValues(current)]));
  const done = (current: Path, result: Expression) => leaf(tuple([result, ...getValues(current)]));
  const element = index(sequence, [identifier(position)]);
  const kept = identifier(accumulator);
  const afterCallback = (current: Path, value?: Expression) => {
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
    return repeat(current, method === "map" ? apply("Append", [kept, result]) : result);
  };
  const finished =
    new Map([
      ["every", boolean(true)],
      ["some", boolean(false)],
      ["findIndex", number(-1)],
      ["findLastIndex", number(-1)],
    ]).get(method) ??
    (["filter", "map"].includes(method) || isReduce ? kept : getUndefined(context));
  const inner = {
    ...withValues(
      path,
      parameters.map((parameter) => identifier(parameter)),
    ),
    isLooping: true,
  };
  const bound = bindValues(
    callback.parameters,
    [...(isReduce ? [kept] : []), element, apply("-", [identifier(position), number(1)]), sequence],
    inner.scope,
    context,
  );
  const body = callback.body;
  if (body === undefined) throw new TlaTypeScriptError("Give this a body", callback);
  const statements = ts.isBlock(body)
    ? body.statements
    : [
        getWritten(body) === undefined
          ? ts.factory.createReturnStatement(body)
          : ts.factory.createExpressionStatement(body),
      ];
  const callbackFrame: Frame = {
    next: afterCallback,
    exit: afterCallback,
    breakTo: undefined,
    continueTo: undefined,
    throwTo:
      frame.throwTo &&
      (() => {
        throw new TlaTypeScriptError(
          "Catch inside the callback, or throw after the call",
          callback,
        );
      }),
    yieldTo: undefined,
    inlining: new Set([...frame.inlining, callback]),
  };
  const isInRange = isReversed
    ? apply(">=", [identifier(position), number(1)])
    : apply("<=", [identifier(position), apply("Len", [sequence])]);
  const operator: OperatorDefinition = {
    ...define(
      name,
      [position, accumulator, ...parameters].map((parameter) => ({ name: parameter, arity: 0 })),
      render(
        ifThenElse(
          isInRange,
          letIn(
            bound.definitions,
            translateStatements(
              statements,
              {
                ...inner,
                scope: {
                  ...bound.scope,
                  receiver: ts.isArrowFunction(callback) ? inner.scope.receiver : undefined,
                },
              },
              context,
              callbackFrame,
            ),
          ),
          done(inner, finished),
        ),
      ),
    ),
    isRecursive: true,
  };
  const length = apply("Len", [sequence]);
  const start = isReversed ? length : number(1);
  const result = context.names.getFresh("loop");
  const runLoop = (from: Expression, seed: Expression) =>
    letIn(
      [operator, define(result, [], call(name, [from, seed, ...getValues(path)]))],
      continueWith(
        {
          ...withValues(
            path,
            changed.map((_, offset) => index(identifier(result), [number(offset + 2)])),
          ),
          isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
        },
        index(identifier(result), [number(1)]),
      ),
    );
  // A reduce without an initial value starts from the first element it visits, and throws a
  // TypeError for an empty array.
  const seeded = !isReduce
    ? runLoop(start, ["filter", "map"].includes(method) ? tuple([]) : getUndefined(context))
    : initial !== undefined
      ? runLoop(start, translateExpression(initial, path.scope, context))
      : ifThenElse(
          apply("=", [length, number(0)]),
          throwTypeError(path, expression, context, frame),
          runLoop(
            isReversed ? apply("-", [length, number(1)]) : number(2),
            index(sequence, [start]),
          ),
        );
  return letIn(
    [define(sequenceName, [], translateExpression(receiver, path.scope, context))],
    seeded,
  );
};

// The constructor that a new of a heap class runs, where a statement runs it.
const getConstructorRun = (node: ts.Expression, context: Context) => {
  const created = getNewClass(node, context);
  return created !== undefined && ts.isNewExpression(node) && isStatementNew(node)
    ? getRunConstructor(created)
    : undefined;
};

// A new of a heap class whose constructor runs statements, which runs them with the instance
// that the statement allocated as this, and gives the instance.
const translateConstruction = (
  expression: ts.NewExpression,
  constructor: ts.ConstructorDeclaration,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const instance = translateObjectValue(expression, path.scope, context);
  return inlineBody(
    expression,
    constructor,
    expression.arguments ?? [],
    { value: instance, method: constructor },
    path,
    context,
    frame,
    (after) => continueWith(after, instance),
    false,
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
  if (ts.isCallExpression(expression)) {
    return translateCallStatement(expression, path, context, frame, continueWith);
  }
  const constructor = getConstructorRun(expression, context);
  if (constructor !== undefined && ts.isNewExpression(expression)) {
    return translateConstruction(expression, constructor, path, context, frame, continueWith);
  }
  if (ts.isYieldExpression(expression)) {
    const yielded = expression.expression;
    const isSimple =
      yielded === undefined || ts.isIdentifier(yielded) || ts.isLiteralExpression(yielded);
    if (frame.yieldTo === undefined || expression.asteriskToken !== undefined || !isSimple) {
      throw new TlaTypeScriptError("Unsupported yield", expression);
    }
    return frame.yieldTo(path);
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
    return ifThenElse(
      apply("=", [
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
        path,
        context,
        frame,
        (after) => continueWith(after),
        false,
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which setter this assignment runs"),
        ]),
      ),
    );
  }
  const newAssigned =
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isNewExpression(expression.right)
      ? expression.right
      : undefined;
  const assignedConstructor = newAssigned && getConstructorRun(newAssigned, context);
  if (
    newAssigned !== undefined &&
    assignedConstructor !== undefined &&
    ts.isBinaryExpression(expression)
  ) {
    return translateConstruction(
      newAssigned,
      assignedConstructor,
      path,
      context,
      frame,
      (after, value) =>
        continueWith(
          assignPattern(
            expression.left,
            newAssigned,
            value ?? getUndefined(context),
            after,
            context,
          ),
        ),
    );
  }
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isCallExpression(expression.right) &&
    isStatementResult(expression.right, path, context)
  ) {
    const right = expression.right;
    return translateCallStatement(right, path, context, frame, (after, value) =>
      continueWith(
        assignPattern(expression.left, right, value ?? getUndefined(context), after, context),
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
  // A new of a value that isn't a class that the script declares, such as a built-in method,
  // throws a TypeError if the value isn't a constructor. tla-ts can't call one that is. Its
  // arguments run first, so they must be values that can't throw.
  const isInert = (argument: ts.Expression): boolean =>
    ts.isLiteralExpression(argument) ||
    ts.isIdentifier(argument) ||
    ts.isFunctionExpression(argument) ||
    ts.isArrowFunction(argument) ||
    [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
      argument.kind,
    ) ||
    (ts.isArrayLiteralExpression(argument) && argument.elements.every(isInert)) ||
    (ts.isObjectLiteralExpression(argument) &&
      argument.properties.every(
        (property) =>
          ts.isPropertyAssignment(property) &&
          !ts.isComputedPropertyName(property.name) &&
          isInert(property.initializer),
      ));
  if (
    ts.isNewExpression(expression) &&
    context.heap !== undefined &&
    getNewClass(expression, context) === undefined &&
    getErrorClass(getSymbol(expression.expression, context.checker), context.checker) ===
      undefined &&
    !["Set", "Map"].includes(expression.expression.getText()) &&
    (expression.arguments ?? []).every(isInert)
  ) {
    return ifThenElse(
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
  }
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
  return write === undefined
    ? continueWith(assigned)
    : ifThenElse(
        useJavaScript("CanPut", [write.heap, write.ref, write.key], context),
        continueWith(assigned),
        throwTypeError(path, expression, context, frame),
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
  if (ts.isObjectLiteralExpression(node) || isAllocation(node, context)) return true;
  const isRead =
    (ts.isIdentifier(node) && getKind(node, context) === "object") ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      getKind(node.expression, context) === "object") ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      getKind(node.right, context) === "object") ||
    (ts.isObjectBindingPattern(node) &&
      isHeapType(context.checker.getTypeAtLocation(node), node, context));
  if (isRead) return true;
  if (ts.isCallExpression(node)) {
    const callee = getCallee(node.expression, context);
    if (callee !== undefined && !visited.has(callee)) {
      visited.add(callee);
      if (usesHeap(callee, context, visited)) return true;
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
  if (context.heap === undefined || !ts.isCallExpression(node) || isMethodCall(node)) return false;
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    (symbol && path.scope.functions.get(symbol)) ?? getCallee(node.expression, context);
  return callee?.body !== undefined && usesHeap(callee, context, new Set());
};

// A call whose value only statements can compute, which an assignment or a declaration takes.
const isStatementResult = (node: ts.CallExpression, path: Path, context: Context) =>
  isHeapCall(node, path, context) || getLoopCallback(node, path, context) !== undefined;

// The expression that parentheses and casts wrap.
const getCast = (node: ts.Expression): ts.Expression =>
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
    isHeapCall(node, path, context) ||
    getLoopCallback(node, path, context) !== undefined ||
    (callee?.body !== undefined && ts.forEachChild(callee.body, hasTry) === true)
  );
};

// Makes the objects that a node's object literals create, before the statement that evaluates
// them runs, since an expression can't change the heap.
const allocate = (
  node: ts.Node | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula =>
  allocateAll(node === undefined ? [] : getAllocated(node, context), path, context, continueWith);

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
      const ref = useJavaScript("Allocated", [identifier(name)], context);
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
const bindOnce = (path: Path, name: string, value: Expression, rest: Formula) =>
  path.isLooping
    ? letIn(
        [define(name, [], value)],
        ifThenElse(apply("=", [identifier(name), identifier(name)]), rest, leaf(boolean(false))),
      )
    : bindValue(name, value, rest);

// Throws the TypeError that JavaScript throws where a change to an object fails.
const throwTypeError = (path: Path, node: ts.Node, context: Context, frame: Frame) => {
  const uncaught = apply("Assert", [boolean(false), string("TypeError")]);
  return frame.throwTo === undefined
    ? leaf(uncaught)
    : frame.throwTo(path, { value: translateEngineError("TypeError", node, context), uncaught });
};

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

const translateDeclarations = (
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
  if (isInlined(initializer, context)) {
    return translateDeclarations(
      declarations.slice(1),
      { ...path, scope: initialize(path.scope, declaration, context) },
      context,
      frame,
      continueWith,
    );
  }
  return allocate(initializer, path, context, (allocated) => {
    const constructor = initializer && getConstructorRun(initializer, context);
    if (constructor !== undefined && initializer !== undefined && ts.isNewExpression(initializer)) {
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
    if (
      initializer !== undefined &&
      ts.isCallExpression(initializer) &&
      isStatementResult(initializer, allocated, context)
    ) {
      return translateCallStatement(initializer, allocated, context, frame, (after, value) =>
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
        : translateExpression(initializer, allocated.scope, context));
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
  const bound = bindPattern(declaration.name, value, path.scope, context);
  const symbol = ts.isIdentifier(declaration.name)
    ? getSymbol(declaration.name, context.checker)
    : undefined;
  const isLet = (declaration.parent.flags & ts.NodeFlags.Const) === 0;
  const mutable = isLet && symbol !== undefined ? new Set([...path.mutable, symbol]) : path.mutable;
  return letIn(
    bound.definitions,
    translateDeclarations(
      declarations.slice(1),
      { ...path, scope: initialize(bound.scope, declaration, context), mutable },
      context,
      frame,
      continueWith,
    ),
  );
};

const getChanged = (loop: ts.Node, path: Path, context: Context) => {
  const changed = new Set<ts.Symbol>();
  const visited = new Set<ts.Node>();
  const getFunctionNode = (node: ts.Expression) => {
    const symbol = getSymbol(node, context.checker);
    return (
      (symbol && path.scope.functions.get(symbol)) ??
      getCallee(node, context) ??
      getGenerator(node, context) ??
      getCalledMethod(node, context)?.method
    );
  };
  const visit = (node: ts.Node) => {
    const written =
      ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer)
        ? node.initializer
        : getWritten(node);
    if (written !== undefined) {
      getWrittenSymbols(written, context).forEach((symbol) => changed.add(symbol));
    }
    const isHeapChanged =
      ts.isObjectLiteralExpression(node) ||
      ts.isDeleteExpression(node) ||
      isObjectChange(node) ||
      isAllocation(node, context) ||
      (written !== undefined &&
        (ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written)));
    if (context.heap !== undefined && isHeapChanged) changed.add(context.heap);
    if (ts.isCallExpression(node)) {
      [node.expression, ...node.arguments].forEach((callee) => {
        const called = getFunctionNode(callee);
        if (called !== undefined && !visited.has(called)) {
          visited.add(called);
          visit(called);
        }
      });
    }
    const setter = getAssignedSetter(node, context);
    if (setter !== undefined && !visited.has(setter)) {
      visited.add(setter);
      visit(setter);
    }
    ts.forEachChild(node, visit);
  };
  visit(loop);
  return [...path.mutable].filter((symbol) => changed.has(symbol));
};

// Translates a statement whose paths may each continue with what follows it. A script translates
// what follows once, as an operator of what the statement changes and the value it gives, instead
// of once for each path. A path that changes what the operator can't take, such as a var it
// declares, falls back to translating what follows on each path.
const translateJoined = (
  node: ts.Node,
  path: Path,
  context: Context,
  continueWith: (path: Path, value?: Expression) => Formula,
  translateWith: (next: (inner: Path, value?: Expression) => Formula) => Formula,
): Formula => {
  if (context.heap === undefined) return translateWith(continueWith);
  const changed = getChanged(node, path, context);
  const name = context.names.getFresh("Join");
  const parameters = changed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const result = context.names.getFresh("result");
  const isVarInside = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    return (
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0 &&
      ts.findAncestor(declaration, (ancestor) => ancestor === node) !== undefined
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
      isKept(exit.path.scope.bindings, path.scope.bindings) &&
      isKept(exit.path.scope.functions, path.scope.functions),
  );
  if (!isJoinable) return translateWith(continueWith);
  if (exits.length === 0) return joined;
  const isValued = exits.some((exit) => exit.value !== undefined);
  const rest = continueWith(
    {
      ...path,
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

const translateLoop = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const initializer = ts.isForStatement(loop) ? loop.initializer : undefined;
  if (initializer === undefined)
    return translateIterations(loop, path, context, frame, continueWith);
  const runLoop = (inner: Path) => translateIterations(loop, inner, context, frame, continueWith);
  return ts.isVariableDeclarationList(initializer)
    ? translateDeclarations(initializer.declarations, path, context, frame, runLoop)
    : translateExpressionStatement(initializer, path, context, frame, runLoop);
};

const translateIterations = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const iterated = ts.isForOfStatement(loop) || ts.isForInStatement(loop) ? loop : undefined;
  const isForIn =
    iterated !== undefined &&
    ts.isForInStatement(iterated) &&
    (getKind(iterated.expression, context) === "object" ||
      (context.heap !== undefined && isBuiltInObject(iterated.expression, context)));
  if (ts.isForInStatement(loop) && !isForIn) {
    throw new TlaTypeScriptError("for-in iterates only objects", loop.expression);
  }
  if (iterated !== undefined && !isForIn && getKind(iterated.expression, context) !== "sequence") {
    throw new TlaTypeScriptError("Only arrays have an order to iterate in", iterated.expression);
  }
  const changed = getChanged(loop, path, context);
  // A for-in skips a key that its body deletes before visiting it, which a list of keys can't.
  if (isForIn && changed.some((symbol) => symbol === context.heap)) {
    throw new TlaTypeScriptError("Don't change objects while a for-in iterates one", loop);
  }
  if (changed.some((symbol) => path.scope.functions.has(symbol))) {
    throw new TlaTypeScriptError("Don't reassign a function inside a loop", loop);
  }
  const isIteratedChanged = (node: ts.Node): boolean =>
    (ts.isIdentifier(node) &&
      changed.some((symbol) => symbol === getSymbol(node, context.checker))) ||
    (ts.forEachChild(node, (child) => isIteratedChanged(child) || undefined) ?? false);
  if (iterated !== undefined && isIteratedChanged(iterated.expression)) {
    throw new TlaTypeScriptError(
      "Don't change an array while a for-of iterates it",
      iterated.expression,
    );
  }
  const name = context.names.getFresh("Loop");
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
  const done = (current: Path) => leaf(tuple(getValues(current)));
  const repeat = (current: Path) =>
    leaf(
      call(name, [
        ...(iterated === undefined ? [] : [apply("+", [identifier(position), number(1)])]),
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
    exit: () => {
      throw new TlaTypeScriptError("Return after the loop ends instead", loop);
    },
    breakTo: done,
    continueTo: ts.isDoStatement(loop) ? testAgain : advance,
    throwTo:
      frame.throwTo &&
      (() => {
        throw new TlaTypeScriptError("Catch inside the loop, or throw after it ends", loop);
      }),
    yieldTo:
      frame.yieldTo &&
      (() => {
        throw new TlaTypeScriptError("Yield outside loops", loop);
      }),
  };
  const translateBody = (current: Path) => {
    if (iterated === undefined) {
      return translateStatements([loop.statement], current, context, bodyFrame);
    }
    const declared = iterated.initializer;
    const element = index(identifier(sequence), [identifier(position)]);
    if (!ts.isVariableDeclarationList(declared)) {
      const assigned = assignPattern(declared, undefined, element, current, context);
      return translateStatements([loop.statement], assigned, context, bodyFrame);
    }
    if (declared.declarations.length !== 1) {
      throw new TlaTypeScriptError("Declare one element of a for-of", declared);
    }
    rejectCatchRedeclaration(declared.declarations[0]);
    const bound = bindPattern(declared.declarations[0].name, element, current.scope, context);
    return letIn(
      bound.definitions,
      translateStatements([loop.statement], { ...current, scope: bound.scope }, context, bodyFrame),
    );
  };
  const inner = {
    ...bindValues(
      path,
      parameters.map((parameter) => identifier(parameter)),
    ),
    isLooping: true,
  };
  const operator: OperatorDefinition = {
    ...define(
      name,
      [...(iterated === undefined ? [] : [position]), ...parameters].map((parameter) => ({
        name: parameter,
        arity: 0,
      })),
      render(
        ts.isDoStatement(loop)
          ? translateBody(inner)
          : ifThenElse(test(inner), translateBody(inner), done(inner)),
      ),
    ),
    isRecursive: true,
  };
  const result = context.names.getFresh("loop");
  const after = bindValues(
    path,
    changed.map((_, position) => index(identifier(result), [number(position + 1)])),
  );
  return letIn(
    [
      ...(iterated === undefined
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
                : translateExpression(iterated.expression, path.scope, context),
            ),
          ]),
      operator,
      define(
        result,
        [],
        call(name, [...(iterated === undefined ? [] : [number(1)]), ...getValues(path)]),
      ),
    ],
    continueWith({
      ...after,
      isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
    }),
  );
};

// A call to a built-in function that changes nothing, which an expression can make.
const isLibraryCall = (node: ts.CallExpression, context: Context) =>
  getWritten(node) === undefined &&
  (context.checker.getResolvedSignature(node)?.getDeclaration()?.getSourceFile()
    .isDeclarationFile ??
    false);

const hasCall = (node: ts.Node, context: Context): boolean =>
  (ts.isCallExpression(node) && !isLibraryCall(node, context)) ||
  ts.isNewExpression(node) ||
  (ts.forEachChild(node, (child) => hasCall(child, context) || undefined) ?? false);

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
    return letIn(
      bound.definitions,
      translateStatements(
        catchClause.block.statements,
        { ...caught, scope: bound.scope },
        context,
        outer,
      ),
    );
  };
  return translateStatements(
    statement.tryBlock.statements,
    { ...path, scope: { ...path.scope, isCatching: true } },
    context,
    { ...outer, throwTo: handle },
  );
};

const translateStatements = (
  statements: readonly ts.Statement[],
  path: Path,
  context: Context,
  frame: Frame,
): Formula => {
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
  if (ts.isClassDeclaration(statement) && isHeapClass(statement, context)) {
    const symbol = statement.name && getSymbol(statement.name, context.checker);
    return allocate(statement, path, context, (inner) => {
      const ref = inner.scope.allocated.get(statement);
      if (symbol === undefined || ref === undefined) {
        throw new TlaTypeScriptError("Name this class", statement);
      }
      return continueWith({
        ...inner,
        scope: { ...inner.scope, bindings: new Map([...inner.scope.bindings, [symbol, ref]]) },
      });
    });
  }
  if (ts.isVariableStatement(statement)) {
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
      if (ts.isCallExpression(returned) && !isLibraryCall(returned, context)) {
        return translateCallStatement(returned, inner, context, frame, frame.exit);
      }
      if (hasCall(returned, context)) throw new TlaTypeScriptError("Unsupported return", statement);
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
  if (ts.isExpressionStatement(statement)) {
    return allocate(statement.expression, path, context, (inner) =>
      translateExpressionStatement(statement.expression, inner, context, frame, (after) =>
        shareHeap(after, context, continueWith),
      ),
    );
  }
  if (ts.isIterationStatement(statement, false)) {
    return translateLoop(statement, path, context, frame, continueWith);
  }
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
    },
    context,
    {
      next: finish,
      exit: finish,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: undefined,
      yieldTo: undefined,
      inlining: new Set(),
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
  return translateStatements(
    statements,
    {
      scope: {
        ...scope,
        bindings:
          context.heap === undefined
            ? scope.bindings
            : new Map([...scope.bindings, [context.heap, identifier("EmptyHeap")]]),
        uninitialized: new Set(declared),
      },
      mutable: new Set(context.variables.keys()),
      isAssigned: false,
      isLast,
      isLooping: false,
    },
    context,
    {
      next: finish,
      exit: finish,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: undefined,
      yieldTo: undefined,
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

const getWrittenSymbols = (target: ts.Expression, context: Context): ts.Symbol[] => {
  if (ts.isArrayLiteralExpression(target)) {
    return target.elements.flatMap((element) => getWrittenSymbols(element, context));
  }
  if (ts.isObjectLiteralExpression(target)) {
    return target.properties.flatMap((property) =>
      ts.isPropertyAssignment(property)
        ? getWrittenSymbols(property.initializer, context)
        : ts.isShorthandPropertyAssignment(property)
          ? getWrittenSymbols(property.name, context)
          : [],
    );
  }
  if (ts.isSpreadElement(target)) return getWrittenSymbols(target.expression, context);
  const root = getRoot(target);
  const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
  return symbol === undefined ? [] : [symbol];
};

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
