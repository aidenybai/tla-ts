import ts from "typescript";
import { type Context, getSymbol, getTopLevelDeclaration } from "./context";
import { TsproverError } from "./errors";
import {
  bindPattern,
  bindValues,
  getKind,
  getUpdatedValue,
  isFunctionValue,
  type Scope,
  translateCondition,
  translateNegatedCondition,
  translateExpression,
  translateSwitch,
  translateThrow,
} from "./expressions";
import { and, DISABLED, type Formula, ifThenElse, letIn, text, wrap, wrapEquated } from "./formula";

interface Path {
  scope: Scope;
  // State variables and mutable locals, which assignments may change.
  mutable: Set<ts.Symbol>;
  isAssigned: boolean;
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

const MUTATING_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "add",
  "delete",
  "clear",
  "set",
]);

// The current value of an assignment target, and how to replace it.
const getTarget = (
  node: ts.Expression,
  path: Path,
  context: Context,
): { symbol: ts.Symbol; current: string; selector: string } => {
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
    const index = translateExpression(node.argumentExpression, path.scope, context);
    const key =
      getKind(node.expression, context) === "sequence"
        ? ts.isNumericLiteral(node.argumentExpression)
          ? String(Number(node.argumentExpression.text) + 1)
          : `${wrap(index)} + 1`
        : index;
    return { ...target, selector: `${target.selector}[${key}]` };
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
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
const getRemovedValue = (node: ts.Expression, path: Path, context: Context) => {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression))
    return undefined;
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

const unwrapInitializer = (node: ts.Expression): ts.Expression =>
  ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)
    ? unwrapInitializer(node.expression)
    : node;

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
  const translate = (inner: ts.Expression) => translateExpression(inner, path.scope, context);
  if (ts.isBinaryExpression(expression)) {
    const kind = expression.operatorToken.kind;
    if (kind === ts.SyntaxKind.EqualsToken) {
      return continueWith(
        assignPattern(
          expression.left,
          expression.right,
          translate(expression.right),
          path,
          context,
        ),
      );
    }
    const operators = new Map([
      [ts.SyntaxKind.PlusEqualsToken, getKind(expression.left, context) === "string" ? "\\o" : "+"],
      [ts.SyntaxKind.MinusEqualsToken, "-"],
      [ts.SyntaxKind.AsteriskEqualsToken, "*"],
    ]);
    const operator = operators.get(kind);
    if (operator !== undefined) {
      const value = wrap(translate(expression.right));
      return continueWith(
        assign(
          expression.left,
          path,
          context,
          (current) => `${wrap(current)} ${operator} ${value}`,
        ),
      );
    }
  }
  if (
    (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression)) &&
    (expression.operator === ts.SyntaxKind.PlusPlusToken ||
      expression.operator === ts.SyntaxKind.MinusMinusToken)
  ) {
    const operator = expression.operator === ts.SyntaxKind.PlusPlusToken ? "+" : "-";
    return continueWith(
      assign(expression.operand, path, context, (current) => `${wrap(current)} ${operator} 1`),
    );
  }
  if (ts.isCallExpression(expression)) {
    const callee = expression.expression;
    const arguments_ = expression.arguments.map(translate);
    if (ts.isPropertyAccessExpression(callee) && callee.expression.getText() === "console") {
      if (callee.name.text === "log") {
        const value = arguments_.length === 1 ? arguments_[0] : `<<${arguments_.join(", ")}>>`;
        return and([text(`PrintT(${value})`), continueWith(path)]);
      }
      if (callee.name.text === "assert") {
        const message = arguments_[1] ?? JSON.stringify("Assertion failed");
        return and([text(`Assert(${arguments_[0]}, ${message})`), continueWith(path)]);
      }
    }
    if (ts.isPropertyAccessExpression(callee) && MUTATING_METHODS.has(callee.name.text)) {
      const kind = getKind(callee.expression, context);
      return continueWith(
        assign(callee.expression, path, context, (current) => {
          const value = getUpdatedValue(
            current,
            kind,
            callee.name.text,
            expression,
            path.scope,
            context,
          );
          if (value === undefined) {
            throw new TsproverError(`Unsupported method: ${callee.name.text}`, expression);
          }
          return value;
        }),
      );
    }
    const helper = getTopLevelDeclaration(getSymbol(callee, context.checker));
    const fn =
      helper === undefined
        ? undefined
        : ts.isFunctionDeclaration(helper)
          ? helper
          : helper.initializer !== undefined &&
              (ts.isArrowFunction(helper.initializer) ||
                ts.isFunctionExpression(helper.initializer))
            ? helper.initializer
            : undefined;
    if (helper !== undefined && fn?.body !== undefined) {
      if (frame.inlining.has(helper)) {
        throw new TsproverError("Helpers that change state can't call themselves", expression);
      }
      const bound = bindValues(
        fn.parameters.map((parameter) => parameter.name),
        arguments_,
        path.scope,
        context,
      );
      const body = ts.isBlock(fn.body)
        ? fn.body.statements
        : [ts.factory.createExpressionStatement(fn.body)];
      const inlining = new Set([...frame.inlining, helper]);
      const afterCall = (inner: Path) =>
        continueWith({ ...inner, scope: { ...inner.scope, previous: path.scope.previous } });
      return letIn(
        bound.definitions,
        translateStatements(body, 0, { ...path, scope: bound.scope }, context, {
          next: afterCall,
          exit: afterCall,
          breakTo: undefined,
          inlining,
        }),
      );
    }
  }
  throw new TsproverError(`Unsupported statement: ${expression.getText()}`, expression);
};

