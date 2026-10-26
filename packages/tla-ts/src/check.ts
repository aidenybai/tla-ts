import type { Definition, Expression, SourceLocation } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import { TlaConfigError, TlaEvaluationError, TlaUnsupportedError } from "./errors";
import {
  evaluate,
  expectBoolean,
  getChildren,
  getDefinition,
  isLocallyResolved,
  type Context,
  type Environment,
  type Scope,
} from "./evaluate";
import {
  expandTemporal,
  findLivenessViolation,
  isTemporal,
  resolveTemporal,
  toFairnessCondition,
  toLivenessProperty,
  unsupportedTemporal,
  type FairnessCondition,
  type LivenessProperty,
} from "./liveness";
import { parseModule } from "./parser";
import { getInitialStates, getSuccessors } from "./successors";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { createCanonicalizer } from "./canonical";
import { getPossibleCounts } from "./runtime";
import { combineHash, formatValue, getValueHash, isSameValue, type Value } from "./values";

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
  | "liveness-violation"
  | "postcondition-violation"
  | "deadlock";

export interface TraceStep {
  action: string | undefined;
  state: Record<string, Value>;
}

export interface Violation {
  name: string;
  trace: TraceStep[];
  loopStart: number | undefined;
  message?: string;
}

export interface CheckResult {
  status: CheckStatus;
  violation: Violation | undefined;
  generatedStates: number;
  distinctStates: number;
  depth: number;
}

export interface NamedExpression {
  name: string;
  expression: Expression;
  scope: Scope | undefined;
}

export interface StateCheck extends NamedExpression {
  variables: number[] | undefined;
}

export interface ActionProperty {
  name: string;
  action: Expression;
  subscript: Expression;
  scope: Scope | undefined;
}

export interface Specification {
  init: Expression;
  next: Expression;
  fairness: FairnessCondition[];
}

export interface Properties {
  initialPredicates: NamedExpression[];
  invariants: NamedExpression[];
  actionProperties: ActionProperty[];
  liveness: LivenessProperty[];
}

const START: SourceLocation = { line: 0, column: 0 };

const createIdentifier = (name: string): Expression => ({
  kind: "Identifier",
  name,
  location: START,
});

const getDefinitionBody = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  if (definition?.kind !== "Operator" || definition.params.length > 0) {
    throw new TlaConfigError(`${name} is not defined as an operator without arguments`);
  }
  return definition.body;
};

const isActionLevel = (
  expression: Expression,
  environment: Environment,
  visited = new Set<Definition>(),
): boolean => {
  if (expression.kind === "Prime" || expression.kind === "Unchanged") return true;
  if (expression.kind === "Enabled") return false;
  const name =
    expression.kind === "Identifier"
      ? expression.name
      : expression.kind === "Apply"
        ? expression.operator
        : undefined;
  const definition =
    name === undefined || isLocallyResolved(expression)
      ? undefined
      : getDefinition(name, environment);
  if (definition && !visited.has(definition)) {
    visited.add(definition);
    if (isActionLevel(definition.body, environment, visited)) return true;
  }
  return getChildren(expression).some((child) => isActionLevel(child, environment, visited));
};

const getConjuncts = (expression: Expression, environment: Environment): Expression[] => {
  if (expression.kind === "And")
    return expression.operands.flatMap((operand) => getConjuncts(operand, environment));
  if (expression.kind === "Identifier" && !environment.constants.has(expression.name)) {
    const definition = getDefinition(expression.name, environment);
    if (definition?.kind === "Operator" && definition.params.length === 0) {
      return getConjuncts(definition.body, environment);
    }
  }
  return [expression];
};

export const getSpecification = (config: ModelConfig, environment: Environment): Specification => {
  if (config.specification === undefined) {
    if (config.init === undefined)
      throw new TlaConfigError(
        "The configuration file did not specify the initial state predicate",
      );
    if (config.next === undefined)
      throw new TlaConfigError("The configuration does not specify NEXT");
    getDefinitionBody(config.init, environment);
    getDefinitionBody(config.next, environment);
    return {
      init: createIdentifier(config.init),
      next: createIdentifier(config.next),
      fairness: [],
    };
  }
  const initConjuncts: Expression[] = [];
  const nextActions: Expression[] = [];
  const fairness: FairnessCondition[] = [];
  const body = getDefinitionBody(config.specification, environment);
  expandTemporal(body, undefined, environment).forEach((item) => {
    const conjunct = resolveTemporal(item.expression, environment);
    if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
      nextActions.push(conjunct.expression.action);
      return;
    }
    const condition = toFairnessCondition(item, environment);
    if (condition) {
      fairness.push(condition);
      return;
    }
    if (isTemporal(item.expression, environment) || item.scope !== undefined) {
      throw unsupportedTemporal(config.specification ?? "");
    }
    initConjuncts.push(item.expression);
  });
  if (nextActions.length !== 1) {
    throw new TlaConfigError(
      `The specification ${config.specification} must contain exactly one [][Next]_vars`,
    );
  }
  return {
    init: { kind: "And", operands: initConjuncts, location: START },
    next: nextActions[0],
    fairness,
  };
};

