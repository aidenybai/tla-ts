import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type CalledMethod,
  type Context,
  type Definition,
  type FunctionNode,
  getCallee,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  type HelperDeclaration,
  isInlined,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateCondition, translateExpression, translateNegatedCondition } from "./expressions";
import { type Formula, ifThenElse, letIn, render, leaf } from "./formula";
import { translateObjectValue } from "./heap";
import {
  type Bound,
  bindNames,
  bindPattern,
  bindValues,
  createStateScope,
  declareParameters,
  type Scope,
} from "./scope";
import {
  apply,
  boolean,
  call,
  defineAt,
  getLocation,
  identifier,
  junction,
  lambda,
  locate,
  string,
} from "./tla";
import { isBuiltInObject } from "./intrinsics";
import { hasHeapType, translateUnknown } from "./types";

// Whether a step has changed a state variable, so that helpers reading state must see the change.
const isStateModified = (scope: Scope, context: Context) =>
  [...context.variables].some((entry) => scope.bindings.get(entry[0]) !== entry[1]);

export const readsState = (
  node: ts.Node,
  context: Context,
  visited: Set<ts.Declaration>,
): boolean => {
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    if (symbol !== undefined && context.variables.has(symbol)) return true;
    // A value that may be an object, or a built-in object, reads the heap.
    if (
      hasHeapType(context.checker.getTypeAtLocation(node), context) ||
      (context.heap !== undefined && isBuiltInObject(node, context))
    ) {
      return true;
    }
    const declaration = getTopLevelDeclaration(symbol);
    if (declaration !== undefined && !visited.has(declaration)) {
      visited.add(declaration);
      return readsState(declaration, context, visited);
    }
  }
  return (
    ts.forEachChild(node, (child) => readsState(child, context, visited) || undefined) ?? false
  );
};

const mayThrow = (node: ts.Node, context: Context, visited = new Set<ts.Node>()): boolean => {
  if (ts.isThrowStatement(node)) return true;
  if (ts.isCallExpression(node)) {
    const callee = getCallee(node.expression, context);
    if (callee !== undefined && !visited.has(callee)) {
      visited.add(callee);
      if (mayThrow(callee, context, visited)) return true;
    }
  }
  return ts.forEachChild(node, (child) => mayThrow(child, context, visited) || undefined) ?? false;
};

const rejectCaught = (node: ts.Node, callee: ts.Node, scope: Scope, context: Context) => {
  if (scope.isCatching && mayThrow(callee, context)) {
    throw new TlaTypeScriptError(
      "Inside try, call a function that throws as its own statement",
      node,
    );
  }
};

const getInitializer = (declaration: HelperDeclaration) =>
  ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;

// Compiles a top-level helper function or constant into a TLA+ definition, after the definitions
// it uses.
export const getDefinition = (declaration: HelperDeclaration, context: Context): Definition => {
  const existing = context.definitions.get(declaration);
  if (existing !== undefined) {
    if (context.inProgress.has(declaration)) context.recursive.add(declaration);
    return existing;
  }
  if (declaration.name === undefined)
    throw new TlaTypeScriptError("Name this function", declaration);
  const callee = getFunction(declaration);
  const parameters = declareParameters(callee?.parameters ?? [], context);
  // An operator parameter declares how many arguments it takes, as in F(_, _).
  const declared = parameters.map((parameter) => {
    const signatures = context.checker.getTypeAtLocation(parameter.node.name).getCallSignatures();
    return {
      name: parameter.name,
      arity: signatures.length === 0 ? 0 : signatures[0].parameters.length,
    };
  });
  const definition: Definition = {
    name: context.names.getFresh(declaration.name.getText()),
    parameters: declared,
    readsState: readsState(declaration, context, new Set([declaration])),
  };
  context.definitions.set(declaration, definition);
  context.inProgress.add(declaration);
  const body = callee === undefined ? getInitializer(declaration) : callee.body;
  if (body === undefined) throw new TlaTypeScriptError("Give this a value", declaration);
  const value = translateBody(body, bindNames(createStateScope(context), parameters), context);
  context.inProgress.delete(declaration);
  context.output.push(defineAt(declaration, definition.name, declared, value));
  return definition;
};

