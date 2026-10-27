import type { Assumption, Definition, Expression, SourceLocation } from "./ast";
import { parseConfig, type ConfigValue, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import { getErrorExitCode, TlaConfigError, TlaEvaluationError, TlaModuleError } from "./errors";
import { EXIT_STATUS, setExitCode, setNextStatePhase, withLivenessExitCode } from "./exit-codes";
import {
  describeRange,
  evaluate,
  expectBoolean,
  formatRange,
  getChildren,
  getDefinition,
  isConstantLevel,
  isImpure,
  type Context,
  type Environment,
  type Scope,
} from "./evaluate";
import {
  createLivenessChecker,
  expandTemporal,
  getLevel,
  type Lasso,
  type LiveSuccessor,
  type ScopedExpression,
  type TemporalProperty,
} from "./liveness";
import { ACTION_LEVEL, createLevelAnalyzer, TEMPORAL_LEVEL } from "./levels";
import { prettyPrint } from "./pretty-print";
import {
  forEachInitialState,
  forEachSuccessor,
  getInitialStates,
  getSuccessors,
  type Successor,
} from "./successors";
import {
  getActionLabel,
  getNextActions,
  getSpecificationValue,
  type SpecAction,
} from "./spec-description";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import { createTlcFingerprinter, getTlcFingerprint } from "./tlc-random";
import { createCanonicalizer } from "./canonical";
import { getPossibleCounts, type CheckerRuntime } from "./runtime";
import { createCounterExample } from "./tlc-ext";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc-summary";
import {
  combineHash,
  formatValue,
  getValueHash,
  isFunctionValue,
  isSameValue,
  setStringOrder,
  toFiniteFunction,
  type Value,
} from "./values";

export interface CheckOptions {
  source: string;
  config: string | ModelConfig;
  loadModule?: (name: string) => string | undefined;
  loadClass?: (name: string) => Uint8Array | undefined;
  onPrint?: (text: string) => void;
  onPause?: () => void;
  readFile?: (path: string) => string | undefined;
  writeFile?: (path: string, content: string) => void;
  seed?: bigint;
  workers?: number;
  // TLC's -lncheck: "final" checks liveness only on the complete state graph.
  livenessCheck?: "default" | "final";
}

export type CheckStatus =
  | "success"
  | "assumption-violation"
  | "invariant-violation"
  | "property-violation"
  | "liveness-violation"
  | "postcondition-violation"
  | "deadlock"
  | "error";

export interface TraceStep {
  action: string | undefined;
  // TLC's name, parameters and location for the action that took this step.
  label: string | undefined;
  state: Record<string, Value>;
}

export interface Violation {
  name: string;
  trace: TraceStep[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
}

interface Postcondition {
  name: string;
  message: string;
  counts?: string;
}

// An evaluation that failed during the search, with the behavior up to the state TLC was working on.
export interface EvaluationFailure {
  message: string;
  trace: TraceStep[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
}

export interface CheckResult {
  status: CheckStatus;
  violation: Violation | undefined;
  failure: EvaluationFailure | undefined;
  generatedStates: number;
  distinctStates: number;
  queuedStates: number;
  depth: number;
  // How many states that TLC counts as expanded found each number of new states, when TLC prints
  // the outdegree of the state graph.
  outDegrees: number[] | undefined;
  // The smallest distance between the fingerprints of two distinct states, when TLC estimates a
  // collision from the actual fingerprints.
  fingerprintDistance: bigint | undefined;
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
  box: Expression;
  action: Expression;
  subscript: Expression;
  scope: Scope | undefined;
}

interface Specification {
  init: Expression | undefined;
  next: Expression | undefined;
  scope: Scope | undefined;
  temporals: ScopedExpression[];
}

interface Properties {
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

// TLC leaves the kind out when it rejects arguments to the specification or a property.
const UNNAMED_ARGUMENT_KINDS = new Set(["name", "property"]);

// TLC checks liveness on the graph so far 3 seconds into the search and then every minute, once
// the graph has grown by a tenth and liveness checking has taken at most a fifth of the time.
const PERIODIC_START = 3000;
const PROGRESS_INTERVAL = 60_000;
const LIVENESS_GROWTH = 0.1;
const LIVENESS_RATIO = 0.2;

const getConfigOperator = (kind: string, name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  if (!definition) {
    throw new TlaConfigError(
      `The ${kind} ${name} specified in the configuration file\nis not defined in the specification.`,
    );
  }
  if (definition.kind === "Operator" && definition.params.length > 0) {
    throw new TlaConfigError(
      UNNAMED_ARGUMENT_KINDS.has(kind)
        ? `TLC requires ${name} not to take any argument.`
        : `TLC requires ${kind} not to take any argument, but one was given: ${name}`,
    );
  }
  return definition;
};

const getConfigDefinition = (kind: string, name: string, environment: Environment) => {
  const definition = getConfigOperator(kind, name, environment);
  if (isConstantLevel(definition, environment)) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  return definition;
};

// TLC evaluates every constant definition before it reads the configuration. It keeps a literal
// number or string, and a definition that fails to evaluate, as an operator.
const getConstantValue = (name: string, definition: Definition, environment: Environment) => {
  if (!isConstantLevel(definition, environment)) return undefined;
  if (definition.body.kind === "Number" || definition.body.kind === "String") return undefined;
  try {
    return evaluate(createIdentifier(name), getContext(environment, undefined, undefined));
  } catch (error) {
    if (error instanceof TlaEvaluationError) return undefined;
    throw error;
  }
};

const getConfigPredicate = (kind: string, name: string, environment: Environment) => {
  const definition = getConfigOperator(kind, name, environment);
  const value = getConstantValue(name, definition, environment);
  if (value !== undefined && value !== true) {
    throw new TlaConfigError(`The ${kind} of ${name} is equal to ${formatValue(value)}`);
  }
  return value === undefined ? definition : undefined;
};

const getInvariants = (names: string[], environment: Environment) => {
  const analyzer = createLevelAnalyzer({
    constants: new Set(environment.constants.keys()),
    variables: new Set(environment.variables),
    getDefinition: (name) => getDefinition(name, environment),
  });
  return names.flatMap((name) => {
    const definition = getConfigPredicate("invariant", name, environment);
    if (!definition) return [];
    const levels = analyzer.analyzeDefinition(definition, new Map());
    if (levels.level >= ACTION_LEVEL) {
      const note =
        levels.params.size === 0
          ? ""
          : "\nNote that a bug can cause TLC to incorrectly report this error.\nIf you believe your TLA+ or PlusCal specification to be correct,\nplease check if this bug described in LevelNode.java starting at line 590ff affects you.";
      throw new TlaConfigError(
        `The invariant ${name} is not a state predicate (one with no primes or temporal operators).${note}`,
      );
    }
    return [{ name, expression: createIdentifier(name), scope: undefined }];
  });
};

const toAliasRecord = (value: Value, fieldOrder: string[]) => {
  if (!isFunctionValue(value)) return undefined;
  const record = toFiniteFunction(value);
  if (!record.domain.every((key) => typeof key === "string")) return undefined;
  const entries = record.domain.map((key, index): [string, Value] => [
    String(key),
    record.range[index],
  ]);
  return Object.fromEntries(
    entries.sort((left, right) => fieldOrder.indexOf(left[0]) - fieldOrder.indexOf(right[0])),
  );
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

const getSpecification = (config: ModelConfig, environment: Environment): Specification => {
  if (config.specification === undefined) {
    const getOperator = (name: string | undefined, description: string) => {
      if (name === undefined) return undefined;
      const body = getConfigOperator(description, name, environment).body;
      const identifier = createIdentifier(name);
      // TLC evaluates a literal body later and reports that it is not a boolean.
      const isLiteral = body.kind === "Number" || body.kind === "String";
      if (!isLiteral && getLevel(identifier, undefined, environment) === 0) {
        throw new TlaConfigError(`The ${description} ${name} cannot be a constant.`);
      }
      return identifier;
    };
    return {
      init: getOperator(config.init, "initial predicate"),
      next: getOperator(config.next, "next state action"),
      scope: undefined,
      temporals: [],
    };
  }
  const initConjuncts: ScopedExpression[] = [];
  const nextActions: ScopedExpression[] = [];
  const temporals: ScopedExpression[] = [];
  const definition = getConfigOperator("name", config.specification, environment);
  const value = getConstantValue(config.specification, definition, environment);
  if (value !== undefined) {
    throw new TlaConfigError(
      `The value of ${config.specification} is equal to ${formatValue(value)}`,
    );
  }
  expandTemporal(definition.body, undefined, environment, false).forEach((item) => {
    const conjunct = item.expression;
    if (isConstantTrue(item, environment, "spec")) return;
    if (conjunct.kind === "UnboundedQuantifier" && conjunct.isTemporal) {
      throw setExitCode(
        new TlaConfigError(
          "TLC does not support temporal existential, nor universal, quantification over state variables.",
        ),
        EXIT_STATUS.error,
      );
    }
    if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
      nextActions.push({ expression: conjunct.expression.action, scope: item.scope });
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
    initConjuncts.push(item);
  });
  if (nextActions.length > 1) {
    throw new TlaConfigError(
      `The specification ${config.specification} must contain at most one [][Next]_vars`,
    );
  }
  const items = [...initConjuncts, ...nextActions];
  const getName = (index: number) => `$specification${index}`;
  const scope = items.reduce<Scope | undefined>(
    (parent, item, index) =>
      item.scope === undefined
        ? parent
        : {
            name: getName(index),
            binding: {
              kind: "Thunk",
              expression: item.expression,
              scope: item.scope,
              state: undefined,
              next: undefined,
              cache: undefined,
            },
            parent,
          },
    undefined,
  );
  const getReference = (item: ScopedExpression, index: number): Expression =>
    item.scope === undefined
      ? item.expression
      : {
          kind: "Identifier",
          name: getName(index),
          location: item.expression.location,
          resolution: { kind: "Local" },
        };
  return {
    init:
      initConjuncts.length === 0
        ? undefined
        : { kind: "And", operands: initConjuncts.map(getReference), location: START },
    next: nextActions.length === 0 ? undefined : getReference(nextActions[0], initConjuncts.length),
    scope,
    temporals,
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
    const definition = getConfigPredicate("property", name, environment);
    if (!definition) return;
    expandTemporal(definition.body, undefined, environment, true).forEach((item) => {
      const conjunct = item.expression;
      if (isConstantTrue(item, environment, "property")) return;
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        properties.actionProperties.push({
          name,
          box: conjunct.expression,
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

const getNamedExpressions = (
  kind: string,
  names: string[],
  environment: Environment,
): NamedExpression[] =>
  names.flatMap((name) =>
    getConfigPredicate(kind, name, environment)
      ? [{ name, expression: createIdentifier(name), scope: undefined }]
      : [],
  );

const getBodyRange = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  return definition?.kind === "Operator" ? definition.bodyRange : undefined;
};

const getPossiblePredicates = (names: string[], environment: Environment) =>
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

interface Search {
  properties: Properties;
  spec: Specification;
  getFingerprintState: (state: Value[]) => Value[];
  getStoredFingerprints: (states: Value[][], fingerprintStates: Value[][]) => BigInt64Array;
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
) => ({ environment, scope, state, next });

const holds = (expression: Expression, context: Context, description: string) =>
  expectBoolean(evaluate(expression, context), description);

// TLC names a check that is not a boolean by the location of the predicate it evaluates.
const holdsLikeTlc = (
  expression: Expression,
  context: Context,
  getMessage = getExpectedBoolean,
) => {
  const value = evaluate(expression, context);
  if (typeof value !== "boolean") {
    throw new TlaEvaluationError(getMessage(expression, context.environment));
  }
  return value;
};

// SANY prints a number by its digits and any other expression by its location.
const getExpectedBoolean = (expression: Expression, environment: Environment) => {
  const definition =
    expression.kind === "Identifier" ? getDefinition(expression.name, environment) : undefined;
  const body = definition?.kind === "Operator" ? definition.body : expression;
  const range = definition?.kind === "Operator" ? definition.bodyRange : undefined;
  const location =
    body.kind === "Number"
      ? (body.text ?? String(body.value))
      : range
        ? formatRange(range)
        : describeRange(body);
  return `TLC expected a boolean value, but did not find one. ${location}`;
};

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
      return { name: describeRange(assumption.expression), trace: [], message: failure.message };
    }
  }
  return undefined;
};

export const createSearch = (
  config: ModelConfig,
  environment: Environment,
  getVariableOrder: () => string[],
): Search | undefined => {
  const configInvariants = getInvariants(config.invariants, environment);
  const spec = getSpecification(config, environment);
  const properties = getProperties(config, environment);
  const invariants = getStateChecks([...configInvariants, ...properties.invariants], environment);
  const isCheckingBehaviors =
    invariants.length > 0 ||
    properties.actionProperties.length > 0 ||
    properties.liveness.length > 0;
  if (
    spec.init === undefined &&
    (isCheckingBehaviors ||
      properties.initialPredicates.length > 0 ||
      environment.variables.length > 0)
  ) {
    throw new TlaConfigError("The configuration file did not specify the initial state predicate.");
  }
  if (spec.next === undefined && isCheckingBehaviors) {
    throw new TlaConfigError("The configuration file did not specify the next state predicate.");
  }
  const constraints = getStateChecks(
    getNamedExpressions("constraint", config.constraints, environment),
    environment,
  );
  const actionConstraints = getNamedExpressions(
    "action constraint",
    config.actionConstraints,
    environment,
  );
  if (config.rlReward !== undefined) getConfigOperator("rlreward", config.rlReward, environment);
  if (config.periodic !== undefined) getConfigOperator("periodic", config.periodic, environment);
  const possible = getPossiblePredicates(config.possible, environment);
  if (environment.variables.length === 0) return undefined;
  const symmetryGroup =
    config.symmetry === undefined ? [] : getSymmetryGroup(config.symmetry, environment);
  if (config.view !== undefined) getConfigOperator("view function", config.view, environment);
  const view =
    config.view === undefined
      ? undefined
      : { name: config.view, expression: createIdentifier(config.view), scope: undefined };
  const actionProperties = properties.actionProperties.map((property) => {
    const unchanged: Expression = {
      kind: "Unchanged",
      expression: property.subscript,
      location: START,
    };
    return { ...property, unchanged };
  });
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
  // A representative in TLC's variable order is the one whose fingerprint TLC reports.
  const order = symmetryGroup.length > 0 ? getTlcOrder() : undefined;
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
  const findUnwitnessedPossible = () => {
    const unwitnessed = possible.find((item) => !runtime.possibleCounts.get(item.name));
    if (!unwitnessed) return undefined;
    const range = getBodyRange(unwitnessed.name, environment);
    const location = range ? ` at ${formatRange(range)}` : "";
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
    getStoredFingerprints: (states, fingerprintStates) => {
      if (view !== undefined || isFingerprintedLikeTlc) {
        return BigInt64Array.from(states, getTlcStateFingerprint);
      }
      const indices = getTlcOrder();
      const getFingerprint = createTlcFingerprinter();
      return BigInt64Array.from(fingerprintStates, (state) =>
        getFingerprint(indices.map((index) => state[index])),
      );
    },
    getFingerprintState: (state) => {
      if (isFingerprintedLikeTlc) return [String(getTlcStateFingerprint(state))];
      const representative =
        symmetryGroup.length === 0 ? state : getRepresentative(state, symmetryGroup, order);
      return view === undefined ? representative : [getViewValue(view.expression, representative)];
    },
    findViolatedInvariant: (state, parent) =>
      invariants.find((invariant) => {
        if (isUnchangedFor(invariant, state, parent)) return false;
        try {
          return !holdsLikeTlc(
            invariant.expression,
            getContext(environment, state, undefined, invariant.scope),
          );
        } catch (error) {
          // TLC reports a failure only on a state after the initial states as an invariant failure.
          if (!parent) throw error;
          throw withHeadline(
            setExitCode(error, EXIT_STATUS.safetyEvaluationFailure),
            `Evaluating invariant ${invariant.name} failed.`,
          );
        }
      }),
    satisfiesConstraints: (state, parent) =>
      constraints.every(
        (constraint) =>
          isUnchangedFor(constraint, state, parent) ||
          holdsLikeTlc(constraint.expression, getContext(environment, state, undefined)),
      ),
    findFailedInitialPredicate: (state) =>
      properties.initialPredicates.find(
        (predicate) =>
          !holdsLikeTlc(
            predicate.expression,
            getContext(environment, state, undefined, predicate.scope),
          ),
      ),
    findViolatedActionProperty: (state, next) =>
      actionProperties.find((property) => {
        try {
          return (
            !holdsLikeTlc(
              property.action,
              getContext(environment, state, next, property.scope),
              () =>
                `Attempted to evaluate an expression of form [A]_e, but A was not a boolean.\n${describeRange(property.box)}`,
            ) &&
            !holds(
              property.unchanged,
              getContext(environment, state, next, property.scope),
              "a subscript",
            )
          );
        } catch (error) {
          throw withHeadline(error, `Evaluating action property ${property.name} failed.`);
        }
      }),
    satisfiesActionConstraints: (state, next) =>
      actionConstraints.every((constraint) =>
        holdsLikeTlc(
          constraint.expression,
          getContext(environment, state, next),
          (expression) =>
            `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ${getExpectedBoolean(expression, environment)}`,
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

const withHeadline = (error: unknown, headline: string) =>
  error instanceof TlaEvaluationError
    ? setExitCode(
        new TlaEvaluationError(`${headline}\n${error.message}`, error),
        getErrorExitCode(error),
      )
    : error;

export const checkSequentially = (options: CheckOptions): CheckResult => {
  setNextStatePhase(false);
  const config = typeof options.config === "string" ? parseConfig(options.config) : options.config;
  const onPrint = options.onPrint ?? console.log;
  // TLC prints again while it rebuilds a trace, between the states it prints. Printing those lines
  // before the trace would misplace them, so rebuilding a trace prints nothing.
  const output = { isMuted: false };
  const print = (text: string) => {
    if (!output.isMuted) onPrint(text);
  };
  const withoutOutput = <Result>(rebuild: () => Result) => {
    output.isMuted = true;
    const result = rebuild();
    output.isMuted = false;
    return result;
  };
  setStringOrder(getTlcStringOrder(options.source, config, options.loadModule));
  const specification = createEnvironment(config, {
    source: options.source,
    loadModule: options.loadModule,
    loadClass: options.loadClass,
    print,
    files: { readFile: options.readFile, writeFile: options.writeFile },
    seed: options.seed,
  });
  const environment = specification.environment;
  const runtime = environment.runtime;
  runtime.pause = options.onPause ?? (() => {});
  runtime.getSpecification = () =>
    getSpecificationValue(
      config,
      environment,
      specification.variableLocations,
      specification.instanceActions,
    );
  const statistics = { depth: 0 };
  const createResult = (
    status: CheckStatus,
    violation?: Omit<Violation, "loopStart"> & { loopStart?: number },
    failure?: EvaluationFailure,
  ): CheckResult => ({
    status,
    violation: violation && { ...violation, loopStart: violation.loopStart },
    failure,
    generatedStates: runtime.generatedStates,
    distinctStates: runtime.distinctStates,
    queuedStates: runtime.queueSize,
    depth: runtime.generatedStates === 0 ? 0 : Math.max(statistics.depth, 1),
    outDegrees: undefined,
    fingerprintDistance: undefined,
  });
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const expansion = { newStates: 0 };
  const getOutDegreeBucket = () => Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1);
  // TLC counts the state it was expanding when an evaluation failed.
  const getPartialOutDegrees = () =>
    outDegrees.map((count, degree) => (degree === getOutDegreeBucket() ? count + 1 : count));
  const createSuccess = (): CheckResult => ({
    ...createResult("success"),
    outDegrees: [...outDegrees],
    fingerprintDistance: getFingerprintDistance(
      runtime.distinctStates,
      runtime.generatedStates,
      () =>
        search
          ? search.getStoredFingerprints(states, fingerprintStates)
          : BigInt64Array.from(states, runtime.getFingerprint),
    ),
  });

  const search = createSearch(config, environment, () =>
    getTlcVariableOrder(options.source, options.loadModule),
  );
  const assumptionViolation = findAssumptionViolation(specification.assumptions, environment);
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
  if (!search) return createSuccess();
  const hasPostconditions = config.postconditions.length > 0 || config.possible.length > 0;
  const reportViolation = (
    status: CheckStatus,
    violation: Omit<Violation, "loopStart"> & { loopStart?: number },
    getLoopAction?: () => string | undefined,
  ) => {
    if (hasPostconditions) {
      const start = violation.loopStart;
      runtime.counterExample = createCounterExample(
        violation.trace,
        start === undefined || !getLoopAction ? undefined : { start, action: getLoopAction() },
      );
    }
    const unwitnessed = search.findUnwitnessedPossible();
    if (!unwitnessed) search.findPostconditionViolation();
    return createResult(status, unwitnessed ? { ...violation, unwitnessed } : violation);
  };
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  const nextActions = { value: undefined as SpecAction[] | undefined };
  const isReducing = config.view !== undefined || config.symmetry !== undefined;
  const liveness = withLivenessExitCode(() =>
    createLivenessChecker(search.properties.liveness, spec.temporals, environment),
  );
  const isCanonicalizedFirst = search.isSymmetric || liveness !== undefined;

  const states: Value[][] = [];
  const fingerprintStates: Value[][] = [];
  const parents: number[] = [];
  const actions: (string | undefined)[] = [];
  const depths: number[] = [];
  const buckets = new Map<number, number | number[]>();
  const canonicalizeState = createCanonicalizer();

  const toRecord = (state: Value[]): Record<string, Value> =>
    Object.fromEntries(
      search.getTlcOrder().map((index) => [environment.variables[index], state[index]]),
    );
  const getAliasState = (
    alias: string,
    steps: Successor[],
    position: number,
    loopStart: number | undefined,
  ) => {
    const state = steps[position].state;
    const next = (steps[position + 1] ?? steps[loopStart ?? position]).state;
    // TLC evaluates TLCGet("level") and Trace in an alias at the state's position in the trace.
    runtime.getLevel = () => position + 1;
    runtime.getBehavior = () => steps.slice(0, position + 1).map((step) => step.state);
    try {
      const body = getConfigDefinition("alias", alias, environment).body;
      const value = evaluate(createIdentifier(alias), getContext(environment, state, next));
      const fieldOrder = body.kind === "Record" ? body.fields.map((field) => field.name) : [];
      return toAliasRecord(value, fieldOrder) ?? toRecord(state);
    } catch (error) {
      if (!(error instanceof TlaConfigError || error instanceof TlaEvaluationError)) throw error;
      return { ...toRecord(state), _ALIASEvalError: error.message };
    }
  };
  // TLC labels a step with the first action that takes it, evaluated as when the search expanded
  // the previous state.
  const getLabel = (index: number, previous: Value[], state: Value[]) => {
    nextActions.value ??= getNextActions(config, environment, specification.instanceActions);
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
    const fingerprintState = getFingerprintState(state);
    const action = nextActions.value.find((item) =>
      getSuccessors(item.expression, previous, environment, item.scope).some((successor) =>
        isSameState(getFingerprintState(successor.state), fingerprintState),
      ),
    );
    Object.assign(current, expanding);
    return action && getActionLabel(action);
  };
  const toTrace = (steps: Successor[], path: number[], loopStart?: number): TraceStep[] => {
    const alias = config.alias;
    const labels = withoutOutput(() => {
      // TLC rebuilds a trace from the initial predicate, which can reset what TLCSet stored.
      if (steps.length > 1 && isImpure(environment)) getSpecInitialStates();
      // TLC finds the action that takes each step before it evaluates the alias.
      return steps.map((step, position) =>
        position === 0 || step.action === "Stuttering"
          ? undefined
          : getLabel(path[position - 1], steps[position - 1].state, step.state),
      );
    });
    return steps.map((step, position) => ({
      action: step.action,
      label: labels[position],
      state:
        alias === undefined
          ? toRecord(step.state)
          : getAliasState(alias, steps, position, loopStart),
    }));
  };
  const getSpecInitialStates = () =>
    spec.init === undefined ? [] : getInitialStates(spec.init, environment, spec.scope);
  const getTraceSuccessors = (state: Value[]) =>
    spec.next === undefined ? [] : getSuccessors(spec.next, state, environment, spec.scope);
  const hasFingerprint = (state: Value[], index: number) =>
    isSameState(getFingerprintState(state), fingerprintStates[index]);
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    getTraceSuccessors(state).find((successor) => hasFingerprint(successor.state, index));
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial =
      isReducing || isImpure(environment)
        ? getSpecInitialStates().find((state) => hasFingerprint(state, path[0]))
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
  const getTrace = (index: number, last?: Successor) => {
    const path: number[] = [];
    for (let position = index; position !== -1; position = parents[position]) {
      path.unshift(position);
    }
    const steps =
      isReducing && path.length > 1
        ? getPathStates(path, INITIAL_RECOVERY_FAILURE)
        : path.map((position) => ({ state: states[position], action: actions[position] }));
    if (!last) return toTrace(steps, path);
    const action = isReducing
      ? getTraceSuccessors(states[index]).find((successor) =>
          isSameState(successor.state, last.state),
        )?.action
      : last.action;
    return toTrace([...steps, { state: last.state, action }], path);
  };
  // TLC prints an initial state on its own without evaluating the alias.
  const getStateTrace = (index: number) =>
    parents[index] === -1
      ? [{ action: undefined, label: undefined, state: toRecord(states[index]) }]
      : getTrace(index);
  // TLC names the initial state it was checking unless a standard module's Java code failed.
  const toFailure = (
    error: unknown,
    trace: TraceStep[],
    initialState?: Value[],
    failureOutDegrees?: number[],
  ) => {
    if (!(error instanceof TlaEvaluationError)) throw error;
    return {
      ...createResult("error", undefined, {
        message: error.message,
        trace,
        initialState:
          initialState && !(error instanceof TlaModuleError) ? toRecord(initialState) : undefined,
        exitCode: getErrorExitCode(error),
      }),
      outDegrees: failureOutDegrees,
    };
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
    return toTrace(steps, path, loopStart);
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
  runtime.isSeen = (state) => {
    const fingerprintState = getFingerprintState(state);
    return findStateIndex(getStateHash(fingerprintState), fingerprintState) !== -1;
  };
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

  const visitInitialState = (state: Value[]) => {
    canonicalizeState(state);
    runtime.generatedStates++;
    runtime.initialStates++;
    current.candidate = state;
    current.candidateLevel = 1;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    const isInModel = search.satisfiesConstraints(state);
    if (isInModel) search.trackStatePossible(state);
    const isSeen = isInModel && findStateIndex(hash, fingerprintState) !== -1;
    if (isSeen) return undefined;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
      liveness?.addInitialState(states.length, state);
    }
    const violated = search.findViolatedInvariant(state);
    if (violated) {
      return reportViolation("invariant-violation", {
        name: violated.name,
        trace: toTrace([{ action: undefined, state }], []),
      });
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return reportViolation("liveness-violation", {
        name: failedPredicate.name,
        trace: toTrace([{ action: undefined, state }], []),
      });
    }
    if (!isInModel) return undefined;
    markSeen(hash, states.length);
    addState(state, fingerprintState, -1, undefined);
    return undefined;
  };
  const visitSuccessor = (index: number, successor: Successor, liveSuccessors: LiveSuccessor[]) => {
    const state = states[index];
    runtime.generatedStates++;
    current.candidate = successor.state;
    current.candidateLevel = depths[index] + 1;
    if (isCanonicalizedFirst) canonicalizeState(successor.state);
    const fingerprintState = getFingerprintState(successor.state);
    const hash = getStateHash(fingerprintState);
    const found = findStateIndex(hash, fingerprintState);
    const isStateInModel = search.satisfiesConstraints(successor.state, state);
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
    if (isNew) {
      countDistinctState(depths[index] + 1);
      expansion.newStates++;
    }
    if (existing === -1) {
      try {
        const violated = search.findViolatedInvariant(successor.state, state);
        if (violated) {
          return reportViolation("invariant-violation", {
            name: violated.name,
            trace: getTrace(index, successor),
          });
        }
      } catch (error) {
        // TLC prints the outdegree when it cannot reproduce the failure, as for an invariant here.
        return toFailure(error, getTrace(index, successor), undefined, getPartialOutDegrees());
      }
    }
    const violatedProperty = search.findViolatedActionProperty(state, successor.state);
    if (violatedProperty) {
      return reportViolation("liveness-violation", {
        name: violatedProperty.name,
        trace: getTrace(index, successor),
      });
    }
    if (!isNew) return undefined;
    if (!isCanonicalizedFirst) canonicalizeState(successor.state);
    markSeen(hash, states.length);
    if (liveness) liveSuccessors.push({ index: states.length, state: successor.state });
    addState(successor.state, fingerprintState, index, successor.action);
    runtime.queueSize++;
    return undefined;
  };

  const outcome: { result: CheckResult | undefined } = { result: undefined };
  if (spec.init !== undefined) {
    try {
      forEachInitialState(
        spec.init,
        environment,
        (state) => {
          try {
            outcome.result = visitInitialState(state);
          } catch (error) {
            outcome.result = toFailure(error, [], state);
          }
          return outcome.result !== undefined;
        },
        spec.scope,
      );
    } catch (error) {
      return toFailure(error, []);
    }
  }
  if (outcome.result) return outcome.result;

  const next = spec.next;
  if (next === undefined) {
    if (states.length > 0) {
      throw new TlaEvaluationError(
        "No next state actions defined to generate successor states from.",
      );
    }
    return createSuccess();
  }
  const expandState = (index: number) => {
    const state = states[index];
    const liveSuccessors: LiveSuccessor[] = [];
    const successorCount = forEachSuccessor(
      next,
      state,
      environment,
      (successor) => {
        try {
          outcome.result = visitSuccessor(index, successor, liveSuccessors);
        } catch (error) {
          outcome.result = toFailure(error, getTrace(index, successor));
        }
        return outcome.result !== undefined;
      },
      spec.scope,
    );
    current.isExpanding = false;
    if (outcome.result) return outcome.result;
    if (successorCount === 0 && config.checkDeadlock) {
      return reportViolation("deadlock", { name: "deadlock", trace: getStateTrace(index) });
    }
    try {
      const accepted = liveness?.addState(index, state, liveSuccessors);
      current.livenessSource = -1;
      if (!accepted) return undefined;
      return reportViolation("property-violation", {
        name: accepted.name,
        trace: getPathTrace(accepted.path),
      });
    } catch (error) {
      return toFailure(error, getStateTrace(index), undefined, getPartialOutDegrees());
    }
  };
  const reportLasso = (lasso: Lasso) => {
    const path = [...lasso.prefix, ...lasso.cycle];
    const trace = getPathTrace(path, lasso.prefix.length);
    const back = path[lasso.prefix.length];
    const last = path[path.length - 1];
    const loopLabel =
      back === last ? undefined : withoutOutput(() => getLabel(last, states[last], states[back]));
    return reportViolation(
      "liveness-violation",
      { name: lasso.name, trace, loopStart: lasso.prefix.length, loopLabel },
      () =>
        back === last
          ? trace[trace.length - 1].action
          : getTraceSuccessors(states[last]).find((successor) =>
              isSameState(successor.state, states[back]),
            )?.action,
    );
  };
  const isPeriodic = liveness !== undefined && options.livenessCheck !== "final";
  const startedAt = performance.now();
  const periodic = { at: startedAt + PERIODIC_START, size: 1, time: 0 };
  const findPeriodicViolation = (expanded: number) => {
    const now = performance.now();
    periodic.at = now + PROGRESS_INTERVAL;
    const isGrown = (expanded - periodic.size) / periodic.size > LIVENESS_GROWTH;
    if (!isGrown || periodic.time > (now - startedAt) * LIVENESS_RATIO) return undefined;
    periodic.size = expanded;
    const lasso = liveness?.findViolation();
    current.livenessSource = -1;
    periodic.time += performance.now() - now;
    return lasso;
  };
  setNextStatePhase(true);
  for (let index = 0; index < states.length && !runtime.isStopped; index++) {
    current.index = index;
    current.candidate = undefined;
    runtime.queueSize = states.length - index - 1;
    current.isExpanding = true;
    try {
      outcome.result = expandState(index);
    } catch (error) {
      outcome.result = toFailure(error, getStateTrace(index));
    }
    if (outcome.result) return outcome.result;
    outDegrees[getOutDegreeBucket()]++;
    expansion.newStates = 0;
    if (isPeriodic && performance.now() >= periodic.at) {
      const lasso = findPeriodicViolation(index + 1);
      if (lasso) return reportLasso(lasso);
    }
  }

  current.index = -1;
  current.candidate = undefined;
  const lasso = liveness?.findViolation();
  current.livenessSource = -1;
  if (lasso) return reportLasso(lasso);

  const postconditionViolation = search.findPostconditionViolation();
  if (postconditionViolation) {
    return createResult("postcondition-violation", { ...postconditionViolation, trace: [] });
  }
  return createSuccess();
};
