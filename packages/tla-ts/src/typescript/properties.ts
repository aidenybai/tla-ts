import ts from "@typescript/typescript6";
import { type Context, getSymbol } from "./context";
import type { Sections } from "./emit";
import { TlaTypeScriptError } from "../errors";
import { translateCondition } from "./expressions";
import { indent } from "./formula";
import { getDefinition, translateBody } from "./functions";
import type { Exported, Model } from "./model";
import { bindNames, createStateScope, declareParameter, type Scope } from "./scope";
import { getDomain } from "./types";

const TEMPORAL_OPERATORS = new Map([
  ["eventually", "<>"],
  ["alwaysEventually", "[]<>"],
  ["eventuallyAlways", "<>[]"],
]);

const PREDICATE_TAGS = new Map<string, keyof Sections>([
  ["constraint", "constraints"],
  ["actionConstraint", "actionConstraints"],
  ["view", "views"],
  ["postcondition", "postconditions"],
  ["assume", "assumptions"],
]);

export const VALUE_TAGS = new Set([
  ...TEMPORAL_OPERATORS.keys(),
  ...PREDICATE_TAGS.keys(),
  "initially",
  "always",
  "leadsTo",
  "terminating",
]);

const getPreviousScope = (definition: Exported, context: Context): Scope => {
  const parameters = definition.node.parameters;
  if (parameters.length === 0) return createStateScope(context);
  if (parameters.length > 1 || !ts.isIdentifier(parameters[0].name)) {
    throw new TlaTypeScriptError("Take the state before the step as one parameter", parameters[0]);
  }
  return {
    bindings: new Map([...context.variables].map((entry) => [entry[0], `${entry[1]}'`])),
    previous: getSymbol(parameters[0].name, context.checker),
  };
};

const getLeadsToTarget = (
  definition: Exported,
  parameters: string[],
  model: Model,
  context: Context,
) => {
  const targetName = (definition.tags.get("leadsTo") ?? "").split(/\s/)[0];
  const target = model.topLevel.get(targetName);
  if (target === undefined) {
    throw new TlaTypeScriptError(
      `@leadsTo names an unknown function: ${targetName}`,
      definition.node,
    );
  }
  const exported = model.exported.find((candidate) => candidate.declaration === target);
  if (exported !== undefined) return exported.name;
  const targetDefinition = getDefinition(target, context);
  const values = parameters.slice(0, targetDefinition.parameters.length);
  return values.length === 0
    ? targetDefinition.name
    : `${targetDefinition.name}(${values.join(", ")})`;
};

export const translateProperty = (
  definition: Exported,
  tag: string,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const name = definition.name;
  const node = definition.node;
  const hasPreviousState = tag === "always" || tag === "actionConstraint";
  const isQuantified = TEMPORAL_OPERATORS.has(tag) || tag === "leadsTo";
  if (!hasPreviousState && !isQuantified && node.parameters.length > 0) {
    throw new TlaTypeScriptError(`@${tag} functions can't take parameters`, node.parameters[0]);
  }
  const quantified = (isQuantified ? node.parameters : []).map((parameter) => ({
    ...declareParameter(parameter, context),
    domain: getDomain(context.checker.getTypeAtLocation(parameter.name), parameter, context),
  }));
  const scope = hasPreviousState
    ? getPreviousScope(definition, context)
    : bindNames(createStateScope(context), quantified);
  const forAll =
    quantified.length === 0
      ? ""
      : `\\A ${quantified.map((parameter) => `${parameter.name} \\in ${parameter.domain}`).join(", ")} : `;
  const value = indent(translateBody(definition.body, scope, context), "  ");
  const operator = TEMPORAL_OPERATORS.get(tag);
  const predicate = PREDICATE_TAGS.get(tag);
  if (operator !== undefined) {
    sections.temporal.push(`${name} ==\n  ${forAll}${operator}(${value})`);
    sections.properties.push(name);
    sections.liveness.push(name);
  }
  if (tag === "leadsTo") {
    const parameters = quantified.map((parameter) => parameter.name);
    const target = getLeadsToTarget(definition, parameters, model, context);
    sections.temporal.push(`${name} ==\n  ${forAll}(${value}) ~> ${target}`);
    sections.properties.push(name);
    sections.liveness.push(name);
  }
  if (tag === "always") {
    sections.temporal.push(
      node.parameters.length === 0
        ? `${name} ==\n  [](${value})`
        : `${name} ==\n  [][${value}]_vars`,
    );
    sections.properties.push(name);
  }
  if (tag === "terminating") {
    sections.actions.push(`${name} ==\n  ${value}`);
    sections.next.push(`${name} /\\ UNCHANGED vars`);
  }
  if (tag === "initially") sections.init.push(value);
  if (predicate !== undefined) {
    sections.predicates.push(`${name} ==\n  ${value}`);
    sections[predicate].push(name);
  }
};

export const translateInvariant = (definition: Exported, sections: Sections, context: Context) => {
  const parameters = definition.node.parameters;
  if (parameters.length > 0) {
    throw new TlaTypeScriptError("Invariants can't take parameters", parameters[0]);
  }
  const body = definition.body;
  const scope = createStateScope(context);
  const value = ts.isBlock(body)
    ? translateBody(body, scope, context)
    : translateCondition(body, scope, context);
  sections.predicates.push(`${definition.name} ==\n  ${indent(value, "  ")}`);
  sections.invariants.push(definition.name);
};
