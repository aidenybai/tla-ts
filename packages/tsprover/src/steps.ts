import ts from "typescript";
import { translateAction } from "./actions";
import { type Context, getSymbol } from "./context";
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
  // Whether the set uses parameters that earlier guards chose.
  isDependent: boolean;
}

const isBareReturn = (statement: ts.Statement): boolean =>
  ts.isReturnStatement(statement)
    ? statement.expression === undefined
    : ts.isBlock(statement) &&
      statement.statements.length === 1 &&
      isBareReturn(statement.statements[0]);

// A leading `if (!set.has(parameter)) return;` chooses the parameter from that set, as
// `\E parameter \in set` does, so TLC doesn't enumerate the parameter's whole type.
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
  if (
    !ts.isCallExpression(call) ||
    !ts.isPropertyAccessExpression(call.expression) ||
    call.expression.name.text !== "has" ||
    call.arguments.length !== 1
  ) {
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
  // The set may use parameters that earlier guards chose, as in \E a \in A : \E b \in B(a).
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

// The parameters that leading guards choose, and the statements after the guards.
const readGuards = (
  statements: readonly ts.Statement[],
  parameters: Parameter[],
  chosen: Map<Parameter, Chosen>,
  context: Context,
): { chosen: Map<Parameter, Chosen>; remaining: readonly ts.Statement[] } => {
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

// An exported function that changes state, as an action and its disjunct of Next. Each parameter
// ranges over its type, or over the set that a guard chooses it from.
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
  if (parameters.length === 0) {
    sections.next.push(name);
    if (definition.tags.has("strongFair")) sections.fairness.push(`SF_vars(${name})`);
    else if (definition.tags.has("fair")) sections.fairness.push(`WF_vars(${name})`);
    return;
  }
  const getType = (parameter: Parameter) => context.checker.getTypeAtLocation(parameter.node.name);
  const domains = parameters.map(
    (parameter) =>
      guards.chosen.get(parameter)?.domain ??
      getDomain(getType(parameter), parameter.node, context),
  );
  const independent = parameters.flatMap((parameter, index) =>
    guards.chosen.get(parameter)?.isDependent === true
      ? []
      : [`${parameter.name} \\in ${domains[index]}`],
  );
  // Guards run in order, so each dependent parameter is chosen after the ones its set uses.
  const dependent = [...guards.chosen]
    .filter((entry) => entry[1].isDependent)
    .map((entry) => `\\E ${entry[0].name} \\in ${entry[1].domain} : `);
  const step = `\\E ${independent.join(", ")} : ${dependent.join("")}${head}`;
  sections.next.push(step);
  const fairness = definition.tags.has("strongFair")
    ? "SF_vars"
    : definition.tags.has("fair")
      ? "WF_vars"
      : undefined;
  if (fairness === undefined) return;
  // Fairness holds for each parameter value when every parameter has a finite type, with the
  // guards that chose parameters kept inside the action.
  const typeDomains = parameters.map((parameter, index) =>
    guards.chosen.has(parameter) ? findDomain(getType(parameter), context) : domains[index],
  );
  const conditions = parameters.flatMap((parameter, index) =>
    guards.chosen.has(parameter) ? [`${parameter.name} \\in ${wrap(domains[index])}`] : [],
  );
  if (!typeDomains.every((domain): domain is string => typeof domain === "string")) {
    sections.fairness.push(`${fairness}(${step})`);
    return;
  }
  const forAll = parameters.map(
    (parameter, index) => `${parameter.name} \\in ${typeDomains[index]}`,
  );
  sections.fairness.push(
    `\\A ${forAll.join(", ")} : ${fairness}(${[...conditions, head].join(" /\\ ")})`,
  );
};
