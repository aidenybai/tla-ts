import type { Expression, SourceLocation } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import { TlaConfigError, TlaUnsupportedError } from "./errors";
import { evaluate, expectBoolean, type Context, type Environment } from "./evaluate";
import { parseModule } from "./parser";
import { getInitialStates, getSuccessors } from "./successors";
import { combineHash, getValueHash, valuesEqual, type Value } from "./values";

export interface CheckOptions {
  source: string;
  config: string | ModelConfig;
  loadModule?: (name: string) => string | undefined;
  onPrint?: (text: string) => void;
}

export type CheckStatus =
  | "success"
  | "assumption-violation"
  | "invariant-violation"
  | "property-violation"
  | "deadlock";

export interface TraceStep {
  action: string | undefined;
  state: Record<string, Value>;
}

export interface Violation {
  name: string;
  trace: TraceStep[];
}

export interface CheckResult {
  status: CheckStatus;
  violation: Violation | undefined;
  generatedStates: number;
  distinctStates: number;
  depth: number;
}

interface NamedExpression {
  name: string;
  expression: Expression;
}

interface StateCheck {
  name: string;
  expression: Expression;
  variables: number[] | undefined;
}

interface ActionProperty {
  name: string;
  action: Expression;
  subscript: Expression;
}

interface Specification {
  init: Expression;
  next: Expression;
}

const START: SourceLocation = { line: 0, column: 0 };

const createIdentifier = (name: string): Expression => ({
  kind: "Identifier",
  name,
  location: START,
});

const getDefinitionBody = (name: string, environment: Environment) => {
  const definition = environment.definitions.get(name);
  if (definition?.kind !== "Operator" || definition.params.length > 0) {
    throw new TlaConfigError(`${name} is not defined as an operator without arguments`);
  }
  return definition.body;
};

const getConjuncts = (expression: Expression, environment: Environment): Expression[] => {
  if (expression.kind === "And")
    return expression.operands.flatMap((operand) => getConjuncts(operand, environment));
  if (expression.kind === "Identifier" && !environment.constants.has(expression.name)) {
    const definition = environment.definitions.get(expression.name);
    if (definition?.kind === "Operator" && definition.params.length === 0) {
      return getConjuncts(definition.body, environment);
    }
  }
  return [expression];
};

const TEMPORAL_KINDS = new Set([
  "Always",
  "Eventually",
  "WeakFairness",
  "StrongFairness",
  "BoxAction",
  "AngleAction",
]);

const isTemporal = (
  expression: Expression,
  environment: Environment,
  visited = new Set<string>(),
): boolean => {
  if (TEMPORAL_KINDS.has(expression.kind)) return true;
  if (expression.kind === "Apply" && expression.operator === "~>") return true;
  if (expression.kind === "Identifier" && !visited.has(expression.name)) {
    visited.add(expression.name);
    const definition = environment.definitions.get(expression.name);
    if (definition?.kind === "Operator") return isTemporal(definition.body, environment, visited);
  }
  if (expression.kind === "And" || expression.kind === "Or") {
    return expression.operands.some((operand) => isTemporal(operand, environment, visited));
  }
  if (expression.kind === "Apply")
    return expression.args.some((arg) => isTemporal(arg, environment, visited));
  return false;
};

const getSpecification = (config: ModelConfig, environment: Environment): Specification => {
  if (config.specification === undefined) {
    if (config.init === undefined)
      throw new TlaConfigError("The configuration specifies neither INIT nor SPECIFICATION");
    if (config.next === undefined)
      throw new TlaConfigError("The configuration does not specify NEXT");
    getDefinitionBody(config.init, environment);
    getDefinitionBody(config.next, environment);
    return { init: createIdentifier(config.init), next: createIdentifier(config.next) };
  }
  const initConjuncts: Expression[] = [];
  const nextActions: Expression[] = [];
  getConjuncts(getDefinitionBody(config.specification, environment), environment).forEach(
    (conjunct) => {
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        nextActions.push(conjunct.expression.action);
        return;
      }
      if (!isTemporal(conjunct, environment)) initConjuncts.push(conjunct);
    },
  );
  if (nextActions.length !== 1) {
    throw new TlaConfigError(
      `The specification ${config.specification} must contain exactly one [][Next]_vars`,
    );
  }
  return {
    init: { kind: "And", operands: initConjuncts, location: START },
    next: nextActions[0],
  };
};

