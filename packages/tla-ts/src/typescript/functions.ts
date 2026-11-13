import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type CalledMethod,
  type Context,
  type Definition,
  type FunctionNode,
  findNodes,
  getAnyFunction,
  getCallee,
  getFactoryCall,
  getFunction,
  getFunctionCandidates,
  getGetters,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  type HelperDeclaration,
  isInlined,
  isLiteral,
  isPlain,
  share,
  skipCasts,
} from "./context";
import {
  allocateArguments,
  getArgumentsReads,
  getWritten,
  isArgumentsRead,
  getWrittenRoots,
  getImmutableWrite,
  throwOnUnentered,
  translateLocalStatements,
} from "./actions";
import { TlaTypeScriptError } from "../errors";
import { translateCondition, translateExpression, translateNegatedCondition } from "./expressions";
import { type Formula, ifThenElse, letIn, render, leaf } from "./formula";
import { getCandidateValue, getSuperLookup, translateObjectValue } from "./heap";
import { mayBeNumber, useJavaScript } from "./javascript";
import {
  type Bound,
  bindNames,
  bindPattern,
  bindValues,
  translateArgumentValues,
  createStateScope,
  declareParameters,
  getArrowReceivers,
  type Scope,
} from "./scope";
import {
  apply,
  boolean,
  call,
  define,
  defineAt,
  field,
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
import { getStoredCall, translateStoredCall } from "./collections";
import { link } from "./regions";
import { getStackCall } from "./stacks";
import { getKind, hasHeapType, translateUnknown } from "./types";

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
  // A regexp literal is an object, whose methods are built-in ones only while the heap says so.
  if (context.heap !== undefined && ts.isRegularExpressionLiteral(node)) return true;
  return (
    ts.forEachChild(node, (child) => readsState(child, context, visited) || undefined) ?? false
  );
};

