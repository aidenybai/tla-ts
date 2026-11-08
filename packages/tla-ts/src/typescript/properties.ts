import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol } from "./context";
import type { Sections } from "./emit";
import { TlaTypeScriptError } from "../errors";
import { translateCondition } from "./expressions";
import { getDefinition, readsState, translateBody } from "./functions";
import type { Exported, Model } from "./model";
import { bindNames, createStateScope, declareParameter, type Scope } from "./scope";
import {
  apply,
  bound,
  boxAction,
  call,
  define,
  defineAt,
  getLocation,
  identifier,
  letExpression,
  locate,
  prime,
  quantify,
  temporal,
} from "./tla";
import { collectUnknowns, defineWithUnknowns, getDomain } from "./types";

const TEMPORAL_OPERATORS = new Map<string, (value: Expression) => Expression>([
  ["eventually", (value) => temporal("Eventually", value)],
  ["alwaysEventually", (value) => temporal("Always", temporal("Eventually", value))],
  ["eventuallyAlways", (value) => temporal("Eventually", temporal("Always", value))],
]);

// Tags whose functions become named predicates that the config lists in a section.
const PREDICATE_TAGS = new Map<
  string,
  "constraints" | "actionConstraints" | "views" | "postconditions" | "assumptions"
>([
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
    throw new TlaTypeScriptError("Take the state before the step as one parameter", parameters[0]);
  }
  return {
    bindings: new Map([...context.variables].map((entry) => [entry[0], prime(entry[1])])),
    previous: getSymbol(parameters[0].name, context.checker),
  };
};

// The operator that a @leadsTo tag names, applied to the parameters that it shares.
const getLeadsToTarget = (
  definition: Exported,
  parameters: string[],
  model: Model,
  context: Context,
): Expression => {
  const targetName = definition.tags.get("leadsTo") ?? "";
  const target = model.topLevel.get(targetName);
  if (target === undefined) {
    throw new TlaTypeScriptError(
      `@leadsTo names an unknown function: ${targetName}`,
      definition.node,
    );
  }
  const exported = model.exported.find((candidate) => candidate.declaration === target);
  if (exported !== undefined) return identifier(exported.name);
  const targetDefinition = getDefinition(target, context);
  return call(
    targetDefinition.name,
    parameters.slice(0, targetDefinition.parameters.length).map((name) => identifier(name)),
  );
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
  // A temporal property's parameters hold for every value, as in \A p \in P : []<>Eats(p).
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
  const forAll = (body: Expression) =>
    quantify(
      "Forall",
      quantified.map((parameter) => bound(parameter.name, parameter.domain)),
      body,
    );
  const value = translateBody(definition.body, scope, context);
  const operator = TEMPORAL_OPERATORS.get(tag);
  const predicate = PREDICATE_TAGS.get(tag);
  const addTemporal = (body: Expression) => {
    sections.temporal.push(defineAt(node, name, [], body));
    sections.properties.push(name);
  };
  if (operator !== undefined) addTemporal(forAll(operator(value)));
  if (tag === "leadsTo") {
    const parameters = quantified.map((parameter) => parameter.name);
    const target = getLeadsToTarget(definition, parameters, model, context);
    addTemporal(forAll(apply("~>", [value, target])));
  }
  if (tag === "always") {
    addTemporal(
      temporal(
        "Always",
        node.parameters.length === 0 ? value : boxAction(value, identifier("vars")),
      ),
    );
  }
  if (tag === "initially") sections.init.push(locate(value, getLocation(node)));
  if (predicate !== undefined) {
    sections.predicates.push(defineAt(node, name, [], value));
    sections[predicate].push(name);
  }
};

// An exported function that returns a value without asserting it, which TLC calls with every
// argument, in every state when it reads state and once before the search otherwise. TLC reports a
// throw, a failed lookup, or an index out of range in it.
export const translateCall = (definition: Exported, sections: Sections, context: Context) => {
  const quantified = definition.node.parameters.map((parameter) => ({
    ...declareParameter(parameter, context),
    domain: getDomain(context.checker.getTypeAtLocation(parameter.name), parameter, context),
  }));
  const result = context.names.getFresh("result");
  const body = collectUnknowns(definition.node, context, () =>
    translateBody(definition.body, bindNames(createStateScope(context), quantified), context),
  );
  // TLC evaluates a LET definition only when something uses it.
  const checked = letExpression(
    [define(result, [], body.value)],
    apply("=", [identifier(result), identifier(result)]),
  );
  sections.predicates.push(
    defineWithUnknowns(
      definition.node,
      definition.name,
      [],
      "Forall",
      quantify(
        "Forall",
        quantified.map((parameter) => bound(parameter.name, parameter.domain)),
        checked,
      ),
      body.unknowns,
    ),
  );
  const isStateLevel = readsState(
    definition.declaration,
    context,
    new Set([definition.declaration]),
  );
  (isStateLevel ? sections.invariants : sections.assumptions).push(definition.name);
};

// An exported function that returns a boolean, which holds in every state. With parameters, it says
// nothing about the state, so TLC only calls it.
export const translateInvariant = (definition: Exported, sections: Sections, context: Context) => {
  if (definition.node.parameters.length > 0) {
    return translateCall(definition, sections, context);
  }
  const body = definition.body;
  const scope = createStateScope(context);
  const value = collectUnknowns(definition.node, context, () =>
    ts.isBlock(body)
      ? translateBody(body, scope, context)
      : translateCondition(body, scope, context),
  );
  sections.predicates.push(
    defineWithUnknowns(definition.node, definition.name, [], "Forall", value.value, value.unknowns),
  );
  sections.invariants.push(definition.name);
};
