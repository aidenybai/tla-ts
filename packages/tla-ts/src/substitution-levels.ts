import type { Definition, Expression, SourceLocation } from "./ast";
import { TlaSyntaxError } from "./errors";
import { getChildren, getDefinition, isLocallyResolved, type Environment } from "./evaluate";
import { getDefinitionLevel, getLevel } from "./liveness";

export interface SubstitutionCheck {
  module: string;
  name: string;
  arity: number;
  maximumLevel: number;
  expression: Expression;
  location: SourceLocation;
  keys: string[];
  hasVariables: boolean;
}

const NON_LEIBNIZ_OPERATORS = new Set(["~>", "\\cdot", "-+->"]);

const leibnizParams = new WeakMap<Definition, boolean[]>();

const getNonLeibnizNames = (
  expression: Expression,
  environment: Environment,
  isNonLeibniz = false,
  names = new Set<string>(),
): Set<string> => {
  const visit = (child: Expression, isChildNonLeibniz = isNonLeibniz) =>
    getNonLeibnizNames(child, environment, isChildNonLeibniz, names);
  switch (expression.kind) {
    case "Identifier":
      if (isNonLeibniz && isLocallyResolved(expression)) names.add(expression.name);
      return names;
    // SANY's LetInNode and OpArgNode don't carry the non-Leibniz parameters of their bodies.
    case "Lambda":
    case "Let":
      return names;
    case "Prime":
    case "Unchanged":
    case "Enabled":
    case "Always":
    case "Eventually":
    case "BoxAction":
    case "AngleAction":
    case "WeakFairness":
    case "StrongFairness":
      getChildren(expression).forEach((child) => visit(child, true));
      return names;
    case "UnboundedQuantifier":
      visit(expression.body, isNonLeibniz || expression.isTemporal === true);
      return names;
    case "Apply": {
      if (isLocallyResolved(expression)) {
        if (isNonLeibniz) names.add(expression.operator);
        expression.args.forEach((arg) => visit(arg));
        return names;
      }
      const definition = getDefinition(expression.operator, environment);
      expression.args.forEach((arg, index) =>
        visit(
          arg,
          isNonLeibniz ||
            NON_LEIBNIZ_OPERATORS.has(expression.operator) ||
            (definition !== undefined && !isLeibnizIn(definition, index, environment)),
        ),
      );
      return names;
    }
    default:
      getChildren(expression).forEach((child) => visit(child));
      return names;
  }
};

const isLeibnizIn = (definition: Definition, index: number, environment: Environment) => {
  if (definition.kind !== "Operator") return true;
  const cached = leibnizParams.get(definition);
  if (cached) return cached[index] ?? true;
  leibnizParams.set(
    definition,
    definition.params.map(() => true),
  );
  const names = getNonLeibnizNames(definition.body, environment);
  const params = definition.params.map((param) => !names.has(param.name));
  leibnizParams.set(definition, params);
  return params[index] ?? true;
};

const getOperatorName = (expression: Expression) =>
  expression.kind === "Identifier"
    ? expression.name
    : expression.kind === "Apply" || expression.kind === "OperatorReference"
      ? expression.operator
      : undefined;

const isLeibnizOperator = (expression: Expression, environment: Environment) => {
  if (expression.kind === "Lambda") {
    const names = getNonLeibnizNames(expression.body, environment);
    return expression.params.every((param) => !names.has(param));
  }
  const name = getOperatorName(expression);
  if (name === undefined || isLocallyResolved(expression)) return true;
  if (NON_LEIBNIZ_OPERATORS.has(name)) return false;
  const definition = getDefinition(name, environment);
  return (
    definition?.kind !== "Operator" ||
    definition.params.every((_, index) => isLeibnizIn(definition, index, environment))
  );
};

const getOperatorLevel = (expression: Expression, environment: Environment) => {
  if (expression.kind === "Lambda") return getLevel(expression.body, undefined, environment);
  const name = getOperatorName(expression);
  if (name === "~>" || name === "-+->") return 3;
  if (name === "\\cdot") return 2;
  return name === undefined
    ? getLevel(expression, undefined, environment)
    : getLevel({ kind: "Identifier", name, location: expression.location }, undefined, environment);
};

const isConstantModule = (check: SubstitutionCheck, environment: Environment) =>
  !check.hasVariables &&
  check.keys.every((key) => {
    const definition = environment.definitions.get(key);
    return definition === undefined || getDefinitionLevel(definition, environment) === 0;
  });

export const checkSubstitutions = (checks: SubstitutionCheck[], environment: Environment) =>
  checks.forEach((check) => {
    const location = `at line ${check.location.line}, column ${check.location.column}`;
    const level =
      check.arity === 0
        ? getLevel(check.expression, undefined, environment)
        : getOperatorLevel(check.expression, environment);
    if (level > check.maximumLevel && !isConstantModule(check, environment)) {
      throw new TlaSyntaxError(
        `Level error in instantiating module '${check.module}': the level of the expression or operator substituted for '${check.name}' must be at most ${check.maximumLevel} ${location}`,
      );
    }
    if (check.arity > 0 && !isLeibnizOperator(check.expression, environment)) {
      throw new TlaSyntaxError(
        `Error in instantiating module '${check.module}': a non-Leibniz operator substituted for '${check.name}' ${location}`,
      );
    }
  });
