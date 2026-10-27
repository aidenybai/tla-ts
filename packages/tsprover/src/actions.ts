import ts from "typescript";
import { getUpdatedValue, MUTATING_METHODS } from "./collections";
import {
  type Context,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  isMethodCall,
} from "./context";
import { TsproverError } from "./errors";
import { translateExpression, translateKey } from "./expressions";
import { and, DISABLED, type Formula, letIn, text, wrap, wrapEquated } from "./formula";
import { translateIf, translateSwitch, translateThrow } from "./functions";
import { bindPattern, bindValues, type Scope } from "./scope";
import { getKind } from "./types";

interface Path {
  scope: Scope;
  // State variables and mutable locals, which assignments may change.
  mutable: Set<ts.Symbol>;
  isAssigned: boolean;
}

interface Target {
  symbol: ts.Symbol;
  current: string;
  // The path to the changed part, as an EXCEPT selector such as .field[2].
  selector: string;
}

interface Removed {
  value: string;
  path: Path;
}

interface Frame {
  // What follows the statements once they complete.
  next: (path: Path) => Formula;
  // What a return statement does: end the action, or leave an inlined helper.
  exit: (path: Path) => Formula;
  breakTo: ((path: Path) => Formula) | undefined;
  // Helpers being inlined, to reject recursion.
  inlining: Set<ts.Declaration>;
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

// The current value of an assignment target, and how to replace it.
const getTarget = (node: ts.Expression, path: Path, context: Context): Target => {
  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return getTarget(node.expression, path, context);
  }
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    const current = symbol === undefined ? undefined : path.scope.bindings.get(symbol);
    if (symbol === undefined || current === undefined || !path.mutable.has(symbol)) {
      throw new TsproverError(`Only state variables and local lets can change: ${node.text}`, node);
    }
    return { symbol, current, selector: "" };
  }
  if (ts.isPropertyAccessExpression(node)) {
    if (getKind(node.expression, context) !== "other") {
      throw new TsproverError(`Can't assign to ${node.getText()}`, node);
    }
    const target = getTarget(node.expression, path, context);
    return { ...target, selector: `${target.selector}.${node.name.text}` };
  }
  if (ts.isElementAccessExpression(node)) {
    const target = getTarget(node.expression, path, context);
    const key = translateKey(node, path.scope, context);
    return { ...target, selector: `${target.selector}[${key}]` };
  }
  if (
    isMethodCall(node) &&
    node.expression.name.text === "get" &&
    node.arguments.length === 1 &&
    getKind(node.expression.expression, context) === "map"
  ) {
    const target = getTarget(node.expression.expression, path, context);
    const key = translateExpression(node.arguments[0], path.scope, context);
    return { ...target, selector: `${target.selector}[${key}]` };
  }
  throw new TsproverError(`Can't assign to ${node.getText()}`, node);
};

const assign = (
  node: ts.Expression,
  path: Path,
  context: Context,
  getValue: (current: string) => string,
): Path => {
  const target = getTarget(node, path, context);
  const value =
    target.selector === ""
      ? getValue(target.current)
      : `[${wrap(target.current)} EXCEPT !${target.selector} = ${wrapEquated(getValue("@"))}]`;
  return {
    scope: { ...path.scope, bindings: new Map([...path.scope.bindings, [target.symbol, value]]) },
    mutable: path.mutable,
    isAssigned: path.isAssigned || context.variables.has(target.symbol),
  };
};

