import {
  getChildren,
  isLocallyResolved,
  type Assumption,
  type Definition,
  type Expression,
  type SourceLocation,
} from "./ast";
import type {
  CheckOptions,
  InitialStatesProgress,
  InitialStateViolation,
  Postcondition,
  Violation,
} from "./check";
import type { ConfigValue, ModelConfig } from "./config";
import { getReadVariables, isConstantLevel } from "./dependencies";
import {
  isStackOverflow,
  TlaConfigError,
  TlaEvaluationError,
  TlaModuleError,
  UNEXPECTED_EXCEPTION,
  formatRange,
} from "./errors";
import {
  describeNode,
  describeRange,
  evaluate,
  evaluateStartupDefinitions,
  getStartupValue,
  expectBoolean,
  getDefinition,
  type Context,
  type Environment,
  type Scope,
} from "./evaluate";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import type { JavaOverride } from "./java-overrides";
import {
  ACTION_LEVEL,
  CONSTANT_LEVEL,
  createLevelAnalyzer,
  TEMPORAL_LEVEL,
  VARIABLE_LEVEL,
} from "./levels";
import { expandTemporal, getLevel, type ScopedExpression, type TemporalProperty } from "./liveness";
import { prettyPrint } from "./pretty-print";
import { getPossibleCounts, type CheckerRuntime } from "./runtime";
import { getRepresentative, getSymmetryGroup } from "./symmetry";
import { MESSAGE_CODE, MISSING_INIT_174, withHeadline } from "./tlc/messages";
import { getTlcFingerprint, getTlcFingerprints } from "./tlc/fingerprint";
import { formatValue, isUpdatedElementOf, type Value } from "./values";

interface NamedExpression {
  name: string;
  expression: Expression;
  scope: Scope | undefined;
}

interface StateCheck extends NamedExpression {
  variables: number[] | undefined;
  membership: Membership | undefined;
  predicate: Expression;
}

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

interface StartupSpecification {
  environment: Environment;
  startupDefinitions: Definition[];
  javaOverrides: JavaOverride[];
}

const START: SourceLocation = { line: 0, column: 0 };

export const createIdentifier = (name: string): Expression => ({
  kind: "Identifier",
  name,
  location: START,
});

const UNNAMED_ARGUMENT_KINDS = new Set(["name", "property"]);

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

const getConstantValue = (name: string, definition: Definition, environment: Environment) => {
  if (!isConstantLevel(definition, environment)) return undefined;
  if (definition.body.kind === "Number" || definition.body.kind === "String") return undefined;
  try {
    return evaluate(createIdentifier(name), getContext(environment, undefined, undefined));
  } catch (error) {
    if (error instanceof TlaEvaluationError || isStackOverflow(error)) return undefined;
    throw error;
  }
};

export const getConfigDefinition = (kind: string, name: string, environment: Environment) => {
  const definition = getConfigOperator(kind, name, environment);
  if (getConstantValue(name, definition, environment) !== undefined) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  return definition;
};

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

export const reportInitialStatesProgress = (
  count: number,
  onProgress: ((progress: InitialStatesProgress) => void) | undefined,
) => {
  if (count > 1 && (count & (count - 1)) === 0) {
    onProgress?.({ kind: "initial-states-progress", count });
  }
};

