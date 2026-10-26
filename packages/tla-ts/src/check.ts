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
  ACTION_LEVEL,
  createLivenessChecker,
  expandTemporal,
  getLevel,
  TEMPORAL_LEVEL,
  toUnscopedExpression,
  type LiveSuccessor,
  type ScopedExpression,
  type TemporalProperty,
} from "./liveness";
import { parseModule } from "./parser";
import { getInitialStates, getSuccessors } from "./successors";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { createCanonicalizer } from "./canonical";
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
  temporals: ScopedExpression[];
}

export interface Properties {
  initialPredicates: NamedExpression[];
  invariants: NamedExpression[];
  actionProperties: ActionProperty[];
  liveness: TemporalProperty[];
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
      temporals: [],
    };
  }
  const initConjuncts: Expression[] = [];
  const nextActions: Expression[] = [];
  const temporals: ScopedExpression[] = [];
  const body = getDefinitionBody(config.specification, environment);
  const getUnscoped = (expression: Expression, scope: Scope | undefined) => {
    const unscoped = toUnscopedExpression(expression, scope);
    if (!unscoped) {
      throw new TlaUnsupportedError(
        `The specification ${config.specification} has an initial predicate or next-state relation inside a quantified formula`,
      );
    }
    return unscoped;
  };
  expandTemporal(body, undefined, environment).forEach((item) => {
    const conjunct = item.expression;
    if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
      nextActions.push(getUnscoped(conjunct.expression.action, item.scope));
      return;
    }
    if (
      conjunct.kind === "Always" &&
      getLevel(conjunct.expression, item.scope, environment) < ACTION_LEVEL
    ) {
      throw new TlaConfigError(
        `TLC cannot handle []P in the specification ${config.specification} when P is a state predicate`,
      );
    }
    const level = getLevel(conjunct, item.scope, environment);
    if (level === TEMPORAL_LEVEL) {
      temporals.push(item);
      return;
    }
    if (level === ACTION_LEVEL) {
      throw new TlaConfigError(
        `TLC cannot handle the action-level conjunct of the specification ${config.specification}`,
      );
    }
    initConjuncts.push(getUnscoped(conjunct, item.scope));
  });
  if (nextActions.length !== 1) {
    throw new TlaConfigError(
      `The specification ${config.specification} must contain exactly one [][Next]_vars`,
    );
  }
  return {
    init: { kind: "And", operands: initConjuncts, location: START },
    next: nextActions[0],
    temporals,
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
      const conjunct = item.expression;
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        properties.actionProperties.push({
          name,
          action: conjunct.expression.action,
          subscript: conjunct.expression.subscript,
          scope: item.scope,
        });
        return;
      }
      if (
        conjunct.kind === "Always" &&
        getLevel(conjunct.expression, item.scope, environment) <= 1
      ) {
        properties.invariants.push({ name, expression: conjunct.expression, scope: item.scope });
        return;
      }
      const level = getLevel(conjunct, item.scope, environment);
      if (level < ACTION_LEVEL) {
        properties.initialPredicates.push({ name, expression: conjunct, scope: item.scope });
        return;
      }
      if (level === ACTION_LEVEL) {
        throw new TlaConfigError(`The property ${name} is an action-level formula`);
      }
      properties.liveness.push({ name, expression: conjunct, scope: item.scope });
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

interface Progress {
  initial: number;
  expanded: number;
  pendingDepth: number;
  current: Value[] | undefined;
  level: number;
  isExiting: boolean;
}

export interface Search {
  properties: Properties;
  spec: Specification;
  getFingerprintState: (state: Value[]) => Value[];
  findViolatedInvariant: (state: Value[], parent?: Value[]) => StateCheck | undefined;
  satisfiesConstraints: (state: Value[], parent?: Value[]) => boolean;
  findFailedInitialPredicate: (state: Value[]) => NamedExpression | undefined;
  findViolatedActionProperty: (state: Value[], next: Value[]) => ActionProperty | undefined;
  satisfiesActionConstraints: (state: Value[], next: Value[]) => boolean;
}

