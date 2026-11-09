import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import {
  checkElement,
  getArrayLikeCall,
  getCallbackReceiver,
  getUpdatedValue,
  HOLE_SKIPPING_METHODS,
  translateMethodElements,
  MUTATING_METHODS,
  removeLast,
} from "./collections";
import {
  getObjectGetter,
  type HeapFunction,
  type Context,
  type FunctionNode,
  getAccessKey,
  getAssignedSetter,
  getCalledMethod,
  getCallee,
  getElement,
  getFunctionOrGenerator,
  isGenerator,
  isPlain,
  getNewClass,
  skipCasts,
  isPrivateMember,
  isStatic,
  getPrivateMember,
  getPrivateKey,
  getParameters,
  getRunConstructor,
  getSetters,
  changesState,
  getArgumentsOwner,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  isHeapClass,
  isHeapFunction,
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
  translateHasPrivate,
  translateHoldsMethod,
  translateMemberKey,
  translateObjectChange,
  translateFunctionValue,
  translateObjectValue,
  translatePropertyKey,
} from "./heap";
import { isBuiltInObject, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { getReceiver, mayThrow, translateIf, translateSwitch, translateThrow } from "./functions";
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
  set,
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
  record,
  prime,
  string,
  tuple,
  unchanged,
} from "./tla";
import {
  isBooleanLike,
  rejectAnyReceiver,
  getField,
  getKind,
  isHeapArray,
  getPathStep,
  isHeapType,
  isNumberLike,
  isGeneratorType,
  rejectGeneratorUse,
} from "./types";

interface Path {
  scope: Scope;
  // State variables and mutable locals, which assignments may change.
  mutable: Set<ts.Symbol>;
  isAssigned: boolean;
  isLast: boolean;
  isLooping: boolean;
  // The generator objects that the statements made, by name, with where each one's body suspended.
  generators: ReadonlyMap<string, Suspension>;
}

interface KnownDefault {
  initializer: ts.Expression;
  isRun: boolean;
}

interface Suspension {
  ref: Expression;
  generator: FunctionNode;
  // Runs the rest of the body from the path of the call that resumes it, or undefined once the
  // generator completes.
  resume: ((path: Path) => Formula) | undefined;
  isStarted: boolean;
  isInTry: boolean;
  // The call that resumed the body, while it runs, which takes what it yields or returns.
  caller?: {
    path: Path;
    step: (path: Path, value: Expression | undefined, isDone: boolean) => Formula;
    throwTo: Frame["throwTo"];
  };
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
  // What a yield does in a generator's body, with the statements after it.
  yieldTo:
    | ((path: Path, value: Expression | undefined, rest: (path: Path) => Formula) => Formula)
    | undefined;
  // Functions being inlined, to reject recursion.
  inlining: Set<ts.Node>;
}

const COMPOUND_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, "+"],
  [ts.SyntaxKind.MinusEqualsToken, "-"],
  [ts.SyntaxKind.AsteriskEqualsToken, "*"],
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
]);

// An arithmetic operator, which the JavaScript module computes in a script that names NaN,
// Infinity, or -0.
const applyArithmetic = (operator: string, operands: Expression[], context: Context) => {
  const name = context.hasSpecialNumbers ? NUMBER_OPERATORS.get(operator) : undefined;
  return name === undefined ? apply(operator, operands) : useJavaScript(name, operands, context);
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
    if (symbol === undefined || current === undefined || !path.mutable.has(symbol)) {
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
      const part = isHeapType(
        context.checker.getNonNullableType(context.checker.getTypeAtLocation(target)),
        target,
        context,
      )
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
          applyArithmetic(operator, [current, number(1)], context),
        );
  }
  if (!ts.isBinaryExpression(expression)) return undefined;
  const kind = expression.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    const assigned = getFunctionOrGenerator(expression.right);
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
  if (LOGICAL_OPERATORS.has(kind)) {
    if (!ts.isIdentifier(expression.left)) {
      throw new TlaTypeScriptError(
        `${expression.operatorToken.getText()} assigns only to variables`,
        expression,
      );
    }
    const right = expression.right;
    const left = expression.left;
    return assign(left, path, context, (current) => {
      const isTruthy = isBooleanLike(left, context)
        ? current
        : useJavaScript("ToBoolean", [current], context);
      const assigned = translateExpression(right, path.scope, context);
      context.prelude.add("Null");
      return kind === ts.SyntaxKind.QuestionQuestionEqualsToken
        ? ifExpression(
            apply("\\in", [current, set([getUndefined(context), identifier("Null")])]),
            assigned,
            current,
          )
        : kind === ts.SyntaxKind.BarBarEqualsToken
          ? ifExpression(isTruthy, current, assigned)
          : ifExpression(isTruthy, assigned, current);
    });
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
  return assign(expression.left, path, context, (current) =>
    isConcatenated
      ? apply(operator, [current, value])
      : applyArithmetic(operator, [current, value], context),
  );
};