export const mayThrow = (
  node: ts.Node,
  context: Context,
  visited = new Set<ts.Node>(),
): boolean => {
  // A using declaration throws a TypeError for a value that isn't disposable, and it and a
  // DisposableStack's methods run dispose methods. A write to a const throws a TypeError.
  if (
    ts.isThrowStatement(node) ||
    (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0) ||
    getStackCall(node, context) !== undefined ||
    getImmutableWrite(node, context)?.isIgnored === false
  ) {
    return true;
  }
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

// A scope that binds the parameters of the factory whose call a constant holds, for the function
// that the factory returns to read.
export const bindFactory = (declaration: ts.Node | undefined, scope: Scope, context: Context) => {
  const factory =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? getFactoryCall(declaration.initializer, context)
      : undefined;
  return factory === undefined
    ? scope
    : {
        ...scope,
        bindings: new Map([
          ...scope.bindings,
          ...factory.bindings.map((binding): [ts.Symbol, Expression] => [
            binding[0],
            translateExpression(binding[1], scope, context),
          ]),
        ]),
      };
};

// The function that a helper is, or that the factory call it holds returns.
const getHelper = (declaration: HelperDeclaration, context: Context) =>
  getFunction(declaration) ?? getFactoryCall(getInitializer(declaration), context)?.closure;

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
  const callee = getHelper(declaration, context);
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
  // TLA+ can only call an operator parameter, or pass it to another, so it isn't a value.
  const operators = new Set(
    parameters.flatMap((parameter, index) => {
      const symbol = getSymbol(parameter.node.name, context.checker);
      return declared[index].arity > 0 && symbol !== undefined ? [symbol] : [];
    }),
  );
  const rejectValues = (node: ts.Node) => {
    const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
    if (ts.isIdentifier(node) && symbol !== undefined && operators.has(symbol)) {
      const parent = node.parent;
      const isCalled = ts.isCallExpression(parent) && parent.expression === node;
      const isPassed =
        ts.isCallExpression(parent) &&
        parent.arguments.some((argument) => argument === node) &&
        (context.checker.getContextualType(node)?.getCallSignatures().length ?? 0) > 0;
      if (!isCalled && !isPassed) {
        throw new TlaTypeScriptError(
          "Call this function parameter, or pass it to a function",
          node,
        );
      }
    }
    ts.forEachChild(node, rejectValues);
  };
  if (operators.size > 0) rejectValues(body);
  const value = translateBody(
    body,
    bindNames(bindFactory(declaration, createStateScope(context), context), parameters),
    context,
  );
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

// The function that an argument names, which a parameter that the callee calls takes as it is
// rather than as a value.
const getCallback = (argument: ts.Expression, scope: Scope, context: Context) => {
  const symbol = getSymbol(argument, context.checker);
  const held = symbol === undefined ? undefined : scope.functions.get(symbol);
  const callback = held ?? getCallee(argument, context);
  return callback?.body !== undefined &&
    context.checker.getTypeAtLocation(argument).getCallSignatures().length > 0
    ? callback
    : undefined;
};

const inlineCall = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
  called?: CalledMethod,
) => {
  if (callee.body === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const callbacks = callee.parameters.flatMap(
    (parameter, position): [ts.Symbol, FunctionNode][] => {
      const argument = argumentNodes.at(position);
      const symbol = getSymbol(parameter.name, context.checker);
      const callback = argument === undefined ? undefined : getCallback(argument, scope, context);
      return callback === undefined ||
        symbol === undefined ||
        parameter.dotDotDotToken !== undefined
        ? []
        : [[symbol, callback]];
    },
  );
  const isValue = (position: number) =>
    !callbacks.some(
      (entry) => entry[0] === getSymbol(callee.parameters[position].name, context.checker),
    );
  const passed = translateArgumentValues(
    callee.parameters,
    argumentNodes,
    (position) => position >= callee.parameters.length || isValue(position),
    scope,
    context,
  );
  const values = shareArguments(passed.values, context);
  const reads = getArgumentsReads(callee, context);
  // A call inside an expression holds its arguments object on a heap that only the call reads, so
  // the body may read only its length and elements.
  if (
    reads.length > 0 &&
    (callbacks.length > 0 ||
      argumentNodes.some(ts.isSpreadElement) ||
      !reads.every((read) => isArgumentsRead(read, context)) ||
      context.heap === undefined)
  ) {
    throw new TlaTypeScriptError("Unsupported arguments object", reads[0]);
  }
  const made = allocateArguments(
    callee,
    values.shared,
    callee,
    { definitions: [], scope },
    context,
  );
  const bound = bindValues(
    callee.parameters.filter((_, position) => isValue(position)),
    passed.isSpread ? values.shared.slice(0, -1) : values.shared,
    made.scope,
    context,
    passed.isSpread ? values.shared.at(-1) : undefined,
  );
  context.inProgress.add(callee);
  const value = translateBody(
    callee.body,
    {
      ...bound.scope,
      functions: new Map([...bound.scope.functions, ...callbacks]),
      receiver: getReceiver(scope, context, called),
      arrowReceivers: getArrowReceivers(callbacks, scope),
    },
    context,
  );
  context.inProgress.delete(callee);
  return render(
    values.evaluate(
      letIn(
        [...made.definitions, ...bound.definitions],
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
// A local function that a name holds reads the names around it where the LAMBDA stands.
const translateOperatorArgument = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Expression => {
  const symbol = getSymbol(node, context.checker);
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration !== undefined) return identifier(getDefinition(declaration, context).name);
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding !== undefined) return binding;
  const held = ts.isIdentifier(node) ? getCallback(node, scope, context) : undefined;
  const callee = ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node : held;
  if (callee?.body === undefined) throw new TlaTypeScriptError("Pass a function here", node);
  if (context.inProgress.has(callee)) {
    throw new TlaTypeScriptError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  const parameters = declareParameters(callee.parameters, context);
  context.inProgress.add(callee);
  const body = translateBody(callee.body, bindNames(scope, parameters), context);
  context.inProgress.delete(callee);
  return lambda(
    parameters.map((parameter) => parameter.name),
    body,
  );
};

// A call to a top-level helper, or a reference to a top-level constant when node is undefined.
// A call to a helper that calls itself where a statement changed the state that it reads, which
// runs an operator that takes that state, so that each call reads the state as it is there. A
// parameter's default stands where the call passes undefined.
// A call of a function from inside itself, as a recursive operator that takes the state that the
// call reads and the values that it passes.
export const callStateOperator = (
  declaration: HelperDeclaration,
  callee: FunctionNode,
  values: readonly Expression[],
  scope: Scope,
  context: Context,
) => {
  const body = callee.body;
  if (body === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const variables = [...context.variables];
  const definition =
    context.stateCalls.get(callee) ??
    (() => {
      const states = variables.map((entry) => ({
        symbol: entry[0],
        name: context.names.getFresh(entry[0].name),
      }));
      const parameters = callee.parameters.map((parameter) => {
        if (
          !ts.isIdentifier(parameter.name) ||
          parameter.dotDotDotToken !== undefined ||
          (parameter.initializer !== undefined && !isLiteral(parameter.initializer))
        ) {
          throw new TlaTypeScriptError(
            "A function whose parameters have patterns, rest, or defaults other than literals can't call itself",
            parameter,
          );
        }
        return {
          initializer: parameter.initializer,
          name: context.names.getFresh(parameter.name.text),
          symbol: getSymbol(parameter.name, context.checker),
        };
      });
      const made: Definition = {
        name: context.names.getFresh(`${declaration.name?.getText() ?? "helper"}At`),
        parameters: [...states, ...parameters].map((parameter) => ({
          name: parameter.name,
          arity: 0,
        })),
        readsState: false,
      };
      context.stateCalls.set(callee, made);
      const named = bindNames(bindFactory(declaration, createStateScope(context), context), [
        ...states,
        ...parameters,
      ]);
      const defaulted = {
        ...named,
        bindings: new Map([
          ...named.bindings,
          ...parameters.flatMap((parameter): [ts.Symbol, Expression][] =>
            parameter.initializer === undefined || parameter.symbol === undefined
              ? []
              : [
                  [
                    parameter.symbol,
                    ifExpression(
                      apply("=", [identifier(parameter.name), getUndefined(context)]),
                      translateExpression(parameter.initializer, named, context),
                      identifier(parameter.name),
                    ),
                  ],
                ],
          ),
        ]),
      };
      const outer = context.inProgress;
      context.inProgress = new Set([callee]);
      const value = translateBody(body, defaulted, context);
      context.inProgress = outer;
      context.output.push(
        link(
          context,
          "definition",
          made.name,
          callee,
          defineAt(callee, made.name, made.parameters, value),
        ),
      );
      return made;
    })();
  return call(definition.name, [
    ...variables.map((entry) => scope.bindings.get(entry[0]) ?? entry[1]),
    ...callee.parameters.map((_, position) => values[position] ?? getUndefined(context)),
  ]);
};

const translateStateCall = (
  declaration: HelperDeclaration,
  callee: FunctionNode,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  if (node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError("tla-ts can't spread the arguments of a call to itself", node);
  }
  const values = shareArguments(
    node.arguments.map((argument) => translateExpression(argument, scope, context)),
    context,
  );
  return render(
    values.evaluate(
      leaf(callStateOperator(declaration, callee, values.shared, scope, context)),
      leaf(getUndefined(context)),
    ),
  );
};

// A helper that reads state after the step has changed it is inlined, so it reads the new values,
// as is one whose parameters a TLA+ operator can't declare, such as one with a default.
export const translateHelperCall = (
  declaration: HelperDeclaration,
  node: ts.CallExpression | undefined,
  scope: Scope,
  context: Context,
) => {
  rejectCaught(node ?? declaration, declaration, scope, context);
  const helper = getHelper(declaration, context);
  const helperScope = bindFactory(declaration, scope, context);
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
      return translateStateCall(declaration, helper, node, scope, context);
    }
    return inlineCall(helper, node.arguments, helperScope, context);
  }
  const definition = getDefinition(declaration, context);
  const argumentNodes = node?.arguments ?? [];
  if (definition.readsState && isStateModified(scope, context)) {
    if (helper !== undefined && node !== undefined && context.inProgress.has(helper)) {
      return translateStateCall(declaration, helper, node, scope, context);
    }
    if (helper !== undefined) return inlineCall(helper, argumentNodes, helperScope, context);
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

// The local functions that a function calls by name, with it, and the names it reads from the
// functions around them, which a lifted definition takes as parameters.
const getCaptured = (callee: FunctionNode, context: Context) => {
  const isLocal = (node: ts.Node) => ts.findAncestor(node.parent, ts.isFunctionLike) !== undefined;
  const reached = new Set<ts.Node>([callee]);
  const pending = [callee];
  while (pending.length > 0) {
    findNodes(pending.pop() ?? callee, ts.isIdentifier).forEach((name) => {
      const declaration = getSymbol(name, context.checker)?.valueDeclaration;
      const found = getAnyFunction(declaration);
      if (found === undefined || !isLocal(found) || reached.has(found)) return;
      reached.add(found);
      pending.push(found);
    });
  }
  const isInside = (node: ts.Node) =>
    ts.findAncestor(node, (ancestor) => reached.has(ancestor)) !== undefined;
  const captured = new Set<ts.Symbol>();
  reached.forEach((current) =>
    findNodes(current, ts.isIdentifier).forEach((name) => {
      const symbol = getSymbol(name, context.checker);
      const declaration = symbol?.valueDeclaration;
      if (
        symbol !== undefined &&
        declaration !== undefined &&
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration)) &&
        getAnyFunction(declaration) === undefined &&
        isLocal(declaration) &&
        !isInside(declaration)
      ) {
        captured.add(symbol);
      }
    }),
  );
  return { reached: [...reached], captured: [...captured] };
};

// Whether tla-ts can compile a local function as a definition that takes the names it reads from
// the functions around it: one that changes none of them and reads no state, which a definition
// would read as the step began, unless the definition takes the state too.
export const isLiftable = (callee: FunctionNode, context: Context, isStateTaken = false) => {
  if (ts.findAncestor(callee.parent, ts.isFunctionLike) === undefined) return false;
  const found = getCaptured(callee, context);
  const isCapturedWritten = (node: ts.Node) => {
    const written = getWritten(node);
    return (
      written !== undefined &&
      getWrittenRoots(written).some((root) => {
        const symbol = getSymbol(root, context.checker);
        return symbol !== undefined && found.captured.includes(symbol);
      })
    );
  };
  return (
    (isStateTaken || context.heap === undefined) &&
    (ts.isArrowFunction(callee) ||
      ts.isFunctionExpression(callee) ||
      ts.isFunctionDeclaration(callee)) &&
    callee.body !== undefined &&
    isPlain(callee) &&
    callee.parameters.every(
      (parameter) =>
        ts.isIdentifier(parameter.name) &&
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined &&
        context.checker.getTypeAtLocation(parameter).getCallSignatures().length === 0,
    ) &&
    found.reached.every(
      (reached) =>
        (isStateTaken || !readsState(reached, context, new Set())) &&
        findNodes(reached, (inner): inner is ts.Node => isCapturedWritten(inner)).length === 0,
    )
  );
};

// A local function that a call reaches again while tla-ts inlines it, compiled once as a definition
// beside the top-level ones. It takes the names it reads from the functions around it as
// parameters, which a call passes as they are then, as JavaScript reads them then. It may change
// none of them. One that reads state, or the heap, takes the state as the call reads it too.
export const translateLiftedCall = (
  callee: FunctionNode,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  rejectCaught(node, callee, scope, context);
  const found = getCaptured(callee, context);
  if (!isLiftable(callee, context, true) || callee.body === undefined) {
    throw new TlaTypeScriptError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  const variables = isLiftable(callee, context) ? [] : [...context.variables];
  const existing = context.definitions.get(callee);
  if (existing !== undefined) context.recursive.add(callee);
  const definition =
    existing ??
    (() => {
      const states = variables.map((entry) => ({
        symbol: entry[0],
        name: context.names.getFresh(entry[0].name),
      }));
      const parameters = declareParameters(callee.parameters, context);
      const captured = found.captured.map((symbol) => ({
        symbol,
        name: context.names.getFresh(symbol.name),
      }));
      const named = ts.isVariableDeclaration(callee.parent) ? callee.parent.name : callee.name;
      const lifted: Definition = {
        name: context.names.getFresh(
          named !== undefined && ts.isIdentifier(named) ? named.text : "local",
        ),
        parameters: [...parameters, ...captured, ...states].map((parameter) => ({
          name: parameter.name,
          arity: 0,
        })),
        readsState: false,
      };
      context.definitions.set(callee, lifted);
      const outer = context.inProgress;
      context.inProgress = new Set([callee]);
      const value = translateBody(
        callee.body,
        bindNames(createStateScope(context), [...parameters, ...captured, ...states]),
        context,
      );
      context.inProgress = outer;
      context.output.push(
        link(
          context,
          "definition",
          lifted.name,
          callee,
          defineAt(callee, lifted.name, lifted.parameters, value),
        ),
      );
      return lifted;
    })();
  const capturedValues = found.captured.map((symbol) => {
    const binding = scope.bindings.get(symbol);
    if (binding === undefined) {
      throw new TlaTypeScriptError(
        `A local function can't read ${symbol.name} where it calls itself`,
        node,
      );
    }
    return binding;
  });
  const values = shareArguments(
    node.arguments.map((argument) => translateExpression(argument, scope, context)),
    context,
  );
  const operands = callee.parameters.map(
    (_, position) => values.shared[position] ?? getUndefined(context),
  );
  return render(
    values.evaluate(
      leaf(
        call(definition.name, [
          ...operands,
          ...capturedValues,
          ...variables.map((entry) => scope.bindings.get(entry[0]) ?? entry[1]),
        ]),
      ),
      leaf(getUndefined(context)),
    ),
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
  const symbol = getSymbol(skipCasts(node.expression), context.checker);
  const callee =
    called?.method ??
    (symbol && scope.functions.get(symbol)) ??
    getCallee(node.expression, context);
  // A function that a value holds, which the call runs by matching the value against the functions
  // of its file that it may be. One that reads its this would need the call's receiver.
  const candidates =
    callee === undefined && context.heap !== undefined
      ? getFunctionCandidates(node.expression, context).filter(
          (candidate) =>
            isPlain(candidate) &&
            !context.inProgress.has(candidate) &&
            (ts.isArrowFunction(candidate) ||
              findNodes(
                candidate,
                (inner): inner is ts.ThisExpression => inner.kind === ts.SyntaxKind.ThisKeyword,
              ).length === 0),
        )
      : [];
  const stored = callee === undefined ? getStoredCall(node, context) : undefined;
  if (callee === undefined && (candidates.length > 0 || stored !== undefined)) {
    const unknown = apply("Assert", [
      boolean(false),
      string("tla-ts can't tell which function this call runs"),
    ]);
    return share(
      translateExpression(node.expression, scope, context),
      "function",
      context,
      (value) =>
        candidates.reduceRight<Expression>(
          (otherwise, candidate) => {
            const candidateValue = getCandidateValue(candidate, context);
            return candidateValue === undefined
              ? otherwise
              : ifExpression(
                  apply("=", [value, candidateValue]),
                  inlineCall(candidate, node.arguments, scope, context),
                  otherwise,
                );
          },
          stored === undefined
            ? unknown
            : field(
                translateStoredCall(
                  stored,
                  value,
                  translateExpression(stored.receiver, scope, context),
                  false,
                  scope,
                  context,
                ),
                "value",
              ),
        ),
    );
  }
  if (callee === undefined) {
    return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
  }
  // A built-in that tla-ts doesn't model has only its declaration, as eval does.
  if (callee.body === undefined && callee.getSourceFile().isDeclarationFile) {
    throw new TlaTypeScriptError(`tla-ts can't run ${node.expression.getText()}`, node);
  }
  rejectCaught(node, callee, scope, context);
  if (context.inProgress.has(callee)) return translateLiftedCall(callee, node, scope, context);
  return inlineCall(callee, node.arguments, scope, context, called);
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
            const candidate = getCandidateValue(getter, context);
            if (getter.body === undefined || candidate === undefined) return rest;
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
                  candidate,
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
    ((ts.isVariableStatement(statement) &&
      (statement.declarationList.flags & ts.NodeFlags.Const) !== 0) ||
      ts.isReturnStatement(statement) ||
      ts.isThrowStatement(statement)) &&
    !isAssigning(statement)
  );
};

// Whether a node assigns or increments, outside the functions it defines, which only statements
// that run in order can do before the rest of their expression.
const isAssigning = (node: ts.Node): boolean =>
  (ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
  ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
    (node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken)) ||
  (!ts.isFunctionLike(node) &&
    (ts.forEachChild(node, (child) => isAssigning(child) || undefined) ?? false));

// A body of loops and assignments runs as statements that change only its locals.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): Expression => {
  throwOnUnentered(body.parent, scope, context);
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

// A statement that always returns or throws, as a block that ends in one does.
const isLeaving = (statement: ts.Statement): boolean => {
  if (ts.isBlock(statement)) {
    const last = statement.statements.at(-1);
    return last !== undefined && isLeaving(last);
  }
  return ts.isReturnStatement(statement) || ts.isThrowStatement(statement);
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
    const isTerminated = last !== undefined && (ts.isBreakStatement(last) || isLeaving(last));
    const isLast = start + group.length === clauses.length;
    if (body.length > 0 && !isTerminated && !isLast) {
      throw new TlaTypeScriptError("End each case with break, return, or throw", lastClause);
    }
    const formula = translateClause(
      last !== undefined && ts.isBreakStatement(last) ? body.slice(0, -1) : body,
    );
    if (group.some(ts.isDefaultClause)) return formula;
    const conditions = group.filter(ts.isCaseClause).map((clause) => {
      // A case compares by identity, which a sequence lacks.
      if (
        getKind(statement.expression, context) === "sequence" &&
        getKind(clause.expression, context) === "sequence"
      ) {
        throw new TlaTypeScriptError(
          "tla-ts can't tell whether two equal arrays are the same array",
          clause.expression,
        );
      }
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
