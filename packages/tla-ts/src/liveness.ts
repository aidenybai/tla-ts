import {
  getDefinitionExpressions,
  getOpDefBody,
  isLocallyResolved,
  type Bound,
  type Definition,
  type Expression,
  type LetExpression,
  type SourceRange,
} from "./ast";
import { getDefinitionLevel } from "./dependencies";
import {
  createStackOverflowError,
  TlaEvaluationError,
  TlaStackOverflowError,
  UNEXPECTED_EVAL_EXCEPTION,
} from "./errors";
import {
  describeNode,
  describeRange,
  bindDefinitions,
  bindOperatorArguments,
  bindUncachedArguments,
  evaluate,
  forEachBinding,
  forEachBoundElement,
  getBoundElements,
  getBodyLiteral,
  getDefinition,
  getLookupValue,
  getReevaluatedDefinitions,
  getRootKey,
  getStartupValue,
  lookupScope,
  resolveApplyOperator,
  resolveGlobalOperator,
  resolveOperator,
  type Closure,
  type Context,
  type Environment,
  type Scope,
  type Thunk,
} from "./evaluate";
import { getLetDefinition, letDefinitions } from "./coverage";
import {
  getSubstitutedName,
  getSubstitutedOccurrence,
  mapChildren,
  substitutionFrames,
  withSubstitutionFrames,
} from "./instances";
import { getArity, getKeyName } from "./resolve";
import {
  ACTION_LEVEL,
  CONSTANT_LEVEL,
  createBoundScope,
  createLevelAnalyzer,
  TEMPORAL_LEVEL,
  VARIABLE_LEVEL,
} from "./levels";
import { isEnabled } from "./successors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { isEvalException } from "./tlc/messages";
import {
  createBoolean,
  createJunction,
  createPair,
  createUnary,
  getLiveLevel,
  type LiveAction,
  type LiveEnabled,
  type LiveExpression,
  type LiveState,
} from "./tableau";
import { isEqualLikeTlc, type Value } from "./values";

export interface ScopedExpression {
  expression: Expression;
  scope: Scope | undefined;
}

export interface TheoremReference {
  name: string;
  range: SourceRange;
}

interface ExpandedExpression extends ScopedExpression {
  name: string | undefined;
  path: string[];
  frames: Expression[];
  theorem?: TheoremReference;
  // The definition SANY's body names without arguments, whose copy takes the parameters of its instance.
  named?: Definition;
  substitutions: LetExpression[];
}

export interface TemporalProperty extends ScopedExpression {
  name: string;
}

interface ExpandedSubstitutions {
  expression: LetExpression;
  scope: Scope | undefined;
}

interface Expansion {
  name: string | undefined;
  path: string[];
  expanding: Set<Definition>;
  isSubstituted: boolean;
  frames: Expression[];
  substitutions: ExpandedSubstitutions[];
}

const MAXIMUM_EXPANSION_DEPTH = 100;

const isWithinScope = (outer: Scope | undefined, scope: Scope | undefined): boolean =>
  scope !== undefined && (scope === outer || isWithinScope(outer, scope.parent));

export const withExpandedSubstitutions = (
  substitutions: LetExpression[],
  expression: Expression,
  frames: Expression[],
  environment: Environment,
) => {
  const lets = environment.boundSubstitutions.lets;
  const wrapped = substitutions.reduceRight((body: Expression, substitution) => {
    const bound = { ...substitution, body };
    const owner = lets.get(substitution);
    if (owner) lets.set(bound, owner);
    return bound;
  }, expression);
  const framed = withSubstitutionFrames(wrapped, frames);
  const wrappedOwner = lets.get(wrapped);
  if (wrappedOwner) lets.set(framed, wrappedOwner);
  return framed;
};

export const createTautologyError = () =>
  setExitCode(
    new TlaEvaluationError("Temporal formula is a tautology (its negation is unsatisfiable)."),
    EXIT_STATUS.livenessEvaluationFailure,
  );

const TEMPORAL_OPERATORS = new Set(["~>", "-+->"]);

const definitionThunks = new WeakSet<Thunk>();

export const getReferenceName = (
  reference: Expression & { kind: "Identifier" | "Apply" },
  key: string,
  environment: Environment,
) => {
  const written = reference.writtenKey;
  return written === undefined
    ? environment.instanceNames.get(key)
    : (environment.instanceNames.get(written) ?? getDefinition(written, environment)?.name);
};

const recursiveLetBodies = new WeakSet<Expression>();

const JUNCTIONS = new Map<string, "And" | "Or">([
  ["/\\", "And"],
  ["\\/", "Or"],
]);