// Substitutes the arguments into a function's body, which then reads the state as it is now.
// The object that this names in the method a call inlines, which is the one the call reads the
// method from. Other calls keep the caller's, which this reads only in that method.
export const getReceiver = (scope: Scope, context: Context, called?: CalledMethod) =>
  called === undefined
    ? scope.receiver
    : { value: translateObjectValue(called.receiver, scope, context), method: called.method };

const inlineCall = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
  called?: CalledMethod,
) => {
  if (callee.body === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const bound = bindValues(
    callee.parameters,
    argumentNodes.map((argument) => translateExpression(argument, scope, context)),
    scope,
    context,
  );
  const value = translateBody(
    callee.body,
    { ...bound.scope, receiver: getReceiver(scope, context, called) },
    context,
  );
  return render(letIn(bound.definitions, leaf(value)));
};

// A function argument to an operator parameter, as a LAMBDA or an operator's name.
const translateOperatorArgument = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parameters = declareParameters(node.parameters, context);
    const body = translateBody(node.body, bindNames(scope, parameters), context);
    return lambda(
      parameters.map((parameter) => parameter.name),
      body,
    );
  }
  const symbol = getSymbol(node, context.checker);
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration !== undefined) return identifier(getDefinition(declaration, context).name);
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding === undefined) throw new TlaTypeScriptError("Pass a function here", node);
  return binding;
};

// A call to a top-level helper, or a reference to a top-level constant when node is undefined.
// A helper that reads state after the step has changed it is inlined, so it reads the new values.
export const translateHelperCall = (
  declaration: HelperDeclaration,
  node: ts.CallExpression | undefined,
  scope: Scope,
  context: Context,
) => {
  rejectCaught(node ?? declaration, declaration, scope, context);
  const definition = getDefinition(declaration, context);
  const argumentNodes = node?.arguments ?? [];
  if (definition.readsState && isStateModified(scope, context)) {
    const callee = getFunction(declaration);
    if (callee !== undefined) return inlineCall(callee, argumentNodes, scope, context);
    const initializer = getInitializer(declaration);
    if (initializer === undefined) throw new TlaTypeScriptError("Give this a body", declaration);
    return translateExpression(initializer, scope, context);
  }
  const values = definition.parameters.map((parameter, index) => {
    const argument = argumentNodes.at(index);
    if (argument === undefined) return getUndefined(context);
    return parameter.arity > 0
      ? translateOperatorArgument(argument, scope, context)
      : translateExpression(argument, scope, context);
  });
  return call(definition.name, values);
};

// A call to a function declared inside another, or to a method a caller resolves, which is
// inlined.
export const translateLocalCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  called?: CalledMethod,
) => {
  const symbol = getSymbol(node.expression, context.checker);
  const callee =
    called?.method ??
    (symbol && scope.functions.get(symbol)) ??
    getCallee(node.expression, context);
  if (callee === undefined) {
    return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
  }
  if (context.inProgress.has(callee)) {
    throw new TlaTypeScriptError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  rejectCaught(node, callee, scope, context);
  context.inProgress.add(callee);
  const value = inlineCall(callee, node.arguments, scope, context, called);
  context.inProgress.delete(callee);
  return value;
};

// A read of a property that a heap class's getter computes.
export const translateGetterCall = (
  node: ts.Node,
  called: CalledMethod,
  scope: Scope,
  context: Context,
) => {
  if (context.inProgress.has(called.method)) {
    throw new TlaTypeScriptError("A getter can't read its own property", node);
  }
  rejectCaught(node, called.method, scope, context);
  context.inProgress.add(called.method);
  const value = inlineCall(called.method, [], scope, context, called);
  context.inProgress.delete(called.method);
  return value;
};

// A function body that computes a value, as a TLA+ expression.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): Expression => {
  if (!ts.isBlock(body)) return translateExpression(body, scope, context);
  return render(translatePure(body.statements, scope, context, () => leaf(getUndefined(context))));
};