export const reportStartup = (
  specification: StartupSpecification,
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
  if (
    conjunct.kind !== "Identifier" ||
    getLevel(conjunct, item.scope, environment) > CONSTANT_LEVEL
  ) {
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
              isStreamed: false,
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
    if (getLevel(definition.body, undefined, environment) === VARIABLE_LEVEL) {
      onProgress?.({ kind: "state-level-property", name });
    }
    const isProperty = environment.runtime.version !== "1.7.4";
    expandTemporal(definition.body, undefined, environment, isProperty).forEach((item) => {
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
        getLevel(conjunct.expression, item.scope, environment) <= VARIABLE_LEVEL
      ) {
        const body = conjunct.expression;
        const operator =
          body.kind === "Identifier" && !isLocallyResolved(body)
            ? getDefinition(body.name, environment)
            : undefined;
        properties.invariants.push({
          name: operator?.name ?? (body.kind === "Identifier" ? body.name : partName),
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

// TLC fingerprints a string by the low byte of each character, so it merges states whose strings differ only above U+00FF.
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
  isConstrained: boolean;
  findViolatedInvariant: (state: Value[], parent?: Value[]) => StateCheck | undefined;
  getViolatedInvariants: (state: Value[]) => StateCheck[];
  checkReplayedInitialState: (
    state: Value[],
    tracing: Environment,
    addFingerprint: () => void,
  ) => Pick<InitialStateViolation, "status" | "name"> | undefined;
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
  findPostconditionViolation: (isAfterViolation?: boolean) => Postcondition | undefined;
}

export const getContext = (
  environment: Environment,
  state: Value[] | undefined,
  next: Value[] | undefined,
  scope?: Scope,
) => ({ environment, scope, state, next });

const holds = (expression: Expression, context: Context, description: string) =>
  expectBoolean(evaluate(expression, context), description);

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
      ? undefined
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
  let tlcOrder: number[] | undefined;
  const getTlcOrder = () => {
    if (tlcOrder) return tlcOrder;
    const variableOrder = getVariableOrder();
    const getTlcPosition = (index: number) => {
      const position = variableOrder.indexOf(environment.variables[index]);
      return position === -1 ? environment.variables.length : position;
    };
    tlcOrder = environment.variables
      .map((_, index) => index)
      .sort((left, right) => getTlcPosition(left) - getTlcPosition(right));
    return tlcOrder;
  };
  const getViewValue = (expression: Expression, state: Value[]) =>
    evaluate(expression, getContext(environment, state, undefined));
  const getTlcStateFingerprint = (state: Value[]) => {
    const indices = getTlcOrder();
    const representative =
      symmetryGroup === undefined ? state : getRepresentative(state, symmetryGroup, indices);
    return getTlcFingerprint(
      view === undefined
        ? indices.map((index) => representative[index])
        : [getViewValue(view.expression, representative)],
    );
  };
  const violatingStates = new WeakSet<Value[]>();
  const isViolated = (invariant: StateCheck, state: Value[], parent: Value[] | undefined) => {
    const checkedParent = parent && !violatingStates.has(parent) ? parent : undefined;
    if (isUnchangedFor(invariant, state, checkedParent)) return false;
    try {
      const context = getContext(environment, state, undefined, invariant.scope);
      const membership = invariant.membership;
      return checkedParent && membership
        ? !isUpdatedElementOf(
            state[membership.variable],
            checkedParent[membership.variable],
            evaluate(membership.set, context),
          )
        : !holdsAsConjunct(invariant, context);
    } catch (error) {
      if (!parent) throw error;
      throw withHeadline(
        setExitCode(error, EXIT_STATUS.safetyEvaluationFailure),
        MESSAGE_CODE.invariantEvaluationFailed,
        `Evaluating invariant ${invariant.name} failed.`,
      );
    }
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
    isSymmetric: symmetryGroup !== undefined,
    isConstrained: constraints.length > 0 || actionConstraints.length > 0,
    getTlcOrder,
    getStoredFingerprints: (states, fingerprintStates) => {
      if (view !== undefined || isFingerprintedLikeTlc) {
        return BigInt64Array.from(states, getTlcStateFingerprint);
      }
      return getTlcFingerprints(fingerprintStates, getTlcOrder());
    },
    getFingerprintState: (state) => {
      if (isFingerprintedLikeTlc) return [String(getTlcStateFingerprint(state))];
      const representative =
        symmetryGroup === undefined
          ? state
          : getRepresentative(state, symmetryGroup, getTlcOrder());
      return view === undefined ? representative : [getViewValue(view.expression, representative)];
    },
    findViolatedInvariant: (state, parent) => {
      const violated = invariants.find((invariant) => isViolated(invariant, state, parent));
      if (violated) violatingStates.add(state);
      return violated;
    },
    getViolatedInvariants: (state) => {
      const violated = invariantPredicates.filter((predicate) =>
        invariants.some(
          (invariant) =>
            invariant.predicate === predicate.predicate && isViolated(invariant, state, undefined),
        ),
      );
      if (violated.length > 0) violatingStates.add(state);
      return violated;
    },
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
      // TLC checks the invariants of every successor it has not seen, even outside the model.
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
      const constant = config.postconditions.find((name) => {
        const definition = getDefinition(name, environment);
        return definition !== undefined && getStartupValue(definition, environment) !== undefined;
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

export const withNextStateExitCode = (error: unknown) =>
  error instanceof TlaModuleError ? setExitCode(error, error.exitCode) : error;
