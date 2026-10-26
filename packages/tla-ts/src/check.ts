import type { Assumption, Expression, SourceLocation } from "./ast";
import { parseConfig, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import { TlaConfigError, TlaEvaluationError, TlaUnsupportedError } from "./errors";
import {
  evaluate,
  expectBoolean,
  getDefinition,
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
import { combineHash, getValueHash, isSameValue, type Value } from "./values";

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

interface NamedExpression {
  name: string;
  expression: Expression;
  scope: Scope | undefined;
}

interface StateCheck extends NamedExpression {
  variables: number[] | undefined;
}

interface ActionProperty {
  name: string;
  action: Expression;
  subscript: Expression;
  scope: Scope | undefined;
}

interface Specification {
  init: Expression;
  next: Expression;
  fairness: FairnessCondition[];
}

interface Properties {
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

const getSpecification = (config: ModelConfig, environment: Environment): Specification => {
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

const getProperties = (config: ModelConfig, environment: Environment): Properties => {
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

const getNamedExpressions = (names: string[], environment: Environment): NamedExpression[] =>
  names.map((name) => {
    getDefinitionBody(name, environment);
    return { name, expression: createIdentifier(name), scope: undefined };
  });

const getStateChecks = (named: NamedExpression[], environment: Environment): StateCheck[] =>
  named.flatMap((item) =>
    getConjuncts(item.expression, environment).map((expression) => ({
      name: item.name,
      expression,
      scope: item.scope,
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

  const statistics = { generatedStates: 0, distinctStates: 0, depth: 0 };
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    ...statistics,
  });

  const getAssumptionError = (assumption: Assumption) => {
    try {
      return holds(assumption.expression, getContext(undefined, undefined), "an assumption")
        ? undefined
        : { message: undefined };
    } catch (error) {
      if (error instanceof TlaEvaluationError) return { message: error.message };
      throw error;
    }
  };
  for (const assumption of specification.assumptions.filter((candidate) => !candidate.isAxiom)) {
    const failure = getAssumptionError(assumption);
    if (failure) {
      const name =
        assumption.name ?? `line ${assumption.location.line}, column ${assumption.location.column}`;
      return createResult("assumption-violation", { name, trace: [], message: failure.message });
    }
  }

  const properties = getProperties(config, environment);
  const invariants = getStateChecks(
    [...getNamedExpressions(config.invariants, environment), ...properties.invariants],
    environment,
  );
  const isConstantModel =
    config.specification === undefined &&
    config.init === undefined &&
    environment.variables.length === 0;
  if (isConstantModel) return createResult("success");
  const spec = getSpecification(config, environment);
  const constraints = getStateChecks(
    getNamedExpressions(config.constraints, environment),
    environment,
  );
  const actionConstraints = getNamedExpressions(config.actionConstraints, environment);
  const isRecordingEdges = properties.liveness.length > 0;
  const symmetryGroup =
    config.symmetry === undefined ? [] : getSymmetryGroup(config.symmetry, environment);
  const getFingerprintState = (state: Value[]) =>
    symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup);

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const edges: number[][] = [];
  const initial: number[] = [];
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
      if (isSameValue(bucket, value)) return bucket;
      canonicalValues.set(hash, [bucket, value]);
      return value;
    }
    for (let index = 0; index < bucket.length; index++) {
      if (isSameValue(bucket[index], value)) return bucket[index];
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
  const countViolatingState = (depth: number) => {
    statistics.distinctStates = states.length + 1;
    statistics.depth = Math.max(statistics.depth, depth);
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
    statistics.distinctStates = states.length;
    statistics.depth = Math.max(statistics.depth, depth);
  };

  for (const state of getInitialStates(spec.init, environment)) {
    canonicalizeState(state);
    statistics.generatedStates++;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    if (findStateIndex(hash, fingerprintState) !== -1) continue;
    const violated = findViolatedInvariant(state);
    if (violated) {
      countViolatingState(1);
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
    if (!satisfiesConstraints(state)) continue;
    markSeen(hash, states.length);
    initial.push(states.length);
    addState(state, fingerprintState, -1, undefined);
  }

  for (let index = 0; index < states.length; index++) {
    const state = states[index];
    const successors = getSuccessors(spec.next, state, environment);
    statistics.generatedStates += successors.length;
    if (successors.length === 0 && config.checkDeadlock) {
      return createResult("deadlock", { name: "deadlock", trace: getTrace(index) });
    }
    for (const successor of successors) {
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
      const transition = getContext(state, successor.state);
      if (
        !actionConstraints.every((constraint) =>
          holds(constraint.expression, transition, `action constraint ${constraint.name}`),
        )
      ) {
        continue;
      }
      canonicalizeState(successor.state);
      const fingerprintState = getFingerprintState(successor.state);
      const hash = getStateHash(fingerprintState);
      const existing = findStateIndex(hash, fingerprintState);
      if (existing !== -1) {
        if (isRecordingEdges) edges[index].push(existing);
        continue;
      }
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
      if (isRecordingEdges) edges[index].push(states.length);
      addState(successor.state, fingerprintState, index, successor.action);
    }
  }

  const graph = { states, successors: edges, initial, parents };
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

  return createResult("success");
};