// Assigns a value to a target, or to each target in a destructuring pattern. Every value is read
// before any target changes, so [a, b] = [b, a] swaps.
const assignPattern = (
  target: ts.Expression,
  source: ts.Expression | undefined,
  value: string,
  path: Path,
  context: Context,
): Path => {
  if (ts.isArrayLiteralExpression(target)) {
    return target.elements.reduce((current, element, index) => {
      if (ts.isOmittedExpression(element)) return current;
      if (ts.isSpreadElement(element)) {
        throw new TsproverError("Rest elements can't be assigned", element);
      }
      const sourceElement =
        source !== undefined && ts.isArrayLiteralExpression(source)
          ? source.elements[index]
          : undefined;
      return sourceElement !== undefined && !ts.isSpreadElement(sourceElement)
        ? assignPattern(
            element,
            sourceElement,
            translateExpression(sourceElement, path.scope, context),
            current,
            context,
          )
        : assignPattern(element, undefined, `${wrap(value)}[${index + 1}]`, current, context);
    }, path);
  }
  if (ts.isObjectLiteralExpression(target)) {
    return target.properties.reduce((current, property) => {
      if (ts.isShorthandPropertyAssignment(property)) {
        return assignPattern(
          property.name,
          undefined,
          `${wrap(value)}.${property.name.text}`,
          current,
          context,
        );
      }
      if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        return assignPattern(
          property.initializer,
          undefined,
          `${wrap(value)}.${property.name.text}`,
          current,
          context,
        );
      }
      throw new TsproverError(`Can't assign to ${property.getText()}`, property);
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
    value: method === "shift" ? `Head(${sequence})` : `${wrap(sequence)}[Len(${sequence})]`,
    path: assign(receiver, path, context, (current) =>
      method === "shift" ? `Tail(${current})` : `SubSeq(${current}, 1, Len(${current}) - 1)`,
    ),
  };
};

// The path after an assignment, such as x = 1, x += 1, or x++.
const getAssignedPath = (expression: ts.Expression, path: Path, context: Context) => {
  if (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression)) {
    const operator = INCREMENT_OPERATORS.get(expression.operator);
    return operator === undefined
      ? undefined
      : assign(expression.operand, path, context, (current) => `${wrap(current)} ${operator} 1`);
  }
  if (!ts.isBinaryExpression(expression)) return undefined;
  const kind = expression.operatorToken.kind;
  if (kind === ts.SyntaxKind.EqualsToken) {
    const value = translateExpression(expression.right, path.scope, context);
    return assignPattern(expression.left, expression.right, value, path, context);
  }
  const operator =
    kind === ts.SyntaxKind.PlusEqualsToken && getKind(expression.left, context) === "string"
      ? "\\o"
      : COMPOUND_OPERATORS.get(kind);
  if (operator === undefined) return undefined;
  const value = wrap(translateExpression(expression.right, path.scope, context));
  return assign(
    expression.left,
    path,
    context,
    (current) => `${wrap(current)} ${operator} ${value}`,
  );
};