export const translateStatements = (
  statements: readonly ts.Statement[],
  index: number,
  path: Path,
  context: Context,
  frame: Frame,
): Formula => {
  if (index === statements.length) return frame.next(path);
  const statement = statements[index];
  const continueWith = (inner: Path) =>
    translateStatements(statements, index + 1, inner, context, frame);
  if (ts.isBlock(statement)) {
    return translateStatements(statement.statements, 0, path, context, {
      ...frame,
      next: continueWith,
    });
  }
  if (ts.isEmptyStatement(statement)) return continueWith(path);
  if (ts.isVariableStatement(statement)) {
    const isLet = (statement.declarationList.flags & ts.NodeFlags.Let) !== 0;
    const translateDeclarations = (
      declarations: readonly ts.VariableDeclaration[],
      current: Path,
    ): Formula => {
      if (declarations.length === 0) return continueWith(current);
      const declaration = declarations[0];
      if (declaration.initializer === undefined) {
        throw new TsproverError("Declare locals with a value", declaration);
      }
      if (isFunctionValue(declaration.initializer)) {
        return translateDeclarations(declarations.slice(1), current);
      }
      const removed = getRemovedValue(unwrapInitializer(declaration.initializer), current, context);
      const value =
        removed?.value ?? translateExpression(declaration.initializer, current.scope, context);
      const afterCall = removed?.path ?? current;
      const bound = bindPattern(declaration.name, value, afterCall.scope, context);
      const symbol = ts.isIdentifier(declaration.name)
        ? getSymbol(declaration.name, context.checker)
        : undefined;
      const mutable =
        isLet && symbol !== undefined ? new Set([...current.mutable, symbol]) : current.mutable;
      return letIn(
        bound.definitions,
        translateDeclarations(declarations.slice(1), { ...afterCall, scope: bound.scope, mutable }),
      );
    };
    return translateDeclarations(statement.declarationList.declarations, path);
  }
  if (ts.isIfStatement(statement)) {
    const condition = translateCondition(statement.expression, path.scope, context);
    const branchFrame = { ...frame, next: continueWith };
    const whenTrue = translateStatements([statement.thenStatement], 0, path, context, branchFrame);
    const whenFalse =
      statement.elseStatement === undefined
        ? continueWith(path)
        : translateStatements([statement.elseStatement], 0, path, context, branchFrame);
    return ifThenElse(
      condition,
      whenTrue,
      whenFalse,
      translateNegatedCondition(statement.expression, path.scope, context),
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
      path,
      path.scope,
      context,
      (clauseStatements, inner, after) =>
        translateStatements(clauseStatements, 0, inner, context, {
          ...frame,
          next: after,
          breakTo: after,
        }),
      continueWith,
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
    const assignments = [...context.variables].map(([symbol, name]) => ({
      name,
      value: path.scope.bindings.get(symbol) ?? name,
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
    0,
    { scope, mutable: new Set(context.variables.keys()), isAssigned: false },
    context,
    { next: finish, exit: finish, breakTo: undefined, inlining: new Set() },
  );
};

const getRoot = (node: ts.Expression): ts.Expression => {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "get"
  ) {
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
export const writesState = (node: ts.Node, context: Context, visited: Set<ts.Node>): boolean => {
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
    (node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken) &&
    isStateRoot(node.operand);
  const isMutation =
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
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
