import ts from "@typescript/typescript6";
import { type Expression, getChildren } from "../ast";
import { mapChildren } from "../instances";
import {
  type CalledMethod,
  type Context,
  type Definition,
  type DispatchCall,
  type FunctionNode,
  findNodes,
  getAnyFunction,
  getBound,
  getCallee,
  getParameters,
  getFactoryCall,
  getFunction,
  getFunctionCandidates,
  getGetters,
  getStaticTruth,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  type HelperDeclaration,
  isClosure,
  isHeapFunction,
  isInlined,
  isLiteral,
  isPlain,
  isSuperAccess,
  share,
  isInertValue,
  skipCasts,
  getValueDeclaration,
} from "./context";
import {
  allocateArguments,
  getArgumentsLengths,
  checkDestructured,
  getArgumentsReads,
  getWritten,
  isArgumentsRead,
  getWrittenRoots,
  getImmutableWrite,
  isMaybeNullish,
  throwOnUnentered,
  enterScope,
  isValueReturn,
  translateLocalStatements,
} from "./actions";
import { TlaTypeScriptError } from "../errors";
import { readsUninitialized } from "./aliasing";
import { getConversion } from "./conversions";
import { getUncaughtText } from "./exceptions";
import { translateCondition, translateExpression, translateNegatedCondition } from "./expressions";
import { type Formula, ifThenElse, letIn, render, leaf } from "./formula";
import { getAllocated, getCandidateValue, getSuperLookup, translateObjectValue } from "./heap";
import { isComparable, mayBeNumber, useJavaScript } from "./javascript";
import { getTakenValue, isTaken } from "./iterators";
import {
  type Bound,
  bindNames,
  bindPattern,
  bindValues,
  translateArgumentValues,
  createStateScope,
  declareParameters,
  getArrowReceivers,
  getThisOwner,
  type Receiver,
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
  letExpression,
  locate,
  set,
  string,
  tuple,
} from "./tla";
import { isBuiltInObject, stopUnknownCall } from "./intrinsics";
import { getStoredCall, translateKeyedPrimitiveCall, translateStoredCall } from "./collections";
import { link } from "./regions";
import { getStackCall } from "./stacks";
import { getIteratorDisposeCall } from "./disposal";
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
    const declaration = getTopLevelDeclaration(symbol, context);
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

