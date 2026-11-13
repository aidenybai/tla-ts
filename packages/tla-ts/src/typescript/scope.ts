import ts from "@typescript/typescript6";
import {
  type HeapFunction,
  type Context,
  type FunctionNode,
  getElement,
  getSymbol,
  findNodes,
  getUndefined,
  share,
  skipCasts,
} from "./context";
import { getWritten } from "./actions";
import { TlaTypeScriptError } from "../errors";
import { isIteratedPattern, isSteppedPattern, isTaken, isUntypedPattern } from "./iterators";
import type { Expression, OperatorDefinition } from "../ast";
import { translateArrayIteration, translatePatternIteration } from "./collections";
import { translateElements, translateExpression } from "./expressions";
import {
  apply,
  boolean,
  define,
  identifier,
  ifExpression,
  number,
  set,
  string,
  tuple,
} from "./tla";
import { getHeap } from "./heap";
import { translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { getField, getPathStep, getPropertyKey, isHeapPattern, isSequenceType } from "./types";

export interface Scope {
  // The TLA+ expression for each variable, parameter, and local in scope.
  bindings: Map<ts.Symbol, Expression>;
  // The parameter that names the state before a step, in action properties and constraints.
  previous: ts.Symbol | undefined;
  functions: Map<ts.Symbol, FunctionNode>;
  isCatching: boolean;
  uninitialized: ReadonlySet<ts.Symbol>;
  allocated: ReadonlyMap<ts.Node, Expression>;
  // The results of the calls that only statements can run, and of assignments inside
  // expressions, which ran before the statement that holds them.
  results: ReadonlyMap<ts.Expression, Expression>;
  // The links of optional chains whose base tla-ts found isn't null or undefined.
  checked?: ReadonlySet<ts.Expression>;
  // The object that this names in the method that a call through it inlines.
  receiver?: Receiver;
  // The object that this names in each arrow function that a call takes, from where it was written.
  arrowReceivers?: ReadonlyMap<ts.Node, Receiver>;
  // The values of an object pattern's elements whose getters ran before it binds, which binding
  // the pattern takes, once each.
  read?: ReadonlyMap<ts.BindingElement, Expression>;
  // The values that patterns destructure, which throw a TypeError where they are null or undefined
  // though nothing reads what the patterns bind, and which the next statement checks.
  destructured?: readonly Destructured[];
  // The statement that runs where the object it first uses has the private name it uses, which
  // translating it again doesn't check again.
  brandChecked?: ts.Statement;
  // The environment of the call of each async function whose body runs, which tells the closures
  // that read its locals which call made them.
  activations?: ReadonlyMap<ts.Node, Expression>;
  // The function that a call entered, whose environment or factory call binds the locals it reads.
  entered?: FunctionNode;
}

export interface Destructured {
  pattern: ts.BindingPattern;
  value: Expression;
}

export interface Receiver {
  value: Expression;
  method:
    | ts.MethodDeclaration
    | ts.ConstructorDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration
    | ts.ClassStaticBlockDeclaration
    | ts.PropertyDeclaration
    | HeapFunction;
  // The newTarget of a construction, which new.target reads in the constructor.
  newTarget?: Expression;
}

// The function, static block, or field whose this a node's this names.
export const getThisOwner = (node: ts.Node) =>
  ts.findAncestor(
    node.parent,
    (ancestor) =>
      (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
      ts.isClassStaticBlockDeclaration(ancestor) ||
      ts.isPropertyDeclaration(ancestor),
  );

// The receivers of the arrow functions that a call takes, with the scope's receiver for those
// written in its method.
export const getArrowReceivers = (
  callbacks: readonly [ts.Symbol, FunctionNode][],
  scope: Scope,
): ReadonlyMap<ts.Node, Receiver> => {
  const receiver = scope.receiver;
  return new Map([
    ...(scope.arrowReceivers ?? []),
    ...callbacks.flatMap(([, callback]): [ts.Node, Receiver][] =>
      receiver !== undefined &&
      ts.isArrowFunction(callback) &&
      getThisOwner(callback) === receiver.method
        ? [[callback, receiver]]
        : [],
    ),
  ]);
};

export interface Bound {
  definitions: OperatorDefinition[];
  scope: Scope;
}

export interface Parameter {
  node: ts.ParameterDeclaration;
  name: string;
  symbol: ts.Symbol | undefined;
}

interface Named {
  name: string | Expression;
  symbol: ts.Symbol | undefined;
}

export const createStateScope = (context: Context): Scope => ({
  bindings: new Map(context.variables),
  previous: undefined,
  functions: new Map(),
  isCatching: false,
  uninitialized: new Set(),
  allocated: new Map(),
  results: new Map(),
});

export const bindNames = (scope: Scope, named: Named[]): Scope => ({
  ...scope,
  bindings: new Map([
    ...scope.bindings,
    ...named.flatMap((item): [ts.Symbol, Expression][] =>
      item.symbol === undefined
        ? []
        : [[item.symbol, typeof item.name === "string" ? identifier(item.name) : item.name]],
    ),
  ]),
});

export const declareParameter = (
  parameter: ts.ParameterDeclaration,
  context: Context,
): Parameter => {
  if (
    !ts.isIdentifier(parameter.name) ||
    parameter.initializer !== undefined ||
    parameter.dotDotDotToken !== undefined
  ) {
    throw new TlaTypeScriptError(`Use a plain parameter here: ${parameter.getText()}`, parameter);
  }
  return {
    node: parameter,
    name: context.names.getFresh(parameter.name.text),
    symbol: getSymbol(parameter.name, context.checker),
  };
};

export const declareParameters = (
  parameters: readonly ts.ParameterDeclaration[],
  context: Context,
) => parameters.map((parameter) => declareParameter(parameter, context));

export const rejectBeforeDeclaration = (node: ts.Identifier, scope: Scope, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const declaration = symbol?.valueDeclaration;
  if (
    !scope.isCatching ||
    symbol === undefined ||
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    !ts.isVariableDeclarationList(declaration.parent) ||
    (declaration.parent.flags & ts.NodeFlags.BlockScoped) === 0
  ) {
    return;
  }
  const isUninitialized = ts.isSourceFile(declaration.parent.parent.parent)
    ? scope.uninitialized.has(symbol)
    : node.getStart() < declaration.getStart();
  if (isUninitialized) {
    throw new TlaTypeScriptError(`Inside try, use ${node.text} after its declaration`, node);
  }
};

export const initialize = (
  scope: Scope,
  declaration: ts.VariableDeclaration,
  context: Context,
): Scope => {
  const symbol = getSymbol(declaration.name, context.checker);
  return symbol === undefined || !scope.uninitialized.has(symbol)
    ? scope
    : {
        ...scope,
        uninitialized: new Set([...scope.uninitialized].filter((other) => other !== symbol)),
      };
};

// A nested pattern's default that calls a function where it's written, which assigns a variable
// outside it, which only a statement can do. The pattern checks that its value isn't null or
// undefined, which evaluates the default where it runs.
const isAssigningCall = (initializer: ts.Expression, context: Context) => {
  const call = skipCasts(initializer);
  const callee = ts.isCallExpression(call) ? skipCasts(call.expression) : undefined;
  return (
    ts.isBindingElement(initializer.parent) &&
    !ts.isIdentifier(initializer.parent.name) &&
    callee !== undefined &&
    (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee)) &&
    findNodes(callee.body, (inner): inner is ts.Expression => {
      const written = ts.isCallExpression(inner) ? undefined : getWritten(inner);
      const target = written === undefined ? undefined : skipCasts(written);
      const declaration =
        target !== undefined && ts.isIdentifier(target)
          ? getSymbol(target, context.checker)?.valueDeclaration
          : undefined;
      return (
        declaration !== undefined && (declaration.pos < callee.pos || declaration.end > callee.end)
      );
    }).length > 0
  );
};

export const getDefaulted = (
  part: Expression,
  initializer: ts.Expression | undefined,
  scope: Scope,
  context: Context,
) =>
  initializer === undefined
    ? part
    : share(part, "element", context, (shared) =>
        ifExpression(
          apply("=", [shared, getUndefined(context)]),
          !scope.results.has(skipCasts(initializer)) && isAssigningCall(initializer, context)
            ? apply("Assert", [
                boolean(false),
                string("tla-ts can't run a default that assigns where a nested pattern takes it"),
              ])
            : translateExpression(initializer, scope, context),
          shared,
        ),
      );

export const getOptionalField = (value: Expression, key: string, context: Context) => {
  const step = getPathStep(key);
  return ifExpression(
    apply("\\in", [
      step.kind === "Field" ? string(step.name) : step.args[0],
      apply("DOMAIN", [value]),
    ]),
    getField(value, key),
    getUndefined(context),
  );
};

// Binds the names in a destructuring pattern to parts of a value, without LET definitions.
export const bindPatternInline = (
  pattern: ts.BindingName,
  value: Expression,
  scope: Scope,
  context: Context,
): Scope => {
  if (ts.isIdentifier(pattern)) {
    return bindNames(scope, [{ name: value, symbol: getSymbol(pattern, context.checker) }]);
  }
  if (
    ts.isArrayBindingPattern(pattern) &&
    (isIteratedPattern(pattern, context) || isSteppedPattern(pattern, context)) &&
    !isTaken(value)
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't destructure this object through its iterator",
      pattern,
    );
  }
  // A nested pattern that destructures null or undefined throws before the getters of the elements
  // after it run, which ran before the pattern binds.
  if (ts.isBindingElement(pattern.parent) && (scope.read?.size ?? 0) > 0) {
    throw new TlaTypeScriptError(
      "tla-ts can't destructure a nested pattern before the getters that follow it",
      pattern,
    );
  }
  const destructuring: Scope = {
    ...scope,
    destructured: [...(scope.destructured ?? []), { pattern, value }],
  };
  if (ts.isArrayBindingPattern(pattern) && isUntypedPattern(pattern, context) && !isTaken(value)) {
    throw new TlaTypeScriptError("Give this pattern's value an array type", pattern);
  }
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(pattern));
  const heapSymbol = context.heap;
  // An array pattern runs the iterator of an array, which may be one that a script replaced.
  const isIterated =
    ts.isArrayBindingPattern(pattern) &&
    !isTaken(value) &&
    !(context.checker.getTypeAtLocation(pattern).flags & ts.TypeFlags.StringLike);
  const heap = heapSymbol === undefined ? undefined : getHeap(destructuring, pattern, context);
  const iterated =
    isIterated && heap !== undefined
      ? translatePatternIteration(value, heap, pattern, type, context)
      : value;
  const iterating =
    isIterated && heapSymbol !== undefined && heap !== undefined
      ? {
          ...destructuring,
          bindings: new Map([
            ...destructuring.bindings,
            [heapSymbol, translateArrayIteration(heap, heap, pattern, context)],
          ]),
        }
      : destructuring;
  const bound = pattern.elements.reduce((current, element, position) => {
    if (ts.isOmittedExpression(element)) return current;
    const initializer = element.initializer;
    const withDefault = (part: Expression) => getDefaulted(part, initializer, current, context);
    if (ts.isArrayBindingPattern(pattern)) {
      if (element.dotDotDotToken === undefined) {
        return bindPatternInline(
          element.name,
          withDefault(getElement(iterated, number(position + 1), context)),
          current,
          context,
        );
      }
      if (context.checker.getTypeAtLocation(pattern).flags & ts.TypeFlags.StringLike) {
        throw new TlaTypeScriptError("Spread a string with split('') instead", element);
      }
      const rest = apply("SubSeq", [iterated, number(position + 1), apply("Len", [iterated])]);
      if (!context.heapCollections.has(element) || heapSymbol === undefined) {
        return bindPatternInline(element.name, rest, current, context);
      }
      const heap = useJavaScript(
        "Allocate",
        [
          getHeap(current, element, context),
          useJavaScript(
            "ArrayObject",
            [translateBuiltInValue("Array.prototype", element, context), rest],
            context,
          ),
        ],
        context,
      );
      return bindNames(
        { ...current, bindings: new Map([...current.bindings, [heapSymbol, heap]]) },
        [
          {
            name: useJavaScript("Allocated", [heap], context),
            symbol: getSymbol(element.name, context.checker),
          },
        ],
      );
    }
    if (element.dotDotDotToken !== undefined) {
      // A new object with the properties that the other elements don't name.
      const excluded = pattern.elements.flatMap((other) => {
        if (other === element) return [];
        const otherName = other.propertyName ?? other.name;
        const otherKey =
          ts.isIdentifier(otherName) ||
          ts.isStringLiteral(otherName) ||
          ts.isNumericLiteral(otherName)
            ? getPropertyKey(otherName)
            : undefined;
        if (otherKey === undefined) {
          throw new TlaTypeScriptError(
            "Object rest elements need the other keys to be names",
            other,
          );
        }
        return [string(otherKey)];
      });
      if (heapSymbol === undefined || !isHeapPattern(type, pattern, context)) {
        throw new TlaTypeScriptError("Object rest elements need an object in a script", element);
      }
      const heap = getHeap(current, element, context);
      const allocated = useJavaScript(
        "Allocate",
        [
          heap,
          useJavaScript(
            "RestObject",
            [heap, value, set(excluded), current.read?.get(element) ?? tuple([])],
            context,
          ),
        ],
        context,
      );
      return bindNames(
        {
          ...current,
          bindings: new Map([...current.bindings, [heapSymbol, allocated]]),
          read: new Map([...(current.read ?? [])].filter((entry) => entry[0] !== element)),
        },
        [
          {
            name: useJavaScript("Allocated", [allocated], context),
            symbol: getSymbol(element.name, context.checker),
          },
        ],
      );
    }
    const name = element.propertyName ?? element.name;
    const key =
      ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)
        ? undefined
        : getPropertyKey(name);
    if (key === undefined) throw new TlaTypeScriptError("Unsupported key", element);
    if (isHeapPattern(type, pattern, context)) {
      const got = current.read?.get(element);
      const part =
        got ??
        useJavaScript("Get", [getHeap(current, element, context), value, string(key)], context);
      const taken =
        got === undefined
          ? current
          : {
              ...current,
              read: new Map([...(current.read ?? [])].filter((entry) => entry[0] !== element)),
            };
      return bindPatternInline(element.name, withDefault(part), taken, context);
    }
    if (isSequenceType(context.checker.getTypeAtLocation(pattern), context.checker)) {
      if (key !== "length" && !/^(0|[1-9][0-9]*)$/.test(key)) {
        throw new TlaTypeScriptError(`Unsupported array property: ${key}`, element);
      }
      return bindPatternInline(
        element.name,
        key === "length"
          ? apply("Len", [value])
          : withDefault(getElement(value, number(Number(key) + 1), context)),
        current,
        context,
      );
    }
    // A record may lack the field that a default or a nested pattern reads, which then reads
    // undefined. Where objects are in the heap, a value whose type isn't an object's, such as a
    // caught one, may still be an object, which the pattern reads as a member read does.
    const field =
      initializer === undefined && ts.isIdentifier(element.name)
        ? getField(value, key)
        : getOptionalField(value, key, context);
    const part =
      heapSymbol === undefined
        ? field
        : ifExpression(
            useJavaScript("IsRef", [value], context),
            useJavaScript("Get", [getHeap(current, element, context), value, string(key)], context),
            field,
          );
    return bindPatternInline(element.name, withDefault(part), current, context);
  }, iterating);
  if (heapSymbol === undefined) return bound;
  const isHeapObject = ts.isObjectBindingPattern(pattern) && isHeapPattern(type, pattern, context);
  // A nested pattern may destructure an element that an array lacks, which throws a TypeError
  // that TLC would find only where something reads what the pattern binds.
  if (!isHeapObject && !ts.isBindingElement(pattern.parent)) return bound;
  const keys = (isHeapObject ? pattern.elements : []).flatMap((element) => {
    if (element.dotDotDotToken !== undefined || scope.read?.has(element)) return [];
    const name = element.propertyName ?? element.name;
    const key =
      ts.isIdentifier(name) || ts.isStringLiteral(name) ? getPropertyKey(name) : undefined;
    return key === undefined ? [] : [string(key)];
  });
  const read = useJavaScript(
    "ReadKeys",
    [getHeap(bound, pattern, context), value, set(keys)],
    context,
  );
  return { ...bound, bindings: new Map([...bound.bindings, [heapSymbol, read]]) };
};

