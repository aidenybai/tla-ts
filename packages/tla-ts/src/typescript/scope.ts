import ts from "@typescript/typescript6";
import { type Context, getElement, getSymbol, getUndefined, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import type { Expression, OperatorDefinition } from "../ast";
import { translateExpression } from "./expressions";
import { apply, define, identifier, ifExpression, number, string } from "./tla";
import { getField, getPathStep, getPropertyKey, isSequenceType } from "./types";

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
    const initializer = element.initializer;
    const withDefault = (part: Expression) =>
      initializer === undefined
        ? part
        : share(part, "element", context, (shared) =>
            ifExpression(
              apply("=", [shared, getUndefined(context)]),
              translateExpression(initializer, current, context),
              shared,
            ),
          );
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
      return bindPatternInline(
        element.name,
        apply("SubSeq", [value, number(position + 1), apply("Len", [value])]),
        current,
        context,
      );
    }
    if (element.dotDotDotToken !== undefined) {
      throw new TlaTypeScriptError("Object rest elements aren't supported", element);
    }
    const name = element.propertyName ?? element.name;
    const key =
      ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)
        ? undefined
        : getPropertyKey(name);
    if (key === undefined) throw new TlaTypeScriptError("Unsupported key", element);
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
    const step = getPathStep(key);
    const part =
      initializer === undefined
        ? getField(value, key)
        : ifExpression(
            apply("\\in", [
              step.kind === "Field" ? string(step.name) : step.args[0],
              apply("DOMAIN", [value]),
            ]),
            getField(value, key),
            getUndefined(context),
          );
    return bindPatternInline(element.name, withDefault(part), current, context);
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

// Binds parameters to argument values with LET definitions, as when inlining a call.
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
