import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import { getUpdatedValue, MUTATING_METHODS, removeLast } from "./collections";
import {
  type Context,
  type FunctionNode,
  getCalledMethod,
  getCallee,
  getElement,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  isMethodCall,
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
import { translateEngineError, translateThrown } from "./exceptions";
import {
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
import { translateIf, translateSwitch, translateThrow } from "./functions";
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
  const objectMethod = isGenerator ? undefined : getCalledMethod(expression.expression, context);
  if (isMethodCall(expression) && objectMethod === undefined) {
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
  const getCallback = (node: ts.Expression) => {
    const symbol = getSymbol(node, context.checker);
    return (symbol && path.scope.functions.get(symbol)) ?? getCallee(node, context);
  };
  const callee = isGenerator
    ? getGenerator(expression.expression, context)
    : (objectMethod ?? getCallback(expression.expression));
  if (callee?.body === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", expression);
  }
  const callbacks = callee.parameters.flatMap(
    (parameter, position): [ts.Symbol, FunctionNode][] => {
      const argument = expression.arguments.at(position);
      const callback = argument && getCallback(argument);
      const symbol = getSymbol(parameter.name, context.checker);
      return callback !== undefined && symbol !== undefined ? [[symbol, callback]] : [];
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
    translateArguments(expression.arguments.filter((_, position) => isValue(position))),
    path.scope,
    context,
  );
  const calleeBody = callee.body;
  const body = ts.isBlock(calleeBody)
    ? calleeBody.statements
    : [
        getWritten(calleeBody) === undefined
          ? ts.factory.createReturnStatement(calleeBody)
          : ts.factory.createExpressionStatement(calleeBody),
      ];
  const scope = { ...bound.scope, functions: new Map([...bound.scope.functions, ...callbacks]) };
  const call = translateJoined(expression, path, context, continueWith, (next) => {
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
  return objectMethod === undefined || !isMethodCall(expression)
    ? call
    : ifThenElse(
        translateHoldsMethod(expression.expression, objectMethod, path.scope, context),
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
  if (ts.isCallExpression(expression)) {
    return translateCallStatement(expression, path, context, frame, continueWith);
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
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    isHeapCall(expression.right, path, context)
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

// Makes the objects that a node's object literals create, before the statement that evaluates
// them runs, since an expression can't change the heap.
const allocate = (
  node: ts.Node | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const symbol = context.heap;
  const allocations = node === undefined ? [] : getAllocated(node, context);
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
  if (isInlined(initializer)) {
    return translateDeclarations(
      declarations.slice(1),
      { ...path, scope: initialize(path.scope, declaration, context) },
      context,
      frame,
      continueWith,
    );
  }
  return allocate(initializer, path, context, (allocated) => {
    if (initializer !== undefined && isHeapCall(initializer, allocated, context)) {
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
      getCalledMethod(node, context)
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
