import ts from "typescript";
import {
  type Context,
  type Definition,
  type FunctionNode,
  getCallee,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  type HelperDeclaration,
} from "./context";
import { TsproverError } from "./errors";
import { translateCondition, translateExpression, translateNegatedCondition } from "./expressions";
import { type Formula, ifThenElse, indent, letIn, render, text, wrap } from "./formula";
import {
  type Bound,
  bindNames,
  bindPattern,
  bindValues,
  createStateScope,
  declareParameters,
  type Scope,
} from "./scope";

// Whether a step has changed a state variable, so that helpers reading state must see the change.
const isStateModified = (scope: Scope, context: Context) =>
  [...context.variables].some((entry) => scope.bindings.get(entry[0]) !== entry[1]);

const readsState = (node: ts.Node, context: Context, visited: Set<ts.Declaration>): boolean => {
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    if (symbol !== undefined && context.variables.has(symbol)) return true;
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
  if (declaration.name === undefined) throw new TsproverError("Name this function", declaration);
  const callee = getFunction(declaration);
  const parameters = declareParameters(callee?.parameters ?? [], context);
  // An operator parameter declares how many arguments it takes, as in F(_, _).
  const declared = parameters.map((parameter) => {
    const signatures = context.checker.getTypeAtLocation(parameter.node.name).getCallSignatures();
    return signatures.length === 0
      ? parameter.name
      : `${parameter.name}(${signatures[0].parameters.map(() => "_").join(", ")})`;
  });
  const definition: Definition = {
    name: context.names.getFresh(declaration.name.getText()),
    parameters: declared,
    readsState: readsState(declaration, context, new Set([declaration])),
  };
  context.definitions.set(declaration, definition);
  context.inProgress.add(declaration);
  const body = callee === undefined ? getInitializer(declaration) : callee.body;
  if (body === undefined) throw new TsproverError("Give this a value", declaration);
  const value = translateBody(body, bindNames(createStateScope(context), parameters), context);
  context.inProgress.delete(declaration);
  const head =
    declared.length === 0 ? definition.name : `${definition.name}(${declared.join(", ")})`;
  context.output.push(`${head} ==\n  ${indent(value, "  ")}`);
  return definition;
};

// Substitutes the arguments into a function's body, which then reads the state as it is now.
const inlineCall = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
) => {
  if (callee.body === undefined) throw new TsproverError("Give this a body", callee);
  const bound = bindValues(
    callee.parameters.map((parameter) => parameter.name),
    argumentNodes.map((argument) => translateExpression(argument, scope, context)),
    scope,
    context,
  );
  const value = translateBody(callee.body, bound.scope, context);
  return bound.definitions.length === 0 ? value : render(letIn(bound.definitions, text(value)));
};

// A function argument to an operator parameter, as a LAMBDA or an operator's name.
const translateOperatorArgument = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parameters = declareParameters(node.parameters, context);
    const body = translateBody(node.body, bindNames(scope, parameters), context);
    return `LAMBDA ${parameters.map((parameter) => parameter.name).join(", ")} : ${body}`;
  }
  const symbol = getSymbol(node, context.checker);
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration !== undefined) return getDefinition(declaration, context).name;
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding === undefined) throw new TsproverError("Pass a function here", node);
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
  const definition = getDefinition(declaration, context);
  const argumentNodes = node?.arguments ?? [];
  if (definition.readsState && isStateModified(scope, context)) {
    const callee = getFunction(declaration);
    if (callee !== undefined) return inlineCall(callee, argumentNodes, scope, context);
    const initializer = getInitializer(declaration);
    if (initializer === undefined) throw new TsproverError("Give this a body", declaration);
    return translateExpression(initializer, scope, context);
  }
  if (definition.parameters.length === 0) return definition.name;
  const values = argumentNodes.map((argument, index) =>
    definition.parameters[index].includes("(")
      ? translateOperatorArgument(argument, scope, context)
      : translateExpression(argument, scope, context),
  );
  return `${definition.name}(${values.join(", ")})`;
};

// A call to a function declared inside another, which is inlined.
export const translateLocalCall = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const callee = getCallee(node.expression, context);
  if (callee === undefined) {
    throw new TsproverError(`Unsupported call: ${node.expression.getText()}`, node);
  }
  if (context.inProgress.has(callee)) {
    throw new TsproverError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  context.inProgress.add(callee);
  const value = inlineCall(callee, node.arguments, scope, context);
  context.inProgress.delete(callee);
  return value;
};

// A function body that computes a value, as a TLA+ expression.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): string => {
  if (!ts.isBlock(body)) return translateExpression(body, scope, context);
  return render(
    translatePure(body.statements, scope, context, () => {
      throw new TsproverError("This function must return a value on every path", body);
    }),
  );
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
        if (declaration.initializer === undefined) {
          throw new TsproverError("Declare locals with a value", declaration);
        }
        if (getFunction(declaration.initializer) !== undefined) return current;
        const value = translateExpression(declaration.initializer, current.scope, context);
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
    if (statement.expression === undefined) throw new TsproverError("Return a value", statement);
    return text(translateExpression(statement.expression, scope, context));
  }
  if (ts.isThrowStatement(statement)) return text(translateThrow(statement, scope, context));
  if (ts.isSwitchStatement(statement)) {
    return translateSwitch(
      statement,
      scope,
      context,
      (clause) => translatePure(clause, scope, context, continueWith),
      () => continueWith(scope),
    );
  }
  throw new TsproverError(`Unsupported statement: ${statement.getText()}`, statement);
};

export const translateThrow = (statement: ts.ThrowStatement, scope: Scope, context: Context) => {
  const thrown = statement.expression;
  const message =
    ts.isNewExpression(thrown) && thrown.arguments?.[0] !== undefined
      ? translateExpression(thrown.arguments[0], scope, context)
      : JSON.stringify(thrown.getText());
  return `Assert(FALSE, ${message})`;
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
  const subject = wrap(translateExpression(statement.expression, scope, context));
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
      throw new TsproverError("End each case with break, return, or throw", lastClause);
    }
    const formula = translateClause(
      last !== undefined && ts.isBreakStatement(last) ? body.slice(0, -1) : body,
    );
    if (group.some(ts.isDefaultClause)) return formula;
    const condition = group
      .filter(ts.isCaseClause)
      .map(
        (clause) => `${subject} = ${wrap(translateExpression(clause.expression, scope, context))}`,
      )
      .join(" \\/ ");
    return ifThenElse(condition, formula, translateFrom(start + group.length));
  };
  return translateFrom(0);
};