export const getProperties = (config: ModelConfig, environment: Environment): Properties => {
  const properties: Properties = {
    initialPredicates: [],
    invariants: [],
    actionProperties: [],
    liveness: [],
  };
  config.properties.forEach((name) => {
    const body = getDefinitionBody(name, environment);
    expandTemporal(body, undefined, environment).forEach((item) => {
      const conjunct = resolveTemporal(item.expression, environment);
      if (!isTemporal(conjunct, environment)) {
        properties.initialPredicates.push({ name, expression: conjunct, scope: item.scope });
        return;
      }
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        properties.actionProperties.push({
          name,
          action: conjunct.expression.action,
          subscript: conjunct.expression.subscript,
          scope: item.scope,
        });
        return;
      }
      if (conjunct.kind === "Always" && !isTemporal(conjunct.expression, environment)) {
        properties.invariants.push({ name, expression: conjunct.expression, scope: item.scope });
        return;
      }
      const liveness = toLivenessProperty(name, item, environment);
      if (!liveness) throw unsupportedTemporal(name);
      properties.liveness.push(liveness);
    });
  });
  return properties;
};

export const getNamedExpressions = (names: string[], environment: Environment): NamedExpression[] =>
  names.map((name) => {
    getDefinitionBody(name, environment);
    return { name, expression: createIdentifier(name), scope: undefined };
  });

export const getStateChecks = (named: NamedExpression[], environment: Environment): StateCheck[] =>
  named.flatMap((item) =>
    getConjuncts(item.expression, environment).map((expression) => ({
      name: item.name,
      expression,
      scope: item.scope,
      variables: getReadVariables(expression, environment),
    })),
  );

export const isUnchangedFor = (
  stateCheck: StateCheck,
  state: Value[],
  parent: Value[] | undefined,
) => {
  const variables = stateCheck.variables;
  if (!parent || !variables) return false;
  for (let index = 0; index < variables.length; index++) {
    if (state[variables[index]] !== parent[variables[index]]) return false;
  }
  return true;
};

export interface Search {
  properties: Properties;
  invariants: StateCheck[];
  spec: Specification;
  constraints: StateCheck[];
  actionConstraints: NamedExpression[];
  getFingerprintState: (state: Value[]) => Value[];
}

export const createSearch = (config: ModelConfig, environment: Environment): Search | undefined => {
  const properties = getProperties(config, environment);
  const invariants = getStateChecks(
    [...getNamedExpressions(config.invariants, environment), ...properties.invariants],
    environment,
  );
  const isConstantModel =
    config.specification === undefined &&
    config.init === undefined &&
    environment.variables.length === 0;
  if (isConstantModel) return undefined;
  const symmetryGroup =
    config.symmetry === undefined ? [] : getSymmetryGroup(config.symmetry, environment);
  return {
    properties,
    invariants,
    spec: getSpecification(config, environment),
    constraints: getStateChecks(getNamedExpressions(config.constraints, environment), environment),
    actionConstraints: getNamedExpressions(config.actionConstraints, environment),
    getFingerprintState: (state) =>
      symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup),
  };
};