// Binds the names in a declaration to LET definitions.
export const bindPattern = (
  pattern: ts.BindingName,
  value: Expression,
  scope: Scope,
  context: Context,
): Bound => {
  if (isTaken(value)) {
    return { definitions: [], scope: bindPatternInline(pattern, value, scope, context) };
  }
  const name = context.names.getFresh(ts.isIdentifier(pattern) ? pattern.text : "value");
  return {
    definitions: [define(name, [], value)],
    scope: bindPatternInline(pattern, identifier(name), scope, context),
  };
};

// Binds parameters to argument values with LET definitions, as when inlining a call.
// The values of the arguments that a call passes, at the positions that pass values. Where the call
// spreads arguments from a rest parameter's position on, the last value is the sequence that the
// rest parameter takes.
export const translateArgumentValues = (
  parameters: readonly ts.ParameterDeclaration[],
  argumentNodes: readonly ts.Expression[],
  isPassed: (position: number) => boolean,
  scope: Scope,
  context: Context,
) => {
  const rest = parameters.findIndex((parameter) => parameter.dotDotDotToken !== undefined);
  const spread = argumentNodes.findIndex(ts.isSpreadElement);
  if (spread !== -1 && (rest === -1 || spread < rest)) {
    throw new TlaTypeScriptError(
      "tla-ts can't spread arguments into the parameters before a rest parameter",
      argumentNodes[spread],
    );
  }
  const passed = (spread === -1 ? argumentNodes : argumentNodes.slice(0, rest))
    .filter((_, position) => isPassed(position))
    .map((argument) => translateExpression(argument, scope, context));
  return spread === -1
    ? { values: passed, isSpread: false }
    : {
        values: [...passed, translateElements(argumentNodes.slice(rest), scope, context)],
        isSpread: true,
      };
};

export const bindValues = (
  parameters: readonly ts.ParameterDeclaration[],
  values: Expression[],
  scope: Scope,
  context: Context,
  restValue?: Expression,
) =>
  parameters.reduce<Bound>(
    (current, parameter, position) => {
      // A rest parameter takes the values that the parameters before it don't, or the sequence
      // that a call spreads into it.
      const value =
        parameter.dotDotDotToken === undefined
          ? values.at(position)
          : (restValue ?? tuple(values.slice(position)));
      const initializer = parameter.initializer;
      const getDefault = () =>
        initializer === undefined
          ? getUndefined(context)
          : translateExpression(initializer, current.scope, context);
      const bound = bindPattern(
        parameter.name,
        value === undefined
          ? getDefault()
          : initializer === undefined
            ? value
            : share(value, "argument", context, (shared) =>
                ifExpression(apply("=", [shared, getUndefined(context)]), getDefault(), shared),
              ),
        current.scope,
        context,
      );
      return { definitions: [...current.definitions, ...bound.definitions], scope: bound.scope };
    },
    { definitions: [], scope },
  );
