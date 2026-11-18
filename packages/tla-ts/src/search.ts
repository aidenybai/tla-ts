import {
  getChildren,
  isLocallyResolved,
  type Assumption,
  type Definition,
  type Expression,
  type SourceLocation,
} from "./ast";
import { getKeyName } from "./resolve";
import type {
  CheckOptions,
  InitialStatesProgress,
  InitialStateViolation,
  ModuleOperator,
  OutputLine,
  Postcondition,
  Violation,
} from "./check";
import { parseConfig, type ConfigValue, type ModelConfig } from "./config";
import {
  addCoverageRelation,
  buildCoverage,
  createCoverage,
  createCoverageEnvironment,
  getCoverageLabel,
  getCoverageReport,
  runAtCoverageNode,
  type Coverage,
  type CoverageKind,
} from "./coverage";
import {
  getReadVariables,
  isConstantLevel,
  isExpressionImpure,
  isImpureDefinition,
} from "./dependencies";
import {
  createEnvironment,
  type ResolvedModuleOperator,
  type RuntimeInvariant,
} from "./environment";
import {
  TlaConfigError,
  TlaEvaluationError,
  TlaModuleError,
  TlaWarningAsError,
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
  expectBooleanBody,
  getDefinition,
  getRootKey,
  type Context,
  type Environment,
  type Scope,
  type State,
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
import { getLiveExpressions } from "./liveness-checker";
import { prettyPrint } from "./pretty-print";
import { parenthesizedRanges } from "./parser";
import { getPossibleCounts, type CheckerRuntime } from "./runtime";
import { createIncompleteSuccessorError, type SuccessorGenerator } from "./successors";
import {
  getSpecDescription,
  getSpecificationValue,
  getSubscriptVariables,
  type SpecAction,
  type SpecDescription,
} from "./spec-description";
import { getRepresentative, getSymmetryGroup, type Images } from "./symmetry";
import type { Solution } from "./tableau";
import {
  formatInnerMessage,
  formatNestedMessage,
  MESSAGE_CODE,
  MISSING_INIT_174,
  withHeadline,
} from "./tlc/messages";
import { createTlcOrder } from "./tlc/order";
import { getPrimedRanges, walkSuccessors } from "./tlc/replay";
import { getTlcFingerprint, getTlcFingerprints, setFingerprintPolynomial } from "./tlc/fingerprint";
import type { TlcVersion } from "./tlc/version";
import {
  createModelValue,
  formatValue,
  freezeStringOrder,
  getWrittenPairs,
  isFunctionValue,
  isUpdatedElementOf,
  markNormalized,
  setAliasName,
  setStringOrder,
  setValueOptions,
  setViewText,
  toFiniteFunction,
  type Value,
} from "./values";

export interface CliSettings {
  readLine?: () => string | undefined;
  runtimeInvariants?: RuntimeInvariant[];
  errorCodes?: number[];
}

interface EnvironmentSettings
  extends
    Pick<
      CheckOptions,
      | "source"
      | "loadModule"
      | "loadClass"
      | "readFile"
      | "writeFile"
      | "makeDirectory"
      | "seed"
      | "isTool"
      | "traceSpec"
      | "isSanyReported"
      | "isWarningEnabled"
      | "version"
      | "moduleOperators"
      | "fingerprintPolynomial"
      | "maxSetSize"
      | "isLazyValueExpanded"
      | "isViewPrinted"
    >,
    CliSettings {}

interface NamedExpression {
  name: string;
  expression: Expression;
  scope: Scope | undefined;
}

interface CoveredCheck {
  expression: Expression;
  scope: Scope | undefined;
  node: number;
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
  isPropertyFairness: boolean;
}

interface Properties {
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

const createNamedIdentifier = (name: string, environment: Environment): NamedExpression => ({
  name,
  expression: createIdentifier(getRootKey(name, environment)),
  scope: undefined,
});

const UNNAMED_ARGUMENT_KINDS = new Set(["name", "property"]);

const getConfigOperator = (kind: string, name: string, environment: Environment) => {
  const definition = getDefinition(getRootKey(name, environment), environment);
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

const isLiteralDefinition = (definition: Definition) =>
  definition.body.kind === "Number" || definition.body.kind === "String";

const getConstantValue = (key: string, definition: Definition, environment: Environment) => {
  if (environment.constants.has(key)) return environment.constants.get(key);
  return isLiteralDefinition(definition) ? undefined : getStartupValue(definition, environment);
};

const getConfigDefinition = (kind: string, name: string, environment: Environment) => {
  const key = getRootKey(name, environment);
  if (environment.constants.has(key)) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  const definition = getConfigOperator(kind, name, environment);
  if (getConstantValue(key, definition, environment) !== undefined) {
    throw new TlaConfigError(`The ${kind} ${name} cannot be a constant.`);
  }
  return definition;
};

const getConfigPredicate = (kind: string, name: string, environment: Environment) => {
  const key = getRootKey(name, environment);
  const definition = environment.constants.has(key)
    ? undefined
    : getConfigOperator(kind, name, environment);
  const value = definition
    ? getConstantValue(key, definition, environment)
    : environment.constants.get(key);
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

interface StartupSpecification {
  environment: Environment;
  startupDefinitions: Definition[];
  javaOverrides: JavaOverride[];
}

export const reportStartup = (
  specification: StartupSpecification,
  config: ModelConfig,
  onProgress: CheckOptions["onProgress"],
) => {
  const environment = specification.environment;
  environment.runtime.warn = (code, text) => onProgress?.({ kind: "warning", code, text });
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
    getDefinition: (name) => environment.definitions.get(name),
    instances: environment.instances,
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
    return [createNamedIdentifier(name, environment)];
  });
};

const getConjuncts = (expression: Expression, environment: Environment): Expression[] => {
  if (expression.kind === "And")
    return expression.operands.flatMap((operand) => getConjuncts(operand, environment));
  if (expression.kind === "Identifier" && !environment.constants.has(expression.name)) {
    const definition = getDefinition(expression.name, environment);
    const isUnfolded =
      definition?.kind === "Operator" &&
      definition.params.length === 0 &&
      getStartupValue(definition, environment) === undefined;
    if (isUnfolded) return getConjuncts(definition.body, environment);
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
  const name = environment.instanceNames.get(conjunct.name) ?? getKeyName(conjunct.name);
  if (value === false) {
    throw new TlaConfigError(`The spec is trivially false because ${name} is false.`);
  }
  if (value !== true) {
    throw new TlaConfigError(
      `The operator ${name}, which equals ${formatValue(value)},\ncannot be used as a ${usage}`,
    );
  }
  return true;
};

const getSpecification = (
  config: ModelConfig,
  environment: Environment,
  variableLocations: SourceLocation[],
  getVariableOrder: () => string[],
  onProgress: CheckOptions["onProgress"],
): Specification => {
  if (config.specification === undefined) {
    const getOperator = (name: string | undefined, description: string) => {
      if (name === undefined) return undefined;
      getConfigDefinition(description, name, environment);
      return createIdentifier(getRootKey(name, environment));
    };
    return {
      init: getOperator(config.init, "initial predicate"),
      next: getOperator(config.next, "next state action"),
      scope: undefined,
      temporals: [],
      isPropertyFairness: false,
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
  const specificationKey = getRootKey(config.specification, environment);
  const value = environment.constants.has(specificationKey)
    ? environment.constants.get(specificationKey)
    : getConstantValue(
        specificationKey,
        getConfigOperator("name", config.specification, environment),
        environment,
      );
  if (value !== undefined) {
    throw new TlaConfigError(
      `The value of ${config.specification} is equal to ${formatValue(value)}`,
    );
  }
  const definition = getConfigOperator("name", config.specification, environment);
  const property = config.properties.length === 1 ? config.properties[0] : undefined;
  let isUntaggedFound = false;
  expandTemporal(definition.body, undefined, environment, false).forEach((item) => {
    const conjunct = item.expression;
    // TLC takes a state-level definition of the spec whole as an initial predicate.
    const isInitial = item.path.some((name) => {
      const expanded = getDefinition(getRootKey(name, environment), environment);
      return (
        expanded?.kind === "Operator" &&
        getLevel(expanded.body, undefined, environment) === VARIABLE_LEVEL
      );
    });
    if (!isInitial && isConstantTrue(item, environment, "spec")) return;
    const variableIndex =
      conjunct.kind === "Identifier" && !isLocallyResolved(conjunct)
        ? environment.variableIndex.get(conjunct.name)
        : undefined;
    if (!isInitial && conjunct.kind === "Identifier" && variableIndex !== undefined) {
      const range = variableLocations[variableIndex].range;
      throw new TlaConfigError(
        `The operator ${conjunct.name}, which equals ${range ? formatRange(range) : conjunct.name},\ncannot be used as a spec`,
      );
    }
    if (conjunct.kind === "UnboundedQuantifier" && conjunct.isTemporal) {
      throw setExitCode(
        new TlaConfigError(
          "TLC does not support temporal existential, nor universal, quantification over state variables.",
        ),
        EXIT_STATUS.error,
      );
    }
    if (conjunct.kind === "Always" && conjunct.expression.kind === "BoxAction") {
      const variables = getSubscriptVariables(
        conjunct.expression.subscript,
        item.scope,
        environment,
      );
      if (variables === undefined) {
        onProgress?.({
          kind: "warning",
          code: MESSAGE_CODE.subscriptUndetermined,
          text: "TLC could not determine if the subscript of the next-state relation contains\nall state variables. Proceed with fingers crossed.",
        });
      }
      getVariableOrder()
        .filter((name) => variables !== undefined && !variables.includes(name))
        .forEach((name) =>
          onProgress?.({
            kind: "warning",
            code: MESSAGE_CODE.subscriptMissingVariable,
            text: `The subscript of the next-state relation specified by the specification\ndoes not seem to contain the state variable ${name}`,
          }),
        );
      if (nextActions.length > 0) {
        throw new TlaConfigError(
          "The specification contains more than one conjunct of the form [][Next]_v,\nbut TLC can handle only specifications with one next-state relation.",
        );
      }
      nextActions.push({ expression: conjunct.expression.action, scope: item.scope });
      return;
    }
    if (
      conjunct.kind === "Always" &&
      conjunct.expression.kind !== "Let" &&
      conjunct.expression.kind !== "Label" &&
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
      if (property === undefined || !item.path.includes(property)) isUntaggedFound = true;
      temporals.push(item);
      return;
    }
    if (level === ACTION_LEVEL) {
      throw new TlaConfigError(
        `TLC cannot handle this conjunct of the spec:\n${describeRange(conjunct)}`,
      );
    }
    initConjuncts.push(item);
  });
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
              isRebuilt: false,
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
    isPropertyFairness: temporals.length > 0 && !isUntaggedFound,
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
        const location = describeRange(conjunct);
        const book = "Specifying Systems at https://lamport.azurewebsites.net/tla/book.html";
        const advice =
          conjunct.kind === "BoxAction"
            ? `To check that action ${partName} holds in *every* step of the behavior, define a temporal property by applying the "always" temporal operator ([]) to the formula at ${location} (compare page 90 of ${book}).`
            : conjunct.kind === "AngleAction"
              ? `To check that infinitely many ${partName} steps occur, define a temporal property by applying the "always eventually" temporal operator combination ([]<>) to the formula at ${location} (compare page 91 of ${book}).`
              : `To check that action ${partName} holds in *every* step of the behavior, define a temporal property: Let A be the formula at ${location}; rewrite A as [][A]_v, where v is a state function (typically the tuple of variables) (compare page 90 of ${book}).`;
        throw new TlaConfigError(
          `The formula ${partName} at ${location} is an action-level formula (i.e., it contains no temporal operators). Only temporal-level (or state-level) formulas are allowed under PROPERTY or PROPERTIES. ${advice}`,
        );
      }
      properties.liveness.push({ name, expression: conjunct, scope: item.scope });
    });
  });
  return properties;
};

