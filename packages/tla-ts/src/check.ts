import {
  getChildren,
  isLocallyResolved,
  type Assumption,
  type Definition,
  type Expression,
  type SourceLocation,
} from "./ast";
import { parseConfig, type ConfigValue, type ModelConfig } from "./config";
import { getReadVariables } from "./dependencies";
import { createEnvironment } from "./environment";
import {
  getErrorExitCode,
  TlaConfigError,
  TlaEvaluationError,
  TlaIncompleteSuccessorError,
  TlaModuleError,
  getUnexpectedException,
  UNEXPECTED_EXCEPTION,
} from "./errors";
import type { JavaOverride } from "./java-overrides";
import { EXIT_STATUS, getExitCode, setExitCode, withLivenessExitCode } from "./exit-codes";
import {
  describeNode,
  describeRange,
  createTracingEnvironment,
  evaluate,
  evaluateStartupDefinitions,
  expectBoolean,
  formatRange,
  getDefinition,
  isConstantLevel,
  isImpure,
  type CallStack,
  type Context,
  type Environment,
  type FingerprintFailure,
  type Scope,
} from "./evaluate";
import {
  createLivenessChecker,
  type Lasso,
  type LivenessChecker,
  type LiveSuccessor,
} from "./live-check";
import { expandTemporal, getLevel, type ScopedExpression, type TemporalProperty } from "./liveness";
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
  getActionSignature,
  getInitActions,
  getNextActions,
  getSpecificationValue,
  toActionValue,
  type SpecAction,
} from "./spec-description";
import {
  createStateWriter,
  type GraphState,
  type StateDump,
  type StateWriter,
} from "./state-graph";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { getTlcStringOrder, getTlcVariableOrder } from "./tlc-order";
import {
  formatNestedMessage,
  getCodedMessage,
  isEvalException,
  MESSAGE_CODE,
  MISSING_INIT_174,
} from "./tlc-messages";
import { replayInitialStates, replaySuccessors } from "./tlc-replay";
import { createTlcFingerprinter, getTlcFingerprint } from "./tlc-random";
import { createCanonicalizer } from "./canonical";
import { getPossibleCounts, type CheckerRuntime } from "./runtime";
import { createActionRecord, createCounterExample } from "./tlc-ext";
import { getFingerprintDistance, OUT_DEGREE_BUCKETS } from "./tlc-summary";
import type { TlcVersion } from "./tlc-version";
import {
  combineHash,
  createModelValue,
  formatState,
  formatValue,
  getHeldValues,
  getFingerprintError,
  markFingerprinted,
  getValueHash,
  isFunctionValue,
  isSameValue,
  isUpdatedElementOf,
  setStringOrder,
  setValueVersion,
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
  // TLC's -dump: writes the reachable states, or with `dot` the state graph, through writeFile.
  dump?: StateDump;
  // TLC's -tool, which changes the messages of TLC's errors.
  isTool?: boolean;
  // Whether TLC records a binary trace for its trace exploration spec, for which it loads Integers.
  isTraceRecorded?: boolean;
  // False for TLC's -nowarning, which changes how TLC computes the successors of some actions.
  isWarningEnabled?: boolean;
  // The TLC whose output tla-ts reproduces, which changes how TLC labels an action.
  version?: TlcVersion;
  // Reports the points of the search at which TLC prints a message.
  onProgress?: (progress: CheckProgress) => void;
}

export interface InitialStatesProgress {
  kind: "initial-states-progress";
  count: number;
}

// A check that TLC's DoInitFunctor reports as violated before it stops its replay of the initial
// states.
export interface InitialStateViolation {
  kind: "initial-state-violation";
  status: "invariant-violation" | "liveness-violation";
  name: string;
  state: Record<string, Value>;
}

// A line the spec prints, or what TLC reports as it replays the initial states.
export type OutputLine = string | InitialStatesProgress | InitialStateViolation;

// The spec is parsed, TLC warns about each invariant that is a true constant formula and each
// property that is a state formula, finds the branches of the temporal properties, computes the
// initial states, reporting each time their count reaches a power of two, reports how far the
// search got 3 seconds after it starts and every minute after, and checks the temporal properties
// on the state graph so far at those times and on the complete state graph at the end.
export type CheckProgress =
  | { kind: "parsed" }
  | { kind: "constant-level-invariant"; name: string }
  | { kind: "state-level-property"; name: string }
  | { kind: "liveness-initializing"; isSymmetric: boolean; isConstrained: boolean }
  | { kind: "liveness-prepared"; branches: number }
  | { kind: "initial-states-started" }
  | InitialStatesProgress
  | { kind: "initial-states-computed"; initialStates: InitialStates }
  | { kind: "progress"; statistics: SearchStatistics }
  | {
      kind: "liveness-started";
      branches: number;
      // Whether TLC checks the complete state graph, and how many states of it each branch has.
      isComplete: boolean;
      states: number;
      statistics: SearchStatistics;
    }
  | { kind: "liveness-finished" }
  // A warning TLC prints as it evaluates the spec, with its message code.
  | { kind: "warning"; code: number; text: string }
  // A method of the class named after a module, which TLC reports as it loads the class.
  | ({ kind: "java-override" } & JavaOverride);

export interface SearchStatistics extends Pick<
  CheckResult,
  "generatedStates" | "distinctStates" | "queuedStates" | "depth"
> {}

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
  // What the spec prints, before TLC prints this step, as TLC evaluates it again to rebuild the
  // trace. The first step has what TLC prints before the trace.
  output?: OutputLine[];
}

export interface Violation {
  name: string;
  // Every temporal property that a liveness counterexample violates, in the configuration's order.
  properties?: string[];
  trace: TraceStep[];
  // What the spec prints after TLC prints the states of the trace, as TLC finds the step back into
  // the cycle of a lasso or rebuilds the trace once more.
  traceOutput?: OutputLine[];
  loopStart: number | undefined;
  loopLabel?: string;
  message?: string;
  counts?: string;
  unwitnessed?: Postcondition;
  // A POSTCONDITION that is false or fails after the counterexample, which TLC checks as it
  // prints one.
  postcondition?: Postcondition;
  // What TLC warns about after a counterexample, with its code.
  warning?: { code: number; text: string };
}

interface Postcondition {
  name: string;
  // TLC's message code.
  code: number;
  message: string;
  counts?: string;
}

// An evaluation that failed during the search, with the behavior up to the state TLC was working on.
export interface EvaluationFailure {
  // TLC's code for the message, and its text with and without -tool.
  code: number;
  message: string;
  toolMessage: string;
  trace: TraceStep[];
  traceOutput?: OutputLine[];
  initialState: Record<string, Value> | undefined;
  exitCode: number;
  // The expressions TLC was evaluating when the failure occurred, outermost first, when TLC finds
  // them by replaying the failure.
  callStack: Expression[] | undefined;
  // Whether TLC prints the call stack before the error, as it does for a failed liveness check.
  isCallStackFirst?: boolean;
  // The FingerprintException the replay raises, which TLC reports in place of the call stack.
  fingerprint?: FingerprintFailure;
  // How TLC reports failing again as it prints the trace, since it can't fingerprint the state the
  // failure occurred in.
  traceFailure?: FailureMessage;
  // A POSTCONDITION that is false or fails after the trace, which TLC checks as it prints one.
  postcondition?: Postcondition;
}

// Where TLC's replay of a failure fails.
interface ReplayFailure {
  callStack: Expression[];
  fingerprint: FingerprintFailure | undefined;
}

export interface InitialStates {
  generated: number;
  distinct: number;
}

export interface CheckResult {
  status: CheckStatus;
  violation: Violation | undefined;
  failure: EvaluationFailure | undefined;
  generatedStates: number;
  distinctStates: number;
  queuedStates: number;
  depth: number;
  // How many initial states TLC generated and how many of them were distinct, once it computed
  // them all without a violation or an error.
  initialStates: InitialStates | undefined;
  // How many states that TLC counts as expanded found each number of new states, when TLC prints
  // the outdegree of the state graph.
  outDegrees: number[] | undefined;
  // The smallest distance between the fingerprints of two distinct states, when TLC estimates a
  // collision from the actual fingerprints.
  fingerprintDistance: bigint | undefined;
  // A temporal property TLC finds violated as it adds a deadlocked state to the behavior graph,
  // which it reports after the deadlock.
  additionalViolation?: Violation;
  // Where TLC's worker fails to add the state to the behavior graph after it reports a violation.
  liveCallStack?: Expression[];
  // How many states that TLC counts as expanded found each number of new states, when its workers
  // stop on a violation without an error code, which TLC 1.7.4 reports as a successful search.
  violationOutDegrees?: number[];
}

interface Behavior {
  trace: TraceStep[];
  traceOutput?: OutputLine[];
}

interface TraceOptions {
  loopStart?: number;
  known?: number;
}

interface FailureOptions {
  initialState?: Value[];
  isInitial?: boolean;
  outDegrees?: number[];
  callStack?: Expression[];
  fingerprint?: FingerprintFailure;
  isNextState?: boolean;
  isCallStackFirst?: boolean;
  traceFailure?: FailureMessage;
  // Whether the call stack is of adding the state to the behavior graph, which TLC prints instead
  // of replaying the error.
  isLiveCallStack?: boolean;
}

