import ts from "@typescript/typescript6";
import type { ExceptPathStep, Expression, OperatorDefinition } from "../ast";
import { getUpdatedValue, MUTATING_METHODS, removeLast } from "./collections";
import {
  type Context,
  type FunctionNode,
  getCallee,
  getElement,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  isMethodCall,
  share,
  isInlined,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import {
  translateCondition,
  translateExpression,
  translateKey,
  translateToString,
} from "./expressions";
import { and, DISABLED, type Formula, ifThenElse, letIn, leaf, render } from "./formula";
import { translateThrown } from "./exceptions";
import { translateIf, translateSwitch, translateThrow } from "./functions";
import {
  bindPattern,
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
  identifier,
  ifExpression,
  index,
  number,
  prime,
  string,
  tuple,
  unchanged,
} from "./tla";
import { getField, getKind, getPathStep, isNumberLike } from "./types";

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
  // What a return statement does: end the action, or leave an inlined helper.
  exit: (path: Path) => Formula;
  breakTo: ((path: Path) => Formula) | undefined;
  continueTo: ((path: Path) => Formula) | undefined;
  throwTo: ((path: Path, thrown: Thrown) => Formula) | undefined;
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
  continueWith: (path: Path) => Formula,
): Formula => {
  const translateArguments = (argumentNodes: readonly ts.Expression[]) =>
    argumentNodes.map((argument) => translateExpression(argument, path.scope, context));
  if (isMethodCall(expression)) {
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
  const getCallback = (node: ts.Expression) => {
    const symbol = getSymbol(node, context.checker);
    return (symbol && path.scope.functions.get(symbol)) ?? getCallee(node, context);
  };
  const callee = getCallback(expression.expression);
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
  const body = ts.isBlock(callee.body)
    ? callee.body.statements
    : [ts.factory.createExpressionStatement(callee.body)];
  const afterCall = (inner: Path) =>
    continueWith({ ...inner, scope: { ...inner.scope, previous: path.scope.previous } });
  const scope = { ...bound.scope, functions: new Map([...bound.scope.functions, ...callbacks]) };
  return letIn(
    bound.definitions,
    translateStatements(body, { ...path, scope }, context, {
      next: afterCall,
      exit: afterCall,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: frame.throwTo,
      inlining: new Set([...frame.inlining, callee]),
    }),
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
  const assigned = getAssignedPath(expression, path, context);
  if (assigned === undefined) {
    throw new TlaTypeScriptError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  return continueWith(assigned);
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
const translateDeclarations = (
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  if (declarations.length === 0) return continueWith(path);
  const declaration = declarations[0];
  rejectCatchRedeclaration(declaration);
  const rest = declarations.slice(1);
  const initializer = declaration.initializer;
  if (isInlined(initializer)) {
    return translateDeclarations(
      rest,
      { ...path, scope: initialize(path.scope, declaration, context) },
      context,
      continueWith,
    );
  }
  const removed = initializer && getRemovedValue(initializer, path, context);
  const value =
    removed?.value ??
    (initializer === undefined
      ? getUndefined(context)
      : translateExpression(initializer, path.scope, context));
  const afterCall = removed?.path ?? path;
  const bound = bindPattern(declaration.name, value, afterCall.scope, context);
  const symbol = ts.isIdentifier(declaration.name)
    ? getSymbol(declaration.name, context.checker)
    : undefined;
  const isLet = (declaration.parent.flags & ts.NodeFlags.Const) === 0;
  const mutable = isLet && symbol !== undefined ? new Set([...path.mutable, symbol]) : path.mutable;
  return letIn(
    bound.definitions,
    translateDeclarations(
      rest,
      { ...afterCall, scope: initialize(bound.scope, declaration, context), mutable },
      context,
      continueWith,
    ),
  );
};

const getChanged = (loop: ts.Node, path: Path, context: Context) => {
  const changed = new Set<ts.Symbol>();
  const visited = new Set<ts.Node>();
  const getFunctionNode = (node: ts.Expression) => {
    const symbol = getSymbol(node, context.checker);
    return (symbol && path.scope.functions.get(symbol)) ?? getCallee(node, context);
  };
  const visit = (node: ts.Node) => {
    const written =
      ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer)
        ? node.initializer
        : getWritten(node);
    if (written !== undefined) {
      getWrittenSymbols(written, context).forEach((symbol) => changed.add(symbol));
    }
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
    ? translateDeclarations(initializer.declarations, path, context, runLoop)
    : translateExpressionStatement(initializer, path, context, frame, runLoop);
};

const translateIterations = (
  loop: ts.IterationStatement,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  if (ts.isForInStatement(loop)) throw new TlaTypeScriptError("for-in isn't supported", loop);
  const iterated = ts.isForOfStatement(loop) ? loop : undefined;
  if (iterated !== undefined && getKind(iterated.expression, context) !== "sequence") {
    throw new TlaTypeScriptError("Only arrays have an order to iterate in", iterated.expression);
  }
  const changed = getChanged(loop, path, context);
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
        : [define(sequence, [], translateExpression(iterated.expression, path.scope, context))]),
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

const hasCall = (node: ts.Node): boolean =>
  ts.isCallExpression(node) ||
  ts.isNewExpression(node) ||
  (ts.forEachChild(node, (child) => hasCall(child) || undefined) ?? false);

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
    exit: (inner) => leave(inner, frame.exit),
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
      continueWith,
    );
  }
  if (ts.isIfStatement(statement)) {
    return translateIf(
      statement,
      path.scope,
      context,
      (branch) => translateStatements([branch], path, context, { ...frame, next: continueWith }),
      () => continueWith(path),
    );
  }
  if (ts.isReturnStatement(statement)) {
    const returned = statement.expression;
    if (returned === undefined) return frame.exit(path);
    if (frame.inlining.size === 0) {
      throw new TlaTypeScriptError("Actions can't return a value", statement);
    }
    if (ts.isCallExpression(returned)) {
      return translateCallStatement(returned, path, context, frame, frame.exit);
    }
    if (hasCall(returned)) throw new TlaTypeScriptError("Unsupported return", statement);
    translateExpression(returned, path.scope, context);
    return frame.exit(path);
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
  if (ts.isTryStatement(statement))
    return translateTry(statement, path, context, frame, continueWith);
  if (ts.isSwitchStatement(statement)) {
    return translateSwitch(
      statement,
      path.scope,
      context,
      (clause) =>
        translateStatements(clause, path, context, {
          ...frame,
          next: continueWith,
          breakTo: continueWith,
        }),
      () => continueWith(path),
    );
  }
  if (ts.isExpressionStatement(statement)) {
    return translateExpressionStatement(statement.expression, path, context, frame, continueWith);
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
  return translateStatements(
    statements,
    {
      scope: { ...createStateScope(context), uninitialized: new Set(declared) },
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