// The expressions the LET definitions and arguments of a scope stand for, or undefined if it binds
// an operator only as a function.
const getScopeExpressions = (scope: Scope | undefined): Expression[] | undefined => {
  const expressions: Expression[] = [];
  const visited = new Set<Scope>();
  const visit = (current: Scope | undefined): boolean => {
    if (current === undefined || visited.has(current)) return true;
    visited.add(current);
    const binding = current.binding;
    if (binding.kind === "Thunk") {
      expressions.push(binding.expression);
      return visit(binding.scope) && visit(current.parent);
    }
    if (binding.kind === "Operator") {
      if (binding.operator.kind !== "Closure") return false;
      expressions.push(binding.operator.body);
      return visit(binding.operator.scope) && visit(current.parent);
    }
    return visit(current.parent);
  };
  return visit(scope) ? expressions : undefined;
};

const getNamedExpressions = (
  kind: string,
  names: string[],
  environment: Environment,
): NamedExpression[] =>
  names.flatMap((name) =>
    getConfigPredicate(kind, name, environment) ? [createNamedIdentifier(name, environment)] : [],
  );

// SANY locates a parenthesized body at the expression inside the parentheses.
const getBodyRange = (name: string, environment: Environment) => {
  const definition = getDefinition(name, environment);
  if (definition?.kind !== "Operator") return undefined;
  return parenthesizedRanges.has(definition.body)
    ? (definition.body.location.range ?? definition.bodyRange)
    : definition.bodyRange;
};