const translateCallStatement = (
  expression: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const values = expression.arguments.map((argument) =>
    translateExpression(argument, path.scope, context),
  );
  if (isMethodCall(expression)) {
    const receiver = expression.expression.expression;
    const method = expression.expression.name.text;
    const isConsole = receiver.getText() === "console";
    if (isConsole && method === "log") {
      const value = values.length === 1 ? values[0] : `<<${values.join(", ")}>>`;
      return and([text(`PrintT(${value})`), continueWith(path)]);
    }
    if (isConsole && method === "assert") {
      const message = values[1] ?? JSON.stringify("Assertion failed");
      return and([text(`Assert(${values[0]}, ${message})`), continueWith(path)]);
    }
    if (MUTATING_METHODS.has(method)) {
      const kind = getKind(receiver, context);
      return continueWith(
        assign(receiver, path, context, (current) => {
          const value = getUpdatedValue(current, kind, expression, path.scope, context);
          if (value === undefined) {
            throw new TsproverError(`Unsupported method: ${method}`, expression);
          }
          return value;
        }),
      );
    }
  }
  // A helper that changes state runs inline, as part of the action.
  const helper = getTopLevelDeclaration(getSymbol(expression.expression, context.checker));
  const helperFunction = getFunction(helper);
  if (helper === undefined || helperFunction?.body === undefined) {
    throw new TsproverError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  if (frame.inlining.has(helper)) {
    throw new TsproverError("Helpers that change state can't call themselves", expression);
  }
  const bound = bindValues(
    helperFunction.parameters.map((parameter) => parameter.name),
    values,
    path.scope,
    context,
  );
  const body = ts.isBlock(helperFunction.body)
    ? helperFunction.body.statements
    : [ts.factory.createExpressionStatement(helperFunction.body)];
  const afterCall = (inner: Path) =>
    continueWith({ ...inner, scope: { ...inner.scope, previous: path.scope.previous } });
  return letIn(
    bound.definitions,
    translateStatements(body, { ...path, scope: bound.scope }, context, {
      next: afterCall,
      exit: afterCall,
      breakTo: undefined,
      inlining: new Set([...frame.inlining, helper]),
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
    throw new TsproverError(`Unsupported statement: ${expression.getText()}`, expression);
  }
  return continueWith(assigned);
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
  const rest = declarations.slice(1);
  if (declaration.initializer === undefined) {
    throw new TsproverError("Declare locals with a value", declaration);
  }
  if (getFunction(declaration.initializer) !== undefined) {
    return translateDeclarations(rest, path, context, continueWith);
  }
  const removed = getRemovedValue(declaration.initializer, path, context);
  const value = removed?.value ?? translateExpression(declaration.initializer, path.scope, context);
  const afterCall = removed?.path ?? path;
  const bound = bindPattern(declaration.name, value, afterCall.scope, context);
  const symbol = ts.isIdentifier(declaration.name)
    ? getSymbol(declaration.name, context.checker)
    : undefined;
  const isLet = (declaration.parent.flags & ts.NodeFlags.Let) !== 0;
  const mutable = isLet && symbol !== undefined ? new Set([...path.mutable, symbol]) : path.mutable;
  return letIn(
    bound.definitions,
    translateDeclarations(
      rest,
      { ...afterCall, scope: bound.scope, mutable },
      context,
      continueWith,
    ),
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
    if (statement.expression !== undefined) {
      throw new TsproverError("Actions can't return a value", statement);
    }
    return frame.exit(path);
  }
  if (ts.isBreakStatement(statement)) {
    if (frame.breakTo === undefined) throw new TsproverError("Unsupported break", statement);
    return frame.breakTo(path);
  }
  if (ts.isThrowStatement(statement)) return text(translateThrow(statement, path.scope, context));
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
    throw new TsproverError(
      "Loops aren't supported. Use map(), filter(), every(), some(), or a parameter",
      statement,
    );
  }
  throw new TsproverError(`Unsupported statement: ${statement.getText()}`, statement);
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
    const unchanged = assignments.filter((assignment) => assignment.value === assignment.name);
    return and([
      ...assignments
        .filter((assignment) => assignment.value !== assignment.name)
        .map((assignment) => text(`${assignment.name}' = ${wrapEquated(assignment.value)}`)),
      ...(unchanged.length > 0
        ? [text(`UNCHANGED <<${unchanged.map((assignment) => assignment.name).join(", ")}>>`)]
        : []),
    ]);
  };
  return translateStatements(
    statements,
    { scope, mutable: new Set(context.variables.keys()), isAssigned: false },
    context,
    { next: finish, exit: finish, breakTo: undefined, inlining: new Set() },
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

// Whether a function assigns a state variable, directly or through a helper it calls.
export const writesState = (
  node: ts.Node,
  context: Context,
  visited = new Set<ts.Node>(),
): boolean => {
  const isStateRoot = (target: ts.Expression) => {
    const root = getRoot(target);
    const symbol = ts.isIdentifier(root) ? getSymbol(root, context.checker) : undefined;
    return symbol !== undefined && context.variables.has(symbol);
  };
  const isAssignment =
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
    isStateRoot(node.left);
  const isUpdate =
    (ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) &&
    INCREMENT_OPERATORS.has(node.operator) &&
    isStateRoot(node.operand);
  const isMutation =
    isMethodCall(node) &&
    MUTATING_METHODS.has(node.expression.name.text) &&
    isStateRoot(node.expression.expression);
  if (isAssignment || isUpdate || isMutation) return true;
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