const getConstantContext = (environment: Environment, scope: Scope | undefined): Context => ({
  environment,
  scope,
  state: undefined,
  next: undefined,
});

const createCannotHandleError = (expression: Expression, inner?: string) =>
  new TlaEvaluationError(
    `TLC cannot handle the temporal formula ${describeRange(expression)}${inner === undefined ? "" : `:\n${inner}`}`,
  );

export const createSanyAnalyzer = (environment: Environment) =>
  createLevelAnalyzer({
    constants: new Map([...environment.constants.keys()].map((key) => [key, 0])),
    variables: new Set(environment.variables),
    getDefinition: (name) => environment.definitions.get(name),
    instances: environment.instances,
    recursiveSections: environment.recursiveSections,
  });

// TLC reads the level SANY gives a node, which counts a formal parameter as a constant whatever its argument.
export const getSanyLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => {
  const bindings: [string, Definition | undefined][] = [];
  for (let node = scope; node; node = node.parent) {
    bindings.unshift([node.name, letDefinitions.get(node)]);
  }
  return createSanyAnalyzer(environment).analyze(expression, createBoundScope(bindings)).level;
};

export const getLevel = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  shadowed = new Set<string>(),
  visiting = new Set<object>(),
  isLevelBound = false,
): number => {
  const getBodyLevel = (binding: object, body: Expression, bodyScope: Scope | undefined) => {
    if (visiting.has(binding)) return CONSTANT_LEVEL;
    visiting.add(binding);
    const level = getLevel(body, bodyScope, environment, new Set(), visiting, isLevelBound);
    if (!isLevelBound) visiting.delete(binding);
    return level;
  };
  const getBindingLevel = (name: string, isArgument: boolean) => {
    const binding = lookupScope(scope, name);
    if (!binding) return undefined;
    if (binding.kind === "Value") return CONSTANT_LEVEL;
    if (binding.kind === "Thunk") {
      return binding.isReleased
        ? CONSTANT_LEVEL
        : getBodyLevel(binding, binding.expression, binding.scope);
    }
    const operator = binding.operator;
    return operator.kind === "Closure" && !(isArgument && operator.params.length > 0)
      ? getBodyLevel(operator, operator.body, operator.scope)
      : CONSTANT_LEVEL;
  };
  const getGlobalLevel = (name: string, isArgument: boolean) => {
    if (environment.variableIndex.has(name)) return VARIABLE_LEVEL;
    if (environment.constants.has(name)) return CONSTANT_LEVEL;
    const definition = getDefinition(name, environment);
    // TLC's getLevelBound counts a theorem's arguments but not its body, and it looks a definition up as the value startup stored for it.
    if (
      definition &&
      isLevelBound &&
      (environment.theorems.has(name) ||
        getStartupValue(definition, environment) !== undefined ||
        (isArgument && getArity(definition) > 0))
    ) {
      return CONSTANT_LEVEL;
    }
    if (definition && isLevelBound) {
      return Math.max(
        ...getDefinitionExpressions(definition).map((item) => getBodyLevel(item, item, undefined)),
      );
    }
    if (definition) return getDefinitionLevel(definition, environment);
    const builtin = environment.builtins.get(environment.substitutions.get(name) ?? name);
    if (!builtin) return undefined;
    if (isArgument && builtin.arity > 0) return CONSTANT_LEVEL;
    if (builtin.isActionLevel) return ACTION_LEVEL;
    return builtin.isStateLevel && !builtin.isLevelConstant ? VARIABLE_LEVEL : CONSTANT_LEVEL;
  };
  const getNameLevel = (name: string, node: Expression) => {
    // TLC's getLevelBound takes any name a root variable shares for that variable.
    if (isLevelBound && environment.variableIndex.has(name)) return VARIABLE_LEVEL;
    if (shadowed.has(name)) return CONSTANT_LEVEL;
    // TLC's getLevelBound takes an operator argument for a constant.
    const isArgument = isLevelBound && node.kind === "Identifier";
    if (isLocallyResolved(node)) {
      return (
        getBindingLevel(name, isArgument) ?? getGlobalLevel(name, isArgument) ?? CONSTANT_LEVEL
      );
    }
    return getGlobalLevel(name, isArgument) ?? getBindingLevel(name, isArgument) ?? CONSTANT_LEVEL;
  };
  const getChildrenLevel = (node: Expression) => {
    let level = CONSTANT_LEVEL;
    mapChildren(node, (child, bound) => {
      level = Math.max(
        level,
        getLevel(
          child,
          scope,
          environment,
          bound.length === 0 ? shadowed : new Set([...shadowed, ...bound]),
          visiting,
          isLevelBound,
        ),
      );
      return child;
    });
    return level;
  };
  switch (expression.kind) {
    case "Prime":
    case "Unchanged":
    case "BoxAction":
    case "AngleAction":
      return ACTION_LEVEL;
    case "Enabled":
    case "EnabledVariable":
      return VARIABLE_LEVEL;
    case "Always":
    case "Eventually":
    case "WeakFairness":
    case "StrongFairness":
      return TEMPORAL_LEVEL;
    case "UnboundedQuantifier":
      return expression.isTemporal ? TEMPORAL_LEVEL : getChildrenLevel(expression);
    // TLC's level bound counts a LET's definitions, though SANY levels a LET by its body.
    case "Let": {
      if (!isLevelBound) {
        return getLevel(
          expression.body,
          bindLetDefinitions(expression, scope, environment),
          environment,
          shadowed,
          visiting,
          isLevelBound,
        );
      }
      const aliases = expression.definitions.filter(
        (definition) => "standardDefinition" in definition,
      );
      if (aliases.length === 0) return getChildrenLevel(expression);
      // TLC's getLevelBound reads a standard operator's TLA+ definition, not the builtin a LET instance's alias forwards to.
      return Math.max(
        getLevel(
          {
            ...expression,
            definitions: expression.definitions.filter(
              (definition) => !("standardDefinition" in definition),
            ),
          },
          scope,
          environment,
          new Set([...shadowed, ...aliases.map((alias) => alias.name)]),
          visiting,
          isLevelBound,
        ),
        ...aliases
          .flatMap((alias) => getDefinitionExpressions(alias.standardDefinition))
          .map((item) => getBodyLevel(item, item, undefined)),
      );
    }
    case "Identifier":
      return getNameLevel(expression.name, expression);
    case "OperatorReference":
      return isLevelBound ? CONSTANT_LEVEL : getNameLevel(expression.operator, expression);
    case "Lambda":
      return isLevelBound ? CONSTANT_LEVEL : getChildrenLevel(expression);
    case "Apply": {
      if (TEMPORAL_OPERATORS.has(expression.operator)) return TEMPORAL_LEVEL;
      if (expression.operator === "\\cdot") return ACTION_LEVEL;
      const operatorLevel = getNameLevel(expression.operator, expression);
      const level = Math.max(operatorLevel, getChildrenLevel(expression));
      const operator = isLocallyResolved(expression)
        ? undefined
        : resolveGlobalOperator(expression.operator, environment);
      if (
        isLevelBound ||
        level === operatorLevel ||
        operator?.kind !== "Closure" ||
        operator.params.length !== expression.args.length ||
        getDefinition(expression.operator, environment)?.isRecursive
      ) {
        return level;
      }
      return getBodyLevel(
        operator,
        operator.body,
        bindOperatorArguments(operator, expression.args, getConstantContext(environment, scope)),
      );
    }
    default:
      return getChildrenLevel(expression);
  }
};