// What is visited, such as a call that a statement already ran first, throws nothing more.
export const mayThrow = (
  node: ts.Node,
  context: Context,
  visited = new Set<ts.Node>(),
): boolean => {
  if (visited.has(node)) return false;
  visited.add(node);
  // A using declaration throws a TypeError for a value that isn't disposable, and it and a
  // DisposableStack's methods run dispose methods. A write to a const throws a TypeError, as does a
  // read of a function's caller or arguments, which runs %ThrowTypeError%, and a pattern that
  // destructures null or undefined.
  if (
    ts.isThrowStatement(node) ||
    (ts.isPropertyAccessExpression(node) &&
      ["caller", "arguments"].includes(node.name.text) &&
      context.checker.getTypeAtLocation(node.expression).getCallSignatures().length > 0) ||
    (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0) ||
    getStackCall(node, context) !== undefined ||
    getIteratorDisposeCall(node, context) !== undefined ||
    getImmutableWrite(node, context)?.isIgnored === false ||
    ((ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) &&
      isMaybeNullish(context.checker.getTypeAtLocation(node)))
  ) {
    return true;
  }
  if (ts.isCallExpression(node)) {
    const callee = getCallee(node.expression, context);
    if (callee !== undefined && mayThrow(callee, context, visited)) return true;
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
// that the factory returns to read, so it enters that function.
export const bindFactory = (declaration: ts.Node | undefined, scope: Scope, context: Context) => {
  const factory =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? getFactoryCall(declaration.initializer, context)
      : undefined;
  return factory === undefined
    ? scope
    : {
        ...scope,
        entered: factory.closure,
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

// How many arguments a helper's parameter takes as an operator parameter, where 0 makes it a value.
const getArity = (parameter: ts.ParameterDeclaration, context: Context) =>
  context.checker.getTypeAtLocation(parameter.name).getCallSignatures().at(0)?.parameters.length ??
  0;

// Whether a name is one that a helper's definition takes as an operator parameter, which only a
// call applies or an operator argument passes. Any other name that holds a function holds a value.
export const isOperatorParameter = (name: string, context: Context) =>
  [...context.definitions.values()].some((definition) =>
    definition.parameters.some((parameter) => parameter.arity > 0 && parameter.name === name),
  );

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
  const parameters = declareParameters(callee === undefined ? [] : getParameters(callee), context);
  // An operator parameter declares how many arguments it takes, as in F(_, _).
  const declared = parameters.map((parameter) => ({
    name: parameter.name,
    arity: getArity(parameter.node, context),
  }));
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
  // SANY rejects a RECURSIVE operator that takes an operator, so a helper that calls itself with
  // the functions that it takes recurses through an operator inside its definition, which holds
  // them and takes the other parameters under names of its own.
  const ownSymbol = getSymbol(declaration.name, context.checker);
  const isRecursing =
    operators.size > 0 &&
    operators.size < parameters.length &&
    findNodes(body, ts.isIdentifier).some((name) => getSymbol(name, context.checker) === ownSymbol);
  const inner = isRecursing
    ? parameters.map((parameter, index) =>
        declared[index].arity > 0
          ? parameter
          : { ...parameter, name: context.names.getFresh(parameter.name) },
      )
    : parameters;
  const recursion: Definition = {
    ...definition,
    name: isRecursing ? context.names.getFresh(`${definition.name}Of`) : definition.name,
  };
  const outputCount = context.output.length;
  if (isRecursing) context.definitions.set(declaration, recursion);
  const translated = translateBody(
    body,
    bindNames(bindFactory(declaration, createStateScope(context), context), inner),
    context,
  );
  context.definitions.set(declaration, definition);
  const isRecursion = (expression: Expression): boolean =>
    (expression.kind === "Apply" && expression.operator === recursion.name) ||
    getChildren(expression).some(isRecursion);
  if (
    (operators.size > 0 && !isRecursing && context.recursive.has(declaration)) ||
    (isRecursing && context.output.slice(outputCount).some((output) => isRecursion(output.body)))
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't recurse through another function with the functions that this one takes",
      declaration,
    );
  }
  // Each call inside passes the functions that the definition holds, in their places.
  const callRecursion = (expression: Expression): Expression => {
    if (expression.kind !== "Apply" || expression.operator !== recursion.name) {
      return mapChildren(expression, callRecursion);
    }
    const isHeld = declared.every(
      (parameter, index) =>
        parameter.arity === 0 ||
        (expression.args[index]?.kind === "Identifier" &&
          expression.args[index].name === parameter.name),
    );
    if (!isHeld) {
      throw new TlaTypeScriptError(
        "tla-ts can't recurse with other functions than those that this function takes",
        declaration,
      );
    }
    return call(
      recursion.name,
      expression.args.filter((_, index) => declared[index].arity === 0).map(callRecursion),
    );
  };
  const value = isRecursing
    ? letExpression(
        [
          {
            ...define(
              recursion.name,
              inner.flatMap((parameter, index) =>
                declared[index].arity > 0 ? [] : [{ name: parameter.name, arity: 0 }],
              ),
              callRecursion(translated),
            ),
            isRecursive: true,
          },
        ],
        call(
          recursion.name,
          declared.flatMap((parameter) =>
            parameter.arity > 0 ? [] : [identifier(parameter.name)],
          ),
        ),
      )
    : translated;
  if (isRecursing) context.recursive.delete(declaration);
  // What the body translates to may read the state where its code names none of it, such as the
  // heap that an array's iterator or a typeof reads.
  const stateNames = new Set([
    ...[...context.variables.values()].flatMap((variable) =>
      variable.kind === "Identifier" ? [variable.name] : [],
    ),
    ...[...context.definitions.values()].flatMap((defined) =>
      defined.readsState ? [defined.name] : [],
    ),
  ]);
  const isReading = (expression: Expression): boolean =>
    (expression.kind === "Identifier" && stateNames.has(expression.name)) ||
    (expression.kind === "Apply" && stateNames.has(expression.operator)) ||
    getChildren(expression).some(isReading);
  definition.readsState = definition.readsState || isReading(value);
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
// A call by a function's name, or of a function written in place, gives it undefined as its this.
export const getReceiver = (
  scope: Scope,
  context: Context,
  called?: CalledMethod,
  call?: { node: ts.CallExpression; callee: FunctionNode },
): Receiver | undefined =>
  called === undefined
    ? call !== undefined &&
      (ts.isFunctionDeclaration(call.callee) || ts.isFunctionExpression(call.callee)) &&
      (ts.isIdentifier(skipCasts(call.node.expression)) ||
        ts.isFunctionExpression(skipCasts(call.node.expression)))
      ? { value: getUndefined(context), method: call.callee }
      : scope.receiver
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
  // A name that holds what a pattern took from an iterator stays one that the pattern binds.
  const shared =
    context.heap === undefined
      ? values
      : names.map((name, position) =>
          isTaken(values[position]) ? getTakenValue(identifier(name)) : identifier(name),
        );
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

// The state holds the parameters and vars of a function that runs once, which the functions that
// it makes read after it returns, and which a call inside an expression can't change.
const getKeptLocal = (callee: FunctionNode, context: Context) =>
  findNodes(callee, ts.isIdentifier).find((name) => {
    const symbol = getSymbol(name, context.checker);
    const declaration = getValueDeclaration(symbol, context);
    return (
      symbol !== undefined &&
      declaration !== undefined &&
      (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration)) &&
      context.onceLocals.has(symbol) &&
      ts.findAncestor(declaration, (ancestor) => ancestor === callee) !== undefined &&
      ts.findAncestor(name.parent, ts.isFunctionLike) !==
        ts.findAncestor(declaration.parent, ts.isFunctionLike)
    );
  });

const inlineCall = (
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
  called?: CalledMethod,
  node?: ts.CallExpression,
  receiver = getReceiver(scope, context, called, node && { node, callee }),
) => {
  if (callee.body === undefined) throw new TlaTypeScriptError("Give this a body", callee);
  const keptLocal = getKeptLocal(callee, context);
  if (keptLocal !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't call inside an expression a function that runs once and makes a function that reads its locals",
      keptLocal,
    );
  }
  const passedCallbacks = getParameters(callee).flatMap(
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
  // A parameter that the call doesn't pass, whose default is an arrow function that the body only
  // calls, calls that function as it would one that the call passes, as an expression can't make
  // the function object that the heap would hold.
  const body = callee.body;
  const defaultCallbacks =
    context.heap === undefined || argumentNodes.some(ts.isSpreadElement)
      ? []
      : getParameters(callee)
          .slice(argumentNodes.length)
          .flatMap((parameter): [ts.Symbol, FunctionNode][] => {
            const initializer = parameter.initializer;
            const symbol = getSymbol(parameter.name, context.checker);
            const isOnlyCalled = findNodes(body, ts.isIdentifier).every(
              (name) =>
                getSymbol(name, context.checker) !== symbol ||
                (ts.isCallExpression(name.parent) && name.parent.expression === name),
            );
            return initializer !== undefined &&
              ts.isArrowFunction(initializer) &&
              symbol !== undefined &&
              isOnlyCalled &&
              findNodes(
                initializer,
                (inner): inner is ts.ThisExpression => inner.kind === ts.SyntaxKind.ThisKeyword,
              ).length === 0
              ? [[symbol, initializer]]
              : [];
          });
  const callbacks = [...passedCallbacks, ...defaultCallbacks];
  const isValue = (position: number) =>
    !callbacks.some(
      (entry) => entry[0] === getSymbol(getParameters(callee)[position].name, context.checker),
    );
  const passed = translateArgumentValues(
    getParameters(callee),
    argumentNodes,
    (position) => position >= getParameters(callee).length || isValue(position),
    scope,
    context,
  );
  const values = shareArguments(passed.values, context);
  const reads = getArgumentsReads(callee, context);
  const lengths = getArgumentsLengths(callee, argumentNodes, context);
  // A call inside an expression holds its arguments object on a heap that only the call reads, so
  // the body may read only its length and elements, or only its length, which needs no object.
  if (
    lengths === undefined &&
    reads.length > 0 &&
    (passedCallbacks.length > 0 ||
      !reads.every((read) => isArgumentsRead(read, context)) ||
      context.heap === undefined)
  ) {
    throw new TlaTypeScriptError("Unsupported arguments object", reads[0]);
  }
  const made =
    lengths !== undefined
      ? { definitions: [], scope }
      : allocateArguments(
          callee,
          passed.list ?? tuple(values.shared),
          callee,
          { definitions: [], scope },
          context,
        );
  const bound = bindValues(
    getParameters(callee).filter((_, position) => isValue(position)),
    passed.isSpread ? values.shared.slice(0, -1) : values.shared,
    made.scope,
    context,
    passed.isSpread ? values.shared.at(-1) : undefined,
  );
  context.inProgress.add(callee);
  // A statement makes the objects and runs the calls only of its own expressions, so what the scope
  // holds for the body's nodes belongs to a call that this one runs inside, but for the arguments
  // object that this call makes, which the scope holds under the body.
  const isOutside = (entry: [ts.Node, Expression]) =>
    (entry[0] === body && made.definitions.length > 0) ||
    ts.findAncestor(entry[0], (ancestor) => ancestor === callee) === undefined;
  const value = translateBody(
    body,
    {
      ...bound.scope,
      allocated: new Map([...bound.scope.allocated].filter(isOutside)),
      results: new Map([...[...bound.scope.results].filter(isOutside), ...(lengths ?? [])]),
      functions: new Map([...bound.scope.functions, ...callbacks]),
      receiver,
      arrowReceivers: getArrowReceivers(callbacks, scope),
    },
    context,
  );
  context.inProgress.delete(callee);
  return render(
    values.evaluate(
      letIn(
        [...made.definitions, ...bound.definitions],
        stopOnDestructured(
          made.scope,
          bound.scope,
          forceHeap(scope, bound.scope, leaf(value), leaf(getUndefined(context)), context),
          context,
        ),
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

// Stops where a pattern that an expression binds destructures null or undefined, whose TypeError
// only a statement throws, as one does that runs a call that may throw inside try.
const stopOnDestructured = (before: Scope, after: Scope, rest: Formula, context: Context) => {
  const added = (after.destructured ?? []).slice((before.destructured ?? []).length);
  return added.length === 0
    ? rest
    : checkDestructured(
        added,
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't throw a pattern's TypeError inside an expression"),
          ]),
        ),
        rest,
        context,
      );
};

// A function argument to an operator parameter, as a LAMBDA or an operator's name.
// A local function that a name holds reads the names around it where the LAMBDA stands.
const translateOperatorArgument = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Expression => {
  const symbol = getSymbol(node, context.checker);
  // A top-level function passes as its operator, and a constant that holds one only as a value.
  const declaration = getTopLevelDeclaration(symbol, context);
  if (declaration !== undefined && getHelper(declaration, context) !== undefined) {
    return identifier(getDefinition(declaration, context).name);
  }
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding?.kind === "Identifier" && isOperatorParameter(binding.name, context)) return binding;
  // A name that holds a function as a value passes the function it holds where tla-ts knows it.
  const held =
    binding !== undefined
      ? symbol === undefined
        ? undefined
        : scope.functions.get(symbol)
      : ts.isIdentifier(node)
        ? getCallback(node, scope, context)
        : undefined;
  const callee = ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node : held;
  if (callee?.body === undefined) throw new TlaTypeScriptError("Pass a function here", node);
  if (context.inProgress.has(callee)) {
    throw new TlaTypeScriptError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  const parameters = declareParameters(getParameters(callee), context);
  context.inProgress.add(callee);
  const body = translateBody(callee.body, bindNames(scope, parameters), context);
  context.inProgress.delete(callee);
  return lambda(
    parameters.map((parameter) => parameter.name),
    body,
  );
};

// The name of a function's operator: the function's own, or the name of what holds it.
const getFunctionName = (node: HelperDeclaration | FunctionNode) => {
  const named = ts.isVariableDeclaration(node.parent) ? node.parent.name : node.name;
  return named !== undefined && ts.isIdentifier(named) ? named.text : "helper";
};

// A call to a top-level helper, or a reference to a top-level constant when node is undefined.
// A call to a helper that calls itself where a statement changed the state that it reads, which
// runs an operator that takes that state, so that each call reads the state as it is there. A
// parameter's default stands where the call passes undefined.
// A call of a function from inside itself, as a recursive operator that takes the state that the
// call reads and the values that it passes.
export const callStateOperator = (
  declaration: HelperDeclaration | undefined,
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
      const parameters = getParameters(callee).map((parameter) => {
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
        name: context.names.getFresh(`${getFunctionName(declaration ?? callee)}At`),
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
      // The operator inlines no call in progress outside it, but for the helpers whose definitions
      // compile there, which it calls by name as they call it.
      const outer = context.inProgress;
      context.inProgress = new Set([
        ...[...context.definitions.keys()].filter((declaration) => outer.has(declaration)),
        callee,
      ]);
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
    ...getParameters(callee).map((_, position) => values[position] ?? getUndefined(context)),
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
  // A function that reads its this runs inline, where the call gives it its this.
  const readsThis =
    helper !== undefined &&
    findNodes(
      helper,
      (inner): inner is ts.ThisExpression =>
        inner.kind === ts.SyntaxKind.ThisKeyword && getThisOwner(inner) === helper,
    ).length > 0;
  if (node !== undefined && helper !== undefined && readsThis) {
    if (context.inProgress.has(helper)) {
      return translateStateCall(declaration, helper, node, scope, context);
    }
    return inlineCall(helper, node.arguments, helperScope, context, undefined, node);
  }
  if (
    node !== undefined &&
    helper !== undefined &&
    (node.arguments.some(ts.isSpreadElement) ||
      !helper.parameters.every(
        (parameter) =>
          ts.isIdentifier(parameter.name) &&
          parameter.initializer === undefined &&
          parameter.dotDotDotToken === undefined,
      ))
  ) {
    if (context.inProgress.has(helper)) {
      return translateStateCall(declaration, helper, node, scope, context);
    }
    return inlineCall(helper, node.arguments, helperScope, context);
  }
  if (ts.isFunctionDeclaration(declaration) && declaration.asteriskToken !== undefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't call a generator inside an expression",
      node ?? declaration,
    );
  }
  const argumentNodes = node?.arguments ?? [];
  // A definition, compiled once, reads a let or a const as initialized, so a call that runs
  // before its declaration inlines the body, whose read throws.
  if (readsUninitialized([declaration, ...argumentNodes], scope, context)) {
    if (helper === undefined || node === undefined || context.inProgress.has(helper)) {
      return apply("Assert", [
        boolean(false),
        string("tla-ts can't call a function that reads a let or a const before it's declared"),
      ]);
    }
    return inlineCall(helper, argumentNodes, helperScope, context);
  }
  const definition = getDefinition(declaration, context);
  if (definition.readsState && isStateModified(scope, context)) {
    if (
      helper !== undefined &&
      node !== undefined &&
      (context.inProgress.has(helper) || isOperatorHelperCall(helper, node, scope, context))
    ) {
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
      const declaration = getValueDeclaration(getSymbol(name, context.checker), context);
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
      const declaration = getValueDeclaration(symbol, context);
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
    getParameters(callee).every(
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
// none of them. One that reads state, or the heap, takes the state as the call reads it too. A call
// passes the values of its parameters, as a call's arguments or an array method's elements give.
export const callLifted = (
  callee: FunctionNode,
  node: ts.Node,
  values: readonly Expression[],
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
      const parameters = declareParameters(getParameters(callee), context);
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
  return call(definition.name, [
    ...getParameters(callee).map((_, position) => values[position] ?? getUndefined(context)),
    ...capturedValues,
    ...variables.map((entry) => scope.bindings.get(entry[0]) ?? entry[1]),
  ]);
};

export const translateLiftedCall = (
  callee: FunctionNode,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  const values = shareArguments(
    node.arguments.map((argument) => translateExpression(argument, scope, context)),
    context,
  );
  return render(
    values.evaluate(
      leaf(callLifted(callee, node, values.shared, scope, context)),
      leaf(getUndefined(context)),
    ),
  );
};

// Whether a function can run as its operator, which takes the state and compiles once, rather
// than as a copy of its body: a function, not a method, that reads no this, super, new.target, or
// arguments object, and takes its parameters by name.
const isOperatorFunction = (candidate: FunctionNode, context: Context) =>
  (ts.isFunctionDeclaration(candidate) ||
    ts.isFunctionExpression(candidate) ||
    ts.isArrowFunction(candidate)) &&
  isPlain(candidate) &&
  getParameters(candidate).every(
    (parameter) =>
      ts.isIdentifier(parameter.name) &&
      parameter.dotDotDotToken === undefined &&
      (parameter.initializer === undefined || isLiteral(parameter.initializer)),
  ) &&
  findNodes(
    candidate,
    (inner): inner is ts.Node =>
      inner.kind === ts.SyntaxKind.ThisKeyword ||
      inner.kind === ts.SyntaxKind.SuperKeyword ||
      ts.isMetaProperty(inner),
  ).length === 0 &&
  getArgumentsReads(candidate, context).length === 0 &&
  getKeptLocal(candidate, context) === undefined &&
  !readsLoopBinding(candidate, context);

// Whether a function reads a let or a const that a loop's head declares outside it, of which each
// iteration has its own, which the function's operator can't tell.
const readsLoopBinding = (callee: FunctionNode, context: Context) =>
  findNodes(callee, ts.isIdentifier).some((name) => {
    const declaration = getValueDeclaration(getSymbol(name, context.checker), context);
    const list = declaration?.parent;
    return (
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      list !== undefined &&
      ts.isVariableDeclarationList(list) &&
      (list.flags & ts.NodeFlags.BlockScoped) !== 0 &&
      ts.isIterationStatement(list.parent, false) &&
      ts.findAncestor(declaration, (ancestor) => ancestor === callee) === undefined
    );
  });

// Whether a call may run a function as the function's operator: one where no function names a
// let or a const of the script that's still uninitialized, whose read would throw, and nothing
// catches the operator's throws, that spreads no arguments, and that passes no function that the
// body would run as it is, but one that the operator's calls through the value it takes run alike.
const isOperatorCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  isPassed: (callback: FunctionNode) => boolean,
) =>
  [...scope.uninitialized].every((symbol) => !context.functionNames.has(symbol)) &&
  !scope.isCatching &&
  !node.arguments.some(ts.isSpreadElement) &&
  node.arguments.every((argument) => {
    const callback = getCallback(argument, scope, context);
    return callback === undefined || isPassed(callback);
  });

// Whether a call through a value runs one of the functions that the value may hold as the
// function's operator, rather than as a copy of its body, which would copy the bodies of every
// function that each call through a value inside it may run in turn.
const isOperatorCandidate = (
  candidate: FunctionNode,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => isOperatorFunction(candidate, context) && isOperatorCall(node, scope, context, () => false);

// Whether a helper that a function's operator calls by name runs as its own operator too, rather
// than as a copy of its body, so that the functions that the helper calls by name don't copy their
// bodies into the operator of each function that calls them. The functions that the call passes
// run alike through the values that the helper's operator takes, as calls through values run them.
const isOperatorHelperCall = (
  helper: FunctionNode,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) =>
  [...context.inProgress].some((inner) => context.stateCalls.has(inner)) &&
  isOperatorFunction(helper, context) &&
  isOperatorCall(
    node,
    scope,
    context,
    (callback) =>
      !isHeapFunction(callback, context) &&
      getCandidateValue(callback, context) !== undefined &&
      (context.functionCandidates.get(callback.getSourceFile())?.includes(callback) ?? false) &&
      isOperatorFunction(callback, context),
  );

// A call through a value of whichever of a set of functions the value holds, each of which runs
// as its operator. One operator for the set and the count of arguments branches between them, so
// that each call is one call of it, whichever functions the set holds.
const translateDispatch = (
  operators: readonly FunctionNode[],
  value: Expression,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  otherwise: Expression,
) => {
  const variables = [...context.variables];
  const key = [
    node.arguments.length,
    ...operators.map((candidate) => `${candidate.getSourceFile().fileName}:${candidate.pos}`),
  ].join(",");
  const dispatch =
    context.dispatchCalls.get(key) ??
    (() => {
      const valueName = context.names.getFresh("function");
      const argumentNames = node.arguments.map(() => context.names.getFresh("argument"));
      const states = variables.map((entry) => ({
        symbol: entry[0],
        name: context.names.getFresh(entry[0].name),
      }));
      const called = context.names.getFresh("Called");
      context.output.push(
        defineAt(
          node,
          called,
          [],
          set(operators.map((candidate) => getCandidateValue(candidate, context) ?? value)),
        ),
      );
      const made: DispatchCall = {
        called,
        name: context.names.getFresh("Call"),
        parameters: [valueName, ...argumentNames, ...states.map((state) => state.name)].map(
          (name) => ({ name, arity: 0 }),
        ),
        readsState: false,
      };
      context.dispatchCalls.set(key, made);
      const inner = bindNames(createStateScope(context), states);
      const calls = operators.map((candidate) =>
        callStateOperator(
          undefined,
          candidate,
          argumentNames.map((name) => identifier(name)),
          inner,
          context,
        ),
      );
      const body = operators
        .slice(0, -1)
        .reduceRight<Expression>(
          (rest, candidate, position) =>
            ifExpression(
              apply("=", [identifier(valueName), getCandidateValue(candidate, context) ?? value]),
              calls[position],
              rest,
            ),
          calls[calls.length - 1],
        );
      context.output.push(defineAt(node, made.name, made.parameters, body));
      return made;
    })();
  const values = shareArguments(
    node.arguments.map((argument) => translateExpression(argument, scope, context)),
    context,
  );
  return ifExpression(
    apply("\\in", [value, identifier(dispatch.called)]),
    render(
      values.evaluate(
        leaf(
          call(dispatch.name, [
            value,
            ...values.shared,
            ...variables.map((entry) => scope.bindings.get(entry[0]) ?? entry[1]),
          ]),
        ),
        leaf(getUndefined(context)),
      ),
    ),
    otherwise,
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
  // of its file that it may be. One that reads its this needs the call's receiver, which only a
  // method that super reads has, as the this of the method that reads it.
  const superReceiver = isSuperAccess(node.expression) ? node.expression.expression : undefined;
  const candidates =
    callee === undefined && context.heap !== undefined
      ? getFunctionCandidates(node.expression, context).filter(
          (candidate) =>
            isPlain(candidate) &&
            (!context.inProgress.has(candidate) ||
              isOperatorCandidate(candidate, node, scope, context)) &&
            (ts.isArrowFunction(candidate) ||
              (superReceiver !== undefined && ts.isMethodDeclaration(candidate)) ||
              findNodes(
                candidate,
                (inner): inner is ts.ThisExpression => inner.kind === ts.SyntaxKind.ThisKeyword,
              ).length === 0),
        )
      : [];
  const keyed =
    callee === undefined ? translateKeyedPrimitiveCall(node, scope, context) : undefined;
  if (keyed !== undefined) return keyed;
  // A function that bind gives, which runs its target with the bound receiver and arguments first.
  const binding = callee === undefined ? getBound(skipCasts(node.expression), context) : undefined;
  if (
    binding !== undefined &&
    binding.isSteady &&
    binding.method === undefined &&
    !context.inProgress.has(binding.target)
  ) {
    const target = binding.target;
    return inlineCall(
      target,
      [...binding.arguments, ...node.arguments],
      scope,
      context,
      undefined,
      undefined,
      ts.isArrowFunction(target)
        ? scope.receiver
        : {
            value:
              binding.receiver === undefined
                ? getUndefined(context)
                : translateExpression(binding.receiver, scope, context),
            method: target,
          },
    );
  }
  const stored = callee === undefined ? getStoredCall(node, context) : undefined;
  if (callee === undefined && (candidates.length > 0 || stored !== undefined)) {
    // A built-in that gives a value without a receiver, such as Object.prototype.toString.
    // A function that only returns a literal, as a getter that a descriptor gives may, gives it.
    const getUnknown = (value: Expression) =>
      node.arguments.every(isInertValue)
        ? ifExpression(
            useJavaScript("IsConstantFunction", [value], context),
            useJavaScript("ConstantResult", [value], context),
            ts.isIdentifier(skipCasts(node.expression))
              ? ifExpression(
                  useJavaScript("HasReceiverlessValue", [value], context),
                  useJavaScript("ReceiverlessValue", [value], context),
                  stopUnknownCall(value, context),
                )
              : stopUnknownCall(value, context),
          )
        : stopUnknownCall(value, context);
    const valued = candidates.filter(
      (candidate) => getCandidateValue(candidate, context) !== undefined,
    );
    const operators = valued.filter((candidate) =>
      isOperatorCandidate(candidate, node, scope, context),
    );
    return share(
      translateExpression(node.expression, scope, context),
      "function",
      context,
      (value) => {
        const inlined = valued
          .filter((candidate) => !operators.includes(candidate))
          .reduceRight<Expression>(
            (otherwise, candidate) =>
              ifExpression(
                apply("=", [value, getCandidateValue(candidate, context) ?? value]),
                inlineCall(
                  candidate,
                  node.arguments,
                  scope,
                  context,
                  superReceiver !== undefined && ts.isMethodDeclaration(candidate)
                    ? { method: candidate, receiver: superReceiver, key: "" }
                    : undefined,
                ),
                otherwise,
              ),
            stored === undefined
              ? getUnknown(value)
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
          );
        return operators.length === 0
          ? inlined
          : translateDispatch(operators, value, node, scope, context, inlined);
      },
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
  return inlineCall(callee, node.arguments, scope, context, called, node);
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
            const found = useJavaScript("GetterOf", [sharedHeap, sharedObject, sharedKey], context);
            const received = {
              ...scope,
              receiver: { value: receiver ?? sharedObject, method: getter },
            };
            context.inProgress.add(getter);
            const value = translateBody(
              getter.body,
              isClosure(getter, context)
                ? enterScope(getter, found, sharedHeap, received, context)
                : received,
              context,
            );
            context.inProgress.delete(getter);
            return ifExpression(
              junction("And", [
                useJavaScript("IsRef", [sharedObject], context),
                apply("=", [useJavaScript("CodeOf", [sharedHeap, found], context), candidate]),
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
export const isAssigning = (node: ts.Node): boolean =>
  (ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
  ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
    (node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken)) ||
  (!ts.isFunctionLike(node) &&
    (ts.forEachChild(node, (child) => isAssigning(child) || undefined) ?? false));

// A body of loops and assignments runs as statements that change only its locals, as does one
// that makes objects, which only statements allocate. No one reaches those objects once it
// returns, where it returns values that hold none of them.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): Expression => {
  const owner = body.parent;
  throwOnUnentered(owner, scope, context);
  if (!ts.isBlock(body)) return translateExpression(body, scope, context);
  // The objects that the body makes, as a literal or a description does, apart from functions.
  const made = body.statements
    .flatMap((statement) => getAllocated(statement, context))
    .filter(
      (node) => !ts.isFunctionLike(node) && !ts.isClassLike(node) && !scope.allocated.has(node),
    );
  const literal = made.find(ts.isObjectLiteralExpression);
  const isMaking = made.length > 0 && ts.isFunctionLike(owner) && isValueReturn(owner, context);
  // An operator that converts an operand, which may run its valueOf or toString, runs as a
  // statement does.
  const isConverting =
    findNodes(
      body,
      (node): node is ts.Node =>
        getConversion(node, context) !== undefined &&
        ts.findAncestor(node.parent, ts.isFunctionLike) === owner,
    ).length > 0;
  const isPure = body.statements.every(isPureStatement) && !isConverting;
  if (literal !== undefined && isPure && !isMaking) {
    throw new TlaTypeScriptError(
      "tla-ts can't make objects in a function that an expression calls and that may return them",
      literal,
    );
  }
  return render(
    isPure && !isMaking
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
        // A name forces the value that it binds, rather than a copy of it.
        const symbol = ts.isIdentifier(declaration.name)
          ? getSymbol(declaration.name, context.checker)
          : undefined;
        return {
          definitions: [...current.definitions, ...added.definitions],
          scope: added.scope,
          values: [...current.values, (symbol && added.scope.bindings.get(symbol)) ?? value],
        };
      },
      { definitions: [], scope, values: [] },
    );
    // Each value runs though nothing reads it, so that a getter it reads stops the check.
    const forced = context.heap === undefined ? [] : bound.values;
    const rest = stopOnDestructured(
      scope,
      bound.scope,
      forceHeap(
        scope,
        bound.scope,
        continueWith(bound.scope),
        leaf(getUndefined(context)),
        context,
      ),
      context,
    );
    return letIn(
      bound.definitions,
      forced.length === 0
        ? rest
        : ifThenElse(apply("=", [tuple(forced), tuple(forced)]), rest, leaf(getUndefined(context))),
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
  // A script reports what it doesn't catch as Node does.
  const message =
    getUncaughtText(statement, scope, context) ??
    (ts.isNewExpression(thrown) && thrown.arguments?.[0] !== undefined
      ? translateExpression(thrown.arguments[0], scope, context)
      : string(thrown.getText()));
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
  // A guard of a global that nothing declares runs only one branch.
  const truth = getStaticTruth(statement.expression, context);
  if (truth === true) return translateBranch(statement.thenStatement);
  if (truth === false) {
    return statement.elseStatement === undefined
      ? translateRest()
      : translateBranch(statement.elseStatement);
  }
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

// A statement that always leaves its case, as a break, a continue, a return, or a throw does, or a
// block that ends in one.
const isLeaving = (statement: ts.Statement): boolean => {
  if (ts.isBlock(statement)) {
    const last = statement.statements.at(-1);
    return last !== undefined && isLeaving(last);
  }
  return (
    ts.isBreakStatement(statement) ||
    ts.isContinueStatement(statement) ||
    ts.isReturnStatement(statement) ||
    ts.isThrowStatement(statement)
  );
};

// A switch as nested IFs. Each clause but the last must end in break, continue, return, or throw.
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
    const isLast = start + group.length === clauses.length;
    if (body.length > 0 && !(last !== undefined && isLeaving(last)) && !isLast) {
      throw new TlaTypeScriptError(
        "End each case with break, continue, return, or throw",
        lastClause,
      );
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
      // TLC can't compare values of two kinds, such as a number with a string, with =.
      return context.hasSpecialNumbers && mayBeNumber(statement.expression, context)
        ? useJavaScript("StrictEquals", [subject, value], context)
        : isComparable(statement.expression, clause.expression, context)
          ? apply("=", [subject, value])
          : useJavaScript("SameValue", [subject, value], context);
    });
    return ifThenElse(
      conditions.length === 1 ? conditions[0] : junction("Or", conditions),
      formula,
      translateFrom(start + group.length),
    );
  };
  return translateFrom(0);
};