const translatePure = (
  statements: readonly ts.Statement[],
  scope: Scope,
  context: Context,
  next: (scope: Scope) => Formula,
): Formula => {
  if (statements.length === 0) return next(scope);
  const statement = statements[0];
  const continueWith = (inner: Scope) => translatePure(statements.slice(1), inner, context, next);
  if (ts.isBlock(statement)) {
    return translatePure(statement.statements, scope, context, continueWith);
  }
  if (ts.isVariableStatement(statement)) {
    const bound = statement.declarationList.declarations.reduce<Bound>(
      (current, declaration) => {
        const initializer = declaration.initializer;
        if (isInlined(initializer, context)) return current;
        const value =
          initializer === undefined
            ? getUndefined(context)
            : translateExpression(initializer, current.scope, context);
        const added = bindPattern(declaration.name, value, current.scope, context);
        return { definitions: [...current.definitions, ...added.definitions], scope: added.scope };
      },
      { definitions: [], scope },
    );
    return letIn(bound.definitions, continueWith(bound.scope));
  }
  if (ts.isIfStatement(statement)) {
    return translateIf(
      statement,
      scope,
      context,
      (branch) => translatePure([branch], scope, context, continueWith),
      () => continueWith(scope),
    );
  }
  if (ts.isReturnStatement(statement)) {
    return statement.expression === undefined
      ? leaf(getUndefined(context))
      : leaf(translateExpression(statement.expression, scope, context));
  }
  if (ts.isThrowStatement(statement)) return leaf(translateThrow(statement, scope, context));
  if (ts.isSwitchStatement(statement)) {
    return translateSwitch(
      statement,
      scope,
      context,
      (clause) => translatePure(clause, scope, context, continueWith),
      () => continueWith(scope),
    );
  }
  throw new TlaTypeScriptError(`Unsupported statement: ${statement.getText()}`, statement);
};

export const translateThrow = (statement: ts.ThrowStatement, scope: Scope, context: Context) => {
  const thrown = statement.expression;
  const message =
    ts.isNewExpression(thrown) && thrown.arguments?.[0] !== undefined
      ? translateExpression(thrown.arguments[0], scope, context)
      : string(thrown.getText());
  return locate(apply("Assert", [boolean(false), message]), getLocation(statement));
};

// An if statement as an IF. Without an else, the false branch is the rest of the statements.
export const translateIf = (
  statement: ts.IfStatement,
  scope: Scope,
  context: Context,
  translateBranch: (branch: ts.Statement) => Formula,
  translateRest: () => Formula,
) => {
  const condition = translateCondition(statement.expression, scope, context);
  const whenTrue = translateBranch(statement.thenStatement);
  const whenFalse =
    statement.elseStatement === undefined
      ? translateRest()
      : translateBranch(statement.elseStatement);
  return ifThenElse(
    condition,
    whenTrue,
    whenFalse,
    translateNegatedCondition(statement.expression, scope, context),
  );
};

// A switch as nested IFs. Each clause but the last must end in break, return, or throw.
export const translateSwitch = (
  statement: ts.SwitchStatement,
  scope: Scope,
  context: Context,
  translateClause: (statements: readonly ts.Statement[]) => Formula,
  translateRest: () => Formula,
): Formula => {
  const subject = translateExpression(statement.expression, scope, context);
  const clauses = statement.caseBlock.clauses;
  const translateFrom = (start: number): Formula => {
    if (start === clauses.length) return translateRest();
    // Empty clauses fall through to the next clause with statements.
    const end = clauses.findIndex(
      (clause, index) => index >= start && clause.statements.length > 0,
    );
    const group = clauses.slice(start, end === -1 ? clauses.length : end + 1);
    const lastClause = group[group.length - 1];
    const body = lastClause.statements;
    const last = body.at(-1);
    const isTerminated =
      last !== undefined &&
      (ts.isBreakStatement(last) || ts.isReturnStatement(last) || ts.isThrowStatement(last));
    const isLast = start + group.length === clauses.length;
    if (body.length > 0 && !isTerminated && !isLast) {
      throw new TlaTypeScriptError("End each case with break, return, or throw", lastClause);
    }
    const formula = translateClause(
      last !== undefined && ts.isBreakStatement(last) ? body.slice(0, -1) : body,
    );
    if (group.some(ts.isDefaultClause)) return formula;
    const conditions = group
      .filter(ts.isCaseClause)
      .map((clause) =>
        apply("=", [subject, translateExpression(clause.expression, scope, context)]),
      );
    return ifThenElse(
      conditions.length === 1 ? conditions[0] : junction("Or", conditions),
      formula,
      translateFrom(start + group.length),
    );
  };
  return translateFrom(0);
};
