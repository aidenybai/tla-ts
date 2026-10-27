import ts from "typescript";
import { type Context, getSymbol } from "./context";
import { TsproverError } from "./errors";
import { indent, wrap } from "./formula";

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

// Gives a parameter a fresh TLA+ name.
export const declareParameter = (
  parameter: ts.ParameterDeclaration,
  context: Context,
): Parameter => {
  if (
    !ts.isIdentifier(parameter.name) ||
    parameter.initializer !== undefined ||
    parameter.questionToken !== undefined ||
    parameter.dotDotDotToken !== undefined
  ) {
    throw new TsproverError(`Use a plain parameter here: ${parameter.getText()}`, parameter);
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
      throw new TsproverError("Rest elements and default values aren't supported", element);
    }
    const part = ts.isArrayBindingPattern(pattern)
      ? `${wrap(value)}[${index + 1}]`
      : `${wrap(value)}.${(element.propertyName ?? element.name).getText()}`;
    return bindPatternInline(element.name, part, current, context);
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
      const bound = bindPattern(pattern, values[index], current.scope, context);
      return { definitions: [...current.definitions, ...bound.definitions], scope: bound.scope };
    },
    { definitions: [], scope },
  );
