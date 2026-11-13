import ts from "@typescript/typescript6";
import { translateAction } from "./actions";
import { type Context, getSymbol, isMethodCall } from "./context";
import type { Sections } from "./emit";
import { translateExpression } from "./expressions";
import { indent, render, wrap } from "./formula";
import type { Exported } from "./model";
import { bindNames, createStateScope, declareParameters, type Parameter } from "./scope";
import { findDomain, getDomain, isSet } from "./types";

interface Guard {
  parameter: Parameter;
  set: ts.Expression;
  isDependent: boolean;
}

interface Chosen {
  domain: string;
  isDependent: boolean;
}

interface Guards {
  chosen: Map<Parameter, Chosen>;
  remaining: readonly ts.Statement[];
}

const isBareReturn = (statement: ts.Statement): boolean =>
  ts.isReturnStatement(statement)
    ? statement.expression === undefined
    : ts.isBlock(statement) &&
      statement.statements.length === 1 &&
      isBareReturn(statement.statements[0]);

const getGuard = (
  statement: ts.Statement,
  parameters: Parameter[],
  chosen: Map<Parameter, Chosen>,
  context: Context,
): Guard | undefined => {
  if (
    !ts.isIfStatement(statement) ||
    statement.elseStatement !== undefined ||
    !isBareReturn(statement.thenStatement)
  ) {
    return undefined;
  }
  const condition = statement.expression;
  if (
    !ts.isPrefixUnaryExpression(condition) ||
    condition.operator !== ts.SyntaxKind.ExclamationToken
  ) {
    return undefined;
  }
  const call = ts.isParenthesizedExpression(condition.operand)
    ? condition.operand.expression
    : condition.operand;
  if (!isMethodCall(call) || call.expression.name.text !== "has" || call.arguments.length !== 1) {
    return undefined;
  }
  const getParameters = (node: ts.Node): Parameter[] => [
    ...parameters.filter(
      (parameter) => ts.isIdentifier(node) && parameter.symbol === getSymbol(node, context.checker),
    ),
    ...node.getChildren().flatMap(getParameters),
  ];
  const argument = call.arguments[0];
  const parameter = parameters.find(
    (candidate) => candidate.symbol === getSymbol(argument, context.checker),
  );
  const set = call.expression.expression;
  const used = getParameters(set);
  if (
    parameter === undefined ||
    chosen.has(parameter) ||
    !used.every((candidate) => chosen.has(candidate)) ||
    !isSet(set, context)
  ) {
    return undefined;
  }
  return { parameter, set, isDependent: used.length > 0 };
};

const readGuards = (
  statements: readonly ts.Statement[],
  parameters: Parameter[],
  chosen: Map<Parameter, Chosen>,
  context: Context,
): Guards => {
  const guard =
    statements.length === 0 ? undefined : getGuard(statements[0], parameters, chosen, context);
  if (guard === undefined) return { chosen, remaining: statements };
  const scope = bindNames(createStateScope(context), [...chosen.keys()]);
  const domain = translateExpression(guard.set, scope, context);
  return readGuards(
    statements.slice(1),
    parameters,
    new Map([...chosen, [guard.parameter, { domain, isDependent: guard.isDependent }]]),
    context,
  );
};

export const translateStep = (definition: Exported, sections: Sections, context: Context) => {
  const name = definition.name;
  const body = definition.body;
  const parameters = declareParameters(definition.node.parameters, context);
  const guards = readGuards(
    ts.isBlock(body) ? body.statements : [ts.factory.createExpressionStatement(body)],
    parameters,
    new Map(),
    context,
  );
  const formula = translateAction(
    guards.remaining,
    bindNames(createStateScope(context), parameters),
    context,
  );
  const head =
    parameters.length === 0
      ? name
      : `${name}(${parameters.map((parameter) => parameter.name).join(", ")})`;
  sections.actions.push(`${head} ==\n  ${indent(render(formula), "  ")}`);
  const fairness = definition.tags.has("strongFair")
    ? "SF_vars"
    : definition.tags.has("fair")
      ? "WF_vars"
      : undefined;
  if (parameters.length === 0) {
    sections.next.push(name);
    if (fairness !== undefined) sections.fairness.push(`${fairness}(${name})`);
    return;
  }
  const getType = (parameter: Parameter) => context.checker.getTypeAtLocation(parameter.node.name);
  const choices = parameters.map((parameter) => {
    const chosen = guards.chosen.get(parameter);
    return {
      parameter,
      chosen,
      domain: chosen?.domain ?? getDomain(getType(parameter), parameter.node, context),
    };
  });
  const independent = choices.flatMap((choice) =>
    choice.chosen?.isDependent === true ? [] : [`${choice.parameter.name} \\in ${choice.domain}`],
  );
  const dependent = [...guards.chosen]
    .filter((entry) => entry[1].isDependent)
    .map((entry) => `\\E ${entry[0].name} \\in ${entry[1].domain} : `);
  const step = `\\E ${independent.join(", ")} : ${dependent.join("")}${head}`;
  sections.next.push(step);
  if (fairness === undefined) return;
  const forAll = choices.map((choice) => {
    const typeDomain =
      choice.chosen === undefined ? choice.domain : findDomain(getType(choice.parameter), context);
    return typeof typeDomain === "string"
      ? `${choice.parameter.name} \\in ${typeDomain}`
      : undefined;
  });
  if (!forAll.every((bound) => bound !== undefined)) {
    sections.fairness.push(`${fairness}(${step})`);
    return;
  }
  const conditions = choices.flatMap((choice) =>
    choice.chosen === undefined ? [] : [`${choice.parameter.name} \\in ${wrap(choice.domain)}`],
  );
  sections.fairness.push(
    `\\A ${forAll.join(", ")} : ${fairness}(${[...conditions, head].join(" /\\ ")})`,
  );
};