export const check = (options: CheckOptions): CheckResult => {
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  if (config.view !== undefined) throw new TlaUnsupportedError("VIEW is not supported yet");
  const print = options.onPrint ?? console.log;
  const specification = createEnvironment(parseModule(options.source), config, {
    loadModule: options.loadModule,
    print,
  });
  const environment = specification.environment;
  const getContext = (
    state: Value[] | undefined,
    next: Value[] | undefined,
    scope?: Scope,
  ): Context => ({
    environment,
    scope,
    state,
    next,
  });
  const holds = (expression: Expression, context: Context, description: string) =>
    expectBoolean(evaluate(expression, context), description);

  const runtime = environment.runtime;
  const statistics = { depth: 0 };
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    generatedStates: runtime.generatedStates,
    distinctStates: runtime.distinctStates,
    depth: statistics.depth,
  });

  const getConstantFailure = (expression: Expression, description: string) => {
    try {
      return holds(expression, getContext(undefined, undefined), description)
        ? undefined
        : { message: undefined };
    } catch (error) {
      if (error instanceof TlaEvaluationError) return { message: error.message };
      throw error;
    }
  };
  for (const assumption of specification.assumptions.filter((candidate) => !candidate.isAxiom)) {
    const failure = getConstantFailure(assumption.expression, "an assumption");
    if (failure) {
      const name =
        assumption.name ?? `line ${assumption.location.line}, column ${assumption.location.column}`;
      return createResult("assumption-violation", { name, trace: [], message: failure.message });
    }
  }

  const search = createSearch(config, environment);
  if (!search) return createResult("success");
  const properties = search.properties;
  const invariants = search.invariants;
  const spec = search.spec;
  const constraints = search.constraints;
  const actionConstraints = search.actionConstraints;
  const getFingerprintState = search.getFingerprintState;
  const isRecordingEdges = properties.liveness.length > 0;
  const possible = config.possible.map((name) => ({
    name,
    expression: createIdentifier(name),
    isAction: isActionLevel(getDefinitionBody(name, environment), environment),
  }));
  const statePossible = possible.filter((item) => !item.isAction);
  const actionPossible = possible.filter((item) => item.isAction);
  const trackPossible = (items: typeof possible, context: Context) =>
    items.forEach((item) => {
      const count = runtime.possibleCounts.get(item.name) ?? 0;
      const isWitnessed = holds(item.expression, context, `_POSSIBLE ${item.name}`);
      runtime.possibleCounts.set(item.name, isWitnessed ? count + 1 : count);
    });

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const edges: number[][] = [];
  const edgeStates: Value[][][] = [];
  const isRecordingEdgeStates = isRecordingEdges && config.symmetry !== undefined;
  const initial: number[] = [];
  const buckets = new Map<number, number | number[]>();
  const canonicalizeState = createCanonicalizer();

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
  const isSameState = (stored: Value[], state: Value[]) => {
    for (let position = 0; position < state.length; position++) {
      if (!isSameValue(stored[position], state[position])) return false;
    }
    return true;
  };
  const findStateIndex = (hash: number, state: Value[]) => {
    const bucket = buckets.get(hash);
    if (bucket === undefined) return -1;
    if (typeof bucket === "number") {
      return isSameState(fingerprintStates[bucket], state) ? bucket : -1;
    }
    return bucket.find((index) => isSameState(fingerprintStates[index], state)) ?? -1;
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
        !holds(
          invariant.expression,
          getContext(state, undefined, invariant.scope),
          `invariant ${invariant.name}`,
        ),
    );
  const satisfiesConstraints = (state: Value[], parent?: Value[]) =>
    constraints.every(
      (constraint) =>
        isUnchangedFor(constraint, state, parent) ||
        holds(constraint.expression, getContext(state, undefined), `constraint ${constraint.name}`),
    );
  const countDistinctState = (depth: number) => {
    runtime.distinctStates = states.length + 1;
    statistics.depth = Math.max(statistics.depth, depth);
    runtime.diameter = Math.max(runtime.diameter, depth);
  };
  const addState = (
    state: Value[],
    fingerprintState: Value[],
    parent: number,
    action: string | undefined,
  ) => {
    const depth = parent === -1 ? 1 : depths[parent] + 1;
    states.push(state);
    fingerprintStates.push(fingerprintState);
    parents.push(parent);
    actions.push(action);
    depths.push(depth);
    if (isRecordingEdges) edges.push([]);
    if (isRecordingEdgeStates) edgeStates.push([]);
  };

  for (const state of getInitialStates(spec.init, environment)) {
    canonicalizeState(state);
    runtime.generatedStates++;
    runtime.initialStates++;
    runtime.levels.set(state, 1);
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    const isSeen = findStateIndex(hash, fingerprintState) !== -1;
    const isInModel = isSeen || satisfiesConstraints(state);
    if (isInModel) trackPossible(statePossible, getContext(state, undefined));
    if (isSeen) continue;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
    }
    const violated = findViolatedInvariant(state);
    if (violated) {
      return createResult("invariant-violation", {
        name: violated.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    const failedPredicate = properties.initialPredicates.find(
      (predicate) =>
        !holds(
          predicate.expression,
          getContext(state, undefined, predicate.scope),
          `property ${predicate.name}`,
        ),
    );
    if (failedPredicate) {
      return createResult("property-violation", {
        name: failedPredicate.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    if (!isInModel) continue;
    markSeen(hash, states.length);
    initial.push(states.length);
    addState(state, fingerprintState, -1, undefined);
  }

  for (let index = 0; index < states.length && !runtime.isStopped; index++) {
    const state = states[index];
    runtime.queueSize = states.length - index - 1;
    const successors = getSuccessors(spec.next, state, environment);
    if (successors.length === 0 && config.checkDeadlock) {
      return createResult("deadlock", { name: "deadlock", trace: getTrace(index) });
    }
    for (const successor of successors) {
      runtime.generatedStates++;
      runtime.levels.set(successor.state, depths[index] + 1);
      const transition = getContext(state, successor.state);
      canonicalizeState(successor.state);
      const fingerprintState = getFingerprintState(successor.state);
      const hash = getStateHash(fingerprintState);
      const found = findStateIndex(hash, fingerprintState);
      const isStateInModel = found !== -1 || satisfiesConstraints(successor.state, state);
      if (isStateInModel) trackPossible(statePossible, getContext(successor.state, undefined));
      const isInModel =
        isStateInModel &&
        actionConstraints.every((constraint) =>
          holds(constraint.expression, transition, `action constraint ${constraint.name}`),
        );
      if (isInModel) trackPossible(actionPossible, transition);
      const existing = isInModel ? found : -1;
      if (existing !== -1 && isRecordingEdges) edges[index].push(existing);
      if (existing !== -1 && isRecordingEdgeStates) edgeStates[index].push(successor.state);
      const isNew = isInModel && existing === -1;
      if (isNew) countDistinctState(depths[index] + 1);
      if (existing === -1) {
        const violated = findViolatedInvariant(successor.state, state);
        if (violated) {
          return createResult("invariant-violation", {
            name: violated.name,
            trace: getTrace(index, successor),
          });
        }
      }
      const violatedProperty = properties.actionProperties.find(
        (property) =>
          !holds(
            property.action,
            getContext(state, successor.state, property.scope),
            `property ${property.name}`,
          ) &&
          !holds(
            { kind: "Unchanged", expression: property.subscript, location: START },
            getContext(state, successor.state, property.scope),
            "a subscript",
          ),
      );
      if (violatedProperty) {
        return createResult("property-violation", {
          name: violatedProperty.name,
          trace: getTrace(index, successor),
        });
      }
      if (!isNew) continue;
      markSeen(hash, states.length);
      if (isRecordingEdges) edges[index].push(states.length);
      if (isRecordingEdgeStates) edgeStates[index].push(successor.state);
      addState(successor.state, fingerprintState, index, successor.action);
      runtime.queueSize++;
    }
  }

  const graph = {
    states,
    successors: edges,
    successorStates: isRecordingEdgeStates ? edgeStates : undefined,
    initial,
    parents,
  };
  for (const property of properties.liveness) {
    const lasso = findLivenessViolation(graph, property, spec.fairness, environment);
    if (!lasso) continue;
    const path = [...lasso.prefix, ...lasso.cycle];
    const trace = path.map((stateIndex, position): TraceStep => {
      if (position === 0) return { action: undefined, state: toRecord(states[stateIndex]) };
      const previous = path[position - 1];
      const action =
        previous === stateIndex
          ? "Stuttering"
          : getSuccessors(spec.next, states[previous], environment).find((successor) =>
              isSameState(successor.state, states[stateIndex]),
            )?.action;
      return { action, state: toRecord(states[stateIndex]) };
    });
    return createResult("liveness-violation", {
      name: property.name,
      trace,
      loopStart: lasso.prefix.length,
    });
  }

  const unwitnessed = possible.find((item) => !runtime.possibleCounts.get(item.name));
  if (unwitnessed) {
    print(formatValue(getPossibleCounts(runtime), true));
    return createResult("postcondition-violation", {
      name: unwitnessed.name,
      trace: [],
      message: `The _POSSIBLE predicate ${unwitnessed.name} was never witnessed.`,
    });
  }
  for (const name of config.postconditions) {
    const failure = getConstantFailure(createIdentifier(name), "a postcondition");
    if (failure) {
      return createResult("postcondition-violation", {
        name,
        trace: [],
        message: failure.message ?? `Postcondition ${name} is false.`,
      });
    }
  }
  return createResult("success");
};
