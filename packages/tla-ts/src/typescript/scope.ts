import ts from "@typescript/typescript6";
import { type Context, getSymbol, getUndefined, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import type { Expression, OperatorDefinition } from "../ast";
import { translateExpression } from "./expressions";
import { apply, define, identifier, ifExpression, index, number } from "./tla";
import { getField, getPropertyKey } from "./types";

export interface Scope {
  // The TLA+ expression for each variable, parameter, and local in scope.
  bindings: Map<ts.Symbol, Expression>;
  // The parameter that names the state before a step, in action properties and constraints.
  previous: ts.Symbol | undefined;
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
});

export const bindNames = (scope: Scope, named: Named[]): Scope => ({
  bindings: new Map([
    ...scope.bindings,
    ...named.flatMap((item): [ts.Symbol, Expression][] =>
      item.symbol === undefined
        ? []
        : [[item.symbol, typeof item.name === "string" ? identifier(item.name) : item.name]],
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
  value: Expression,
  scope: Scope,
  context: Context,
): Scope => {
  if (ts.isIdentifier(pattern)) {
    return bindNames(scope, [{ name: value, symbol: getSymbol(pattern, context.checker) }]);
  }
  return pattern.elements.reduce((current, element, position) => {
    if (ts.isOmittedExpression(element)) return current;
    if (element.dotDotDotToken !== undefined || element.initializer !== undefined) {
      throw new TlaTypeScriptError("Rest elements and default values aren't supported", element);
    }
    if (ts.isArrayBindingPattern(pattern)) {
      return bindPatternInline(
        element.name,
        index(value, [number(position + 1)]),
        current,
        context,
      );
    }
    const name = element.propertyName ?? element.name;
    const key =
      ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)
        ? undefined
        : getPropertyKey(name);
    if (key === undefined) throw new TlaTypeScriptError("Unsupported key", element);
    return bindPatternInline(element.name, getField(value, key), current, context);
  }, scope);
};

// Binds the names in a declaration to LET definitions.
export const bindPattern = (
  pattern: ts.BindingName,
  value: Expression,
  scope: Scope,
  context: Context,
): Bound => {
  const name = context.names.getFresh(ts.isIdentifier(pattern) ? pattern.text : "value");
  return {
    definitions: [define(name, [], value)],
    scope: bindPatternInline(pattern, identifier(name), scope, context),
  };
};

// Binds parameters to argument values with LET definitions, as when inlining a call. A parameter
// takes its default value when its argument is missing or undefined.
export const bindValues = (
  parameters: readonly ts.ParameterDeclaration[],
  values: Expression[],
  scope: Scope,
  context: Context,
) =>
  parameters.reduce<Bound>(
    (current, parameter, position) => {
      if (parameter.dotDotDotToken !== undefined) {
        throw new TlaTypeScriptError("Rest parameters aren't supported", parameter);
      }
      const value = values.at(position);
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