const getProperties = (config: ModelConfig, environment: Environment) => {
  const invariants: NamedExpression[] = [];
  const actionProperties: ActionProperty[] = [];
  config.properties.forEach((name) => {
    getConjuncts(getDefinitionBody(name, environment), environment).forEach((conjunct) => {
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        actionProperties.push({
          name,
          action: conjunct.expression.action,
          subscript: conjunct.expression.subscript,
        });
        return;
      }
      if (conjunct.kind === "Always" && !isTemporal(conjunct.expression, environment)) {
        invariants.push({ name, expression: conjunct.expression });
        return;
      }
      throw new TlaUnsupportedError(
        `Property ${name} needs liveness checking, which is not supported yet`,
      );
    });
  });
  return { invariants, actionProperties };
};

const getNamedExpressions = (names: string[], environment: Environment): NamedExpression[] =>
  names.map((name) => {
    getDefinitionBody(name, environment);
    return { name, expression: createIdentifier(name) };
  });

const getStateChecks = (named: NamedExpression[], environment: Environment): StateCheck[] =>
  named.flatMap((item) =>
    getConjuncts(item.expression, environment).map((expression) => ({
      name: item.name,
      expression,
      variables: getReadVariables(expression, environment),
    })),
  );

const isUnchangedFor = (stateCheck: StateCheck, state: Value[], parent: Value[] | undefined) => {
  const variables = stateCheck.variables;
  if (!parent || !variables) return false;
  for (let index = 0; index < variables.length; index++) {
    if (state[variables[index]] !== parent[variables[index]]) return false;
  }
  return true;
};