const getContext = (
  environment: Environment,
  state: Value[] | undefined,
  next: Value[] | undefined,
  scope?: Scope,
): Context => ({ environment, scope, state, next });

const holds = (expression: Expression, context: Context, description: string) =>
  expectBoolean(evaluate(expression, context), description);

const getAssumptionError = (assumption: Assumption, environment: Environment) => {
  try {
    return holds(
      assumption.expression,
      getContext(environment, undefined, undefined),
      "an assumption",
    )
      ? undefined
      : { message: undefined };
  } catch (error) {
    if (error instanceof TlaEvaluationError) return { message: error.message };
    throw error;
  }
};

export const findAssumptionViolation = (
  assumptions: Assumption[],
  environment: Environment,
): Omit<Violation, "loopStart"> | undefined => {
  for (const assumption of assumptions.filter((candidate) => !candidate.isAxiom)) {
    const failure = getAssumptionError(assumption, environment);
    if (failure) {
      const name =
        assumption.name ?? `line ${assumption.location.line}, column ${assumption.location.column}`;
      return { name, trace: [], message: failure.message };
    }
  }
  return undefined;
};

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
  const constraints = getStateChecks(
    getNamedExpressions(config.constraints, environment),
    environment,
  );
  const actionConstraints = getNamedExpressions(config.actionConstraints, environment);
  return {
    properties,
    spec: getSpecification(config, environment),
    getFingerprintState: (state) =>
      symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup),
    findViolatedInvariant: (state, parent) =>
      invariants.find(
        (invariant) =>
          !isUnchangedFor(invariant, state, parent) &&
          !holds(
            invariant.expression,
            getContext(environment, state, undefined, invariant.scope),
            `invariant ${invariant.name}`,
          ),
      ),
    satisfiesConstraints: (state, parent) =>
      constraints.every(
        (constraint) =>
          isUnchangedFor(constraint, state, parent) ||
          holds(
            constraint.expression,
            getContext(environment, state, undefined),
            `constraint ${constraint.name}`,
          ),
      ),
    findFailedInitialPredicate: (state) =>
      properties.initialPredicates.find(
        (predicate) =>
          !holds(
            predicate.expression,
            getContext(environment, state, undefined, predicate.scope),
            `property ${predicate.name}`,
          ),
      ),
    findViolatedActionProperty: (state, next) =>
      properties.actionProperties.find(
        (property) =>
          !holds(
            property.action,
            getContext(environment, state, next, property.scope),
            `property ${property.name}`,
          ) &&
          !holds(
            { kind: "Unchanged", expression: property.subscript, location: START },
            getContext(environment, state, next, property.scope),
            "a subscript",
          ),
      ),
    satisfiesActionConstraints: (state, next) =>
      actionConstraints.every((constraint) =>
        holds(
          constraint.expression,
          getContext(environment, state, next),
          `action constraint ${constraint.name}`,
        ),
      ),
  };
};