const getPossiblePredicates = (names: string[], environment: Environment) =>
  names.map((name, index) => {
    if (names.indexOf(name) !== index) {
      throw new TlaConfigError(`_POSSIBLE lists ${name} more than once`);
    }
    getConfigDefinition("possible", name, environment);
    const possible = createNamedIdentifier(name, environment);
    if (getLevel(possible.expression, undefined, environment) === TEMPORAL_LEVEL) {
      throw new TlaConfigError(
        `The possible of ${name} is equal to a temporal formula; only state- and action-level predicates are supported`,
      );
    }
    return possible;
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
  named.flatMap((item) => {
    const predicate = getPredicate(item.expression, environment);
    const isImpure =
      item.scope === undefined && getReadVariables(predicate, environment) === undefined;
    // TLC evaluates an invariant whole, so one that prints isn't split into conjuncts.
    return (isImpure ? [predicate] : getConjuncts(item.expression, environment)).map(
      (expression) => {
        const variables =
          item.scope === undefined ? getReadVariables(expression, environment) : undefined;
        return {
          name: item.name,
          expression,
          scope: item.scope,
          variables,
          membership: getMembership(expression, variables, environment),
          predicate,
        };
      },
    );
  });

const isUnchangedFor = (stateCheck: StateCheck, state: State, parent: Value[] | undefined) => {
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

const isWideExpression = (expression: Expression, checked: Set<Expression>): boolean => {
  if (expression.kind === "Selection") {
    if (checked.has(expression.expression)) return false;
    checked.add(expression.expression);
  }
  return (
    (expression.kind === "String" && WIDE_CHARACTER.test(expression.value)) ||
    (expression.kind === "Apply" && DESERIALIZERS.has(expression.operator)) ||
    getChildren(expression).some((child) => isWideExpression(child, checked))
  );
};

// TLC fingerprints a string by the low byte of each character, so it merges states whose strings differ only above U+00FF.
const hasWideString = (config: ModelConfig, environment: Environment) => {
  const checked = new Set<Expression>();
  return (
    config.constants.some(
      (constant) =>
        isWideConfigValue(constant.value) || (constant.args ?? []).some(isWideConfigValue),
    ) ||
    [...environment.definitions.values()].some(
      (definition) =>
        isWideExpression(definition.body, checked) ||
        (definition.kind === "Function" &&
          definition.bounds.some((bound) => isWideExpression(bound.set, checked))),
    )
  );
};

export interface Search {
  properties: Properties;
  toRecord: (state: Value[]) => Record<string, Value>;
  evaluateAlias: (
    alias: string,
    state: State,
    next: State | undefined,
    isTool: boolean,
  ) => Record<string, Value>;
  spec: Specification;
  getFingerprintState: (state: Value[]) => Value[];
  getStoredFingerprints: (states: Value[][], fingerprintStates: Value[][]) => BigInt64Array;
  getTlcOrder: () => number[];
  isSymmetric: boolean;
  isConstrained: boolean;
  getTypedChecks: (liveness: Solution[] | undefined) =>
    | {
        init: Expression;
        next: Expression;
        scope: Scope | undefined;
        invariants: Expression[];
        constraints: Expression[];
        holdsInitialPredicates: (state: Value[]) => boolean;
        actionProperties: ActionProperty[];
        symmetry: Images[] | undefined;
        view: Expression | undefined;
        variableOrder: number[];
        liveness: Solution[] | undefined;
      }
    | undefined;
  findViolatedInvariant: (state: Value[], parent?: Value[]) => StateCheck | undefined;
  forEachViolatedInvariant: (state: Value[], onViolated: (invariant: StateCheck) => void) => void;
  checkReplayedInitialState: (
    state: Value[],
    tracing: Environment,
    addFingerprint: () => void,
    onViolated: (violation: Pick<InitialStateViolation, "status" | "name">) => void,
  ) => void;
  checkReplayedSuccessor: (
    state: Value[],
    next: Value[],
    tracing: Environment,
    addFingerprint: () => boolean,
  ) => boolean;
  satisfiesConstraints: (state: State, parent?: Value[]) => boolean;
  findFailedInitialPredicate: (state: Value[]) => NamedExpression | undefined;
  findViolatedActionProperty: (state: Value[], next: Value[]) => ActionProperty | undefined;
  satisfiesActionConstraints: (state: Value[], next: State) => boolean;
  getExcludingConstraints: (state: Value[], next: Value[]) => string[];
  trackStatePossible: (state: Value[]) => void;
  trackActionPossible: (state: Value[], next: Value[]) => void;
  findUnwitnessedPossible: () => Postcondition | undefined;
  getReward: (state: Value[] | undefined, next: Value[], fallback: number) => number;
  findPostconditionViolation: (isAfterViolation?: boolean) => Postcondition | undefined;
}

const toAliasRecord = (value: Value) => {
  if (!isFunctionValue(value)) return undefined;
  const pairs = getWrittenPairs(toFiniteFunction(value));
  if (!pairs.every((pair) => typeof pair[0] === "string")) return undefined;
  return Object.fromEntries(pairs.map((pair) => [String(pair[0]), pair[1]]));
};

export const getIncompleteSuccessorMessage = (
  missing: string[],
  action: string | undefined,
  actionCount: number,
  version: TlcVersion | undefined,
) => {
  const subject =
    actionCount === 1 ? "the next-state action" : `action ${action} of the next-state relation`;
  const verb = version === "1.7.4" ? "assigned" : "defined";
  return `Successor state is not completely specified by ${subject}. The following variable${missing.length > 1 ? "s are" : " is"} not ${verb}: ${missing.join(", ")}.\n`;
};

export const getContext = (
  environment: Environment,
  state: State | undefined,
  next: State | undefined,
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

const getExpectedValue = (kind: string, expression: Expression, environment: Environment) => {
  const definition =
    expression.kind === "Identifier" ? getDefinition(expression.name, environment) : undefined;
  const body = definition?.kind === "Operator" ? definition.body : expression;
  const range = definition?.kind === "Operator" ? definition.bodyRange : undefined;
  const location = range && body.kind !== "Number" ? formatRange(range) : describeNode(body);
  return `TLC expected a ${kind} value, but did not find one. ${location}`;
};

const getExpectedBoolean = (expression: Expression, environment: Environment) =>
  getExpectedValue("boolean", expression, environment);

const holdsAsConjunct = (check: StateCheck, context: Context) =>
  holdsLikeTlc(check.expression, context, (expression, environment) => {
    if (check.predicate !== check.expression) holdsLikeTlc(check.predicate, context);
    return getExpectedBoolean(expression, environment);
  });

const ignorePossible = () => {};

const trackPossible = (items: NamedExpression[], runtime: CheckerRuntime, context: Context) =>
  items.forEach((item) => {
    const count = runtime.possibleCounts.get(item.name) ?? 0;
    const isWitnessed = holds(item.expression, context, `_POSSIBLE ${item.name}`);
    runtime.possibleCounts.set(item.name, isWitnessed ? count + 1 : count);
  });

const getConstantFailure = (check: (context: Context) => boolean, environment: Environment) => {
  try {
    return check(getContext(environment, undefined, undefined))
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
    const failure = getConstantFailure(
      (context) =>
        expectBooleanBody(evaluate(assumption.expression, context), assumption.expression),
      environment,
    );
    if (failure) {
      return { name: describeNode(assumption.expression), trace: [], message: failure.message };
    }
  }
  return undefined;
};

export const createCheckEnvironment = (
  config: ModelConfig,
  options: EnvironmentSettings,
  print: (text: string) => void,
  isStringOrderFrozen = false,
) => {
  const order = createTlcOrder(options.source, options.loadModule);
  setStringOrder(
    order.getStringOrder(
      config,
      (options.runtimeInvariants ?? []).flatMap((invariant) => invariant.module ?? []),
    ),
  );
  setValueOptions(options);
  setFingerprintPolynomial(options.fingerprintPolynomial ?? 0);
  if (isStringOrderFrozen) freezeStringOrder();
  const specification = createEnvironment(config, {
    source: options.source,
    loadModule: options.loadModule,
    order,
    loadClass: options.loadClass,
    print,
    files: {
      readFile: options.readFile,
      writeFile: options.writeFile,
      makeDirectory: options.makeDirectory,
    },
    seed: options.seed,
    isTool: options.isTool,
    traceFile: options.traceSpec?.traceFile,
    isSanyReported: options.isSanyReported,
    isWarningEnabled: options.isWarningEnabled,
    version: options.version,
    moduleOperators: options.moduleOperators,
    readLine: options.readLine,
    runtimeInvariants: options.runtimeInvariants,
  });
  return { order, specification };
};

export const createOutputCapture = (onPrint: (text: string) => void) => {
  let capturedLines: OutputLine[] | undefined;
  return {
    print: (text: string) => {
      if (capturedLines) capturedLines.push(text);
      else onPrint(text);
    },
    captureWarnings: (runtime: CheckerRuntime, errorCodes: number[] = []) => {
      const warn = runtime.warn;
      runtime.warn = (code, text) => {
        // TLC's MP#printWarning fails on a warning -messagesAsErrors lists, even one whose output tla-ts holds back.
        if (errorCodes.includes(code)) throw new TlaWarningAsError(code, text);
        if (capturedLines) capturedLines.push({ kind: "warning", code, text });
        else warn(code, text);
      };
    },
    captureOutput: <Result>(evaluate: () => Result) => {
      const outer = capturedLines;
      const lines: OutputLine[] = [];
      capturedLines = lines;
      try {
        return { result: evaluate(), lines };
      } finally {
        capturedLines = outer;
      }
    },
    getCapturedLines: () => capturedLines,
  };
};

export const prepareSearch = (options: CheckOptions) => {
  const config =
    typeof options.config === "string"
      ? parseConfig(options.config, options.version)
      : options.config;
  const created = createCheckEnvironment(config, options, options.onPrint ?? console.log);
  const specification = created.specification;
  reportStartup(specification, config, options.onProgress);
  const coverage =
    options.coverage === undefined
      ? undefined
      : createCoverage(specification.environment.variables.length);
  const environment = coverage
    ? createCoverageEnvironment(specification.environment, coverage)
    : specification.environment;
  let description: SpecDescription | undefined;
  const getDescription = () =>
    (description ??= getSpecDescription(config, environment, specification.instanceActions));
  environment.runtime.getSpecification = () =>
    getSpecificationValue(getDescription(), config, environment, specification.variableLocations);
  const search = createSearch(
    config,
    environment,
    specification.variableLocations,
    () => created.order.getDeclarationOrder("variable"),
    options.onProgress,
    specification.moduleOperators,
    specification.runtimeInvariants,
  );
  const getCoverage = () =>
    coverage &&
    getCoverageReport(
      coverage,
      environment,
      specification.variableLocations,
      search?.getTlcOrder() ?? [],
    );
  return { config, specification, environment, search, getDescription, coverage, getCoverage };
};

export interface CoveredAction extends SpecAction {
  node: number;
}

export const STOP_WALK = new Error("The walk stopped");

export const addActionCoverage = (
  coverage: Coverage,
  environment: Environment,
  description: SpecDescription,
) => {
  const addRelations = (kind: "init" | "next", actions: SpecAction[]) =>
    actions.map((action): CoveredAction => ({
      ...action,
      node: addCoverageRelation(
        coverage,
        kind,
        getCoverageLabel(action.name, action.expression, environment, action.head, action.body),
        action.expression,
        action.scope,
      ),
    }));
  const inits = addRelations("init", description.inits);
  const actions = addRelations("next", description.actions);
  buildCoverage(coverage, environment, getPrimedRanges(actions, environment));
  return { inits, actions };
};

export const walkCoveredSuccessors = (
  coverage: Coverage,
  action: CoveredAction,
  state: Value[],
  environment: Environment,
  onState: (successor: Value[]) => void,
  onIncomplete = (partial: State, name: string | undefined): void => {
    throw createIncompleteSuccessorError(partial, name, environment);
  },
  generator?: SuccessorGenerator,
) =>
  walkSuccessors(
    action,
    action.node,
    state,
    environment,
    (successor) => {
      coverage.primary[action.node]++;
      onState(successor);
    },
    (partial) => {
      coverage.primary[action.node]++;
      onIncomplete(partial, action.name);
      return true;
    },
    generator,
  );

export const reportAssumptionViolation = (
  assumptions: Assumption[],
  environment: Environment,
  message: (code: number, text: string, toolText: string) => void,
) => {
  const assumption = findAssumptionViolation(assumptions, environment);
  if (!assumption) return undefined;
  if (assumption.message === undefined) {
    const text = `Assumption ${assumption.name} is false.`;
    message(MESSAGE_CODE.assumptionFalse, text, text);
    return EXIT_STATUS.assumptionViolation;
  }
  const text = `Evaluating assumption ${assumption.name} failed.\n${assumption.message}`;
  message(
    MESSAGE_CODE.assumptionEvaluationError,
    text,
    formatInnerMessage(MESSAGE_CODE.assumptionEvaluationError, text, true),
  );
  return EXIT_STATUS.assumptionViolation;
};

export const createMissingOperatorError = (operator: ModuleOperator) =>
  setExitCode(
    new TlaEvaluationError(
      `${UNEXPECTED_EXCEPTION}Could not find operator: ${operator.operator} in module: ${operator.module}`,
    ),
    EXIT_STATUS.error,
  );

export const createSearch = (
  config: ModelConfig,
  environment: Environment,
  variableLocations: SourceLocation[],
  getVariableOrder: () => string[],
  onProgress?: CheckOptions["onProgress"],
  moduleOperators: ResolvedModuleOperator[] = [],
  runtimeInvariants: RuntimeInvariant[] = [],
): Search | undefined => {
  const getModuleOperators = (kind: ResolvedModuleOperator["kind"]) =>
    moduleOperators
      .filter((operator) => operator.kind === kind)
      .map((operator) => {
        if (operator.key === undefined) throw createMissingOperatorError(operator);
        return { name: operator.operator, key: operator.key };
      });
  const configInvariants = getInvariants(config.invariants, environment);
  const spec = getSpecification(
    config,
    environment,
    variableLocations,
    getVariableOrder,
    onProgress,
  );
  const properties = getProperties(config, environment, onProgress);
  const live = config.properties[0];
  const liveRange =
    live && getDefinition(getRootKey(live, environment), environment)?.location.range;
  const specName = config.specification;
  const specRange =
    specName && getDefinition(getRootKey(specName, environment), environment)?.location.range;
  if (spec.isPropertyFairness && liveRange && specRange) {
    onProgress?.({
      kind: "warning",
      code: MESSAGE_CODE.fairnessTautology,
      text: `Implied-temporal checking is a tautology.\nThe temporal formula ${live} at ${formatRange(liveRange)} equals\nthe fairness constraints of the behavior specification ${specName} at ${formatRange(specRange)}.\nTherefore, checking whether ${specName} => ${live} using TLC will never result in a violation of ${live}.`,
    });
  }
  const checkedInvariants = getStateChecks(
    [...configInvariants, ...properties.invariants],
    environment,
  );
  const isCheckingBehaviors =
    checkedInvariants.length > 0 ||
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
  const runtimeChecks = getStateChecks(
    runtimeInvariants.map((invariant) => {
      const key = getRootKey(invariant.name, environment);
      const definition = getDefinition(key, environment);
      return {
        name: invariant.name,
        expression: definition?.kind === "Operator" ? definition.body : createIdentifier(key),
        scope: undefined,
      };
    }),
    environment,
  );
  const invariants = [...checkedInvariants, ...runtimeChecks];
  const invariantPredicates = [
    ...new Map(invariants.map((invariant) => [invariant.predicate, invariant])).values(),
  ];
  const namedConstraints = getNamedExpressions(
    "constraint",
    [...config.constraints, ...getModuleOperators("constraint").map((operator) => operator.name)],
    environment,
  );
  const constraints = getStateChecks(namedConstraints, environment);
  const actionConstraints = getNamedExpressions(
    "action constraint",
    config.actionConstraints,
    environment,
  );
  const coverage = environment.coverage;
  const getCoveredChecks = (kind: CoverageKind, items: NamedExpression[], isDefined = true) =>
    items.flatMap((item): CoveredCheck[] => {
      if (!coverage) return [];
      const expression = isDefined ? getPredicate(item.expression, environment) : item.expression;
      const label = getCoverageLabel(isDefined ? item.name : undefined, expression, environment);
      const node = addCoverageRelation(coverage, kind, label, expression, item.scope);
      return [{ expression, scope: item.scope, node }];
    });
  const coveredInvariants = [
    ...getCoveredChecks("invariant", configInvariants),
    ...getCoveredChecks("invariant", properties.invariants, false),
  ];
  const coveredInvariantChecks = new Map(
    [...configInvariants, ...properties.invariants].map((item, index) => [
      getPredicate(item.expression, environment),
      coveredInvariants[index],
    ]),
  );
  const coveredActionConstraints = getCoveredChecks("constraint", actionConstraints);
  const coveredConstraints = getCoveredChecks("constraint", namedConstraints);
  const coveredConstraintChecks = new Map(
    coveredConstraints.map((check) => [check.expression, check]),
  );
  const constraintPredicates = [
    ...new Map(constraints.map((constraint) => [constraint.predicate, constraint])).values(),
  ];
  const coveredInitialPredicates = getCoveredChecks("implied", properties.initialPredicates, false);
  const coveredActionProperties = getCoveredChecks(
    "implied",
    properties.actionProperties.map((property) => ({ ...property, expression: property.box })),
    false,
  );
  const evaluateCovered = (
    covered: Coverage,
    check: CoveredCheck,
    state: State,
    next: State | undefined,
  ) =>
    runAtCoverageNode(covered, check.node, () =>
      evaluate(check.expression, getContext(environment, state, next, check.scope)),
    );
  const holdsReplayed = (
    covered: CoveredCheck | undefined,
    expression: Expression,
    context: Context,
  ) =>
    coverage && covered
      ? runAtCoverageNode(coverage, covered.node, () => holdsLikeTlc(covered.expression, context))
      : holdsLikeTlc(expression, context);
  const satisfiesCovered = (checks: CoveredCheck[], state: State, next?: State) => {
    if (!coverage) return undefined;
    for (const check of checks) {
      const value = evaluateCovered(coverage, check, state, next);
      if (typeof value !== "boolean") return undefined;
      if (!value) {
        coverage.primary[check.node]++;
        return false;
      }
      coverage.secondary[check.node]++;
    }
    return true;
  };
  if (config.rlReward !== undefined) getConfigOperator("rlreward", config.rlReward, environment);
  const reward =
    config.rlReward === undefined
      ? undefined
      : createIdentifier(getRootKey(config.rlReward, environment));
  if (config.periodic !== undefined) getConfigOperator("periodic", config.periodic, environment);
  const possible = getPossiblePredicates(config.possible, environment);
  if (environment.variables.length === 0) return undefined;
  const symmetryGroup =
    config.symmetry === undefined
      ? undefined
      : getSymmetryGroup(config.symmetry, environment, config.substitutions);
  const viewDefinition =
    config.view === undefined
      ? undefined
      : getConfigDefinition("view function", config.view, environment);
  const viewName = config.view ?? getModuleOperators("view")[0]?.name;
  const view = viewName === undefined ? undefined : createNamedIdentifier(viewName, environment);
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
      .map((_variable, index) => index)
      .sort((left, right) => getTlcPosition(left) - getTlcPosition(right));
    return tlcOrder;
  };
  const getViewValue = (expression: Expression, state: Value[]) =>
    evaluate(expression, getContext(environment, state, undefined));
  const getRepresentativeState = (state: Value[]) => {
    // TLC's TLCStateMut#fingerPrint deep-normalizes a state before it evaluates the view.
    if (view !== undefined) state.forEach(markNormalized);
    return symmetryGroup === undefined
      ? state
      : getRepresentative(state, symmetryGroup, getTlcOrder());
  };
  const getTlcStateFingerprint = (state: Value[]) => {
    const representative = getRepresentativeState(state);
    return getTlcFingerprint(
      view === undefined
        ? getTlcOrder().map((index) => representative[index])
        : [getViewValue(view.expression, representative)],
    );
  };
  const findFailedInitialPredicate = (state: Value[]) =>
    properties.initialPredicates.find((predicate, index) => {
      const value =
        coverage && evaluateCovered(coverage, coveredInitialPredicates[index], state, undefined);
      return typeof value === "boolean"
        ? !value
        : !holdsLikeTlc(
            predicate.expression,
            getContext(environment, state, undefined, predicate.scope),
          );
    });
  const violatingStates = new WeakSet<Value[]>();
  const getInvariantError = (error: unknown, name: string, parent: Value[] | undefined) =>
    parent
      ? withHeadline(
          setExitCode(error, EXIT_STATUS.safetyEvaluationFailure),
          MESSAGE_CODE.invariantEvaluationFailed,
          `Evaluating invariant ${name} failed.`,
        )
      : error;
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
      throw getInvariantError(error, invariant.name, parent);
    }
  };
  const isPredicateViolated = (
    predicate: StateCheck,
    state: Value[],
    parent: Value[] | undefined,
  ) => {
    const covered = coveredInvariantChecks.get(predicate.predicate);
    if (coverage && covered) {
      try {
        const value = evaluateCovered(coverage, covered, state, undefined);
        if (typeof value === "boolean") return !value;
      } catch (error) {
        throw getInvariantError(error, predicate.name, parent);
      }
    }
    return invariants.some(
      (invariant) =>
        invariant.predicate === predicate.predicate && isViolated(invariant, state, parent),
    );
  };
  const isFingerprintedLikeTlc = hasWideString(config, environment);
  runtime.getFingerprint = getTlcStateFingerprint;
  const findUnwitnessedPossible = () => {
    const unwitnessed = possible.find((item) => !runtime.possibleCounts.get(item.name));
    if (!unwitnessed) return undefined;
    const range = getBodyRange(getRootKey(unwitnessed.name, environment), environment);
    const location = range ? ` at ${formatRange(range)}` : "";
    return {
      name: unwitnessed.name,
      code: MESSAGE_CODE.possibleUnwitnessed,
      message: `The _POSSIBLE predicate ${unwitnessed.name}${location} was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.`,
      counts: prettyPrint(formatValue(getPossibleCounts(runtime), true)),
    };
  };
  // Deviation from TLC: a tuple VIEW prints as a state only when its elements are distinct variables, since TLC mislabels <<y, x>> and <<x + 1>>.
  const viewElements = viewDefinition?.body.kind === "Tuple" ? viewDefinition.body.elements : [];
  const viewNames = viewElements.flatMap((element) =>
    element.kind === "Identifier" && environment.variables.includes(element.name)
      ? [element.name]
      : [],
  );
  const isStateView =
    viewDefinition?.body.kind === "Tuple" &&
    viewNames.length === viewElements.length &&
    new Set(viewNames).size === viewNames.length;
  const getViewText = (expression: Expression, state: Value[]) =>
    isStateView
      ? getTlcOrder()
          .filter((index) => viewNames.includes(environment.variables[index]))
          .map(
            (index) =>
              `/\\ ${environment.variables[index]} = ${prettyPrint(formatValue(state[index]))}\n`,
          )
          .join("")
      : prettyPrint(formatValue(getViewValue(expression, state)));
  const holdsActionConstraint = (constraint: NamedExpression, state: Value[], next: State) =>
    holdsLikeTlc(
      constraint.expression,
      getContext(environment, state, next),
      (expression) => `${UNEXPECTED_EXCEPTION}${getExpectedBoolean(expression, environment)}`,
    );
  const toRecord = (state: Value[]): Record<string, Value> => {
    const record = Object.fromEntries(
      getTlcOrder().map((index) => [environment.variables[index], state[index]]),
    );
    return view === undefined
      ? record
      : setViewText(record, () => getViewText(view.expression, state));
  };
  runtime.toRecord = toRecord;
  return {
    properties,
    spec,
    toRecord,
    // Deviation from TLC: StatePrinter fingerprints the alias it prints, so a VIEW that fails on the alias's values crashes TLC.
    evaluateAlias: (alias, state, next, isTool) => {
      const getStateRecord = () =>
        toRecord(state.map((value) => value ?? createModelValue("null")));
      try {
        getConfigDefinition("alias", alias, environment);
        const value = evaluate(
          createIdentifier(getRootKey(alias, environment)),
          getContext(environment, state, next),
        );
        const record = toAliasRecord(value);
        return record === undefined ? getStateRecord() : setAliasName(record, alias);
      } catch (error) {
        if (!(error instanceof TlaConfigError || error instanceof TlaEvaluationError)) throw error;
        return { ...getStateRecord(), _ALIASEvalError: formatNestedMessage(error.message, isTool) };
      }
    },
    isSymmetric: symmetryGroup !== undefined,
    isConstrained: constraints.length > 0 || actionConstraints.length > 0,
    getTypedChecks: (liveness) => {
      const isInterpreted =
        coverage !== undefined ||
        possible.length > 0 ||
        config.periodic !== undefined ||
        [...invariants, ...constraints].some((check) => check.scope !== undefined) ||
        actionConstraints.length > 0 ||
        properties.actionProperties.some((property) => property.scope !== undefined) ||
        (properties.liveness.length > 0 && (liveness === undefined || view !== undefined));
      if (isInterpreted || spec.init === undefined || spec.next === undefined) return undefined;
      const invariantExpressions = invariantPredicates.map((invariant) => invariant.predicate);
      const constraintExpressions = [
        ...new Set(constraints.map((constraint) => constraint.predicate)),
      ];
      const initialExpressions = properties.initialPredicates.map(
        (predicate) => predicate.expression,
      );
      const definitions = [...environment.facts.ids.keys()];
      const scopeExpressions = getScopeExpressions(spec.scope);
      // The interpreter evaluates again what the tier evaluated before it fell back. TLC evaluates
      // a constant definition without parameters once as it starts, so one with a startup value
      // never draws again. An operator a scope binds without its expression can reach any
      // definition.
      const isReplayed = (definition: Definition) =>
        getStartupValue(definition, environment) === undefined &&
        isImpureDefinition(definition, environment, "replayed");
      const hasReplayedEffects =
        scopeExpressions === undefined
          ? definitions.some(isReplayed)
          : definitions.some(
              (definition) =>
                !(definition.kind === "Operator" && definition.params.length > 0) &&
                isConstantLevel(definition, environment) &&
                isReplayed(definition),
            ) ||
            isExpressionImpure(
              [
                spec.init,
                spec.next,
                ...invariantExpressions,
                ...constraintExpressions,
                ...initialExpressions,
                ...properties.actionProperties.flatMap((property) => [
                  property.action,
                  property.subscript,
                ]),
                ...(view ? [view.expression] : []),
                ...scopeExpressions,
                ...getLiveExpressions(liveness ?? []),
              ],
              environment,
              "replayed",
            );
      return hasReplayedEffects
        ? undefined
        : {
            init: spec.init,
            next: spec.next,
            scope: spec.scope,
            invariants: invariantExpressions,
            constraints: constraintExpressions,
            holdsInitialPredicates: (state: Value[]) =>
              findFailedInitialPredicate(state) === undefined,
            actionProperties: properties.actionProperties,
            symmetry: symmetryGroup,
            view: view?.expression,
            variableOrder: getTlcOrder(),
            liveness,
          };
    },
    getTlcOrder,
    getStoredFingerprints: (states, fingerprintStates) => {
      if (view !== undefined || isFingerprintedLikeTlc) {
        return BigInt64Array.from(states, getTlcStateFingerprint);
      }
      return getTlcFingerprints(fingerprintStates, getTlcOrder());
    },
    getFingerprintState: (state) => {
      if (isFingerprintedLikeTlc) return [String(getTlcStateFingerprint(state))];
      const representative = getRepresentativeState(state);
      return view === undefined ? representative : [getViewValue(view.expression, representative)];
    },
    findViolatedInvariant: (state, parent) => {
      const violated =
        coverage === undefined
          ? invariants.find((invariant) => isViolated(invariant, state, parent))
          : invariantPredicates.find((predicate) => isPredicateViolated(predicate, state, parent));
      if (violated) violatingStates.add(state);
      return violated;
    },
    forEachViolatedInvariant: (state, onViolated) => {
      for (const predicate of invariantPredicates) {
        if (!isPredicateViolated(predicate, state, undefined)) continue;
        violatingStates.add(state);
        onViolated(predicate);
      }
    },
    checkReplayedInitialState: (state, tracing, addFingerprint, onViolated) => {
      const holdsIn = (
        covered: CoveredCheck | undefined,
        expression: Expression,
        scope: Scope | undefined,
      ) => holdsReplayed(covered, expression, getContext(tracing, state, undefined, scope));
      const isInModel = constraintPredicates.every((constraint) =>
        holdsIn(
          coveredConstraintChecks.get(constraint.predicate),
          constraint.predicate,
          constraint.scope,
        ),
      );
      if (isInModel) addFingerprint();
      for (const invariant of invariantPredicates) {
        const covered = coveredInvariantChecks.get(invariant.predicate);
        if (holdsIn(covered, invariant.predicate, invariant.scope)) continue;
        onViolated({ status: "invariant-violation", name: invariant.name });
      }
      const predicate = properties.initialPredicates.find(
        (check, index) => !holdsIn(coveredInitialPredicates[index], check.expression, check.scope),
      );
      if (predicate) onViolated({ status: "liveness-violation", name: predicate.name });
    },
    checkReplayedSuccessor: (state, next, tracing, addFingerprint) => {
      const isInModel =
        constraintPredicates.every((constraint) =>
          holdsReplayed(
            coveredConstraintChecks.get(constraint.predicate),
            constraint.predicate,
            getContext(tracing, next, undefined, constraint.scope),
          ),
        ) &&
        actionConstraints.every((constraint, index) =>
          holdsReplayed(
            coveredActionConstraints[index],
            constraint.expression,
            getContext(tracing, state, next, constraint.scope),
          ),
        );
      // TLC checks the invariants of a successor it has not seen, even outside the model.
      const isUnseen = isInModel ? addFingerprint() : true;
      return (
        (!isUnseen ||
          invariantPredicates.every((invariant) =>
            holdsReplayed(
              coveredInvariantChecks.get(invariant.predicate),
              invariant.predicate,
              getContext(tracing, next, undefined, invariant.scope),
            ),
          )) &&
        actionProperties.every((property, index) =>
          holdsReplayed(
            coveredActionProperties[index],
            property.box,
            getContext(tracing, state, next, property.scope),
          ),
        )
      );
    },
    satisfiesConstraints: (state, parent) =>
      satisfiesCovered(coveredConstraints, state) ??
      constraints.every(
        (constraint) =>
          isUnchangedFor(constraint, state, parent) ||
          holdsAsConjunct(constraint, getContext(environment, state, undefined)),
      ),
    findFailedInitialPredicate,
    findViolatedActionProperty: (state, next) =>
      actionProperties.find((property, index) => {
        try {
          const value =
            coverage && evaluateCovered(coverage, coveredActionProperties[index], state, next);
          if (typeof value === "boolean") return !value;
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
      satisfiesCovered(coveredActionConstraints, state, next) ??
      actionConstraints.every((constraint) => holdsActionConstraint(constraint, state, next)),
    getExcludingConstraints: (state, next) =>
      [
        ...constraints.filter(
          (constraint) => !holdsAsConjunct(constraint, getContext(environment, next, undefined)),
        ),
        ...actionConstraints.filter(
          (constraint) => !holdsActionConstraint(constraint, state, next),
        ),
      ].map((constraint) => {
        const range = getBodyRange(getRootKey(constraint.name, environment), environment);
        return range ? formatRange(range) : constraint.name;
      }),
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
    getReward: (state, next, fallback) => {
      if (reward === undefined) return fallback;
      const value = evaluate(reward, getContext(environment, state, next));
      if (typeof value !== "number") {
        throw new TlaEvaluationError(getExpectedValue("integer", reward, environment));
      }
      return value;
    },
    findPostconditionViolation: (isAfterViolation = false) => {
      const modulePostconditions = getModuleOperators("postcondition");
      const rejection = config.postconditions
        .map((name) => {
          const definition = getDefinition(getRootKey(name, environment), environment);
          if (!definition) {
            return `The post condition ${name} specified in the configuration file\nis not defined in the specification.`;
          }
          if (definition.kind === "Operator" && definition.params.length > 0) {
            return `TLC requires post condition not to take any argument, but one was given: ${name}`;
          }
          const isConstant =
            !isLiteralDefinition(definition) &&
            getStartupValue(definition, environment) !== undefined;
          return isConstant ? `The post condition ${name} cannot be a constant.` : undefined;
        })
        .find((message) => message !== undefined);
      if (rejection !== undefined) {
        if (isAfterViolation) return undefined;
        throw setExitCode(new TlaEvaluationError(rejection), EXIT_STATUS.configParseError);
      }
      const findViolation = (name: string, key: string) => {
        const failure = getConstantFailure(
          (context) => holdsLikeTlc(createIdentifier(key), context),
          environment,
        );
        if (!failure) return undefined;
        const body = getDefinition(key, environment)?.body;
        const range = getBodyRange(key, environment);
        const location = range
          ? ` at ${body?.kind === "Number" ? describeNode(body) : formatRange(range)}`
          : "";
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
      };
      for (const operator of modulePostconditions) {
        const violation = findViolation(operator.name, operator.key);
        if (violation) return violation;
      }
      const unwitnessed = findUnwitnessedPossible();
      if (unwitnessed) return unwitnessed;
      for (const name of config.postconditions) {
        const violation = findViolation(name, getRootKey(name, environment));
        if (violation) return violation;
      }
      return undefined;
    },
  };
};

export const withNextStateExitCode = (error: unknown) =>
  error instanceof TlaModuleError ? setExitCode(error, error.exitCode) : error;
