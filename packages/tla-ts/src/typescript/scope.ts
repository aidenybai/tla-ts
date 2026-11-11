import ts from "@typescript/typescript6";
import {
  type HeapFunction,
  type Context,
  type FunctionNode,
  getElement,
  getSymbol,
  getUndefined,
  share,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { isIteratedPattern, isTaken, isUntypedPattern } from "./iterators";
import type { Expression, OperatorDefinition } from "../ast";
import { translateExpression } from "./expressions";
import { apply, define, identifier, ifExpression, number, set, string, tuple } from "./tla";
import { getHeap } from "./heap";
import { translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { getField, getPathStep, getPropertyKey, isHeapType, isSequenceType } from "./types";

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
  // The object that this names in the method that a call through it inlines.
  receiver?: Receiver;
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
}

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
          translateExpression(initializer, scope, context),
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
  if (ts.isArrayBindingPattern(pattern) && isIteratedPattern(pattern, context) && !isTaken(value)) {
    throw new TlaTypeScriptError(
      "tla-ts can't destructure this object through its iterator",
      pattern,
    );
  }
  if (ts.isArrayBindingPattern(pattern) && isUntypedPattern(pattern, context) && !isTaken(value)) {
    throw new TlaTypeScriptError("Give this pattern's value an array type", pattern);
  }
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(pattern));
  const heapSymbol = context.heap;
  const bound = pattern.elements.reduce((current, element, position) => {
    if (ts.isOmittedExpression(element)) return current;
    const initializer = element.initializer;
    const withDefault = (part: Expression) => getDefaulted(part, initializer, current, context);
    if (ts.isArrayBindingPattern(pattern)) {
      if (element.dotDotDotToken === undefined) {
        return bindPatternInline(
          element.name,
          withDefault(getElement(value, number(position + 1), context)),
          current,
          context,
        );
      }
      if (context.checker.getTypeAtLocation(pattern).flags & ts.TypeFlags.StringLike) {
        throw new TlaTypeScriptError("Spread a string with split('') instead", element);
      }
      const rest = apply("SubSeq", [value, number(position + 1), apply("Len", [value])]);
      if (!context.heapArrays.has(element) || heapSymbol === undefined) {
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
      if (heapSymbol === undefined || !isHeapType(type, pattern, context)) {
        throw new TlaTypeScriptError("Object rest elements need an object in a script", element);
      }
      const heap = getHeap(current, element, context);
      const allocated = useJavaScript(
        "Allocate",
        [heap, useJavaScript("RestObject", [heap, value, set(excluded)], context)],
        context,
      );
      return bindNames(
        { ...current, bindings: new Map([...current.bindings, [heapSymbol, allocated]]) },
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
    if (isHeapType(type, pattern, context)) {
      const part = useJavaScript(
        "Get",
        [getHeap(current, element, context), value, string(key)],
        context,
      );
      return bindPatternInline(element.name, withDefault(part), current, context);
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
    const part =
      initializer === undefined ? getField(value, key) : getOptionalField(value, key, context);
    return bindPatternInline(element.name, withDefault(part), current, context);
  }, scope);
  if (heapSymbol === undefined) return bound;
  const isHeapObject = ts.isObjectBindingPattern(pattern) && isHeapType(type, pattern, context);
  // A nested pattern may destructure an element that an array lacks, which throws a TypeError
  // that TLC would find only where something reads what the pattern binds.
  if (!isHeapObject && !ts.isBindingElement(pattern.parent)) return bound;
  const keys = (isHeapObject ? pattern.elements : []).flatMap((element) => {
    if (element.dotDotDotToken !== undefined) return [];
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
export const bindValues = (
  parameters: readonly ts.ParameterDeclaration[],
  values: Expression[],
  scope: Scope,
  context: Context,
) =>
  parameters.reduce<Bound>(
    (current, parameter, position) => {
      // A rest parameter takes the values that the parameters before it don't.
      const value =
        parameter.dotDotDotToken === undefined
          ? values.at(position)
          : tuple(values.slice(position));
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