// TLC prints what the spec prints as it replays a failure after the trace.
const appendTraceOutput = <Traced extends Behavior>(behavior: Traced, lines: OutputLine[]) => ({
  ...behavior,
  traceOutput: [...(behavior.traceOutput ?? []), ...lines],
});

interface NamedExpression {
  name: string;
  expression: Expression;
  scope: Scope | undefined;
}

interface StateCheck extends NamedExpression {
  variables: number[] | undefined;
  membership: Membership | undefined;
  // The whole predicate that TLC evaluates for the check, of which the expression is a conjunct.
  predicate: Expression;
}

// A conjunct `x \in S` whose S reads no variables.
interface Membership {
  variable: number;
  set: Expression;
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

// TLC takes for an operator only a definition it hasn't replaced with its value.
const getConfigDefinition = (kind: string, name: string, environment: Environment) => {
  const definition = getConfigOperator(kind, name, environment);
  if (getConstantValue(name, definition, environment) !== undefined) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  return definition;
};

// TLC also takes a constant that the configuration assigns a value, which must be TRUE.
const getConfigPredicate = (kind: string, name: string, environment: Environment) => {
  const definition = environment.constants.has(name)
    ? undefined
    : getConfigOperator(kind, name, environment);
  const value = definition
    ? getConstantValue(name, definition, environment)
    : environment.constants.get(name);
  if (value !== undefined && value !== true) {
    throw new TlaConfigError(`The ${kind} of ${name} is equal to ${formatValue(value)}`);
  }
  return value === undefined ? definition : undefined;
};

// TLC reports how many initial states it has computed each time the count is a power of two.
export const reportInitialStatesProgress = (
  count: number,
  onProgress: ((progress: InitialStatesProgress) => void) | undefined,
) => {
  if (count > 1 && (count & (count - 1)) === 0) {
    onProgress?.({ kind: "initial-states-progress", count });
  }
};

// What TLC does once SANY is done: it computes the constant definitions, then warns about each
// invariant that is a true constant formula, which it doesn't check. TLC prints each distinct
// warning once.
export const reportStartup = (
  specification: {
    environment: Environment;
    startupDefinitions: Definition[];
    javaOverrides: JavaOverride[];
  },
  config: ModelConfig,
  onProgress: CheckOptions["onProgress"],
) => {
  const environment = specification.environment;
  const warned = new Set<string>();
  environment.runtime.warn = (code, text) => {
    if (warned.has(text)) return;
    warned.add(text);
    onProgress?.({ kind: "warning", code, text });
  };
  onProgress?.({ kind: "parsed" });
  // TLC loads the classes of the modules before it computes the constant definitions.
  specification.javaOverrides.forEach((override) =>
    onProgress?.({ kind: "java-override", ...override }),
  );
  evaluateStartupDefinitions(specification.startupDefinitions, environment);
  config.invariants.forEach((name) => {
    if (!getConfigPredicate("invariant", name, environment)) {
      onProgress?.({ kind: "constant-level-invariant", name });
    }
  });
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
      throw setExitCode(
        new TlaConfigError(
          `The invariant ${name} is not a state predicate (one with no primes or temporal operators).${note}`,
        ),
        EXIT_STATUS.safetyEvaluationFailure,
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
      getConfigDefinition(description, name, environment);
      return createIdentifier(name);
    };
    return {
      init: getOperator(config.init, "initial predicate"),
      next: getOperator(config.next, "next state action"),
      scope: undefined,
      temporals: [],
    };
  }
  if (config.init !== undefined || config.next !== undefined) {
    throw new TlaConfigError(
      "The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.",
    );
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
      // TLC accepts the spec and fails when it builds the tableau of the temporal formulas.
      throw setExitCode(
        new TlaEvaluationError(
          `TLC cannot handle the temporal formula ${describeRange(conjunct.expression)}`,
        ),
        EXIT_STATUS.error,
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

const getProperties = (
  config: ModelConfig,
  environment: Environment,
  onProgress: CheckOptions["onProgress"],
): Properties => {
  const properties: Properties = {
    initialPredicates: [],
    invariants: [],
    actionProperties: [],
    liveness: [],
  };
  config.properties.forEach((name) => {
    const definition = getConfigPredicate("property", name, environment);
    if (!definition) return;
    // TLC checks a property that is a state formula only on the initial states, so it warns about
    // one as it processes the property, before the constraints.
    if (getLevel(definition.body, undefined, environment) === 1) {
      onProgress?.({ kind: "state-level-property", name });
    }
    // TLC 1.7.4 doesn't unroll a property that quantifies over a constant set.
    const isUnrollingForall = environment.runtime.version !== "1.7.4";
    expandTemporal(definition.body, undefined, environment, isUnrollingForall).forEach((item) => {
      const conjunct = item.expression;
      if (isConstantTrue(item, environment, "property")) return;
      const partName = item.name ?? name;
      if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
        properties.actionProperties.push({
          name: partName,
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
        // TLC names the invariant by the operator the property asserts always holds, when it
        // applies the operator to no arguments.
        const body = conjunct.expression;
        properties.invariants.push({
          name: body.kind === "Identifier" ? body.name : partName,
          expression: body,
          scope: item.scope,
        });
        return;
      }
      const level = getLevel(conjunct, item.scope, environment);
      if (level < ACTION_LEVEL) {
        properties.initialPredicates.push({
          name: partName,
          expression: conjunct,
          scope: item.scope,
        });
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

const getMembership = (
  expression: Expression,
  variables: number[] | undefined,
  environment: Environment,
): Membership | undefined => {
  if (expression.kind !== "Apply" || expression.operator !== "\\in" || variables?.length !== 1)
    return undefined;
  const element = expression.args[0];
  if (element.kind !== "Identifier" || isLocallyResolved(element)) return undefined;
  return environment.variableIndex.get(element.name) === variables[0]
    ? { variable: variables[0], set: expression.args[1] }
    : undefined;
};

// TLC evaluates the body of an invariant that the configuration names.
const getPredicate = (expression: Expression, environment: Environment) => {
  if (expression.kind !== "Identifier" || environment.constants.has(expression.name)) {
    return expression;
  }
  const definition = getDefinition(expression.name, environment);
  return definition?.kind === "Operator" && definition.params.length === 0
    ? definition.body
    : expression;
};

const getStateChecks = (named: NamedExpression[], environment: Environment): StateCheck[] =>
  named.flatMap((item) =>
    getConjuncts(item.expression, environment).map((expression) => {
      // A LET or an argument in the scope can read variables the expression doesn't name.
      const variables =
        item.scope === undefined ? getReadVariables(expression, environment) : undefined;
      return {
        name: item.name,
        expression,
        scope: item.scope,
        variables,
        membership: getMembership(expression, variables, environment),
        predicate: getPredicate(item.expression, environment),
      };
    }),
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
  // TLC drops a constraint that is a true constant formula.
  isConstrained: boolean;
  findViolatedInvariant: (state: Value[], parent?: Value[]) => StateCheck | undefined;
  // The checks of a state that TLC evaluates when it replays the computation of the initial states
  // or of the successors of a state, with an environment that records the call stack. The first
  // returns the check that stops the replay, and the second false where TLC stops it.
  // TLC fingerprints a replayed state that satisfies the constraints before it checks the rest.
  checkReplayedInitialState: (
    state: Value[],
    tracing: Environment,
    addFingerprint: () => void,
  ) => Pick<InitialStateViolation, "status" | "name"> | undefined;
  // Adding the fingerprint of a successor tells whether TLC had not seen it yet.
  checkReplayedSuccessor: (
    state: Value[],
    next: Value[],
    tracing: Environment,
    addFingerprint: () => boolean,
  ) => boolean;
  satisfiesConstraints: (state: Value[], parent?: Value[]) => boolean;
  findFailedInitialPredicate: (state: Value[]) => NamedExpression | undefined;
  findViolatedActionProperty: (state: Value[], next: Value[]) => ActionProperty | undefined;
  satisfiesActionConstraints: (state: Value[], next: Value[]) => boolean;
  trackStatePossible: (state: Value[]) => void;
  trackActionPossible: (state: Value[], next: Value[]) => void;
  findUnwitnessedPossible: () => Postcondition | undefined;
  // After a counterexample, TLC skips the postconditions when one of them is constant.
  findPostconditionViolation: (isAfterViolation?: boolean) => Postcondition | undefined;
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

const getExpectedBoolean = (expression: Expression, environment: Environment) => {
  const definition =
    expression.kind === "Identifier" ? getDefinition(expression.name, environment) : undefined;
  const body = definition?.kind === "Operator" ? definition.body : expression;
  const range = definition?.kind === "Operator" ? definition.bodyRange : undefined;
  const location = range && body.kind !== "Number" ? formatRange(range) : describeNode(body);
  return `TLC expected a boolean value, but did not find one. ${location}`;
};

// TLC evaluates the whole predicate of a check, which fails at a conjunct that isn't a boolean as
// the conjunction does.
const holdsAsConjunct = (check: StateCheck, context: Context) =>
  holdsLikeTlc(check.expression, context, (expression, environment) => {
    holdsLikeTlc(check.predicate, context);
    return getExpectedBoolean(expression, environment);
  });

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
  onProgress?: CheckOptions["onProgress"],
): Search | undefined => {
  const configInvariants = getInvariants(config.invariants, environment);
  const spec = getSpecification(config, environment);
  const properties = getProperties(config, environment, onProgress);
  const invariants = getStateChecks([...configInvariants, ...properties.invariants], environment);
  // The invariants TLC evaluates, each of which may have several conjuncts among the checks.
  const invariantPredicates = [
    ...new Map(invariants.map((invariant) => [invariant.predicate, invariant])).values(),
  ];
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
    throw new TlaConfigError(
      environment.runtime.version === "1.7.4"
        ? MISSING_INIT_174
        : "The configuration file did not specify the initial state predicate.",
    );
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
    config.symmetry === undefined
      ? []
      : getSymmetryGroup(config.symmetry, environment, config.substitutions);
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
      code: MESSAGE_CODE.possibleUnwitnessed,
      message: `The _POSSIBLE predicate ${unwitnessed.name}${location} was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.`,
      counts: prettyPrint(formatValue(getPossibleCounts(runtime), true)),
    };
  };
  return {
    properties,
    spec,
    isSymmetric: symmetryGroup.length > 0,
    isConstrained: constraints.length > 0 || actionConstraints.length > 0,
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
          const context = getContext(environment, state, undefined, invariant.scope);
          const membership = invariant.membership;
          // The parent satisfies every invariant, so only the entries the step changed can fail.
          return parent && membership
            ? !isUpdatedElementOf(
                state[membership.variable],
                parent[membership.variable],
                evaluate(membership.set, context),
              )
            : !holdsAsConjunct(invariant, context);
        } catch (error) {
          // TLC reports a failure only on a state after the initial states as an invariant failure.
          if (!parent) throw error;
          throw withHeadline(
            setExitCode(error, EXIT_STATUS.safetyEvaluationFailure),
            MESSAGE_CODE.invariantEvaluationFailed,
            `Evaluating invariant ${invariant.name} failed.`,
          );
        }
      }),
    checkReplayedInitialState: (state, tracing, addFingerprint) => {
      const holdsIn = (expression: Expression, scope: Scope | undefined) =>
        holdsLikeTlc(expression, getContext(tracing, state, undefined, scope));
      if (constraints.every((constraint) => holdsIn(constraint.predicate, constraint.scope))) {
        addFingerprint();
      }
      const invariant = invariantPredicates.find((check) => !holdsIn(check.predicate, check.scope));
      if (invariant) return { status: "invariant-violation", name: invariant.name };
      const predicate = properties.initialPredicates.find(
        (check) => !holdsIn(check.expression, check.scope),
      );
      return predicate && { status: "liveness-violation", name: predicate.name };
    },
    checkReplayedSuccessor: (state, next, tracing, addFingerprint) => {
      // TLC evaluates the action constraints only on a state that satisfies the constraints.
      const isInModel =
        constraints.every((constraint) =>
          holdsLikeTlc(
            constraint.predicate,
            getContext(tracing, next, undefined, constraint.scope),
          ),
        ) &&
        actionConstraints.every((constraint) =>
          holdsLikeTlc(constraint.expression, getContext(tracing, state, next, constraint.scope)),
        );
      // ModelChecker.doNext checks the invariants of a successor it has not seen, which includes
      // one outside the model.
      const isUnseen = isInModel ? addFingerprint() : true;
      return (
        (!isUnseen ||
          invariantPredicates.every((invariant) =>
            holdsLikeTlc(
              invariant.predicate,
              getContext(tracing, next, undefined, invariant.scope),
            ),
          )) &&
        actionProperties.every((property) =>
          holdsLikeTlc(property.box, getContext(tracing, state, next, property.scope)),
        )
      );
    },
    satisfiesConstraints: (state, parent) =>
      constraints.every(
        (constraint) =>
          isUnchangedFor(constraint, state, parent) ||
          holdsAsConjunct(constraint, getContext(environment, state, undefined)),
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
          throw withHeadline(
            withNextStateExitCode(error),
            MESSAGE_CODE.actionPropertyEvaluationFailed,
            `Evaluating action property ${property.name} failed.`,
          );
        }
      }),
    satisfiesActionConstraints: (state, next) =>
      actionConstraints.every((constraint) =>
        holdsLikeTlc(
          constraint.expression,
          getContext(environment, state, next),
          (expression) => `${UNEXPECTED_EXCEPTION}${getExpectedBoolean(expression, environment)}`,
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
    findPostconditionViolation: (isAfterViolation = false) => {
      // TLC replaces a definition it computes when it starts by its value, and then rejects it as
      // a postcondition before it checks any of them.
      const constant = config.postconditions.find((name) => {
        const definition = getDefinition(name, environment);
        return definition !== undefined && environment.definitionValues.has(definition);
      });
      if (constant !== undefined) {
        if (isAfterViolation) return undefined;
        throw setExitCode(
          new TlaEvaluationError(
            `${UNEXPECTED_EXCEPTION}The post condition ${constant} cannot be a constant.`,
          ),
          EXIT_STATUS.error,
        );
      }
      const unwitnessed = findUnwitnessedPossible();
      if (unwitnessed) return unwitnessed;
      for (const name of config.postconditions) {
        const failure = getConstantFailure(createIdentifier(name), environment, "a postcondition");
        if (!failure) continue;
        const range = getBodyRange(name, environment);
        const location = range ? ` at ${formatRange(range)}` : "";
        return failure.message === undefined
          ? {
              name,
              code: MESSAGE_CODE.postconditionFalse,
              message: `Postcondition ${name}${location} is false.`,
            }
          : {
              name,
              code: MESSAGE_CODE.postconditionFailed,
              message: `Evaluating postcondition ${name}${location} failed.\n${failure.message}`,
            };
      }
      return undefined;
    },
  };
};

// TLC exits with the code of a standard module's failure only when the failure escapes the
// computation of next states. In every other phase, the phase decides the code.
const withNextStateExitCode = (error: unknown) =>
  error instanceof TlaModuleError ? setExitCode(error, error.exitCode) : error;

// Stops a replay where TLC stops it without a failure, as at a violated invariant.
const STOP_REPLAY = new Error("The replay stopped");

// The codes of the errors in the configuration and the spec that TLC's EC.ExitStatus maps to a
// configuration error.
const CONFIG_ERROR_CODES = new Set([
  ...Array.from({ length: 24 }, (_, index) => 2222 + index),
  2272,
  2273,
  2274,
  2280,
  2281,
]);

// When TLC's replay of the initial states doesn't fail again, it exits with the code of the
// TLCRuntimeException it reported.
const getInitialExitCode = (error: TlaEvaluationError) => {
  const coded = getCodedMessage(error.message);
  return coded && !coded.isEvalException && CONFIG_ERROR_CODES.has(coded.code)
    ? EXIT_STATUS.configParseError
    : getErrorExitCode(error);
};

// When TLC's replay of an error fails again, an EvalException from a standard module's Java code
// decides the exit status, and any other failure exits as a nested expression failure. An error
// that heads or wraps another exits as the other.
const getReplayExitCode = (error: TlaEvaluationError): number => {
  const inner = error.cause;
  if (inner instanceof TlaEvaluationError) return getReplayExitCode(inner);
  return error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.specEvaluationFailure;
};

// An error that TLC reports with a message of its own, by that message's code and first line, and
// the error whose message follows.
interface HeadedError {
  code: number;
  headline: string;
  inner: TlaEvaluationError;
}

const headedErrors = new WeakMap<Error, HeadedError>();

const withHeadline = (error: unknown, code: number, headline: string) => {
  if (!(error instanceof TlaEvaluationError)) return error;
  const headed = setExitCode(
    new TlaEvaluationError(`${headline}\n${error.message}`, error),
    getErrorExitCode(error),
  );
  headedErrors.set(headed, { code, headline, inner: error });
  return headed;
};

const UNEXPECTED_HEADLINE = UNEXPECTED_EXCEPTION.slice(0, UNEXPECTED_EXCEPTION.indexOf("\n"));

// TLC 1.7.4's Worker wraps an error in adding a successor in a RuntimeException, whose message
// names the class of the error.
const WRAPPED_EVAL_EXCEPTION = `${UNEXPECTED_EXCEPTION}tlc2.tool.EvalException: `;
const WRAPPED_RUNTIME_EXCEPTION = `${UNEXPECTED_EXCEPTION}util.Assert$TLCRuntimeException: `;

const UNEXPECTED_EVAL_EXCEPTION = getUnexpectedException("tlc2.tool.EvalException");

const getWrappedException = (error: TlaEvaluationError) =>
  isEvalException(error) ? WRAPPED_EVAL_EXCEPTION : WRAPPED_RUNTIME_EXCEPTION;

// TLC reports an EvalException, or a TLCRuntimeException without a message of its own, as an
// exception it didn't expect.
const withUnexpectedException = <Result>(compute: () => Result) => {
  try {
    return compute();
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (isEvalException(error)) {
      throw new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`);
    }
    if (getCodedMessage(error.message)) throw error;
    throw new TlaEvaluationError(`${UNEXPECTED_EXCEPTION}${error.message}`);
  }
};

// The starts of TLC's messages for the exceptions it didn't expect.
const UNEXPECTED_EXCEPTIONS = [
  WRAPPED_EVAL_EXCEPTION,
  WRAPPED_RUNTIME_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  UNEXPECTED_EVAL_EXCEPTION,
];

// The text of an error's message, with the message of a coded error inside it marked in -tool
// output as TLC marks it.
const formatErrorMessage = (error: TlaEvaluationError, isTool: boolean): string => {
  const headed = headedErrors.get(error);
  if (headed) return `${headed.headline}\n${formatErrorMessage(headed.inner, isTool)}`;
  const message = error.message;
  const prefix = UNEXPECTED_EXCEPTIONS.find((start) => message.startsWith(start)) ?? "";
  return `${prefix}${formatNestedMessage(message.slice(prefix.length), isTool)}`;
};

// How TLC reports an error: with the code of its own message for an error that it reports with a
// headline; and, when the error escapes the computation of next states, with the code of an
// EvalException, or as an unexpected exception for any other error.
interface FailureMessage {
  code: number;
  message: string;
  toolMessage: string;
}

const getFailureMessage = (error: TlaEvaluationError, isNextState: boolean): FailureMessage => {
  const headed = headedErrors.get(error);
  const message = error.message;
  if (headed) {
    return {
      code: headed.code,
      message,
      toolMessage: formatErrorMessage(error, true),
    };
  }
  if (isNextState && isEvalException(error)) {
    return {
      code: getCodedMessage(message)?.code ?? MESSAGE_CODE.general,
      message,
      toolMessage: message,
    };
  }
  const isUnexpected = isNextState && !message.startsWith(UNEXPECTED_HEADLINE);
  const prefix = isUnexpected ? UNEXPECTED_EXCEPTION : "";
  return {
    code: MESSAGE_CODE.general,
    message: `${prefix}${message}`,
    toolMessage: `${prefix}${formatErrorMessage(error, true)}`,
  };
};

// TLC finishes the -dump file whether or not the search finds a violation.
export const checkSequentially = (options: CheckOptions): CheckResult => {
  const stateWriter =
    options.dump && createStateWriter(options.dump, options.writeFile, options.version);
  const result = searchStates(options, stateWriter);
  stateWriter?.close();
  return result;
};

const searchStates = (options: CheckOptions, stateWriter: StateWriter | undefined): CheckResult => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const onPrint = options.onPrint ?? console.log;
  // TLC prints again while it rebuilds a trace, between the states it prints, so rebuilding a trace
  // keeps what it prints for the trace.
  const output = { lines: undefined as OutputLine[] | undefined };
  const print = (text: string) => {
    if (output.lines) output.lines.push(text);
    else onPrint(text);
  };
  const getOutput = <Result>(rebuild: () => Result) => {
    const outer = output.lines;
    const lines: OutputLine[] = [];
    output.lines = lines;
    try {
      return { result: rebuild(), lines };
    } finally {
      output.lines = outer;
    }
  };
  setStringOrder(getTlcStringOrder(options.source, config, options.loadModule));
  setValueVersion(options.version);
  const specification = createEnvironment(config, {
    source: options.source,
    loadModule: options.loadModule,
    loadClass: options.loadClass,
    print,
    files: { readFile: options.readFile, writeFile: options.writeFile },
    seed: options.seed,
    isTool: options.isTool,
    isTraceRecorded: options.isTraceRecorded,
    isWarningEnabled: options.isWarningEnabled,
    version: options.version,
  });
  reportStartup(specification, config, options.onProgress);
  const environment = specification.environment;
  const runtime = environment.runtime;
  const is174 = runtime.version === "1.7.4";
  runtime.pause = options.onPause ?? (() => {});
  runtime.getSpecification = () =>
    getSpecificationValue(
      config,
      environment,
      specification.variableLocations,
      specification.instanceActions,
    );
  const statistics = { depth: 0, initialStates: undefined as InitialStates | undefined };
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
    initialStates: statistics.initialStates,
    outDegrees: undefined,
    fingerprintDistance: undefined,
  });
  const outDegrees = Array.from({ length: OUT_DEGREE_BUCKETS }, () => 0);
  const expansion = { newStates: 0 };
  const getOutDegreeBucket = () => Math.min(expansion.newStates, OUT_DEGREE_BUCKETS - 1);
  // TLC counts the state it was expanding when an evaluation failed, except TLC 1.7.4, whose
  // worker stops before it counts the state.
  const getPartialOutDegrees = () =>
    outDegrees.map((count, degree) => (degree === getOutDegreeBucket() ? count + 1 : count));
  const getFailureOutDegrees = () => (is174 ? [...outDegrees] : getPartialOutDegrees());
  // TLC 1.7.4 doesn't name the properties a counterexample violates, so it evaluates none of them.
  const getViolatedProperties = (checker: LivenessChecker, path: Value[][], cycleStart: number) =>
    is174 ? [] : checker.getViolatedProperties(path, cycleStart);
  // A violation in a successor ends the expansion of a state before TLC counts it.
  const withOutDegrees = (result: CheckResult, degrees = [...outDegrees]): CheckResult => ({
    ...result,
    violationOutDegrees: degrees,
  });
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

  const search = createSearch(
    config,
    environment,
    () => getTlcVariableOrder(options.source, options.loadModule),
    options.onProgress,
  );
  const findViolatedAssumption = () =>
    findAssumptionViolation(specification.assumptions, environment);
  if (!search) {
    runtime.isStarted = true;
    const assumptionViolation = findViolatedAssumption();
    if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
    // TLC computes the initial states of a spec without variables, of which there are none.
    statistics.initialStates = { generated: 0, distinct: 0 };
    options.onProgress?.({ kind: "initial-states-started" });
    options.onProgress?.({
      kind: "initial-states-computed",
      initialStates: statistics.initialStates,
    });
    return createSuccess();
  }
  const hasPostconditions = config.postconditions.length > 0 || config.possible.length > 0;
  // The state of each step of a trace without the alias, and the action TLC finds for the step,
  // which CounterExample records.
  const traceSteps = new WeakMap<
    TraceStep,
    { state: Record<string, Value>; action: SpecAction | undefined }
  >();
  const getStepState = (step: TraceStep) => traceSteps.get(step)?.state ?? step.state;
  const getStepAction = (step: TraceStep) => {
    const action = traceSteps.get(step)?.action;
    return action ? toActionValue(action) : createActionRecord(step.action);
  };
  // Worker#printTrace checks the postconditions on the CounterExample of each trace it prints, so
  // what they print follows the trace.
  const checkTracePostconditions = (
    trace: TraceStep[],
    loop: { start: number; action: Value } | undefined,
  ) => {
    if (hasPostconditions) {
      runtime.counterExample = createCounterExample(
        trace.map(getStepState),
        trace.slice(1).map(getStepAction),
        loop,
      );
    }
    const unwitnessed = search.findUnwitnessedPossible();
    const checked = unwitnessed
      ? { result: undefined, lines: [] }
      : getOutput(() => search.findPostconditionViolation(true));
    return { unwitnessed, postcondition: checked.result, lines: checked.lines };
  };
  const reportViolation = (
    status: CheckStatus,
    violation: Omit<Violation, "loopStart"> & { loopStart?: number },
    getLoopAction?: () => Value,
  ) => {
    const start = violation.loopStart;
    const checked = checkTracePostconditions(
      violation.trace,
      start === undefined || !getLoopAction ? undefined : { start, action: getLoopAction() },
    );
    const traceOutput = [...(violation.traceOutput ?? []), ...checked.lines];
    return createResult(status, {
      ...violation,
      ...(traceOutput.length > 0 && { traceOutput }),
      ...(checked.unwitnessed && { unwitnessed: checked.unwitnessed }),
      ...(checked.postcondition && { postcondition: checked.postcondition }),
    });
  };
  const spec = search.spec;
  const getFingerprintState = search.getFingerprintState;
  const nextActions = { value: undefined as SpecAction[] | undefined };
  const getSpecNextActions = () =>
    (nextActions.value ??= getNextActions(config, environment, specification.instanceActions));
  // Where TLC's replay of a failed computation fails, or undefined when the replay completes.
  const getReplayFailure = (replay: (tracing: Environment) => void): ReplayFailure | undefined => {
    const tracing = createTracingEnvironment(environment);
    const callStack = tracing.callStack;
    try {
      replay(tracing);
      return undefined;
    } catch (error) {
      if (!(error instanceof TlaEvaluationError) || !callStack) return undefined;
      return { callStack: callStack.expressions, fingerprint: callStack.fingerprint };
    }
  };
  // The sources of the values a fingerprint fails inside, outermost first: each value fails as it
  // fingerprints a value it holds.
  const findFailedSources = (value: Value, sources: CallStack["sources"]): Expression[] => {
    if (typeof value !== "object") return [];
    const source = sources.get(value);
    const failed = getHeldValues(value).find((held) => getFingerprintError(held) !== undefined);
    return [
      ...(source ? [source] : []),
      ...(failed === undefined ? [] : findFailedSources(failed, sources)),
    ];
  };
  // TLC's replay fingerprints the states it finds, and a value the replay built raises a
  // FingerprintException when it fails to.
  const fingerprintReplayed = (state: Value[], callStack: CallStack | undefined) => {
    for (const value of getFingerprintState(state)) {
      const error = getFingerprintError(value);
      if (!error) continue;
      const sources = callStack ? findFailedSources(value, callStack.sources) : [];
      // TLC fingerprints a state outside any evaluation, so its call stack is empty.
      if (callStack && sources.length > 0) {
        callStack.expressions.length = 0;
        callStack.isFrozen = true;
        callStack.fingerprint = { sources, reason: error.message };
      }
      throw error;
    }
    state.forEach(markFingerprinted);
  };
  // The replay adds the states it hasn't seen to TLC's set of states, which already holds the state
  // that failed after TLC added it.
  const createReplayedStates = () => {
    const replayed = unstoredState.fingerprint ? [unstoredState.fingerprint] : [];
    return (state: Value[], callStack: CallStack | undefined) => {
      fingerprintReplayed(state, callStack);
      const fingerprintState = getFingerprintState(state);
      const isSeen =
        findStateIndex(getStateHash(fingerprintState), fingerprintState) !== -1 ||
        replayed.some((seen) => isSameState(seen, fingerprintState));
      if (isSeen) return false;
      replayed.push(fingerprintState);
      runtime.distinctStates++;
      return true;
    };
  };
  // TLC's DoInitFunctor reports its progress again as it replays the initial states, and adds each
  // one it hasn't seen to the behavior graph. After a FingerprintException, it only counts the
  // states left, then throws the exception.
  const replayInit = () => {
    const replayed = { count: 0 };
    const deferred: TlaEvaluationError[] = [];
    const addReplayed = createReplayedStates();
    return getReplayFailure((tracing) => {
      replayInitialStates(
        getInitActions(config, environment, specification.instanceActions),
        tracing,
        (state) => {
          reportInitialStatesProgress(replayed.count, (progress) => output.lines?.push(progress));
          replayed.count++;
          runtime.generatedStates = replayed.count;
          if (deferred.length > 0) return;
          try {
            const addFingerprint = () => {
              if (!addReplayed(state, tracing.callStack)) return;
              runtime.queueSize++;
              liveness?.addInitialState(states.length, state, tracing);
            };
            const violation = search.checkReplayedInitialState(state, tracing, addFingerprint);
            if (violation) {
              const traced = toTrace([{ action: undefined, state }], []).trace[0].state;
              output.lines?.push({ kind: "initial-state-violation", ...violation, state: traced });
              throw STOP_REPLAY;
            }
          } catch (error) {
            if (!(error instanceof TlaEvaluationError) || !tracing.callStack?.fingerprint) {
              throw error;
            }
            deferred.push(error);
          }
        },
      );
      if (deferred.length > 0) throw deferred[0];
    });
  };
  const replayNext = (state: Value[]) =>
    getReplayFailure((tracing) => {
      const addReplayed = createReplayedStates();
      replaySuccessors(getSpecNextActions(), state, tracing, (next) => {
        const addFingerprint = () => addReplayed(next, tracing.callStack);
        if (!search.checkReplayedSuccessor(state, next, tracing, addFingerprint)) {
          throw STOP_REPLAY;
        }
      });
    });
  const isReducing = config.view !== undefined || config.symmetry !== undefined;
  const tlcFingerprints: number[] = [];
  // TLC warns about the liveness checker before it builds it.
  if (search.properties.liveness.length > 0) {
    options.onProgress?.({
      kind: "liveness-initializing",
      isSymmetric: search.isSymmetric,
      isConstrained: search.isConstrained,
    });
  }
  const liveness = withLivenessExitCode(() =>
    withUnexpectedException(() =>
      createLivenessChecker(search.properties.liveness, spec.temporals, environment, {
        getFingerprint: ({ index, state }) =>
          (tlcFingerprints[index] ??= Number(BigInt.asIntN(32, runtime.getFingerprint(state)))),
        getSuccessors: (source, state) => {
          const successors: LiveSuccessor[] = [];
          if (spec.next === undefined) return successors;
          // The constraints read the level of the state whose successors they check, as when TLC
          // explored it.
          const livenessSource = current.livenessSource;
          current.livenessSource = source;
          forEachSuccessor(
            spec.next,
            state,
            environment,
            (successor) => {
              canonicalizeState(successor.state);
              const isInModel =
                search.satisfiesConstraints(successor.state, state) &&
                search.satisfiesActionConstraints(state, successor.state);
              if (!isInModel) return false;
              const fingerprintState = getFingerprintState(successor.state);
              const index = findStateIndex(getStateHash(fingerprintState), fingerprintState);
              successors.push({ index, state: successor.state });
              return false;
            },
            spec.scope,
          );
          current.livenessSource = livenessSource;
          return successors;
        },
      }),
    ),
  );
  // TLC 1.7.4 creates its model checker, which TLCGet reads, once it has built the liveness checker.
  runtime.isStarted = true;
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
    // TLC evaluates TLCGet("level") and Trace in an alias at the state's position in the trace.
    runtime.getLevel = () => position + 1;
    runtime.getBehavior = () => steps.slice(0, position + 1).map((step) => step.state);
    return evaluateAlias(
      alias,
      steps[position].state,
      (steps[position + 1] ?? steps[loopStart ?? position]).state,
    );
  };
  const evaluateAlias = (alias: string, state: Value[], next: Value[] | undefined) => {
    try {
      const body = getConfigDefinition("alias", alias, environment).body;
      const value = evaluate(createIdentifier(alias), getContext(environment, state, next));
      const fieldOrder = body.kind === "Record" ? body.fields.map((field) => field.name) : [];
      return toAliasRecord(value, fieldOrder) ?? toRecord(state);
    } catch (error) {
      if (!(error instanceof TlaConfigError || error instanceof TlaEvaluationError)) throw error;
      return {
        ...toRecord(state),
        _ALIASEvalError: formatNestedMessage(error.message, options.isTool ?? false),
      };
    }
  };
  // TLC finds the action of a step as the first action that takes it, evaluated as when the search
  // expanded the previous state.
  // TLC finds the action of a successor it holds by the successor's values, and of any other state
  // by its fingerprint.
  const findStepAction = (index: number, previous: Value[], state: Value[], isHeld: boolean) => {
    const actions = getSpecNextActions();
    const expanding = { ...current };
    Object.assign(current, { index, isExpanding: true, candidate: undefined });
    const getKey = isHeld ? (values: Value[]) => values : getFingerprintState;
    const key = getKey(state);
    const action = actions.find((item) =>
      getSuccessors(item.expression, previous, environment, item.scope).some((successor) =>
        isSameState(getKey(successor.state), key),
      ),
    );
    Object.assign(current, expanding);
    return action;
  };
  // Before TLC prints a trace, it rebuilds from the initial predicate the states it does not keep,
  // all but the last `known` ones. As it prints each later step, it finds the action that takes
  // the step. Then it rebuilds the trace once more, unless the trace is a liveness counterexample
  // or TLC is 1.7.4.
  const toTrace = (
    steps: Successor[],
    path: number[],
    traceOptions: TraceOptions = {},
  ): Behavior => {
    const alias = config.alias;
    const known = traceOptions.known ?? 1;
    // Rebuilding the trace from the initial predicate can reset what TLCSet stored.
    const initialOutput = steps.length > 1 ? getOutput(getSpecInitialStates).lines : [];
    // TLC finds the action that takes each step before it evaluates the alias.
    const found = steps.map((step, position) =>
      position === 0 || step.action === "Stuttering"
        ? { result: undefined, lines: [] }
        : getOutput(() =>
            findStepAction(
              path[position - 1],
              steps[position - 1].state,
              step.state,
              known === 2 && position === steps.length - 1,
            ),
          ),
    );
    const outputs = found.map((step) => step.lines);
    const loopStart = traceOptions.loopStart;
    // 1.7.4's LiveWorker#printTrace rebuilds a lasso up to the start of its cycle at once, and then
    // each state of the cycle as it prints it.
    const rebuilt = is174 && loopStart !== undefined ? loopStart + 1 : steps.length - known;
    const prefixOutput = rebuilt > 0 ? [initialOutput, ...outputs.slice(1, rebuilt)].flat() : [];
    return {
      trace: steps.map((step, position) => {
        const action = found[position].result;
        const traceStep: TraceStep = {
          action: step.action,
          label: action && getActionLabel(action, options.version),
          state:
            alias === undefined
              ? toRecord(step.state)
              : getAliasState(alias, steps, position, loopStart),
          output: position === 0 ? prefixOutput : position < rebuilt ? [] : outputs[position],
        };
        if (alias !== undefined || action) {
          traceSteps.set(traceStep, { state: toRecord(step.state), action });
        }
        return traceStep;
      }),
      traceOutput: known > 0 && !is174 ? [initialOutput, ...outputs].flat() : [],
    };
  };
  const getSpecInitialStates = () =>
    spec.init === undefined ? [] : getInitialStates(spec.init, environment, spec.scope);
  // TLC's Tool#getState rebuilds a successor action by action, up to the first action that
  // generates it. A trace keeps what the spec prints as TLC rebuilds it, so finding its states
  // prints nothing.
  const findTraceSuccessor = (state: Value[], isMatch: (successor: Successor) => boolean) =>
    getOutput(() => {
      for (const action of getSpecNextActions()) {
        const successor = getSuccessors(action.expression, state, environment, action.scope).find(
          isMatch,
        );
        if (successor) return { ...successor, action: successor.action ?? action.name };
      }
      return undefined;
    }).result;
  const hasFingerprint = (state: Value[], index: number) =>
    isSameState(getFingerprintState(state), fingerprintStates[index]);
  const findSuccessorWithFingerprint = (state: Value[], index: number) =>
    findTraceSuccessor(state, (successor) => hasFingerprint(successor.state, index));
  const getPathStates = (path: number[], nextFailure: string) => {
    const initial = getOutput(() =>
      isReducing || isImpure(environment)
        ? getSpecInitialStates().find((state) => hasFingerprint(state, path[0]))
        : states[path[0]],
    ).result;
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
      ? findTraceSuccessor(states[index], (successor) => isSameState(successor.state, last.state))
          ?.action
      : last.action;
    return toTrace([...steps, { state: last.state, action }], path, { known: 2 });
  };
  // TLC prints an initial state on its own without evaluating the alias.
  // TLCTrace#getTrace recovers even a lone initial state from the initial predicate, printing
  // again, though TLC 1.7.4 doesn't.
  const getStateTrace = (index: number): Behavior =>
    parents[index] === -1
      ? {
          trace: [{ action: undefined, label: undefined, state: toRecord(states[index]) }],
          traceOutput: is174 ? [] : getOutput(getSpecInitialStates).lines,
        }
      : getTrace(index);
  // TLC rebuilds the trace again for the postcondition after it prints a violation, but not after
  // an evaluation fails.
  const getFailedTrace = (index: number, successor: Successor): Behavior => ({
    trace: getTrace(index, successor).trace,
  });
  // TLC names the initial state it was checking unless a standard module's Java code failed.
  const getFailureExitCode = (error: TlaEvaluationError, failureOptions: FailureOptions) => {
    // TLC 1.7.4 exits with the result of its replay of the initial states, which only fails again
    // when the error isn't in adding a state it has already seen to the behavior graph.
    if (
      failureOptions.isInitial &&
      !failureOptions.callStack &&
      !failureOptions.fingerprint &&
      is174
    ) {
      return EXIT_STATUS.success;
    }
    if (!failureOptions.callStack) {
      return failureOptions.isInitial ? getInitialExitCode(error) : getErrorExitCode(error);
    }
    if (failureOptions.isCallStackFirst) return getErrorExitCode(error);
    // Without a replay, TLC exits with the code of the error, as for any error it didn't expect.
    if (failureOptions.isLiveCallStack) {
      return (
        getExitCode(error) ?? (error instanceof TlaModuleError ? error.exitCode : EXIT_STATUS.error)
      );
    }
    // TLC exits with the code of a failed replay of the initial states regardless of the error, as
    // it does for a replay that fails to fingerprint.
    return failureOptions.isInitial || failureOptions.fingerprint
      ? EXIT_STATUS.specEvaluationFailure
      : getReplayExitCode(error);
  };
  const toFailure = (error: unknown, behavior: Behavior, failureOptions: FailureOptions = {}) => {
    if (!(error instanceof TlaEvaluationError)) throw error;
    const checked =
      behavior.trace.length > 0 && !failureOptions.traceFailure
        ? checkTracePostconditions(behavior.trace, undefined)
        : undefined;
    const postcondition = checked?.unwitnessed ?? checked?.postcondition;
    const traceOutput = [...(behavior.traceOutput ?? []), ...(checked?.lines ?? [])];
    return {
      ...createResult("error", undefined, {
        ...getFailureMessage(error, failureOptions.isNextState ?? false),
        ...behavior,
        ...(traceOutput.length > 0 && { traceOutput }),
        ...(postcondition && { postcondition }),
        initialState:
          failureOptions.initialState && !(error instanceof TlaModuleError)
            ? toRecord(failureOptions.initialState)
            : undefined,
        exitCode: getFailureExitCode(error, failureOptions),
        callStack: failureOptions.callStack,
        ...(failureOptions.isCallStackFirst && { isCallStackFirst: true }),
        ...(failureOptions.fingerprint && { fingerprint: failureOptions.fingerprint }),
        ...(failureOptions.traceFailure && { traceFailure: failureOptions.traceFailure }),
      }),
      outDegrees: failureOptions.outDegrees,
    };
  };
  // TLC reports a successor state that an action leaves incomplete with the trace to it, which ends
  // with the partial state. It names the action when the next-state relation has several.
  const reportIncompleteSuccessor = (index: number, error: TlaIncompleteSuccessorError) => {
    runtime.generatedStates++;
    const actions = getSpecNextActions();
    const action =
      actions.length === 1 ? actions[0] : actions.find((item) => item.name === error.action);
    const missing = error.variables;
    const subject =
      actions.length === 1
        ? "the next-state action"
        : `action ${error.action} of the next-state relation`;
    // TLC 1.7.4 says a variable is not assigned rather than not defined.
    const verb = is174 ? "assigned" : "defined";
    const message = `Successor state is not completely specified by ${subject}. The following variable${missing.length > 1 ? "s are" : " is"} not ${verb}: ${missing.join(", ")}.\n`;
    const undefinedValue = createModelValue("null");
    const partial = error.state.map((value) => value ?? undefinedValue);
    const failure = toFailure(error, getStateTrace(index));
    return withOutDegrees({
      ...failure,
      failure: failure.failure && {
        ...failure.failure,
        code: MESSAGE_CODE.incompleteSuccessor,
        message,
        toolMessage: message,
        exitCode: EXIT_STATUS.specEvaluationFailure,
        trace: [
          ...failure.failure.trace,
          {
            action: error.action,
            label: action && getActionLabel(action, options.version),
            state: toRecord(partial),
          },
        ],
      },
    });
  };
  const getPathSteps = (path: number[], loopStart?: number) => {
    const steps = getPathStates(path, NEXT_RECOVERY_FAILURE);
    const last = steps[steps.length - 1].state;
    const isClosed =
      !isReducing ||
      loopStart === undefined ||
      loopStart === path.length - 1 ||
      findSuccessorWithFingerprint(last, path[loopStart]) !== undefined;
    if (!isClosed) throw new TlaEvaluationError(NEXT_RECOVERY_FAILURE);
    return steps;
  };
  const getStateHash = (state: Value[]) => {
    let hash = 0x811c9dc5;
    for (let index = 0; index < state.length; index++)
      hash = combineHash(hash, getValueHash(state[index]));
    return hash & 0x3fffffff;
  };
  // TLC fingerprints a state once it finds the state in the model.
  const fingerprintModelState = (state: Value[]) => {
    for (const value of state) {
      const error = getFingerprintError(value);
      if (error) throw error;
    }
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
  // A new successor that TLC has added to its set of states before it checks the successor, which
  // the check stores after.
  const unstoredState = { fingerprint: undefined as Value[] | undefined };
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
    current.livenessSource = index ?? -1;
  };
  runtime.getLevel = (state) => {
    const source = current.livenessSource;
    // TLC 1.7.4 reads the level of the state its worker explores, whichever state it evaluates.
    if (is174) {
      const explored = source !== -1 ? source : current.isExpanding ? current.index : -1;
      return explored === -1 ? 0 : depths[explored];
    }
    if (source !== -1) return state === states[source] ? depths[source] : depths[source] + 1;
    if (state === current.candidate) return current.candidateLevel;
    if (current.index === -1) return 0;
    if (state === states[current.index]) return depths[current.index];
    return current.isExpanding ? depths[current.index] + 1 : 0;
  };

  const getGraphState = (state: Value[], level: number): GraphState => ({
    fingerprint: BigInt.asIntN(64, runtime.getFingerprint(state)),
    level,
    getLabel: () =>
      formatState(
        config.alias === undefined
          ? toRecord(state)
          : evaluateAlias(config.alias, state, undefined),
      ),
    getText: () => formatState(toRecord(state)),
  });

  const visitInitialState = (state: Value[]) => {
    canonicalizeState(state);
    runtime.generatedStates++;
    runtime.initialStates++;
    current.candidate = state;
    current.candidateLevel = 1;
    const fingerprintState = getFingerprintState(state);
    const hash = getStateHash(fingerprintState);
    const isInModel = search.satisfiesConstraints(state);
    if (isInModel) {
      search.trackStatePossible(state);
      fingerprintModelState(fingerprintState);
      state.forEach(markFingerprinted);
    }
    const isSeen = isInModel && findStateIndex(hash, fingerprintState) !== -1;
    if (isSeen) return undefined;
    unstoredState.fingerprint = isInModel ? fingerprintState : undefined;
    if (isInModel) {
      countDistinctState(1);
      runtime.queueSize++;
      liveness?.addInitialState(states.length, state);
      stateWriter?.writeInitialState(getGraphState(state, 1));
    }
    const violated = search.findViolatedInvariant(state);
    if (violated) {
      return reportViolation("invariant-violation", {
        name: violated.name,
        ...toTrace([{ action: undefined, state }], []),
      });
    }
    const failedPredicate = search.findFailedInitialPredicate(state);
    if (failedPredicate) {
      return reportViolation("liveness-violation", {
        name: failedPredicate.name,
        ...toTrace([{ action: undefined, state }], []),
      });
    }
    if (!isInModel) return undefined;
    markSeen(hash, states.length);
    addState(state, fingerprintState, -1, undefined);
    return undefined;
  };
  const visitSuccessor = (
    index: number,
    successor: Successor,
    liveSuccessors: LiveSuccessor[],
    source: GraphState | undefined,
    action: SpecAction | undefined,
  ) => {
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
    if (isInModel) {
      search.trackActionPossible(state, successor.state);
      fingerprintModelState(fingerprintState);
      successor.state.forEach(markFingerprinted);
    }
    const existing = isInModel ? found : -1;
    if (source && isInModel) {
      stateWriter?.writeSuccessor(
        source,
        getGraphState(successor.state, depths[index] + 1),
        existing !== -1,
        action && { name: action.name, signature: getActionSignature(action) },
      );
    }
    if (existing !== -1 && liveness) {
      const stored = states[existing];
      const isStored = stored.every((value, position) => value === successor.state[position]);
      liveSuccessors.push({ index: existing, state: isStored ? stored : successor.state });
    }
    const isNew = isInModel && existing === -1;
    // TLC adds a new state to the behavior graph's successors before it checks the invariants.
    if (isNew && liveness) liveSuccessors.push({ index: states.length, state: successor.state });
    unstoredState.fingerprint = isNew ? fingerprintState : undefined;
    if (isNew) {
      countDistinctState(depths[index] + 1);
      expansion.newStates++;
    }
    if (existing === -1) {
      try {
        const violated = search.findViolatedInvariant(successor.state, state);
        if (violated) {
          return withOutDegrees(
            reportViolation("invariant-violation", {
              name: violated.name,
              ...getTrace(index, successor),
            }),
          );
        }
      } catch (error) {
        // TLC replays the expansion and skips the invariants of a state it has seen, the failed one
        // included unless the constraints exclude it. When the replay fails, TLC reports where and
        // leaves out the outdegree.
        const replay = getOutput(() => replayNext(state));
        return toFailure(
          error,
          appendTraceOutput(getFailedTrace(index, successor), replay.lines),
          replay.result ?? { outDegrees: getFailureOutDegrees() },
        );
      }
    }
    const violatedProperty = search.findViolatedActionProperty(state, successor.state);
    if (violatedProperty) {
      return withOutDegrees(
        reportViolation("liveness-violation", {
          name: violatedProperty.name,
          ...getTrace(index, successor),
        }),
      );
    }
    if (!isNew) return undefined;
    if (!isCanonicalizedFirst) canonicalizeState(successor.state);
    markSeen(hash, states.length);
    addState(successor.state, fingerprintState, index, successor.action);
    runtime.queueSize++;
    return undefined;
  };

  const outcome: { result: CheckResult | undefined } = { result: undefined };
  if (liveness) {
    options.onProgress?.({ kind: "liveness-prepared", branches: liveness.branches });
  }
  // TLC checks the assumptions once it has built the liveness checker in ModelChecker's
  // constructor.
  const assumptionViolation = findViolatedAssumption();
  if (assumptionViolation) return createResult("assumption-violation", assumptionViolation);
  options.onProgress?.({ kind: "initial-states-started" });
  if (spec.init !== undefined) {
    try {
      forEachInitialState(
        spec.init,
        environment,
        (state) => {
          reportInitialStatesProgress(runtime.initialStates, options.onProgress);
          try {
            outcome.result = visitInitialState(state);
          } catch (error) {
            const replay = getOutput(replayInit);
            outcome.result = toFailure(
              error,
              { trace: [], traceOutput: replay.lines },
              { initialState: state, ...replay.result, isInitial: true },
            );
          }
          return outcome.result !== undefined;
        },
        spec.scope,
      );
    } catch (error) {
      // TLC prints the error before it replays the initial predicate with its call stack.
      const replay = getOutput(replayInit);
      return toFailure(
        error,
        { trace: [], traceOutput: replay.lines },
        { ...replay.result, isInitial: true },
      );
    }
  }
  if (outcome.result) return outcome.result;
  statistics.initialStates = {
    generated: runtime.initialStates,
    distinct: runtime.distinctStates,
  };
  options.onProgress?.({
    kind: "initial-states-computed",
    initialStates: statistics.initialStates,
  });

  const next = spec.next;
  if (next === undefined) {
    if (states.length > 0) {
      throw new TlaEvaluationError(
        "No next state actions defined to generate successor states from.",
      );
    }
    return createSuccess();
  }
  // TLC labels and colors an edge of the -dump state graph by the action that generated it. When
  // the graph names its edges, the search generates successors action by action, as TLC does.
  const isNamingEdges = Boolean(
    options.dump?.dot && (options.dump.actionLabels || options.dump.colorize),
  );
  const forEachActionSuccessor = (
    state: Value[],
    onSuccessor: (successor: Successor, action: SpecAction | undefined) => boolean,
  ) => {
    if (!isNamingEdges) {
      return forEachSuccessor(
        next,
        state,
        environment,
        (successor) => onSuccessor(successor, undefined),
        spec.scope,
      );
    }
    const progress = { isStopped: false };
    return getSpecNextActions().reduce((count, action) => {
      if (progress.isStopped) return count;
      return (
        count +
        forEachSuccessor(
          action.expression,
          state,
          environment,
          (successor) => {
            progress.isStopped = onSuccessor(successor, action);
            return progress.isStopped;
          },
          action.scope,
        )
      );
    }, 0);
  };
  // TLC's worker adds a state to the behavior graph even after its next states fail or violate a
  // property, and prints the call stack of an error in that, unless the error is a
  // FingerprintException, which the worker doesn't catch. TLC 1.7.4 prints none.
  const getLiveCallStack = (index: number, liveSuccessors: LiveSuccessor[]) => {
    if (!liveness || is174) return undefined;
    const replay = getReplayFailure((tracing) =>
      liveness.addState(index, states[index], liveSuccessors, tracing),
    );
    return replay?.callStack.length && !replay.fingerprint ? replay.callStack : undefined;
  };
  // TLC's worker adds the state to the behavior graph after it prints the trace. On an error in that,
  // it adds the state again to print the call stack instead of replaying the next-state relation,
  // which TLC 1.7.4 doesn't.
  const addFailedLiveState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    try {
      liveness?.addState(index, states[index], liveSuccessors);
      return undefined;
    } catch (error) {
      if (!(error instanceof TlaEvaluationError)) throw error;
      return getLiveCallStack(index, liveSuccessors);
    }
  };
  const replayFailedNext = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const live = getOutput(() => addFailedLiveState(index, liveSuccessors));
    if (live.result) {
      const result = { callStack: live.result, fingerprint: undefined, isLiveCallStack: true };
      return { result, lines: live.lines };
    }
    const replay = getOutput(() => replayNext(states[index]));
    return { result: replay.result, lines: [...live.lines, ...replay.lines] };
  };
  // After the trace, TLC replays the next-state relation with its call stack, printing again.
  const reportNextStateFailure = (
    error: unknown,
    index: number,
    liveSuccessors: LiveSuccessor[],
  ) => {
    const replay = replayFailedNext(index, liveSuccessors);
    return toFailure(
      withNextStateExitCode(error),
      appendTraceOutput(getStateTrace(index), replay.lines),
      { isNextState: true, ...replay.result },
    );
  };
  const expandState = (index: number, liveSuccessors: LiveSuccessor[]) => {
    const state = states[index];
    const source = stateWriter && getGraphState(state, depths[index]);
    const successorCount = forEachActionSuccessor(state, (successor, action) => {
      try {
        outcome.result = visitSuccessor(index, successor, liveSuccessors, source, action);
      } catch (error) {
        // TLC 1.7.4 reports the wrapped error without the trace, except for a failed property,
        // which it reports with the trace before it rethrows. The error stops its worker before it
        // adds the state to the behavior graph.
        const replay = is174
          ? getOutput(() => replayNext(state))
          : replayFailedNext(index, liveSuccessors);
        if (is174 && error instanceof TlaEvaluationError && !headedErrors.has(error)) {
          outcome.result = toFailure(
            new TlaEvaluationError(`${getWrappedException(error)}${error.message}`, error),
            appendTraceOutput({ trace: [] }, replay.lines),
            { isNextState: true, ...replay.result },
          );
          return true;
        }
        // A successor TLC can't fingerprint fails again as TLC prints it in the trace, which TLC
        // reports as an exception it didn't expect.
        const isTraceFailed = getFingerprintState(successor.state).some(
          (value) => getFingerprintError(value) !== undefined,
        );
        const traceFailure =
          isTraceFailed && error instanceof TlaEvaluationError
            ? getFailureMessage(
                isEvalException(error)
                  ? new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`)
                  : error,
                true,
              )
            : undefined;
        outcome.result = toFailure(
          error,
          appendTraceOutput(
            traceFailure ? getStateTrace(index) : getFailedTrace(index, successor),
            replay.lines,
          ),
          { isNextState: true, ...replay.result, traceFailure },
        );
      }
      return outcome.result !== undefined;
    });
    current.isExpanding = false;
    const result = outcome.result;
    // TLC 1.7.4's worker stops at a violation.
    if (result?.violation && !is174) {
      const live = getOutput(() => addFailedLiveState(index, liveSuccessors));
      return {
        ...result,
        violation: appendTraceOutput(result.violation, live.lines),
        ...(live.result && { liveCallStack: live.result }),
      };
    }
    if (result) return result;
    const addLiveState = () => {
      if (liveness && source && is174) stateWriter?.writeStuttering(source);
      const accepted = liveness?.addState(index, state, liveSuccessors);
      if (!liveness || !accepted) return undefined;
      const steps = getPathSteps(accepted);
      const properties = getViolatedProperties(
        liveness,
        steps.map((step) => step.state),
        steps.length - 1,
      );
      return reportViolation("property-violation", {
        name: properties[0],
        properties,
        ...toTrace(steps, accepted, { known: 0 }),
      });
    };
    if (successorCount === 0 && config.checkDeadlock) {
      const deadlock = reportViolation("deadlock", { name: "deadlock", ...getStateTrace(index) });
      // TLC's worker still adds the deadlocked state to the behavior graph after it reports the
      // deadlock, and reports a temporal property that this violates. Then it counts the state as
      // expanded.
      const live = getOutput(() => {
        try {
          return { additional: addLiveState()?.violation };
        } catch (error) {
          if (!(error instanceof TlaEvaluationError)) throw error;
          return { isFailed: true, callStack: getLiveCallStack(index, liveSuccessors) };
        }
      });
      const reported = deadlock.violation
        ? { ...deadlock, violation: appendTraceOutput(deadlock.violation, live.lines) }
        : deadlock;
      // An error in adding the state stops TLC 1.7.4's worker before it counts the state.
      const counted = withOutDegrees(
        reported,
        live.result.isFailed ? getFailureOutDegrees() : getPartialOutDegrees(),
      );
      if (live.result.additional)
        return { ...counted, additionalViolation: live.result.additional };
      return live.result.callStack ? { ...counted, liveCallStack: live.result.callStack } : counted;
    }
    try {
      return addLiveState();
    } catch (error) {
      // TLC 1.7.4's worker reports an error in adding a state to the behavior graph as an exception
      // it didn't expect, without the trace or a call stack, and exits as for any general error.
      if (is174 && error instanceof TlaEvaluationError) {
        const unexpected = new TlaEvaluationError(
          `${isEvalException(error) ? UNEXPECTED_EVAL_EXCEPTION : UNEXPECTED_EXCEPTION}${error.message}`,
        );
        return toFailure(
          setExitCode(unexpected, EXIT_STATUS.error),
          { trace: [] },
          { outDegrees: getFailureOutDegrees() },
        );
      }
      // TLC's Worker#doNextCheckLiveness adds the state again to find the call stack, prints it
      // before the error, and reports the error as one in computing next states.
      const replay = getReplayFailure((tracing) =>
        liveness?.addState(index, state, liveSuccessors, tracing),
      );
      return toFailure(error, getStateTrace(index), {
        outDegrees: getFailureOutDegrees(),
        callStack: replay?.callStack.length ? replay.callStack : undefined,
        isNextState: true,
        isCallStackFirst: true,
      });
    }
  };
  // TLC's Liveness#printStutteringCounterExampleWarning.
  const getStutteringWarning = () => {
    const name = config.specification;
    const book =
      "(compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).";
    if (name === undefined) {
      return {
        code: MESSAGE_CODE.noSpecificationButProperty,
        text: `The stuttering counterexample above may be caused by the absence of a behavior specification (SPECIFICATION). Only INIT and NEXT have been provided, so TLC permits infinite stuttering. To rule out such counterexamples, use SPECIFICATION Spec, with Spec asserting a suitable fairness constraint ${book}`,
      };
    }
    const range = getDefinition(name, environment)?.location.range;
    if (spec.temporals.length > 0 || !range) return undefined;
    return {
      code: MESSAGE_CODE.noFairnessButProperty,
      text: `The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification ${name} defined at ${formatRange(range)}. To rule out such counterexamples, conjoin a suitable fairness constraint to ${name} ${book}`,
    };
  };
  // TLC names the properties and the step back into the cycle from the states it prints.
  const reportLasso = (checker: LivenessChecker, lasso: Lasso) => {
    const path = [...lasso.prefix, ...lasso.cycle];
    const loopStart = lasso.prefix.length;
    const steps = getPathSteps(path, loopStart);
    const trace = toTrace(steps, path, { loopStart, known: 0 }).trace;
    const properties = getViolatedProperties(
      checker,
      steps.map((step) => step.state),
      loopStart,
    );
    const back = path[loopStart];
    const last = path[path.length - 1];
    const lastState = steps[steps.length - 1].state;
    const loop =
      back === last
        ? { result: undefined, lines: [] }
        : getOutput(() => findStepAction(last, lastState, states[back], false));
    const isStutteringWarned = back === last && lasso.isCycleConstrained;
    return reportViolation(
      "liveness-violation",
      {
        name: properties[0],
        properties,
        trace,
        traceOutput: loop.lines,
        loopStart,
        loopLabel: loop.result && getActionLabel(loop.result, options.version),
        warning: isStutteringWarned ? getStutteringWarning() : undefined,
      },
      () =>
        back === last
          ? getStepAction(trace[trace.length - 1])
          : loop.result
            ? toActionValue(loop.result)
            : createActionRecord(findSuccessorWithFingerprint(lastState, back)?.action),
    );
  };
  const isPeriodic = liveness !== undefined && options.livenessCheck !== "final";
  const startedAt = performance.now();
  const periodic = { at: startedAt + PERIODIC_START, size: 1, time: 0 };
  const findPeriodicViolation = (expanded: number) => {
    const now = performance.now();
    const isGrown = (expanded - periodic.size) / periodic.size > LIVENESS_GROWTH;
    if (!isGrown || periodic.time > (now - startedAt) * LIVENESS_RATIO) return undefined;
    periodic.size = expanded;
    if (!liveness) return undefined;
    options.onProgress?.({
      kind: "liveness-started",
      branches: liveness.branches,
      isComplete: false,
      states: expanded,
      statistics: createResult("success"),
    });
    const lasso = liveness.findViolation();
    if (!lasso) options.onProgress?.({ kind: "liveness-finished" });
    periodic.time += performance.now() - now;
    return lasso;
  };
  for (let index = 0; index < states.length && !runtime.isStopped; index++) {
    current.index = index;
    current.candidate = undefined;
    runtime.queueSize = states.length - index - 1;
    current.isExpanding = true;
    const liveSuccessors: LiveSuccessor[] = [];
    try {
      outcome.result = expandState(index, liveSuccessors);
    } catch (error) {
      outcome.result =
        error instanceof TlaIncompleteSuccessorError
          ? reportIncompleteSuccessor(index, error)
          : reportNextStateFailure(error, index, liveSuccessors);
    }
    if (outcome.result) return outcome.result;
    outDegrees[getOutDegreeBucket()]++;
    expansion.newStates = 0;
    // TLC's AbstractChecker#runTLC checks the liveness properties on the state graph so far, then
    // reports how far the search got.
    if ((isPeriodic || options.onProgress) && performance.now() >= periodic.at) {
      periodic.at = performance.now() + PROGRESS_INTERVAL;
      const lasso = isPeriodic ? findPeriodicViolation(index + 1) : undefined;
      if (liveness && lasso) return reportLasso(liveness, lasso);
      options.onProgress?.({ kind: "progress", statistics: createResult("success") });
    }
  }

  current.index = -1;
  current.candidate = undefined;
  if (liveness) {
    options.onProgress?.({
      kind: "liveness-started",
      branches: liveness.branches,
      isComplete: true,
      states: runtime.distinctStates,
      statistics: createResult("success"),
    });
  }
  const lasso = liveness?.findViolation();
  if (liveness && lasso) return reportLasso(liveness, lasso);

  // TLC finishes the check of the temporal properties before it checks the postconditions.
  if (liveness) options.onProgress?.({ kind: "liveness-finished" });
  try {
    const postcondition = search.findPostconditionViolation();
    if (postcondition) {
      return createResult("postcondition-violation", {
        name: postcondition.name,
        message: postcondition.message,
        counts: postcondition.counts,
        trace: [],
        postcondition,
      });
    }
  } catch (error) {
    return toFailure(error, { trace: [] });
  }
  return createSuccess();
};
