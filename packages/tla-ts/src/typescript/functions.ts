import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type CalledMethod,
  type Context,
  type Definition,
  type FunctionNode,
  getCallee,
  getFunction,
  getGetters,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  type HelperDeclaration,
  isInlined,
  share,
} from "./context";
import { translateLocalStatements } from "./actions";
import { TlaTypeScriptError } from "../errors";
import { translateCondition, translateExpression, translateNegatedCondition } from "./expressions";
import { type Formula, ifThenElse, letIn, render, leaf } from "./formula";
import { getSuperLookup, translateFunctionValue, translateObjectValue } from "./heap";
import { mayBeNumber, useJavaScript } from "./javascript";
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
  define,
  defineAt,
  getLocation,
  identifier,
  ifExpression,
  junction,
  lambda,
  locate,
  string,
  tuple,
} from "./tla";
import { isBuiltInObject } from "./intrinsics";
import { link } from "./regions";
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

export const mayThrow = (
  node: ts.Node,
  context: Context,
  visited = new Set<ts.Node>(),
): boolean => {
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
  context.output.push(
    link(
      context,
      "definition",
      definition.name,
      declaration,
      defineAt(declaration, definition.name, declared, value),
    ),
  );
  return definition;
};

// Substitutes the arguments into a function's body, which then reads the state as it is now.
// The object that this names in the method a call inlines, which is the one the call reads the
// method from. Other calls keep the caller's, which this reads only in that method.
export const getReceiver = (scope: Scope, context: Context, called?: CalledMethod) =>
  called === undefined
    ? scope.receiver
    : {
        value:
          called.receiver.kind === ts.SyntaxKind.SuperKeyword
            ? getSuperLookup(called.receiver, scope, context).receiver
            : translateObjectValue(called.receiver, scope, context),
        method: called.method,
      };

// In a script with objects, a call evaluates its arguments before its body, though the body may
// not read them, so that an argument tla-ts can't evaluate stops the check. The call reads the
// arguments by the names that this shares them under.
export const shareArguments = (values: Expression[], context: Context) => {
  const names =
    context.heap === undefined ? [] : values.map(() => context.names.getFresh("argument"));
  const shared = context.heap === undefined ? values : names.map((name) => identifier(name));
  return {
    shared,
    evaluate: (rest: Formula, otherwise: Formula) =>
      names.length === 0
        ? rest
        : letIn(
            names.map((name, position) => define(name, [], values[position])),
            ifThenElse(apply("=", [tuple(shared), tuple(shared)]), rest, otherwise),
          ),
  };
};

