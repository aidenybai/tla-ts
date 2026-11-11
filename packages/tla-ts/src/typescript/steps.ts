import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { translateAction } from "./actions";
import { type Context, getSymbol, isMethodCall } from "./context";
import type { Sections } from "./emit";
import { translateExpression } from "./expressions";
import { render } from "./formula";
import type { Exported } from "./model";
import { link } from "./regions";
import { bindNames, createStateScope, declareParameters, type Parameter } from "./scope";
import { apply, bound, call, fairness as getFairness, identifier, junction, quantify } from "./tla";
import {
  collectUnknowns,
  defineWithUnknowns,
  findDomain,
  getDomain,
  isInfinite,
  isSet,
} from "./types";

interface Guard {
  parameter: Parameter;
  set: ts.Expression;
  isDependent: boolean;
}

interface Chosen {
  domain: Expression;
  // Whether the set uses parameters that earlier guards chose.
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
  const action = collectUnknowns(definition.node, context, () =>
    translateAction(guards.remaining, bindNames(createStateScope(context), parameters), context),
  );
  const head = call(
    name,
    parameters.map((parameter) => identifier(parameter.name)),
  );
  const node = definition.declaration;
  sections.actions.push(
    link(
      context,
      "action",
      name,
      node,
      defineWithUnknowns(
        definition.node,
        name,
        parameters.map((parameter) => ({ name: parameter.name, arity: 0 })),
        "Exists",
        render(action.value),
        action.unknowns,
      ),
    ),
  );
  const fairness = definition.tags.has("strongFair")
    ? "StrongFairness"
    : definition.tags.has("fair")
      ? "WeakFairness"
      : undefined;
  if (parameters.length === 0) {
    sections.next.push(link(context, "next", name, node, head));
    if (fairness !== undefined)
      sections.fairness.push(getFairness(fairness, identifier("vars"), head));
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
      : [bound(parameter.name, domains[index])],
  );
  // Guards run in order, so each dependent parameter is chosen after the ones its set uses.
  const step = quantify(
    "Exists",
    independent,
    [...guards.chosen]
      .filter((entry) => entry[1].isDependent)
      .reduceRight(
        (inner, entry) => quantify("Exists", [bound(entry[0].name, entry[1].domain)], inner),
        head,
      ),
  );
  sections.next.push(link(context, "next", name, node, step));
  if (fairness === undefined) return;
  // Fairness holds for each parameter value when every parameter has a finite type, with the
  // guards that chose parameters kept inside the action.
  const typeDomains = parameters.map((parameter, index) =>
    guards.chosen.has(parameter) ? findDomain(getType(parameter), context) : domains[index],
  );
  const conditions = parameters.flatMap((parameter, index) =>
    guards.chosen.has(parameter)
      ? [apply("\\in", [identifier(parameter.name), domains[index]])]
      : [],
  );
  const finite = typeDomains.flatMap((domain) => (isInfinite(domain) ? [] : [domain]));
  if (finite.length < typeDomains.length) {
    sections.fairness.push(getFairness(fairness, identifier("vars"), step));
    return;
  }
  const guarded = [...conditions, head];
  sections.fairness.push(
    quantify(
      "Forall",
      parameters.map((parameter, index) => bound(parameter.name, finite[index])),
      getFairness(
        fairness,
        identifier("vars"),
        guarded.length === 1 ? guarded[0] : junction("And", guarded),
      ),
    ),
  );
};
