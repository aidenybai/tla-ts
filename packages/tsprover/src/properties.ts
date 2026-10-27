import ts from "typescript";
import { type Context, getSymbol } from "./context";
import type { Sections } from "./emit";
import { TsproverError } from "./errors";
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

// Tags whose functions become named predicates that the config lists in a section.
const PREDICATE_TAGS = new Map<string, keyof Sections>([
  ["constraint", "constraints"],
  ["actionConstraint", "actionConstraints"],
  ["view", "views"],
  ["postcondition", "postconditions"],
  ["assume", "assumptions"],
]);

// Tags that make an exported function a property of the spec rather than an action.
export const VALUE_TAGS = new Set([
  ...TEMPORAL_OPERATORS.keys(),
  ...PREDICATE_TAGS.keys(),
  "initially",
  "always",
  "leadsTo",
]);

// The scope of an action property, whose one parameter names the state before the step, and whose
// variables are the state after it.
const getPreviousScope = (definition: Exported, context: Context): Scope => {
  const parameters = definition.node.parameters;
  if (parameters.length === 0) return createStateScope(context);
  if (parameters.length > 1 || !ts.isIdentifier(parameters[0].name)) {
    throw new TsproverError("Take the state before the step as one parameter", parameters[0]);
  }
  return {
    bindings: new Map([...context.variables].map((entry) => [entry[0], `${entry[1]}'`])),
    previous: getSymbol(parameters[0].name, context.checker),
  };
};

// The operator that a @leadsTo tag names, applied to the parameters that it shares.
const getLeadsToTarget = (
  definition: Exported,
  parameters: string[],
  model: Model,
  context: Context,
) => {
  const targetName = definition.tags.get("leadsTo") ?? "";
  const target = model.topLevel.get(targetName);
  if (target === undefined) {
    throw new TsproverError(`@leadsTo names an unknown function: ${targetName}`, definition.node);
  }
  const exported = model.exported.find((candidate) => candidate.declaration === target);
  if (exported !== undefined) return exported.name;
  const targetDefinition = getDefinition(target, context);
  const values = parameters.slice(0, targetDefinition.parameters.length);
  return values.length === 0
    ? targetDefinition.name
    : `${targetDefinition.name}(${values.join(", ")})`;
};

// A function tagged with a property, such as @eventually or @constraint.
export const translateProperty = (
  definition: Exported,
  tag: string,
  model: Model,
  sections: Sections,
  context: Context,
) => {
  const name = definition.name;
  const node = definition.node;
  const isPrevious = tag === "always" || tag === "actionConstraint";
  // A temporal property's parameters hold for every value, as in \A p \in P : []<>Eats(p).
  const isQuantified = TEMPORAL_OPERATORS.has(tag) || tag === "leadsTo";
  if (!isPrevious && !isQuantified && node.parameters.length > 0) {
    throw new TsproverError(`@${tag} functions can't take parameters`, node.parameters[0]);
  }
  const quantified = (isQuantified ? node.parameters : []).map((parameter) => ({
    ...declareParameter(parameter, context),
    domain: getDomain(context.checker.getTypeAtLocation(parameter.name), parameter, context),
  }));
  const scope = isPrevious
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
  }
  if (tag === "leadsTo") {
    const parameters = quantified.map((parameter) => parameter.name);
    const target = getLeadsToTarget(definition, parameters, model, context);
    sections.temporal.push(`${name} ==\n  ${forAll}(${value}) ~> ${target}`);
    sections.properties.push(name);
  }
  if (tag === "always") {
    sections.temporal.push(
      node.parameters.length === 0
        ? `${name} ==\n  [](${value})`
        : `${name} ==\n  [][${value}]_vars`,
    );
    sections.properties.push(name);
  }
  if (tag === "initially") sections.init.push(value);
  if (predicate !== undefined) {
    sections.predicates.push(`${name} ==\n  ${value}`);
    sections[predicate].push(name);
  }
};

// An exported function that returns a boolean, which holds in every state.
export const translateInvariant = (definition: Exported, sections: Sections, context: Context) => {
  const parameters = definition.node.parameters;
  if (parameters.length > 0) {
    throw new TsproverError("Invariants can't take parameters", parameters[0]);
  }
  const body = definition.body;
  const scope = createStateScope(context);
  const value = ts.isBlock(body)
    ? translateBody(body, scope, context)
    : translateCondition(body, scope, context);
  sections.predicates.push(`${definition.name} ==\n  ${indent(value, "  ")}`);
  sections.invariants.push(definition.name);
};