export const getLevelBound = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
) => getLevel(expression, scope, environment, new Set(), new Set(), true);

const getUnrolledElements = (bounds: Bound[], context: Context) => {
  try {
    return getBoundElements(bounds, context);
  } catch (error) {
    if (!(error instanceof TlaEvaluationError)) throw error;
    if (!isEvalException(error)) return undefined;
    throw setExitCode(
      new TlaEvaluationError(`${UNEXPECTED_EVAL_EXCEPTION}${error.message}`),
      EXIT_STATUS.error,
    );
  }
};

export const expandTemporal = (
  expression: Expression,
  scope: Scope | undefined,
  environment: Environment,
  isProperty: boolean,
  expansion: Expansion = {
    name: undefined,
    path: [],
    expanding: new Set(),
    isSubstituted: false,
    frames: [],
    substitutions: [],
  },
): ExpandedExpression[] => {
  const expand = (
    child: Expression,
    childScope: Scope | undefined,
    childName = expansion.name,
    childExpanding = expansion.expanding,
    definition?: Definition,
    substitutions = expansion.substitutions,
  ): ExpandedExpression[] =>
    expandTemporal(child, childScope, environment, isProperty, {
      name: childName,
      path:
        definition?.kind === "Operator" && definition.params.length === 0
          ? [...expansion.path, definition.name]
          : expansion.path,
      expanding: childExpanding,
      isSubstituted:
        expansion.isSubstituted ||
        (definition !== undefined && environment.substitutedDefinitions.has(definition)),
      frames: [
        ...expansion.frames,
        ...(substitutionFrames.get(child) ?? []).filter(
          (frame) => !expansion.frames.includes(frame),
        ),
      ],
      substitutions,
    });
  const getLeaf = (theorem?: TheoremReference, named?: Definition): ExpandedExpression[] => [
    {
      expression,
      scope,
      name: expansion.name,
      path: expansion.path,
      frames: expansion.frames,
      theorem,
      named,
      substitutions: expansion.substitutions.flatMap((item) =>
        isWithinScope(item.scope, scope) ? [item.expression] : [],
      ),
    },
  ];
  // An instanced body reaches the theorem its module named, and a direct reference the one its INSTANCE made.
  const getTheoremReference = (
    reference: Expression & { kind: "Identifier" | "Apply" },
    key: string,
  ): TheoremReference | undefined => {
    const isLocal = isLocallyResolved(reference);
    const letDefinition = isLocal ? getLetDefinition(key, scope) : undefined;
    const range = isLocal
      ? letDefinition?.kind === "Operator" && letDefinition.theoremRange
      : environment.theorems.get(key);
    if (!range) return undefined;
    const written = reference.writtenKey;
    const original = getDefinition(key, environment);
    return {
      name: getReferenceName(reference, key, environment) ?? original?.name ?? getKeyName(key),
      range:
        (written !== undefined && environment.theorems.get(written)) ||
        (expansion.isSubstituted && original?.location.range) ||
        range,
    };
  };
  if (expression.kind === "And") {
    // TLC names a conjunct by its position in SANY's body, which keeps the declaration a substitute replaced.
    return expression.operands.flatMap((operand) =>
      expand(operand, scope, describeRange(getSubstitutedOccurrence(operand) ?? operand)),
    );
  }
  if (expression.kind === "Label") return expand(expression.body, scope);
  if (expression.kind === "Selection") return expand(expression.expression, scope);
  // TLC 1.7.4's SpecProcessor#processConfigSpec and #processConfigProps take a LET whole.
  if (expression.kind === "Let" && environment.runtime.version !== "1.7.4") {
    const bound = bindLetDefinitions(expression, scope, environment);
    const lets = environment.boundSubstitutions.lets;
    const owner = lets.get(expression);
    const impure = owner
      ? getReevaluatedDefinitions(expression.definitions, environment).impure
      : new Set<Definition>();
    const definitions = expression.definitions.filter((definition) => impure.has(definition));
    const substitution = { ...expression, definitions };
    if (owner && definitions.length > 0) lets.set(substitution, owner);
    const substitutions =
      definitions.length > 0
        ? [...expansion.substitutions, { expression: substitution, scope: bound }]
        : expansion.substitutions;
    return expand(expression.body, bound, undefined, undefined, undefined, substitutions);
  }
  if (expression.kind === "Identifier") {
    const isSubstitute = getSubstitutedName(expression) !== undefined;
    // TLC never takes a VARIABLE's substitute apart, and SANY keeps one at most state-level.
    if (isSubstitute && getLevelBound(expression, scope, environment) <= VARIABLE_LEVEL) {
      return getLeaf();
    }
    const binding = isLocallyResolved(expression) ? lookupScope(scope, expression.name) : undefined;
    const theorem = getTheoremReference(expression, expression.name);
    if (theorem) return getLeaf(theorem);
    if (binding?.kind === "Thunk" && !binding.isReleased) {
      if (
        definitionThunks.has(binding) &&
        getBodyLiteral(binding.expression, environment) !== undefined
      ) {
        return getLeaf();
      }
      return expand(
        binding.expression,
        binding.scope,
        definitionThunks.has(binding) && !isSubstitute
          ? (getReferenceName(expression, expression.name, environment) ?? expression.name)
          : expansion.name,
      );
    }
    const operator = binding?.kind === "Operator" ? binding.operator : undefined;
    if (operator?.kind === "Closure" && operator.params.length === 0) {
      return expand(operator.body, operator.scope, isSubstitute ? expansion.name : expression.name);
    }
    const definition = environment.constants.has(expression.name)
      ? undefined
      : getDefinition(expression.name, environment);
    // A name the configuration file substitutes looks up the target's definition, not the value processConstantDefns stored for it.
    const isConfigSubstitute = environment.substitutions.has(expression.name);
    if (
      !binding &&
      (definition?.kind === "Function" ||
        (definition?.kind === "Operator" && definition.params.length === 0)) &&
      (isConfigSubstitute || getLookupValue(definition, environment) === undefined)
    ) {
      if (expansion.expanding.has(definition)) {
        throw createStackOverflowError();
      }
      // SpecProcessor#processConfigSpec takes a state-level definition whole as an initial predicate.
      if (
        !isProperty &&
        definition.kind === "Operator" &&
        getLevelBound(definition.body, undefined, environment) === VARIABLE_LEVEL
      ) {
        return getLeaf();
      }
      return expand(
        getOpDefBody(definition),
        undefined,
        getReferenceName(expression, expression.name, environment) ??
          (isConfigSubstitute ? getKeyName(expression.name) : definition.name),
        new Set([...expansion.expanding, definition]),
        definition,
      );
    }
  }
  // A parameterized INSTANCE passes its parameters to each theorem it copies, which SANY's body names with none.
  if (expression.kind === "Apply" && expression.writtenKey !== undefined) {
    const theorem = getTheoremReference(expression, expression.operator);
    if (theorem) return getLeaf(theorem);
  }
  const context = getConstantContext(environment, scope);
  // SpecProcessor#processConfigSpec and #processConfigProps take apart an application of a parameterized definition whatever its level.
  if (expression.kind === "Apply" && environment.runtime.version !== "1.7.4") {
    const operator = resolveApplyOperator(expression, context);
    const definition = isLocallyResolved(expression)
      ? undefined
      : getDefinition(expression.operator, environment);
    // SANY sets getInRecursive only on the definition a RECURSIVE declaration names, and an INSTANCE's copy is a new one, which a LET reaches through its instance's `!`.
    const isRecursive = definition
      ? definition.isRecursive && !environment.substitutedDefinitions.has(definition)
      : isLocallyResolved(expression) &&
        getLetDefinition(expression.operator, scope)?.isRecursive === true &&
        !expression.operator.includes("!");
    const isOwnArgumentFree =
      operator?.kind === "Closure" &&
      operator.params.every((param) => environment.instanceParams.has(param));
    const isExpandable =
      operator?.kind === "Closure" &&
      operator.params.length === expression.args.length &&
      !isRecursive &&
      (!expansion.isSubstituted || isOwnArgumentFree);
    if (isExpandable) {
      // Inside an instance, SANY's body names a definition without parameters, whose copy takes the instance's.
      const isNamed = expansion.isSubstituted && isOwnArgumentFree;
      if (isNamed && definition && getLookupValue(definition, environment) !== undefined) {
        return getLeaf(undefined, definition);
      }
      const bound = bindUncachedArguments(operator, expression.args, context);
      if (
        !isProperty &&
        isNamed &&
        getLevelBound(operator.body, bound, environment) === VARIABLE_LEVEL
      ) {
        return getLeaf();
      }
      return expand(
        operator.body,
        bound,
        getReferenceName(expression, expression.operator, environment) ??
          (expansion.isSubstituted && definition
            ? definition.name
            : getKeyName(expression.operator)),
        expansion.expanding,
        definition,
      );
    }
  }
  const isUnrolled =
    isProperty &&
    environment.runtime.version !== "1.7.4" &&
    expression.kind === "Forall" &&
    expression.bounds.every((bound) => getLevel(bound.set, scope, environment) === CONSTANT_LEVEL);
  const sets = isUnrolled ? getUnrolledElements(expression.bounds, context) : undefined;
  if (isUnrolled && sets) {
    const expanded: ExpandedExpression[] = [];
    forEachBoundElement(expression.bounds, sets, scope, (boundScope) => {
      expanded.push(
        ...expand(
          expression.body,
          boundScope,
          describeRange(getSubstitutedOccurrence(expression.body) ?? expression.body),
        ),
      );
      return false;
    });
    if (expanded.length === 0) throw createTautologyError();
    return expanded;
  }
  return getLeaf();
};