export const check = (options: CheckOptions): CheckResult => {
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  if (config.view !== undefined) throw new TlaUnsupportedError("VIEW is not supported yet");
  const specification = createEnvironment(parseModule(options.source), config, {
    loadModule: options.loadModule,
    print: options.onPrint ?? console.log,
  });
  const environment = specification.environment;
  const getContext = (state: Value[] | undefined, next: Value[] | undefined): Context => ({
    environment,
    scope: undefined,
    state,
    next,
  });
  const holds = (expression: Expression, context: Context, description: string) =>
    expectBoolean(evaluate(expression, context), description);

  const statistics = { generatedStates: 0, distinctStates: 0, depth: 0 };
  const createResult = (status: CheckStatus, violation?: Violation): CheckResult => ({
    status,
    violation,
    ...statistics,
  });

  const failedAssumption = specification.assumptions.find(
    (assumption) =>
      !holds(assumption.expression, getContext(undefined, undefined), "an assumption"),
  );
  if (failedAssumption) {
    const name =
      failedAssumption.name ??
      `line ${failedAssumption.location.line}, column ${failedAssumption.location.column}`;
    return createResult("assumption-violation", { name, trace: [] });
  }

  const spec = getSpecification(config, environment);
  const properties = getProperties(config, environment);
  const invariants = getStateChecks(
    [...getNamedExpressions(config.invariants, environment), ...properties.invariants],
    environment,
  );
  const constraints = getStateChecks(
    getNamedExpressions(config.constraints, environment),
    environment,
  );
  const actionConstraints = getNamedExpressions(config.actionConstraints, environment);

  const states: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const buckets = new Map<number, number | number[]>();
  const canonicalValues = new Map<number, Value | Value[]>();
  const canonicalize = (value: Value): Value => {
    if (typeof value !== "object" || (value.kind !== "Set" && value.kind !== "Function"))
      return value;
    const hash = getValueHash(value);
    const bucket = canonicalValues.get(hash);
    if (bucket === undefined) {
      canonicalValues.set(hash, value);
      return value;
    }
    if (!Array.isArray(bucket)) {
      if (bucket === value || valuesEqual(bucket, value)) return bucket;
      canonicalValues.set(hash, [bucket, value]);
      return value;
    }
    for (let index = 0; index < bucket.length; index++) {
      if (bucket[index] === value || valuesEqual(bucket[index], value)) return bucket[index];
    }
    bucket.push(value);
    return value;
  };
  const canonicalizeState = (state: Value[]) => {
    for (let index = 0; index < state.length; index++) state[index] = canonicalize(state[index]);
    return state;
  };

  const toRecord = (state: Value[]) =>
    Object.fromEntries(environment.variables.map((name, index) => [name, state[index]]));
  const getTrace = (
    index: number,
    last?: { state: Value[]; action: string | undefined },
  ): TraceStep[] => {
    const steps: TraceStep[] = last ? [{ action: last.action, state: toRecord(last.state) }] : [];
    for (let current = index; current !== -1; current = parents[current]) {
      steps.push({ action: actions[current], state: toRecord(states[current]) });
    }
    return steps.reverse();
  };
  const getStateHash = (state: Value[]) => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < state.length; index++)
      hash = combineHash(hash, getValueHash(state[index]));
    return hash & 0x3fffffff;
  };
  const isSameState = (index: number, state: Value[]) => {
    const stored = states[index];
    for (let position = 0; position < state.length; position++) {
      if (stored[position] !== state[position] && !valuesEqual(stored[position], state[position]))
        return false;
    }
    return true;
  };
  const isSeen = (hash: number, state: Value[]) => {
    const bucket = buckets.get(hash);
    if (bucket === undefined) return false;
    if (typeof bucket === "number") return isSameState(bucket, state);
    return bucket.some((index) => isSameState(index, state));
  };
  const markSeen = (hash: number, index: number) => {
    const bucket = buckets.get(hash);
    if (bucket === undefined) buckets.set(hash, index);
    else if (typeof bucket === "number") buckets.set(hash, [bucket, index]);
    else bucket.push(index);
  };
  const findViolatedInvariant = (state: Value[], parent?: Value[]) =>
    invariants.find(
      (invariant) =>
        !isUnchangedFor(invariant, state, parent) &&
        !holds(invariant.expression, getContext(state, undefined), `invariant ${invariant.name}`),
    );
  const satisfiesConstraints = (state: Value[], parent?: Value[]) =>
    constraints.every(
      (constraint) =>
        isUnchangedFor(constraint, state, parent) ||
        holds(constraint.expression, getContext(state, undefined), `constraint ${constraint.name}`),
    );
  const countViolatingState = (depth: number) => {
    statistics.distinctStates = states.length + 1;
    statistics.depth = Math.max(statistics.depth, depth);
  };
  const addState = (state: Value[], parent: number, action: string | undefined) => {
    const depth = parent === -1 ? 1 : depths[parent] + 1;
    states.push(state);
    parents.push(parent);
    actions.push(action);
    depths.push(depth);
    statistics.distinctStates = states.length;
    statistics.depth = Math.max(statistics.depth, depth);
  };

  for (const state of getInitialStates(spec.init, environment)) {
    canonicalizeState(state);
    statistics.generatedStates++;
    const hash = getStateHash(state);
    if (isSeen(hash, state)) continue;
    const violated = findViolatedInvariant(state);
    if (violated) {
      countViolatingState(1);
      return createResult("invariant-violation", {
        name: violated.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    if (!satisfiesConstraints(state)) continue;
    markSeen(hash, states.length);
    addState(state, -1, undefined);
  }

  for (let index = 0; index < states.length; index++) {
    const state = states[index];
    const successors = getSuccessors(spec.next, state, environment);
    statistics.generatedStates += successors.length;
    if (successors.length === 0 && config.checkDeadlock) {
      return createResult("deadlock", { name: "deadlock", trace: getTrace(index) });
    }
    for (const successor of successors) {
      const transition = getContext(state, successor.state);
      const violatedProperty = properties.actionProperties.find(
        (property) =>
          !holds(property.action, transition, `property ${property.name}`) &&
          !holds(
            { kind: "Unchanged", expression: property.subscript, location: START },
            transition,
            "a subscript",
          ),
      );
      if (violatedProperty) {
        return createResult("property-violation", {
          name: violatedProperty.name,
          trace: getTrace(index, successor),
        });
      }
      if (
        !actionConstraints.every((constraint) =>
          holds(constraint.expression, transition, `action constraint ${constraint.name}`),
        )
      ) {
        continue;
      }
      canonicalizeState(successor.state);
      const hash = getStateHash(successor.state);
      if (isSeen(hash, successor.state)) continue;
      const violated = findViolatedInvariant(successor.state, state);
      if (violated) {
        countViolatingState(depths[index] + 1);
        return createResult("invariant-violation", {
          name: violated.name,
          trace: getTrace(index, successor),
        });
      }
      if (!satisfiesConstraints(successor.state, state)) continue;
      markSeen(hash, states.length);
      addState(successor.state, index, successor.action);
    }
  }

  return createResult("success");
};
