import type { Assumption, Expression, SourceLocation } from "./ast";
import { parseConfig, type ConfigValue, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import { TlaConfigError, TlaEvaluationError, TlaUnsupportedError } from "./errors";
import { EXIT_STATUS, setExitCode, setNextStatePhase, withLivenessExitCode } from "./exit-codes";
import {
  evaluate,
  expectBoolean,
  getChildren,
  getDefinition,
  isConstantLevel,
  isImpure,
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
import { prettyPrint } from "./pretty-print";
import { getInitialStates, getSuccessors, type Successor } from "./successors";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { getTlcFingerprint } from "./tlc-random";
import { createCanonicalizer } from "./canonical";
import { getPossibleCounts, type CheckerRuntime } from "./runtime";
import {
  combineHash,
  formatValue,
  getValueHash,
  isSameValue,
  setStringOrder,
  type Value,
} from "./values";

export interface CheckOptions {
  source: string;
  config: string | ModelConfig;
  loadModule?: (name: string) => string | undefined;
  onPrint?: (text: string) => void;
  onPause?: () => void;
  readFile?: (path: string) => string | undefined;
  writeFile?: (path: string, content: string) => void;
  seed?: bigint;
  workers?: number;
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
  counts?: string;
  unwitnessed?: Postcondition;
}

export interface Postcondition {
  name: string;
  message: string;
  counts?: string;
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

const INITIAL_RECOVERY_FAILURE = "Failed to recover the initial state from its fingerprint.";
const NEXT_RECOVERY_FAILURE = "Failed to recover the next state from its fingerprint.";

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

const getConfigDefinition = (kind: string, name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  if (!definition) {
    throw new TlaConfigError(
      `The ${kind} ${name} specified in the configuration file\nis not defined in the specification.`,
    );
  }
  if (definition.kind === "Operator" && definition.params.length > 0) {
    throw new TlaConfigError(
      `TLC requires ${kind} not to take any argument, but one was given: ${name}`,
    );
  }
  if (isConstantLevel(definition, environment)) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  return definition;
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

const isConstantTrue = (item: ScopedExpression, environment: Environment, usage: string) => {
  const conjunct = item.expression;
  if (conjunct.kind !== "Identifier" || getLevel(conjunct, item.scope, environment) > 0) {
    return false;
  }
  const value = evaluate(conjunct, getContext(environment, undefined, undefined, item.scope));
  if (value === false) {
    throw new TlaConfigError(`The spec is trivially false because ${conjunct.name} is false.`);
  }
  if (value !== true) {
    throw new TlaConfigError(
      `The operator ${conjunct.name}, which equals ${formatValue(value)},\ncannot be used as a ${usage}`,
    );
  }
  return true;
};

export const getSpecification = (config: ModelConfig, environment: Environment): Specification => {
  if (config.specification === undefined) {
    if (config.init === undefined)
      throw new TlaConfigError(
        "The configuration file did not specify the initial state predicate",
      );
    if (config.next === undefined)
      throw setExitCode(
        new TlaConfigError("The configuration does not specify NEXT"),
        EXIT_STATUS.specEvaluationFailure,
      );
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
    if (isConstantTrue(item, environment, "spec")) return;
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
      if (isConstantTrue(item, environment, "property")) return;
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

const getBodyRange = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  return definition?.kind === "Operator" ? definition.bodyRange : undefined;
};

const getPossiblePredicates = (names: string[], environment: Environment): NamedExpression[] =>
  names.map((name, index) => {
    if (names.indexOf(name) !== index) {
      throw new TlaConfigError(`_POSSIBLE lists ${name} more than once`);
    }
    getConfigDefinition("possible", name, environment);
    const expression = createIdentifier(name);
    if (getLevel(expression, undefined, environment) === TEMPORAL_LEVEL) {
      throw new TlaConfigError(
        `The possible of ${name} is equal to a temporal formula; only state- and action-level predicates are supported`,
      );
    }
    return { name, expression, scope: undefined };
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

const WIDE_CHARACTER = /[\u0100-\uffff]/;

const DESERIALIZERS = new Set(["JsonDeserialize", "ndJsonDeserialize"]);

const isWideConfigValue = (value: ConfigValue): boolean =>
  value.kind === "String"
    ? WIDE_CHARACTER.test(value.value)
    : value.kind === "Set" && value.elements.some(isWideConfigValue);

const isWideExpression = (expression: Expression): boolean =>
  (expression.kind === "String" && WIDE_CHARACTER.test(expression.value)) ||
  (expression.kind === "Apply" && DESERIALIZERS.has(expression.operator)) ||
  getChildren(expression).some(isWideExpression);

// TLC fingerprints a string by the low byte of each character, so it merges states whose
// strings differ only above U+00FF. Strings reach a state from literals, the config, or files.
const hasWideString = (config: ModelConfig, environment: Environment) =>
  config.constants.some(
    (constant) =>
      isWideConfigValue(constant.value) || (constant.args ?? []).some(isWideConfigValue),
  ) ||
  [...environment.definitions.values()].some(
    (definition) =>
      isWideExpression(definition.body) ||
      (definition.kind === "Function" &&
        definition.bounds.some((bound) => isWideExpression(bound.set))),
  );

export interface Search {
  properties: Properties;
  spec: Specification;
  getFingerprintState: (state: Value[]) => Value[];
  getTlcOrder: () => number[];
  isSymmetric: boolean;
  findViolatedInvariant: (state: Value[], parent?: Value[]) => StateCheck | undefined;
  satisfiesConstraints: (state: Value[], parent?: Value[]) => boolean;
  findFailedInitialPredicate: (state: Value[]) => NamedExpression | undefined;
  findViolatedActionProperty: (state: Value[], next: Value[]) => ActionProperty | undefined;
  satisfiesActionConstraints: (state: Value[], next: Value[]) => boolean;
  trackStatePossible: (state: Value[]) => void;
  trackActionPossible: (state: Value[], next: Value[]) => void;
  findUnwitnessedPossible: () => Postcondition | undefined;
  findPostconditionViolation: () => Postcondition | undefined;
}

const getContext = (
  environment: Environment,
  state: Value[] | undefined,
  next: Value[] | undefined,
  scope?: Scope,
): Context => ({ environment, scope, state, next });

const holds = (expression: Expression, context: Context, description: string) =>
  expectBoolean(evaluate(expression, context), description);

const ignorePossible = () => {};

const trackPossible = (items: NamedExpression[], runtime: CheckerRuntime, context: Context) =>
  items.forEach((item) => {
    const count = runtime.possibleCounts.get(item.name) ?? 0;
    const isWitnessed = holds(item.expression, context, `_POSSIBLE ${item.name}`);
    runtime.possibleCounts.set(item.name, isWitnessed ? count + 1 : count);
  });

const getConstantFailure = (
  expression: Expression,
  environment: Environment,
  description: string,
) => {
  try {
    return holds(expression, getContext(environment, undefined, undefined), description)
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
    const failure = getConstantFailure(assumption.expression, environment, "an assumption");
    if (failure) {
      const name =
        assumption.name ?? `line ${assumption.location.line}, column ${assumption.location.column}`;
      return { name, trace: [], message: failure.message };
    }
  }
  return undefined;
};

export const createSearch = (
  config: ModelConfig,
  environment: Environment,
  getVariableOrder: () => string[],
): Search | undefined => {
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
  const spec = getSpecification(config, environment);
  if (environment.variables.length === 0) return undefined;
  const symmetryGroup =
    config.symmetry === undefined ? [] : getSymmetryGroup(config.symmetry, environment);
  const view =
    config.view === undefined ? undefined : getNamedExpressions([config.view], environment)[0];
  const constraints = getStateChecks(
    getNamedExpressions(config.constraints, environment),
    environment,
  );
  const actionConstraints = getNamedExpressions(config.actionConstraints, environment);
  const actionProperties = properties.actionProperties.map((property) => {
    const unchanged: Expression = {
      kind: "Unchanged",
      expression: property.subscript,
      location: START,
    };
    return { ...property, unchanged };
  });
  const possible = getPossiblePredicates(config.possible, environment);
  const isActionPossible = (item: NamedExpression) =>
    getLevel(item.expression, undefined, environment) >= ACTION_LEVEL;
  const statePossible = possible.filter((item) => !isActionPossible(item));
  const actionPossible = possible.filter(isActionPossible);
  const runtime = environment.runtime;
  const tlcOrder = { indices: undefined as number[] | undefined };
  const getTlcOrder = () => {
    if (tlcOrder.indices) return tlcOrder.indices;
    const variableOrder = getVariableOrder();
    const getTlcPosition = (index: number) => {
      const position = variableOrder.indexOf(environment.variables[index]);
      return position === -1 ? environment.variables.length : position;
    };
    tlcOrder.indices = environment.variables
      .map((_, index) => index)
      .sort((left, right) => getTlcPosition(left) - getTlcPosition(right));
    return tlcOrder.indices;
  };
  const order = view !== undefined && symmetryGroup.length > 0 ? getTlcOrder() : undefined;
  const getViewValue = (expression: Expression, state: Value[]) =>
    evaluate(expression, getContext(environment, state, undefined));
  const getTlcStateFingerprint = (state: Value[]) => {
    const indices = getTlcOrder();
    const representative =
      symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup, indices);
    return getTlcFingerprint(
      view === undefined
        ? indices.map((index) => representative[index])
        : [getViewValue(view.expression, representative)],
    );
  };
  const isFingerprintedLikeTlc = hasWideString(config, environment);
  runtime.getFingerprint = getTlcStateFingerprint;
  const findUnwitnessedPossible = (): Postcondition | undefined => {
    const unwitnessed = possible.find((item) => !runtime.possibleCounts.get(item.name));
    if (!unwitnessed) return undefined;
    const range = getBodyRange(unwitnessed.name, environment);
    const location = range
      ? ` at line ${range.start.line}, col ${range.start.column} to line ${range.end.line}, col ${range.end.column} of module ${range.module}`
      : "";
    return {
      name: unwitnessed.name,
      message: `The _POSSIBLE predicate ${unwitnessed.name}${location} was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.`,
      counts: prettyPrint(formatValue(getPossibleCounts(runtime), true)),
    };
  };
  return {
    properties,
    spec,
    isSymmetric: symmetryGroup.length > 0,
    getTlcOrder,
    getFingerprintState: (state) => {
      if (isFingerprintedLikeTlc) return [String(getTlcStateFingerprint(state))];
      const representative =
        symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup, order);
      return view === undefined ? representative : [getViewValue(view.expression, representative)];
    },
    findViolatedInvariant: (state, parent) => {
      try {
        return invariants.find(
          (invariant) =>
            !isUnchangedFor(invariant, state, parent) &&
            !holds(
              invariant.expression,
              getContext(environment, state, undefined, invariant.scope),
              `invariant ${invariant.name}`,
            ),
        );
      } catch (error) {
        // TLC reports a failure only on a state after the initial states as an invariant failure.
        throw parent ? setExitCode(error, EXIT_STATUS.safetyEvaluationFailure) : error;
      }
    },
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
      actionProperties.find(
        (property) =>
          !holds(
            property.action,
            getContext(environment, state, next, property.scope),
            `property ${property.name}`,
          ) &&
          !holds(
            property.unchanged,
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
    trackStatePossible:
      statePossible.length === 0
        ? ignorePossible
        : (state) =>
            trackPossible(statePossible, runtime, getContext(environment, state, undefined)),
    trackActionPossible:
      actionPossible.length === 0
        ? ignorePossible
        : (state, next) =>
            trackPossible(actionPossible, runtime, getContext(environment, state, next)),
    findUnwitnessedPossible,
    findPostconditionViolation: () => {
      const unwitnessed = findUnwitnessedPossible();
      if (unwitnessed) return unwitnessed;
      for (const name of config.postconditions) {
        const failure = getConstantFailure(createIdentifier(name), environment, "a postcondition");
        if (failure) {
          return { name, message: failure.message ?? `Postcondition ${name} is false.` };
        }
      }
      return undefined;
    },
  };
};

export const checkSequentially = (options: CheckOptions): CheckResult => {
  setNextStatePhase(false);
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  const print = options.onPrint ?? console.log;
  const module = parseModule(options.source);
  setStringOrder(getTlcStringOrder(options.source, config, options.loadModule));
  const specification = createEnvironment(module, config, {
    loadModule: options.loadModule,
    print,
    files: { readFile: options.readFile, writeFile: options.writeFile },
    seed: options.seed,
  });
  const environment = specification.environment;
  const runtime = environment.runtime;
  runtime.pause = options.onPause ?? (() => {});
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

  const assumptionViolation = findAssumptionViolation(specification.assumptions, environment);
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);

  const search = createSearch(config, environment, () =>
    getTlcVariableOrder(options.source, options.loadModule),
  );
  if (!search) return createResult("success");
  const reportViolation = (
    status: CheckStatus,
    violation: Omit<Violation, "loopStart"> & { loopStart?: number },
  ) => {
    const unwitnessed = search.findUnwitnessedPossible();
    return createResult(status, unwitnessed ? { ...violation, unwitnessed } : violation);
  };
  const properties = search.properties;
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  const isReducing = config.view !== undefined || config.symmetry !== undefined;
  const liveness = withLivenessExitCode(() =>
    createLivenessChecker(properties.liveness, spec.temporals, environment),
  );
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const buckets = new Map<number, number | number[]>();
  const canonicalizeState = createCanonicalizer();

  const toRecord = (state: Value[]) =>
    Object.fromEntries(
      search.getTlcOrder().map((index) => [environment.variables[index], state[index]]),
    );
  const hasFingerprint = (state: Value[], index: number) =>
    isSameState(getFingerprintState(state), fingerprintStates[index]);
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    getSuccessors(spec.next, state, environment).find((successor) =>
      hasFingerprint(successor.state, index),
    );
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial =
      isReducing || isImpure(environment)
        ? getInitialStates(spec.init, environment).find((state) => hasFingerprint(state, path[0]))
        : states[path[0]];
    if (!initial) throw new TlaEvaluationError(INITIAL_RECOVERY_FAILURE);
    const steps: Successor[] = [{ state: initial, action: undefined }];
    for (let position = 1; position < path.length; position++) {
      const previous = steps[position - 1].state;
      if (path[position - 1] === path[position]) {
        steps.push({ state: previous, action: "Stuttering" });
        continue;
      }
      const successor = findSuccessorWithFingerprint(previous, path[position]);
      if (!successor) throw new TlaEvaluationError(nextFailure);
      steps.push(successor);
    }
    return steps;
  };
  const toTrace = (steps: Successor[]): TraceStep[] =>
    steps.map((step) => ({ action: step.action, state: toRecord(step.state) }));
  const getTrace = (index: number, last?: Successor): TraceStep[] => {
    const path: number[] = [];
    for (let current = index; current !== -1; current = parents[current]) path.unshift(current);
    const steps =
      isReducing && path.length > 1
        ? getPathStates(path, INITIAL_RECOVERY_FAILURE)
        : path.map((current) => ({ state: states[current], action: actions[current] }));
    if (!last) return toTrace(steps);
    const action = isReducing
      ? getSuccessors(spec.next, states[index], environment).find((successor) =>
          isSameState(successor.state, last.state),
        )?.action
      : last.action;
    return toTrace([...steps, { state: last.state, action }]);
  };
  const getPathTrace = (path: number[], loopStart?: number) => {
    const steps = getPathStates(path, NEXT_RECOVERY_FAILURE);
    const last = steps[steps.length - 1].state;
    const isClosed =
      !isReducing ||
      loopStart === undefined ||
      loopStart === path.length - 1 ||
      findSuccessorWithFingerprint(last, path[loopStart]) !== undefined;
    if (!isClosed) throw new TlaEvaluationError(NEXT_RECOVERY_FAILURE);
    return toTrace(steps);
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
  };

  const current = {
    index: -1,
    isExpanding: false,
    candidate: undefined as Value[] | undefined,
    candidateLevel: 0,
    livenessSource: -1,
  };
  const getPath = (index: number): Value[][] =>
    index === -1 ? [] : [...getPath(parents[index]), states[index]];
  runtime.getBehavior = (state) => {
    const index = state === current.candidate ? -1 : states.indexOf(state);
    return index === -1 ? [...getPath(current.index), state] : getPath(index);
  };
  runtime.getCurrentState = () => (current.index === -1 ? undefined : states[current.index]);
  runtime.setLivenessSource = (index) => {
    current.livenessSource = index;
  };
  runtime.getLevel = (state) => {
    const source = current.livenessSource;
    if (source !== -1) return state === states[source] ? depths[source] : depths[source] + 1;
    if (state === current.candidate) return current.candidateLevel;
    if (current.index === -1) return 0;
    if (state === states[current.index]) return depths[current.index];
    return current.isExpanding ? depths[current.index] + 1 : 0;
  };

  for (const state of getInitialStates(spec.init, environment)) {
    canonicalizeState(state);
    runtime.generatedStates++;
    runtime.initialStates++;
    current.candidate = state;
    current.candidateLevel = 1;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    const isSeen = findStateIndex(hash, fingerprintState) !== -1;
    const isInModel = isSeen || search.satisfiesConstraints(state);
    if (isInModel) search.trackStatePossible(state);
    if (isSeen) continue;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
      liveness?.addInitialState(states.length, state);
    }
    const violated = search.findViolatedInvariant(state);
    if (violated) {
      return reportViolation("invariant-violation", {
        name: violated.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return reportViolation("liveness-violation", {
        name: failedPredicate.name,
        trace: [{ action: undefined, state: toRecord(state) }],
      });
    }
    if (!isInModel) continue;
    markSeen(hash, states.length);
    addState(state, fingerprintState, -1, undefined);
  }

  setNextStatePhase(true);
  for (let index = 0; index < states.length && !runtime.isStopped; index++) {
    const state = states[index];
    current.index = index;
    runtime.queueSize = states.length - index - 1;
    current.isExpanding = true;
    const successors = getSuccessors(spec.next, state, environment);
    current.isExpanding = false;
    if (successors.length === 0 && config.checkDeadlock) {
      return reportViolation("deadlock", { name: "deadlock", trace: getTrace(index) });
    }
    const liveSuccessors: LiveSuccessor[] = [];
    for (const successor of successors) {
      runtime.generatedStates++;
      current.candidate = successor.state;
      current.candidateLevel = depths[index] + 1;
      if (isCanonicalizedFirst) canonicalizeState(successor.state);
      const fingerprintState = getFingerprintState(successor.state);
      const hash = getStateHash(fingerprintState);
      const found = findStateIndex(hash, fingerprintState);
      const isStateInModel = found !== -1 || search.satisfiesConstraints(successor.state, state);
      if (isStateInModel) search.trackStatePossible(successor.state);
      const isInModel = isStateInModel && search.satisfiesActionConstraints(state, successor.state);
      if (isInModel) search.trackActionPossible(state, successor.state);
      const existing = isInModel ? found : -1;
      if (existing !== -1 && liveness) {
        const stored = states[existing];
        const isStored = stored.every((value, position) => value === successor.state[position]);
        liveSuccessors.push({ index: existing, state: isStored ? stored : successor.state });
      }
      const isNew = isInModel && existing === -1;
      if (isNew) countDistinctState(depths[index] + 1);
      if (existing === -1) {
        const violated = search.findViolatedInvariant(successor.state, state);
        if (violated) {
          return reportViolation("invariant-violation", {
            name: violated.name,
            trace: getTrace(index, successor),
          });
        }
      }
      const violatedProperty = search.findViolatedActionProperty(state, successor.state);
      if (violatedProperty) {
        return reportViolation("liveness-violation", {
          name: violatedProperty.name,
          trace: getTrace(index, successor),
        });
      }
      if (!isNew) continue;
      if (!isCanonicalizedFirst) canonicalizeState(successor.state);
      markSeen(hash, states.length);
      if (liveness) liveSuccessors.push({ index: states.length, state: successor.state });
      addState(successor.state, fingerprintState, index, successor.action);
      runtime.queueSize++;
    }
    const accepted = liveness?.addState(index, state, liveSuccessors);
    current.livenessSource = -1;
    if (accepted) {
      return reportViolation("property-violation", {
        name: accepted.name,
        trace: getPathTrace(accepted.path),
      });
    }
  }

  current.index = -1;
  current.candidate = undefined;
  const lasso = liveness?.findViolation();
  current.livenessSource = -1;
  if (lasso) {
    return reportViolation("liveness-violation", {
      name: lasso.name,
      trace: getPathTrace([...lasso.prefix, ...lasso.cycle], lasso.prefix.length),
      loopStart: lasso.prefix.length,
    });
  }

  const postconditionViolation = search.findPostconditionViolation();
  if (postconditionViolation) {
    return createResult("postcondition-violation", { ...postconditionViolation, trace: [] });
  }
  return createResult("success");
};