// TLC takes a formula apart through a LET without binding its definitions, so it evaluates an impure one again at each reference.
export const bindLetDefinitions = (
  expression: Expression & { kind: "Let" },
  scope: Scope | undefined,
  environment: Environment,
) => {
  const bound = bindDefinitions(
    expression.definitions,
    getConstantContext(environment, scope),
    getReevaluatedDefinitions(expression.definitions, environment),
  );
  for (let current = bound; current && current !== scope; current = current.parent) {
    if (current.binding.kind === "Thunk") definitionThunks.add(current.binding);
    const name = current.name;
    const definition = expression.definitions.find((item) => item.name === name);
    if (definition) letDefinitions.set(current, definition);
    if (definition?.isRecursive) recursiveLetBodies.add(definition.body);
  }
  return bound;
};

const isRecursiveClosure = (operator: Closure, environment: Environment) => {
  if (recursiveLetBodies.has(operator.body)) return true;
  const definition = getDefinition(getRootKey(operator.name, environment), environment);
  return definition?.body === operator.body && definition.isRecursive;
};

export const toLiveExpression = (
  root: Expression,
  rootScope: Scope | undefined,
  environment: Environment,
): LiveExpression => {
  const is174 = environment.runtime.version === "1.7.4";
  const toAtom = (
    expression: Expression,
    scope: Scope | undefined,
    level: number,
  ): LiveExpression => {
    const atomLevel =
      level === CONSTANT_LEVEL && !is174 ? getLevelBound(expression, scope, environment) : level;
    if (atomLevel === CONSTANT_LEVEL) {
      const value = evaluate(expression, getConstantContext(environment, scope));
      if (typeof value !== "boolean") {
        throw new TlaEvaluationError(
          `TLC expected a boolean value, but did not find one. ${describeNode(expression)}`,
        );
      }
      return createBoolean(value);
    }
    if (atomLevel === VARIABLE_LEVEL) return { kind: "State", expression, scope };
    if (expression.kind === "AngleAction") {
      return {
        kind: "Action",
        expression: expression.action,
        subscript: expression.subscript,
        scope,
      };
    }
    return { kind: "Action", expression, subscript: undefined, scope };
  };

  let expansionDepth = 0;

  const expand = (
    body: Expression,
    bodyScope: Scope | undefined,
    expression: Expression,
    scope: Scope | undefined,
  ) => {
    if (expansionDepth >= MAXIMUM_EXPANSION_DEPTH) {
      throw createStackOverflowError();
    }
    expansionDepth++;
    const result = convert(body, bodyScope);
    expansionDepth--;
    const level = getLiveLevel(result);
    // Deviation from TLC: Liveness#astToLive takes a temporal call with a constant body for an action, which classifyExpr rejects.
    const isConstantTemporal =
      level === CONSTANT_LEVEL && getLevel(expression, scope, environment) > ACTION_LEVEL;
    return level > ACTION_LEVEL || isConstantTemporal ? result : toAtom(expression, scope, level);
  };

  const convertCall = (
    expression: Expression & { kind: "Identifier" | "Apply" },
    scope: Scope | undefined,
  ) => {
    const name = expression.kind === "Identifier" ? expression.name : expression.operator;
    const context = getConstantContext(environment, scope);
    const binding =
      isLocallyResolved(expression) || getDefinition(name, environment) === undefined
        ? lookupScope(scope, name)
        : undefined;
    if (binding?.kind === "Thunk" && !binding.isReleased && definitionThunks.has(binding)) {
      return expandCall(expression, scope, () =>
        expand(binding.expression, binding.scope, expression, scope),
      );
    }
    const definition = binding ? undefined : getDefinition(name, environment);
    if (definition && getStartupValue(definition, environment) !== undefined) {
      return toCallAtom(expression, scope);
    }
    const operator =
      binding?.kind === "Operator"
        ? binding.operator
        : binding
          ? undefined
          : isLocallyResolved(expression)
            ? resolveOperator(name, context)
            : resolveGlobalOperator(name, environment);
    const args = expression.kind === "Apply" ? expression.args : [];
    const junction =
      operator?.kind === "Builtin" && args.length === 2 ? JUNCTIONS.get(operator.name) : undefined;
    if (junction) {
      const operands = args.map((arg) => convert(arg, scope));
      return toWhole(expression, scope, createJunction(junction, operands));
    }
    if (operator?.kind !== "Closure") return toCallAtom(expression, scope);
    const isRecursive = isRecursiveClosure(operator, environment);
    if (isRecursive && !is174 && getLevelBound(expression, scope, environment) <= ACTION_LEVEL) {
      return toCallAtom(expression, scope);
    }
    return expandCall(
      expression,
      scope,
      () => {
        // TLC 1.7.4 evaluates the arguments of an operator it expands.
        if (is174) {
          args
            .filter((arg) => arg.kind !== "Lambda" && arg.kind !== "OperatorReference")
            .forEach((arg) => evaluate(arg, context));
        }
        return expand(
          operator.body,
          bindUncachedArguments(operator, args, context),
          expression,
          scope,
        );
      },
      isRecursive,
    );
  };

  const toCallAtom = (expression: Expression, scope: Scope | undefined) => {
    const level = getLevel(expression, scope, environment);
    if (level > ACTION_LEVEL) throw createCannotHandleError(expression);
    return toAtom(expression, scope, level);
  };

  const expandCall = (
    expression: Expression,
    scope: Scope | undefined,
    expandBody: () => LiveExpression,
    isRecursive = false,
  ) => {
    try {
      return expandBody();
    } catch (error) {
      const isRethrown = error instanceof TlaStackOverflowError || (isRecursive && !is174);
      if (!(error instanceof TlaEvaluationError) || isRethrown) throw error;
      return toCallAtom(expression, scope);
    }
  };

  const convertQuantifier = (
    expression: Expression & { kind: "Forall" | "Exists" },
    scope: Scope | undefined,
  ) => {
    const level = getLevel(expression, scope, environment);
    const operands: LiveExpression[] = [];
    const isForall = expression.kind === "Forall";
    try {
      forEachBinding(expression.bounds, getConstantContext(environment, scope), (boundScope) => {
        operands.push(convert(expression.body, boundScope));
        return false;
      });
    } catch (error) {
      if (!(error instanceof TlaEvaluationError) || error instanceof TlaStackOverflowError) {
        throw error;
      }
      if (level <= ACTION_LEVEL) return toAtom(expression, scope, level);
      throw createCannotHandleError(
        expression,
        isForall && !isEvalException(error) ? error.message : undefined,
      );
    }
    if (operands.length === 0) return createBoolean(isForall);
    return toWhole(expression, scope, createJunction(isForall ? "And" : "Or", operands));
  };

  const toWhole = (expression: Expression, scope: Scope | undefined, parts: LiveExpression) => {
    const level = getLiveLevel(parts);
    return level > ACTION_LEVEL ? parts : toAtom(expression, scope, level);
  };

  // SANY parses `a /\ b /\ c` as `(a /\ b) /\ c`, so TLC takes a prefix below the temporal level as one formula.
  const convertJunction = (
    expression: Expression & { kind: "And" | "Or" },
    scope: Scope | undefined,
  ) => {
    const operands = expression.operands;
    const range = expression.location.range;
    const prefixEnds = expression.prefixEnds;
    if (expression.isBulleted || !range || !prefixEnds) {
      return toWhole(
        expression,
        scope,
        createJunction(
          expression.kind,
          operands.map((operand) => convert(operand, scope)),
        ),
      );
    }
    return operands.slice(1).reduce(
      (prefix, operand, index) => {
        const node =
          index === operands.length - 2
            ? expression
            : {
                ...expression,
                operands: operands.slice(0, index + 2),
                prefixEnds: prefixEnds.slice(0, index + 1),
                location: { ...expression.location, range: { ...range, end: prefixEnds[index] } },
              };
        return toWhole(
          node,
          scope,
          createJunction(expression.kind, [prefix, convert(operand, scope)]),
        );
      },
      convert(operands[0], scope),
    );
  };

  // These forms and calls are translated part by part at every level, so TLC evaluates a constant part of a called definition at startup; any other form below the temporal level is an atom.
  const convert = (expression: Expression, scope: Scope | undefined): LiveExpression => {
    const level = getLevel(expression, scope, environment);
    switch (expression.kind) {
      case "Label":
        return convert(expression.body, scope);
      case "Selection":
        return convert(expression.expression, scope);
      case "Let":
        return convert(expression.body, bindLetDefinitions(expression, scope, environment));
      case "Apply": {
        const args = expression.args;
        if (expression.operator === "~" && !isLocallyResolved(expression)) {
          return toWhole(expression, scope, createUnary("Not", convert(args[0], scope)));
        }
        if (expression.operator === "=>") {
          return toWhole(
            expression,
            scope,
            createPair("Or", createUnary("Not", convert(args[0], scope)), convert(args[1], scope)),
          );
        }
        break;
      }
      case "And":
      case "Or":
        return convertJunction(expression, scope);
      case "Forall":
      case "Exists":
        return convertQuantifier(expression, scope);
      case "If": {
        if (!is174 && getLevel(expression.condition, scope, environment) === CONSTANT_LEVEL) {
          const condition = evaluate(expression.condition, getConstantContext(environment, scope));
          if (typeof condition === "boolean") {
            return convert(condition ? expression.consequent : expression.alternative, scope);
          }
        }
        const condition = convert(expression.condition, scope);
        return toWhole(
          expression,
          scope,
          createPair(
            "Or",
            createPair("And", condition, convert(expression.consequent, scope)),
            createPair(
              "And",
              createUnary("Not", condition),
              convert(expression.alternative, scope),
            ),
          ),
        );
      }
    }
    if (level <= ACTION_LEVEL) {
      return expression.kind === "Identifier" || expression.kind === "Apply"
        ? convertCall(expression, scope)
        : toAtom(expression, scope, level);
    }
    switch (expression.kind) {
      case "Identifier":
        return convertCall(expression, scope);
      case "Apply":
        return expression.operator === "~>"
          ? createUnary(
              "Always",
              createPair(
                "Or",
                createUnary("Not", convert(expression.args[0], scope)),
                createUnary("Eventually", convert(expression.args[1], scope)),
              ),
            )
          : convertCall(expression, scope);
      case "Always":
      case "Eventually":
        return createUnary(expression.kind, convert(expression.expression, scope));
      case "WeakFairness":
      case "StrongFairness": {
        const step: Expression = {
          kind: "AngleAction",
          action: expression.action,
          subscript: expression.subscript,
          location: expression.action.location,
        };
        const enabled: LiveEnabled = { kind: "Enabled", step: expression.enabled ?? step, scope };
        const disabled = createUnary("Not", enabled);
        const taken: LiveExpression = {
          kind: "Action",
          expression: expression.action,
          subscript: expression.subscript,
          scope,
          enabled,
        };
        if (expression.kind === "WeakFairness") {
          return createUnary(
            "Always",
            createUnary("Eventually", createPair("Or", disabled, taken)),
          );
        }
        return createPair(
          "Or",
          createUnary("Eventually", createUnary("Always", disabled)),
          createUnary("Always", createUnary("Eventually", taken)),
        );
      }
      default:
        throw createCannotHandleError(expression);
    }
  };

  return convert(root, rootScope);
};