export const check = (options: CheckOptions): CheckResult => {
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  if (config.view !== undefined) throw new TlaUnsupportedError("VIEW is not supported yet");
  const statistics = { generatedStates: 0, distinctStates: 0, depth: 0 };
  const states: Value[][] = [];
  const progress: Progress = {
    initial: 0,
    expanded: 0,
    pendingDepth: 0,
    current: undefined,
    level: -1,
    isExiting: false,
  };
  const specification = createEnvironment(parseModule(options.source), config, {
    loadModule: options.loadModule,
    runtime: {
      print: options.onPrint ?? console.log,
      checkDeadlock: config.checkDeadlock,
      getLevel: (state) => {
        if (state === undefined) return 0;
        return state === progress.current ? progress.level : progress.level + 1;
      },
      getStatistics: () => ({
        queue: states.length - progress.expanded,
        distinct: states.length + (progress.pendingDepth === 0 ? 0 : 1),
        initial: progress.initial,
        generated: statistics.generatedStates,
        diameter: Math.max(1, statistics.depth, progress.pendingDepth),
      }),
      exit: () => {
        progress.isExiting = true;
      },
    },
  });
  const environment = specification.environment;
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    ...statistics,
  });

  const assumptionViolation = findAssumptionViolation(specification.assumptions, environment);
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);

  const search = createSearch(config, environment);
  if (!search) return createResult("success");
  const properties = search.properties;
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  const liveness = createLivenessChecker(properties.liveness, spec.temporals, environment);

  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
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
  const getPathTrace = (path: number[]) =>
    path.map((stateIndex, position): TraceStep => {
      if (position === 0) return { action: undefined, state: toRecord(states[stateIndex]) };
      const previous = path[position - 1];
      progress.current = states[previous];
      progress.level = depths[previous];
      const action =
        previous === stateIndex
          ? "Stuttering"
          : getSuccessors(spec.next, states[previous], environment).find((successor) =>
              isSameState(successor.state, states[stateIndex]),
            )?.action;
      return { action, state: toRecord(states[stateIndex]) };
    });
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
    statistics.distinctStates = states.length;
    statistics.depth = Math.max(statistics.depth, depth);
  };

  const initialStates = getInitialStates(spec.init, environment);
  progress.level = 0;
  for (const state of initialStates) {
    canonicalizeState(state);
    statistics.generatedStates++;
    progress.initial++;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    if (findStateIndex(hash, fingerprintState) !== -1) continue;
    if (search.satisfiesConstraints(state)) {
      markSeen(hash, states.length);
      liveness?.addInitialState(states.length, state);
      addState(state, fingerprintState, -1, undefined);
    }
    const violated = search.findViolatedInvariant(state);
    if (violated) {
      return createResult("invariant-violation", {
        name: violated.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return createResult("liveness-violation", {
        name: failedPredicate.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
  }

  for (let index = 0; index < states.length && !progress.isExiting; index++) {
    const state = states[index];
    progress.expanded = index + 1;
    progress.current = state;
    progress.level = depths[index];
    const successors = getSuccessors(spec.next, state, environment);
    if (successors.length === 0 && config.checkDeadlock) {
      return createResult("deadlock", { name: "deadlock", trace: getTrace(index) });
    }
    const liveSuccessors: LiveSuccessor[] = [];
    for (const successor of successors) {
      statistics.generatedStates++;
      const violatedProperty = search.findViolatedActionProperty(state, successor.state);
      if (violatedProperty) {
        return createResult("liveness-violation", {
          name: violatedProperty.name,
          trace: getTrace(index, successor),
        });
      }
      if (!search.satisfiesActionConstraints(state, successor.state)) continue;
      canonicalizeState(successor.state);
      const fingerprintState = getFingerprintState(successor.state);
      const hash = getStateHash(fingerprintState);
      const existing = findStateIndex(hash, fingerprintState);
      if (existing !== -1) {
        if (liveness) liveSuccessors.push({ index: existing, state: successor.state });
        continue;
      }
      progress.pendingDepth = depths[index] + 1;
      const violated = search.findViolatedInvariant(successor.state, state);
      if (violated) {
        countViolatingState(progress.pendingDepth);
        return createResult("invariant-violation", {
          name: violated.name,
          trace: getTrace(index, successor),
        });
      }
      progress.pendingDepth = 0;
      if (!search.satisfiesConstraints(successor.state, state)) continue;
      markSeen(hash, states.length);
      if (liveness) liveSuccessors.push({ index: states.length, state: successor.state });
      addState(successor.state, fingerprintState, index, successor.action);
    }
    const accepted = liveness?.addState(index, state, liveSuccessors);
    if (accepted) {
      return createResult("property-violation", {
        name: accepted.name,
        trace: getPathTrace(accepted.path),
      });
    }
  }

  const lasso = liveness?.findViolation();
  if (lasso) {
    return createResult("liveness-violation", {
      name: lasso.name,
      trace: getPathTrace([...lasso.prefix, ...lasso.cycle]),
      loopStart: lasso.prefix.length,
    });
  }

  return createResult("success");
};