const inlineCall = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
  called?: CalledMethod,
) => {
  if (callee.body === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const values = shareArguments(
    argumentNodes.map((argument) => translateExpression(argument, scope, context)),
    context,
  );
  const bound = bindValues(callee.parameters, values.shared, scope, context);
  const value = translateBody(
    callee.body,
    { ...bound.scope, receiver: getReceiver(scope, context, called) },
    context,
  );
  return render(
    values.evaluate(
      letIn(
        bound.definitions,
        forceHeap(scope, bound.scope, leaf(value), leaf(getUndefined(context)), context),
      ),
      leaf(getUndefined(context)),
    ),
  );
};

// Evaluates the heap that binding patterns gives, which reads the properties that object patterns
// take, before what follows them: TLC would otherwise read them only where something reads what
// the patterns bind, so a getter that tla-ts can't call wouldn't stop the check.
export const forceHeap = (
  before: Scope,
  after: Scope,
  rest: Formula,
  otherwise: Formula,
  context: Context,
) => {
  const heapSymbol = context.heap;
  const heap = heapSymbol === undefined ? undefined : after.bindings.get(heapSymbol);
  return heap === undefined || heapSymbol === undefined || heap === before.bindings.get(heapSymbol)
    ? rest
    : ifThenElse(apply("=", [heap, heap]), rest, otherwise);
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
// A helper that reads state after the step has changed it is inlined, so it reads the new values,
// as is one whose parameters a TLA+ operator can't declare, such as one with a default.
export const translateHelperCall = (
  declaration: HelperDeclaration,
  node: ts.CallExpression | undefined,
  scope: Scope,
  context: Context,
) => {
  rejectCaught(node ?? declaration, declaration, scope, context);
  const helper = getFunction(declaration);
  if (
    node !== undefined &&
    helper !== undefined &&
    !helper.parameters.every(
      (parameter) =>
        ts.isIdentifier(parameter.name) &&
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined,
    )
  ) {
    if (context.inProgress.has(helper)) {
      throw new TlaTypeScriptError(
        "A function whose parameters have defaults, patterns, or rest can't call itself",
        node,
      );
    }
    context.inProgress.add(helper);
    const value = inlineCall(helper, node.arguments, scope, context);
    context.inProgress.delete(helper);
    return value;
  }
  const definition = getDefinition(declaration, context);
  const argumentNodes = node?.arguments ?? [];
  if (definition.readsState && isStateModified(scope, context)) {
    const callee = getFunction(declaration);
    if (callee !== undefined) return inlineCall(callee, argumentNodes, scope, context);
    const initializer = getInitializer(declaration);
    if (initializer === undefined) throw new TlaTypeScriptError("Give this a body", declaration);
    return translateExpression(initializer, scope, context);
  }
  const values = shareArguments(
    argumentNodes.flatMap((argument, index) =>
      (definition.parameters.at(index)?.arity ?? 0) > 0
        ? []
        : [translateExpression(argument, scope, context)],
    ),
    context,
  );
  const shared = [...values.shared];
  const operands = definition.parameters.map((parameter, index) => {
    const argument = argumentNodes.at(index);
    if (argument === undefined) return getUndefined(context);
    return parameter.arity > 0
      ? translateOperatorArgument(argument, scope, context)
      : (shared.shift() ?? getUndefined(context));
  });
  return render(
    values.evaluate(leaf(call(definition.name, operands)), leaf(getUndefined(context))),
  );
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

// A read of a property that tla-ts can't resolve, which runs the getter it finds there of those
// that the script defines and that change nothing.
export const translateFoundGetter = (
  node: ts.Expression,
  heap: Expression,
  object: Expression,
  key: Expression,
  scope: Scope,
  context: Context,
  receiver?: Expression,
) => {
  const getters = getGetters(node, context).filter(
    (getter) => !context.inProgress.has(getter) && !(scope.isCatching && mayThrow(getter, context)),
  );
  if (getters.length === 0) return useJavaScript("Get", [heap, object, key], context);
  return share(heap, "heap", context, (sharedHeap) =>
    share(object, "object", context, (sharedObject) =>
      share(key, "key", context, (sharedKey) =>
        getters.reduceRight(
          (rest, getter) => {
            if (getter.body === undefined) return rest;
            context.inProgress.add(getter);
            const value = translateBody(
              getter.body,
              { ...scope, receiver: { value: receiver ?? sharedObject, method: getter } },
              context,
            );
            context.inProgress.delete(getter);
            return ifExpression(
              junction("And", [
                useJavaScript("IsRef", [sharedObject], context),
                apply("=", [
                  useJavaScript(
                    "CodeOf",
                    [
                      sharedHeap,
                      useJavaScript("GetterOf", [sharedHeap, sharedObject, sharedKey], context),
                    ],
                    context,
                  ),
                  translateFunctionValue(getter, context),
                ]),
              ]),
              value,
              rest,
            );
          },
          useJavaScript("Get", [sharedHeap, sharedObject, sharedKey], context),
        ),
      ),
    ),
  );
};

// A function body that computes a value, as a TLA+ expression.
// The definitions that a declaration list binds, with the values it gives them.
interface DeclaredValues extends Bound {
  values: Expression[];
}

// Whether a statement only binds constants, branches, returns, or throws, which an operator
// writes as it is.
const isPureStatement = (statement: ts.Statement): boolean => {
  if (ts.isBlock(statement)) return statement.statements.every(isPureStatement);
  if (ts.isIfStatement(statement)) {
    return (
      isPureStatement(statement.thenStatement) &&
      (statement.elseStatement === undefined || isPureStatement(statement.elseStatement))
    );
  }
  if (ts.isSwitchStatement(statement)) {
    return statement.caseBlock.clauses.every((clause) =>
      clause.statements.every(
        (inner, index) =>
          isPureStatement(inner) ||
          (ts.isBreakStatement(inner) && index === clause.statements.length - 1),
      ),
    );
  }
  return (
    (ts.isVariableStatement(statement) &&
      (statement.declarationList.flags & ts.NodeFlags.Const) !== 0) ||
    ts.isReturnStatement(statement) ||
    ts.isThrowStatement(statement)
  );
};

// A body of loops and assignments runs as statements that change only its locals.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): Expression => {
  if (!ts.isBlock(body)) return translateExpression(body, scope, context);
  return render(
    body.statements.every(isPureStatement)
      ? translatePure(body.statements, scope, context, () => leaf(getUndefined(context)))
      : translateLocalStatements(body, scope, context),
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
    const bound = statement.declarationList.declarations.reduce<DeclaredValues>(
      (current, declaration) => {
        const initializer = declaration.initializer;
        if (isInlined(initializer, context)) return current;
        const value =
          initializer === undefined
            ? getUndefined(context)
            : translateExpression(initializer, current.scope, context);
        const added = bindPattern(declaration.name, value, current.scope, context);
        return {
          definitions: [...current.definitions, ...added.definitions],
          scope: added.scope,
          values: [...current.values, value],
        };
      },
      { definitions: [], scope, values: [] },
    );
    // Each value runs though nothing reads it, so that a getter it reads stops the check.
    const forced = context.heap === undefined ? [] : bound.values;
    return letIn(
      bound.definitions,
      forced.length === 0
        ? forceHeap(
            scope,
            bound.scope,
            continueWith(bound.scope),
            leaf(getUndefined(context)),
            context,
          )
        : ifThenElse(
            apply("=", [tuple(forced), tuple(forced)]),
            forceHeap(
              scope,
              bound.scope,
              continueWith(bound.scope),
              leaf(getUndefined(context)),
              context,
            ),
            leaf(getUndefined(context)),
          ),
    );
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
    const conditions = group.filter(ts.isCaseClause).map((clause) => {
      const value = translateExpression(clause.expression, scope, context);
      return context.hasSpecialNumbers && mayBeNumber(statement.expression, context)
        ? useJavaScript("StrictEquals", [subject, value], context)
        : apply("=", [subject, value]);
    });
    return ifThenElse(
      conditions.length === 1 ? conditions[0] : junction("Or", conditions),
      formula,
      translateFrom(start + group.length),
    );
  };
  return translateFrom(0);
};