// Evaluates the atoms of a formula, which the interpreter and the typed tier evaluate differently.
export interface LiveAtoms<State> {
  holdsState: (atom: LiveState | LiveEnabled, state: State) => boolean;
  holdsAction: (atom: LiveAction, state: State, next: State) => boolean;
}

export const getInterpretedAtoms = (environment: Environment): LiveAtoms<Value[]> => ({
  holdsState: (atom, state) => {
    const context = { environment, scope: atom.scope, state, next: undefined };
    const value =
      atom.kind === "State" ? evaluate(atom.expression, context) : isEnabled(atom.step, context);
    if (typeof value !== "boolean") {
      throw new TlaEvaluationError("A state predicate was evaluated to a non-boolean value.");
    }
    return value;
  },
  holdsAction: (atom, state, next) => {
    const scope = atom.scope;
    const subscript = atom.subscript;
    if (
      subscript &&
      isEqualLikeTlc(
        evaluate(subscript, { environment, scope, state, next: undefined }),
        evaluate(subscript, { environment, scope, state: next, next: undefined }),
      )
    )
      return false;
    const value = evaluate(atom.expression, { environment, scope, state, next });
    if (typeof value !== "boolean") {
      throw new TlaEvaluationError("Encountered an action predicate that's not a boolean.");
    }
    return value;
  },
});