const translateCallStatement = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const loop = getLoopCall(expression, path, context);
  if (loop !== undefined) {
    return translateLoopCall(expression, loop, path, context, frame, continueWith);
  }
  // A first argument that reads properties of a call's result runs the call first.
  const getRootCall = (node: ts.Expression | undefined): ts.Expression | undefined =>
    node !== undefined && ts.isPropertyAccessExpression(node) ? getRootCall(node.expression) : node;
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
  if (isGeneratorStep(expression, context)) {
    const receiver = getCast(expression.expression.expression);
    if (
      ts.isCallExpression(receiver) &&
      !path.scope.results.has(receiver) &&
      isStatementCall(receiver, path, context)
    ) {
      return translateCallStatement(receiver, path, context, frame, (after, value) =>
        translateGeneratorStep(
          expression,
          {
            ...after,
            scope: {
              ...after.scope,
              results: new Map([
                ...after.scope.results,
                [receiver, value ?? getUndefined(context)],
              ]),
            },
          },
          context,
          frame,
          continueWith,
        ),
      );
    }
    return translateGeneratorStep(expression, path, context, frame, continueWith);
  }
  const created = getCreatedGenerator(expression, path, context);
  if (created !== undefined) {
    rejectGeneratorUse(expression, context);
    return translateGeneratorCall(expression, created, path, context, frame, continueWith);
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
    // Each change but Reflect.construct gives the object it changes.
    const target = expression.arguments.at(0);
    const value =
      expression.expression.name.text === "construct" || target === undefined
        ? undefined
        : translateObjectValue(target, path.scope, context);
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
  const callee = called?.method ?? getCallback(expression.expression, path, context);
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

const getCallback = (node: ts.Expression, path: Path, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const assigned = symbol && path.scope.functions.get(symbol);
  if (assigned === undefined) return getCallee(node, context);
  return isPlain(assigned) ? assigned : undefined;
};

// The generator that a callee names: one that a variable holds, or one declared elsewhere.
const getGeneratorCallee = (node: ts.Expression, path: Path, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const assigned = symbol && path.scope.functions.get(symbol);
  return assigned !== undefined && isGenerator(assigned) ? assigned : getGenerator(node, context);
};

// Binds a call's arguments to its callee's parameters. A parameter's default makes its objects
// whether or not the call passes the parameter, as making an object that nothing reads can't be
// seen.
const bindCall = (
  node: ts.Expression,
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
  const callbacks = parameters.flatMap((parameter, position): [ts.Symbol, FunctionNode][] => {
    const argument = argumentNodes.at(position);
    const callback = argument && getCallback(argument, path, context);
    const symbol = getSymbol(parameter.name, context.checker);
    return callback?.body !== undefined && symbol !== undefined ? [[symbol, callback]] : [];
  });
  const isValue = (position: number) => {
    const parameter = parameters.at(position);
    return (
      parameter === undefined ||
      !callbacks.some((entry) => entry[0] === getSymbol(parameter.name, context.checker))
    );
  };
  const bound = bindValues(
    parameters.filter((_, position) => isValue(position)),
    argumentNodes
      .filter((_, position) => isValue(position))
      .map((argument) => translateExpression(argument, path.scope, context)),
    path.scope,
    context,
  );
  const scope = {
    ...bound.scope,
    functions: new Map([...bound.scope.functions, ...callbacks]),
    receiver,
  };
  const heapSymbol = context.heap;
  const body = callee.body;
  const isArgumentsNamed =
    body !== undefined &&
    findNodes(
      body,
      (inner): inner is ts.Identifier => getArgumentsOwner(inner, context.checker) === callee,
    ).length > 0;
  if (!isArgumentsNamed || heapSymbol === undefined) {
    return continueWith({ definitions: bound.definitions, scope }, path);
  }
  if (callbacks.length > 0 || argumentNodes.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError("Unsupported arguments object", node);
  }
  // The arguments object of the call, which the scope holds under the body that names it.
  const heap = context.names.getFresh("heap");
  const made = useJavaScript(
    "ArgumentsObject",
    [
      tuple(argumentNodes.map((argument) => translateExpression(argument, path.scope, context))),
      translateBuiltInValue("get Function.prototype.arguments", node, context),
    ],
    context,
  );
  return continueWith(
    {
      definitions: [
        ...bound.definitions,
        define(heap, [], useJavaScript("Allocate", [getHeap(scope, node, context), made], context)),
      ],
      scope: {
        ...scope,
        bindings: new Map([...scope.bindings, [heapSymbol, identifier(heap)]]),
        allocated: new Map([
          ...scope.allocated,
          [body, useJavaScript("Allocated", [identifier(heap)], context)],
        ]),
      },
    },
    path,
  );
};

const getBody = (callee: FunctionNode) => {
  const calleeBody = callee.body;
  if (calleeBody === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  return ts.isBlock(calleeBody)
    ? calleeBody.statements
    : [
        getWritten(calleeBody) === undefined
          ? ts.factory.createReturnStatement(calleeBody)
          : ts.factory.createExpressionStatement(calleeBody),
      ];
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
): Formula =>
  bindCall(node, callee, argumentNodes, receiver, path, context, frame, (bound, inner) =>
    translateJoined(node, inner, context, continueWith, (next) => {
      const afterCall = (after: Path, value?: Expression) =>
        next({ ...after, scope: { ...after.scope, previous: inner.scope.previous } }, value);
      return letIn(
        bound.definitions,
        translateStatements(getBody(callee), { ...inner, scope: bound.scope }, context, {
          next: afterCall,
          exit: afterCall,
          breakTo: undefined,
          continueTo: undefined,
          throwTo: frame.throwTo,
          yieldTo: undefined,
          inlining: new Set([...frame.inlining, callee]),
        }),
      );
    }),
  );

// Makes the generator object that a call to a generator gives, whose body runs only as its
// next, return, and throw methods resume it. A path tracks where each generator's body suspended,
// as the rest of the body's statements, so a statement that resumes it runs them there.
const makeGenerator = (
  node: ts.CallExpression,
  callee: FunctionNode,
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  bindCall(node, callee, node.arguments, receiver, path, context, frame, (bound, inner) => {
    const name = context.names.getFresh("generator");
    const heapSymbol = context.heap;
    const ref =
      heapSymbol === undefined
        ? record("Record", [{ name: "generator", value: string(name) }])
        : useJavaScript("Allocated", [identifier(name)], context);
    const changed = getChanged(callee, inner, context);
    const isOuter = (symbol: ts.Symbol) =>
      !(symbol.declarations ?? []).some(
        (declaration) =>
          ts.findAncestor(declaration, (ancestor) => ancestor === callee) !== undefined,
      );
    const getCaller = (current: Path) => {
      const caller = current.generators.get(name)?.caller;
      if (caller === undefined) throw new TlaTypeScriptError("Unsupported generator", node);
      return caller;
    };
    // The path of the call that resumed the body, with what the body changed outside itself.
    const leave = (current: Path, resume: Suspension["resume"]): Path => {
      const callerPath = getCaller(current).path;
      return {
        ...callerPath,
        isAssigned: current.isAssigned,
        generators: new Map([
          ...current.generators,
          [
            name,
            { ref, generator: callee, resume, isStarted: true, isInTry: current.scope.isCatching },
          ],
        ]),
        scope: {
          ...callerPath.scope,
          bindings: new Map([
            ...callerPath.scope.bindings,
            ...changed.flatMap((symbol): [ts.Symbol, Expression][] => {
              const value = current.scope.bindings.get(symbol);
              return isOuter(symbol) && value !== undefined ? [[symbol, value]] : [];
            }),
          ]),
        },
      };
    };
    // The path where the body resumes, with the state outside it as the resuming call sees it.
    const enter = (resumer: Path, suspended: Path): Path => ({
      ...suspended,
      isAssigned: resumer.isAssigned,
      isLast: resumer.isLast,
      mutable: new Set([...suspended.mutable, ...resumer.mutable]),
      generators: resumer.generators,
      scope: {
        ...suspended.scope,
        bindings: new Map([
          ...suspended.scope.bindings,
          ...[...resumer.scope.bindings].filter((entry) => isOuter(entry[0])),
        ]),
      },
    });
    const finish = (current: Path, value?: Expression) =>
      getCaller(current).step(leave(current, undefined), value, true);
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
      yieldTo: (current, value, rest) =>
        getCaller(current).step(
          leave(current, (resumer) => rest(enter(resumer, current))),
          value,
          false,
        ),
      inlining: new Set([...frame.inlining, callee]),
    };
    const start = { ...inner, scope: bound.scope };
    const suspension: Suspension = {
      ref,
      generator: callee,
      resume: (resumer) =>
        translateStatements(getBody(callee), enter(resumer, start), context, bodyFrame),
      isStarted: false,
      isInTry: false,
    };
    const made = { ...inner, generators: new Map([...inner.generators, [name, suspension]]) };
    if (heapSymbol === undefined) return letIn(bound.definitions, continueWith(made, ref));
    return letIn(
      bound.definitions,
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
    );
  });

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
    (current, value, isDone) => {
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
  );
};

// Resumes the generator whose object a receiver holds, for its next, return, or throw. Only a next
// runs the body; a return or a throw completes a generator that suspended outside try statements,
// which would otherwise run their finally blocks.
const resumeGenerator = (
  node: ts.Node,
  receiver: Expression,
  method: string,
  argument: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  step: (path: Path, value: Expression | undefined, isDone: boolean) => Formula,
): Formula => {
  const run = (name: string, suspension: Suspension) => {
    if (suspension.caller !== undefined) {
      throw new TlaTypeScriptError("tla-ts can't resume a generator that is running", node);
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
    if (resume !== undefined && suspension.isStarted && suspension.isInTry) {
      throw new TlaTypeScriptError("tla-ts can't close a generator that suspended in try", node);
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

// The values that an array pattern takes from a generator object, through its next: one for each
// element, or every one for a rest element, after which a pattern without one closes a generator
// that isn't done. The source makes the generator object or names a variable that holds one, or
// else this gives undefined. The pattern binds the values once the generator has run, so the
// generator must not read what the pattern binds, and the pattern's defaults, like the other
// expressions that evaluate before the pattern, must not read what the generator changes.
const takeFromGenerator = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  source: ts.Expression,
  others: readonly ts.Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, values: Expression) => Formula,
): Formula | undefined => {
  const elements: readonly ts.Node[] = pattern.elements;
  const restAt = elements.findIndex(
    (element) =>
      ts.isSpreadElement(element) ||
      (ts.isBindingElement(element) && element.dotDotDotToken !== undefined),
  );
  const count = restAt === -1 ? elements.length : Infinity;
  const take = (receiver: Expression, generators: FunctionNode[], current: Path) => {
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
      throw new TlaTypeScriptError(
        "tla-ts can't interleave this pattern with a generator",
        pattern,
      );
    }
    rejectEarlyRun(
      pattern,
      generators,
      [...getInitializers(pattern), ...defaults, ...others.filter((other) => other !== source)],
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
            (after, value, isDone) =>
              isDone
                ? continueWith(after, tuple(values))
                : step(after, [...values, value ?? getUndefined(context)]),
          );
    return step(current, []);
  };
  const node = getCast(source);
  const created = ts.isCallExpression(node) ? getCreatedGenerator(node, path, context) : undefined;
  if (created !== undefined && ts.isCallExpression(node)) {
    return translateGeneratorCall(node, created, path, context, frame, (after, ref) =>
      take(ref ?? getUndefined(context), [created.generator], after),
    );
  }
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const held = symbol && path.scope.bindings.get(symbol);
  if (held === undefined) return undefined;
  const generators = [...path.generators.values()];
  const exact = generators.filter((suspension) => isSameExpression(suspension.ref, held));
  return take(
    held,
    (exact.length > 0 ? exact : generators).map((suspension) => suspension.generator),
    path,
  );
};

// Rejects running nodes before expressions that JavaScript evaluates first, where those expressions
// read what the nodes change.
const rejectEarlyRun = (
  node: ts.Node,
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
        ts.isPropertyAccessExpression(found) ||
        ts.isElementAccessExpression(found) ||
        found.kind === ts.SyntaxKind.ThisKeyword,
    ).length > 0;
  if (
    evaluated.some(
      (inner) =>
        getSymbols(inner, context).some((symbol) => changed.has(symbol)) ||
        (isHeapChanged && readsHeap(inner)),
    )
  ) {
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
  const pending = known
    .filter((entry) => entry.isRun)
    .map((entry) => getCast(entry.initializer))
    .filter(
      (initializer): initializer is ts.CallExpression =>
        ts.isCallExpression(initializer) &&
        !path.scope.results.has(initializer) &&
        (isStatementCall(initializer, path, context) ||
          (path.scope.isCatching && mayThrow(initializer, context))),
    );
  const first = pending.at(0);
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

// The nodes in a tree, its root included, that a test picks.
const findNodes = <T extends ts.Node>(root: ts.Node, test: (node: ts.Node) => node is T) => {
  const found: T[] = [];
  const visit = (node: ts.Node) => {
    if (test(node)) found.push(node);
    ts.forEachChild(node, (child) => {
      visit(child);
    });
  };
  visit(root);
  return found;
};

// The global undefined, which a local variable could shadow.
const isUndefinedLiteral = (node: ts.Expression, context: Context) =>
  ts.isIdentifier(node) &&
  node.text === "undefined" &&
  (context.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Undefined) !== 0;

const isSameExpression = (left: Expression, right: Expression) => {
  const withoutLocations = (key: string, value: unknown) =>
    key === "location" ? undefined : value;
  return JSON.stringify(left, withoutLocations) === JSON.stringify(right, withoutLocations);
};

// A call to the next, return, or throw of a generator object.
const isGeneratorStep = (node: ts.CallExpression, context: Context): node is MethodCall =>
  isMethodCall(node) &&
  ["next", "return", "throw"].includes(node.expression.name.text) &&
  isGeneratorType(node.expression.expression, context);

// The generator that a call makes a generator object of, with the method it calls, if any.
const getCreatedGenerator = (node: ts.CallExpression, path: Path, context: Context) => {
  const called = getCalledMethod(node.expression, context, true);
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

// The callback of an array method that changes what a statement can see, such as a count of its
// calls, which the method runs as a loop of statements.
interface LoopCall {
  method: string;
  // The array, or the array-like object that Array.prototype's method calls back for.
  receiver: ts.Expression;
  callback: FunctionNode;
  argument: ts.Expression;
  initial: ts.Expression | undefined;
  isArrayLike: boolean;
}

const getLoopCall = (node: ts.Expression, path: Path, context: Context): LoopCall | undefined => {
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
  const callbackArguments = isCall ? node.arguments.slice(1) : node.arguments;
  if (!LOOP_METHODS.has(method) || (!isArrayLike && getKind(receiver, context) !== "sequence")) {
    return undefined;
  }
  const argument = callbackArguments.at(0);
  const callback = argument && getCallback(argument, path, context);
  return argument !== undefined &&
    callback?.body !== undefined &&
    (ts.isArrowFunction(callback) ||
      ts.isFunctionExpression(callback) ||
      ts.isFunctionDeclaration(callback)) &&
    getChanged(callback, path, context).length > 0
    ? { method, receiver, callback, argument, initial: callbackArguments.at(1), isArrayLike }
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
  const changed = getChanged(callback, path, context);
  // An array-like object's method reads its elements as it visits them, which a callback that
  // changes objects could change.
  if (loop.isArrayLike && changed.some((symbol) => symbol === context.heap)) {
    throw new TlaTypeScriptError("Don't change objects in this callback", callback);
  }
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
  // The array parameter holds a sequence, which only a parameter typed as an array can read.
  const callbackParameters = getParameters(callback);
  const arrayName = callbackParameters.at(isReduce ? 3 : 2)?.name;
  if (
    arrayName !== undefined &&
    ts.isIdentifier(arrayName) &&
    getKind(arrayName, context) !== (loop.isArrayLike ? "object" : "sequence") &&
    (context.checker.getTypeAtLocation(arrayName).flags & ts.TypeFlags.Unknown) === 0
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
  const isSkippingHoles = loop.isArrayLike && HOLE_SKIPPING_METHODS.has(method);
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
    // A generator from before the loop resumes only outside it, as each iteration's path ends.
    generators: new Map(),
  };
  const getChecked = (value: Expression, at: number) =>
    loop.isArrayLike
      ? checkElement(
          value,
          callbackParameters[at],
          getHeap(inner.scope, receiver, context),
          context,
        )
      : value;
  const bound = bindValues(
    callbackParameters,
    [
      ...(isReduce ? [getChecked(kept, 0)] : []),
      getChecked(element, isReduce ? 1 : 0),
      isSkippingHoles
        ? index(field(identifier(presentName), "indices"), [identifier(position)])
        : apply("-", [identifier(position), number(1)]),
      loop.isArrayLike ? owner : sequence,
    ],
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
                  receiver: getCallbackReceiver(loop.argument, callback, inner.scope, context),
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
      [operator],
      bindOnce(
        path,
        result,
        call(name, [from, seed, ...getValues(path)]),
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
    [
      define(ownerName, [], translateExpression(receiver, path.scope, context)),
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
              loop.isArrayLike ? "ArrayLike" : undefined,
              receiver,
              path.scope,
              context,
            ),
      ),
    ],
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
  constructor: ts.ConstructorDeclaration | HeapFunction,
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
  );
};

// A class's static fields and blocks, which run in order once the class exists, with the class
// as this.
const translateStaticElements = (
  node: ts.Node,
  ref: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const elements = ts.isClassLike(node)
    ? node.members.filter(
        (member): member is ts.ClassStaticBlockDeclaration | ts.PropertyDeclaration =>
          ts.isClassStaticBlockDeclaration(member) ||
          (ts.isPropertyDeclaration(member) && isStatic(member)),
      )
    : [];
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
              inlining: frame.inlining,
            },
          ),
        );
      }
      return allocate(element.initializer, before, context, (allocated) => {
        const value = context.names.getFresh("value");
        const heap = getHeap(allocated.scope, element, context);
        const withHeap = (changed: Expression) => ({
          ...allocated,
          scope: {
            ...allocated.scope,
            bindings: new Map([...allocated.scope.bindings, [heapSymbol, changed]]),
          },
        });
        const change = context.names.getFresh("change");
        const defined = ts.isPrivateIdentifier(element.name)
          ? bindOnce(
              allocated,
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
              allocated,
              change,
              useJavaScript(
                "DefineField",
                [
                  heap,
                  ref,
                  translateMemberKey(element.name, allocated.scope, context),
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
        return bindOnce(
          allocated,
          value,
          element.initializer === undefined
            ? getUndefined(context)
            : translateExpression(element.initializer, { ...allocated.scope, receiver }, context),
          defined,
        );
      });
    },
    continueWith,
  )(path);
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
  // A call's value runs though the statement drops it, so that a getter it reads, which tla-ts
  // can't call, stops the check: TLC would read only a value that something uses.
  if (ts.isCallExpression(expression)) {
    return translateCallStatement(expression, path, context, frame, (after, value) =>
      value === undefined || context.heap === undefined
        ? continueWith(after)
        : ifThenElse(apply("=", [value, value]), continueWith(after), leaf(boolean(false))),
    );
  }
  const constructor = getConstructorRun(expression, context);
  if (constructor !== undefined && ts.isNewExpression(expression)) {
    return translateConstruction(expression, constructor, path, context, frame, continueWith);
  }
  if (ts.isYieldExpression(expression)) {
    const yielded = expression.expression;
    if (
      frame.yieldTo === undefined ||
      expression.asteriskToken !== undefined ||
      (yielded !== undefined && hasCall(yielded, context))
    ) {
      throw new TlaTypeScriptError("Unsupported yield", expression);
    }
    const yieldTo = frame.yieldTo;
    return allocate(yielded, path, context, (inner) =>
      yieldTo(
        inner,
        yielded === undefined ? undefined : translateExpression(yielded, inner.scope, context),
        continueWith,
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
    return ifThenElse(
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
        path,
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
      (after, values) => continueWith(assignPattern(left, undefined, values, after, context)),
    );
    if (taken !== undefined) return taken;
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
  if (write === undefined) return continueWith(assigned);
  const translateWrite = (next: (path: Path) => Formula) =>
    ifThenElse(
      useJavaScript("CanPut", [write.heap, write.ref, write.key], context),
      shareHeap(assigned, context, next),
      throwTypeError(path, expression, context, frame),
    );
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
    setters.reduceRight(
      (rest, setter) =>
        ifThenElse(
          apply("=", [
            useJavaScript("SetterOf", [write.heap, write.ref, write.key], context),
            translateFunctionValue(setter, context),
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
        ),
      translateWrite(next),
    ),
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

// A call whose value only statements can compute, which an assignment or a declaration takes.
const isStatementResult = (node: ts.CallExpression, path: Path, context: Context) =>
  (isObjectChange(node) &&
    node.expression.name.text !== "construct" &&
    isHeapType(context.checker.getTypeAtLocation(node), node, context)) ||
  isGeneratorStep(node, context) ||
  getCreatedGenerator(node, path, context) !== undefined ||
  isHeapCall(node, path, context) ||
  getLoopCall(node, path, context) !== undefined ||
  isStateCall(node, path, context);

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
    isStatementResult(node, path, context) ||
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
const throwError = (
  name: "TypeError" | "RangeError",
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

const throwTypeError = (path: Path, node: ts.Node, context: Context, frame: Frame) =>
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
  if (
    initializer !== undefined &&
    ts.isClassExpression(initializer) &&
    isHeapClass(initializer, context)
  ) {
    return allocate(initializer, path, context, (allocated) => {
      const ref = allocated.scope.allocated.get(initializer);
      if (ref === undefined) throw new TlaTypeScriptError("Unsupported class", initializer);
      return translateStaticElements(initializer, ref, allocated, context, frame, (after) =>
        bindDeclaration(declarations, ref, after, context, frame, continueWith),
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
    // An array-like call reads the object's elements, which may run a getter that tla-ts can't
    // call, and new Array(length) may make holes that a sequence can't hold, so the declaration
    // evaluates them where it runs.
    const mayStop = (node: ts.Node): boolean =>
      !ts.isFunctionLike(node) &&
      ((ts.isCallExpression(node) && getArrayLikeCall(node, context) !== undefined) ||
        (ts.isNewExpression(node) &&
          node.expression.getText() === "Array" &&
          node.arguments?.length === 1) ||
        (ts.forEachChild(node, mayStop) ?? false));
    if (initializer !== undefined && mayStop(initializer)) {
      const name = context.names.getFresh("value");
      return bindOnce(
        allocated,
        name,
        value,
        bindDeclaration(declarations, identifier(name), allocated, context, frame, continueWith),
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
      getArgumentsOwner(node, context.checker) !== undefined ||
      (ts.isBindingElement(node) && context.heapArrays.has(node)) ||
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
    const setters =
      written !== undefined &&
      (ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written))
        ? [getAssignedSetter(node, context) ?? [], getSetters(node, context)].flat()
        : [];
    setters.forEach((setter) => {
      if (visited.has(setter)) return;
      visited.add(setter);
      visit(setter);
    });
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
      exit.path.generators === path.generators &&
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
  const runLoop = (inner: Path) => translateIterations(loop, inner, context, frame, continueWith);
  // A for-of or a for-in evaluates what it iterates once, before its first iteration.
  if (ts.isForOfStatement(loop) || ts.isForInStatement(loop)) {
    return allocate(loop.expression, path, context, runLoop);
  }
  const initializer = ts.isForStatement(loop) ? loop.initializer : undefined;
  if (initializer === undefined) return runLoop(path);
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
    // A generator from before the loop resumes only outside it, as each iteration's path ends.
    generators: new Map(),
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
    ],
    // The loop runs even when nothing reads what it changes, as it may throw.
    bindOnce(
      path,
      result,
      call(name, [...(iterated === undefined ? [] : [number(1)]), ...getValues(path)]),
      continueWith({
        ...after,
        isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
      }),
    ),
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

// A callee like f or assert.sameValue, whose evaluation reads no getter.
const isPlainCallee = (node: ts.Expression, context: Context): boolean =>
  ts.isIdentifier(node) ||
  (ts.isPropertyAccessExpression(node) &&
    !ts.isPrivateIdentifier(node.name) &&
    getObjectGetter(node, context) === undefined &&
    !(getSymbol(node.name, context.checker)?.declarations ?? []).some(
      ts.isGetAccessorDeclaration,
    ) &&
    isPlainCallee(node.expression, context));

// The assignment that a statement evaluates first, inside an expression, which can run as a
// statement before it, since nothing the statement evaluates before it sees the change.
const getLeadingAssignment = (
  node: ts.Expression,
  results: ReadonlyMap<ts.Expression, Expression>,
  context: Context,
): ts.BinaryExpression | undefined => {
  if (results.has(node)) return undefined;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    return getLeadingAssignment(node.expression, results, context);
  }
  if (ts.isConditionalExpression(node))
    return getLeadingAssignment(node.condition, results, context);
  // A call evaluates its callee first, which reading a getter could make see the change.
  if (ts.isCallExpression(node)) {
    const first = node.arguments.at(0);
    return first !== undefined && isPlainCallee(node.expression, context)
      ? getLeadingAssignment(first, results, context)
      : undefined;
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  if (kind !== ts.SyntaxKind.EqualsToken) {
    const isAssignment =
      kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
    if (!isAssignment) return getLeadingAssignment(node.left, results, context);
    return ts.isIdentifier(node.left) ? node : undefined;
  }
  const isPattern =
    ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left);
  return ts.isIdentifier(node.left) || isPattern
    ? (getLeadingAssignment(node.right, results, context) ?? node)
    : undefined;
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
  const hoisted = getHoistedAssignment(statement, path, context);
  if (hoisted !== undefined) {
    const target = ts.isIdentifier(hoisted.left)
      ? getSymbol(hoisted.left, context.checker)
      : undefined;
    const value =
      target === undefined ? translateExpression(hoisted.right, path.scope, context) : undefined;
    return translateExpressionStatement(hoisted, path, context, frame, (after) => {
      const result = value ?? (target === undefined ? undefined : after.scope.bindings.get(target));
      if (result === undefined) throw new TlaTypeScriptError("Unsupported assignment", hoisted);
      return translateStatements(
        statements,
        {
          ...after,
          scope: { ...after.scope, results: new Map([...after.scope.results, [hoisted, result]]) },
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
      return translateStaticElements(
        statement,
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
      generators: new Map(),
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
