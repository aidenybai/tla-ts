import ts from "@typescript/typescript6";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import { indent, wrap } from "./formula";
import { getField, getPropertyKey } from "./types";

export interface Scope {
  // The TLA+ expression for each variable, parameter, and local in scope.
  bindings: Map<ts.Symbol, string>;
  // The parameter that names the state before a step, in action properties and constraints.
  previous: ts.Symbol | undefined;
}

export interface Bound {
  definitions: string[];
  scope: Scope;
}

export interface Parameter {
  node: ts.ParameterDeclaration;
  name: string;
  symbol: ts.Symbol | undefined;
}

interface Named {
  name: string;
  symbol: ts.Symbol | undefined;
}

export const createStateScope = (context: Context): Scope => ({
  bindings: new Map(context.variables),
  previous: undefined,
});

export const bindNames = (scope: Scope, named: Named[]): Scope => ({
  bindings: new Map([
    ...scope.bindings,
    ...named.flatMap((item): [ts.Symbol, string][] =>
      item.symbol === undefined ? [] : [[item.symbol, item.name]],
    ),
  ]),
  previous: scope.previous,
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

// Binds the names in a destructuring pattern to parts of a value, without LET definitions.
export const bindPatternInline = (
  pattern: ts.BindingName,
  value: string,
  scope: Scope,
  context: Context,
): Scope => {
  if (ts.isIdentifier(pattern)) {
    return bindNames(scope, [{ name: value, symbol: getSymbol(pattern, context.checker) }]);
  }
  return pattern.elements.reduce((current, element, index) => {
    if (ts.isOmittedExpression(element)) return current;
    if (element.dotDotDotToken !== undefined || element.initializer !== undefined) {
      throw new TlaTypeScriptError("Rest elements and default values aren't supported", element);
    }
    if (ts.isArrayBindingPattern(pattern)) {
      return bindPatternInline(element.name, `${wrap(value)}[${index + 1}]`, current, context);
    }
    const name = element.propertyName ?? element.name;
    const key =
      ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)
        ? undefined
        : getPropertyKey(name);
    if (key === undefined) throw new TlaTypeScriptError("Unsupported key", element);
    return bindPatternInline(element.name, `${wrap(value)}${getField(key)}`, current, context);
  }, scope);
};

// Binds the names in a declaration to LET definitions.
export const bindPattern = (
  pattern: ts.BindingName,
  value: string,
  scope: Scope,
  context: Context,
): Bound => {
  const name = context.names.getFresh(ts.isIdentifier(pattern) ? pattern.text : "value");
  return {
    definitions: [`${name} == ${indent(value, "      ")}`],
    scope: bindPatternInline(pattern, name, scope, context),
  };
};

// Binds parameters to argument values with LET definitions, as when inlining a call.
export const bindValues = (
  patterns: ts.BindingName[],
  values: string[],
  scope: Scope,
  context: Context,
) =>
  patterns.reduce<Bound>(
    (current, pattern, index) => {
      if (index >= values.length) context.prelude.add("Undefined");
      const bound = bindPattern(pattern, values[index] ?? "Undefined", current.scope, context);
      return { definitions: [...current.definitions, ...bound.definitions], scope: bound.scope };
    },
    { definitions: [], scope },
  );