export const evaluateLive = <State>(
  expression: LiveExpression,
  state: State,
  next: State | undefined,
  atoms: LiveAtoms<State>,
  stateCache: Map<LiveExpression, boolean>,
): boolean => {
  const recurse = (operand: LiveExpression) =>
    evaluateLive(operand, state, next, atoms, stateCache);
  switch (expression.kind) {
    case "Boolean":
      return expression.value;
    case "State":
    case "Enabled": {
      const cached = stateCache.get(expression);
      if (cached !== undefined) return cached;
      const value = atoms.holdsState(expression, state);
      stateCache.set(expression, value);
      return value;
    }
    case "Action":
      if (expression.enabled && stateCache.get(expression.enabled) === false) return false;
      return next !== undefined && atoms.holdsAction(expression, state, next);
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every(recurse);
    case "Or":
      return expression.operands.some(recurse);
    case "Next":
      return evaluateLive(expression.body, next ?? state, undefined, atoms, new Map());
    case "Always":
    case "Eventually":
      throw new TlaEvaluationError("TLC cannot evaluate a temporal formula in a single step");
  }
};

export const evaluateOnLasso = (
  expression: LiveExpression,
  path: Value[][],
  cycleStart: number,
  position: number,
  environment: Environment,
): boolean => {
  const getNext = (index: number) => (index + 1 < path.length ? index + 1 : cycleStart);
  const getFuture = (index: number) =>
    path.map((_state, offset) => offset).filter((offset) => offset >= Math.min(index, cycleStart));
  const recurse = (operand: LiveExpression, index = position) =>
    evaluateOnLasso(operand, path, cycleStart, index, environment);
  switch (expression.kind) {
    case "Not":
      return !recurse(expression.body);
    case "And":
      return expression.operands.every((operand) => recurse(operand));
    case "Or":
      return expression.operands.some((operand) => recurse(operand));
    case "Next":
      return recurse(expression.body, getNext(position));
    case "Always":
      return getFuture(position).every((index) => recurse(expression.body, index));
    case "Eventually":
      return getFuture(position).some((index) => recurse(expression.body, index));
    default:
      return evaluateLive(
        expression,
        path[position],
        path[getNext(position)],
        getInterpretedAtoms(environment),
        new Map(),
      );
  }
};
